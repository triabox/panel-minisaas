/**
 * Geocoding con Nominatim (OpenStreetMap) — gratis, sin API key. Server-only.
 * Uso liviano y manual; respetamos su política con un User-Agent identificable
 * y timeout corto. Falla suave: si no resuelve, devuelve null (el prospecto se
 * crea igual, sin pin).
 */
import { logger } from "@/core/lib/logger";

export async function geocodeDireccion(
  direccion: string,
): Promise<{ latitud: number; longitud: number } | null> {
  const q = direccion.trim();
  if (q.length < 4) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "panel-minisaas/1.0 (uso interno)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data: Array<{ lat: string; lon: string }> = await res.json();
    const hit = data[0];
    if (!hit) return null;
    const latitud = Number.parseFloat(hit.lat);
    const longitud = Number.parseFloat(hit.lon);
    if (Number.isNaN(latitud) || Number.isNaN(longitud)) return null;
    return { latitud, longitud };
  } catch (err) {
    logger.warn("geocoding falló", {
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
