import { describe, expect, it } from "vitest";
import {
  calcularTriagemFoodFraud,
  extrairDataNotificacao,
} from "../shared/food-fraud";
import { calcularRiscoFoodFraud } from "./routers/foodFraud";

describe("Food Fraud risk matrix", () => {
  it("calculates a low risk for 1 x 1", () => {
    expect(calcularRiscoFoodFraud(1, 1)).toEqual({ score: 1, nivel: "Baixo" });
  });

  it("calculates a medium risk for 2 x 2", () => {
    expect(calcularRiscoFoodFraud(2, 2)).toEqual({ score: 4, nivel: "Médio" });
  });

  it("calculates a high risk for 3 x 3", () => {
    expect(calcularRiscoFoodFraud(3, 3)).toEqual({ score: 9, nivel: "Alto" });
  });
});

describe("Food Fraud notification dates", () => {
  it("normalizes ISO and European dates", () => {
    expect(extrairDataNotificacao("Alert 2026-06-04 farinha")).toBe(
      "2026-06-04"
    );
    expect(extrairDataNotificacao("Alert 04/06/2026 farinha")).toBe(
      "2026-06-04"
    );
  });

  it("normalizes Portuguese month names", () => {
    expect(
      extrairDataNotificacao("Notificação de 4 de junho de 2026 — farinha")
    ).toBe("2026-06-04");
  });
});

describe("Food Fraud occurrence triage", () => {
  it("does not score an informative occurrence", () => {
    expect(
      calcularTriagemFoodFraud({ tipoRelacao: "informativa" })
    ).toMatchObject({
      estadoTriagem: "informativa",
      score: null,
      relevante: false,
    });
  });

  it("marks a linked occurrence with incomplete evidence as pending validation", () => {
    expect(
      calcularTriagemFoodFraud({
        tipoRelacao: "indireta",
        criterios: { p2: 2 },
      })
    ).toMatchObject({
      estadoTriagem: "por_validar",
      criterios: { p1: 2 },
      relevante: true,
    });
  });

  it("applies the direct-link prevalence rule and requires action for high impact", () => {
    expect(
      calcularTriagemFoodFraud({
        tipoRelacao: "direta",
        criterios: { p2: 1, p3: 1, i1: 3, i2: 3, i3: 3, i4: 3 },
      })
    ).toMatchObject({
      estadoTriagem: "avaliada",
      probabilidade: 2,
      impacto: 3,
      score: 6,
      nivel: "Alto",
      acaoRequerida: true,
      regraPrevalencia: "impacto_direto",
    });
  });
});
