/**
 * Helpers de agregación de horas. NO son server actions (funciones sync/async
 * de solo lectura); las consumen las páginas server y otras actions.
 *
 * "Este mes" = mes calendario actual en Argentina, tomando su primer día a las
 * 00:00 UTC como cota inferior. Es una aproximación deliberada (el borde real
 * AR está a las 03:00 UTC): suficiente para una métrica interna, y predecible.
 */
import { prisma } from "@/core/lib/prisma";
import { hoyUTCenArgentina } from "@/core/lib/fechas";

/** Primer día del mes actual (calendario AR) a las 00:00 UTC. */
export function inicioMesActual(): Date {
  const hoy = hoyUTCenArgentina();
  return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
}

/** Suma de horas-hombre por cliente en el mes actual (Map clienteId → horas). */
export async function horasHombrePorClienteEsteMes(): Promise<
  Map<string, number>
> {
  const filas = await prisma.ticket.groupBy({
    by: ["clienteId"],
    where: { fecha: { gte: inicioMesActual() } },
    _sum: { horasHombre: true },
  });
  const map = new Map<string, number>();
  for (const f of filas) map.set(f.clienteId, f._sum.horasHombre ?? 0);
  return map;
}
