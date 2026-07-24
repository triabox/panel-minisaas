import { z } from "zod";

/** Una mejora comprometida con un cliente. */
export const mejoraInputSchema = z.object({
  clienteId: z.string().min(1, "Elegí un cliente."),
  titulo: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(120),
  descripcion: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().max(1000).optional(),
  ),
});

export type MejoraInput = z.input<typeof mejoraInputSchema>;
