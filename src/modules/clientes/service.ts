/**
 * Lógica de lectura de clientes con "actor" explícito, compartida por la UI
 * (server actions) y la capa MCP. NO es "use server" (no se expone al cliente).
 */
import { prisma } from "@/core/lib/prisma";
import type { ComboboxOption } from "@/core/ui/combobox";

import type { Actor } from "@/modules/_shared/actor";
import { obtenerCapacidad } from "@/modules/capacidad/actions";
import { horasHombrePorClienteEsteMes } from "@/modules/tickets/metricas";
import { calcularRiesgo } from "./riesgo";

export type ClienteListado = {
  id: string;
  negocio: string;
  rubro: string | null;
  sistema: string | null;
  contactoNombre: string | null;
  abonoMensual: number;
  moneda: string;
  estado: string;
  estadoPago: string;
  horasMes: number;
  umbralHorasCliente: number;
  enRiesgo: boolean;
  motivosRiesgo: string[];
};

/** Listado con riesgo derivado por cliente. Ordena activos primero. */
export async function listarClientesConActor(
  actor: Actor | null,
): Promise<ClienteListado[]> {
  if (!actor) return [];

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

/** Buscador server-side (excluye bajas). Usado por la UI y por MCP. */
export async function buscarClientesConActor(
  actor: Actor | null,
  query: string,
): Promise<ComboboxOption[]> {
  if (!actor) return [];
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
