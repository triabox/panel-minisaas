"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/core/auth";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { tieneRolGestion } from "@/core/permisos";
import { etiquetaInputSchema } from "./schemas";

/** Módulo de auditoría propio de este dominio (los core viven en AUDIT_MODULOS). */
const AUDIT_MODULO = "etiquetas";

async function exigirPermisoGestion() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!tieneRolGestion(session.user.roles)) {
    throw new Error("No tenés permiso para gestionar etiquetas.");
  }
  return session.user;
}

export async function listarEtiquetasAdmin() {
  const session = await auth();
  if (!session?.user) {
    return [] as Array<{
      id: string;
      codigo: string;
      nombre: string;
      activo: boolean;
      orden: number;
      cantidadUsos: number;
    }>;
  }

  const etiquetas = await prisma.etiqueta.findMany({
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    include: { _count: { select: { clientes: true } } },
  });
  return etiquetas.map((e) => ({
    id: e.id,
    codigo: e.codigo,
    nombre: e.nombre,
    activo: e.activo,
    orden: e.orden,
    cantidadUsos: e._count.clientes,
  }));
}

export async function listarEtiquetasActivas() {
  const session = await auth();
  if (!session?.user) return [];
  return prisma.etiqueta.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    select: { id: true, codigo: true, nombre: true },
  });
}

export async function crearEtiqueta(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await exigirPermisoGestion();

  const parsed = etiquetaInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const yaExiste = await prisma.etiqueta.findUnique({
    where: { codigo: parsed.data.codigo },
  });
  if (yaExiste) {
    return {
      ok: false,
      error: "Ya existe una etiqueta con ese código.",
      campos: { codigo: "Ya existe una etiqueta con ese código." },
    };
  }

  const etiqueta = await prisma.etiqueta.create({ data: parsed.data });
  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "crear",
    recursoTipo: "Etiqueta",
    recursoId: etiqueta.id,
    valorNuevo: parsed.data,
    detalle: parsed.data.nombre,
  });
  revalidatePath("/etiquetas");
  return { ok: true, data: { id: etiqueta.id } };
}

export async function actualizarEtiqueta(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await exigirPermisoGestion();
  if (!id) return { ok: false, error: "Falta el id." };

  const parsed = etiquetaInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const conflicto = await prisma.etiqueta.findFirst({
    where: { codigo: parsed.data.codigo, NOT: { id } },
  });
  if (conflicto) {
    return {
      ok: false,
      error: "Ya existe otra etiqueta con ese código.",
      campos: { codigo: "Ya existe otra etiqueta con ese código." },
    };
  }

  const anterior = await prisma.etiqueta.findUnique({ where: { id } });
  if (!anterior) return { ok: false, error: "Etiqueta no encontrada." };

  await prisma.etiqueta.update({ where: { id }, data: parsed.data });
  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "actualizar",
    recursoTipo: "Etiqueta",
    recursoId: id,
    valorAnterior: anterior,
    valorNuevo: parsed.data,
  });
  revalidatePath("/etiquetas");
  return { ok: true, data: undefined };
}

export async function toggleEtiquetaActiva(
  id: string,
): Promise<ActionResult<{ activo: boolean }>> {
  await exigirPermisoGestion();
  const etiqueta = await prisma.etiqueta.findUnique({ where: { id } });
  if (!etiqueta) return { ok: false, error: "Etiqueta no encontrada." };

  const actualizada = await prisma.etiqueta.update({
    where: { id },
    data: { activo: !etiqueta.activo },
  });
  revalidatePath("/etiquetas");
  return { ok: true, data: { activo: actualizada.activo } };
}

export async function eliminarEtiqueta(id: string): Promise<ActionResult> {
  await exigirPermisoGestion();

  const enUso = await prisma.clienteEtiqueta.count({
    where: { etiquetaId: id },
  });
  if (enUso > 0) {
    return {
      ok: false,
      error:
        "No se puede eliminar una etiqueta que está en uso. Desactivala en su lugar.",
    };
  }

  const etiqueta = await prisma.etiqueta.findUnique({ where: { id } });
  if (!etiqueta) return { ok: false, error: "Etiqueta no encontrada." };

  await prisma.etiqueta.delete({ where: { id } });
  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "eliminar",
    recursoTipo: "Etiqueta",
    recursoId: id,
    valorAnterior: etiqueta,
    detalle: etiqueta.nombre,
  });
  revalidatePath("/etiquetas");
  return { ok: true, data: undefined };
}
