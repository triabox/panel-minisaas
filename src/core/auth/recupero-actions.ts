"use server";

import { randomBytes, createHash } from "node:crypto";

import bcrypt from "bcryptjs";

import { enviarEmail } from "@/core/lib/email";
import { plantillaRecuperoContrasena } from "@/core/lib/email-templates";
import { env } from "@/core/lib/env";
import { AUDIT_MODULOS, registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { ipDelRequest, permitirIntento } from "@/core/lib/rate-limit";

import {
  recuperoSchema,
  restablecerSchema,
} from "./recupero-schemas";

const VENCIMIENTO_MINUTOS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Solicitud de recupero. Devuelve siempre `ok: true` (no revela si el email
 * está registrado, para evitar enumeración). Si está registrado, envía el mail.
 */
export async function solicitarRecuperoPassword(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = recuperoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Email inválido." };
  }
  const email = parsed.data.email;

  // Anti-abuso: limita el spam de emails de recupero por origen y por cuenta.
  // Devuelve ok:true igual (misma respuesta que siempre: no filtra nada).
  const ip = await ipDelRequest();
  const dentroDeLimite =
    (await permitirIntento(`recupero:ip:${ip}`, 5, 60 * 60)) &&
    (await permitirIntento(`recupero:email:${email}`, 3, 60 * 60));
  if (!dentroDeLimite) {
    return { ok: true };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { persona: { select: { nombre: true } } },
  });

  if (usuario && usuario.activo) {
    const tokenPlano = randomBytes(32).toString("hex");
    const tokenHash = hashToken(tokenPlano);
    const expiraEn = new Date(Date.now() + VENCIMIENTO_MINUTOS * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash,
        expiraEn,
      },
    });

    const enlace = `${env.NEXT_PUBLIC_APP_URL}/recuperar/${tokenPlano}`;
    const tpl = plantillaRecuperoContrasena({
      nombrePersona: usuario.persona.nombre,
      enlace,
      vencimientoMinutos: VENCIMIENTO_MINUTOS,
    });
    void enviarEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    await registrarAuditoria({
      modulo: AUDIT_MODULOS.AUTH,
      accion: "recupero_solicitado",
      recursoTipo: "Usuario",
      recursoId: usuario.id,
      usuarioId: usuario.id,
      detalle: email,
    });
  }

  return { ok: true };
}

export async function restablecerPasswordConToken(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string; campos?: Record<string, string> }> {
  const parsed = restablecerSchema.safeParse(input);
  if (!parsed.success) {
    const campos: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path && !campos[path]) campos[path] = issue.message;
    }
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos,
    };
  }

  const tokenHash = hashToken(parsed.data.token);
  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { usuario: { select: { id: true, email: true, activo: true } } },
  });

  if (!registro) {
    return { ok: false, error: "Enlace inválido. Pedí uno nuevo." };
  }
  if (registro.usadoEn) {
    return { ok: false, error: "Este enlace ya fue usado. Pedí uno nuevo." };
  }
  if (registro.expiraEn < new Date()) {
    return { ok: false, error: "El enlace expiró. Pedí uno nuevo." };
  }
  if (!registro.usuario.activo) {
    return {
      ok: false,
      error: "La cuenta está desactivada. Comunicate con la administración.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: registro.usuarioId },
      data: { passwordHash, intentosFallidos: 0, bloqueadoHasta: null },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data: { usadoEn: new Date() },
    }),
    // Invalidar otros tokens activos del mismo usuario
    prisma.passwordResetToken.updateMany({
      where: {
        usuarioId: registro.usuarioId,
        usadoEn: null,
        id: { not: registro.id },
      },
      data: { usadoEn: new Date() },
    }),
  ]);

  await registrarAuditoria({
    modulo: AUDIT_MODULOS.AUTH,
    accion: "recupero_completado",
    recursoTipo: "Usuario",
    recursoId: registro.usuarioId,
    usuarioId: registro.usuarioId,
    detalle: registro.usuario.email,
  });

  return { ok: true };
}
