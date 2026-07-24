/**
 * "Salud del negocio": las métricas madre del dashboard. Servicio compartido
 * por la página `/inicio` (con actor de sesión) y la capa MCP (actor sistema).
 */
import { prisma } from "@/core/lib/prisma";

import type { Actor } from "@/modules/_shared/actor";
import { obtenerCapacidad } from "@/modules/capacidad/actions";
import { listarClientesConActor } from "@/modules/clientes/service";
import { inicioMesActual } from "@/modules/tickets/metricas";

export type SaludNegocio = {
  mrr: number;
  clientesActivos: number;
  clientesObjetivo: number;
  capacidadPct: number;
  horasMesTotal: number;
  horasPorCliente: number;
  umbralHorasCliente: number;
  pctIA: number;
  ticketsMes: number;
  ticketsAutomatizadosMes: number;
  enRiesgo: { id: string; negocio: string; motivos: string[] }[];
};

export async function obtenerSaludNegocio(
  actor: Actor | null,
): Promise<SaludNegocio> {
  const desde = inicioMesActual();
  const [clientes, cap, agg, automatizados] = await Promise.all([
    listarClientesConActor(actor),
    obtenerCapacidad(),
    prisma.ticket.aggregate({
      where: { fecha: { gte: desde } },
      _sum: { horasHombre: true },
      _count: true,
    }),
    prisma.ticket.count({ where: { fecha: { gte: desde }, automatizado: true } }),
  ]);

  const activos = clientes.filter((c) => c.estado === "activo");
  const mrr = activos.reduce((s, c) => s + c.abonoMensual, 0);
  const horasMesTotal = agg._sum.horasHombre ?? 0;
  const horasPorCliente = activos.length ? horasMesTotal / activos.length : 0;
  const pctIA = agg._count > 0 ? (automatizados / agg._count) * 100 : 0;
  const capacidadPct = cap.clientesObjetivo
    ? (activos.length / cap.clientesObjetivo) * 100
    : 0;

  return {
    mrr,
    clientesActivos: activos.length,
    clientesObjetivo: cap.clientesObjetivo,
    capacidadPct,
    horasMesTotal,
    horasPorCliente,
    umbralHorasCliente: cap.umbralHorasCliente,
    pctIA,
    ticketsMes: agg._count,
    ticketsAutomatizadosMes: automatizados,
    enRiesgo: clientes
      .filter((c) => c.enRiesgo)
      .map((c) => ({ id: c.id, negocio: c.negocio, motivos: c.motivosRiesgo })),
  };
}
