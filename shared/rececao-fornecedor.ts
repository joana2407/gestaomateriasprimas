export type MpElegivelParaRececao = {
  id: number;
  fabricasIds?: number[] | null;
  fornecedoresIds?: number[] | null;
};

export function mpAprovadaParaRececao(
  mp: MpElegivelParaRececao,
  fabricaId: number,
  fornecedorId: number,
) {
  return fabricaId > 0
    && fornecedorId > 0
    && (mp.fabricasIds ?? []).includes(fabricaId)
    && (mp.fornecedoresIds ?? []).includes(fornecedorId);
}
