/**
 * Contrato de chequeos de flujos críticos (core/salud/flujos):
 * estados, excepción→fallo, timeout, y auth del handler.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  ejecutarChequeos,
  flujosHandler,
  peorEstado,
  type ChequeoFlujo,
} from "@/core/salud/flujos";

const okCheck: ChequeoFlujo = {
  id: "ok",
  nombre: "Siempre ok",
  correr: async () => ({ estado: "ok" }),
};

describe("peorEstado", () => {
  it("gana el más grave", () => {
    expect(peorEstado(["ok", "degradado", "ok"])).toBe("degradado");
    expect(peorEstado(["degradado", "fallo"])).toBe("fallo");
    expect(peorEstado([])).toBe("ok");
  });
});

describe("ejecutarChequeos", () => {
  it("junta resultados y calcula el peor estado", async () => {
    const r = await ejecutarChequeos([
      okCheck,
      {
        id: "deg",
        nombre: "Degradado",
        correr: async () => ({ estado: "degradado", detalle: "lento" }),
      },
    ]);
    expect(r.peorEstado).toBe("degradado");
    expect(r.chequeos).toHaveLength(2);
    expect(r.chequeos.find((c) => c.id === "deg")?.detalle).toBe("lento");
  });

  it("una excepción se convierte en fallo con el mensaje", async () => {
    const r = await ejecutarChequeos([
      okCheck,
      {
        id: "boom",
        nombre: "Explota",
        correr: async () => {
          throw new Error("la DB no responde");
        },
      },
    ]);
    expect(r.peorEstado).toBe("fallo");
    expect(r.chequeos.find((c) => c.id === "boom")?.detalle).toContain(
      "la DB no responde",
    );
  });
});

describe("flujosHandler (auth)", () => {
  const original = process.env.FLOTA_TOKEN;
  afterEach(() => {
    if (original === undefined) delete process.env.FLOTA_TOKEN;
    else process.env.FLOTA_TOKEN = original;
  });

  const req = (auth?: string) =>
    new Request("http://test/api/health/flujos", {
      headers: auth ? { authorization: auth } : {},
    });

  it("responde 404 si FLOTA_TOKEN no está configurado", async () => {
    delete process.env.FLOTA_TOKEN;
    const res = await flujosHandler(req("Bearer lo-que-sea"), [okCheck]);
    expect(res.status).toBe(404);
  });

  it("responde 401 con token inválido", async () => {
    process.env.FLOTA_TOKEN = "token-secreto-de-flota-123";
    const res = await flujosHandler(req("Bearer incorrecto"), [okCheck]);
    expect(res.status).toBe(401);
  });

  it("responde 200 con los chequeos si el token es válido", async () => {
    process.env.FLOTA_TOKEN = "token-secreto-de-flota-123";
    const res = await flujosHandler(
      req("Bearer token-secreto-de-flota-123"),
      [okCheck],
      { sistema: "test", template: "3" },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sistema).toBe("test");
    expect(body.peorEstado).toBe("ok");
    expect(body.chequeos).toHaveLength(1);
  });
});
