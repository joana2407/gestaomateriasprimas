import { describe, expect, it } from "vitest";
import { validarTransferenciaMp } from "../shared/mp-transferencia";

describe("validarTransferenciaMp", () => {
  it("aceita fábricas de origem e destino distintas", () => {
    expect(() => validarTransferenciaMp({ fabricaOrigemId: 1, fabricaDestinoId: 2, manterNaOrigem: false })).not.toThrow();
  });

  it("impede transferências para a própria fábrica", () => {
    expect(() => validarTransferenciaMp({ fabricaOrigemId: 2, fabricaDestinoId: 2, manterNaOrigem: true })).toThrow("destino deve ser diferente");
  });

  it("exige identificadores inteiros de fábrica", () => {
    expect(() => validarTransferenciaMp({ fabricaOrigemId: 1.5, fabricaDestinoId: 2, manterNaOrigem: false })).toThrow("Selecione as fábricas");
  });
});
