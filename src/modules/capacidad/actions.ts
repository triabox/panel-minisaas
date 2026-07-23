"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/core/auth";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import { tieneRolGestion } from "@/core/permisos";
import { capacidadInputSchema, type Capacidad } from "./schemas";

const AUDIT_MODULO = "capacidad";
const SINGLETON = "singleton";
const DEFAULTS = { horasSoporteMes: 120, clientesObjetivo: 60 };

/**
 * Lee la configuración de capacidad (fila única) y deriva el umbral de horas
 * por cliente. Si todavía no existe la fila, devuelve los defaults sin escribir
 * (la crea el seed o la primera edición).
 */
export async function obtenerCapacidad(): Promise<Capacidad> {
  const cfg = await prisma.configuracionCapacidad.findUnique({
    where: { id: SINGLETON },
  });
  const horasSoporteMes = cfg?.horasSoporteMes ?? DEFAULTS.horasSoporteMes;
  const clientesObjetivo = cfg?.clientesObjetivo ?? DEFAULTS.clientesObjetivo;
  return {
    horasSoporteMes,
    clientesObjetivo,
    umbralHorasCliente: horasSoporteMes / clientesObjetivo,
  };
}

export async function actualizarCapacidad(
  input: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autenticado." };
  if (!tieneRolGestion(session.user.roles)) {
    return { ok: false, error: "No tenés permiso para cambiar la capacidad." };
  }

  const parsed = capacidadInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const anterior = await prisma.configuracionCapacidad.findUnique({
    where: { id: SINGLETON },
  });

  await prisma.configuracionCapacidad.upsert({
    where: { id: SINGLETON },
    update: parsed.data,
    create: { id: SINGLETON, ...parsed.data },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULO,
    accion: "actualizar",
    recursoTipo: "ConfiguracionCapacidad",
    recursoId: SINGLETON,
    valorAnterior: anterior
      ? {
          horasSoporteMes: anterior.horasSoporteMes,
          clientesObjetivo: anterior.clientesObjetivo,
        }
      : undefined,
    valorNuevo: parsed.data,
  });

  revalidatePath("/configuracion/capacidad");
  revalidatePath("/inicio");
  revalidatePath("/clientes");
  return { ok: true, data: undefined };
}
