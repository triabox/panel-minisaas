"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/core/auth";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { puedeOperar, tieneRolGestion } from "@/core/permisos";
import { clienteInputSchema } from "./schemas";

const AUDIT_MODULO = "clientes";

async function exigirPermisoOperacion() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!puedeOperar(session.user.roles)) {
    throw new Error("No tenés permiso para operar sobre clientes.");
  }
  return session.user;
}

export async function listarClientes() {
  const session = await auth();
  if (!session?.user) {
    return [] as Array<{
      id: string;
      nombre: string;
      email: string | null;
      telefono: string | null;
      activo: boolean;
      etiquetas: Array<{ id: string; nombre: string }>;
      createdAt: Date;
    }>;
  }

  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: {
      etiquetas: {
        include: { etiqueta: { select: { id: true, nombre: true } } },
      },
    },
  });

  return clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    telefono: c.telefono,
    activo: c.activo,
    etiquetas: c.etiquetas.map((e) => e.etiqueta),
    createdAt: c.createdAt,
  }));
}

export async function obtenerCliente(id: string) {
  const session = await auth();
  if (!session?.user || !id) return null;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { etiquetas: { select: { etiquetaId: true } } },
  });
  if (!cliente) return null;
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    email: cliente.email,
    telefono: cliente.telefono,
    notas: cliente.notas,
    activo: cliente.activo,
    etiquetasIds: cliente.etiquetas.map((e) => e.etiquetaId),
  };
}

export async function crearCliente(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await exigirPermisoOperacion();

  const parsed = clienteInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }
  const { etiquetasIds, ...datos } = parsed.data;

  const cliente = await prisma.cliente.create({
    data: {
      ...datos,
      etiquetas: {
        create: etiquetasIds.map((etiquetaId) => ({ etiquetaId })),
      },
    },
    select: { id: true },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "crear",
    recursoTipo: "Cliente",
    recursoId: cliente.id,
    valorNuevo: parsed.data,
    detalle: datos.nombre,
  });

  revalidatePath("/clientes");
  return { ok: true, data: { id: cliente.id } };
}

export async function actualizarCliente(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await exigirPermisoOperacion();
  if (!id) return { ok: false, error: "Falta el id." };

  const parsed = clienteInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }
  const { etiquetasIds, ...datos } = parsed.data;

  const anterior = await prisma.cliente.findUnique({
    where: { id },
    include: { etiquetas: { select: { etiquetaId: true } } },
  });
  if (!anterior) return { ok: false, error: "Cliente no encontrado." };

  await prisma.$transaction(async (tx) => {
    await tx.cliente.update({ where: { id }, data: datos });
    await tx.clienteEtiqueta.deleteMany({ where: { clienteId: id } });
    if (etiquetasIds.length > 0) {
      await tx.clienteEtiqueta.createMany({
        data: etiquetasIds.map((etiquetaId) => ({ clienteId: id, etiquetaId })),
      });
    }
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "actualizar",
    recursoTipo: "Cliente",
    recursoId: id,
    valorAnterior: {
      nombre: anterior.nombre,
      email: anterior.email,
      telefono: anterior.telefono,
      etiquetas: anterior.etiquetas.map((e) => e.etiquetaId),
    },
    valorNuevo: parsed.data,
  });

  revalidatePath("/clientes");
  return { ok: true, data: undefined };
}

export async function toggleClienteActivo(
  id: string,
): Promise<ActionResult<{ activo: boolean }>> {
  await exigirPermisoOperacion();
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) return { ok: false, error: "Cliente no encontrado." };

  const actualizado = await prisma.cliente.update({
    where: { id },
    data: { activo: !cliente.activo },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: actualizado.activo ? "activar" : "desactivar",
    recursoTipo: "Cliente",
    recursoId: id,
    valorAnterior: { activo: cliente.activo },
    valorNuevo: { activo: actualizado.activo },
    detalle: cliente.nombre,
  });

  revalidatePath("/clientes");
  return { ok: true, data: { activo: actualizado.activo } };
}

/** Eliminación real — solo gestión, con confirmación fuerte en la UI. */
export async function eliminarCliente(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autenticado." };
  if (!tieneRolGestion(session.user.roles)) {
    return { ok: false, error: "No tenés permiso para eliminar clientes." };
  }

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) return { ok: false, error: "Cliente no encontrado." };

  await prisma.cliente.delete({ where: { id } });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "eliminar",
    recursoTipo: "Cliente",
    recursoId: id,
    valorAnterior: cliente,
    detalle: cliente.nombre,
  });

  revalidatePath("/clientes");
  return { ok: true, data: undefined };
}
