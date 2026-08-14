import { describe, expect, it } from "vitest";
import { ARMAZENS_RECECAO, calcularConformidadeRececao } from "../shared/rececao-controlos";

describe("controlos de receção de matérias-primas", () => {
  it("disponibiliza os três armazéns definidos para cada unidade fabril", () => {
    expect(ARMAZENS_RECECAO.map(armazem => armazem.id)).toEqual(["ambiente_secos", "frio", "embalagens"]);
  });

  it("classifica a receção como conforme quando há controlos conformes e nenhum NC", () => {
    expect(calcularConformidadeRececao({ limpeza: "c", aspetoMacroscopico: "c", datasValidade: "na" })).toBe("conforme");
  });

  it("prioriza não conformidade quando qualquer ponto de controlo é NC", () => {
    expect(calcularConformidadeRececao({ limpeza: "c", materiasEstranhas: "nc", crivo: "na" })).toBe("nao_conforme");
  });

  it("mantém a receção pendente quando nenhum controlo aplicável foi preenchido", () => {
    expect(calcularConformidadeRececao({ limpeza: "na", crivo: "na" })).toBe("pendente");
  });

  it("inclui a temperatura da MP ensacada na decisão de conformidade", () => {
    expect(calcularConformidadeRececao({ temperaturaMpSaco: { estado: "nc", valor: 11.5 } })).toBe("nao_conforme");
  });
});
