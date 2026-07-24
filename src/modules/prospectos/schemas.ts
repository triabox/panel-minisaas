import { z } from "zod";

const textoOpcional = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const ESTADOS_PROSPECTO = [
  "contactado",
  "demo",
  "prueba",
  "cerrado",
  "descartado",
] as const;

/** Alta/edición de un prospecto del pipeline. */
export const prospectoInputSchema = z.object({
  negocio: z.string().trim().min(2, "Nombre del negocio muy corto.").max(120),
  rubroId: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().optional(),
  ),
  contactoNombre: textoOpcional(120),
  contactoEmail: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().toLowerCase().email("Email inválido.").optional(),
  ),
  contactoTelefono: textoOpcional(30),
  direccion: textoOpcional(240),
  latitud: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(-90).max(90).optional(),
  ),
  longitud: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(-180).max(180).optional(),
  ),
  estado: z.enum(ESTADOS_PROSPECTO).default("contactado"),
  fechaRecordatorio: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.date({ message: "Fecha inválida." }).optional(),
  ),
  notas: textoOpcional(1000),
  origen: textoOpcional(40),
});

export type ProspectoInput = z.input<typeof prospectoInputSchema>;

/** Mover un prospecto de estado, registrando las horas invertidas. */
export const movimientoSchema = z.object({
  estado: z.enum(ESTADOS_PROSPECTO),
  horas: z.coerce.number().min(0, "No puede ser negativo.").max(1000).default(0),
  nota: textoOpcional(300),
});

export type MovimientoInput = z.input<typeof movimientoSchema>;
