import type { ControlosRececao } from "./rececao-controlos";

const MP_ELEGIVEIS_GRANEL = ["farinha de trigo 65", "farinha de centeio 130", "pellets"];

function normalizarNome(nome?: string | null) {
  return (nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function mpElegivelParaRececaoAGranel(nome?: string | null) {
  const nomeNormalizado = normalizarNome(nome);
  return MP_ELEGIVEIS_GRANEL.some(mp => nomeNormalizado.includes(mp));
}

export function marcarControlosGranelNaoAplicaveis(controlos: ControlosRececao): ControlosRececao {
  return {
    ...controlos,
    tipoRececao: "saco",
    numeroSelo: "N/A",
    numeroSilo: "N/A",
    crivo: "na",
    fechoBocaCarga: "na",
  };
}

export function prepararControlosGranel(controlos: ControlosRececao): ControlosRececao {
  return {
    ...controlos,
    tipoRececao: "granel",
    numeroSelo: controlos.numeroSelo === "N/A" ? "" : controlos.numeroSelo,
    numeroSilo: controlos.numeroSilo === "N/A" ? "" : controlos.numeroSilo,
    crivo: controlos.crivo === "na" ? undefined : controlos.crivo,
    fechoBocaCarga: controlos.fechoBocaCarga === "na" ? undefined : controlos.fechoBocaCarga,
  };
}

export function marcarConformidadeVeiculoNaoAplicavel(controlos: ControlosRececao): ControlosRececao {
  return {
    ...controlos,
    temperaturaMpSaco: { estado: "na", valor: null },
    limpeza: "na",
    residuosInfestacao: "na",
    acondicionamento: "na",
  };
}

export function prepararConformidadeVeiculo(controlos: ControlosRececao): ControlosRececao {
  const { temperaturaMpSaco, limpeza, residuosInfestacao, acondicionamento, ...resto } = controlos;
  return {
    ...resto,
    ...(temperaturaMpSaco?.estado !== "na" ? { temperaturaMpSaco } : {}),
    ...(limpeza !== "na" ? { limpeza } : {}),
    ...(residuosInfestacao !== "na" ? { residuosInfestacao } : {}),
    ...(acondicionamento !== "na" ? { acondicionamento } : {}),
  };
}
