/**
 * Interfaz pluggable de almacenamiento de archivos.
 *
 * Permite tener un driver local (filesystem) para desarrollo y otro driver
 * Supabase Storage / S3 para producción, sin que la lógica de negocio cambie.
 *
 * Convención de keys:
 *   `{bucket}/{path}` — ej. `documentos-personas/abc123/dni-frente.pdf`
 *
 * Las URLs firmadas son **temporales** (5 min por defecto) — pensadas para
 * descargas autenticadas que expiran rápido.
 */
export interface StorageDriver {
  /**
   * Sube un archivo al storage. Devuelve la `key` final guardada (puede
   * incluir suffix de hash o normalización).
   */
  upload(input: {
    bucket: string;
    pathHint: string; // ej. `personaId/dni-frente.pdf`
    file: Uint8Array;
    contentType: string;
  }): Promise<{ key: string; size: number }>;

  /**
   * Devuelve una URL temporal firmada (con expiración) para descargar
   * el archivo. Apta para pasar al `<a href>` en cliente.
   */
  getSignedUrl(input: {
    key: string;
    expiresInSeconds?: number;
  }): Promise<string>;

  /** Elimina un archivo. Si no existe, no falla. */
  delete(key: string): Promise<void>;

  /** Verifica si un archivo existe (para healthchecks o reintentos). */
  exists(key: string): Promise<boolean>;
}

export const BUCKETS = {
  DOCUMENTOS: "documentos",
  BRANDING: "branding",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];
