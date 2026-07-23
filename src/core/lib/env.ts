import { z } from "zod";

/** "" en el .env cuenta como "no seteada" (las plantillas traen VAR=""). */
const urlOpcional = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().url().optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Base de datos (Supabase Postgres)
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(), // para migraciones bypassing pgbouncer

    // Supabase Auth + Storage
    NEXT_PUBLIC_SUPABASE_URL: urlOpcional,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    SUPABASE_SECRET_KEY: z.string().optional(),

    // Email (Resend)
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),

    // App / branding (los defaults reales viven en core/lib/branding.ts)
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_APP_NAME: z.string().default("Mi Sistema"),
    NEXT_PUBLIC_INSTITUCION_NOMBRE: z.string().default("Mi Organización"),

    // Monitoreo (opcional; ver core/lib/logger.ts y core/salud/flujos.ts)
    SENTRY_DSN: urlOpcional,
    FLOTA_TOKEN: z.string().min(16).optional(),

    // Seguridad
    AUTH_SECRET: z.string().min(32).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && !data.AUTH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AUTH_SECRET"],
        message:
          "AUTH_SECRET es obligatorio en producción (mínimo 32 caracteres).",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Variables de entorno inválidas:\n",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Variables de entorno inválidas. Revisá .env.example.");
}

export const env = parsed.data;
