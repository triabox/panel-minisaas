"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/core/auth";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { puedeOperar, tieneRolGestion } from "@/core/permisos";
import type { ComboboxOption } from "@/core/ui/combobox";

import { obtenerCapacidad } from "@/modules/capacidad/actions";
import { horasHombrePorClienteEsteMes } from "@/modules/tickets/metricas";
import { cambioEstadoSchema, clienteInputSchema } from "./schemas";
import { calcularRiesgo } from "./riesgo";

const AUDIT_MODULO = "clientes";

async function exigirPermisoOperacion() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!puedeOperar(session.user.roles)) {
    throw new Error("No tenés permiso para operar sobre clientes.");
  }
  return session.user;
}

/**
 * Listado con riesgo DERIVADO por cliente: cruza estado de pago + horas del mes
 * contra el umbral vigente. Ordena activos primero, luego por nombre.
 */
export async function listarClientes() {
  const session = await auth();
  if (!session?.user) return [];

  const [clientes, horasMap, cap] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: [{ estado: "asc" }, { negocio: "asc" }],
      include: { rubro: { select: { nombre: true } } },
    }),
    horasHombrePorClienteEsteMes(),
    obtenerCapacidad(),
  ]);

  return clientes.map((c) => {
    const horasMes = horasMap.get(c.id) ?? 0;
    const riesgo = calcularRiesgo({
      estadoPago: c.estadoPago,
      horasMes,
      umbralHorasCliente: cap.umbralHorasCliente,
    });
    return {
      id: c.id,
      negocio: c.negocio,
      rubro: c.rubro?.nombre ?? null,
      sistema: c.sistema,
      contactoNombre: c.contactoNombre,
      abonoMensual: c.abonoMensual,
      moneda: c.moneda,
      estado: c.estado,
      estadoPago: c.estadoPago,
      horasMes,
      umbralHorasCliente: cap.umbralHorasCliente,
      enRiesgo: riesgo.enRiesgo,
      motivosRiesgo: riesgo.motivos,
    };
  });
}

export async function obtenerCliente(id: string) {
  const session = await auth();
  if (!session?.user || !id) return null;

  const c = await prisma.cliente.findUnique({ where: { id } });
  if (!c) return null;
  return {
    id: c.id,
    negocio: c.negocio,
    rubroId: c.rubroId,
    sistema: c.sistema,
    contactoNombre: c.contactoNombre,
    contactoEmail: c.contactoEmail,
    contactoTelefono: c.contactoTelefono,
    fechaAlta: c.fechaAlta,
    abonoMensual: c.abonoMensual,
    moneda: c.moneda,
    estado: c.estado,
    estadoPago: c.estadoPago,
    notas: c.notas,
  };
}

/**
 * Buscador server-side para el selector de clientes (p.ej. al cargar un ticket).
 * Excluye a los dados de baja. Nunca lista todo: filtra por texto.
 */
export async function buscarClientes(query: string): Promise<ComboboxOption[]> {
  const session = await auth();
  if (!session?.user) return [];
  const q = query.trim();
  if (q.length < 2) return [];

  const clientes = await prisma.cliente.findMany({
    where: {
      estado: { not: "baja" },
      negocio: { contains: q, mode: "insensitive" },
    },
    orderBy: { negocio: "asc" },
    take: 20,
    include: { rubro: { select: { nombre: true } } },
  });

  return clientes.map((c) => ({
    value: c.id,
    label: c.negocio,
    hint: c.rubro?.nombre ?? undefined,
  }));
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

  const cliente = await prisma.cliente.create({
    data: parsed.data,
    select: { id: true },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "crear",
    recursoTipo: "Cliente",
    recursoId: cliente.id,
    valorNuevo: parsed.data,
    detalle: parsed.data.negocio,
  });

  revalidatePath("/clientes");
  revalidatePath("/inicio");
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

  const anterior = await prisma.cliente.findUnique({ where: { id } });
  if (!anterior) return { ok: false, error: "Cliente no encontrado." };

  await prisma.cliente.update({ where: { id }, data: parsed.data });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "actualizar",
    recursoTipo: "Cliente",
    recursoId: id,
    valorAnterior: {
      negocio: anterior.negocio,
      abonoMensual: anterior.abonoMensual,
      estado: anterior.estado,
      estadoPago: anterior.estadoPago,
    },
    valorNuevo: parsed.data,
    detalle: parsed.data.negocio,
  });

  revalidatePath("/clientes");
  revalidatePath("/inicio");
  return { ok: true, data: undefined };
}

/** Cambio de estado comercial: activar / pausar / dar de baja (baja lógica). */
export async function cambiarEstadoCliente(
  id: string,
  input: unknown,
): Promise<ActionResult<{ estado: string }>> {
  await exigirPermisoOperacion();

  const parsed = cambioEstadoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Estado inválido." };

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) return { ok: false, error: "Cliente no encontrado." };

  const actualizado = await prisma.cliente.update({
    where: { id },
    data: { estado: parsed.data.estado },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "cambiar_estado",
    recursoTipo: "Cliente",
    recursoId: id,
    valorAnterior: { estado: cliente.estado },
    valorNuevo: { estado: actualizado.estado },
    detalle: cliente.negocio,
  });

  revalidatePath("/clientes");
  revalidatePath("/inicio");
  return { ok: true, data: { estado: actualizado.estado } };
}

/** Eliminación real (borra el cliente y sus tickets en cascada) — solo gestión. */
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
    detalle: cliente.negocio,
  });

  revalidatePath("/clientes");
  revalidatePath("/inicio");
  return { ok: true, data: undefined };
}
