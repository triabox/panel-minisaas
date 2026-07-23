import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import type { StorageDriver } from "./driver";
import { construirUrlFirmada } from "./signed-url";

/**
 * Driver de almacenamiento local. Guarda los archivos en una carpeta
 * `uploads/` dentro del repo (ignorada por git).
 *
 * En producción (Supabase Storage), reemplazar por `SupabaseStorageDriver`.
 */
export class LocalStorageDriver implements StorageDriver {
  private rootDir: string;
  private baseUrl: string | undefined;

  constructor(opts?: { rootDir?: string; baseUrl?: string }) {
    this.rootDir =
      opts?.rootDir ?? path.resolve(process.cwd(), "uploads");
    this.baseUrl = opts?.baseUrl;
  }

  async upload({
    bucket,
    pathHint,
    file,
    contentType,
  }: Parameters<StorageDriver["upload"]>[0]) {
    // Sanitizamos el path y agregamos un sufijo aleatorio para evitar
    // colisiones cuando se sube el mismo nombre dos veces.
    const safe = sanitizar(pathHint);
    const ext = extensionDeMime(contentType) ?? (path.extname(safe) || "");
    const sinExt = safe.replace(/\.[^.]+$/, "");
    const sufijo = crypto.randomBytes(4).toString("hex");
    const finalRel = path.posix.join(bucket, `${sinExt}.${sufijo}${ext}`);

    const absPath = path.join(this.rootDir, finalRel);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, file);

    return { key: finalRel, size: file.byteLength };
  }

  async getSignedUrl({
    key,
    expiresInSeconds,
  }: Parameters<StorageDriver["getSignedUrl"]>[0]) {
    return construirUrlFirmada({
      key,
      baseUrl: this.baseUrl,
      expiresInSeconds,
    });
  }

  async delete(key: string) {
    const absPath = path.join(this.rootDir, key);
    try {
      await fs.unlink(absPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  async exists(key: string) {
    const absPath = path.join(this.rootDir, key);
    try {
      await fs.access(absPath);
      return true;
    } catch {
      return false;
    }
  }

  /** Solo para uso interno del endpoint que sirve archivos. */
  async readStream(key: string): Promise<Buffer> {
    const absPath = path.join(this.rootDir, key);
    return fs.readFile(absPath);
  }
}

function sanitizar(p: string): string {
  // Quitar segmentos peligrosos (`..`, espacios raros) y normalizar slashes.
  return p
    .replace(/\\/g, "/")
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .map((seg) =>
      seg
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_"),
    )
    .join("/");
}

function extensionDeMime(mime: string): string | null {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[mime.toLowerCase()] ?? null;
}
