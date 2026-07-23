import { z } from "zod";

/**
 * MÓDULO DE EJEMPLO — patrón "entidad de negocio".
 * Muestra el ciclo completo: schema compartido cliente/servidor, CRUD con
 * permisos y auditoría, relación con un catálogo. Renombralo o borralo al
 * armar tu dominio real.
 */
export const clienteInputSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120),
  email: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().toLowerCase().email("Email inválido.").optional(),
  ),
  telefono: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().max(30).optional(),
  ),
  notas: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().max(1000, "Las notas son muy largas.").optional(),
  ),
  etiquetasIds: z.array(z.string()).default([]),
});

export type ClienteInput = z.input<typeof clienteInputSchema>;
