import { describe, expect, it } from "vitest";
import { listarValidacoesRececao } from "../shared/rececao-validacoes";

describe("validações apresentadas no detalhe da receção", () => {
  it("apresenta todos os pontos de controlo e preserva os resultados registados", () => {
    const validacoes = listarValidacoesRececao({
      temperaturaMpSaco: { estado: "c", valor: 18.5 },
      limpeza: "nc",
      numeroSelo: "SEL-24",
    });
    expect(validacoes).toHaveLength(12);
    expect(validacoes.find(item => item.label === "Temperatura")).toMatchObject({ estado: "c", valor: "18.5 °C" });
    expect(validacoes.find(item => item.label === "Limpeza")?.estado).toBe("nc");
    expect(validacoes.find(item => item.label === "N.º de selo")).toMatchObject({ estado: "registado", valor: "SEL-24" });
  });
});
