/**
 * Auditoría del núcleo: registrarAuditoria escribe la fila con contexto,
 * nunca lanza, y las actions de dominio la disparan.
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

const { registrarAuditoria } = await import("@/core/lib/audit");
const { crearRubro } = await import("@/modules/rubros/actions");

describe("Auditoría (núcleo)", () => {
  const prisma = getTestPrisma();
  let usuarioId: string;

  beforeAll(async () => {
    await resetTestDb();
    const ess = await seedTestEssentials();
    usuarioId = ess.usuario.id;
  });

  afterAll(async () => {
    await resetTestDb();
  });

  beforeEach(async () => {
    sessionMock.current = { id: usuarioId, roles: ["super_admin"] };
    await prisma.auditLog.deleteMany();
    await prisma.rubro.deleteMany();
  });

  it("registra un evento con usuario de la sesión", async () => {
    await registrarAuditoria({
      modulo: "test",
      accion: "probar",
      recursoTipo: "Cosa",
      recursoId: "abc",
      valorNuevo: { x: 1 },
    });

    const filas = await prisma.auditLog.findMany();
    expect(filas).toHaveLength(1);
    expect(filas[0]!.usuarioId).toBe(usuarioId);
    expect(filas[0]!.modulo).toBe("test");
    expect(filas[0]!.valorNuevo).toEqual({ x: 1 });
  });

  it("no lanza si la sesión apunta a un usuario inexistente (guarda FK)", async () => {
    sessionMock.current = { id: "id-fantasma", roles: ["super_admin"] };
    await expect(
      registrarAuditoria({
        modulo: "test",
        accion: "probar",
        recursoTipo: "Cosa",
      }),
    ).resolves.toBeUndefined();

    const filas = await prisma.auditLog.findMany();
    expect(filas).toHaveLength(1);
    expect(filas[0]!.usuarioId).toBeNull();
  });

  it("las actions de dominio auditan (crear rubro deja rastro)", async () => {
    const res = await crearRubro({ codigo: "gastronomia", nombre: "Gastronomía" });
    expect(res.ok).toBe(true);

    const filas = await prisma.auditLog.findMany({
      where: { modulo: "rubros", accion: "crear" },
    });
    expect(filas).toHaveLength(1);
    expect(filas[0]!.recursoTipo).toBe("Rubro");
  });
});
