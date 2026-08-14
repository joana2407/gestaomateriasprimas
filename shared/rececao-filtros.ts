export type RececaoPesquisavel = {
  fornecedorId: number;
  materiaPrimaId: number;
  dataRececao: Date | string;
  materiaPrimaNome?: string | null;
  fornecedorNome?: string | null;
  lote?: string | null;
  numeroGuia?: string | null;
};

export type FiltrosPesquisaRececao = {
  pesquisa: string;
  fornecedorId?: number;
  materiaPrimaId?: number;
  dataInicial?: string;
  dataFinal?: string;
};

function dataIso(value: Date | string) {
  const data = value instanceof Date ? value : new Date(value);
  return Number.isNaN(data.getTime()) ? "" : data.toISOString().slice(0, 10);
}

export function filtrarRececoes<T extends RececaoPesquisavel>(rececoes: T[], filtros: FiltrosPesquisaRececao) {
  const termo = filtros.pesquisa.trim().toLowerCase();
  return rececoes.filter(rececao => {
    const textoCorresponde = !termo || [rececao.materiaPrimaNome, rececao.fornecedorNome, rececao.lote, rececao.numeroGuia]
      .some(valor => (valor ?? "").toLowerCase().includes(termo));
    const fornecedorCorresponde = !filtros.fornecedorId || rececao.fornecedorId === filtros.fornecedorId;
    const mpCorresponde = !filtros.materiaPrimaId || rececao.materiaPrimaId === filtros.materiaPrimaId;
    const dataRececao = dataIso(rececao.dataRececao);
    const dataInicialCorresponde = !filtros.dataInicial || dataRececao >= filtros.dataInicial;
    const dataFinalCorresponde = !filtros.dataFinal || dataRececao <= filtros.dataFinal;
    return textoCorresponde && fornecedorCorresponde && mpCorresponde && dataInicialCorresponde && dataFinalCorresponde;
  });
}
