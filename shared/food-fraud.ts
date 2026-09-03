export const MATRIZ_FOOD_FRAUD_VERSAO = "FF-OC-1.0";

const MESES_PT: Record<string, string> = {
  janeiro: "01",
  fevereiro: "02",
  marco: "03",
  março: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

export const TIPOS_RELACAO_FOOD_FRAUD = [
  "direta",
  "indireta",
  "informativa",
  "sem_correspondencia",
] as const;
export const ESTADOS_TRIAGEM_FOOD_FRAUD = [
  "avaliada",
  "por_validar",
  "informativa",
  "sem_correspondencia",
] as const;
export const NIVEIS_RISCO_FOOD_FRAUD = [
  "Baixo",
  "Médio",
  "Alto",
  "Crítico",
] as const;

export type FoodFraudTipoRelacao = (typeof TIPOS_RELACAO_FOOD_FRAUD)[number];
export type FoodFraudEstadoTriagem =
  (typeof ESTADOS_TRIAGEM_FOOD_FRAUD)[number];
export type FoodFraudNivelRisco = (typeof NIVEIS_RISCO_FOOD_FRAUD)[number];
export type FoodFraudCriterio = "p1" | "p2" | "p3" | "i1" | "i2" | "i3" | "i4";
export type FoodFraudCriterios = Partial<Record<FoodFraudCriterio, 1 | 2 | 3>>;

export type FoodFraudOcorrencia = Record<string, unknown> & {
  chave: string;
  titulo: string;
  resumo: string;
  categoria?: string;
  origem?: string;
  pratica?: string;
  dataNotificacao?: string;
  tipoRelacao: FoodFraudTipoRelacao;
  estadoTriagem: FoodFraudEstadoTriagem;
  matrizVersao: string;
  criterios: FoodFraudCriterios;
  probabilidade: number | null;
  impacto: number | null;
  score: number | null;
  nivel: FoodFraudNivelRisco | null;
  relevante: boolean;
  acaoRequerida: boolean;
  regraPrevalencia?: "relacao_direta" | "impacto_direto";
  materiasPrimas: string[];
  evidenciaCorrespondencia: string[];
  fontes: string[];
  medidasRecomendadas: string[];
};

function isScore(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function average(values: Array<1 | 2 | 3>) {
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  ) as 1 | 2 | 3;
}

function normalizarTipoRelacao(value: unknown): FoodFraudTipoRelacao {
  return TIPOS_RELACAO_FOOD_FRAUD.includes(value as FoodFraudTipoRelacao)
    ? (value as FoodFraudTipoRelacao)
    : "informativa";
}

function normalizarCriterios(value: unknown): FoodFraudCriterios {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    p1: isScore(raw.p1) ? raw.p1 : undefined,
    p2: isScore(raw.p2) ? raw.p2 : undefined,
    p3: isScore(raw.p3) ? raw.p3 : undefined,
    i1: isScore(raw.i1) ? raw.i1 : undefined,
    i2: isScore(raw.i2) ? raw.i2 : undefined,
    i3: isScore(raw.i3) ? raw.i3 : undefined,
    i4: isScore(raw.i4) ? raw.i4 : undefined,
  };
}

function medidasPorNivel(
  nivel: FoodFraudNivelRisco | null,
  estado: FoodFraudEstadoTriagem,
  tipoRelacao: FoodFraudTipoRelacao
) {
  if (estado === "por_validar")
    return [
      "Validar a correspondência com o SIGA e completar os critérios em falta antes de decidir.",
    ];
  if (estado === "informativa")
    return [
      "Registar para conhecimento; não alterar o risco-base sem uma ligação SIGA comprovada.",
    ];
  if (estado === "sem_correspondencia")
    return ["Arquivar como não aplicável, preservando a fonte oficial."];
  if (nivel === "Crítico")
    return [
      "Validar imediatamente com Qualidade e Compras e aplicar o procedimento interno antes de aceitar ou libertar produto.",
    ];
  if (nivel === "Alto")
    return [
      "Verificar lotes, fornecedor e documentos aplicáveis; reforçar controlos e definir responsável, prazo e evidências.",
    ];
  if (nivel === "Médio")
    return [
      "Validar especificações, origem, documentação, stock e rastreabilidade antes do fecho mensal.",
    ];
  return tipoRelacao === "direta"
    ? ["Registar a ligação direta e rever na síntese mensal pela Qualidade."]
    : ["Registar e acompanhar na revisão mensal."];
}

export function calcularTriagemFoodFraud(input: {
  tipoRelacao?: unknown;
  criterios?: unknown;
}) {
  const tipoRelacao = normalizarTipoRelacao(input.tipoRelacao);
  const criterios = normalizarCriterios(input.criterios);

  if (tipoRelacao === "informativa" || tipoRelacao === "sem_correspondencia") {
    return {
      tipoRelacao,
      criterios,
      estadoTriagem:
        tipoRelacao === "informativa"
          ? ("informativa" as const)
          : ("sem_correspondencia" as const),
      probabilidade: null,
      impacto: null,
      score: null,
      nivel: null,
      relevante: false,
      acaoRequerida: false,
      regraPrevalencia: undefined,
      medidasRecomendadas: medidasPorNivel(
        null,
        tipoRelacao === "informativa" ? "informativa" : "sem_correspondencia",
        tipoRelacao
      ),
    };
  }

  criterios.p1 = tipoRelacao === "direta" ? 3 : 2;
  const probabilidadeValores = [criterios.p1, criterios.p2, criterios.p3];
  const impactoValores = [
    criterios.i1,
    criterios.i2,
    criterios.i3,
    criterios.i4,
  ];
  if (
    probabilidadeValores.some(value => !isScore(value)) ||
    impactoValores.some(value => !isScore(value))
  ) {
    return {
      tipoRelacao,
      criterios,
      estadoTriagem: "por_validar" as const,
      probabilidade: null,
      impacto: null,
      score: null,
      nivel: null,
      relevante: true,
      acaoRequerida: false,
      regraPrevalencia: undefined,
      medidasRecomendadas: medidasPorNivel(null, "por_validar", tipoRelacao),
    };
  }

  const probabilidade = average(probabilidadeValores as Array<1 | 2 | 3>);
  const impacto = average(impactoValores as Array<1 | 2 | 3>);
  const scoreBase = probabilidade * impacto;
  const score = tipoRelacao === "direta" ? Math.max(scoreBase, 3) : scoreBase;
  const nivel: FoodFraudNivelRisco =
    score >= 7
      ? "Crítico"
      : score >= 5
        ? "Alto"
        : score >= 3
          ? "Médio"
          : "Baixo";
  const regraPrevalencia =
    tipoRelacao === "direta" && impacto === 3
      ? ("impacto_direto" as const)
      : tipoRelacao === "direta" && scoreBase < 3
        ? ("relacao_direta" as const)
        : undefined;
  const acaoRequerida =
    score >= 5 || (tipoRelacao === "direta" && impacto === 3);
  return {
    tipoRelacao,
    criterios,
    estadoTriagem: "avaliada" as const,
    probabilidade,
    impacto,
    score,
    nivel,
    relevante: true,
    acaoRequerida,
    regraPrevalencia,
    medidasRecomendadas: medidasPorNivel(nivel, "avaliada", tipoRelacao),
  };
}

export function normalizarOcorrenciaFoodFraud(
  raw: Record<string, unknown>,
  index = 0
): FoodFraudOcorrencia {
  const materiasPrimas = Array.isArray(raw.materiasPrimas)
    ? raw.materiasPrimas.map(String)
    : [];
  const evidenciaCorrespondencia = Array.isArray(raw.evidenciaCorrespondencia)
    ? raw.evidenciaCorrespondencia.map(String)
    : materiasPrimas;
  const fontes = Array.isArray(raw.fontes)
    ? raw.fontes.filter(value => typeof value === "string").map(String)
    : [];
  const triagem = calcularTriagemFoodFraud({
    tipoRelacao: raw.tipoRelacao,
    criterios: raw.criterios,
  });
  return {
    ...raw,
    chave: String(raw.chave ?? raw.id ?? `food-fraud-${index}`),
    titulo: String(raw.titulo ?? raw.produto ?? "Ocorrência Food Fraud"),
    resumo: String(
      raw.resumo ??
        raw.pratica ??
        raw.titulo ??
        "Ocorrência importada para validação."
    ),
    categoria: typeof raw.categoria === "string" ? raw.categoria : undefined,
    origem: typeof raw.origem === "string" ? raw.origem : undefined,
    pratica: typeof raw.pratica === "string" ? raw.pratica : undefined,
    dataNotificacao:
      typeof raw.dataNotificacao === "string" ? raw.dataNotificacao : undefined,
    matrizVersao: MATRIZ_FOOD_FRAUD_VERSAO,
    materiasPrimas,
    evidenciaCorrespondencia,
    fontes,
    ...triagem,
  };
}

export function extrairDataNotificacao(texto: string): string | undefined {
  const iso = texto.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
  if (iso)
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const europeia = texto.match(
    /\b(\d{1,2})[-\/.](\d{1,2})[-\/.](20\d{2}|\d{2})\b/
  );
  if (europeia)
    return `${europeia[3].length === 2 ? `20${europeia[3]}` : europeia[3]}-${europeia[2].padStart(2, "0")}-${europeia[1].padStart(2, "0")}`;
  const porExtenso = texto
    .toLocaleLowerCase("pt-PT")
    .match(
      /\b(\d{1,2})\s+de?\s+(janeiro|fevereiro|mar(?:ç|c)o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(20\d{2})\b/
    );
  if (porExtenso)
    return `${porExtenso[3]}-${MESES_PT[porExtenso[2]]}-${porExtenso[1].padStart(2, "0")}`;
  return undefined;
}
