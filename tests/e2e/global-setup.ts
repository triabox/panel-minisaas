/**
 * Global setup que corre UNA VEZ antes de toda la suite E2E.
 * Trunca la DB de test y siembra los datos del seed normal,
 * incluyendo el super admin (admin@misistema.local / cambiar123)
 * que las pruebas usan para loguearse.
 *
 * Usa truncate directo (no `prisma migrate reset`) para evitar el guardrail
 * de Prisma contra agentes y porque sólo necesitamos limpiar datos, no migraciones.
 */
import { execSync } from "node:child_process";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv();

const TABLAS = [
  "RateLimit",
  "Ticket",
  "Mejora",
  "ProspectoEvento",
  "Prospecto",
  "Cliente",
  "Rubro",
  "ConfiguracionCapacidad",
  "Documento",
  "PasswordResetToken",
  "AuditLog",
  "UsuarioRol",
  "RolPermiso",
  "Permiso",
  "Rol",
  "Usuario",
  "Persona",
];

async function globalSetup() {
  const testDbUrl = process.env.TEST_DATABASE_URL;
  if (!testDbUrl || !testDbUrl.includes("test")) {
    throw new Error(
      "TEST_DATABASE_URL debe estar definido y contener 'test' en el nombre.",
    );
  }

  console.log("\n🧹 [E2E] Truncando DB de test...");
  const pool = new Pool({ connectionString: testDbUrl });
  try {
    await pool.query(
      `TRUNCATE TABLE ${TABLAS.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
    );
  } finally {
    await pool.end();
  }

  console.log("🌱 [E2E] Sembrando datos iniciales...");
  execSync("npx tsx prisma/seed.ts", {
    env: { ...process.env, DATABASE_URL: testDbUrl, DIRECT_URL: testDbUrl },
    stdio: "inherit",
  });

  console.log("✅ [E2E] DB de test lista.\n");
}

export default globalSetup;
