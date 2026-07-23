import { z } from "zod";

/**
 * Un ticket = un pedido de soporte con sus horas. El mismo schema valida la
 * server action y el form (RHF). Se carga en segundos: cliente + tipo + horas.
 */
export const ticketInputSchema = z.object({
  clienteId: z.string().min(1, "Elegí un cliente."),
  tipo: z.enum(["bug", "ajuste", "feature", "consulta"]),
  descripcion: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().max(500, "La descripción es muy larga.").optional(),
  ),
  horasHombre: z.coerce
    .number({ message: "Ingresá las horas-hombre." })
    .min(0, "No puede ser negativo.")
    .max(1000, "¿Tantas horas?"),
  tiempoIa: z.coerce
    .number({ message: "Ingresá el tiempo de IA." })
    .min(0, "No puede ser negativo.")
    .max(1000, "¿Tantas horas?"),
  automatizado: z.boolean().optional().default(false),
  fecha: z.coerce.date({ message: "Fecha inválida." }).optional(),
});

export type TicketInput = z.input<typeof ticketInputSchema>;

/** Etiquetas legibles de cada tipo (UI + tests). */
export const TIPO_TICKET_LABEL: Record<TicketInput["tipo"], string> = {
  bug: "Bug",
  ajuste: "Ajuste",
  feature: "Feature",
  consulta: "Consulta",
};
