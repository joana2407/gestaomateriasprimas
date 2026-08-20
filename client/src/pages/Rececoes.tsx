import { SigaLayout } from "@/components/SigaLayout";
import { FactoryBadge } from "@/components/FactoryBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ARMAZENS_RECECAO,
  calcularConformidadeRececao,
  ESTADOS_CONTROLO_RECECAO,
  type ControlosRececao,
  type EstadoControloRececao,
} from "../../../shared/rececao-controlos";
import { mpAprovadaParaRececao } from "../../../shared/rececao-fornecedor";
import { filtrarRececoes } from "../../../shared/rececao-filtros";
import { mensagemEliminacaoRececao } from "../../../shared/rececao-eliminacao";
import { marcarConformidadeVeiculoNaoAplicavel, marcarControlosGranelNaoAplicaveis, mpElegivelParaRececaoAGranel, prepararConformidadeVeiculo, prepararControlosGranel } from "../../../shared/rececao-granel";
import { formatarValidadeRececao } from "../../../shared/rececao-validade";
import { avaliarValidadeMinimaRececao } from "../../../shared/rececao-validade-minima";
import { podeRegistarRececaoAbaixoValidadeMinima } from "../../../shared/rececao-autorizacao-validade";
import { podeEditarRececao as podeEditarRececaoPorUtilizador } from "../../../shared/rececao-permissoes";
import { listarValidacoesRececao, type EstadoValidacaoDetalhe } from "../../../shared/rececao-validacoes";
import { formatarUnidadeRececao, UNIDADES_RECECAO, type UnidadeRececao } from "../../../shared/rececao-unidades";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ClipboardCheck,
  Edit2,
  Eye,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  Thermometer,
  Truck,
  Trash2,
  UserRound,
  Warehouse,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type RececaoForm = {
  id?: number;
  fabricaId: number;
  armazem: "ambiente_secos" | "frio" | "embalagens";
  dataRececao: string;
  fornecedorId: number;
  materiaPrimaId: number;
  validade: string;
  lote: string;
  quantidade: number;
  unidade: UnidadeRececao;
  controlos: ControlosRececao;
  numeroPaletesLpr: string;
  responsavel: string;
  numeroGuia: string;
  observacoes: string;
  motivoNaoConformidade: string;
};

type TransferenciaStockForm = {
  rececaoOrigemId: number;
  fabricaDestinoId: number;
  dataTransferencia: string;
  quantidade: number;
  responsavel: string;
  motivo: string;
  observacoes: string;
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function emptyForm(responsavel = "", fabricaId = 0): RececaoForm {
  return {
    fabricaId,
    armazem: "ambiente_secos",
    dataRececao: todayInput(),
    fornecedorId: 0,
    materiaPrimaId: 0,
    validade: "",
    lote: "",
    quantidade: 0,
    unidade: "kg",
    controlos: {},
    numeroPaletesLpr: "",
    responsavel,
    numeroGuia: "",
    observacoes: "",
    motivoNaoConformidade: "",
  };
}

function emptyTransferenciaStock(responsavel = "", rececaoOrigemId = 0): TransferenciaStockForm {
  return {
    rececaoOrigemId,
    fabricaDestinoId: 0,
    dataTransferencia: todayInput(),
    quantidade: 0,
    responsavel,
    motivo: "",
    observacoes: "",
  };
}

const CONFORMIDADE_CONFIG = {
  conforme: { label: "Conforme", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  nao_conforme: { label: "Não Conforme", className: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  pendente: { label: "Pendente", className: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
};

function EstadoControlo({
  value,
  onChange,
  compact = false,
}: {
  value?: EstadoControloRececao;
  onChange: (estado: EstadoControloRececao) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-1 shrink-0 w-full min-w-0", compact && "sm:w-36")}>
      {ESTADOS_CONTROLO_RECECAO.map(estado => (
        <button
          key={estado.id}
          type="button"
          title={estado.label}
          onClick={() => onChange(estado.id)}
          className={cn(
            "h-8 min-w-0 rounded-md border text-[10px] font-semibold transition-colors",
            value === estado.id
              ? estado.id === "c"
                ? "bg-emerald-600 border-emerald-600 text-white"
                : estado.id === "nc"
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-slate-600 border-slate-600 text-white"
              : "bg-background text-muted-foreground hover:bg-accent border-border"
          )}
        >
          {estado.abreviatura}
        </button>
      ))}
    </div>
  );
}

function ControloRow({ label, value, onChange, help }: { label: string; value?: EstadoControloRececao; onChange: (estado: EstadoControloRececao) => void; help?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_9rem] items-center gap-2 sm:gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {help && <p className="text-[10px] text-muted-foreground mt-0.5">{help}</p>}
      </div>
      <EstadoControlo value={value} onChange={onChange} compact />
    </div>
  );
}

export default function Rececoes() {
  const { isAuthenticated, user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferenciaDialogOpen, setTransferenciaDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [fabricaFilter, setFabricaFilter] = useState("all");
  const [armazemFilter, setArmazemFilter] = useState("all");
  const [conformidadeFilter, setConformidadeFilter] = useState("all");
  const [fornecedorFilter, setFornecedorFilter] = useState("all");
  const [materiaPrimaFilter, setMateriaPrimaFilter] = useState("all");
  const [dataInicialFilter, setDataInicialFilter] = useState("");
  const [dataFinalFilter, setDataFinalFilter] = useState("");
  const [loteFilter, setLoteFilter] = useState("");
  const [form, setForm] = useState<RececaoForm>(() => emptyForm(user?.name ?? ""));
  const [transferenciaForm, setTransferenciaForm] = useState<TransferenciaStockForm>(() => emptyTransferenciaStock(user?.name ?? ""));
  const [rececaoParaEliminar, setRececaoParaEliminar] = useState<any | null>(null);
  const [rececaoDetalheId, setRececaoDetalheId] = useState<number | null>(null);
  const [rececaoDiretaId, setRececaoDiretaId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const value = Number(new URLSearchParams(window.location.search).get("rececaoId"));
    return Number.isInteger(value) && value > 0 ? value : null;
  });

  const { data: contextoOperacional } = trpc.rececoes.contextoOperacional.useQuery();
  const fabricas = contextoOperacional?.fabricas;
  const fornecedores = contextoOperacional?.fornecedores;
  const materiasPrimas = contextoOperacional?.materiasPrimas;
  const { data: rececoes, refetch } = trpc.rececoes.list.useQuery({
    fabricaId: fabricaFilter === "all" ? undefined : Number(fabricaFilter),
    armazem: armazemFilter === "all" ? undefined : armazemFilter as "ambiente_secos" | "frio" | "embalagens",
    conformidade: conformidadeFilter === "all" ? undefined : conformidadeFilter as "conforme" | "nao_conforme" | "pendente",
  });
  const podeTransferirStock = isAuthenticated;
  const { data: transferenciasStock, refetch: refetchTransferencias } = trpc.rececoes.transferenciasStock.useQuery(undefined, { enabled: podeTransferirStock });

  const upsert = trpc.rececoes.upsert.useMutation({
    onSuccess: data => {
      toast.success(data.conformidade === "nao_conforme" ? "Receção registada como não conforme" : "Receção registada com sucesso");
      if (data.alertaValidade?.alerta) {
        toast.warning(`Validade abaixo do mínimo: este fornecedor exige pelo menos ${data.alertaValidade.mesesMinimos} meses restantes.`);
      }
      if (data.notificacaoQualidadeEnviada) toast.info("A Qualidade foi notificada das observações.");
      setDialogOpen(false);
      refetch();
    },
    onError: error => toast.error(error.message),
  });
  const eliminar = trpc.rececoes.delete.useMutation({
    onSuccess: resultado => {
      toast.success(mensagemEliminacaoRececao(resultado.transferenciasEliminadas));
      setRececaoParaEliminar(null);
      refetch();
      refetchTransferencias();
    },
    onError: error => toast.error(error.message),
  });
  const transferirStock = trpc.rececoes.transferirStock.useMutation({
    onSuccess: () => {
      toast.success("Transferência de stock registada no histórico.");
      setTransferenciaDialogOpen(false);
      refetchTransferencias();
      refetch();
    },
    onError: error => toast.error(error.message),
  });

  const filteredRececoes = useMemo(() => filtrarRececoes(rececoes ?? [], {
    pesquisa: search,
    lote: loteFilter,
    fornecedorId: fornecedorFilter === "all" ? undefined : Number(fornecedorFilter),
    materiaPrimaId: materiaPrimaFilter === "all" ? undefined : Number(materiaPrimaFilter),
    dataInicial: dataInicialFilter || undefined,
    dataFinal: dataFinalFilter || undefined,
  }), [rececoes, search, loteFilter, fornecedorFilter, materiaPrimaFilter, dataInicialFilter, dataFinalFilter]);

  const temFiltrosAtivos = search.trim() || loteFilter.trim() || fabricaFilter !== "all" || armazemFilter !== "all" || conformidadeFilter !== "all" || fornecedorFilter !== "all" || materiaPrimaFilter !== "all" || dataInicialFilter || dataFinalFilter;
  function limparFiltros() {
    setSearch("");
    setFabricaFilter("all");
    setArmazemFilter("all");
    setConformidadeFilter("all");
    setFornecedorFilter("all");
    setMateriaPrimaFilter("all");
    setDataInicialFilter("");
    setDataFinalFilter("");
    setLoteFilter("");
  }

  const materiasAprovadas = useMemo(() => (materiasPrimas ?? []).filter(mp =>
    mpAprovadaParaRececao(mp, form.fabricaId, form.fornecedorId)
  ), [materiasPrimas, form.fabricaId, form.fornecedorId]);
  const materiaPrimaSelecionada = useMemo(() => (materiasPrimas ?? []).find(mp => mp.id === form.materiaPrimaId), [materiasPrimas, form.materiaPrimaId]);
  const permiteRececaoAGranel = mpElegivelParaRececaoAGranel(materiaPrimaSelecionada?.nome);
  const rececaoAGranel = permiteRececaoAGranel && form.controlos.tipoRececao === "granel";
  const regraValidadeFornecedor = useMemo(() => {
    const mpSelecionada = (materiasPrimas ?? []).find(mp => mp.id === form.materiaPrimaId);
    const fornecedorDaMp = (mpSelecionada as any)?.fornecedoresMp?.find((rel: any) => rel.fornecedorId === form.fornecedorId);
    return avaliarValidadeMinimaRececao({
      dataRececao: form.dataRececao ? new Date(`${form.dataRececao}T12:00:00`) : null,
      validade: form.validade ? new Date(`${form.validade}T12:00:00`) : null,
      validadeEstipuladaMeses: fornecedorDaMp?.validadeEstipuladaMeses,
    });
  }, [materiasPrimas, form.materiaPrimaId, form.fornecedorId, form.dataRececao, form.validade]);
  const podeRegistarExcecaoValidade = podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: regraValidadeFornecedor.alerta, role: user?.role });

  const conformidadeCalculada = calcularConformidadeRececao(form.controlos);
  const selectedArmazem = ARMAZENS_RECECAO.find(armazem => armazem.id === form.armazem);
  const podeEliminar = user?.role === "qualidade";

  function abrirNovaRececao() {
    const fabricaId = fabricaFilter !== "all" ? Number(fabricaFilter) : fabricas?.[0]?.id ?? 0;
    setForm(emptyForm(user?.name ?? "", fabricaId));
    setDialogOpen(true);
  }

  function abrirTransferenciaStock(rececao: any) {
    setTransferenciaForm(emptyTransferenciaStock(user?.name ?? "", rececao.id));
    setTransferenciaDialogOpen(true);
  }

  const rececaoOrigemTransferencia = useMemo(() => (rececoes ?? []).find(rececao => rececao.id === transferenciaForm.rececaoOrigemId), [rececoes, transferenciaForm.rececaoOrigemId]);
  const quantidadeTransferidaPorRececao = useMemo(() => new Map<number, number>((transferenciasStock ?? []).reduce((map, transferencia) => {
    map.set(transferencia.rececaoOrigemId, (map.get(transferencia.rececaoOrigemId) ?? 0) + transferencia.quantidade);
    return map;
  }, new Map<number, number>())), [transferenciasStock]);
  const quantidadeDisponivelTransferencia = rececaoOrigemTransferencia
    ? Math.max(0, rececaoOrigemTransferencia.quantidade - (quantidadeTransferidaPorRececao.get(rececaoOrigemTransferencia.id) ?? 0))
    : 0;
  const rececaoDetalhe = useMemo(() => (rececoes ?? []).find(rececao => rececao.id === rececaoDetalheId), [rececoes, rececaoDetalheId]);
  const transferenciasDoLote = useMemo(() => (transferenciasStock ?? []).filter(transferencia => transferencia.rececaoOrigemId === rececaoDetalheId), [transferenciasStock, rececaoDetalheId]);
  const validacoesDoLote = useMemo(() => listarValidacoesRececao((rececaoDetalhe?.controlos as ControlosRececao | undefined) ?? {}), [rececaoDetalhe]);

  function guardarTransferenciaStock() {
    const transferencia = transferenciaForm;
    if (!transferencia.rececaoOrigemId || !transferencia.fabricaDestinoId || !transferencia.dataTransferencia || !transferencia.quantidade || !transferencia.responsavel.trim() || !transferencia.motivo.trim()) {
      toast.error("Preencha destino, data, quantidade, responsável e motivo.");
      return;
    }
    if (transferencia.quantidade > quantidadeDisponivelTransferencia) {
      toast.error("A quantidade indicada excede o saldo disponível neste lote.");
      return;
    }
    transferirStock.mutate({
      ...transferencia,
      dataTransferencia: new Date(`${transferencia.dataTransferencia}T12:00:00`),
      responsavel: transferencia.responsavel.trim(),
      motivo: transferencia.motivo.trim(),
      observacoes: transferencia.observacoes.trim() || null,
    });
  }

  function editarRececao(rececao: any) {
    setForm({
      id: rececao.id,
      fabricaId: rececao.fabricaId,
      armazem: rececao.armazem,
      dataRececao: toDateInput(rececao.dataRececao),
      fornecedorId: rececao.fornecedorId,
      materiaPrimaId: rececao.materiaPrimaId,
      validade: toDateInput(rececao.validade),
      lote: rececao.lote ?? "",
      quantidade: rececao.quantidade,
      unidade: rececao.unidade,
      controlos: (rececao.controlos as ControlosRececao) ?? {},
      numeroPaletesLpr: rececao.numeroPaletesLpr?.toString() ?? "",
      responsavel: rececao.responsavel,
      numeroGuia: rececao.numeroGuia ?? "",
      observacoes: rececao.observacoes ?? "",
      motivoNaoConformidade: rececao.motivoNaoConformidade ?? "",
    });
    setDialogOpen(true);
  }

  useEffect(() => {
    if (!rececaoDiretaId || !rececoes) return;
    const rececao = rececoes.find(item => item.id === rececaoDiretaId);
    if (!rececao) return;
    editarRececao(rececao);
    setRececaoDiretaId(null);
    window.history.replaceState({}, "", "/rececoes");
  }, [rececaoDiretaId, rececoes]);

  function setControl<K extends keyof ControlosRececao>(key: K, value: ControlosRececao[K]) {
    setForm(current => ({ ...current, controlos: { ...current.controlos, [key]: value } }));
  }

  function definirTipoFornecimento(tipo: "saco" | "granel") {
    setForm(current => ({
      ...current,
      controlos: tipo === "saco"
        ? prepararConformidadeVeiculo(marcarControlosGranelNaoAplicaveis(current.controlos))
        : marcarConformidadeVeiculoNaoAplicavel(prepararControlosGranel(current.controlos)),
    }));
  }

  function guardar() {
    if (!form.fabricaId || !form.fornecedorId || !form.materiaPrimaId || !form.dataRececao || !form.quantidade || !form.responsavel.trim()) {
      toast.error("Preencha fábrica, fornecedor, matéria-prima, data, quantidade e responsável pela receção.");
      return;
    }
    if (conformidadeCalculada === "nao_conforme" && !form.motivoNaoConformidade.trim()) {
      toast.error("Descreva o motivo da não conformidade antes de guardar.");
      return;
    }
    if (!podeRegistarExcecaoValidade) {
      toast.error("Esta receção tem validade abaixo do mínimo e só pode ser registada pela equipa de Qualidade.");
      return;
    }
    upsert.mutate({
      id: form.id,
      fabricaId: form.fabricaId,
      armazem: form.armazem,
      dataRececao: new Date(`${form.dataRececao}T12:00:00`),
      fornecedorId: form.fornecedorId,
      materiaPrimaId: form.materiaPrimaId,
      validade: form.validade ? new Date(`${form.validade}T12:00:00`) : null,
      lote: form.lote || null,
      quantidade: form.quantidade,
      unidade: form.unidade,
      controlos: form.controlos,
      numeroPaletesLpr: form.numeroPaletesLpr ? Number(form.numeroPaletesLpr) : null,
      responsavel: form.responsavel.trim(),
      numeroGuia: form.numeroGuia || null,
      observacoes: form.observacoes || null,
      motivoNaoConformidade: form.motivoNaoConformidade || null,
    });
  }

  const stats = useMemo(() => ({
    total: rececoes?.length ?? 0,
    conforme: (rececoes ?? []).filter(item => item.conformidade === "conforme").length,
    naoConforme: (rececoes ?? []).filter(item => item.conformidade === "nao_conforme").length,
    pendente: (rececoes ?? []).filter(item => item.conformidade === "pendente").length,
  }), [rececoes]);

  return (
    <SigaLayout
      title="Receções de Matérias-Primas"
      subtitle={`${filteredRececoes.length} de ${rececoes?.length ?? 0} receções no registo`}
      actions={isAuthenticated ? <div className="flex flex-wrap items-center gap-2">{podeTransferirStock && <Button size="icon" variant="outline" onClick={() => { setTransferenciaForm(emptyTransferenciaStock(user?.name ?? "")); setTransferenciaDialogOpen(true); }} title="Transferir lote" aria-label="Transferir lote"><ArrowRightLeft className="w-4 h-4" /></Button>}<Button size="sm" onClick={abrirNovaRececao} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Nova receção</Button></div> : undefined}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" /><div><p className="text-sm font-semibold">Painel informativo de receções</p><p className="text-xs text-muted-foreground">Consulta disponível para todos os operadores com acesso a Receções.</p></div></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: "all", label: "Total", value: stats.total, tone: "text-foreground", icon: ClipboardCheck },
            { key: "conforme", label: "Conformes", value: stats.conforme, tone: "text-emerald-700", icon: CheckCircle2 },
            { key: "nao_conforme", label: "Não conformes", value: stats.naoConforme, tone: "text-red-700", icon: XCircle },
            { key: "pendente", label: "Pendentes", value: stats.pendente, tone: "text-amber-700", icon: AlertTriangle },
          ].map(item => {
            const Icon = item.icon;
            const active = conformidadeFilter === item.key || (item.key === "all" && conformidadeFilter === "all");
            return <button key={item.key} type="button" onClick={() => setConformidadeFilter(item.key)} className={cn("card-elegant p-4 text-left transition-colors", active && "ring-1 ring-primary/30 bg-primary/[0.03]")}>
              <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{item.label}</span><Icon className={cn("w-4 h-4", item.tone)} /></div>
              <p className={cn("mt-2 text-2xl font-semibold", item.tone)}>{item.value}</p>
            </button>;
          })}
        </div>

        <div className="card-elegant p-3 sm:p-4"><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 gap-2.5"><div className="relative sm:col-span-2 xl:col-span-2 min-w-0"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="MP, fornecedor ou guia" className="pl-9 w-full" /></div><Field label="Lote"><Input value={loteFilter} onChange={event => setLoteFilter(event.target.value)} placeholder="Pesquisar lote" /></Field><Select value={fabricaFilter} onValueChange={setFabricaFilter}><SelectTrigger className="w-full"><SelectValue placeholder="Todas as fábricas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as fábricas</SelectItem>{fabricas?.map(fabrica => <SelectItem key={fabrica.id} value={String(fabrica.id)}>{fabrica.nome}</SelectItem>)}</SelectContent></Select><Select value={armazemFilter} onValueChange={setArmazemFilter}><SelectTrigger className="w-full"><SelectValue placeholder="Todos os armazéns" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os armazéns</SelectItem>{ARMAZENS_RECECAO.map(armazem => <SelectItem key={armazem.id} value={armazem.id}>{armazem.label}</SelectItem>)}</SelectContent></Select><Select value={fornecedorFilter} onValueChange={setFornecedorFilter}><SelectTrigger className="w-full"><SelectValue placeholder="Todos os fornecedores" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os fornecedores</SelectItem>{fornecedores?.map(fornecedor => <SelectItem key={fornecedor.id} value={String(fornecedor.id)}>{fornecedor.nome}</SelectItem>)}</SelectContent></Select><Select value={materiaPrimaFilter} onValueChange={setMateriaPrimaFilter}><SelectTrigger className="w-full"><SelectValue placeholder="Todas as MP" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as MP</SelectItem>{materiasPrimas?.map(mp => <SelectItem key={mp.id} value={String(mp.id)}>{mp.nome}</SelectItem>)}</SelectContent></Select><Field label="Data inicial"><Input type="date" value={dataInicialFilter} onChange={event => setDataInicialFilter(event.target.value)} /></Field><Field label="Data final"><Input type="date" min={dataInicialFilter || undefined} value={dataFinalFilter} onChange={event => setDataFinalFilter(event.target.value)} /></Field></div>{temFiltrosAtivos && <div className="mt-2.5 flex justify-end"><Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={limparFiltros}><RotateCcw className="w-3.5 h-3.5" />Limpar filtros</Button></div>}</div>

        <div className="space-y-2">
          {filteredRececoes.length === 0 ? <div className="card-elegant p-12 text-center"><ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm font-medium">Ainda não existem receções neste filtro</p><p className="text-xs text-muted-foreground mt-1">Registe a primeira receção para iniciar o controlo de conformidade.</p></div> : filteredRececoes.map(rececao => {
            const fabrica = fabricas?.find(item => item.id === rececao.fabricaId);
            const armazem = ARMAZENS_RECECAO.find(item => item.id === rececao.armazem);
            const config = CONFORMIDADE_CONFIG[rececao.conformidade];
            const Icon = config.icon;
            return <div key={rececao.id} className="card-elegant p-4 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", rececao.conformidade === "conforme" ? "bg-emerald-50" : rececao.conformidade === "nao_conforme" ? "bg-red-50" : "bg-amber-50")}><PackageCheck className={cn("w-5 h-5", config.className.split(" ")[1])} /></div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold">{rececao.materiaPrimaNome}</p><Badge variant="outline" className="font-normal text-[10px]">{armazem?.label}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{rececao.fornecedorNome}{rececao.lote ? ` · Lote ${rececao.lote}` : ""} · Validade {formatarValidadeRececao(rececao.validade)}</p><div className="mt-2 flex gap-2 flex-wrap items-center">{fabrica && <FactoryBadge nome={fabrica.nome} codigo={fabrica.codigo} size="sm" />}<span className="text-[10px] text-muted-foreground">{new Date(rececao.dataRececao).toLocaleDateString("pt-PT")}</span><span className="text-[10px] text-muted-foreground">{rececao.quantidade} {formatarUnidadeRececao(rececao.unidade as UnidadeRececao)}</span><span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><UserRound className="h-3 w-3 shrink-0" />Rececionado por: <strong className="font-medium text-foreground">{rececao.responsavel || "Não indicado"}</strong></span></div></div>
              <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap"><span className={cn("inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-medium", config.className)}><Icon className="w-3.5 h-3.5" />{config.label}</span><Button variant="outline" size="sm" className="gap-1.5" onClick={() => setRececaoDetalheId(rececao.id)}><Eye className="w-3.5 h-3.5" />Detalhe do lote</Button>{podeTransferirStock && rececao.lote && (quantidadeTransferidaPorRececao.get(rececao.id) ?? 0) < rececao.quantidade && <Button size="icon" title="Transferir lote" aria-label="Transferir lote" onClick={() => abrirTransferenciaStock(rececao)}><ArrowRightLeft className="w-4 h-4" /></Button>}{podeEditarRececaoPorUtilizador({ role: user?.role, userId: user?.id, registadoPor: rececao.registadoPor }) && <button type="button" onClick={() => editarRececao(rececao)} className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" title="Editar receção"><Edit2 className="w-4 h-4" /></button>}{podeEliminar && <button type="button" onClick={() => setRececaoParaEliminar(rececao)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Eliminar receção"><Trash2 className="w-4 h-4" /></button>}</div>
            </div>;
          })}
        </div>

        {podeTransferirStock && <section className="card-elegant overflow-hidden"><div className="border-b border-border/60 px-4 py-3"><div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-primary" /><div><p className="text-sm font-semibold">Transferências físicas de stock</p><p className="text-[11px] text-muted-foreground">Movimentos associados à receção e ao lote de origem.</p></div></div></div><div className="divide-y divide-border/50">{(transferenciasStock?.length ?? 0) > 0 ? transferenciasStock?.slice(0, 8).map(transferencia => { const rececaoOrigem = rececoes?.find(rececao => rececao.id === transferencia.rececaoOrigemId); const mp = materiasPrimas?.find(item => item.id === transferencia.materiaPrimaId); const origem = fabricas?.find(item => item.id === transferencia.fabricaOrigemId); const destino = fabricas?.find(item => item.id === transferencia.fabricaDestinoId); return <div key={transferencia.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 text-xs"><div className="min-w-0 flex-1"><p className="font-medium">{mp?.nome ?? `MP #${transferencia.materiaPrimaId}`} {rececaoOrigem?.lote ? `· Lote ${rececaoOrigem.lote}` : ""}</p><p className="mt-0.5 text-muted-foreground">{origem?.nome ?? "Origem"} <ArrowRightLeft className="mx-1 inline h-3 w-3 text-primary" /> {destino?.nome ?? "Destino"} · {transferencia.motivo}</p></div><div className="flex flex-wrap items-center gap-2 text-muted-foreground"><span>{new Date(transferencia.dataTransferencia).toLocaleDateString("pt-PT")}</span><Badge variant="outline">{transferencia.quantidade} {formatarUnidadeRececao(transferencia.unidade as UnidadeRececao)}</Badge><span>{transferencia.responsavel}</span></div></div>; }) : <p className="px-4 py-5 text-xs italic text-muted-foreground">Ainda não existem transferências de stock registadas.</p>}</div></section>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-6xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" />{form.id ? "Editar receção" : "Registar receção"}</DialogTitle><DialogDescription className="sr-only">Selecione a fábrica, o fornecedor e uma matéria-prima aprovada para registar a receção e os respetivos controlos.</DialogDescription></DialogHeader>
          <div className="space-y-6 pt-2">
            <section className="rounded-xl border border-border/70 overflow-hidden"><div className="px-4 py-3 bg-muted/40 flex items-center gap-2"><Warehouse className="w-4 h-4 text-primary shrink-0" /><p className="text-sm font-semibold leading-snug">Destino e identificação</p></div><div className="p-4 grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
              <Field label="Fábrica *"><Select value={form.fabricaId ? String(form.fabricaId) : "none"} onValueChange={value => setForm(current => ({ ...current, fabricaId: Number(value), materiaPrimaId: 0 }))}><SelectTrigger><SelectValue placeholder="Selecionar fábrica" /></SelectTrigger><SelectContent>{fabricas?.map(fabrica => <SelectItem key={fabrica.id} value={String(fabrica.id)}>{fabrica.nome}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Armazém *"><Select value={form.armazem} onValueChange={value => setForm(current => ({ ...current, armazem: value as RececaoForm["armazem"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ARMAZENS_RECECAO.map(armazem => <SelectItem key={armazem.id} value={armazem.id}>{armazem.label}</SelectItem>)}</SelectContent></Select><p className="text-[10px] text-muted-foreground">{selectedArmazem?.descricao}</p></Field>
              <Field label="Data de receção *"><Input type="date" value={form.dataRececao} onChange={event => setForm(current => ({ ...current, dataRececao: event.target.value }))} /></Field>
              <Field label="Nº de guia"><Input value={form.numeroGuia} onChange={event => setForm(current => ({ ...current, numeroGuia: event.target.value }))} placeholder="Ex.: GR-2026-001" /></Field>
            </div></section>

            <section className="rounded-xl border border-border/70 overflow-hidden"><div className="px-4 py-3 bg-muted/40 flex items-center gap-2"><PackageCheck className="w-4 h-4 text-primary shrink-0" /><p className="text-sm font-semibold leading-snug">Matéria-prima e lote</p></div><div className="p-4 grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
              <Field label="Fornecedor *"><Select value={form.fornecedorId ? String(form.fornecedorId) : "none"} onValueChange={value => setForm(current => ({ ...current, fornecedorId: Number(value), materiaPrimaId: 0 }))}><SelectTrigger><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger><SelectContent>{fornecedores?.map(fornecedor => <SelectItem key={fornecedor.id} value={String(fornecedor.id)}>{fornecedor.nome}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Matéria-prima *"><Select disabled={!form.fabricaId || !form.fornecedorId} value={form.materiaPrimaId ? String(form.materiaPrimaId) : "none"} onValueChange={value => { const materiaPrimaId = Number(value); const mp = (materiasPrimas ?? []).find(item => item.id === materiaPrimaId); setForm(current => ({ ...current, materiaPrimaId, controlos: mpElegivelParaRececaoAGranel(mp?.nome) ? current.controlos : prepararConformidadeVeiculo(marcarControlosGranelNaoAplicaveis(current.controlos)) })); }}><SelectTrigger><SelectValue placeholder={!form.fabricaId ? "Escolha primeiro a fábrica" : !form.fornecedorId ? "Escolha primeiro o fornecedor" : "Selecionar MP aprovada"} /></SelectTrigger><SelectContent>{materiasAprovadas.length > 0 ? materiasAprovadas.map(mp => <SelectItem key={mp.id} value={String(mp.id)}>{mp.nome}</SelectItem>) : <div className="px-2 py-3 text-xs text-muted-foreground">Não existem MP aprovadas para este fornecedor nesta fábrica.</div>}</SelectContent></Select></Field>
              <Field label="Lote"><Input value={form.lote} onChange={event => setForm(current => ({ ...current, lote: event.target.value }))} placeholder="Lote do fornecedor" /></Field>
              <Field label="Validade"><Input type="date" value={form.validade} onChange={event => setForm(current => ({ ...current, validade: event.target.value }))} /></Field>
              {form.materiaPrimaId > 0 && form.fornecedorId > 0 && (
                <div className={cn("col-span-full rounded-lg border px-3 py-2.5 text-xs", regraValidadeFornecedor.aplicavel ? regraValidadeFornecedor.alerta ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  {regraValidadeFornecedor.aplicavel ? regraValidadeFornecedor.alerta ? <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>{podeRegistarExcecaoValidade ? "Exceção de validade:" : "Registo bloqueado:"}</strong> esta receção fica abaixo do mínimo de <strong>{regraValidadeFornecedor.mesesMinimos} meses</strong> restantes (2/3 dos {regraValidadeFornecedor.mesesEstipulados} meses estipulados). A validade mínima seria {formatarValidadeRececao(regraValidadeFornecedor.dataMinimaValidade)}. {!podeRegistarExcecaoValidade && " Contactar a Equipa da Qualidade antes de recepcionar esta mercadoria."}</p></div> : <p><strong>Validade conforme:</strong> mínimo exigido para este fornecedor: {regraValidadeFornecedor.mesesMinimos} meses restantes (2/3 dos {regraValidadeFornecedor.mesesEstipulados} meses estipulados).</p> : <p>Defina a validade estipulada deste fornecedor no detalhe da matéria-prima para ativar o controlo automático de 2/3.</p>}
                </div>
              )}
              <Field label="Quantidade *"><Input type="number" min="0" step="0.001" value={form.quantidade || ""} onChange={event => setForm(current => ({ ...current, quantidade: Number(event.target.value) || 0 }))} placeholder="0" /></Field>
              <Field label="Unidade"><Select value={form.unidade} onValueChange={value => setForm(current => ({ ...current, unidade: value as RececaoForm["unidade"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNIDADES_RECECAO.map(unidade => <SelectItem key={unidade.value} value={unidade.value}>{unidade.label}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Nº de paletes LPR"><Input type="number" min="0" value={form.numeroPaletesLpr} onChange={event => setForm(current => ({ ...current, numeroPaletesLpr: event.target.value }))} placeholder="0" /></Field>
              <Field label="Responsável pela receção *"><Input value={form.responsavel} onChange={event => setForm(current => ({ ...current, responsavel: event.target.value }))} placeholder="Nome de quem registou ou recebeu a MP" /></Field>
            </div></section>

            {permiteRececaoAGranel && <section className="rounded-xl border border-border/70 overflow-hidden"><div className="px-4 py-3 bg-muted/40"><p className="text-sm font-semibold">Aplicabilidade dos controlos de granel</p><p className="mt-0.5 text-xs text-muted-foreground">Disponível para esta matéria-prima.</p></div><div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2"><Button type="button" variant={!rececaoAGranel ? "outline" : "secondary"} className="h-11 justify-start" aria-pressed={!rececaoAGranel} onClick={() => definirTipoFornecimento("saco")}>MP em saco · Não aplicável</Button><Button type="button" variant={rececaoAGranel ? "default" : "outline"} className="h-11 justify-start" aria-pressed={rececaoAGranel} onClick={() => definirTipoFornecimento("granel")}>MP a granel</Button></div></section>}

            <section className="rounded-xl border border-border/70 overflow-hidden"><div className="px-4 py-3 bg-muted/40 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"><div className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary shrink-0" /><p className="text-sm font-semibold leading-snug">Pontos de controlo</p></div><ConformidadeBadge estado={conformidadeCalculada} /></div><div className="p-4 grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-4">
              {!rececaoAGranel && <ControlCard title="Conformidade do Veículo" icon={<Thermometer className="w-4 h-4" />}><div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_9rem] items-end gap-2 sm:gap-3 py-3 border-b border-border/50"><div className="min-w-0"><p className="text-xs font-medium">Temperatura</p><Input type="number" step="0.1" value={form.controlos.temperaturaMpSaco?.valor ?? ""} onChange={event => setControl("temperaturaMpSaco", { ...form.controlos.temperaturaMpSaco, valor: event.target.value === "" ? null : Number(event.target.value) })} placeholder="ºC (opcional)" className="h-8 mt-1 text-xs w-full max-w-36" /></div><EstadoControlo value={form.controlos.temperaturaMpSaco?.estado} onChange={estado => setControl("temperaturaMpSaco", { ...form.controlos.temperaturaMpSaco, estado })} compact /></div><ControloRow label="Limpeza" value={form.controlos.limpeza} onChange={estado => setControl("limpeza", estado)} /><ControloRow label="Resíduos de infestação" value={form.controlos.residuosInfestacao} onChange={estado => setControl("residuosInfestacao", estado)} /><ControloRow label="Acondicionamento" value={form.controlos.acondicionamento} onChange={estado => setControl("acondicionamento", estado)} /></ControlCard>}
              {rececaoAGranel && <ControlCard title="Receção a granel" icon={<Truck className="w-4 h-4" />}><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-border/50"><Field label="Nº de selo"><Input value={form.controlos.numeroSelo ?? ""} onChange={event => setControl("numeroSelo", event.target.value)} placeholder="Selo" /></Field><Field label="Nº de silo"><Input value={form.controlos.numeroSilo ?? ""} onChange={event => setControl("numeroSilo", event.target.value)} placeholder="Silo" /></Field></div><ControloRow label="Crivo" value={form.controlos.crivo} onChange={estado => setControl("crivo", estado)} /><ControloRow label="Fecho da boca de carga do silo" value={form.controlos.fechoBocaCarga} onChange={estado => setControl("fechoBocaCarga", estado)} /></ControlCard>}
              <ControlCard title="Produto" icon={<PackageCheck className="w-4 h-4" />}><ControloRow label="Aspeto macroscópico" value={form.controlos.aspetoMacroscopico} onChange={estado => setControl("aspetoMacroscopico", estado)} /><ControloRow label="Presença de matérias estranhas" value={form.controlos.materiasEstranhas} onChange={estado => setControl("materiasEstranhas", estado)} /><ControloRow label="Infestação" value={form.controlos.infestacaoProduto} onChange={estado => setControl("infestacaoProduto", estado)} /><ControloRow label="Datas de validade" value={form.controlos.datasValidade} onChange={estado => setControl("datasValidade", estado)} /></ControlCard>
            </div></section>

            {conformidadeCalculada === "nao_conforme" && <div className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="flex items-center gap-2 text-red-800"><AlertTriangle className="w-4 h-4" /><p className="text-sm font-semibold">Tratamento de não conformidade obrigatório</p></div><Textarea value={form.motivoNaoConformidade} onChange={event => setForm(current => ({ ...current, motivoNaoConformidade: event.target.value }))} placeholder="Descreva a não conformidade identificada e a ação imediata tomada..." className="mt-3 bg-background" /></div>}
            <Field label="Observações"><Textarea value={form.observacoes} onChange={event => setForm(current => ({ ...current, observacoes: event.target.value }))} placeholder="Observações complementares da receção..." /></Field>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-border/60"><Button variant="outline" className="w-full sm:w-auto" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button className="w-full sm:w-auto" onClick={guardar} disabled={upsert.isPending || !podeRegistarExcecaoValidade} title={!podeRegistarExcecaoValidade ? "Reservado à equipa de Qualidade" : undefined}>{upsert.isPending ? "A guardar..." : !podeRegistarExcecaoValidade ? "Reservado à Qualidade" : form.id ? "Guardar alterações" : "Registar receção"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(rececaoDetalhe)} onOpenChange={open => !open && setRececaoDetalheId(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><PackageCheck className="w-5 h-5 text-primary" />Detalhe da receção e lote</DialogTitle><DialogDescription>Rastreabilidade completa da receção e das transferências físicas associadas ao lote.</DialogDescription></DialogHeader>
          {rececaoDetalhe && <div className="space-y-5 pt-3"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm"><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Matéria-prima</p><p className="mt-1 font-semibold">{rececaoDetalhe.materiaPrimaNome}</p></div><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lote</p><p className="mt-1 font-semibold">{rececaoDetalhe.lote || "Não indicado"}</p></div><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recebido</p><p className="mt-1">{rececaoDetalhe.quantidade} {formatarUnidadeRececao(rececaoDetalhe.unidade as UnidadeRececao)} · {new Date(rececaoDetalhe.dataRececao).toLocaleDateString("pt-PT")}</p></div><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Validade do produto</p><p className="mt-1">{formatarValidadeRececao(rececaoDetalhe.validade)}</p></div><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Responsável pela receção</p><p className="mt-1">{rececaoDetalhe.responsavel}</p></div></div><DetalheValidacoesRececao validacoes={validacoesDoLote} /><section className="rounded-xl border border-border/70 overflow-hidden"><div className="flex items-center gap-2 border-b border-border/60 px-4 py-3"><ArrowRightLeft className="w-4 h-4 text-primary" /><div><p className="text-sm font-semibold">Histórico completo de transferências</p><p className="text-[11px] text-muted-foreground">{transferenciasDoLote.length} movimento(s) associado(s) a este lote.</p></div></div><div className="divide-y divide-border/60">{transferenciasDoLote.length ? transferenciasDoLote.map(transferencia => { const destino = fabricas?.find(fabrica => fabrica.id === transferencia.fabricaDestinoId); return <div key={transferencia.id} className="p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{transferencia.quantidade} {formatarUnidadeRececao(transferencia.unidade as UnidadeRececao)} para {destino?.nome ?? "Fábrica de destino"}</p><span className="text-xs text-muted-foreground">{new Date(transferencia.dataTransferencia).toLocaleDateString("pt-PT")}</span></div><p className="mt-1 text-xs text-muted-foreground">Responsável: {transferencia.responsavel} · Motivo: {transferencia.motivo}</p>{transferencia.observacoes && <p className="mt-1 text-xs text-muted-foreground">Observações: {transferencia.observacoes}</p>}</div>; }) : <p className="p-5 text-sm text-muted-foreground">Ainda não existem transferências associadas a este lote.</p>}</div></section>{podeTransferirStock && rececaoDetalhe.lote && (quantidadeTransferidaPorRececao.get(rececaoDetalhe.id) ?? 0) < rececaoDetalhe.quantidade && <div className="flex justify-end"><Button size="icon" title="Transferir deste lote" aria-label="Transferir deste lote" onClick={() => { setRececaoDetalheId(null); abrirTransferenciaStock(rececaoDetalhe); }}><ArrowRightLeft className="w-4 h-4" /></Button></div>}</div>}
        </DialogContent>
      </Dialog>
      <Dialog open={transferenciaDialogOpen} onOpenChange={setTransferenciaDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-primary" />Transferir stock do lote recebido</DialogTitle><DialogDescription>O movimento fica associado a esta receção, matéria-prima e lote de origem.</DialogDescription></DialogHeader>
          {!rececaoOrigemTransferencia ? <div className="space-y-4 pt-3"><div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-semibold">Selecionar receção de origem</p><p className="mt-1 text-xs text-muted-foreground">Escolha a receção e o lote a transferir. Apenas surgem lotes com quantidade disponível.</p></div><Field label="Receção e lote *"><Select value={transferenciaForm.rececaoOrigemId ? String(transferenciaForm.rececaoOrigemId) : "none"} onValueChange={value => setTransferenciaForm(current => ({ ...current, rececaoOrigemId: Number(value) }))}><SelectTrigger><SelectValue placeholder="Selecionar lote recebido" /></SelectTrigger><SelectContent>{(rececoes ?? []).filter(rececao => rececao.lote && (quantidadeTransferidaPorRececao.get(rececao.id) ?? 0) < rececao.quantidade).map(rececao => <SelectItem key={rececao.id} value={String(rececao.id)}>{rececao.materiaPrimaNome} · Lote {rececao.lote} · {rececao.quantidade} {formatarUnidadeRececao(rececao.unidade as UnidadeRececao)}</SelectItem>)}</SelectContent></Select></Field></div> : <div className="space-y-5 pt-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Receção de origem</p><p className="mt-1 text-sm font-semibold">{rececaoOrigemTransferencia.materiaPrimaNome}</p><p className="mt-1 text-xs text-muted-foreground">Lote {rececaoOrigemTransferencia.lote} · {new Date(rececaoOrigemTransferencia.dataRececao).toLocaleDateString("pt-PT")} · Saldo disponível: <strong>{quantidadeDisponivelTransferencia} {formatarUnidadeRececao(rececaoOrigemTransferencia.unidade as UnidadeRececao)}</strong></p></div>
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4"><Field label="Fábrica de destino *"><Select value={transferenciaForm.fabricaDestinoId ? String(transferenciaForm.fabricaDestinoId) : "none"} onValueChange={value => setTransferenciaForm(current => ({ ...current, fabricaDestinoId: Number(value) }))}><SelectTrigger><SelectValue placeholder="Selecionar destino" /></SelectTrigger><SelectContent>{fabricas?.filter(fabrica => fabrica.id !== rececaoOrigemTransferencia.fabricaId).map(fabrica => <SelectItem key={fabrica.id} value={String(fabrica.id)}>{fabrica.nome}</SelectItem>)}</SelectContent></Select></Field><Field label="Data da transferência *"><Input type="date" value={transferenciaForm.dataTransferencia} onChange={event => setTransferenciaForm(current => ({ ...current, dataTransferencia: event.target.value }))} /></Field><Field label={`Quantidade * (máx. ${quantidadeDisponivelTransferencia})`}><Input type="number" min="0" max={quantidadeDisponivelTransferencia} step="0.001" value={transferenciaForm.quantidade || ""} onChange={event => setTransferenciaForm(current => ({ ...current, quantidade: Number(event.target.value) || 0 }))} /></Field><Field label="Unidade"><div className="h-10 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">{formatarUnidadeRececao(rececaoOrigemTransferencia.unidade as UnidadeRececao)}</div></Field><Field label="Responsável pela transferência *"><Input value={transferenciaForm.responsavel} onChange={event => setTransferenciaForm(current => ({ ...current, responsavel: event.target.value }))} placeholder="Nome do responsável" /></Field></div>
            <Field label="Motivo da transferência *"><Textarea value={transferenciaForm.motivo} onChange={event => setTransferenciaForm(current => ({ ...current, motivo: event.target.value }))} placeholder="Ex.: Reposição de stock, apoio à produção, transferência de lote..." /></Field><Field label="Observações"><Textarea value={transferenciaForm.observacoes} onChange={event => setTransferenciaForm(current => ({ ...current, observacoes: event.target.value }))} placeholder="Condições de transporte ou outras notas (opcional)" /></Field><div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-border/60"><Button variant="outline" onClick={() => setTransferenciaDialogOpen(false)}>Cancelar</Button><Button onClick={guardarTransferenciaStock} disabled={transferirStock.isPending || quantidadeDisponivelTransferencia <= 0}>{transferirStock.isPending ? "A registar..." : "Registar transferência"}</Button></div>
          </div>}
        </DialogContent>
      </Dialog>
      <AlertDialog open={Boolean(rececaoParaEliminar)} onOpenChange={open => !open && setRececaoParaEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar receção?</AlertDialogTitle><AlertDialogDescription>Esta ação elimina de forma permanente a receção de <strong>{rececaoParaEliminar?.materiaPrimaNome}</strong>{rececaoParaEliminar?.lote ? ` do lote ${rececaoParaEliminar.lote}` : ""}. O registo da eliminação ficará no histórico.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={eliminar.isPending} onClick={event => { event.preventDefault(); if (rececaoParaEliminar) eliminar.mutate({ id: rececaoParaEliminar.id }); }}>{eliminar.isPending ? "A eliminar..." : "Eliminar receção"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SigaLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5 min-w-0 w-full"><label className="block text-xs font-medium text-muted-foreground break-words leading-snug">{label}</label><div className="min-w-0 w-full">{children}</div></div>;
}

function ControlCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="min-w-0 rounded-xl border border-border/70 bg-background overflow-hidden"><div className="px-3 py-2.5 bg-muted/30 flex items-center gap-2 text-xs font-semibold leading-snug">{icon}<span className="min-w-0 break-words">{title}</span></div><div className="px-3">{children}</div></div>;
}

function DetalheValidacoesRececao({ validacoes }: { validacoes: ReturnType<typeof listarValidacoesRececao> }) {
  const grupos = ["MP em saco", "MP a granel", "Produto"] as const;
  return <section className="rounded-xl border border-border/70 overflow-hidden"><div className="flex items-center gap-2 border-b border-border/60 px-4 py-3"><ClipboardCheck className="w-4 h-4 text-primary" /><div><p className="text-sm font-semibold">Validações efetuadas na receção</p><p className="text-[11px] text-muted-foreground">Resultado de todos os pontos de controlo registados para este lote.</p></div></div><div className="space-y-4 p-4">{grupos.map(grupo => <div key={grupo}><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{grupo}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{validacoes.filter(validacao => validacao.grupo === grupo).map(validacao => <div key={validacao.label} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/15 px-3 py-2"><div className="min-w-0"><p className="text-xs font-medium">{validacao.label}</p>{validacao.valor && <p className="mt-0.5 text-[11px] text-muted-foreground">{validacao.valor}</p>}</div><EstadoValidacaoBadge estado={validacao.estado} /></div>)}</div></div>)}</div></section>;
}

function EstadoValidacaoBadge({ estado }: { estado: EstadoValidacaoDetalhe }) {
  const config: Record<EstadoValidacaoDetalhe, { label: string; className: string }> = {
    c: { label: "C", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    nc: { label: "NC", className: "border-red-200 bg-red-50 text-red-700" },
    na: { label: "NA", className: "border-slate-200 bg-slate-50 text-slate-700" },
    pendente: { label: "Pendente", className: "border-amber-200 bg-amber-50 text-amber-700" },
    registado: { label: "Registado", className: "border-blue-200 bg-blue-50 text-blue-700" },
  };
  return <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", config[estado].className)}>{config[estado].label}</span>;
}

function ConformidadeBadge({ estado }: { estado: "conforme" | "nao_conforme" | "pendente" }) {
  const config = CONFORMIDADE_CONFIG[estado];
  const Icon = config.icon;
  return <span className={cn("inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-medium", config.className)}><Icon className="w-3.5 h-3.5" />{config.label}</span>;
}
