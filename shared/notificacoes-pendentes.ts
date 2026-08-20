export function contarNotificacoesPendentes(notificacoes?: Array<{ lida: boolean }> | null): number {
  return (notificacoes ?? []).filter(notificacao => !notificacao.lida).length;
}
