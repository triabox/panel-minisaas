import { headers } from "next/headers";

import { auth } from "@/core/auth";
import { logger } from "@/core/lib/logger";
import { prisma } from "@/core/lib/prisma";

export type AuditEvent = {
  modulo: string;
  accion: string;
  recursoTipo: string;
  recursoId?: string | null;
  valorAnterior?: unknown;
  valorNuevo?: unknown;
  exito?: boolean;
  detalle?: string;
  /**
   * Si se pasa, sobreescribe la sesión para casos donde la acción no tiene
   * sesión (p.ej. login fallido).
   */
  usuarioId?: string | null;
};

async function obtenerContexto(usuarioIdOverride?: string | null) {
  let usuarioId: string | null = usuarioIdOverride ?? null;
  if (!usuarioIdOverride) {
    try {
      const session = await auth();
      usuarioId = session?.user?.id ?? null;
    } catch {
      usuarioId = null;
    }
  }

  // Validar que el usuario existe (evita FK violation si la sesión apunta a
  // un id inexistente, p. ej. en tests con sesión mockeada).
  if (usuarioId) {
    const existe = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });
    if (!existe) usuarioId = null;
  }

  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    userAgent = h.get("user-agent");
  } catch {
    // headers() no disponible en algunos contextos (p. ej. tests)
  }
  return { usuarioId, ip, userAgent };
}

/**
 * Registra una entrada en AuditLog. Nunca lanza: si falla, sólo loggea
 * en consola para no romper la acción que estamos auditando.
 */
export async function registrarAuditoria(evento: AuditEvent): Promise<void> {
  try {
    const ctx = await obtenerContexto(evento.usuarioId);
    await prisma.auditLog.create({
      data: {
        usuarioId: ctx.usuarioId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        modulo: evento.modulo,
        accion: evento.accion,
        recursoTipo: evento.recursoTipo,
        recursoId: evento.recursoId ?? null,
        valorAnterior:
          evento.valorAnterior !== undefined
            ? (evento.valorAnterior as never)
            : undefined,
        valorNuevo:
          evento.valorNuevo !== undefined
            ? (evento.valorNuevo as never)
            : undefined,
        exito: evento.exito ?? true,
        detalle: evento.detalle,
      },
    });
  } catch (err) {
    logger.warn("no se pudo registrar evento de auditoría", {
      modulo: evento.modulo,
      accion: evento.accion,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Módulos transversales del núcleo. Los módulos de dominio de cada sistema
 * declaran su propio nombre de módulo en sus actions (evento.modulo acepta
 * cualquier string) — no agregar dominios acá.
 */
export const AUDIT_MODULOS = {
  AUTH: "auth",
  USUARIOS: "usuarios",
  PERSONAS: "personas",
  DOCUMENTOS: "documentos",
  PRIVACIDAD: "privacidad",
} as const;

export type AuditModulo = (typeof AUDIT_MODULOS)[keyof typeof AUDIT_MODULOS];
