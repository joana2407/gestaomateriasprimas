import { describe, expect, it } from "vitest";
import { validarAssociacaoProdutoReceita } from "../shared/associacao-produto-receita";

describe("associação Produto–Receita", () => {
  it("aceita a associação quando produto e receita pertencem à mesma fábrica", () => {
    expect(validarAssociacaoProdutoReceita(3, 3)).toBe(true);
  });

  it("aceita a remoção da receita associada", () => {
    expect(validarAssociacaoProdutoReceita(2, null)).toBe(true);
  });

  it("bloqueia uma associação entre fábricas diferentes", () => {
    expect(() => validarAssociacaoProdutoReceita(1, 3)).toThrow("pertence a outra fábrica");
  });
});
