import { describe, expect, it } from "vitest";
import { extrairDataNotificacao } from "../shared/food-fraud";
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
    expect(extrairDataNotificacao("Alert 2026-06-04 farinha")).toBe("2026-06-04");
    expect(extrairDataNotificacao("Alert 04/06/2026 farinha")).toBe("2026-06-04");
  });

  it("normalizes Portuguese month names", () => {
    expect(extrairDataNotificacao("Notificação de 4 de junho de 2026 — farinha")).toBe("2026-06-04");
  });
});
