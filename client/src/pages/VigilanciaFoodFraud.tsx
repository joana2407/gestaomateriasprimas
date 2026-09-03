/**
 * Design system: integrar a matriz de triagem na linguagem SIGA existente — cartões sóbrios,
 * verde institucional, sinais de risco legíveis e ações humanas explícitas, sem automatismos opacos.
 */
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSearch,
  Radar,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
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
import {
  FoodFraudCriterio,
  FoodFraudOcorrencia,
  FoodFraudTipoRelacao,
  MATRIZ_FOOD_FRAUD_VERSAO,
  normalizarOcorrenciaFoodFraud,
  extrairDataNotificacao,
} from "@shared/food-fraud";

const TERMOS = [
  "farinha",
  "trigo",
  "centeio",
  "milho",
  "amêndoa",
  "amendoa",
  "avelã",
  "noz",
  "sultana",
  "fruta",
  "chocolate",
  "cacau",
  "canela",
  "azeite",
  "óleo",
  "pesticida",
  "adulteração",
  "fraude",
  "substituição",
];
const TERMOS_ALERTA = [
  ...TERMOS,
  "contrafação",
  "contrafacao",
  "não conformidade",
  "nao conformidade",
  "substância",
  "substancia",
  "contamin",
  "rotulagem",
  "origem",
  "autenticidade",
  "composição",
  "composicao",
];
const MARCADORES_ESTRUTURA =
  /^(#\s*(página|pagina|sheet|folha)|página\s+\d+|pagina\s+\d+|relatório|relatorio|monthly report|food fraud network|índice|indice|sumário|sumario|metodologia|fonte|fontes|data de emissão|data de emissao|gerado em|total de|número de|numero de|observações gerais|observacoes gerais|notas?[:：]?\s*$)/i;
const DATA_ALERTA =
  /\b(?:\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}|jan(?:eiro)?|fev(?:ereiro)?|mar(?:ço|co)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\b/i;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS =
  ".xlsx,.xls,.xlsm,.ods,.docx,.doc,.pdf,.jpg,.jpeg,.png,.csv,.json,.txt,.html";
const SELECT_CLASS =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs shadow-sm outline-none focus:ring-2 focus:ring-primary/30";

const CRITERIOS: Array<{
  key: FoodFraudCriterio;
  label: string;
  hint: string;
}> = [
  {
    key: "p2",
    label: "P2 · Recorrência",
    hint: "1 uma ocorrência · 2 duas a três · 3 quatro ou mais/padrão oficial",
  },
  {
    key: "p3",
    label: "P3 · Vulnerabilidade-base",
    hint: "1 MP e cadeia baixas · 2 pelo menos uma média · 3 pelo menos uma alta",
  },
  {
    key: "i1",
    label: "I1 · Natureza da prática",
    hint: "1 documental · 2 origem/qualidade/certificação · 3 adulteração, substituição ou falsificação",
  },
  {
    key: "i2",
    label: "I2 · Extensão da exposição",
    hint: "1 delimitada · 2 uma MP/fornecedor/linha · 3 múltipla ou rastreabilidade insuficiente",
  },
  {
    key: "i3",
    label: "I3 · Deteção",
    hint: "1 controlo rotineiro · 2 controlo reforçado · 3 ensaio especializado/externo",
  },
  {
    key: "i4",
    label: "I4 · Consequência",
    hint: "1 interna simples · 2 contratual/económica moderada · 3 legal, cliente, reputação ou abastecimento",
  },
];

function pareceAlerta(linha: string) {
  const limpa = linha.replace(/^[#*\-–—\s]+/, "").trim();
  if (limpa.length < 20 || MARCADORES_ESTRUTURA.test(limpa)) return false;
  const lower = limpa.toLocaleLowerCase("pt-PT");
  const temUrlOuIdentificador =
    /https?:\/\/|\b(?:ffn|rasff|food fraud)[\s#:/-]*[a-z]?\d{2,}/i.test(limpa);
  const termos = TERMOS_ALERTA.filter(term =>
    lower.includes(term.toLocaleLowerCase("pt-PT"))
  ).length;
  const temColunas =
    /[;|\t]/.test(limpa) && limpa.split(/[;|\t]/).filter(Boolean).length >= 3;
  return (
    temUrlOuIdentificador ||
    termos >= 2 ||
    (temColunas && (DATA_ALERTA.test(limpa) || termos >= 1))
  );
}

function analisar(
  texto: string,
  mps: Array<Record<string, unknown>>
): FoodFraudOcorrencia[] {
  return texto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(pareceAlerta)
    .map((linha, index) => {
      const lower = linha.toLocaleLowerCase("pt-PT");
      const matches = mps
        .flatMap(mp => {
          const termos = [
            mp.nome,
            mp.codigo,
            mp.origem,
            mp.fornecedorNome,
            mp.paisOrigemFornecedor,
          ].filter(v => typeof v === "string" && v.length > 2) as string[];
          return termos.some(term =>
            lower.includes(term.toLocaleLowerCase("pt-PT"))
          )
            ? [String(mp.nome ?? mp.codigo)]
            : [];
        })
        .filter((v, i, all) => all.indexOf(v) === i);
      return normalizarOcorrenciaFoodFraud(
        {
          chave: `manual-${index}`,
          titulo: linha.slice(0, 180),
          resumo: linha,
          dataNotificacao: extrairDataNotificacao(linha),
          tipoRelacao: matches.length ? "indireta" : "informativa",
          materiasPrimas: matches,
          evidenciaCorrespondencia: matches,
          fontes: (linha.match(/https?:\/\/[^\s]+/g) ?? []).slice(0, 5),
        },
        index
      );
    });
}

async function lerPdf(buffer: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= pdf.numPages; pagina += 1) {
    const page = await pdf.getPage(pagina);
    const content = await page.getTextContent();
    const texto = content.items
      .map(item => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (texto) paginas.push(`# Página ${pagina}\n${texto}`);
  }
  if (!paginas.length)
    throw new Error(
      "O PDF não contém texto selecionável. Para PDFs digitalizados, carregue uma imagem ou um PDF com OCR."
    );
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
  if (file.size > MAX_FILE_SIZE)
    throw new Error("O ficheiro excede o limite de 20 MB.");
  const extensao = file.name.split(".").pop()?.toLocaleLowerCase("pt-PT") ?? "";
  const buffer = await file.arrayBuffer();
  if (["xlsx", "xls", "xlsm", "ods"].includes(extensao)) {
    const book = XLSX.read(buffer, { type: "array" });
    return book.SheetNames.map(
      name =>
        `# ${name}\n${XLSX.utils.sheet_to_csv(book.Sheets[name], { blankrows: false })}`
    ).join("\n\n");
  }
  if (extensao === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    if (!result.value.trim())
      throw new Error("O documento Word não contém texto legível.");
    return result.value;
  }
  if (extensao === "doc")
    throw new Error(
      "O formato Word .doc antigo não é suportado diretamente. Guarde o documento como .docx e carregue-o novamente."
    );
  if (extensao === "pdf") return lerPdf(buffer);
  if (["jpg", "jpeg", "png"].includes(extensao)) return lerImagem(file);
  if (["csv", "json", "txt", "html"].includes(extensao))
    return new TextDecoder().decode(buffer);
  throw new Error(
    "Formato não suportado. Use Excel, Word .docx, PDF, JPG/JPEG, PNG, CSV, JSON, TXT ou HTML."
  );
}

function badgeClass(
  nivel: FoodFraudOcorrencia["nivel"],
  estado: FoodFraudOcorrencia["estadoTriagem"]
) {
  if (estado === "por_validar") return "bg-amber-500 text-white";
  if (estado === "informativa" || estado === "sem_correspondencia")
    return "bg-slate-500 text-white";
  if (nivel === "Crítico") return "bg-red-700 text-white";
  if (nivel === "Alto") return "bg-red-600 text-white";
  if (nivel === "Médio") return "bg-amber-600 text-white";
  return "bg-emerald-700 text-white";
}

export default function VigilanciaFoodFraud() {
  const { user } = useAuth();
  const isQualidade = user?.role === "qualidade";
  const configQuery = trpc.foodFraud.config.useQuery(undefined, {
    staleTime: 30_000,
  });
  const reportsQuery = trpc.foodFraud.relatorios.useQuery(undefined, {
    staleTime: 15_000,
  });
  const contextoQuery = trpc.foodFraud.contexto.useQuery(undefined, {
    staleTime: 60_000,
  });
  const init = trpc.foodFraud.inicializar.useMutation({
    onSuccess: () => {
      toast.success("Vigilância Food Fraud preparada.");
      void configQuery.refetch();
    },
    onError: e => toast.error(e.message),
  });
  const schedule = trpc.foodFraud.ativarAgendamento.useMutation({
    onSuccess: () => {
      toast.success("Fluxo mensal ativado.");
      void configQuery.refetch();
    },
    onError: e => toast.error(e.message),
  });
  const guardar = trpc.foodFraud.guardarAnaliseManual.useMutation({
    onSuccess: () => {
      toast.success("Relatório guardado no histórico.");
      void reportsQuery.refetch();
    },
    onError: e => toast.error(e.message),
  });
  const eliminar = trpc.foodFraud.eliminarRelatorio.useMutation({
    onSuccess: () => {
      toast.success("Relatório eliminado do histórico.");
      void reportsQuery.refetch();
    },
    onError: e => toast.error(e.message),
  });
  const [results, setResults] = useState<FoodFraudOcorrencia[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [periodo, setPeriodo] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [fonteManual, setFonteManual] = useState("");
  const config = configQuery.data;
  const mps = (contextoQuery.data?.materiasPrimas ?? []) as Array<
    Record<string, unknown>
  >;
  const fontesOficiais = (
    Array.isArray(config?.fontes) ? config.fontes : []
  ).map(String);
  useEffect(() => {
    if (!fonteManual && fontesOficiais[0]) setFonteManual(fontesOficiais[0]);
  }, [fonteManual, fontesOficiais]);
  const resultadosFiltrados = useMemo(
    () =>
      results.filter(
        r =>
          (!dataInicio || (r.dataNotificacao ?? "") >= dataInicio) &&
          (!dataFim || (r.dataNotificacao ?? "") <= dataFim)
      ),
    [results, dataInicio, dataFim]
  );
  const relevantes = useMemo(
    () => resultadosFiltrados.filter(r => r.relevante),
    [resultadosFiltrados]
  );
  const acoes = useMemo(
    () =>
      resultadosFiltrados.filter(
        r => r.acaoRequerida || r.estadoTriagem === "por_validar"
      ),
    [resultadosFiltrados]
  );

  function atualizarOcorrencia(chave: string, patch: Record<string, unknown>) {
    setResults(current =>
      current.map((item, index) =>
        item.chave === chave
          ? normalizarOcorrenciaFoodFraud({ ...item, ...patch }, index)
          : item
      )
    );
  }
  function atualizarCriterio(
    chave: string,
    criterio: FoodFraudCriterio,
    valor: string
  ) {
    const item = results.find(result => result.chave === chave);
    if (!item) return;
    atualizarOcorrencia(chave, {
      criterios: {
        ...item.criterios,
        [criterio]: valor ? Number(valor) : undefined,
      },
    });
  }
  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setFileName(file.name);
    try {
      const texto = await lerFicheiro(file);
      const alertas = analisar(texto, mps);
      setResults(alertas);
      toast[alertas.length ? "success" : "warning"](
        alertas.length
          ? "Ocorrências reconhecidas. Complete a triagem antes de arquivar."
          : "Não foram reconhecidas ocorrências no ficheiro. Cabeçalhos e texto auxiliar foram ignorados."
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível ler o ficheiro."
      );
    } finally {
      setBusy(false);
    }
  }
  function guardarRelatorio() {
    if (!results.length)
      return toast.error("Carregue primeiro um relatório para analisar.");
    const fonteSelecionada =
      fonteManual.match(/https?:\/\/\S+/)?.[0] ?? fonteManual;
    const fontes = Array.from(
      new Set(
        [fonteSelecionada, ...results.flatMap(r => r.fontes)].filter(Boolean)
      )
    );
    if (!fontes.length)
      return toast.error(
        "Selecione a fonte utilizada antes de guardar o relatório."
      );
    const inicio = new Date(`${periodo}-01T00:00:00.000Z`);
    const fim = new Date(
      Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0, 23, 59, 59)
    );
    guardar.mutate({
      ficheiro: fileName || `food-fraud-${periodo}.txt`,
      periodoInicio: inicio.toISOString(),
      periodoFim: fim.toISOString(),
      totalAvaliados: results.length,
      totalRelevantes: relevantes.length,
      resumo: `Análise Food Fraud ${MATRIZ_FOOD_FRAUD_VERSAO} de ${periodo}: ${results.length} ocorrências avaliadas, ${relevantes.length} com relação SIGA e ${acoes.length} pendentes de ação/validação.`,
      ocorrencias: results,
      fontes,
    });
  }
  function exportar() {
    const rows = resultadosFiltrados.map((r, i) => ({
      Nº: i + 1,
      Estado: r.estadoTriagem,
      Relação: r.tipoRelacao,
      "Data da notificação": r.dataNotificacao ?? "Não identificada",
      Título: r.titulo,
      "P1 automático": r.criterios.p1 ?? "",
      P2: r.criterios.p2 ?? "",
      P3: r.criterios.p3 ?? "",
      I1: r.criterios.i1 ?? "",
      I2: r.criterios.i2 ?? "",
      I3: r.criterios.i3 ?? "",
      I4: r.criterios.i4 ?? "",
      Probabilidade: r.probabilidade ?? "",
      Impacto: r.impacto ?? "",
      Pontuação: r.score ?? "",
      Nível: r.nivel ?? "",
      "MP relacionadas": r.materiasPrimas.join(", "),
      Evidências: r.evidenciaCorrespondencia.join(" | "),
      Medidas: r.medidasRecomendadas.join(" | "),
      Fontes: r.fontes.join(" | "),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows),
      "Food Fraud"
    );
    XLSX.writeFile(wb, `food-fraud-${periodo}.xlsx`);
  }

  return (
    <SigaLayout
      title="Vigilância Food Fraud"
      subtitle="Leitura mensal, triagem versionada e rastreabilidade das decisões"
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarClock className="h-4 w-4 text-primary" /> Periodicidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">Mensal</p>
              <p className="text-xs text-muted-foreground">
                Janela: mês civil completo
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Radar className="h-4 w-4 text-primary" /> Estado do fluxo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={config?.ativa ? "default" : "secondary"}>
                {config?.ativa ? "Ativo" : "Por configurar"}
              </Badge>
              <p className="mt-2 text-xs text-muted-foreground">
                Matriz operacional {MATRIZ_FOOD_FRAUD_VERSAO}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-amber-600" /> Revisão
                necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{acoes.length}</p>
              <p className="text-xs text-muted-foreground">
                ocorrências por validar ou com ação
              </p>
            </CardContent>
          </Card>
        </section>
        {isQualidade && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração e execução</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => init.mutate()}
                disabled={init.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Preparar vigilância
              </Button>
              <Button
                onClick={() =>
                  schedule.mutate({
                    cron: config?.cronExpression ?? "0 0 7 1 * *",
                  })
                }
                disabled={schedule.isPending}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Ativar mês civil
              </Button>
              <span className="self-center text-xs text-muted-foreground">
                Agendamento UTC configurado:{" "}
                {config?.cronExpression ?? "0 0 7 1 * *"}
              </span>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Análise manual de relatório</span>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent">
                <Upload className="h-4 w-4" />
                {busy ? "A ler…" : "Carregar ficheiro"}
                <input
                  className="hidden"
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={e => void onFile(e.target.files?.[0])}
                />
              </label>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm">
                Mês do relatório{" "}
                <input
                  type="month"
                  value={periodo}
                  onChange={e => setPeriodo(e.target.value)}
                  className="ml-2 rounded-md border px-2 py-1"
                />
              </label>
              <label className="text-sm">
                Fonte utilizada{" "}
                <select
                  value={fonteManual}
                  onChange={e => setFonteManual(e.target.value)}
                  className="ml-2 max-w-72 rounded-md border bg-background px-2 py-1"
                >
                  <option value="">Selecionar fonte</option>
                  {fontesOficiais.map(fonte => (
                    <option key={fonte} value={fonte}>
                      {fonte.replace(/\s*—\s*https?:\/\/\S+/, "")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Data inicial{" "}
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="ml-2 rounded-md border px-2 py-1"
                />
              </label>
              <label className="text-sm">
                Data final{" "}
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="ml-2 rounded-md border px-2 py-1"
                />
              </label>
              {fileName && (
                <span className="text-xs text-muted-foreground">
                  <FileSearch className="mr-1 inline h-4 w-4" />
                  {fileName}
                </span>
              )}
              <Button
                variant="outline"
                onClick={exportar}
                disabled={!results.length}
              >
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button
                onClick={guardarRelatorio}
                disabled={!results.length || guardar.isPending}
              >
                Guardar no histórico
              </Button>
            </div>
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-foreground">
              <strong>Matriz {MATRIZ_FOOD_FRAUD_VERSAO}.</strong> A relação SIGA
              é o filtro inicial. Para relações direta/indireta, P = média de
              P1–P3 e I = média de I1–I4; R = P × I. Sem evidência suficiente, a
              ocorrência fica <strong>por validar</strong>, sem pontuação
              inferida.
            </div>
            {results.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Carregue um relatório para reconhecer ocorrências e iniciar a
                triagem auditável.
              </div>
            )}
          </CardContent>
        </Card>
        {resultadosFiltrados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" /> Triagem
                de ocorrências{" "}
                <Badge variant="outline">{MATRIZ_FOOD_FRAUD_VERSAO}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resultadosFiltrados.map((r, index) => (
                <article
                  key={r.chave ?? index}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={badgeClass(r.nivel, r.estadoTriagem)}>
                          {r.estadoTriagem === "avaliada"
                            ? `${r.nivel} · ${r.score}/9`
                            : r.estadoTriagem.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline">{r.tipoRelacao}</Badge>
                        {r.dataNotificacao && (
                          <span className="text-xs text-muted-foreground">
                            Notificação:{" "}
                            {new Date(
                              `${r.dataNotificacao}T00:00:00`
                            ).toLocaleDateString("pt-PT")}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-medium leading-snug">
                        {r.titulo}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.resumo}
                      </p>
                      {r.materiasPrimas.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Correspondência sugerida:{" "}
                          <strong className="text-foreground">
                            {r.materiasPrimas.join(", ")}
                          </strong>
                          . Confirme documentalmente antes de marcar como
                          direta.
                        </p>
                      )}
                    </div>
                    <div className="w-full sm:w-48">
                      <label className="text-xs font-medium text-muted-foreground">
                        Relação com SIGA
                        <select
                          className={`${SELECT_CLASS} mt-1`}
                          value={r.tipoRelacao}
                          onChange={e =>
                            atualizarOcorrencia(r.chave, {
                              tipoRelacao: e.target
                                .value as FoodFraudTipoRelacao,
                            })
                          }
                        >
                          <option value="direta">Direta</option>
                          <option value="indireta">Indireta</option>
                          <option value="informativa">Informativa</option>
                          <option value="sem_correspondencia">
                            Sem correspondência
                          </option>
                        </select>
                      </label>
                    </div>
                  </div>
                  {(r.tipoRelacao === "direta" ||
                    r.tipoRelacao === "indireta") && (
                    <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs font-semibold">
                          P1 · Grau de correspondência
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Definido automaticamente pela relação:{" "}
                          <strong>{r.criterios.p1}/3</strong>.
                        </p>
                      </div>
                      {CRITERIOS.map(criterio => (
                        <label
                          key={criterio.key}
                          className="rounded-lg border p-3 text-xs"
                        >
                          <span className="font-semibold">
                            {criterio.label}
                          </span>
                          <select
                            className={`${SELECT_CLASS} mt-2`}
                            value={r.criterios[criterio.key] ?? ""}
                            onChange={e =>
                              atualizarCriterio(
                                r.chave,
                                criterio.key,
                                e.target.value
                              )
                            }
                          >
                            <option value="">Sem evidência</option>
                            <option value="1">1 — Baixo</option>
                            <option value="2">2 — Médio</option>
                            <option value="3">3 — Alto</option>
                          </select>
                          <span className="mt-2 block leading-relaxed text-muted-foreground">
                            {criterio.hint}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <p className="text-xs font-semibold">
                        Decisão de triagem
                      </p>
                      <p className="mt-1 text-sm">
                        {r.medidasRecomendadas.join(" ")}
                      </p>
                      {r.regraPrevalencia && (
                        <p className="mt-2 text-xs text-amber-700">
                          Regra de prevalência aplicada:{" "}
                          {r.regraPrevalencia === "impacto_direto"
                            ? "relação direta com impacto elevado"
                            : "relação direta com nível mínimo médio"}
                          .
                        </p>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <Badge variant="outline">
                        P {r.probabilidade ?? "—"}
                      </Badge>
                      <Badge variant="outline">I {r.impacto ?? "—"}</Badge>
                      <Badge className={badgeClass(r.nivel, r.estadoTriagem)}>
                        R {r.score ?? "—"}
                      </Badge>
                    </div>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Histórico mensal auditável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(reportsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não existem relatórios arquivados.
              </p>
            ) : (
              (reportsQuery.data ?? []).map(report => {
                const fontesRelatorio = Array.isArray(report.fontes)
                  ? report.fontes.map(String)
                  : [];
                const ocorrencias = Array.isArray(report.ocorrencias)
                  ? (report.ocorrencias as Array<Record<string, unknown>>)
                  : [];
                const pendentes = ocorrencias.filter(
                  item => item.estadoTriagem === "por_validar"
                ).length;
                const criticas = ocorrencias.filter(
                  item => item.nivel === "Crítico"
                ).length;
                return (
                  <div
                    key={report.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {report.anoMes} · {report.nomeFicheiro}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.totalAvaliados} avaliados ·{" "}
                        {report.totalRelevantes} com relação SIGA ·{" "}
                        {new Date(report.geradoEm).toLocaleString("pt-PT")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ocorrencias.length > 0 && (
                          <Badge variant="outline">
                            {MATRIZ_FOOD_FRAUD_VERSAO}
                          </Badge>
                        )}
                        {pendentes > 0 && (
                          <Badge className="bg-amber-500 text-white">
                            {pendentes} por validar
                          </Badge>
                        )}
                        {criticas > 0 && (
                          <Badge className="bg-red-700 text-white">
                            {criticas} críticas
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        {fontesRelatorio.length ? (
                          fontesRelatorio.map(fonte =>
                            /^https?:\/\//.test(fonte) ? (
                              <a
                                key={fonte}
                                href={fonte}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline-offset-4 hover:underline"
                              >
                                Fonte utilizada: {new URL(fonte).hostname}
                              </a>
                            ) : (
                              <span
                                key={fonte}
                                className="text-muted-foreground"
                              >
                                Fonte utilizada: {fonte}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-muted-foreground">
                            Fonte específica não registada.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          report.estado === "sucesso" ? "default" : "secondary"
                        }
                      >
                        {report.estado}
                      </Badge>
                      {isQualidade && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Eliminar relatório ${report.anoMes}`}
                          title="Eliminar relatório"
                          disabled={eliminar.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Eliminar o relatório ${report.anoMes}? Esta ação não pode ser anulada.`
                              )
                            )
                              eliminar.mutate({ id: report.id });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" /> Metodologia e
              fontes
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm lg:grid-cols-4">
            <div>
              <p className="font-medium">1. Relação SIGA</p>
              <p className="text-muted-foreground">
                Direta, indireta, informativa ou sem correspondência, sempre com
                evidência preservada.
              </p>
            </div>
            <div>
              <p className="font-medium">2. Probabilidade</p>
              <p className="text-muted-foreground">
                P1 automático; P2 recorrência; P3 vulnerabilidade da MP/cadeia.
              </p>
            </div>
            <div>
              <p className="font-medium">3. Impacto</p>
              <p className="text-muted-foreground">
                Prática, extensão, deteção e consequência para a organização.
              </p>
            </div>
            <div>
              <p className="font-medium">4. Tratamento</p>
              <p className="text-muted-foreground">
                Risco alto/crítico ou evidência incompleta exige revisão pela
                Qualidade; não há bloqueio automático.
              </p>
            </div>
            <div className="lg:col-span-4">
              <p className="font-medium">Fontes oficiais configuradas</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {fontesOficiais.length ? (
                  fontesOficiais.map(fonte => {
                    const url = fonte.match(/https?:\/\/\S+/)?.[0];
                    const nome = fonte.replace(/\s*—\s*https?:\/\/\S+/, "");
                    return url ? (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {nome}
                      </a>
                    ) : (
                      <span key={fonte} className="text-muted-foreground">
                        {fonte}
                      </span>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground">
                    Sem fontes configuradas.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SigaLayout>
  );
}
