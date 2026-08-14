import { describe, expect, it } from "vitest";
import { validarTransferenciaStock } from "../shared/transferencia-stock";

const transferenciaValida = {
  fabricaOrigemId: 1,
  fabricaDestinoId: 2,
  dataTransferencia: new Date("2026-08-14T12:00:00Z"),
  quantidade: 250,
  unidade: "kg" as const,
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

  it("impede transferências para a própria fábrica", () => {
    expect(() => validarTransferenciaStock({ ...transferenciaValida, fabricaDestinoId: 1 })).toThrow("destino deve ser diferente");
  });
});
