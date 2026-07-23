# nucleo-minisaas

Template ejecutable para mini-SaaS de gestión. Clonás, corrés `init`, y tenés un
sistema funcionando: login + recupero de contraseña, dashboard con RBAC,
auditoría, storage de archivos, un módulo CRUD de ejemplo, tests verdes y CI.

Destilado de una arquitectura real en producción (LaCasita). El detalle completo
está en [docs/01-arquitectura.md](docs/01-arquitectura.md).

## La regla que sostiene la flota

Este template alimenta muchos sistemas que evolucionan **por separado**, pero
comparten parches de seguridad y monitoreo. Eso funciona por una sola regla:

> **`src/core/` no se edita en los sistemas hijos.**
> Todo lo demás (`src/modules/`, `src/app/`, `prisma/` desde la migración 2 en
> adelante) es de cada sistema y diverge libremente.

- Si un hijo necesita algo distinto del core → se extiende desde la zona custom,
  o el cambio se hace en el template y se propaga como parche.
- Los parches del core se publican acá como **un commit atómico con tag
  `patch/<fecha>-<tema>`** y se aplican en cada hijo con `git cherry-pick`
  (ver [docs/03-como-parchear-el-core.md](docs/03-como-parchear-el-core.md)).
- Los parches de **dependencias** los propone Renovate en cada hijo, con
  auto-merge si el CI está verde.
- `TEMPLATE_VERSION` dice qué versión del core tiene cada sistema.

## Crear un sistema nuevo (hijo)

```bash
# 1. En GitHub: "Use this template" → repo nuevo. Clonalo y entrá.
npm install
npm run init:hijo          # genera .env con AUTH_SECRET, pregunta nombre de la app

# 2. Base de datos (dos: app y test)
createdb misistema && createdb misistema_test   # o desde tu proveedor
npm run db:migrate && npm run db:seed
npm run db:migrate:test

# 3. Conservar el vínculo con el template (para recibir parches)
git remote add template https://github.com/<org>/nucleo-minisaas.git

# 4. Verificar que todo está verde y arrancar
npm run verify
npm run dev                # login: BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD
```

Guía completa en [docs/02-como-crear-un-hijo.md](docs/02-como-crear-un-hijo.md).

## Comandos

```bash
npm run dev            # desarrollo (localhost:3000)
npm run verify         # type-check + lint + tests ← correr antes de cerrar tareas
npm test               # vitest (unit + integración con DB real de test)
npm run test:e2e       # Playwright (levanta la app en :3100)
npm run db:migrate     # migración en dev
npm run db:seed        # roles, permisos, admin inicial, datos de ejemplo
```

Tests: exigen `TEST_DATABASE_URL` en `.env` con **"test" en el nombre de la DB**
(guard de seguridad). La DB de test nunca se mockea.

## Qué trae el core

| Pieza | Qué incluye |
|---|---|
| Auth | NextAuth v5 (email+contraseña, bcrypt, bloqueo por intentos, JWT 12 h) + recupero por token |
| RBAC | Roles `super_admin` / `admin` / `operador` / `observador` + helpers; modelo fino Permiso/RolPermiso en DB |
| Auditoría | `registrarAuditoria()` en toda mutación sensible (quién, qué, valor anterior/nuevo, IP) |
| Patrón de mutación | `ActionResult<T>` + pipeline auth → permiso → Zod → prisma → audit → revalidate |
| UI | Componentes shadcn-style + dashboard (sidebar con nav inyectable, tabla con buscador, dialogs) |
| Storage | Drivers local/Supabase con URLs firmadas (HMAC + expiración) |
| Email | Resend con fallback a consola en dev/test |
| Salud | `/api/health` (DB + versión + template) listo para el monitor de uptime |
| Fechas | Convención fecha-calendario (UTC 00:00) vs. timestamp real, con helpers |

## Módulo de ejemplo

`clientes` + `etiquetas` demuestran los dos patrones que vas a repetir en cada
sistema: **entidad** (tabla buscable, form dialog RHF+Zod, acciones por fila,
auditoría) y **catálogo configurable**. Renombralos o borralos al arrancar tu
dominio real — son zona custom.
