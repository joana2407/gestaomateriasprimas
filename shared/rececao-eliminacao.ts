export function mensagemEliminacaoRececao(transferenciasEliminadas: number): string {
  if (transferenciasEliminadas <= 0) return "Receção eliminada com sucesso.";
  return `Receção eliminada e ${transferenciasEliminadas} transferência(s) associada(s) removida(s).`;
}
