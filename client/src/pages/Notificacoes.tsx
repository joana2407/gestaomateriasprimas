import { SigaLayout } from "@/components/SigaLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Bell, BellRing, Check, Circle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Notificacoes() {
  const { user } = useAuth();
  const podeMarcarLida = user?.role === "qualidade";
  const utils = trpc.useUtils();
  const { data: notificacoes, isLoading } = trpc.notificacoes.list.useQuery();
  const marcarLida = trpc.notificacoes.marcarLida.useMutation({
    onSuccess: () => utils.notificacoes.list.invalidate(),
    onError: error => toast.error(error.message),
  });
  const totalNaoLidas = notificacoes?.filter(item => !item.lida).length ?? 0;

  async function abrirNotificacao(notificacao: NonNullable<typeof notificacoes>[number]) {
    if (!notificacao.lida && podeMarcarLida) {
      try {
        await marcarLida.mutateAsync({ id: notificacao.id, lida: true });
      } catch {
        // A navegação para a receção continua disponível mesmo se a marcação falhar.
      }
    }
    window.location.assign(notificacao.link);
  }

  return <SigaLayout title="Notificações de Qualidade" subtitle={`${totalNaoLidas} alertas não lidos`}>
    <div className="space-y-4">
      <div className="card-elegant p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><BellRing className="w-5 h-5" /></div><div><p className="text-sm font-semibold">Observações em receções</p><p className="text-xs text-muted-foreground mt-0.5">Alertas enviados quando uma receção contém informação adicional para análise.</p></div></div>
        <Badge variant="outline" className={totalNaoLidas ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{totalNaoLidas ? `${totalNaoLidas} não lida${totalNaoLidas === 1 ? "" : "s"}` : "Todas lidas"}</Badge>
      </div>

      <div className="space-y-2">
        {isLoading ? <div className="card-elegant p-10 text-center text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />A carregar notificações...</div> : !notificacoes?.length ? <div className="card-elegant p-12 text-center"><Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm font-medium">Sem notificações de Qualidade</p><p className="mt-1 text-xs text-muted-foreground">Os alertas de receções com observações aparecerão aqui.</p></div> : notificacoes.map(notificacao => <article key={notificacao.id} className={`card-elegant p-4 transition-colors ${notificacao.lida ? "bg-card" : "border-primary/30 bg-primary/[0.025]"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start"><div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notificacao.lida ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{notificacao.lida ? <Check className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold">{notificacao.titulo}</p>{!notificacao.lida && <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Não lida</Badge>}</div><p className="mt-1.5 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">{notificacao.mensagem}</p><p className="mt-2 text-[10px] text-muted-foreground">{new Date(notificacao.criadaEm).toLocaleString("pt-PT")}</p></div><div className="flex gap-2 shrink-0">{podeMarcarLida && <Button variant="outline" size="sm" onClick={() => marcarLida.mutate({ id: notificacao.id, lida: !notificacao.lida })} disabled={marcarLida.isPending} className="gap-1.5">{notificacao.lida ? <Circle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}{notificacao.lida ? "Marcar não lida" : "Marcar lida"}</Button>}<Button size="sm" onClick={() => abrirNotificacao(notificacao)} className="gap-1.5">Abrir receção<ExternalLink className="w-3.5 h-3.5" /></Button></div></div>
        </article>)}</div>
    </div>
  </SigaLayout>;
}
