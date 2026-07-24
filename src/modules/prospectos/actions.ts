"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/core/auth";
import { type ActionResult } from "@/core/lib/action-result";
import { puedeOperar, tieneRolGestion } from "@/core/permisos";

import { actorDeSesion } from "@/modules/_shared/actor";
import {
  actualizarProspectoCore,
  crearProspectoCore,
  eliminarProspectoCore,
  moverProspectoCore,
  obtenerProspecto as obtenerProspectoService,
} from "./service";

async function exigirPermisoOperacion() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!puedeOperar(session.user.roles)) {
    throw new Error("No tenés permiso para operar el pipeline.");
  }
  return session.user;
}

function revalidar() {
  revalidatePath("/pipeline");
}

export async function obtenerProspecto(id: string) {
  return obtenerProspectoService(await actorDeSesion(), id);
}

export async function crearProspecto(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await exigirPermisoOperacion();
  const res = await crearProspectoCore(
    { usuarioId: user.id, roles: user.roles },
    input,
  );
  if (res.ok) revalidar();
  return res;
}

export async function actualizarProspecto(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await exigirPermisoOperacion();
  const res = await actualizarProspectoCore(
    { usuarioId: user.id, roles: user.roles },
    id,
    input,
  );
  if (res.ok) revalidar();
  return res;
}

export async function moverProspecto(
  id: string,
  input: unknown,
): Promise<ActionResult<{ estado: string }>> {
  const user = await exigirPermisoOperacion();
  const res = await moverProspectoCore(
    { usuarioId: user.id, roles: user.roles },
    id,
    input,
  );
  if (res.ok) revalidar();
  return res;
}

export async function eliminarProspecto(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autenticado." };
  if (!tieneRolGestion(session.user.roles)) {
    return { ok: false, error: "No tenés permiso para eliminar prospectos." };
  }
  const res = await eliminarProspectoCore(
    { usuarioId: session.user.id, roles: session.user.roles },
    id,
  );
  if (res.ok) revalidar();
  return res;
}
