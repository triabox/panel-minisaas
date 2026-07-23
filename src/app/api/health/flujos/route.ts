import { readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "@/core/lib/prisma";
import { flujosHandler, type ChequeoFlujo } from "@/core/salud/flujos";

export const dynamic = "force-dynamic";

/**
 * Chequeos de FLUJOS CRÍTICOS de este sistema (zona custom).
 *
 * Este archivo es el que cada hijo edita con sus propios flujos: reemplazá
 * el chequeo demo por los del negocio real (¿se puede reservar un turno?,
 * ¿se registran ventas?, etc.). Reglas: consultas baratas de solo lectura;
 * "pasivo" = latido de uso (¿hace cuánto que no ocurre X?), "activo" =
 * precondición (¿está configurado / responde Y?).
 */
const DIAS_DEGRADADO_SIN_ALTAS = 30;

const CHEQUEOS: ChequeoFlujo[] = [
  {
    id: "clientes-alta",
    nombre: "Alta de clientes (demo)",
    correr: async () => {
      const ultimo = await prisma.cliente.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      if (!ultimo) {
        return { estado: "ok", detalle: "Sin clientes cargados todavía." };
      }
      const dias = Math.floor(
        (Date.now() - ultimo.createdAt.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (dias > DIAS_DEGRADADO_SIN_ALTAS) {
        return {
          estado: "degradado",
          detalle: `Última alta hace ${dias} días.`,
        };
      }
      return { estado: "ok", detalle: `Última alta hace ${dias} días.` };
    },
  },
];

function templateVersion(): string {
  try {
    return readFileSync(join(process.cwd(), "TEMPLATE_VERSION"), "utf8").trim();
  } catch {
    return "desconocida";
  }
}

export async function GET(request: Request) {
  return flujosHandler(request, CHEQUEOS, { template: templateVersion() });
}
