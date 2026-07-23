# Cómo crear un sistema hijo

1. **GitHub → "Use this template"** sobre el repo del template → repo nuevo
   (privado) con nombre del cliente. Clonalo.

2. **Nacimiento**
   ```bash
   npm install
   npm run init:hijo        # .env con AUTH_SECRET + nombre de la app
   createdb <db> && createdb <db>_test
   npm run db:migrate && npm run db:seed && npm run db:migrate:test
   npm run verify           # todo verde antes de tocar nada
   ```

3. **Vínculo con el template** (para recibir parches del core):
   ```bash
   git remote add template <url-del-template>
   ```

4. **Registrar en la flota**: anotá el sistema en el inventario central
   (repo, cliente, dominio, DSN de Sentry si usa, URL de /api/health) y
   agregá el health al monitor de uptime.

5. **Rebranding**: paleta en `src/app/globals.css` (@theme), `BRAND_COLOR` en
   `src/core/lib/branding.ts`*, y `NEXT_PUBLIC_APP_NAME` /
   `NEXT_PUBLIC_INSTITUCION_NOMBRE` en el entorno.
   *Excepción permitida a "no tocar core": el color es configuración.

6. **Dominio propio**: renombrá o borrá `clientes`/`etiquetas` (módulos +
   páginas + tests + modelos de ejemplo del schema) y construí el tuyo
   calcando esos patrones. Actualizá `src/app/nav-config.ts`.

7. **CI y Renovate** ya vienen configurados (`.github/workflows/ci.yml`,
   `renovate.json`) — activá Renovate en el repo desde la app de GitHub.

8. **Deploy**: Vercel (o Easypanel) con las env del `.env.example`. El rol de
   DB debe poder DDL (las migraciones corren solas en el build).
