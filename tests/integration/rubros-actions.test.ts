/**
 * Módulo "rubros" — patrón catálogo configurable (CRUD + permisos de gestión).
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
  listarRubrosAdmin,
  listarRubrosActivos,
  crearRubro,
  actualizarRubro,
  toggleRubroActivo,
  eliminarRubro,
} = await import("@/modules/rubros/actions");

describe("Módulo rubros (patrón catálogo)", () => {
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
    await prisma.cliente.deleteMany();
    await prisma.rubro.deleteMany();
  });

  it("crea y lista rubros", async () => {
    const res = await crearRubro({ codigo: "gastronomia", nombre: "Gastronomía" });
    expect(res.ok).toBe(true);

    const lista = await listarRubrosAdmin();
    expect(lista).toHaveLength(1);
    expect(lista[0]!.cantidadUsos).toBe(0);
  });

  it("rechaza código duplicado", async () => {
    await crearRubro({ codigo: "retail", nombre: "Retail" });
    const dup = await crearRubro({ codigo: "retail", nombre: "Otro" });
    expect(dup.ok).toBe(false);
  });

  it("toggle activa/desactiva y filtra los activos", async () => {
    const creado = await crearRubro({ codigo: "salud", nombre: "Salud" });
    if (!creado.ok) throw new Error("setup");

    await toggleRubroActivo(creado.data.id);
    const activos = await listarRubrosActivos();
    expect(activos).toHaveLength(0);
  });

  it("no elimina un rubro asignado a clientes (pide desactivar)", async () => {
    const creado = await crearRubro({ codigo: "educacion", nombre: "Educación" });
    if (!creado.ok) throw new Error("setup");
    await prisma.cliente.create({
      data: {
        negocio: "Escuela X",
        fechaAlta: new Date("2026-07-01"),
        rubroId: creado.data.id,
      },
    });

    const res = await eliminarRubro(creado.data.id);
    expect(res.ok).toBe(false);
  });

  it("actualiza un rubro", async () => {
    const creado = await crearRubro({ codigo: "otro", nombre: "Otro" });
    if (!creado.ok) throw new Error("setup");
    const res = await actualizarRubro(creado.data.id, {
      codigo: "otro",
      nombre: "Otros rubros",
    });
    expect(res.ok).toBe(true);
  });

  it("operador no puede crear rubros", async () => {
    sessionMock.current = { id: "test-user", roles: ["operador"] };
    await expect(
      crearRubro({ codigo: "no", nombre: "No" }),
    ).rejects.toThrow(/permiso/i);
  });
});
