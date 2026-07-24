/**
 * Lógica compartida de tickets (UI + MCP). NO "use server".
 * `crearTicketCore` NO chequea permiso ni revalida: confía en que el caller ya
 * autorizó (la action lo hace con `exigirPermisoOperacion`; MCP con su token).
 */
import { prisma } from "@/core/lib/prisma";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";

import type { Actor } from "@/modules/_shared/actor";
import { ticketInputSchema } from "./schemas";

export async function crearTicketCore(
  actor: Actor,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ticketInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del ticket.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: parsed.data.clienteId },
    select: { id: true, negocio: true },
  });
  if (!cliente) return { ok: false, error: "El cliente elegido no existe." };

  const { fecha, ...resto } = parsed.data;
  const ticket = await prisma.ticket.create({
    data: { ...resto, ...(fecha ? { fecha } : {}) },
    select: { id: true },
  });

  await registrarAuditoria({
    modulo: "tickets",
    accion: "crear",
    recursoTipo: "Ticket",
    recursoId: ticket.id,
    valorNuevo: parsed.data,
    detalle: `${cliente.negocio} · ${parsed.data.tipo}`,
    usuarioId: actor.usuarioId,
  });

  return { ok: true, data: { id: ticket.id } };
}
