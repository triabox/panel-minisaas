import { describe, expect, it } from "vitest";
import { z } from "zod";

// Replicamos el schema mínimo para testear la validación.
// Nota: importar @/core/lib/env haría side-effects (lanza si falta DATABASE_URL).
// Por eso testeamos la *forma* de validación, no el módulo entero.

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_APP_NAME: z.string().default("LaCasita"),
    AUTH_SECRET: z.string().min(32).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && !data.AUTH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AUTH_SECRET"],
        message: "AUTH_SECRET requerido en producción.",
      });
    }
  });

describe("Validación de env (schema)", () => {
  it("acepta una configuración mínima válida", () => {
    const parsed = envSchema.parse({
      DATABASE_URL: "postgresql://user@localhost:5432/db",
    });
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.NEXT_PUBLIC_APP_NAME).toBe("LaCasita");
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("rechaza DATABASE_URL inválido", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "esto no es una url",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza AUTH_SECRET corto", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "postgresql://user@localhost:5432/db",
      AUTH_SECRET: "corto",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza NODE_ENV no listado", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "postgresql://user@localhost:5432/db",
      NODE_ENV: "staging",
    });
    expect(result.success).toBe(false);
  });

  it("exige AUTH_SECRET cuando NODE_ENV es production", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "postgresql://user@localhost:5432/db",
      NODE_ENV: "production",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      expect(flat.AUTH_SECRET).toBeTruthy();
    }
  });

  it("acepta production con AUTH_SECRET válido", () => {
    const parsed = envSchema.parse({
      DATABASE_URL: "postgresql://user@localhost:5432/db",
      NODE_ENV: "production",
      AUTH_SECRET: "x".repeat(32),
    });
    expect(parsed.NODE_ENV).toBe("production");
  });
});
