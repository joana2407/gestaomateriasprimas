import type { PerfilAcesso } from "./perfis-acesso";

export function podeEditarRececao(params: {
  role?: PerfilAcesso;
  userId?: number;
  registadoPor?: number | null;
}) {
  return params.role === "qualidade" || (params.userId !== undefined && params.registadoPor === params.userId);
}
