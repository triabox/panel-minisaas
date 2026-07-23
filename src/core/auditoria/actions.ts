"use server";

import { auth } from "@/core/auth";
import { prisma } from "@/core/lib/prisma";

const ROLES_AUDITORIA = new Set(["super_admin"]);

async function exigirPermiso() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!session.user.roles.some((r) => ROLES_AUDITORIA.has(r))) {
    throw new Error("Solo super admin puede ver el log de auditoría.");
  }
  return session.user;
}

export type AuditoriaFiltros = {
  modulo?: string;
  accion?: string;
  usuarioId?: string;
  desde?: Date;
  hasta?: Date;
  limit?: number;
};

export async function listarAuditoria(filtros: AuditoriaFiltros = {}) {
  await exigirPermiso();

  const where: {
    modulo?: string;
    accion?: string;
    usuarioId?: string;
    fecha?: { gte?: Date; lte?: Date };
  } = {};
  if (filtros.modulo) where.modulo = filtros.modulo;
  if (filtros.accion) where.accion = filtros.accion;
  if (filtros.usuarioId) where.usuarioId = filtros.usuarioId;
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = filtros.desde;
    if (filtros.hasta) where.fecha.lte = filtros.hasta;
  }

  const limit = filtros.limit ?? 200;

  const eventos = await prisma.auditLog.findMany({
    where,
    orderBy: { fecha: "desc" },
    take: limit,
    include: {
      usuario: {
        select: {
          email: true,
          persona: { select: { nombre: true, apellido: true } },
        },
      },
    },
  });

  return eventos.map((e) => ({
    id: e.id,
    fecha: e.fecha,
    modulo: e.modulo,
    accion: e.accion,
    recursoTipo: e.recursoTipo,
    recursoId: e.recursoId,
    exito: e.exito,
    detalle: e.detalle,
    ip: e.ip,
    valorAnterior: e.valorAnterior,
    valorNuevo: e.valorNuevo,
    usuario: e.usuario
      ? {
          email: e.usuario.email,
          nombre: `${e.usuario.persona.apellido}, ${e.usuario.persona.nombre}`,
        }
      : null,
  }));
}

export async function listarModulosDisponibles() {
  await exigirPermiso();
  const result = await prisma.auditLog.groupBy({
    by: ["modulo"],
    _count: true,
    orderBy: { modulo: "asc" },
  });
  return result.map((r) => ({ modulo: r.modulo, cantidad: r._count }));
}
