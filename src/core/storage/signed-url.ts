import crypto from "node:crypto";

const ALGO = "sha256";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET debe estar configurado para firmar URLs de storage.",
    );
  }
  return secret;
}

export function firmarPayload(payload: string): string {
  return crypto.createHmac(ALGO, getSecret()).update(payload).digest("hex");
}

/**
 * Verifica una firma HMAC en tiempo constante para evitar ataques de timing.
 */
export function verificarFirma(payload: string, firma: string): boolean {
  const esperada = firmarPayload(payload);
  if (esperada.length !== firma.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(esperada, "hex"),
    Buffer.from(firma, "hex"),
  );
}

/**
 * Construye una URL firmada `/api/storage/{key}?expires=...&sig=...`.
 * El `key` debe estar URL-encodeado para soportar paths con slashes.
 */
export function construirUrlFirmada(input: {
  key: string;
  baseUrl?: string;
  expiresInSeconds?: number;
}): string {
  const expiresAt = Math.floor(Date.now() / 1000) + (input.expiresInSeconds ?? 300);
  const payload = `${input.key}:${expiresAt}`;
  const sig = firmarPayload(payload);
  const base = input.baseUrl ?? "";
  return `${base}/api/storage/${encodeURIComponent(input.key)}?expires=${expiresAt}&sig=${sig}`;
}

/**
 * Valida que una URL firmada sea legítima y no esté expirada.
 */
export function validarUrlFirmada(input: {
  key: string;
  expires: string | null;
  sig: string | null;
}): { ok: true } | { ok: false; razon: "missing" | "expired" | "invalid" } {
  if (!input.expires || !input.sig) return { ok: false, razon: "missing" };

  const expiresAt = Number(input.expires);
  if (!Number.isFinite(expiresAt))
    return { ok: false, razon: "invalid" };

  if (expiresAt < Math.floor(Date.now() / 1000))
    return { ok: false, razon: "expired" };

  const payload = `${input.key}:${expiresAt}`;
  if (!verificarFirma(payload, input.sig))
    return { ok: false, razon: "invalid" };

  return { ok: true };
}
