import { describe, expect, it } from "vitest";
import { temTratamentoNaoConformidade, tratamentoNaoConformidadeVazio } from "../shared/rececao-nao-conformidade";

describe("tratamento de não conformidade", () => {
  it("não considera um tratamento vazio como informação registada", () => {
    expect(temTratamentoNaoConformidade(tratamentoNaoConformidadeVazio())).toBe(false);
  });

  it("deteta informação de correção ou ação corretiva", () => {
    expect(temTratamentoNaoConformidade({ acaoCorretiva: "Avaliar o fornecedor" })).toBe(true);
  });
});
