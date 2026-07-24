"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/core/auth";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { puedeOperar, tieneRolGestion } from "@/core/permisos";

import { ticketInputSchema } from "./schemas";
import { crearTicketCore } from "./service";

const AUDIT_MODULO = "tickets";

async function exigirPermisoOperacion() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!puedeOperar(session.user.roles)) {
    throw new Error("No tenés permiso para cargar horas.");
  }
  return session.user;
}

/** Últimos tickets cargados, con el nombre del cliente. */
export async function listarTickets() {
  const session = await auth();
  if (!session?.user) return [];

  const tickets = await prisma.ticket.findMany({
    orderBy: { fecha: "desc" },
    take: 200,
    include: { cliente: { select: { negocio: true } } },
  });

  return tickets.map((t) => ({
    id: t.id,
    clienteNegocio: t.cliente.negocio,
    tipo: t.tipo,
    descripcion: t.descripcion,
    horasHombre: t.horasHombre,
    tiempoIa: t.tiempoIa,
    automatizado: t.automatizado,
    fecha: t.fecha,
  }));
}

export async function obtenerTicket(id: string) {
  const session = await auth();
  if (!session?.user || !id) return null;

  const t = await prisma.ticket.findUnique({
    where: { id },
    include: { cliente: { select: { negocio: true } } },
  });
  if (!t) return null;
  return {
    id: t.id,
    clienteId: t.clienteId,
    clienteNegocio: t.cliente.negocio,
    tipo: t.tipo,
    descripcion: t.descripcion,
    horasHombre: t.horasHombre,
    tiempoIa: t.tiempoIa,
    automatizado: t.automatizado,
    fecha: t.fecha,
  };
}

export async function crearTicket(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await exigirPermisoOperacion();

  // La lógica vive en service.ts (compartida con la capa MCP).
  const res = await crearTicketCore(
    { usuarioId: user.id, roles: user.roles },
    input,
  );

  if (res.ok) {
    revalidatePath("/horas");
    revalidatePath("/clientes");
    revalidatePath("/inicio");
  }
  return res;
}

export async function actualizarTicket(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await exigirPermisoOperacion();
  if (!id) return { ok: false, error: "Falta el id." };

  const parsed = ticketInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del ticket.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const anterior = await prisma.ticket.findUnique({ where: { id } });
  if (!anterior) return { ok: false, error: "Ticket no encontrado." };

  const { fecha, ...resto } = parsed.data;
  await prisma.ticket.update({
    where: { id },
    data: { ...resto, ...(fecha ? { fecha } : {}) },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "actualizar",
    recursoTipo: "Ticket",
    recursoId: id,
    valorAnterior: {
      tipo: anterior.tipo,
      horasHombre: anterior.horasHombre,
      tiempoIa: anterior.tiempoIa,
      automatizado: anterior.automatizado,
    },
    valorNuevo: parsed.data,
  });

  revalidatePath("/horas");
  revalidatePath("/clientes");
  revalidatePath("/inicio");
  return { ok: true, data: undefined };
}

/** Eliminar un ticket — solo gestión (afecta métricas históricas). */
export async function eliminarTicket(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autenticado." };
  if (!tieneRolGestion(session.user.roles)) {
    return { ok: false, error: "No tenés permiso para eliminar tickets." };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { cliente: { select: { negocio: true } } },
  });
  if (!ticket) return { ok: false, error: "Ticket no encontrado." };

  await prisma.ticket.delete({ where: { id } });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "eliminar",
    recursoTipo: "Ticket",
    recursoId: id,
    valorAnterior: {
      clienteId: ticket.clienteId,
      tipo: ticket.tipo,
      horasHombre: ticket.horasHombre,
    },
    detalle: `${ticket.cliente.negocio} · ${ticket.tipo}`,
  });

  revalidatePath("/horas");
  revalidatePath("/clientes");
  revalidatePath("/inicio");
  return { ok: true, data: undefined };
}
