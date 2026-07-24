/**
 * Módulo "prospectos" — pipeline. CRUD, movimiento con horas (CAC),
 * recordatorios y geocoding (mockeado para no pegarle a la red).
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

// Geocoding mockeado: cualquier dirección resuelve a un punto fijo.
vi.mock("@/modules/prospectos/geocode", () => ({
  geocodeDireccion: async () => ({ latitud: -34.6, longitud: -58.38 }),
}));

const {
  crearProspecto,
  moverProspecto,
  eliminarProspecto,
} = await import("@/modules/prospectos/actions");
const {
  listarProspectosConActor,
  recordatoriosPendientes,
  resumenPipeline,
} = await import("@/modules/prospectos/service");

const ACTOR = { usuarioId: null, roles: ["super_admin"] };

describe("Módulo prospectos (pipeline)", () => {
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
    await prisma.prospectoEvento.deleteMany();
    await prisma.prospecto.deleteMany();
  });

  it("crea con dirección y geocodifica (cae el pin)", async () => {
    const res = await crearProspecto({
      negocio: "Bar Central",
      direccion: "Av. Corrientes 1234",
    });
    expect(res.ok).toBe(true);
    const lista = await listarProspectosConActor(ACTOR);
    expect(lista[0]!.latitud).toBeCloseTo(-34.6);
    expect(lista[0]!.longitud).toBeCloseTo(-58.38);
  });

  it("mover registra horas que suman al CAC", async () => {
    const creado = await crearProspecto({ negocio: "Gym Norte" });
    if (!creado.ok) throw new Error("setup");

    await moverProspecto(creado.data.id, { estado: "demo", horas: 2 });
    await moverProspecto(creado.data.id, { estado: "cerrado", horas: 1.5 });

    const lista = await listarProspectosConActor(ACTOR);
    expect(lista[0]!.estado).toBe("cerrado");
    expect(lista[0]!.horasCac).toBeCloseTo(3.5); // 0 (alta) + 2 + 1.5

    const resumen = await resumenPipeline(ACTOR);
    expect(resumen.cacPromedioHoras).toBeCloseTo(3.5);
  });

  it("lista recordatorios vencidos (no cerrados)", async () => {
    await crearProspecto({
      negocio: "Con recordatorio",
      fechaRecordatorio: "2020-01-01",
    });
    const pend = await recordatoriosPendientes(ACTOR);
    expect(pend).toHaveLength(1);
    expect(pend[0]!.negocio).toBe("Con recordatorio");
  });

  it("eliminar exige rol de gestión", async () => {
    const creado = await crearProspecto({ negocio: "Borrable" });
    if (!creado.ok) throw new Error("setup");

    const negado = await eliminarProspecto(creado.data.id);
    expect(negado.ok).toBe(false);

    sessionMock.current = { id: "test-user", roles: ["admin"] };
    const ok = await eliminarProspecto(creado.data.id);
    expect(ok.ok).toBe(true);
    expect(await prisma.prospecto.count()).toBe(0);
  });

  it("observador no puede crear", async () => {
    sessionMock.current = { id: "test-user", roles: ["observador"] };
    await expect(crearProspecto({ negocio: "No" })).rejects.toThrow(/permiso/i);
  });
});
