/**
 * Módulo "capacidad" — configuración singleton que deriva el umbral de horas
 * por cliente (horasSoporteMes / clientesObjetivo).
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

const { obtenerCapacidad, actualizarCapacidad } = await import(
  "@/modules/capacidad/actions"
);

describe("Módulo capacidad (singleton + umbral derivado)", () => {
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
    await prisma.configuracionCapacidad.deleteMany();
  });

  it("sin fila devuelve defaults (120/60 → umbral 2)", async () => {
    const cap = await obtenerCapacidad();
    expect(cap.horasSoporteMes).toBe(120);
    expect(cap.clientesObjetivo).toBe(60);
    expect(cap.umbralHorasCliente).toBeCloseTo(2);
  });

  it("actualiza y recalcula el umbral", async () => {
    const res = await actualizarCapacidad({
      horasSoporteMes: 100,
      clientesObjetivo: 40,
    });
    expect(res.ok).toBe(true);

    const cap = await obtenerCapacidad();
    expect(cap.umbralHorasCliente).toBeCloseTo(2.5);
  });

  it("rechaza valores inválidos", async () => {
    const res = await actualizarCapacidad({
      horasSoporteMes: 0,
      clientesObjetivo: 60,
    });
    expect(res.ok).toBe(false);
  });

  it("operador no puede cambiar la capacidad", async () => {
    sessionMock.current = { id: "test-user", roles: ["operador"] };
    const res = await actualizarCapacidad({
      horasSoporteMes: 100,
      clientesObjetivo: 40,
    });
    expect(res.ok).toBe(false);
  });
});
