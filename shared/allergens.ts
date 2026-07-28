// Os 14 alergénios obrigatórios segundo o Regulamento (UE) n.º 1169/2011
export const ALERGENIOS_14 = [
  { id: "gluten", label: "Cereais com Glúten", abrev: "GLU" },
  { id: "crustaceos", label: "Crustáceos", abrev: "CRU" },
  { id: "ovos", label: "Ovos", abrev: "OVO" },
  { id: "peixe", label: "Peixe", abrev: "PEI" },
  { id: "amendoins", label: "Amendoins", abrev: "AME" },
  { id: "soja", label: "Soja", abrev: "SOJ" },
  { id: "leite", label: "Leite", abrev: "LEI" },
  { id: "frutos_casca_rija", label: "Frutos de Casca Rija", abrev: "FCR" },
  { id: "aipo", label: "Aipo", abrev: "AIP" },
  { id: "mostarda", label: "Mostarda", abrev: "MOS" },
  { id: "sesamo", label: "Sementes de Sésamo", abrev: "SES" },
  { id: "sulfitos", label: "Dióxido de Enxofre e Sulfitos", abrev: "SUL" },
  { id: "tremoco", label: "Tremoço", abrev: "TRE" },
  { id: "moluscos", label: "Moluscos", abrev: "MOL" },
] as const;

export type AlergenioId = typeof ALERGENIOS_14[number]["id"];

export type ResultadoAlergenio = "formulacao" | "contaminacao" | "ausente";

export interface PerfilAlergenico {
  [alergenioId: string]: ResultadoAlergenio;
}

export interface RegrasContaminacaoFabrica {
  // Alergénios presentes na linha de produção por equipamento
  // ex: { "AMASSADEIRA": ["gluten","soja"], "BATEDEIRA": ["ovos","leite"] }
  equipamentos: Record<string, AlergenioId[]>;
  // Bloqueio total de alergénios (ex: Fábrica III bloqueia glúten)
  bloqueioTotal?: AlergenioId[];
  // Regras especiais de higienização
  regrasHigienizacao?: string[];
}

/**
 * Motor da Árvore de Decisão Q1-Q6
 * Calcula o perfil alergénico de um produto com base nos ingredientes e nas regras da fábrica.
 *
 * Q1: O alergénio está presente via formulação em alguma MP da receita?
 * Q2: Alguma MP contém este alergénio via contaminação cruzada no fornecedor?
 * Q3: Existe risco de contaminação cruzada na linha de produção desta fábrica?
 * Q4: O risco é mitigado por higienização validada?
 * Q5: Existe risco residual documentado após higienização?
 * Q6: Existem medidas de segregação física/temporal que eliminam o risco?
 */
export function calcularPerfilAlergenico(
  ingredientes: Array<{
    alergeniosFormulacao: AlergenioId[];
    alergeniosContaminacao: AlergenioId[];
  }>,
  regrasFabrica: RegrasContaminacaoFabrica,
  equipamentoUsado?: string
): { perfil: PerfilAlergenico; detalheQ1Q6: Record<string, Record<string, boolean>> } {
  const perfil: PerfilAlergenico = {};
  const detalheQ1Q6: Record<string, Record<string, boolean>> = {};

  for (const { id: alergenioId } of ALERGENIOS_14) {
    const detail: Record<string, boolean> = {};

    // Q1: Presente via formulação em algum ingrediente?
    const q1 = ingredientes.some(ing => ing.alergeniosFormulacao.includes(alergenioId as AlergenioId));
    detail.Q1 = q1;
    if (q1) {
      perfil[alergenioId] = "formulacao";
      detalheQ1Q6[alergenioId] = detail;
      continue;
    }

    // Q2: Presente via contaminação cruzada no fornecedor?
    const q2 = ingredientes.some(ing => ing.alergeniosContaminacao.includes(alergenioId as AlergenioId));
    detail.Q2 = q2;
    if (q2) {
      // Ainda pode ser mitigado pelas questões seguintes
    }

    // Q3: Risco de contaminação cruzada na linha de produção?
    const alergeniosLinha = equipamentoUsado
      ? (regrasFabrica.equipamentos[equipamentoUsado] ?? [])
      : Object.values(regrasFabrica.equipamentos).flat();
    const q3 = alergeniosLinha.includes(alergenioId as AlergenioId);
    detail.Q3 = q3;

    if (!q2 && !q3) {
      perfil[alergenioId] = "ausente";
      detalheQ1Q6[alergenioId] = detail;
      continue;
    }

    // Q4: Higienização validada elimina o risco?
    // Por defeito, assume-se que a higienização não elimina completamente (conservador)
    const q4 = false;
    detail.Q4 = q4;

    // Q5: Risco residual após higienização?
    const q5 = !q4;
    detail.Q5 = q5;

    // Q6: Segregação física/temporal elimina o risco?
    const q6 = false;
    detail.Q6 = q6;

    if (q6) {
      perfil[alergenioId] = "ausente";
    } else {
      perfil[alergenioId] = "contaminacao";
    }
    detalheQ1Q6[alergenioId] = detail;
  }

  return { perfil, detalheQ1Q6 };
}

// Regras de contaminação por defeito para cada fábrica
export const REGRAS_FABRICAS: Record<string, RegrasContaminacaoFabrica> = {
  "FAB1": {
    equipamentos: {
      "AMASSADEIRA": ["gluten", "soja", "sesamo", "tremoco", "mostarda"],
      "BATEDEIRA": ["ovos", "leite", "frutos_casca_rija", "sesamo"],
      "LINHA_FATIADO": ["gluten", "sesamo"],
    },
    regrasHigienizacao: [
      "Croutons requerem higienização total da linha antes da produção",
      "Pão de Rabanadas deve ser o último produto da sequência",
      "Pães com sementes no topo requerem higienização após produção",
    ],
  },
  "FAB2": {
    equipamentos: {
      "AMASSADEIRA": ["gluten", "soja", "sesamo", "tremoco", "mostarda"],
      "BATEDEIRA": ["ovos", "leite", "frutos_casca_rija", "sesamo"],
      "BATEDEIRA_TACHO": ["ovos", "leite"],
    },
    regrasHigienizacao: [
      "Sequência: padaria → pastelaria para minimizar contaminação",
    ],
  },
  "FAB3": {
    equipamentos: {
      "AMASSADEIRA_SG": ["ovos", "leite", "sesamo", "frutos_casca_rija"],
      "BATEDEIRA_SG": ["ovos", "leite", "sesamo"],
    },
    bloqueioTotal: ["gluten"],
    regrasHigienizacao: [
      "BLOQUEIO TOTAL: Nenhuma MP com glúten permitida nesta fábrica",
      "Segregação física obrigatória de todas as MP com glúten",
    ],
  },
};

