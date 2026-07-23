"use server";

import bcrypt from "bcryptjs";

import { auth } from "@/core/auth";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { AUDIT_MODULOS, registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { cambiarMiPasswordSchema } from "./cuenta-schemas";

/** Cambio de contraseña de la propia cuenta (self-service, cualquier rol). */
export async function cambiarMiPassword(
  input: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "No autenticado." };
  }

  const parsed = cambiarMiPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
  });
  if (!usuario || !usuario.activo) {
    return { ok: false, error: "Cuenta no válida." };
  }

  const passwordOk = await bcrypt.compare(
    parsed.data.passwordActual,
    usuario.passwordHash,
  );
  if (!passwordOk) {
    return {
      ok: false,
      error: "La contraseña actual no coincide.",
      campos: { passwordActual: "Contraseña incorrecta." },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.passwordNueva, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash, intentosFallidos: 0, bloqueadoHasta: null },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULOS.USUARIOS,
    accion: "cambio_password_propio",
    recursoTipo: "Usuario",
    recursoId: usuario.id,
    detalle: usuario.email,
  });

  return { ok: true, data: undefined };
}
