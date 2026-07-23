import { prisma } from "@/core/lib/prisma";

/**
 * ¿La cuenta sigue vigente? Se consulta periódicamente DESPUÉS del login
 * (ver callback jwt en core/auth): así, desactivar o bloquear un usuario
 * lo saca del sistema en el próximo request (con el throttle configurado),
 * en lugar de esperar a que venza el JWT.
 *
 * Devuelve los roles actuales (los cambios de rol también impactan sin
 * re-login) o null si la cuenta ya no puede operar.
 */
export async function validarUsuarioVigente(
  usuarioId: string,
): Promise<{ roles: string[] } | null> {
  if (!usuarioId) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      activo: true,
      bloqueadoHasta: true,
      roles: { select: { rol: { select: { codigo: true } } } },
    },
  });

  if (!usuario || !usuario.activo) return null;
  if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
    return null;
  }

  return { roles: usuario.roles.map((r) => r.rol.codigo) };
}
