import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Download, ExternalLink, FileSearch, FileText, Info, Play, ShieldCheck, Table2, Upload } from "lucide-react";
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

const MATRIZ_RELEVANCIA = [
  ["Cereais e produtos de padaria", "Micotoxinas (DON, ocratoxina A), corpos estranhos, alergénios não declarados, infestação", "Alta"],
  ["Frutos de casca rija", "Aflatoxinas, Salmonella, alergénios não declarados (amêndoa, avelã, noz)", "Alta"],
  ["Sementes (sésamo, papoila, chia, linhaça, girassol)", "Óxido de etileno, Salmonella, alergénios não declarados (sésamo), alcaloides opiáceos (papoila)", "Alta"],
  ["Frutas desidratadas", "Micotoxinas, resíduos de pesticidas, sulfitos não declarados", "Média"],
  ["Cacau e produtos de chocolate", "Salmonella, óxido de etileno, corpos estranhos, metais pesados (cádmio)", "Média"],
  ["Leite e produtos lácteos", "Salmonella, Listeria monocytogenes, resíduos de antibióticos", "Média"],
  ["Ovos e ovoprodutos", "Salmonella, resíduos de medicamentos veterinários", "Média"],
  ["Gomas e espessantes (xantana, guar, alfarroba, goma arábica)", "Óxido de etileno, cloratos, Salmonella, metais pesados, pureza/adulteração", "Alta"],
  ["Aditivos alimentares e aromas", "Uso não autorizado, excesso de dose, alergénios ocultos", "Média"],
  ["Materiais em contacto com alimentos", "Migração (formaldeído, MOSH/MOAH, bisfenóis), embalagem defeituosa", "Média"],
] as const;

type ManualResultado = { linha: string; relevancia: "Direta" | "Indireta" | "Informativa"; correspondencias: string[] };

function extrairLinhasFicheiro(texto: string): string[] {
  try {
    const parsed: unknown = JSON.parse(texto);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.map(item => typeof item === "string" ? item : JSON.stringify(item)).filter(Boolean);
  } catch {
    return texto.split(/\r?\n/).map(linha => linha.trim()).filter(linha => linha.length > 2);
  }
}

function analisarFicheiro(texto: string, materiasPrimas: Array<Record<string, unknown>>): ManualResultado[] {
  return extrairLinhasFicheiro(texto).slice(0, 500).map(linha => {
    const normalizada = linha.toLocaleLowerCase("pt-PT");
    const correspondencias = materiasPrimas.flatMap(mp => {
      const termos = [mp.nome, mp.codigo, mp.origem, mp.fornecedorNome, mp.paisOrigemFornecedor].filter(value => typeof value === "string" && value.trim().length > 2) as string[];
      return termos.some(termo => normalizada.includes(termo.toLocaleLowerCase("pt-PT"))) ? [String(mp.nome ?? mp.codigo ?? "MP") ] : [];
    }).filter((value, index, values) => values.indexOf(value) === index);
    const relevancia = correspondencias.some(Boolean) ? "Direta" : /farinha|trigo|centeio|pellet|chocolate|cacau|noz|amêndoa|amendoa|avelã|fruta|ovo|leite|alerg|salmonella|aflatox|micotox|pesticida|sulfito/i.test(normalizada) ? "Indireta" : "Informativa";
    return { linha, relevancia, correspondencias };
  });
}

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
  const contextoQuery = trpc.rasff.contexto.useQuery(undefined, { staleTime: 60_000 });
  const [manualFile, setManualFile] = useState<{ name: string; results: ManualResultado[] } | null>(null);
  const [manualBusy, setManualBusy] = useState(false);
  const relevantCount = useMemo(() => reports.reduce((sum, report) => sum + (report.totalRelevantes ?? 0), 0), [reports]);
  const manualSummary = useMemo(() => {
    if (!manualFile) return "";
    const diretas = manualFile.results.filter(item => item.relevancia === "Direta").length;
    const indiretas = manualFile.results.filter(item => item.relevancia === "Indireta").length;
    return `# Resumo de análise RASFF — ${manualFile.name}\n\n- Alertas/linhas analisados: ${manualFile.results.length}\n- Correspondências diretas com MP do SIGA: ${diretas}\n- Correspondências indiretas/setoriais: ${indiretas}\n- Período de análise: ficheiro fornecido pela Qualidade\n\n## Resultados\n\n${manualFile.results.map((item, index) => `${index + 1}. **${item.relevancia}** — ${item.linha}${item.correspondencias.length ? `\\n   - MP correspondentes: ${item.correspondencias.join(", ")}` : ""}`).join("\\n")}`;
  }, [manualFile]);

  const handleManualFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("O ficheiro não pode exceder 5 MB."); return; }
    setManualBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const texto = typeof reader.result === "string" ? reader.result : "";
      const materias = (contextoQuery.data?.materiasPrimas ?? []) as Array<Record<string, unknown>>;
      setManualFile({ name: file.name, results: analisarFicheiro(texto, materias) });
      setManualBusy(false);
      toast.success("Ficheiro analisado. Reveja as correspondências antes de tomar decisões.");
    };
    reader.onerror = () => { setManualBusy(false); toast.error("Não foi possível ler o ficheiro."); };
    reader.readAsText(file);
  };

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
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Analisar ficheiro RASFF</CardTitle><p className="mt-1 text-sm text-muted-foreground">Carregue um CSV, JSON, TXT ou HTML exportado para obter um resumo local e cruzar o conteúdo com as MP, fornecedores e origens do SIGA.</p></div><label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"><Upload className="mr-2 h-4 w-4" /> {manualBusy ? "A analisar…" : "Carregar ficheiro"}<input className="sr-only" type="file" accept=".csv,.json,.txt,.html,.htm,text/csv,application/json,text/plain,text/html" disabled={manualBusy} onChange={event => { handleManualFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></CardHeader>
          <CardContent>{manualFile ? <div className="space-y-4"><div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-emerald-900">{manualFile.name}</p><p className="mt-1 text-xs text-emerald-800">{manualFile.results.length} linhas/alertas analisados · {manualFile.results.filter(item => item.relevancia === "Direta").length} diretos · {manualFile.results.filter(item => item.relevancia === "Indireta").length} indiretos</p></div><Button variant="outline" size="sm" onClick={() => downloadMarkdown(manualSummary, `resumo-rasff-${manualFile.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`)}><Download className="mr-2 h-4 w-4" /> Descarregar resumo</Button></div><div className="max-h-80 space-y-2 overflow-y-auto">{manualFile.results.map((item, index) => <div key={`${index}-${item.linha}`} className="rounded-lg border p-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={item.relevancia === "Direta" ? "border-red-200 bg-red-50 text-red-700" : item.relevancia === "Indireta" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{item.relevancia}</Badge>{item.correspondencias.map(match => <Badge key={match} variant="secondary">MP: {match}</Badge>)}</div><p className="mt-2 break-words text-xs leading-5 text-slate-600">{item.linha}</p></div>)}</div><p className="text-xs leading-5 text-muted-foreground">Esta análise manual é uma triagem local e não cria uma decisão de conformidade. Confirme os resultados pela Qualidade e conserve o ficheiro original segundo o procedimento documental aplicável.</p></div> : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Ainda não foi carregado um ficheiro. O processamento ocorre no navegador e limita-se a 5 MB.</div>}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> Metodologia e critérios de relevância</CardTitle><p className="mt-1 text-sm text-muted-foreground">A análise é uma triagem documentada para apoiar a decisão da Qualidade; não substitui a confirmação oficial junto das autoridades ou do fornecedor.</p></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-5">
              {[['1','Delimitar','Semana civil: domingo 00:00 a sábado 23:59.'],['2','Ler fontes','Pesquisar RASFF Window e fontes oficiais.'],['3','Filtrar','Aplicar categorias e perigos da matriz.'],['4','Cruzar','Comparar MP, fornecedor e origem do SIGA.'],['5','Decidir','Classificar e encaminhar para a Qualidade.']].map(([number, title, description]) => <div key={number} className="rounded-xl border bg-slate-50/70 p-3"><div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{number}</div><p className="text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>)}
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Categoria de produto</th><th className="px-4 py-3">Perigos mais comuns</th><th className="px-4 py-3">Prioridade</th></tr></thead><tbody className="divide-y">{MATRIZ_RELEVANCIA.map(([categoria, perigosMatriz, prioridade]) => <tr key={categoria}><td className="px-4 py-3 font-medium align-top">{categoria}</td><td className="px-4 py-3 text-slate-600 align-top">{perigosMatriz}</td><td className="px-4 py-3 align-top"><Badge variant="outline" className={prioridade === "Alta" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{prioridade}</Badge></td></tr>)}</tbody></table>
            </div>
            <div className="rounded-xl border-l-4 border-amber-600 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Sinal de atenção extra:</strong> qualquer notificação sobre trigo, farinha ou centeio com origem num país de onde a empresa importa matéria-prima, mesmo sem correspondência direta de fornecedor, deve ser registada como vigilância de tendência.</div>
            <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-semibold text-red-800">Direta · ação prioritária</p><p className="mt-1 text-xs leading-5 text-red-700">O alerta contém nome, código, fornecedor ou país/região que coincide com o contexto interno. Abrir a notificação, bloquear/segregar preventivamente quando aplicável e confirmar com a Qualidade.</p></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-800">Indireta · revisão dirigida</p><p className="mt-1 text-xs leading-5 text-amber-700">Não há correspondência exata, mas existe relação por família de ingrediente ou perigo. Verificar fornecedores e origens antes de concluir.</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-800">Informativa · monitorização</p><p className="mt-1 text-xs leading-5 text-slate-600">Alerta setorial sem ligação identificada ao contexto do SIGA. Fica registado para tendência e revisão periódica.</p></div></div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900"><Table2 className="h-4 w-4" /> Fontes de leitura de dados</div><div className="grid gap-3 md:grid-cols-3"><a className="rounded-lg bg-white/80 p-3 text-sm text-blue-800 underline-offset-2 hover:underline" href="https://webgate.ec.europa.eu/rasff-window/screen/search" target="_blank" rel="noreferrer"><span className="flex items-center gap-2 font-medium">RASFF Window — pesquisa pública <ExternalLink className="h-3.5 w-3.5" /></span><span className="mt-1 block text-xs text-slate-600">Notificações públicas desde 2020; sem detalhes comerciais completos.</span></a><a className="rounded-lg bg-white/80 p-3 text-sm text-blue-800 underline-offset-2 hover:underline" href="https://webgate.ec.europa.eu/rasff-window/screen/consumers" target="_blank" rel="noreferrer"><span className="flex items-center gap-2 font-medium">Portal do consumidor RASFF <ExternalLink className="h-3.5 w-3.5" /></span><span className="mt-1 block text-xs text-slate-600">Recolhas e avisos simplificados de saúde pública.</span></a><a className="rounded-lg bg-white/80 p-3 text-sm text-blue-800 underline-offset-2 hover:underline" href="https://food.ec.europa.eu/food-safety/rasff_en" target="_blank" rel="noreferrer"><span className="flex items-center gap-2 font-medium">Comissão Europeia — RASFF <ExternalLink className="h-3.5 w-3.5" /></span><span className="mt-1 block text-xs text-slate-600">Enquadramento, finalidade e base legal do sistema.</span></a></div></div>
            <p className="text-xs leading-5 text-muted-foreground">Limitação importante: a consulta pública é uma ferramenta de triagem. Quando não expõe operador, marca ou lote, o agente não pode confirmar sozinho que o alerta afeta uma MP específica; nesse caso, o resultado é marcado para validação da Qualidade.</p>
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
