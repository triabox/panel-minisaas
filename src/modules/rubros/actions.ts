"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/core/auth";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { tieneRolGestion } from "@/core/permisos";

import { rubroInputSchema } from "./schemas";

const AUDIT_MODULO = "rubros";

async function exigirPermisoGestion() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!tieneRolGestion(session.user.roles)) {
    throw new Error("No tenés permiso para gestionar rubros.");
  }
  return session.user;
}

export async function listarRubrosAdmin() {
  const session = await auth();
  if (!session?.user) return [];

  const rubros = await prisma.rubro.findMany({
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    include: { _count: { select: { clientes: true } } },
  });
  return rubros.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    activo: r.activo,
    orden: r.orden,
    cantidadUsos: r._count.clientes,
  }));
}

/** Rubros activos para selectores (form de cliente). */
export async function listarRubrosActivos() {
  const session = await auth();
  if (!session?.user) return [];
  return prisma.rubro.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    select: { id: true, codigo: true, nombre: true },
  });
}

export async function crearRubro(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await exigirPermisoGestion();

  const parsed = rubroInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const yaExiste = await prisma.rubro.findUnique({
    where: { codigo: parsed.data.codigo },
  });
  if (yaExiste) {
    return {
      ok: false,
      error: "Ya existe un rubro con ese código.",
      campos: { codigo: "Ya existe un rubro con ese código." },
    };
  }

  const rubro = await prisma.rubro.create({ data: parsed.data });
  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "crear",
    recursoTipo: "Rubro",
    recursoId: rubro.id,
    valorNuevo: parsed.data,
    detalle: parsed.data.nombre,
  });
  revalidatePath("/configuracion/rubros");
  return { ok: true, data: { id: rubro.id } };
}

export async function actualizarRubro(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await exigirPermisoGestion();
  if (!id) return { ok: false, error: "Falta el id." };

  const parsed = rubroInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const conflicto = await prisma.rubro.findFirst({
    where: { codigo: parsed.data.codigo, NOT: { id } },
  });
  if (conflicto) {
    return {
      ok: false,
      error: "Ya existe otro rubro con ese código.",
      campos: { codigo: "Ya existe otro rubro con ese código." },
    };
  }

  const anterior = await prisma.rubro.findUnique({ where: { id } });
  if (!anterior) return { ok: false, error: "Rubro no encontrado." };

  await prisma.rubro.update({ where: { id }, data: parsed.data });
  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "actualizar",
    recursoTipo: "Rubro",
    recursoId: id,
    valorAnterior: anterior,
    valorNuevo: parsed.data,
  });
  revalidatePath("/configuracion/rubros");
  return { ok: true, data: undefined };
}

export async function toggleRubroActivo(
  id: string,
): Promise<ActionResult<{ activo: boolean }>> {
  await exigirPermisoGestion();
  const rubro = await prisma.rubro.findUnique({ where: { id } });
  if (!rubro) return { ok: false, error: "Rubro no encontrado." };

  const actualizado = await prisma.rubro.update({
    where: { id },
    data: { activo: !rubro.activo },
  });
  revalidatePath("/configuracion/rubros");
  return { ok: true, data: { activo: actualizado.activo } };
}

export async function eliminarRubro(id: string): Promise<ActionResult> {
  await exigirPermisoGestion();

  const enUso = await prisma.cliente.count({ where: { rubroId: id } });
  if (enUso > 0) {
    return {
      ok: false,
      error:
        "No se puede eliminar un rubro asignado a clientes. Desactivalo en su lugar.",
    };
  }

  const rubro = await prisma.rubro.findUnique({ where: { id } });
  if (!rubro) return { ok: false, error: "Rubro no encontrado." };

  await prisma.rubro.delete({ where: { id } });
  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "eliminar",
    recursoTipo: "Rubro",
    recursoId: id,
    valorAnterior: rubro,
    detalle: rubro.nombre,
  });
  revalidatePath("/configuracion/rubros");
  return { ok: true, data: undefined };
}
