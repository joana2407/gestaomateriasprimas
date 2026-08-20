import { describe, expect, it } from "vitest";
import { marcarConformidadeVeiculoNaoAplicavel, marcarControlosGranelNaoAplicaveis, mpElegivelParaRececaoAGranel, prepararConformidadeVeiculo, prepararControlosGranel } from "../shared/rececao-granel";

describe("controlos exclusivos de MP a granel", () => {
  it("marca como não aplicáveis os campos de granel para MP em saco", () => {
    expect(marcarControlosGranelNaoAplicaveis({ limpeza: "c" })).toMatchObject({
      limpeza: "c", tipoRececao: "saco", numeroSelo: "N/A", numeroSilo: "N/A", crivo: "na", fechoBocaCarga: "na",
    });
  });

  it("prepara novamente os campos vazios quando a MP é recebida a granel", () => {
    expect(prepararControlosGranel({ numeroSelo: "N/A", numeroSilo: "N/A", crivo: "na", fechoBocaCarga: "na" })).toMatchObject({
      tipoRececao: "granel", numeroSelo: "", numeroSilo: "", crivo: undefined, fechoBocaCarga: undefined,
    });
  });

  it("identifica apenas Farinha de Trigo 65, Centeio 130 e Pellets como elegíveis a granel", () => {
    expect(mpElegivelParaRececaoAGranel("Farinha de Trigo 65")).toBe(true);
    expect(mpElegivelParaRececaoAGranel("Farinha de Centeio 130")).toBe(true);
    expect(mpElegivelParaRececaoAGranel("Pellets de trigo")).toBe(true);
    expect(mpElegivelParaRececaoAGranel("Açúcar granulado")).toBe(false);
  });

  it("marca a conformidade do veículo como não aplicável numa receção a granel", () => {
    const controlos = marcarConformidadeVeiculoNaoAplicavel({ limpeza: "c", temperaturaMpSaco: { estado: "c", valor: 21 } });
    expect(controlos).toMatchObject({
      temperaturaMpSaco: { estado: "na", valor: null }, limpeza: "na", residuosInfestacao: "na", acondicionamento: "na",
    });
    expect(prepararConformidadeVeiculo(controlos).temperaturaMpSaco).toBeUndefined();
  });
});
