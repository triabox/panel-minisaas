import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  construirUrlFirmada,
  validarUrlFirmada,
  firmarPayload,
  verificarFirma,
} from "@/core/storage/signed-url";

const ORIG_SECRET = process.env.AUTH_SECRET;

beforeEach(() => {
  process.env.AUTH_SECRET = "este-es-un-secreto-de-test-1234567890";
});

afterEach(() => {
  if (ORIG_SECRET) process.env.AUTH_SECRET = ORIG_SECRET;
  else delete process.env.AUTH_SECRET;
});

describe("firmarPayload + verificarFirma", () => {
  it("firma y verifica el mismo payload", () => {
    const sig = firmarPayload("hello:1234");
    expect(verificarFirma("hello:1234", sig)).toBe(true);
  });

  it("rechaza firmas de payloads distintos", () => {
    const sig = firmarPayload("hello:1234");
    expect(verificarFirma("hello:5678", sig)).toBe(false);
  });

  it("rechaza firmas alteradas", () => {
    const sig = firmarPayload("hello:1234");
    const alterada = sig.slice(0, -2) + "00";
    expect(verificarFirma("hello:1234", alterada)).toBe(false);
  });
});

describe("construirUrlFirmada", () => {
  it("construye URL con expires y sig", () => {
    const url = construirUrlFirmada({ key: "documentos-personas/abc/dni.pdf" });
    expect(url).toMatch(/^\/api\/storage\//);
    expect(url).toContain("expires=");
    expect(url).toContain("sig=");
  });

  it("respeta baseUrl si se pasa", () => {
    const url = construirUrlFirmada({
      key: "test/x.pdf",
      baseUrl: "https://misistema.example.com",
    });
    expect(url).toMatch(/^https:\/\/misistema\.example\.com\/api\/storage\//);
  });
});

describe("validarUrlFirmada", () => {
  it("aprueba una URL recién firmada", () => {
    const key = "documentos-personas/123/dni.pdf";
    const url = construirUrlFirmada({ key });
    const sp = new URL("http://x" + url).searchParams;
    const res = validarUrlFirmada({
      key,
      expires: sp.get("expires"),
      sig: sp.get("sig"),
    });
    expect(res.ok).toBe(true);
  });

  it("rechaza URL sin sig o expires", () => {
    const r1 = validarUrlFirmada({ key: "x", expires: null, sig: "abc" });
    expect(r1.ok).toBe(false);
    const r2 = validarUrlFirmada({ key: "x", expires: "100", sig: null });
    expect(r2.ok).toBe(false);
  });

  it("rechaza URL expirada", () => {
    const key = "test/old.pdf";
    const expires = String(Math.floor(Date.now() / 1000) - 1);
    const sig = firmarPayload(`${key}:${expires}`);
    const res = validarUrlFirmada({ key, expires, sig });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.razon).toBe("expired");
  });

  it("rechaza firma inválida", () => {
    const key = "test/x.pdf";
    const expires = String(Math.floor(Date.now() / 1000) + 300);
    const res = validarUrlFirmada({ key, expires, sig: "0".repeat(64) });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.razon).toBe("invalid");
  });

  it("una firma para un key NO sirve para otro key (incluso con mismo expires)", () => {
    const expires = String(Math.floor(Date.now() / 1000) + 300);
    const sig = firmarPayload(`key-a:${expires}`);
    const res = validarUrlFirmada({ key: "key-b", expires, sig });
    expect(res.ok).toBe(false);
  });
});
