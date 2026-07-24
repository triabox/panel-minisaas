/**
 * Pipeline de prospectos. Lógica compartida (UI + MCP), NO "use server".
 * Las horas por estado (ProspectoEvento) suman el CAC de cada prospecto.
 */
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/core/lib/prisma";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { hoyUTCenArgentina } from "@/core/lib/fechas";

import type { Actor } from "@/modules/_shared/actor";
import { geocodeDireccion } from "./geocode";
import { movimientoSchema, prospectoInputSchema } from "./schemas";

export type ProspectoListado = {
  id: string;
  negocio: string;
  rubro: string | null;
  contactoNombre: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: string;
  fechaRecordatorio: Date | null;
  horasCac: number;
  createdAt: Date;
};

async function mapear(actor: Actor | null): Promise<ProspectoListado[]> {
  if (!actor) return [];
  const prospectos = await prisma.prospecto.findMany({
    orderBy: [{ estado: "asc" }, { negocio: "asc" }],
    include: {
      rubro: { select: { nombre: true } },
      eventos: { select: { horas: true } },
    },
  });
  return prospectos.map((p) => ({
    id: p.id,
    negocio: p.negocio,
    rubro: p.rubro?.nombre ?? null,
    contactoNombre: p.contactoNombre,
    direccion: p.direccion,
    latitud: p.latitud,
    longitud: p.longitud,
    estado: p.estado,
    fechaRecordatorio: p.fechaRecordatorio,
    horasCac: p.eventos.reduce((s, e) => s + e.horas, 0),
    createdAt: p.createdAt,
  }));
}

export async function listarProspectosConActor(
  actor: Actor | null,
): Promise<ProspectoListado[]> {
  return mapear(actor);
}

export async function obtenerProspecto(actor: Actor | null, id: string) {
  if (!actor || !id) return null;
  const p = await prisma.prospecto.findUnique({ where: { id } });
  if (!p) return null;
  return {
    id: p.id,
    negocio: p.negocio,
    rubroId: p.rubroId,
    contactoNombre: p.contactoNombre,
    contactoEmail: p.contactoEmail,
    contactoTelefono: p.contactoTelefono,
    direccion: p.direccion,
    latitud: p.latitud,
    longitud: p.longitud,
    estado: p.estado,
    fechaRecordatorio: p.fechaRecordatorio,
    notas: p.notas,
  };
}

/** Prospectos con recordatorio vencido (para el aviso "seguir a fulano"). */
export async function recordatoriosPendientes(actor: Actor | null) {
  if (!actor) return [];
  const hoy = hoyUTCenArgentina();
  const prospectos = await prisma.prospecto.findMany({
    where: {
      fechaRecordatorio: { lte: hoy },
      estado: { notIn: ["cerrado", "descartado"] },
    },
    orderBy: { fechaRecordatorio: "asc" },
    select: { id: true, negocio: true, fechaRecordatorio: true, estado: true },
  });
  return prospectos;
}

/** Resumen del embudo: conteo por estado + CAC promedio de los cerrados. */
export async function resumenPipeline(actor: Actor | null) {
  const lista = await mapear(actor);
  const porEstado: Record<string, number> = {};
  for (const p of lista) porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;
  const cerrados = lista.filter((p) => p.estado === "cerrado");
  const cacPromedio = cerrados.length
    ? cerrados.reduce((s, p) => s + p.horasCac, 0) / cerrados.length
    : 0;
  return { total: lista.length, porEstado, cacPromedioHoras: cacPromedio };
}

export async function crearProspectoCore(
  actor: Actor,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = prospectoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del prospecto.",
      campos: aplanarErrores(parsed.error),
    };
  }
  const data: Prisma.ProspectoUncheckedCreateInput = { ...parsed.data };

  // Geocodificar si hay dirección y no vinieron coordenadas.
  if (data.direccion && (data.latitud == null || data.longitud == null)) {
    const geo = await geocodeDireccion(data.direccion);
    if (geo) {
      data.latitud = geo.latitud;
      data.longitud = geo.longitud;
    }
  }

  data.eventos = {
    create: { estado: parsed.data.estado, horas: 0, nota: "Alta" },
  };

  const prospecto = await prisma.prospecto.create({
    data,
    select: { id: true },
  });

  await registrarAuditoria({
    modulo: "prospectos",
    accion: "crear",
    recursoTipo: "Prospecto",
    recursoId: prospecto.id,
    valorNuevo: parsed.data,
    detalle: data.negocio,
    usuarioId: actor.usuarioId,
  });
  return { ok: true, data: { id: prospecto.id } };
}

export async function actualizarProspectoCore(
  actor: Actor,
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = prospectoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del prospecto.",
      campos: aplanarErrores(parsed.error),
    };
  }
  const anterior = await prisma.prospecto.findUnique({ where: { id } });
  if (!anterior) return { ok: false, error: "Prospecto no encontrado." };

  const data = { ...parsed.data };
  if (
    data.direccion &&
    data.direccion !== anterior.direccion &&
    (data.latitud == null || data.longitud == null)
  ) {
    const geo = await geocodeDireccion(data.direccion);
    if (geo) {
      data.latitud = geo.latitud;
      data.longitud = geo.longitud;
    }
  }

  await prisma.prospecto.update({
    where: { id },
    data: data as Prisma.ProspectoUncheckedUpdateInput,
  });
  await registrarAuditoria({
    modulo: "prospectos",
    accion: "actualizar",
    recursoTipo: "Prospecto",
    recursoId: id,
    valorAnterior: { negocio: anterior.negocio, estado: anterior.estado },
    valorNuevo: parsed.data,
    detalle: data.negocio,
    usuarioId: actor.usuarioId,
  });
  return { ok: true, data: undefined };
}

export async function eliminarProspectoCore(
  actor: Actor,
  id: string,
): Promise<ActionResult> {
  const prospecto = await prisma.prospecto.findUnique({ where: { id } });
  if (!prospecto) return { ok: false, error: "Prospecto no encontrado." };

  await prisma.prospecto.delete({ where: { id } });
  await registrarAuditoria({
    modulo: "prospectos",
    accion: "eliminar",
    recursoTipo: "Prospecto",
    recursoId: id,
    valorAnterior: { negocio: prospecto.negocio, estado: prospecto.estado },
    detalle: prospecto.negocio,
    usuarioId: actor.usuarioId,
  });
  return { ok: true, data: undefined };
}

/** Mueve el prospecto de estado y registra las horas invertidas (CAC). */
export async function moverProspectoCore(
  actor: Actor,
  id: string,
  input: unknown,
): Promise<ActionResult<{ estado: string }>> {
  const parsed = movimientoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos.",
      campos: aplanarErrores(parsed.error),
    };
  }
  const prospecto = await prisma.prospecto.findUnique({ where: { id } });
  if (!prospecto) return { ok: false, error: "Prospecto no encontrado." };

  await prisma.$transaction([
    prisma.prospecto.update({
      where: { id },
      data: { estado: parsed.data.estado },
    }),
    prisma.prospectoEvento.create({
      data: {
        prospectoId: id,
        estado: parsed.data.estado,
        horas: parsed.data.horas,
        nota: parsed.data.nota,
      },
    }),
  ]);

  await registrarAuditoria({
    modulo: "prospectos",
    accion: "mover",
    recursoTipo: "Prospecto",
    recursoId: id,
    valorAnterior: { estado: prospecto.estado },
    valorNuevo: { estado: parsed.data.estado, horas: parsed.data.horas },
    detalle: prospecto.negocio,
    usuarioId: actor.usuarioId,
  });
  return { ok: true, data: { estado: parsed.data.estado } };
}
