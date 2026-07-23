/**
 * Módulo de ejemplo "clientes" — patrón entidad:
 * CRUD + etiquetas N-a-N + permisos por nivel (operar vs. gestionar).
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
  toggleClienteActivo,
  eliminarCliente,
} = await import("@/modules/clientes/actions");

describe("Módulo clientes (patrón entidad)", () => {
  const prisma = getTestPrisma();
  let etiquetaId: string;

  beforeAll(async () => {
    await resetTestDb();
    await seedTestEssentials();
  });

  afterAll(async () => {
    await resetTestDb();
  });

  beforeEach(async () => {
    sessionMock.current = { id: "test-user", roles: ["operador"] };
    await prisma.clienteEtiqueta.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.etiqueta.deleteMany();
    const etiqueta = await prisma.etiqueta.create({
      data: { codigo: "vip", nombre: "VIP" },
    });
    etiquetaId = etiqueta.id;
  });

  it("crea con etiquetas y las devuelve en el listado", async () => {
    const res = await crearCliente({
      nombre: "Panadería Norte",
      email: "norte@mail.com",
      etiquetasIds: [etiquetaId],
    });
    expect(res.ok).toBe(true);

    const lista = await listarClientes();
    expect(lista).toHaveLength(1);
    expect(lista[0]!.etiquetas.map((e) => e.nombre)).toEqual(["VIP"]);
  });

  it("normaliza opcionales vacíos a null/ausente", async () => {
    const res = await crearCliente({
      nombre: "Sin Contacto",
      email: "",
      telefono: "",
      etiquetasIds: [],
    });
    expect(res.ok).toBe(true);
    const lista = await listarClientes();
    expect(lista[0]!.email).toBeNull();
  });

  it("actualiza datos y reemplaza las etiquetas", async () => {
    const creado = await crearCliente({
      nombre: "Cliente A",
      etiquetasIds: [etiquetaId],
    });
    if (!creado.ok) throw new Error("setup");

    const otra = await prisma.etiqueta.create({
      data: { codigo: "nuevo", nombre: "Nuevo" },
    });
    const res = await actualizarCliente(creado.data.id, {
      nombre: "Cliente A2",
      etiquetasIds: [otra.id],
    });
    expect(res.ok).toBe(true);

    const detalle = await obtenerCliente(creado.data.id);
    expect(detalle?.nombre).toBe("Cliente A2");
    expect(detalle?.etiquetasIds).toEqual([otra.id]);
  });

  it("toggle activa/desactiva", async () => {
    const creado = await crearCliente({ nombre: "Toggle", etiquetasIds: [] });
    if (!creado.ok) throw new Error("setup");

    const res = await toggleClienteActivo(creado.data.id);
    expect(res.ok && !res.data.activo).toBe(true);
  });

  it("eliminar exige rol de gestión (operador no puede)", async () => {
    const creado = await crearCliente({ nombre: "Borrable", etiquetasIds: [] });
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
      crearCliente({ nombre: "No", etiquetasIds: [] }),
    ).rejects.toThrow(/permiso/i);
  });
});
