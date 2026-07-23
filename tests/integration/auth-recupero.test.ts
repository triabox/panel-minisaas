import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

import { getTestPrisma, resetTestDb, seedTestEssentials } from "../helpers/db";

vi.mock("@/core/auth", () => ({
  auth: async () => ({
    user: {
      id: "test-super-admin",
      email: "test-admin@misistema.local",
      name: "Test Admin",
      roles: ["super_admin"],
    },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
}));

const enviadosSpy = vi.fn();
vi.mock("@/core/lib/email", () => ({
  enviarEmail: async (m: unknown) => {
    enviadosSpy(m);
    return { ok: true, id: "test-mail-id" };
  },
}));

const { solicitarRecuperoPassword, restablecerPasswordConToken } = await import(
  "@/core/auth/recupero-actions"
);

function hashToken(t: string) {
  return createHash("sha256").update(t).digest("hex");
}

describe("Auth recupero de contraseña", () => {
  const prisma = getTestPrisma();

  beforeAll(async () => {
    await resetTestDb();
    await seedTestEssentials();
  });

  afterAll(async () => {
    await resetTestDb();
  });

  beforeEach(async () => {
    enviadosSpy.mockClear();
    await prisma.passwordResetToken.deleteMany();
    await prisma.auditLog.deleteMany();
  });

  it("solicitar para email existente: crea token y envía mail", async () => {
    const res = await solicitarRecuperoPassword({
      email: "test-admin@misistema.local",
    });
    expect(res.ok).toBe(true);

    const tokens = await prisma.passwordResetToken.findMany();
    expect(tokens).toHaveLength(1);
    expect(tokens[0]!.usadoEn).toBeNull();
    expect(tokens[0]!.expiraEn.getTime()).toBeGreaterThan(Date.now());
    expect(enviadosSpy).toHaveBeenCalledTimes(1);
    const log = await prisma.auditLog.findFirst({
      where: { accion: "recupero_solicitado" },
    });
    expect(log).toBeTruthy();
  });

  it("solicitar para email inexistente: devuelve ok sin filtrar info", async () => {
    const res = await solicitarRecuperoPassword({
      email: "fantasma@misistema.local",
    });
    expect(res.ok).toBe(true);

    const tokens = await prisma.passwordResetToken.findMany();
    expect(tokens).toHaveLength(0);
    expect(enviadosSpy).not.toHaveBeenCalled();
  });

  it("solicitar con email inválido devuelve ok:false", async () => {
    const res = await solicitarRecuperoPassword({ email: "no-es-email" });
    expect(res.ok).toBe(false);
  });

  it("restablecer con token válido cambia la contraseña y marca usado", async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: "test-admin@misistema.local" },
    });
    const tokenPlano = "a".repeat(64);
    await prisma.passwordResetToken.create({
      data: {
        usuarioId: usuario!.id,
        tokenHash: hashToken(tokenPlano),
        expiraEn: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const res = await restablecerPasswordConToken({
      token: tokenPlano,
      password: "passnueva12345",
      confirmacion: "passnueva12345",
    });
    expect(res.ok).toBe(true);

    const u = await prisma.usuario.findUnique({ where: { id: usuario!.id } });
    expect(await bcrypt.compare("passnueva12345", u!.passwordHash)).toBe(true);

    const tk = await prisma.passwordResetToken.findFirst({
      where: { usuarioId: usuario!.id },
    });
    expect(tk!.usadoEn).toBeInstanceOf(Date);
  });

  it("restablecer rechaza token inexistente", async () => {
    const res = await restablecerPasswordConToken({
      token: "z".repeat(64),
      password: "passnueva12345",
      confirmacion: "passnueva12345",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/inv[áa]lido/i);
  });

  it("restablecer rechaza token expirado", async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: "test-admin@misistema.local" },
    });
    const tokenPlano = "b".repeat(64);
    await prisma.passwordResetToken.create({
      data: {
        usuarioId: usuario!.id,
        tokenHash: hashToken(tokenPlano),
        expiraEn: new Date(Date.now() - 60_000),
      },
    });

    const res = await restablecerPasswordConToken({
      token: tokenPlano,
      password: "passnueva12345",
      confirmacion: "passnueva12345",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/expir[óo]/i);
  });

  it("restablecer rechaza token ya usado", async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { email: "test-admin@misistema.local" },
    });
    const tokenPlano = "c".repeat(64);
    await prisma.passwordResetToken.create({
      data: {
        usuarioId: usuario!.id,
        tokenHash: hashToken(tokenPlano),
        expiraEn: new Date(Date.now() + 30 * 60 * 1000),
        usadoEn: new Date(),
      },
    });

    const res = await restablecerPasswordConToken({
      token: tokenPlano,
      password: "passnueva12345",
      confirmacion: "passnueva12345",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/usado/i);
  });

  it("restablecer rechaza confirmación que no coincide", async () => {
    const res = await restablecerPasswordConToken({
      token: "x".repeat(64),
      password: "passnueva12345",
      confirmacion: "diferentapass1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.campos?.confirmacion).toMatch(/coinciden/i);
  });
});
