import { NextResponse } from "next/server";

import { auth } from "@/core/auth";
import { prisma } from "@/core/lib/prisma";
import { LocalStorageDriver } from "@/core/storage/local-driver";
import { validarUrlFirmada } from "@/core/storage/signed-url";
import { tieneRolGestion } from "@/core/permisos";

const driver = new LocalStorageDriver();

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  request: Request,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { key: keyParts } = await ctx.params;
  const key = decodeURIComponent(keyParts.join("/"));

  // Defensa en profundidad: rechazar keys con segmentos peligrosos
  // antes de tocar la DB o el filesystem.
  const segmentos = key.split("/");
  if (
    segmentos.some(
      (s) => s === "" || s === "." || s === ".." || s.includes("\\"),
    )
  ) {
    return NextResponse.json(
      { error: "Key inválido." },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const expires = url.searchParams.get("expires");
  const sig = url.searchParams.get("sig");

  const validacion = validarUrlFirmada({ key, expires, sig });
  if (!validacion.ok) {
    return NextResponse.json(
      { error: `URL inválida: ${validacion.razon}` },
      { status: 403 },
    );
  }

  const documento = await prisma.documento.findFirst({
    where: { archivoUrl: key },
    select: { personaId: true },
  });

  if (!documento) {
    return NextResponse.json(
      { error: "Archivo no encontrado." },
      { status: 404 },
    );
  }

  const esGestion = tieneRolGestion(session.user.roles);
  let esDuenia = false;
  if (!esGestion) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { personaId: true },
    });
    esDuenia = usuario?.personaId === documento.personaId;
  }
  if (!esGestion && !esDuenia) {
    return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  }

  if (!(await driver.exists(key))) {
    return NextResponse.json(
      { error: "Archivo no encontrado." },
      { status: 404 },
    );
  }

  const buffer = await driver.readStream(key);
  const ext = key.slice(key.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        key.slice(key.lastIndexOf("/") + 1),
      )}"`,
    },
  });
}
