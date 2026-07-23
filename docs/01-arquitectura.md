# Arquitectura

Destilada de LaCasita (sistema en producción). El criterio rector: **un dev + IA
mantienen muchos sistemas**, así que gana lo predecible sobre lo ingenioso.

## Frontera core / custom

- `src/core/` — auth, RBAC, auditoría, storage, email, fechas, UI base, salud.
  **No se edita en los hijos**: recibe parches del template por cherry-pick.
- `src/modules/` + `src/app/` — el dominio de cada sistema; diverge libre.
- Dirección de dependencia: custom importa de core, **nunca al revés**
  (por eso la navegación se define en `src/app/nav-config.ts` y se inyecta).

## El patrón de mutación (usarlo SIEMPRE)

Toda server action: `auth() → permiso → Zod safeParse → prisma → registrarAuditoria → revalidatePath`,
con retorno `ActionResult<T>` (de `@/core/lib/action-result`) y errores en
lenguaje claro. Ver `src/modules/clientes/actions.ts` como ejemplo canónico.

## Reglas que no se negocian

1. **Input `unknown` + Zod** en cada action; el mismo schema valida el form.
2. **Auditoría** en toda mutación sobre datos personales o configuración.
3. **Permisos por action** con los helpers de `@/core/permisos` (no confiar en
   que la UI esconda botones).
4. **Fechas**: calendario a 00:00 UTC formateado en UTC; timestamps con hora
   real en zona AR. Helpers en `@/core/lib/fechas` — nada de `toLocaleDateString` suelto.
5. **Tests con DB real** (`TEST_DATABASE_URL` con "test" en el nombre); se
   mockea solo `auth()` y `revalidatePath`.
6. **Persona raíz**: los roles del negocio son relaciones a `Persona`, no
   tablas con datos duplicados. `Usuario` (cuenta) es 1-a-1 con `Persona`.
7. **Nada del cliente hardcodeado**: nombre/branding por env, paleta en
   `globals.css` (@theme), color de emails en `core/lib/branding.ts`.
8. **Sin dependencias nuevas sin justificación.**

## Trampas conocidas (aprendidas a fuerza de bugs)

- **RSC**: nunca pasar funciones/iconos de un server component a un client
  component (por eso existe `app-shell.tsx`). El nav se computa en el cliente.
- **`"use server"`**: esos archivos solo exportan funciones async — los
  schemas van en archivos aparte (`*-schemas.ts`).
- **Listas de truncado de tests**: cada tabla nueva se agrega a
  `tests/helpers/db.ts` y `tests/e2e/global-setup.ts`.
- **Buscadores**: server-side desde el día uno (`AsyncCombobox`), nunca listas
  precargadas con `take` — se rompen silenciosamente al crecer los datos.
- **Env `""`** cuenta como no seteada (ver `urlOpcional` en `core/lib/env.ts`).

## Monitoreo

- `/api/health` responde `{ok, db, version, template}` — lo consulta el
  monitor de la flota (repo `flota`) cada 10 minutos.
- **Flujos críticos** (`/api/health/flujos`, protegido con `FLOTA_TOKEN`):
  cada sistema declara sus chequeos en
  `src/app/api/health/flujos/route.ts` (zona custom) usando el contrato de
  `core/salud/flujos.ts`. Dos clases: **activos** (precondiciones: "¿hay
  turnos generados?", "¿responde el storage?") y **pasivos** (latido de uso:
  "¿hace cuánto que no se registra una venta?" — el silencio anómalo delata
  flujos rotos aunque el health general dé verde). Reglas: consultas baratas
  de solo lectura, timeout de 5 s por chequeo, jamás ejecutar el flujo real.
  Estados: `ok | degradado | fallo`; el monitor alerta solo en transiciones.
- `core/lib/logger.ts` es el único punto de logging; si el sistema necesita
  Sentry: `npm i @sentry/nextjs`, seteá `SENTRY_DSN` y enganchá
  `captureException` en `logger.error` (un solo lugar).

## Seguridad (decisiones y endurecimientos del core)

Además de lo estructural (permiso por action, Zod en todo input, bcrypt +
bloqueo por intentos, tokens de recupero hasheados con vencimiento, URLs de
storage firmadas, headers de seguridad, auditoría), el core trae tres
endurecimientos que conviene conocer:

1. **Revocación de sesión efectiva** (`core/auth/vigencia.ts`): aunque la
   sesión es JWT (12 h), el callback `jwt` re-verifica contra la DB cada
   **60 segundos** que la cuenta siga activa y sin bloqueo — desactivar un
   usuario lo expulsa en el próximo request, y los cambios de rol se
   refrescan solos sin re-login.
2. **Rate limiting en DB** (`core/lib/rate-limit.ts`): ventana fija con
   contador en la tabla `RateLimit` (sirve en serverless, donde la memoria
   no se comparte). Aplicado a login (20 intentos / 10 min por IP, además
   del bloqueo por cuenta) y a recupero de contraseña (5/h por IP y 3/h por
   email — la respuesta no cambia: no filtra información). Falla abierto:
   si la DB no responde, deja pasar y loguea.
3. **Split de roles de DB**: `DATABASE_URL` (runtime) usa un rol **sin DDL**;
   `DIRECT_URL` (migraciones en build/CLI, vía `prisma.config.ts`) usa el rol
   owner. Si comprometen la app, no pueden alterar el schema. SQL para crear
   el rol de runtime en Postgres/Supabase:

   ```sql
   CREATE ROLE app_runtime LOGIN PASSWORD '<secreto>';
   GRANT CONNECT ON DATABASE postgres TO app_runtime;
   GRANT USAGE ON SCHEMA public TO app_runtime;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
   -- Que las tablas de futuras migraciones hereden los permisos:
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
     GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
     GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
   ```

**Pendientes conocidos** (evaluar por sistema): MFA para super_admin, chequeo
de contraseñas comunes, CSP sin `unsafe-inline` cuando Next lo permita.

## Deploy

`vercel.json` corre `prisma migrate deploy` en cada build usando `DIRECT_URL`
(rol con DDL); la app corre con `DATABASE_URL` (rol restringido). Con Supabase:
pooler 6543 para runtime, conexión directa 5432 para migraciones.
