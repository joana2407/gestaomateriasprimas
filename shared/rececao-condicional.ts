export type EstadoValidacaoRececao = "nao_aplicavel" | "pendente" | "validada" | "recusada";

export function requerValidacaoCondicional({
  alertaValidade,
  conformidade,
}: {
  alertaValidade: boolean;
  conformidade: "conforme" | "nao_conforme" | "pendente";
}) {
  return alertaValidade || conformidade === "nao_conforme";
}

export function rececaoAcessivelOperacionalmente(estadoValidacao?: EstadoValidacaoRececao | null) {
  return estadoValidacao !== "pendente" && estadoValidacao !== "recusada";
}

export function motivoValidacaoCondicional({ alertaValidade, conformidade }: { alertaValidade: boolean; conformidade: "conforme" | "nao_conforme" | "pendente" }) {
  const motivos: string[] = [];
  if (alertaValidade) motivos.push("validade abaixo do mínimo de 2/3");
  if (conformidade === "nao_conforme") motivos.push("não conformidade nos pontos de controlo");
  return motivos.join(" e ");
}
