import type { ZodError } from "zod";

/**
 * Retorno uniforme de TODAS las server actions del sistema.
 * Los errores son datos (nunca excepciones hacia el cliente) y van en
 * lenguaje claro para la persona que usa el sistema.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; campos?: Record<string, string> };

/** Mapea un ZodError a { campo: mensaje } para pintar errores en el form. */
export function aplanarErrores(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (path && !out[path]) {
      out[path] = issue.message;
    }
  }
  return out;
}
