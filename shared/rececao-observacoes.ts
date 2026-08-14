export function temObservacoesRececao(observacoes?: string | null) {
  return Boolean(observacoes?.trim());
}

export function resumirObservacoesRececao(observacoes: string, limite = 500) {
  const texto = observacoes.trim().replace(/\s+/g, " ");
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}
