# Changelog del core

Registro de parches del núcleo. Cada entrada corresponde a un tag `patch/*`
cherry-pickeable por los sistemas hijos.

## [1] — inicial

- Núcleo completo: auth + RBAC + auditoría + storage + UI base + salud.

## [2] — patch/2026-07-hardening

- Revocación de sesión: el JWT re-verifica cuenta activa/bloqueo y refresca
  roles contra la DB cada 60 s (`core/auth/vigencia.ts`).
- Rate limiting en DB (`core/lib/rate-limit.ts` + tabla `RateLimit`): login
  20/10min por IP; recupero 5/h por IP y 3/h por email (sin filtrar info).
- Split de roles de DB: la CLI/migraciones usan `DIRECT_URL` (rol con DDL) y
  el runtime `DATABASE_URL` (rol restringido). SQL del rol en docs/01.

## [3] — patch/2026-07-flujos

- Contrato de monitoreo de flujos críticos: `core/salud/flujos.ts`
  (ejecutarChequeos con timeout + flujosHandler con Bearer FLOTA_TOKEN) y
  endpoint `/api/health/flujos` con chequeo demo en zona custom.
