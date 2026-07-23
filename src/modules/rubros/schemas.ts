import { z } from "zod";

/** Catálogo configurable de rubros (gastronomía, retail, salud…). */
export const rubroInputSchema = z.object({
  codigo: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "El código debe tener al menos 2 caracteres.")
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guión bajo."),
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80),
  activo: z.boolean().default(true),
  orden: z.coerce.number().int().min(0).max(999).default(0),
});

export type RubroInput = z.input<typeof rubroInputSchema>;
