import { describe, expect, it } from "vitest";
import { calcularQuantidadeDisponivel, validarTransferenciaStock } from "../shared/transferencia-stock";

const transferenciaValida = {
  rececaoOrigemId: 20,
  fabricaDestinoId: 2,
  dataTransferencia: new Date("2026-08-14T12:00:00Z"),
  quantidade: 250,
  responsavel: "Joana Pina",
  motivo: "Reposição de stock para produção",
};

describe("validarTransferenciaStock", () => {
  it("aceita um movimento físico completo entre fábricas distintas", () => {
    expect(() => validarTransferenciaStock(transferenciaValida)).not.toThrow();
  });

  it("exige uma quantidade física positiva", () => {
    expect(() => validarTransferenciaStock({ ...transferenciaValida, quantidade: 0 })).toThrow("quantidade superior");
  });

  it("exige responsável e motivo para preservar a rastreabilidade", () => {
    expect(() => validarTransferenciaStock({ ...transferenciaValida, responsavel: "", motivo: "" })).toThrow("responsável");
  });

  it("exige uma receção de origem identificada", () => {
    expect(() => validarTransferenciaStock({ ...transferenciaValida, rececaoOrigemId: 0 })).toThrow("receção e o lote");
  });

  it("calcula o saldo disponível sem permitir valores negativos", () => {
    expect(calcularQuantidadeDisponivel(100, 35)).toBe(65);
    expect(calcularQuantidadeDisponivel(100, 120)).toBe(0);
  });
});
