import { describe, expect, it } from "vitest";
import { avaliarValidadeMinimaRececao } from "../shared/rececao-validade-minima";

describe("validade mínima à receção por fornecedor", () => {
  it("exige 8 meses restantes quando o fornecedor estipula 12 meses", () => {
    const resultado = avaliarValidadeMinimaRececao({
      dataRececao: new Date(2026, 0, 1),
      validade: new Date(2026, 8, 1),
      validadeEstipuladaMeses: 12,
    });

    expect(resultado).toMatchObject({ aplicavel: true, alerta: false, mesesEstipulados: 12, mesesMinimos: 8 });
    expect(resultado.dataMinimaValidade?.toLocaleDateString("pt-PT")).toBe("01/09/2026");
  });

  it("alerta quando a validade do lote fica abaixo dos 2/3 exigidos", () => {
    const resultado = avaliarValidadeMinimaRececao({
      dataRececao: new Date(2026, 0, 1),
      validade: new Date(2026, 7, 31),
      validadeEstipuladaMeses: 12,
    });

    expect(resultado.alerta).toBe(true);
  });

  it("não aplica controlo enquanto o fornecedor não tiver validade estipulada", () => {
    expect(avaliarValidadeMinimaRececao({
      dataRececao: new Date(2026, 0, 1),
      validade: new Date(2026, 7, 31),
      validadeEstipuladaMeses: null,
    }).aplicavel).toBe(false);
  });
});
