import { prisma } from "@/core/lib/prisma";
import { logger } from "@/core/lib/logger";

/**
 * Rate limiting con ventana fija, respaldado en la DB (funciona igual en
 * serverless, donde la memoria no se comparte entre instancias).
 *
 * Uso: `if (!(await permitirIntento(`login:ip:${ip}`, 20, 600))) return ...`
 *
 * Falla ABIERTO: si la DB no responde acá, deja pasar y loguea — el objetivo
 * es frenar abuso, no tirar el login por un hipo de infraestructura.
 */
export async function permitirIntento(
  clave: string,
  maxIntentos: number,
  ventanaSegundos: number,
): Promise<boolean> {
  const ahora = new Date();
  const inicioVentanaVigente = new Date(
    ahora.getTime() - ventanaSegundos * 1000,
  );

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const fila = await tx.rateLimit.findUnique({ where: { clave } });

      // Sin registro o ventana vencida → arranca ventana nueva.
      if (!fila || fila.ventanaInicio < inicioVentanaVigente) {
        await tx.rateLimit.upsert({
          where: { clave },
          update: { contador: 1, ventanaInicio: ahora },
          create: { clave, contador: 1, ventanaInicio: ahora },
        });
        return true;
      }

      if (fila.contador >= maxIntentos) return false;

      await tx.rateLimit.update({
        where: { clave },
        data: { contador: { increment: 1 } },
      });
      return true;
    });
    return resultado;
  } catch (err) {
    logger.warn("rate-limit no disponible, dejando pasar", {
      clave,
      err: err instanceof Error ? err.message : String(err),
    });
    return true;
  }
}

/** IP del request actual (mejor esfuerzo; "desconocida" fuera de un request). */
export async function ipDelRequest(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "desconocida"
    );
  } catch {
    return "desconocida";
  }
}
