import { z } from "zod";

/**
 * Configuración de capacidad (singleton). De estas dos cifras se deriva el
 * umbral de horas por cliente = horasSoporteMes / clientesObjetivo.
 */
export const capacidadInputSchema = z.object({
  horasSoporteMes: z.coerce
    .number()
    .int("Tiene que ser un número entero.")
    .min(1, "Al menos 1 hora.")
    .max(100000),
  clientesObjetivo: z.coerce
    .number()
    .int("Tiene que ser un número entero.")
    .min(1, "Al menos 1 cliente.")
    .max(100000),
});

export type CapacidadInput = z.input<typeof capacidadInputSchema>;

/** Config resuelta, con el umbral ya derivado. */
export type Capacidad = {
  horasSoporteMes: number;
  clientesObjetivo: number;
  /** Techo de horas/cliente/mes derivado de la meta. */
  umbralHorasCliente: number;
  /** Cadencia base del roadmap de mejoras (meses entre entregas). */
  mesesEntreMejoras: number;
};
