// Setup global de tests Vitest.
// - Carga variables desde .env (manteniendo TEST_DATABASE_URL como override).
// - Garantiza que tests apunten siempre a la DB de test, nunca a la de desarrollo.

import { config as loadEnv } from "dotenv";

loadEnv();

const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) {
  throw new Error(
    "Configurá TEST_DATABASE_URL en .env (apuntando a una DB exclusiva para tests, ej. misistema_test).",
  );
}
if (!testDbUrl.includes("test")) {
  throw new Error(
    `TEST_DATABASE_URL debe apuntar a una DB con 'test' en el nombre — recibido: ${testDbUrl}`,
  );
}

// Sobrescribimos DATABASE_URL para que cualquier import de @/core/lib/prisma use la DB de test.
process.env.DATABASE_URL = testDbUrl;
process.env.DIRECT_URL = testDbUrl;
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-no-importa-en-tests-1234567890";
