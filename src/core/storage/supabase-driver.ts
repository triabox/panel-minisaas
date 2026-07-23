import crypto from "node:crypto";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { StorageDriver } from "./driver";

/**
 * Driver de Supabase Storage. Pensado para producción.
 *
 * Convención: cada `bucket` lógico (`documentos-personas`, `cv-profesores`,
 * `branding`) corresponde a un bucket de Supabase Storage. Todos privados
 * — el acceso siempre es vía URLs firmadas con expiración corta.
 */
export class SupabaseStorageDriver implements StorageDriver {
  private client: SupabaseClient;
  private defaultExpiresIn: number;

  constructor(opts: {
    supabaseUrl: string;
    serviceRoleKey: string;
    /** Expiración por defecto de las URLs firmadas (segundos). */
    defaultExpiresIn?: number;
  }) {
    this.client = createClient(opts.supabaseUrl, opts.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.defaultExpiresIn = opts.defaultExpiresIn ?? 5 * 60;
  }

  async upload({
    bucket,
    pathHint,
    file,
    contentType,
  }: Parameters<StorageDriver["upload"]>[0]) {
    const safe = sanitizar(pathHint);
    const ext = extensionDeMime(contentType) ?? (path.extname(safe) || "");
    const sinExt = safe.replace(/\.[^.]+$/, "");
    const sufijo = crypto.randomBytes(4).toString("hex");
    const finalKey = path.posix.join(`${sinExt}.${sufijo}${ext}`);

    const { error } = await this.client.storage
      .from(bucket)
      .upload(finalKey, file, {
        contentType,
        upsert: false,
      });
    if (error) {
      throw new Error(`Supabase upload falló: ${error.message}`);
    }
    return {
      key: `${bucket}/${finalKey}`,
      size: file.byteLength,
    };
  }

  async getSignedUrl({
    key,
    expiresInSeconds,
  }: Parameters<StorageDriver["getSignedUrl"]>[0]) {
    const { bucket, objectPath } = partir(key);
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(objectPath, expiresInSeconds ?? this.defaultExpiresIn);
    if (error || !data?.signedUrl) {
      throw new Error(
        `No se pudo generar URL firmada: ${error?.message ?? "sin signedUrl"}`,
      );
    }
    return data.signedUrl;
  }

  async delete(key: string) {
    const { bucket, objectPath } = partir(key);
    const { error } = await this.client.storage.from(bucket).remove([objectPath]);
    if (error) {
      // Si el archivo no existe Supabase devuelve OK con array vacío;
      // sólo tiramos error si fue una falla real de I/O / permiso.
      throw new Error(`Supabase delete falló: ${error.message}`);
    }
  }

  async exists(key: string) {
    const { bucket, objectPath } = partir(key);
    const dir = path.posix.dirname(objectPath);
    const file = path.posix.basename(objectPath);
    const { data, error } = await this.client.storage
      .from(bucket)
      .list(dir === "." ? undefined : dir, {
        search: file,
        limit: 1,
      });
    if (error) return false;
    return Boolean(data && data.some((item) => item.name === file));
  }
}

function partir(key: string): { bucket: string; objectPath: string } {
  const idx = key.indexOf("/");
  if (idx === -1) {
    throw new Error(`Key inválida (debe ser "bucket/path"): ${key}`);
  }
  return { bucket: key.slice(0, idx), objectPath: key.slice(idx + 1) };
}

function sanitizar(p: string): string {
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
