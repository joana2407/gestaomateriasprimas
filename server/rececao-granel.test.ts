import { describe, expect, it } from "vitest";
import { marcarControlosGranelNaoAplicaveis, prepararControlosGranel } from "../shared/rececao-granel";

describe("controlos exclusivos de MP a granel", () => {
  it("marca como não aplicáveis os campos de granel para MP em saco", () => {
    expect(marcarControlosGranelNaoAplicaveis({ limpeza: "c" })).toMatchObject({
      limpeza: "c", numeroSelo: "N/A", numeroSilo: "N/A", crivo: "na", fechoBocaCarga: "na",
    });
  });

  it("prepara novamente os campos vazios quando a MP é recebida a granel", () => {
    expect(prepararControlosGranel({ numeroSelo: "N/A", numeroSilo: "N/A", crivo: "na", fechoBocaCarga: "na" })).toMatchObject({
      numeroSelo: "", numeroSilo: "", crivo: undefined, fechoBocaCarga: undefined,
    });
  });
});
