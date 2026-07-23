import { NextResponse } from "next/server";

import { logger } from "@/core/lib/logger";

/**
 * Contrato de monitoreo de FLUJOS CRÍTICOS de la flota.
 *
 * Cada sistema declara sus chequeos (zona custom, ver
 * src/app/api/health/flujos/route.ts) y el monitor central los consulta.
 * Dos clases de chequeo:
 *  - activos: precondiciones del flujo ("¿hay clases hoy?", "¿responde el storage?")
 *  - pasivos: latido de uso ("¿hace cuánto que nadie guarda una asistencia?")
 *
 * Regla: consultas BARATAS y de solo lectura. Nada de ejecutar el flujo real.
 */

export type EstadoChequeo = "ok" | "degradado" | "fallo";

export type ResultadoChequeo = {
  estado: EstadoChequeo;
  detalle?: string;
};

export type ChequeoFlujo = {
  /** Identificador estable (kebab-case): lo usa el monitor y las alertas. */
  id: string;
  /** Nombre humano para el tablero. */
  nombre: string;
  correr: () => Promise<ResultadoChequeo>;
};

const TIMEOUT_CHEQUEO_MS = 5_000;

const ORDEN_ESTADO: Record<EstadoChequeo, number> = {
  ok: 0,
  degradado: 1,
  fallo: 2,
};

export function peorEstado(estados: EstadoChequeo[]): EstadoChequeo {
  return estados.reduce<EstadoChequeo>(
    (peor, e) => (ORDEN_ESTADO[e] > ORDEN_ESTADO[peor] ? e : peor),
    "ok",
  );
}

/** Corre todos los chequeos con timeout individual; una excepción = fallo. */
export async function ejecutarChequeos(chequeos: ChequeoFlujo[]) {
  const resultados = await Promise.all(
    chequeos.map(async (chequeo) => {
      try {
        const resultado = await Promise.race([
          chequeo.correr(),
          new Promise<ResultadoChequeo>((_, reject) =>
            setTimeout(
              () => reject(new Error("timeout del chequeo")),
              TIMEOUT_CHEQUEO_MS,
            ),
          ),
        ]);
        return { id: chequeo.id, nombre: chequeo.nombre, ...resultado };
      } catch (err) {
        const detalle = err instanceof Error ? err.message : String(err);
        logger.warn("chequeo de flujo falló", { chequeo: chequeo.id, detalle });
        return {
          id: chequeo.id,
          nombre: chequeo.nombre,
          estado: "fallo" as const,
          detalle,
        };
      }
    }),
  );

  return {
    peorEstado: peorEstado(resultados.map((r) => r.estado)),
    chequeos: resultados,
  };
}

/**
 * Handler del endpoint /api/health/flujos. Protegido con el token de flota:
 * sin FLOTA_TOKEN configurado responde 404 (el sistema "no tiene" el
 * endpoint); con token inválido, 401.
 */
export async function flujosHandler(
  request: Request,
  chequeos: ChequeoFlujo[],
  extras?: { sistema?: string; template?: string },
): Promise<NextResponse> {
  const tokenConfigurado = process.env.FLOTA_TOKEN;
  if (!tokenConfigurado) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${tokenConfigurado}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resultado = await ejecutarChequeos(chequeos);

  return NextResponse.json(
    {
      sistema: extras?.sistema ?? process.env.NEXT_PUBLIC_APP_NAME ?? "sistema",
      template: extras?.template,
      ...resultado,
      timestamp: new Date().toISOString(),
    },
    // 200 siempre que el endpoint funcione: el semáforo va en el body.
    { status: 200 },
  );
}
