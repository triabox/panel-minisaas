import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { _resetEmailDriverCache, enviarEmail, getEmailDriver } from "@/core/lib/email";
import {
  plantillaRecuperoContrasena,
} from "@/core/lib/email-templates";

describe("email driver", () => {
  beforeEach(() => {
    _resetEmailDriverCache();
  });
  afterEach(() => {
    _resetEmailDriverCache();
  });

  it("en NODE_ENV=test usa el log driver y devuelve ok+id", async () => {
    expect(process.env.NODE_ENV).toBe("test");
    const res = await enviarEmail({
      to: "alguien@example.com",
      subject: "Hola",
      html: "<p>Hola</p>",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.id).toMatch(/^log-/);
  });

  it("getEmailDriver es idempotente (cachea instancia)", () => {
    const a = getEmailDriver();
    const b = getEmailDriver();
    expect(a).toBe(b);
  });
});

describe("email templates", () => {
  it("plantillaRecuperoContrasena escapa HTML del nombre", () => {
    const tpl = plantillaRecuperoContrasena({
      nombrePersona: "Ana <script>alert(1)</script>",
      enlace: "https://misistema.test/recuperar?token=abc",
      vencimientoMinutos: 30,
    });
    expect(tpl.html).not.toContain("<script>alert(1)</script>");
    expect(tpl.html).toContain("&lt;script&gt;");
  });

  it("plantillaRecuperoContrasena incluye enlace y vencimiento", () => {
    const tpl = plantillaRecuperoContrasena({
      nombrePersona: "Cami",
      enlace: "https://misistema.test/recuperar?token=abc",
      vencimientoMinutos: 30,
    });
    expect(tpl.html).toContain("https://misistema.test/recuperar?token=abc");
    expect(tpl.html).toContain("30 minutos");
    expect(tpl.text).toContain("30 minutos");
  });
});
