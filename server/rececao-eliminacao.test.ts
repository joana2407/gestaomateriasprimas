import { describe, expect, it } from "vitest";
import { mensagemEliminacaoRececao } from "../shared/rececao-eliminacao";

describe("eliminação de receções", () => {
  it("confirma a eliminação simples sem transferências", () => {
    expect(mensagemEliminacaoRececao(0)).toBe("Receção eliminada com sucesso.");
  });

  it("informa as transferências removidas com a receção", () => {
    expect(mensagemEliminacaoRececao(2)).toBe("Receção eliminada e 2 transferência(s) associada(s) removida(s).");
  });
});
