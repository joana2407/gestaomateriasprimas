export type RececaoPesquisavel = {
  fornecedorId: number;
  materiaPrimaId: number;
  materiaPrimaNome?: string | null;
  fornecedorNome?: string | null;
  lote?: string | null;
  numeroGuia?: string | null;
};

export type FiltrosPesquisaRececao = {
  pesquisa: string;
  fornecedorId?: number;
  materiaPrimaId?: number;
};

export function filtrarRececoes<T extends RececaoPesquisavel>(rececoes: T[], filtros: FiltrosPesquisaRececao) {
  const termo = filtros.pesquisa.trim().toLowerCase();
  return rececoes.filter(rececao => {
    const textoCorresponde = !termo || [rececao.materiaPrimaNome, rececao.fornecedorNome, rececao.lote, rececao.numeroGuia]
      .some(valor => (valor ?? "").toLowerCase().includes(termo));
    const fornecedorCorresponde = !filtros.fornecedorId || rececao.fornecedorId === filtros.fornecedorId;
    const mpCorresponde = !filtros.materiaPrimaId || rececao.materiaPrimaId === filtros.materiaPrimaId;
    return textoCorresponde && fornecedorCorresponde && mpCorresponde;
  });
}
