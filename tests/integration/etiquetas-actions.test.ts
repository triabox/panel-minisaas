/**
 * Módulo de ejemplo "etiquetas" — patrón catálogo:
 * CRUD + permisos + guarda de eliminación en uso.
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
  listarEtiquetasAdmin,
  listarEtiquetasActivas,
  crearEtiqueta,
  actualizarEtiqueta,
  toggleEtiquetaActiva,
  eliminarEtiqueta,
} = await import("@/modules/etiquetas/actions");

describe("Módulo etiquetas (patrón catálogo)", () => {
  const prisma = getTestPrisma();

  beforeAll(async () => {
    await resetTestDb();
    await seedTestEssentials();
  });

  afterAll(async () => {
    await resetTestDb();
  });

  beforeEach(async () => {
    sessionMock.current = { id: "test-user", roles: ["admin"] };
    await prisma.clienteEtiqueta.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.etiqueta.deleteMany();
  });

  it("crea, edita y lista con conteo de usos", async () => {
    const creada = await crearEtiqueta({ codigo: "vip", nombre: "VIP", orden: 10 });
    expect(creada.ok).toBe(true);

    const editada = await actualizarEtiqueta(
      creada.ok ? creada.data.id : "",
      { codigo: "vip", nombre: "Cliente VIP", orden: 5 },
    );
    expect(editada.ok).toBe(true);

    const lista = await listarEtiquetasAdmin();
    expect(lista).toHaveLength(1);
    expect(lista[0]!.nombre).toBe("Cliente VIP");
    expect(lista[0]!.cantidadUsos).toBe(0);
  });

  it("rechaza códigos duplicados", async () => {
    await crearEtiqueta({ codigo: "vip", nombre: "VIP" });
    const dup = await crearEtiqueta({ codigo: "vip", nombre: "Otra" });
    expect(dup.ok).toBe(false);
  });

  it("toggle saca la etiqueta del listado de activas", async () => {
    const creada = await crearEtiqueta({ codigo: "vip", nombre: "VIP" });
    if (!creada.ok) throw new Error("setup");

    await toggleEtiquetaActiva(creada.data.id);
    const activas = await listarEtiquetasActivas();
    expect(activas).toHaveLength(0);
  });

  it("no elimina una etiqueta en uso", async () => {
    const creada = await crearEtiqueta({ codigo: "vip", nombre: "VIP" });
    if (!creada.ok) throw new Error("setup");
    await prisma.cliente.create({
      data: {
        nombre: "Cliente X",
        etiquetas: { create: [{ etiquetaId: creada.data.id }] },
      },
    });

    const res = await eliminarEtiqueta(creada.data.id);
    expect(res.ok).toBe(false);
    expect(await prisma.etiqueta.count()).toBe(1);
  });

  it("rechaza a un rol sin gestión", async () => {
    sessionMock.current = { id: "test-user", roles: ["operador"] };
    await expect(
      crearEtiqueta({ codigo: "nop", nombre: "No puede" }),
    ).rejects.toThrow(/permiso/i);
  });
});
