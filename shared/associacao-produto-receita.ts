export function validarAssociacaoProdutoReceita(fabricaProdutoId: number, fabricaReceitaId: number | null | undefined) {
  if (fabricaReceitaId === null || fabricaReceitaId === undefined) return true;
  if (fabricaProdutoId !== fabricaReceitaId) {
    throw new Error("A receita selecionada pertence a outra fábrica. Escolha uma receita da mesma unidade fabril.");
  }
  return true;
}
