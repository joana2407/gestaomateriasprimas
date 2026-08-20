export const MINIMO_CARACTERES_FUNDAMENTO_DECISAO = 3;

export function fundamentoDecisaoValido(fundamento: string): boolean {
  return fundamento.trim().length >= MINIMO_CARACTERES_FUNDAMENTO_DECISAO;
}
