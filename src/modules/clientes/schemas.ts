import { z } from "zod";

/** "" → undefined para todos los opcionales de texto. */
const textoOpcional = (max: number, msg?: string) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z
      .string()
      .trim()
      .max(max, msg ?? "Texto demasiado largo.")
      .optional(),
  );

/**
 * Un cliente = un negocio al que le opero un mini-SaaS. El mismo schema valida
 * la server action y el form (RHF). El estado de pago se carga a mano en el MVP
 * (en v2 lo actualiza el webhook de Mercado Pago).
 */
export const clienteInputSchema = z.object({
  negocio: z
    .string()
    .trim()
    .min(2, "El nombre del negocio debe tener al menos 2 caracteres.")
    .max(120),
  rubroId: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().optional(),
  ),
  sistema: textoOpcional(120),
  contactoNombre: textoOpcional(120),
  contactoEmail: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().toLowerCase().email("Email inválido.").optional(),
  ),
  contactoTelefono: textoOpcional(30),
  fechaAlta: z.coerce.date({ message: "Fecha de alta inválida." }),
  abonoMensual: z.coerce
    .number({ message: "El abono tiene que ser un número." })
    .min(0, "El abono no puede ser negativo.")
    .max(1_000_000),
  moneda: z.enum(["USD", "ARS"]).default("USD"),
  estado: z.enum(["activo", "pausado", "baja"]).default("activo"),
  estadoPago: z.enum(["al_dia", "demorado", "vencido"]).default("al_dia"),
  notas: textoOpcional(1000, "Las notas son muy largas."),
});

export type ClienteInput = z.input<typeof clienteInputSchema>;

/** Schema del cambio de estado comercial (activar / pausar / dar de baja). */
export const cambioEstadoSchema = z.object({
  estado: z.enum(["activo", "pausado", "baja"]),
});
