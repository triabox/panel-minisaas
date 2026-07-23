import { describe, expect, it } from "vitest";
import { cn } from "@/core/lib/utils";

describe("cn() — class name helper", () => {
  it("concatena clases simples", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filtra falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("permite arrays anidados (clsx)", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("acepta objetos condicionales", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });

  it("dedupea clases Tailwind con tailwind-merge", () => {
    // 'p-4' debería ganar a 'p-2' (es la última)
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("dedupea colores Tailwind con tailwind-merge", () => {
    expect(cn("text-primary-700", "text-primary-900")).toBe("text-primary-900");
  });
});
