import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Download, FileSearch, Radar, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import mammoth from "mammoth/mammoth.browser";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SigaLayout } from "@/components/SigaLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type Ocorrencia = { chave?: string; titulo: string; categoria?: string; origem?: string; pratica?: string; resumo: string; probabilidade: number; impacto: number; score: number; nivel: "Alto" | "Médio" | "Baixo"; relevante: boolean; materiasPrimas: string[]; fontes: string[] };

const CATEGORIAS = ["cereais e farinhas", "frutos de casca rija e sementes", "frutas secas e cristalizadas", "cacau e chocolate", "especiarias e ervas", "óleos e gorduras", "aditivos e auxiliares tecnológicos", "ingredientes compostos"];
const TERMOS = ["farinha", "trigo", "centeio", "milho", "amêndoa", "amendoa", "avelã", "avelã", "noz", "sultana", "fruta", "chocolate", "cacau", "canela", "azeite", "óleo", "pesticida", "adulteração", "fraude", "substituição"];

function risco(texto: string, matches: string[]) {
  const t = texto.toLocaleLowerCase("pt-PT");
  const probabilidade = matches.length > 0 ? 3 : TERMOS.some(term => t.includes(term)) ? 2 : 1;
  const impacto = /adulter|substitui|não declarado|nao declarado|tóxic|toxic|alerg|pesticid|micotox/i.test(t) ? 3 : /fraude|food fraud|falsifica/i.test(t) ? 2 : 1;
  const score = probabilidade * impacto;
  return { probabilidade, impacto, score, nivel: score >= 6 ? "Alto" : score >= 3 ? "Médio" : "Baixo" } as const;
}

function analisar(texto: string, mps: Array<Record<string, unknown>>): Ocorrencia[] {
  return texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 2).map((linha, index) => {
    const lower = linha.toLocaleLowerCase("pt-PT");
    const matches = mps.flatMap(mp => {
      const termos = [mp.nome, mp.codigo, mp.origem, mp.fornecedorNome, mp.paisOrigemFornecedor].filter(v => typeof v === "string" && v.length > 2) as string[];
      return termos.some(term => lower.includes(term.toLocaleLowerCase("pt-PT"))) ? [String(mp.nome ?? mp.codigo)] : [];
    }).filter((v, i, a) => a.indexOf(v) === i);
    const r = risco(linha, matches);
    return { chave: `manual-${index}`, titulo: linha.slice(0, 180), resumo: linha, probabilidade: r.probabilidade, impacto: r.impacto, score: r.score, nivel: r.nivel, relevante: matches.length > 0 || r.score >= 6, materiasPrimas: matches, fontes: (linha.match(/https?:\/\/[^\s]+/g) ?? []).slice(0, 5) };
  });
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ".xlsx,.xls,.xlsm,.ods,.docx,.doc,.pdf,.jpg,.jpeg,.png,.csv,.json,.txt,.html";

async function lerPdf(buffer: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= pdf.numPages; pagina += 1) {
    const page = await pdf.getPage(pagina);
    const content = await page.getTextContent();
    const texto = content.items.map(item => "str" in item ? item.str : "").join(" ").trim();
    if (texto) paginas.push(`# Página ${pagina}\n${texto}`);
  }
  if (!paginas.length) throw new Error("O PDF não contém texto selecionável. Para PDFs digitalizados, carregue a imagem da página ou um PDF com OCR.");
  return paginas.join("\n\n");
}

async function lerImagem(file: File) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por+eng");
  try {
    const result = await worker.recognize(file);
    const texto = result.data.text.trim();
    if (!texto) throw new Error("Não foi detetado texto na imagem.");
    return texto;
  } finally {
    await worker.terminate();
  }
}

async function lerFicheiro(file: File) {
  if (file.size > MAX_FILE_SIZE) throw new Error("O ficheiro excede o limite de 20 MB.");
  const extensao = file.name.split(".").pop()?.toLocaleLowerCase("pt-PT") ?? "";
  const buffer = await file.arrayBuffer();
  if (["xlsx", "xls", "xlsm", "ods"].includes(extensao)) {
    const book = XLSX.read(buffer, { type: "array" });
    return book.SheetNames.map(name => `# ${name}\n${XLSX.utils.sheet_to_csv(book.Sheets[name], { blankrows: false })}`).join("\n\n");
  }
  if (extensao === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    if (!result.value.trim()) throw new Error("O documento Word não contém texto legível.");
    return result.value;
  }
  if (extensao === "doc") throw new Error("O formato Word .doc antigo não é suportado diretamente. Guarde o documento como .docx e carregue-o novamente.");
  if (extensao === "pdf") return lerPdf(buffer);
  if (["jpg", "jpeg", "png"].includes(extensao)) return lerImagem(file);
  if (["csv", "json", "txt", "html"].includes(extensao)) return new TextDecoder().decode(buffer);
  throw new Error("Formato não suportado. Use Excel, Word .docx, PDF, JPG/JPEG, PNG, CSV, JSON, TXT ou HTML.");
}

export default function VigilanciaFoodFraud() {
  const { user } = useAuth();
  const isQualidade = user?.role === "qualidade";
  const configQuery = trpc.foodFraud.config.useQuery(undefined, { staleTime: 30_000 });
  const reportsQuery = trpc.foodFraud.relatorios.useQuery(undefined, { staleTime: 15_000 });
  const contextoQuery = trpc.foodFraud.contexto.useQuery(undefined, { staleTime: 60_000 });
  const init = trpc.foodFraud.inicializar.useMutation({ onSuccess: () => { toast.success("Vigilância Food Fraud preparada."); void configQuery.refetch(); }, onError: e => toast.error(e.message) });
  const schedule = trpc.foodFraud.ativarAgendamento.useMutation({ onSuccess: () => { toast.success("Fluxo mensal ativado."); void configQuery.refetch(); }, onError: e => toast.error(e.message) });
  const guardar = trpc.foodFraud.guardarAnaliseManual.useMutation({ onSuccess: () => { toast.success("Relatório guardado no histórico."); void reportsQuery.refetch(); }, onError: e => toast.error(e.message) });
  const [results, setResults] = useState<Ocorrencia[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7));
  const config = configQuery.data;
  const mps = (contextoQuery.data?.materiasPrimas ?? []) as Array<Record<string, unknown>>;
  const relevantes = useMemo(() => results.filter(r => r.relevante), [results]);

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true); setFileName(file.name);
    try { setResults(analisar(await lerFicheiro(file), mps)); toast.success("Ficheiro analisado. Reveja a avaliação antes de arquivar."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível ler o ficheiro."); }
    finally { setBusy(false); }
  }

  function guardarRelatorio() {
    if (!results.length) return toast.error("Carregue primeiro um relatório para analisar.");
    const inicio = new Date(`${periodo}-01T00:00:00.000Z`);
    const fim = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0, 23, 59, 59));
    guardar.mutate({ ficheiro: fileName || `food-fraud-${periodo}.txt`, periodoInicio: inicio.toISOString(), periodoFim: fim.toISOString(), totalAvaliados: results.length, totalRelevantes: relevantes.length, resumo: `Análise Food Fraud de ${periodo}: ${results.length} ocorrências avaliadas, ${relevantes.length} relevantes.`, ocorrencias: results, fontes: Array.from(new Set(results.flatMap(r => r.fontes))) });
  }

  function exportar() {
    const rows = results.map((r, i) => ({ Nº: i + 1, Título: r.titulo, Categoria: r.categoria ?? "", Origem: r.origem ?? "", Probabilidade: r.probabilidade, Impacto: r.impacto, "Pontuação": r.score, Nível: r.nivel, "MP afetadas": r.materiasPrimas.join(", "), Resumo: r.resumo, Fontes: r.fontes.join(", ") }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Food Fraud"); XLSX.writeFile(wb, `food-fraud-${periodo}.xlsx`);
  }

  return <SigaLayout title="Vigilância Food Fraud" subtitle="Leitura mensal, avaliação de risco e rastreabilidade das decisões">
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CalendarClock className="h-4 w-4 text-primary" /> Periodicidade</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">Mensal</p><p className="text-xs text-muted-foreground">Janela: mês civil completo</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Radar className="h-4 w-4 text-primary" /> Estado do fluxo</CardTitle></CardHeader><CardContent><Badge variant={config?.ativa ? "default" : "secondary"}>{config?.ativa ? "Ativo" : "Por configurar"}</Badge><p className="mt-2 text-xs text-muted-foreground">Fonte: EU Agri-Food Fraud Network</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-amber-600" /> Resultado atual</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{relevantes.length}</p><p className="text-xs text-muted-foreground">ocorrências potencialmente relevantes</p></CardContent></Card>
      </section>

      {isQualidade && <Card><CardHeader><CardTitle>Configuração e execução</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => init.mutate()} disabled={init.isPending}><CheckCircle2 className="mr-2 h-4 w-4" />Preparar vigilância</Button><Button onClick={() => schedule.mutate({ cron: config?.cronExpression ?? "0 0 7 1 * *" })} disabled={schedule.isPending}><CalendarClock className="mr-2 h-4 w-4" />Ativar mês civil</Button><span className="self-center text-xs text-muted-foreground">Agendamento UTC configurado: {config?.cronExpression ?? "0 0 7 1 * *"}</span></CardContent></Card>}

      <Card><CardHeader><CardTitle className="flex items-center justify-between gap-3"><span>Análise manual de relatório</span><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"><Upload className="h-4 w-4" />{busy ? "A ler…" : "Carregar ficheiro"}<input className="hidden" type="file" accept={ACCEPTED_EXTENSIONS} onChange={e => void onFile(e.target.files?.[0])} /></label></CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap items-center gap-3"><label className="text-sm">Mês do relatório <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="ml-2 rounded-md border px-2 py-1" /></label>{fileName && <span className="text-xs text-muted-foreground"><FileSearch className="mr-1 inline h-4 w-4" />{fileName}</span>}<Button variant="outline" onClick={exportar} disabled={!results.length}><Download className="mr-2 h-4 w-4" />Excel</Button><Button onClick={guardarRelatorio} disabled={!results.length || guardar.isPending}>Guardar no histórico</Button></div><div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground"><strong>Formatos aceites:</strong> Excel (.xlsx, .xls, .xlsm, .ods), Word (.docx), PDF, JPG/JPEG, PNG, CSV, JSON, TXT e HTML. PDFs digitalizados e imagens são lidos por OCR; o resultado deve ser revisto pela Qualidade. O limite é 20 MB. <span className="mx-1">·</span> A matriz operacional calcula <strong>Probabilidade × Impacto</strong>: 1–2 Baixo, 3–5 Médio e 6–9 Alto. A correspondência com uma MP, fornecedor ou origem registados torna a ocorrência prioritária para revisão pela Qualidade.</div>{results.length > 0 && <div className="space-y-3">{results.map((r, i) => <div key={r.chave ?? i} className="rounded-lg border p-3"><div className="flex flex-wrap items-center gap-2"><Badge className={r.nivel === "Alto" ? "bg-red-600" : r.nivel === "Médio" ? "bg-amber-500" : "bg-emerald-600"}>{r.nivel} · {r.score}/9</Badge><span className="font-medium">{r.titulo}</span>{r.materiasPrimas.length > 0 && <Badge variant="outline">MP: {r.materiasPrimas.join(", ")}</Badge>}</div><p className="mt-2 text-sm text-muted-foreground">{r.resumo}</p><p className="mt-1 text-xs">Probabilidade {r.probabilidade}/3 · Impacto {r.impacto}/3</p></div>)}</div>}</CardContent></Card>

      <Card><CardHeader><CardTitle>Histórico mensal auditável</CardTitle></CardHeader><CardContent className="space-y-2">{(reportsQuery.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Ainda não existem relatórios arquivados.</p> : (reportsQuery.data ?? []).map(report => <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{report.anoMes} · {report.nomeFicheiro}</p><p className="text-xs text-muted-foreground">{report.totalAvaliados} avaliados · {report.totalRelevantes} relevantes · {new Date(report.geradoEm).toLocaleString("pt-PT")}</p></div><Badge variant={report.estado === "sucesso" ? "default" : "secondary"}>{report.estado}</Badge></div>)}</CardContent></Card>

      <Card><CardHeader><CardTitle>Metodologia e fontes</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm md:grid-cols-2"><div><p className="font-medium">Âmbito</p><p className="text-muted-foreground">São lidos relatórios públicos de fraude alimentar e cruzados com MP ativas, fornecedores associados e países de origem existentes no SIGA.</p></div><div><p className="font-medium">Fontes configuradas</p><ul className="list-disc pl-5 text-muted-foreground">{CATEGORIAS.map(c => <li key={c}>{c}</li>)}</ul></div></CardContent></Card>
    </div>
  </SigaLayout>;
}
