/**
 * Endurecimientos del core (patch v2):
 *  - vigencia de sesión (revocación y refresh de roles),
 *  - rate limiting con ventana fija en DB,
 *  - recupero de contraseña limitado sin filtrar información.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getTestPrisma, resetTestDb, seedTestEssentials } from "../helpers/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// El recupero no depende de la sesión; se mockea auth() para no arrastrar
// next-auth (que no resuelve en el entorno de vitest).
vi.mock("@/core/auth", () => ({ auth: async () => null }));

const { validarUsuarioVigente } = await import("@/core/auth/vigencia");
const { permitirIntento } = await import("@/core/lib/rate-limit");
const { solicitarRecuperoPassword } = await import(
  "@/core/auth/recupero-actions"
);

describe("Seguridad del core", () => {
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
    await prisma.rateLimit.deleteMany();
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { activo: true, bloqueadoHasta: null },
    });
  });

  describe("validarUsuarioVigente (revocación de sesión)", () => {
    it("devuelve los roles actuales de una cuenta activa", async () => {
      const v = await validarUsuarioVigente(usuarioId);
      expect(v?.roles).toEqual(["super_admin"]);
    });

    it("devuelve null si la cuenta fue desactivada", async () => {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { activo: false },
      });
      expect(await validarUsuarioVigente(usuarioId)).toBeNull();
    });

    it("devuelve null si la cuenta está bloqueada", async () => {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { bloqueadoHasta: new Date(Date.now() + 60_000) },
      });
      expect(await validarUsuarioVigente(usuarioId)).toBeNull();
    });

    it("refleja cambios de rol sin re-login", async () => {
      const rolNuevo = await prisma.rol.create({
        data: { codigo: "observador", nombre: "Observación" },
      });
      await prisma.usuarioRol.create({
        data: { usuarioId, rolId: rolNuevo.id },
      });

      const v = await validarUsuarioVigente(usuarioId);
      expect(v?.roles.sort()).toEqual(["observador", "super_admin"]);

      await prisma.usuarioRol.deleteMany({ where: { rolId: rolNuevo.id } });
      await prisma.rol.delete({ where: { id: rolNuevo.id } });
    });
  });

  describe("permitirIntento (rate limit)", () => {
    it("permite hasta el máximo y bloquea el siguiente", async () => {
      for (let i = 0; i < 3; i++) {
        expect(await permitirIntento("t:clave", 3, 600)).toBe(true);
      }
      expect(await permitirIntento("t:clave", 3, 600)).toBe(false);
    });

    it("resetea al vencer la ventana", async () => {
      for (let i = 0; i < 3; i++) await permitirIntento("t:v", 3, 600);
      expect(await permitirIntento("t:v", 3, 600)).toBe(false);

      // Simular que la ventana empezó hace 11 minutos.
      await prisma.rateLimit.update({
        where: { clave: "t:v" },
        data: { ventanaInicio: new Date(Date.now() - 11 * 60 * 1000) },
      });
      expect(await permitirIntento("t:v", 3, 600)).toBe(true);
    });

    it("claves distintas no se pisan", async () => {
      for (let i = 0; i < 3; i++) await permitirIntento("t:a", 3, 600);
      expect(await permitirIntento("t:a", 3, 600)).toBe(false);
      expect(await permitirIntento("t:b", 3, 600)).toBe(true);
    });
  });

  describe("recupero con límite", () => {
    it("tras el tope por email responde ok igual pero no genera más tokens", async () => {
      const email = "test-admin@misistema.local";
      // Tope: 3 por email por hora.
      for (let i = 0; i < 3; i++) {
        const r = await solicitarRecuperoPassword({ email });
        expect(r.ok).toBe(true);
      }
      const tokensAntes = await prisma.passwordResetToken.count({
        where: { usuario: { email } },
      });
      expect(tokensAntes).toBe(3);

      const r4 = await solicitarRecuperoPassword({ email });
      expect(r4.ok).toBe(true); // misma respuesta: no filtra el límite

      const tokensDespues = await prisma.passwordResetToken.count({
        where: { usuario: { email } },
      });
      expect(tokensDespues).toBe(3); // pero no generó otro token
    });
  });
});
