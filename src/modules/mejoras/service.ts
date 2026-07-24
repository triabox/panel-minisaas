/**
 * Roadmap de mejoras. Lógica compartida (UI + MCP), NO "use server".
 *
 * Regla de negocio codificada:
 *  - La 1ª mejora se habilita cuando el cliente registra su primer pago
 *    (`Cliente.fechaPrimerPago`).
 *  - Las siguientes, cada `ConfiguracionCapacidad.mesesEntreMejoras` desde la
 *    última entrega; se ESTIRA +1 mes si el cliente consume mucho soporte
 *    (horas del mes por encima del umbral).
 */
import { prisma } from "@/core/lib/prisma";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { hoyUTCenArgentina } from "@/core/lib/fechas";

import type { Actor } from "@/modules/_shared/actor";
import { obtenerCapacidad } from "@/modules/capacidad/actions";
import { horasHombrePorClienteEsteMes } from "@/modules/tickets/metricas";
import { mejoraInputSchema } from "./schemas";

function addMeses(d: Date, meses: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + meses, d.getUTCDate()),
  );
}

export type MejoraListado = {
  id: string;
  clienteNegocio: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  fechaHabilitacion: Date | null;
  fechaEntrega: Date | null;
};

export async function listarMejorasConActor(
  actor: Actor | null,
): Promise<MejoraListado[]> {
  if (!actor) return [];
  const mejoras = await prisma.mejora.findMany({
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
    include: { cliente: { select: { negocio: true } } },
  });
  return mejoras.map((m) => ({
    id: m.id,
    clienteNegocio: m.cliente.negocio,
    titulo: m.titulo,
    descripcion: m.descripcion,
    estado: m.estado,
    fechaHabilitacion: m.fechaHabilitacion,
    fechaEntrega: m.fechaEntrega,
  }));
}

export type RoadmapItem = {
  clienteId: string;
  negocio: string;
  entregadas: number;
  ultimaEntrega: Date | null;
  proximaFecha: Date;
  leToca: boolean;
  diasSinEntrega: number;
  mejorasAbiertas: number;
  excedeHoras: boolean;
};

/** Por cada cliente activo con primer pago: si le toca una mejora este mes. */
export async function obtenerRoadmap(
  actor: Actor | null,
): Promise<RoadmapItem[]> {
  if (!actor) return [];
  const hoy = hoyUTCenArgentina();

  const [clientes, cap, horasMap] = await Promise.all([
    prisma.cliente.findMany({
      where: { estado: "activo", fechaPrimerPago: { not: null } },
      include: { mejoras: true },
    }),
    obtenerCapacidad(),
    horasHombrePorClienteEsteMes(),
  ]);

  const items = clientes.map((c) => {
    const entregadas = c.mejoras
      .filter((m) => m.estado === "entregada" && m.fechaEntrega)
      .sort((a, b) => a.fechaEntrega!.getTime() - b.fechaEntrega!.getTime());
    const ultimaEntrega = entregadas.length
      ? entregadas.at(-1)!.fechaEntrega!
      : null;

    const horasMes = horasMap.get(c.id) ?? 0;
    const excedeHoras = horasMes > cap.umbralHorasCliente;
    const meses = cap.mesesEntreMejoras + (excedeHoras ? 1 : 0);

    // 1ª mejora: disponible desde el primer pago. Siguientes: última + meses.
    const proximaFecha = ultimaEntrega
      ? addMeses(ultimaEntrega, meses)
      : c.fechaPrimerPago!;
    const leToca = proximaFecha.getTime() <= hoy.getTime();

    const ref = ultimaEntrega ?? c.fechaPrimerPago!;
    const diasSinEntrega = Math.floor(
      (hoy.getTime() - ref.getTime()) / 86_400_000,
    );
    const mejorasAbiertas = c.mejoras.filter(
      (m) => m.estado !== "entregada",
    ).length;

    return {
      clienteId: c.id,
      negocio: c.negocio,
      entregadas: entregadas.length,
      ultimaEntrega,
      proximaFecha,
      leToca,
      diasSinEntrega,
      mejorasAbiertas,
      excedeHoras,
    };
  });

  return items.sort(
    (a, b) =>
      Number(b.leToca) - Number(a.leToca) || b.diasSinEntrega - a.diasSinEntrega,
  );
}

export async function crearMejoraCore(
  actor: Actor,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = mejoraInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos.",
      campos: aplanarErrores(parsed.error),
    };
  }
  const cliente = await prisma.cliente.findUnique({
    where: { id: parsed.data.clienteId },
    select: { id: true, negocio: true, fechaPrimerPago: true },
  });
  if (!cliente) return { ok: false, error: "El cliente elegido no existe." };

  // Si el cliente ya pagó, la mejora nace habilitada; si no, pendiente.
  const habilitada = Boolean(cliente.fechaPrimerPago);
  const mejora = await prisma.mejora.create({
    data: {
      clienteId: cliente.id,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion,
      estado: habilitada ? "habilitada" : "pendiente",
      fechaHabilitacion: habilitada ? new Date() : null,
    },
    select: { id: true },
  });

  await registrarAuditoria({
    modulo: "mejoras",
    accion: "crear",
    recursoTipo: "Mejora",
    recursoId: mejora.id,
    valorNuevo: parsed.data,
    detalle: `${cliente.negocio}: ${parsed.data.titulo}`,
    usuarioId: actor.usuarioId,
  });
  return { ok: true, data: { id: mejora.id } };
}

export async function marcarMejoraEntregadaCore(
  actor: Actor,
  id: string,
): Promise<ActionResult> {
  const m = await prisma.mejora.findUnique({
    where: { id },
    include: { cliente: { select: { negocio: true } } },
  });
  if (!m) return { ok: false, error: "Mejora no encontrada." };

  await prisma.mejora.update({
    where: { id },
    data: { estado: "entregada", fechaEntrega: new Date() },
  });

  await registrarAuditoria({
    modulo: "mejoras",
    accion: "entregar",
    recursoTipo: "Mejora",
    recursoId: id,
    valorAnterior: { estado: m.estado },
    valorNuevo: { estado: "entregada" },
    detalle: `${m.cliente.negocio}: ${m.titulo}`,
    usuarioId: actor.usuarioId,
  });
  return { ok: true, data: undefined };
}
