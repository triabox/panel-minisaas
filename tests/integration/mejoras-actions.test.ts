/**
 * Módulo "mejoras" — roadmap. Habilitación por primer pago, entrega, y el
 * cálculo de "a quién le toca".
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

const { crearMejora, marcarMejoraEntregada, eliminarMejora } = await import(
  "@/modules/mejoras/actions"
);
const { obtenerRoadmap, listarMejorasConActor } = await import(
  "@/modules/mejoras/service"
);

const ACTOR = { usuarioId: null, roles: ["super_admin"] };

describe("Módulo mejoras (roadmap)", () => {
  const prisma = getTestPrisma();
  let clienteConPago: string;
  let clienteSinPago: string;

  beforeAll(async () => {
    await resetTestDb();
    await seedTestEssentials();
  });

  afterAll(async () => {
    await resetTestDb();
  });

  beforeEach(async () => {
    sessionMock.current = { id: "test-user", roles: ["operador"] };
    await prisma.mejora.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.configuracionCapacidad.deleteMany();
    await prisma.configuracionCapacidad.create({
      data: { id: "singleton", horasSoporteMes: 120, clientesObjetivo: 60 },
    });
    const conPago = await prisma.cliente.create({
      data: {
        negocio: "Ya Pagó",
        fechaAlta: new Date("2026-01-01"),
        fechaPrimerPago: new Date("2026-02-01"),
      },
    });
    const sinPago = await prisma.cliente.create({
      data: { negocio: "No Pagó", fechaAlta: new Date("2026-01-01") },
    });
    clienteConPago = conPago.id;
    clienteSinPago = sinPago.id;
  });

  it("nace habilitada si el cliente ya registró el primer pago", async () => {
    const res = await crearMejora({
      clienteId: clienteConPago,
      titulo: "Reporte mensual",
    });
    expect(res.ok).toBe(true);
    const lista = await listarMejorasConActor(ACTOR);
    expect(lista[0]!.estado).toBe("habilitada");
  });

  it("nace pendiente si el cliente todavía no pagó", async () => {
    const res = await crearMejora({
      clienteId: clienteSinPago,
      titulo: "Export CSV",
    });
    expect(res.ok).toBe(true);
    const lista = await listarMejorasConActor(ACTOR);
    expect(lista[0]!.estado).toBe("pendiente");
  });

  it("el roadmap marca 'le toca' al cliente que pagó y nunca recibió mejora", async () => {
    const roadmap = await obtenerRoadmap(ACTOR);
    // Solo los clientes con fechaPrimerPago entran al roadmap.
    expect(roadmap).toHaveLength(1);
    expect(roadmap[0]!.negocio).toBe("Ya Pagó");
    expect(roadmap[0]!.leToca).toBe(true);
    expect(roadmap[0]!.entregadas).toBe(0);
  });

  it("marcar entregada setea estado y fecha", async () => {
    const creada = await crearMejora({
      clienteId: clienteConPago,
      titulo: "Algo",
    });
    if (!creada.ok) throw new Error("setup");
    const res = await marcarMejoraEntregada(creada.data.id);
    expect(res.ok).toBe(true);

    const m = await prisma.mejora.findUnique({ where: { id: creada.data.id } });
    expect(m?.estado).toBe("entregada");
    expect(m?.fechaEntrega).not.toBeNull();
  });

  it("eliminar exige rol de gestión", async () => {
    const creada = await crearMejora({
      clienteId: clienteConPago,
      titulo: "Borrable",
    });
    if (!creada.ok) throw new Error("setup");

    const negado = await eliminarMejora(creada.data.id);
    expect(negado.ok).toBe(false);

    sessionMock.current = { id: "test-user", roles: ["admin"] };
    const ok = await eliminarMejora(creada.data.id);
    expect(ok.ok).toBe(true);
  });

  it("observador no puede crear mejoras", async () => {
    sessionMock.current = { id: "test-user", roles: ["observador"] };
    await expect(
      crearMejora({ clienteId: clienteConPago, titulo: "No" }),
    ).rejects.toThrow(/permiso/i);
  });
});
