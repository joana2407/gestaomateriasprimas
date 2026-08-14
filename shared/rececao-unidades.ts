export const UNIDADES_RECECAO = [
  { value: "kg", label: "Kg" },
  { value: "lt", label: "Lt" },
  { value: "ton", label: "Ton" },
] as const;

export const UNIDADES_RECECAO_IDS = UNIDADES_RECECAO.map(unidade => unidade.value) as ["kg", "lt", "ton"];
export type UnidadeRececao = (typeof UNIDADES_RECECAO_IDS)[number];

export function formatarUnidadeRececao(unidade?: UnidadeRececao | null) {
  return UNIDADES_RECECAO.find(item => item.value === unidade)?.label ?? "Kg";
}
