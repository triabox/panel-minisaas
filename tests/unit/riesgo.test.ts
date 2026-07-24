/**
 * Unit test de la lógica pura de riesgo del cliente (sin DB ni auth).
 * El riesgo es DERIVADO: pago demorado/vencido o exceso del umbral de horas.
 */
import { describe, expect, it } from "vitest";

import { calcularRiesgo } from "@/modules/clientes/riesgo";

const UMBRAL = 2; // 120 h / 60 clientes

describe("calcularRiesgo (función pura)", () => {
  it("sin causas: no está en riesgo", () => {
    const r = calcularRiesgo({
      estadoPago: "al_dia",
      horasMes: 1.5,
      umbralHorasCliente: UMBRAL,
    });
    expect(r.enRiesgo).toBe(false);
    expect(r.motivos).toHaveLength(0);
  });

  it("pago demorado enciende el riesgo", () => {
    const r = calcularRiesgo({
      estadoPago: "demorado",
      horasMes: 0,
      umbralHorasCliente: UMBRAL,
    });
    expect(r.enRiesgo).toBe(true);
    expect(r.motivos.join()).toMatch(/demorado/i);
  });

  it("pago vencido enciende el riesgo", () => {
    const r = calcularRiesgo({
      estadoPago: "vencido",
      horasMes: 0,
      umbralHorasCliente: UMBRAL,
    });
    expect(r.enRiesgo).toBe(true);
    expect(r.motivos.join()).toMatch(/vencido/i);
  });

  it("exceder el umbral de horas enciende el riesgo", () => {
    const r = calcularRiesgo({
      estadoPago: "al_dia",
      horasMes: 2.5,
      umbralHorasCliente: UMBRAL,
    });
    expect(r.enRiesgo).toBe(true);
    expect(r.motivos.join()).toMatch(/umbral/i);
  });

  it("justo en el umbral NO enciende (estricto mayor)", () => {
    const r = calcularRiesgo({
      estadoPago: "al_dia",
      horasMes: 2,
      umbralHorasCliente: UMBRAL,
    });
    expect(r.enRiesgo).toBe(false);
  });

  it("acumula múltiples motivos (pago + horas)", () => {
    const r = calcularRiesgo({
      estadoPago: "demorado",
      horasMes: 3,
      umbralHorasCliente: UMBRAL,
    });
    expect(r.enRiesgo).toBe(true);
    expect(r.motivos).toHaveLength(2);
  });
});
