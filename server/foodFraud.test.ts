import { describe, expect, it } from "vitest";
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
