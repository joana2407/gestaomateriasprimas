import type { ControlosRececao } from "./rececao-controlos";

export function marcarControlosGranelNaoAplicaveis(controlos: ControlosRececao): ControlosRececao {
  return {
    ...controlos,
    numeroSelo: "N/A",
    numeroSilo: "N/A",
    crivo: "na",
    fechoBocaCarga: "na",
  };
}

export function prepararControlosGranel(controlos: ControlosRececao): ControlosRececao {
  return {
    ...controlos,
    numeroSelo: controlos.numeroSelo === "N/A" ? "" : controlos.numeroSelo,
    numeroSilo: controlos.numeroSilo === "N/A" ? "" : controlos.numeroSilo,
    crivo: controlos.crivo === "na" ? undefined : controlos.crivo,
    fechoBocaCarga: controlos.fechoBocaCarga === "na" ? undefined : controlos.fechoBocaCarga,
  };
}
