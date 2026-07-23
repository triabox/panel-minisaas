/**
 * Módulo "clientes" — patrón entidad del Panel MiniSaaS.
 * Cubre CRUD, cambio de estado (baja lógica), permisos y el RIESGO derivado
 * (pago demorado / exceso de horas del mes contra el umbral).
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
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  cambiarEstadoCliente,
  eliminarCliente,
  buscarClientes,
} = await import("@/modules/clientes/actions");

const baseCliente = {
  fechaAlta: "2026-07-01",
  abonoMensual: 100,
  moneda: "USD",
  estado: "activo",
  estadoPago: "al_dia",
};

describe("Módulo clientes (patrón entidad + riesgo)", () => {
  const prisma = getTestPrisma();

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
    await prisma.rubro.deleteMany();
    await prisma.configuracionCapacidad.deleteMany();
    // Umbral por defecto = 120 / 60 = 2 h/cliente/mes.
    await prisma.configuracionCapacidad.create({
      data: { id: "singleton", horasSoporteMes: 120, clientesObjetivo: 60 },
    });
  });

  it("crea un cliente y lo devuelve en el listado", async () => {
    const res = await crearCliente({ ...baseCliente, negocio: "Panadería Norte" });
    expect(res.ok).toBe(true);

    const lista = await listarClientes();
    expect(lista).toHaveLength(1);
    expect(lista[0]!.negocio).toBe("Panadería Norte");
    expect(lista[0]!.enRiesgo).toBe(false);
    expect(lista[0]!.umbralHorasCliente).toBeCloseTo(2);
  });

  it("normaliza opcionales vacíos a null/ausente", async () => {
    const res = await crearCliente({
      ...baseCliente,
      negocio: "Sin Contacto",
      contactoEmail: "",
      sistema: "",
    });
    expect(res.ok).toBe(true);
    const detalle = await obtenerCliente((await listarClientes())[0]!.id);
    expect(detalle?.contactoEmail).toBeNull();
  });

  it("enciende riesgo cuando el pago está demorado", async () => {
    await crearCliente({
      ...baseCliente,
      negocio: "Moroso SA",
      estadoPago: "demorado",
    });
    const lista = await listarClientes();
    expect(lista[0]!.enRiesgo).toBe(true);
    expect(lista[0]!.motivosRiesgo.join()).toMatch(/demorado/i);
  });

  it("enciende riesgo cuando se pasa del umbral de horas del mes", async () => {
    const creado = await crearCliente({ ...baseCliente, negocio: "Devora Horas" });
    if (!creado.ok) throw new Error("setup");

    // 3 horas-hombre este mes > umbral 2.
    await prisma.ticket.create({
      data: { clienteId: creado.data.id, tipo: "feature", horasHombre: 3 },
    });

    const lista = await listarClientes();
    expect(lista[0]!.horasMes).toBeCloseTo(3);
    expect(lista[0]!.enRiesgo).toBe(true);
    expect(lista[0]!.motivosRiesgo.join()).toMatch(/umbral/i);
  });

  it("actualiza datos del cliente", async () => {
    const creado = await crearCliente({ ...baseCliente, negocio: "Cliente A" });
    if (!creado.ok) throw new Error("setup");

    const res = await actualizarCliente(creado.data.id, {
      ...baseCliente,
      negocio: "Cliente A2",
      abonoMensual: 150,
    });
    expect(res.ok).toBe(true);

    const detalle = await obtenerCliente(creado.data.id);
    expect(detalle?.negocio).toBe("Cliente A2");
    expect(detalle?.abonoMensual).toBe(150);
  });

  it("da de baja (lógica) sin borrar el historial", async () => {
    const creado = await crearCliente({ ...baseCliente, negocio: "A Pausar" });
    if (!creado.ok) throw new Error("setup");
    await prisma.ticket.create({
      data: { clienteId: creado.data.id, tipo: "bug", horasHombre: 1 },
    });

    const res = await cambiarEstadoCliente(creado.data.id, { estado: "baja" });
    expect(res.ok && res.data.estado).toBe("baja");
    // El historial sigue vivo.
    expect(await prisma.ticket.count()).toBe(1);
  });

  it("buscarClientes filtra por texto y excluye bajas", async () => {
    await crearCliente({ ...baseCliente, negocio: "Café Central" });
    await crearCliente({
      ...baseCliente,
      negocio: "Café del Sur",
      estado: "baja",
    });

    const res = await buscarClientes("café");
    expect(res).toHaveLength(1);
    expect(res[0]!.label).toBe("Café Central");
  });

  it("eliminar exige rol de gestión (operador no puede)", async () => {
    const creado = await crearCliente({ ...baseCliente, negocio: "Borrable" });
    if (!creado.ok) throw new Error("setup");

    const negado = await eliminarCliente(creado.data.id);
    expect(negado.ok).toBe(false);

    sessionMock.current = { id: "test-user", roles: ["admin"] };
    const ok = await eliminarCliente(creado.data.id);
    expect(ok.ok).toBe(true);
    expect(await prisma.cliente.count()).toBe(0);
  });

  it("observador no puede crear", async () => {
    sessionMock.current = { id: "test-user", roles: ["observador"] };
    await expect(
      crearCliente({ ...baseCliente, negocio: "No" }),
    ).rejects.toThrow(/permiso/i);
  });
});
