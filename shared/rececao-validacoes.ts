import type { ControlosRececao, EstadoControloRececao } from "./rececao-controlos";

export type EstadoValidacaoDetalhe = EstadoControloRececao | "pendente" | "registado";

export type ValidacaoRececaoDetalhe = {
  grupo: "MP em saco" | "MP a granel" | "Produto";
  label: string;
  estado: EstadoValidacaoDetalhe;
  valor?: string;
};

function estadoOuPendente(estado?: EstadoControloRececao): EstadoValidacaoDetalhe {
  return estado ?? "pendente";
}

function informacaoRegistada(valor?: string) {
  return valor?.trim()
    ? { estado: "registado" as const, valor: valor.trim() }
    : { estado: "pendente" as const };
}

export function listarValidacoesRececao(controlos: ControlosRececao = {}): ValidacaoRececaoDetalhe[] {
  const temperatura = controlos.temperaturaMpSaco;
  return [
    { grupo: "MP em saco", label: "Temperatura", estado: estadoOuPendente(temperatura?.estado), valor: temperatura?.valor != null ? `${temperatura.valor} °C` : undefined },
    { grupo: "MP em saco", label: "Limpeza", estado: estadoOuPendente(controlos.limpeza) },
    { grupo: "MP em saco", label: "Resíduos / infestação", estado: estadoOuPendente(controlos.residuosInfestacao) },
    { grupo: "MP em saco", label: "Acondicionamento", estado: estadoOuPendente(controlos.acondicionamento) },
    { grupo: "MP a granel", label: "N.º de selo", ...informacaoRegistada(controlos.numeroSelo) },
    { grupo: "MP a granel", label: "N.º de silo", ...informacaoRegistada(controlos.numeroSilo) },
    { grupo: "MP a granel", label: "Crivo", estado: estadoOuPendente(controlos.crivo) },
    { grupo: "MP a granel", label: "Fecho da boca de carga do silo", estado: estadoOuPendente(controlos.fechoBocaCarga) },
    { grupo: "Produto", label: "Aspeto macroscópico", estado: estadoOuPendente(controlos.aspetoMacroscopico) },
    { grupo: "Produto", label: "Matérias estranhas", estado: estadoOuPendente(controlos.materiasEstranhas) },
    { grupo: "Produto", label: "Infestação", estado: estadoOuPendente(controlos.infestacaoProduto) },
    { grupo: "Produto", label: "Datas de validade", estado: estadoOuPendente(controlos.datasValidade) },
  ];
}
