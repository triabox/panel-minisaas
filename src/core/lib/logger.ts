/**
 * Logger mínimo del núcleo: niveles + JSON en producción (parseable por
 * cualquier agregador). Punto ÚNICO donde enchufar un servicio de errores:
 * si el sistema instala @sentry/nextjs y define SENTRY_DSN, agregá acá el
 * Sentry.captureException — el resto del código no cambia.
 */

type Nivel = "debug" | "info" | "warn" | "error";

function emitir(nivel: Nivel, mensaje: string, datos?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    const linea = JSON.stringify({
      t: new Date().toISOString(),
      nivel,
      mensaje,
      ...datos,
    });
    if (nivel === "error") console.error(linea);
    else if (nivel === "warn") console.warn(linea);
    else console.log(linea);
    return;
  }
  const extra = datos ? [datos] : [];
  if (nivel === "error") console.error(`[${nivel}] ${mensaje}`, ...extra);
  else if (nivel === "warn") console.warn(`[${nivel}] ${mensaje}`, ...extra);
  else console.log(`[${nivel}] ${mensaje}`, ...extra);
}

export const logger = {
  debug: (mensaje: string, datos?: Record<string, unknown>) =>
    process.env.NODE_ENV !== "production" && emitir("debug", mensaje, datos),
  info: (mensaje: string, datos?: Record<string, unknown>) =>
    emitir("info", mensaje, datos),
  warn: (mensaje: string, datos?: Record<string, unknown>) =>
    emitir("warn", mensaje, datos),
  /** Errores inesperados. `err` se serializa con message + stack. */
  error: (mensaje: string, err?: unknown, datos?: Record<string, unknown>) => {
    const detalle =
      err instanceof Error
        ? { errorMensaje: err.message, stack: err.stack }
        : err !== undefined
          ? { errorValor: String(err) }
          : {};
    emitir("error", mensaje, { ...detalle, ...datos });
  },
};
