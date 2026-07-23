import { LocalStorageDriver } from "./local-driver";
import { SupabaseStorageDriver } from "./supabase-driver";
import type { StorageDriver } from "./driver";

let cached: StorageDriver | null = null;

/**
 * Devuelve el driver de storage configurado para el entorno actual.
 *
 * - `local` (default en dev): filesystem `uploads/`.
 * - `supabase` (prod): Supabase Storage con buckets privados y URLs
 *   firmadas. Requiere `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY`.
 */
export function getStorage(): StorageDriver {
  if (cached) return cached;

  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") {
    cached = new LocalStorageDriver();
  } else if (driver === "supabase") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "STORAGE_DRIVER='supabase' requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY.",
      );
    }
    cached = new SupabaseStorageDriver({ supabaseUrl, serviceRoleKey });
  } else {
    throw new Error(
      `STORAGE_DRIVER='${driver}' no está implementado. Usá 'local' o 'supabase'.`,
    );
  }
  return cached;
}

/** Solo para tests: limpia el driver cacheado. */
export function _resetStorageCache() {
  cached = null;
}

export { BUCKETS } from "./driver";
export type { StorageDriver, BucketName } from "./driver";
