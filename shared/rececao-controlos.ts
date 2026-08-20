export const ARMAZENS_RECECAO = [
  { id: "ambiente_secos", label: "Ambiente / Secos", descricao: "Ingredientes e materiais estáveis à temperatura ambiente" },
  { id: "frio", label: "Frio", descricao: "Ingredientes e materiais com controlo de temperatura" },
  { id: "embalagens", label: "Embalagens", descricao: "Materiais de acondicionamento e embalagem" },
] as const;

export const ESTADOS_CONTROLO_RECECAO = [
  { id: "c", label: "Conforme", abreviatura: "C" },
  { id: "nc", label: "Não Conforme", abreviatura: "NC" },
  { id: "na", label: "Não Aplicável", abreviatura: "NA" },
] as const;

export type ArmazemRececao = (typeof ARMAZENS_RECECAO)[number]["id"];
export type EstadoControloRececao = (typeof ESTADOS_CONTROLO_RECECAO)[number]["id"];

export type ControlosRececao = {
  tipoRececao?: "saco" | "granel";
  temperaturaMpSaco?: { estado?: EstadoControloRececao; valor?: number | null };
  limpeza?: EstadoControloRececao;
  residuosInfestacao?: EstadoControloRececao;
  acondicionamento?: EstadoControloRececao;
  numeroSelo?: string;
  numeroSilo?: string;
  crivo?: EstadoControloRececao;
  fechoBocaCarga?: EstadoControloRececao;
  aspetoMacroscopico?: EstadoControloRececao;
  materiasEstranhas?: EstadoControloRececao;
  infestacaoProduto?: EstadoControloRececao;
  datasValidade?: EstadoControloRececao;
};

export function calcularConformidadeRececao(controlos: ControlosRececao) {
  const estados: Array<EstadoControloRececao | undefined> = [
    controlos.temperaturaMpSaco?.estado,
    controlos.limpeza,
    controlos.residuosInfestacao,
    controlos.acondicionamento,
    controlos.crivo,
    controlos.fechoBocaCarga,
    controlos.aspetoMacroscopico,
    controlos.materiasEstranhas,
    controlos.infestacaoProduto,
    controlos.datasValidade,
  ];
  if (estados.includes("nc")) return "nao_conforme" as const;
  if (estados.includes("c")) return "conforme" as const;
  return "pendente" as const;
}

export function temNaoConformidade(controlos: ControlosRececao) {
  return calcularConformidadeRececao(controlos) === "nao_conforme";
}
