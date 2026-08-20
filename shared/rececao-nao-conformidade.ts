export type TratamentoNaoConformidade = {
  correcaoImediata: string;
  responsavelCorrecao: string;
  dataImplementacaoCorrecao: string;
  evidenciaCorrecao: string;
  acaoCorretiva: string;
  responsavelAcaoCorretiva: string;
  prazoAcaoCorretiva: string;
  dataFechoAcaoCorretiva: string;
  evidenciaAcaoCorretiva: string;
};

export function tratamentoNaoConformidadeVazio(): TratamentoNaoConformidade {
  return {
    correcaoImediata: "",
    responsavelCorrecao: "",
    dataImplementacaoCorrecao: "",
    evidenciaCorrecao: "",
    acaoCorretiva: "",
    responsavelAcaoCorretiva: "",
    prazoAcaoCorretiva: "",
    dataFechoAcaoCorretiva: "",
    evidenciaAcaoCorretiva: "",
  };
}

export function normalizarTratamentoNaoConformidade(
  tratamento?: Partial<TratamentoNaoConformidade> | null,
): TratamentoNaoConformidade {
  return { ...tratamentoNaoConformidadeVazio(), ...(tratamento ?? {}) };
}

export function temTratamentoNaoConformidade(
  tratamento?: Partial<TratamentoNaoConformidade> | null,
): boolean {
  return Object.values(tratamento ?? {}).some(valor => typeof valor === "string" && valor.trim().length > 0);
}
