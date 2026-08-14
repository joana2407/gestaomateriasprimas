export const PERFIS_ACESSO = ["logistica", "qualidade"] as const;
export type PerfilAcesso = (typeof PERFIS_ACESSO)[number];

export const PERFIL_ACESSO_LABEL: Record<PerfilAcesso, string> = {
  logistica: "Logística",
  qualidade: "Qualidade",
};

export function temAcessoQualidade(perfil?: PerfilAcesso | null) {
  return perfil === "qualidade";
}
