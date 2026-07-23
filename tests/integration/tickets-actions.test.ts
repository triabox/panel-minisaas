/**
 * Módulo "tickets" — el corazón del panel. Carga de horas con permisos y
 * auditoría; alimenta las métricas de riesgo y de salud del negocio.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getTestPrisma, resetTestDb, seedTestEssentials } from "../helpers/db";

const sessionMock = vi.hoisted(() => ({
  current: null as null | { id: string; roles: string[] },
}));

vi.mock("@/core/auth", () => ({
  auth: async () =>
    sessionMock.current
      ? {
          user: {
            id: sessionMock.current.id,
            email: "test@misistema.local",
            name: "Test",
            roles: sessionMock.current.roles,
          },
        }
      : null,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const {
  listarTickets,
  obtenerTicket,
  crearTicket,
  actualizarTicket,
  eliminarTicket,
} = await import("@/modules/tickets/actions");

describe("Módulo tickets (registro de horas)", () => {
  const prisma = getTestPrisma();
  let clienteId: string;

  beforeAll(async () => {
    await resetTestDb();
    await seedTestEssentials();
  });

  afterAll(async () => {
    await resetTestDb();
  });

  beforeEach(async () => {
    sessionMock.current = { id: "test-user", roles: ["operador"] };
    await prisma.ticket.deleteMany();
    await prisma.cliente.deleteMany();
    const cliente = await prisma.cliente.create({
      data: { negocio: "Cliente Test", fechaAlta: new Date("2026-07-01") },
    });
    clienteId = cliente.id;
  });

  it("carga un ticket y lo devuelve en el listado", async () => {
    const res = await crearTicket({
      clienteId,
      tipo: "bug",
      horasHombre: 1.5,
      tiempoIa: 0.5,
      automatizado: true,
    });
    expect(res.ok).toBe(true);

    const lista = await listarTickets();
    expect(lista).toHaveLength(1);
    expect(lista[0]!.clienteNegocio).toBe("Cliente Test");
    expect(lista[0]!.horasHombre).toBe(1.5);
    expect(lista[0]!.automatizado).toBe(true);
  });

  it("rechaza un ticket con cliente inexistente", async () => {
    const res = await crearTicket({
      clienteId: "no-existe",
      tipo: "consulta",
      horasHombre: 1,
      tiempoIa: 0,
    });
    expect(res.ok).toBe(false);
  });

  it("valida las horas (no numéricas → error de campo)", async () => {
    const res = await crearTicket({
      clienteId,
      tipo: "consulta",
      horasHombre: "abc",
      tiempoIa: 0,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.campos?.horasHombre).toBeTruthy();
  });

  it("actualiza un ticket", async () => {
    const creado = await crearTicket({
      clienteId,
      tipo: "ajuste",
      horasHombre: 1,
      tiempoIa: 0,
    });
    if (!creado.ok) throw new Error("setup");

    const res = await actualizarTicket(creado.data.id, {
      clienteId,
      tipo: "feature",
      horasHombre: 6,
      tiempoIa: 1,
    });
    expect(res.ok).toBe(true);

    const detalle = await obtenerTicket(creado.data.id);
    expect(detalle?.tipo).toBe("feature");
    expect(detalle?.horasHombre).toBe(6);
  });

  it("eliminar exige rol de gestión (operador no puede)", async () => {
    const creado = await crearTicket({
      clienteId,
      tipo: "bug",
      horasHombre: 1,
      tiempoIa: 0,
    });
    if (!creado.ok) throw new Error("setup");

    const negado = await eliminarTicket(creado.data.id);
    expect(negado.ok).toBe(false);

    sessionMock.current = { id: "test-user", roles: ["admin"] };
    const ok = await eliminarTicket(creado.data.id);
    expect(ok.ok).toBe(true);
    expect(await prisma.ticket.count()).toBe(0);
  });

  it("observador no puede cargar horas", async () => {
    sessionMock.current = { id: "test-user", roles: ["observador"] };
    await expect(
      crearTicket({ clienteId, tipo: "bug", horasHombre: 1, tiempoIa: 0 }),
    ).rejects.toThrow(/permiso/i);
  });
});
