export const PERFIS_ACESSO = ["logistica", "qualidade", "gestao"] as const;
export type PerfilAcesso = (typeof PERFIS_ACESSO)[number];

export const PERFIL_ACESSO_LABEL: Record<PerfilAcesso, string> = {
  logistica: "Logística",
  qualidade: "Qualidade",
  gestao: "Gestão",
};

export function temAcessoQualidade(perfil?: PerfilAcesso | null) {
  return perfil === "qualidade";
}

export function ePerfilGestao(perfil?: PerfilAcesso | null) {
  return perfil === "gestao";
}

export function podeConsultarTodosModulos(perfil?: PerfilAcesso | null) {
  return perfil === "qualidade" || perfil === "gestao";
}

export function podeAlterarDados(perfil?: PerfilAcesso | null) {
  return perfil === "qualidade";
}
