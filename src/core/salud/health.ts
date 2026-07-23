import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { logger } from "@/core/lib/logger";
import { prisma } from "@/core/lib/prisma";

let templateVersionCache: string | null = null;

function templateVersion(): string {
  if (templateVersionCache) return templateVersionCache;
  try {
    templateVersionCache = readFileSync(
      join(process.cwd(), "TEMPLATE_VERSION"),
      "utf8",
    ).trim();
  } catch {
    templateVersionCache = "desconocida";
  }
  return templateVersionCache;
}

/**
 * Handler del endpoint /api/health. Lo consume el monitor de uptime de la
 * flota: responde 200 con DB viva, 503 si la DB no contesta.
 */
export async function healthHandler(): Promise<NextResponse> {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (err) {
    logger.error("health: la base de datos no responde", err);
  }

  const body = {
    ok: db,
    db,
    version: process.env.npm_package_version ?? "0.0.0",
    template: templateVersion(),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: db ? 200 : 503 });
}
