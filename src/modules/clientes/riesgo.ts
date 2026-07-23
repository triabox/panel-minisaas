/**
 * Riesgo del cliente — DERIVADO, nunca una columna (así siempre refleja la
 * realidad). En el MVP prende por dos causas: pago demorado/vencido o exceso
 * del umbral de horas. La tercera causa del plan ("no usa el sistema") se suma
 * en v2/v3 con telemetría real; el modelo ya tiene `Cliente.ultimaActividad`
 * reservado para eso.
 */
export type EstadoPago = "al_dia" | "demorado" | "vencido";

export type Riesgo = {
  enRiesgo: boolean;
  /** Motivos en lenguaje claro, para mostrar el "por qué". */
  motivos: string[];
};

export function calcularRiesgo(params: {
  estadoPago: EstadoPago;
  horasMes: number;
  umbralHorasCliente: number;
}): Riesgo {
  const { estadoPago, horasMes, umbralHorasCliente } = params;
  const motivos: string[] = [];

  if (estadoPago === "demorado") motivos.push("Paga demorado");
  if (estadoPago === "vencido") motivos.push("Pago vencido");

  if (horasMes > umbralHorasCliente) {
    motivos.push(
      `Excede el umbral de horas (${horasMes.toFixed(1)} de ${umbralHorasCliente.toFixed(1)} h este mes)`,
    );
  }

  return { enRiesgo: motivos.length > 0, motivos };
}
