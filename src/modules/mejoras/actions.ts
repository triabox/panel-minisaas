"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/core/auth";
import { type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { puedeOperar, tieneRolGestion } from "@/core/permisos";

import { crearMejoraCore, marcarMejoraEntregadaCore } from "./service";

async function exigirPermisoOperacion() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!puedeOperar(session.user.roles)) {
    throw new Error("No tenés permiso para gestionar mejoras.");
  }
  return session.user;
}

function revalidar() {
  revalidatePath("/roadmap");
  revalidatePath("/inicio");
}

export async function crearMejora(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await exigirPermisoOperacion();
  const res = await crearMejoraCore(
    { usuarioId: user.id, roles: user.roles },
    input,
  );
  if (res.ok) revalidar();
  return res;
}

export async function marcarMejoraEntregada(id: string): Promise<ActionResult> {
  const user = await exigirPermisoOperacion();
  const res = await marcarMejoraEntregadaCore(
    { usuarioId: user.id, roles: user.roles },
    id,
  );
  if (res.ok) revalidar();
  return res;
}

export async function eliminarMejora(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autenticado." };
  if (!tieneRolGestion(session.user.roles)) {
    return { ok: false, error: "No tenés permiso para eliminar mejoras." };
  }

  const mejora = await prisma.mejora.findUnique({
    where: { id },
    include: { cliente: { select: { negocio: true } } },
  });
  if (!mejora) return { ok: false, error: "Mejora no encontrada." };

  await prisma.mejora.delete({ where: { id } });
  await registrarAuditoria({
    modulo: "mejoras",
    accion: "eliminar",
    recursoTipo: "Mejora",
    recursoId: id,
    valorAnterior: { titulo: mejora.titulo, estado: mejora.estado },
    detalle: `${mejora.cliente.negocio}: ${mejora.titulo}`,
  });
  revalidar();
  return { ok: true, data: undefined };
}
