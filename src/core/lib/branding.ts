/**
 * Branding de la app, client-safe.
 *
 * Se lee de las variables `NEXT_PUBLIC_*` (inlined por Next.js en build), así que
 * se puede usar tanto en componentes servidor como cliente. NO importar `@/core/lib/env`
 * en componentes cliente: ese módulo es server-only (valida DATABASE_URL, etc.).
 *
 * Regla de la flota: acá NO va nada hardcodeado de un cliente concreto.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Mi Sistema";

export const INSTITUCION_NOMBRE =
  process.env.NEXT_PUBLIC_INSTITUCION_NOMBRE ?? "Mi Organización";

/**
 * Color de marca usado FUERA de Tailwind (emails HTML, themeColor del manifest).
 * La paleta de la UI vive en src/app/globals.css (@theme) — al rebrandear un
 * sistema hijo se cambian los dos lugares.
 */
export const BRAND_COLOR = "#4F46E5";

/** Iniciales para el logo placeholder del sidebar/landing. */
export const APP_INICIALES = (process.env.NEXT_PUBLIC_APP_NAME ?? "MS")
  .split(/\s+/)
  .map((p) => p[0])
  .filter(Boolean)
  .slice(0, 2)
  .join("")
  .toUpperCase();
