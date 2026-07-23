/**
 * Helpers de formateo de fecha/hora consistentes en Argentina.
 *
 * Convención del proyecto:
 *  - Las "fechas calendario" (Clase.fecha, Curso.fechaInicio/fechaFin,
 *    Inscripcion.fechaInscripcion/fechaBaja, Persona.fechaNacimiento, etc.)
 *    se guardan como Date con hora 00:00 UTC. Para preservar el día sin
 *    correrlo por la zona horaria de Argentina (-3hs), las formateamos
 *    usando `timeZone: "UTC"`. Si las formateáramos en ARG sin esto,
 *    "2026-03-16T00:00:00Z" se mostraría como "domingo 15 mar 21:00".
 *
 *  - Los "timestamps reales" (Usuario.ultimoLogin, AuditLog.fecha,
 *    Asistencia.cargadoEn, Observacion.createdAt creadas online) son
 *    instantes con hora significativa. Para esos usamos timezone ARG.
 *
 * Usar SIEMPRE estos helpers desde la UI/exports. Evitar llamar
 * `toLocaleDateString` o construir `Intl.DateTimeFormat` ad-hoc.
 */

const TZ_AR = "America/Argentina/Buenos_Aires";

// === Fechas calendario (preservan el día — UTC) ===

/** "16/03/26" — corta, año en 2 dígitos. */
export const FMT_FECHA_CORTA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  timeZone: "UTC",
});

/** "16/03/2026" — corta, año en 4 dígitos. */
export const FMT_FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** "Lunes, 16 de marzo de 2026" — día de la semana + nombre del mes. */
export const FMT_FECHA_LARGA = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "mar 26" — mes abreviado + año en 2 dígitos. */
export const FMT_MES_CORTO = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

// === Timestamps reales (con hora — ARG) ===

/** "16/03/2026, 14:30" — fecha y hora local de Argentina. */
export const FMT_FECHA_HORA_AR = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ_AR,
});

/** "14:30" — solo la hora local de Argentina. */
export const FMT_HORA_AR = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ_AR,
});

// === Helpers ===

/**
 * Formatea una fecha calendario como "dd/mm/yy" o "—" si es null.
 */
export function fmtFechaCorta(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return FMT_FECHA_CORTA.format(d instanceof Date ? d : new Date(d));
}

/**
 * Formatea una fecha calendario como "dd/mm/yyyy" o "—" si es null.
 */
export function fmtFecha(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return FMT_FECHA.format(d instanceof Date ? d : new Date(d));
}

/**
 * Capitaliza la primera letra (útil para "lunes" → "Lunes").
 */
export function cap(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Formatea una fecha calendario como "Lunes, 16 de marzo de 2026".
 */
export function fmtFechaLarga(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return cap(FMT_FECHA_LARGA.format(d instanceof Date ? d : new Date(d)));
}

/**
 * Formatea un timestamp real (con hora) como "dd/mm/yyyy, 14:30" en Argentina.
 */
export function fmtFechaHora(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return FMT_FECHA_HORA_AR.format(d instanceof Date ? d : new Date(d));
}

/**
 * Formatea solo la hora local Argentina como "14:30".
 */
export function fmtHora(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return FMT_HORA_AR.format(d instanceof Date ? d : new Date(d));
}

/**
 * "Hoy" como Date UTC 00:00 del día calendario actual en Argentina.
 *
 * Útil para comparar contra fechas calendario (Clase.fecha, Curso.fechaInicio,
 * etc.) que se guardan en UTC 00:00. Si calculáramos hoy con `setHours(0,0,0,0)`
 * el resultado dependería de la zona horaria del server (UTC vs ARG), y las
 * comparaciones fallarían cuando el server está en una zona distinta.
 */
export function hoyUTCenArgentina(): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_AR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(partes.find((p) => p.type === "year")!.value);
  const m = Number(partes.find((p) => p.type === "month")!.value);
  const d = Number(partes.find((p) => p.type === "day")!.value);
  return new Date(Date.UTC(y, m - 1, d));
}
