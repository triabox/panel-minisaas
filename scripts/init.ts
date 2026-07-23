/**
 * Nacimiento de un sistema hijo. Corré `npm run init:hijo` después de clonar:
 *  - crea .env desde .env.example con AUTH_SECRET generado,
 *  - setea el nombre de la app y la DB,
 *  - imprime los pasos que siguen.
 *
 * Idempotente-cauteloso: si ya existe .env, no lo pisa.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

async function main() {
  if (existsSync(".env")) {
    console.log("⚠️  Ya existe un .env — no lo piso. Editalo a mano si hace falta.");
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const nombreApp =
    (await rl.question("Nombre visible de la app (ej. Gimnasio Norte): ")).trim() ||
    "Mi Sistema";
  const nombreDb =
    (await rl.question("Nombre de la DB local (ej. gimnasio_norte): ")).trim() ||
    "misistema";
  rl.close();

  let env = readFileSync(".env.example", "utf8");
  env = env
    .replace(/^AUTH_SECRET=""/m, `AUTH_SECRET="${randomBytes(32).toString("base64")}"`)
    .replace(/NEXT_PUBLIC_APP_NAME="Mi Sistema"/, `NEXT_PUBLIC_APP_NAME="${nombreApp}"`)
    .replace(/nucleo_minisaas_test/g, `${nombreDb}_test`)
    .replace(/nucleo_minisaas/g, nombreDb);

  writeFileSync(".env", env);
  console.log(`
✅ .env creado (AUTH_SECRET generado).

Próximos pasos:
  1. Creá las bases:        createdb ${nombreDb} && createdb ${nombreDb}_test
  2. Migrá y sembrá:        npm run db:migrate && npm run db:seed && npm run db:migrate:test
  3. Vínculo con el template (para recibir parches del core):
       git remote add template <url-del-repo-nucleo-minisaas>
  4. Verificá y arrancá:    npm run verify && npm run dev

Login inicial: BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD del .env
(cambiá la contraseña apenas entres).
`);
}

main().catch((e) => {
  console.error("init falló:", e);
  process.exit(1);
});
