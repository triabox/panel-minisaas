import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import {
  getTestPrisma,
  resetTestDb,
  seedTestEssentials,
  TEST_USUARIO,
} from "../helpers/db";

describe("Autenticación — verificación de credenciales", () => {
  const prisma = getTestPrisma();

  beforeAll(async () => {
    await resetTestDb();
    await seedTestEssentials();
  });

  afterAll(async () => {
    await resetTestDb();
  });

  beforeEach(async () => {
    // Resetear contadores de intentos antes de cada test.
    await prisma.usuario.update({
      where: { email: TEST_USUARIO.email },
      data: { intentosFallidos: 0, bloqueadoHasta: null, activo: true },
    });
  });

  it("acepta el password correcto del usuario test", async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: TEST_USUARIO.email },
    });
    expect(usuario).not.toBeNull();

    const valido = await bcrypt.compare(
      TEST_USUARIO.password,
      usuario!.passwordHash,
    );
    expect(valido).toBe(true);
  });

  it("rechaza un password incorrecto", async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: TEST_USUARIO.email },
    });
    const valido = await bcrypt.compare("password-incorrecto", usuario!.passwordHash);
    expect(valido).toBe(false);
  });

  it("hashea con bcrypt (no almacena password en claro)", async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: TEST_USUARIO.email },
    });
    expect(usuario!.passwordHash).not.toBe(TEST_USUARIO.password);
    // Hashes bcrypt empiezan con $2a$, $2b$ o $2y$.
    expect(usuario!.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("permite incrementar el contador de intentos fallidos", async () => {
    await prisma.usuario.update({
      where: { email: TEST_USUARIO.email },
      data: { intentosFallidos: { increment: 1 } },
    });
    const u = await prisma.usuario.findUnique({
      where: { email: TEST_USUARIO.email },
    });
    expect(u!.intentosFallidos).toBe(1);
  });

  it("permite bloquear al usuario tras 5 intentos fallidos", async () => {
    const futuro = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.usuario.update({
      where: { email: TEST_USUARIO.email },
      data: { intentosFallidos: 5, bloqueadoHasta: futuro },
    });
    const u = await prisma.usuario.findUnique({
      where: { email: TEST_USUARIO.email },
    });
    expect(u!.intentosFallidos).toBe(5);
    expect(u!.bloqueadoHasta).not.toBeNull();
    expect(u!.bloqueadoHasta!.getTime()).toBeGreaterThan(Date.now());
  });

  it("retorna null para email inexistente", async () => {
    const u = await prisma.usuario.findUnique({
      where: { email: "no-existe@misistema.local" },
    });
    expect(u).toBeNull();
  });

  it("retorna el rol asignado al usuario", async () => {
    const u = await prisma.usuario.findUnique({
      where: { email: TEST_USUARIO.email },
      include: { roles: { include: { rol: true } } },
    });
    expect(u!.roles.length).toBe(1);
    expect(u!.roles[0]!.rol.codigo).toBe("super_admin");
  });
});
