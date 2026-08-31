import { useMemo } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Download, FileSearch, Play, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SigaLayout } from "@/components/SigaLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const statusLabel: Record<string, string> = { sucesso: "Concluído", sem_dados: "Sem ocorrências", erro: "Com erro" };
const statusClass: Record<string, string> = {
  sucesso: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sem_dados: "bg-slate-50 text-slate-700 border-slate-200",
  erro: "bg-red-50 text-red-700 border-red-200",
};

function downloadMarkdown(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function VigilanciaRasff() {
  const { user } = useAuth();
  const isQualidade = user?.role === "qualidade";
  const configQuery = trpc.rasff.config.useQuery(undefined, { staleTime: 30_000 });
  const reportsQuery = trpc.rasff.relatorios.useQuery(undefined, { staleTime: 15_000 });
  const initMutation = trpc.rasff.inicializar.useMutation({
    onSuccess: () => { toast.success("Vigilância RASFF preparada."); void configQuery.refetch(); },
    onError: error => toast.error(error.message),
  });
  const scheduleMutation = trpc.rasff.ativarAgendamento.useMutation({
    onSuccess: () => { toast.success("Fluxo semanal RASFF ativado."); void configQuery.refetch(); },
    onError: error => toast.error(error.message),
  });
  const config = configQuery.data;
  const categorias = (Array.isArray(config?.categorias) ? config.categorias : []) as string[];
  const perigos = (Array.isArray(config?.perigos) ? config.perigos : []) as string[];
  const reports = reportsQuery.data ?? [];
  const relevantCount = useMemo(() => reports.reduce((sum, report) => sum + (report.totalRelevantes ?? 0), 0), [reports]);

  return (
    <SigaLayout title="Vigilância RASFF" subtitle="Monitorização de alertas relevantes para MP, fornecedores e origens">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700"><ShieldCheck className="h-4 w-4" /> BRC Food · vigilância documentada</div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Alertas RASFF com contexto da sua cadeia de fornecimento</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Todas as semanas, o agente pesquisa informação pública recente, cruza categorias, perigos e países de origem com as matérias-primas registadas no SIGA e guarda um relatório para revisão da Qualidade.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-white/80 bg-white/80 p-4 text-sm shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-800"><CalendarClock className="h-4 w-4 text-amber-700" /> Segunda-feira · 07:00</div>
              <div className="text-xs text-slate-500">Analisa sempre domingo 00:00 → sábado 23:59 · Europe/Lisbon</div>
              {config?.scheduleCronTaskUid ? <Badge className="w-fit bg-emerald-600 text-white hover:bg-emerald-600">Fluxo ativo</Badge> : <Badge variant="outline" className="w-fit">Ainda não ativado</Badge>}
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Relatórios guardados</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{reports.length}</div><p className="mt-1 text-xs text-muted-foreground">Evidência disponível para auditoria</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Alertas relevantes</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold text-amber-700">{relevantCount}</div><p className="mt-1 text-xs text-muted-foreground">Somatório dos relatórios apresentados</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Âmbito</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{categorias.length || 8}</div><p className="mt-1 text-xs text-muted-foreground">Categorias prioritárias acompanhadas</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2"><FileSearch className="h-5 w-5 text-primary" /> Configuração do fluxo</CardTitle><p className="mt-1 text-sm text-muted-foreground">O agente usa a matriz do anexo e o contexto de MP/fornecedor existente no SIGA.</p></div>{isQualidade && <div className="flex gap-2">{!config?.id && <Button variant="outline" onClick={() => initMutation.mutate()} disabled={initMutation.isPending}><Play className="mr-2 h-4 w-4" /> Preparar</Button>}{config?.id && !config.scheduleCronTaskUid && <Button onClick={() => scheduleMutation.mutate({ cron: "0 0 7 * * 1" })} disabled={scheduleMutation.isPending}><CalendarClock className="mr-2 h-4 w-4" /> Ativar fluxo semanal</Button>}</div>}</CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categorias monitorizadas</p><div className="flex flex-wrap gap-2">{categorias.map(category => <Badge key={String(category)} variant="secondary" className="font-normal">{String(category)}</Badge>)}</div></div>
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Perigos prioritários</p><div className="flex flex-wrap gap-2">{perigos.slice(0, 7).map(hazard => <Badge key={String(hazard)} variant="outline" className="font-normal">{String(hazard)}</Badge>)}</div><p className="mt-3 text-xs text-muted-foreground">A consulta pública não expõe marcas ou operadores económicos; uma correspondência deve ser confirmada pela Qualidade.</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-700" /> Histórico de relatórios</CardTitle></CardHeader>
          <CardContent>{reports.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Ainda não existe um relatório. O primeiro será guardado após a execução semanal do agente.</div> : <div className="space-y-3">{reports.map(report => <div key={report.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{report.codigoSemana ?? `Semana ${report.numeroSemana ?? "—"}`}</span><Badge variant="outline" className={statusClass[report.estado] ?? ""}>{report.estado === "sucesso" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}{statusLabel[report.estado] ?? report.estado}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{report.resumo}</p><p className="mt-2 text-xs text-muted-foreground">Gerado em {new Date(report.geradoEm).toLocaleString("pt-PT")} · {report.totalAvaliados} avaliados · {report.totalRelevantes} relevantes</p></div><Button variant="outline" size="sm" onClick={() => downloadMarkdown(report.conteudoMarkdown, report.nomeFicheiro ?? `relatorio-rasff-${report.codigoSemana ?? report.id}.md`)}><Download className="mr-2 h-4 w-4" /> Descarregar</Button></div>)}</div>}</CardContent>
        </Card>
      </div>
    </SigaLayout>
  );
}
