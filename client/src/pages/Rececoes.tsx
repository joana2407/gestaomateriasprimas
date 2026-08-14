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
import { formatarUnidadeRececao, UNIDADES_RECECAO, type UnidadeRececao } from "../../../shared/rececao-unidades";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Edit2,
  PackageCheck,
  Plus,
  Search,
  Thermometer,
  Truck,
  Trash2,
  Warehouse,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
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
    <div className={cn("grid grid-cols-3 gap-1 shrink-0 w-full", compact && "sm:w-36")}>
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
  const [search, setSearch] = useState("");
  const [fabricaFilter, setFabricaFilter] = useState("all");
  const [armazemFilter, setArmazemFilter] = useState("all");
  const [conformidadeFilter, setConformidadeFilter] = useState("all");
  const [form, setForm] = useState<RececaoForm>(() => emptyForm(user?.name ?? ""));
  const [rececaoParaEliminar, setRececaoParaEliminar] = useState<any | null>(null);

  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: fornecedores } = trpc.fornecedores.list.useQuery();
  const { data: materiasPrimas } = trpc.materiasPrimas.list.useQuery();
  const { data: rececoes, refetch } = trpc.rececoes.list.useQuery({
    fabricaId: fabricaFilter === "all" ? undefined : Number(fabricaFilter),
    armazem: armazemFilter === "all" ? undefined : armazemFilter as "ambiente_secos" | "frio" | "embalagens",
    conformidade: conformidadeFilter === "all" ? undefined : conformidadeFilter as "conforme" | "nao_conforme" | "pendente",
  });

  const upsert = trpc.rececoes.upsert.useMutation({
    onSuccess: data => {
      toast.success(data.conformidade === "nao_conforme" ? "Receção registada como não conforme" : "Receção registada com sucesso");
      if (data.notificacaoQualidadeEnviada) toast.info("A Qualidade foi notificada das observações.");
      setDialogOpen(false);
      refetch();
    },
    onError: error => toast.error(error.message),
  });
  const eliminar = trpc.rececoes.delete.useMutation({
    onSuccess: () => {
      toast.success("Receção eliminada com sucesso.");
      setRececaoParaEliminar(null);
      refetch();
    },
    onError: error => toast.error(error.message),
  });

  const filteredRececoes = useMemo(() => (rececoes ?? []).filter(rececao => {
    const term = search.trim().toLowerCase();
    return !term || [rececao.materiaPrimaNome, rececao.fornecedorNome, rececao.lote, rececao.numeroGuia]
      .some(value => (value ?? "").toLowerCase().includes(term));
  }), [rececoes, search]);

  const materiasAprovadas = useMemo(() => (materiasPrimas ?? []).filter(mp =>
    mpAprovadaParaRececao(mp, form.fabricaId, form.fornecedorId)
  ), [materiasPrimas, form.fabricaId, form.fornecedorId]);

  const conformidadeCalculada = calcularConformidadeRececao(form.controlos);
  const selectedArmazem = ARMAZENS_RECECAO.find(armazem => armazem.id === form.armazem);
  const podeEliminar = user?.role === "qualidade";

  function abrirNovaRececao() {
    const fabricaId = fabricaFilter !== "all" ? Number(fabricaFilter) : fabricas?.[0]?.id ?? 0;
    setForm(emptyForm(user?.name ?? "", fabricaId));
    setDialogOpen(true);
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

  function setControl<K extends keyof ControlosRececao>(key: K, value: ControlosRececao[K]) {
    setForm(current => ({ ...current, controlos: { ...current.controlos, [key]: value } }));
  }

  function guardar() {
    if (!form.fabricaId || !form.fornecedorId || !form.materiaPrimaId || !form.dataRececao || !form.quantidade || !form.responsavel.trim()) {
      toast.error("Preencha fábrica, fornecedor, matéria-prima, data, quantidade e responsável.");
      return;
    }
    if (conformidadeCalculada === "nao_conforme" && !form.motivoNaoConformidade.trim()) {
      toast.error("Descreva o motivo da não conformidade antes de guardar.");
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
      subtitle={`${filteredRececoes.length} receções no registo`}
      actions={isAuthenticated ? <Button size="sm" onClick={abrirNovaRececao} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Nova receção</Button> : undefined}
    >
      <div className="space-y-5">
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

        <div className="card-elegant p-3 flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar por MP, fornecedor, lote ou guia..." className="pl-9" /></div>
          <Select value={fabricaFilter} onValueChange={setFabricaFilter}><SelectTrigger className="w-full xl:w-52"><SelectValue placeholder="Todas as fábricas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as fábricas</SelectItem>{fabricas?.map(fabrica => <SelectItem key={fabrica.id} value={String(fabrica.id)}>{fabrica.nome}</SelectItem>)}</SelectContent></Select>
          <Select value={armazemFilter} onValueChange={setArmazemFilter}><SelectTrigger className="w-full xl:w-48"><SelectValue placeholder="Todos os armazéns" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os armazéns</SelectItem>{ARMAZENS_RECECAO.map(armazem => <SelectItem key={armazem.id} value={armazem.id}>{armazem.label}</SelectItem>)}</SelectContent></Select>
        </div>

        <div className="space-y-2">
          {filteredRececoes.length === 0 ? <div className="card-elegant p-12 text-center"><ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm font-medium">Ainda não existem receções neste filtro</p><p className="text-xs text-muted-foreground mt-1">Registe a primeira receção para iniciar o controlo de conformidade.</p></div> : filteredRececoes.map(rececao => {
            const fabrica = fabricas?.find(item => item.id === rececao.fabricaId);
            const armazem = ARMAZENS_RECECAO.find(item => item.id === rececao.armazem);
            const config = CONFORMIDADE_CONFIG[rececao.conformidade];
            const Icon = config.icon;
            return <div key={rececao.id} className="card-elegant p-4 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", rececao.conformidade === "conforme" ? "bg-emerald-50" : rececao.conformidade === "nao_conforme" ? "bg-red-50" : "bg-amber-50")}><PackageCheck className={cn("w-5 h-5", config.className.split(" ")[1])} /></div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold">{rececao.materiaPrimaNome}</p><Badge variant="outline" className="font-normal text-[10px]">{armazem?.label}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{rececao.fornecedorNome}{rececao.lote ? ` · Lote ${rececao.lote}` : ""}{rececao.numeroGuia ? ` · Guia ${rececao.numeroGuia}` : ""}</p><div className="mt-2 flex gap-2 flex-wrap">{fabrica && <FactoryBadge nome={fabrica.nome} codigo={fabrica.codigo} size="sm" />}<span className="text-[10px] text-muted-foreground">{new Date(rececao.dataRececao).toLocaleDateString("pt-PT")}</span><span className="text-[10px] text-muted-foreground">{rececao.quantidade} {formatarUnidadeRececao(rececao.unidade as UnidadeRececao)}</span></div></div>
              <div className="flex items-center gap-3 justify-between lg:justify-end"><span className={cn("inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-medium", config.className)}><Icon className="w-3.5 h-3.5" />{config.label}</span>{isAuthenticated && <button type="button" onClick={() => editarRececao(rececao)} className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" title="Editar receção"><Edit2 className="w-4 h-4" /></button>}{podeEliminar && <button type="button" onClick={() => setRececaoParaEliminar(rececao)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Eliminar receção"><Trash2 className="w-4 h-4" /></button>}</div>
            </div>;
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" />{form.id ? "Editar receção" : "Registar receção"}</DialogTitle><DialogDescription className="sr-only">Selecione a fábrica, o fornecedor e uma matéria-prima aprovada para registar a receção e os respetivos controlos.</DialogDescription></DialogHeader>
          <div className="space-y-6 pt-2">
            <section className="rounded-xl border border-border/70 overflow-hidden"><div className="px-4 py-3 bg-muted/40 flex items-center gap-2"><Warehouse className="w-4 h-4 text-primary" /><p className="text-sm font-semibold">Destino e identificação</p></div><div className="p-4 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Fábrica *"><Select value={form.fabricaId ? String(form.fabricaId) : "none"} onValueChange={value => setForm(current => ({ ...current, fabricaId: Number(value), materiaPrimaId: 0 }))}><SelectTrigger><SelectValue placeholder="Selecionar fábrica" /></SelectTrigger><SelectContent>{fabricas?.map(fabrica => <SelectItem key={fabrica.id} value={String(fabrica.id)}>{fabrica.nome}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Armazém *"><Select value={form.armazem} onValueChange={value => setForm(current => ({ ...current, armazem: value as RececaoForm["armazem"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ARMAZENS_RECECAO.map(armazem => <SelectItem key={armazem.id} value={armazem.id}>{armazem.label}</SelectItem>)}</SelectContent></Select><p className="text-[10px] text-muted-foreground">{selectedArmazem?.descricao}</p></Field>
              <Field label="Data de receção *"><Input type="date" value={form.dataRececao} onChange={event => setForm(current => ({ ...current, dataRececao: event.target.value }))} /></Field>
              <Field label="Nº de guia"><Input value={form.numeroGuia} onChange={event => setForm(current => ({ ...current, numeroGuia: event.target.value }))} placeholder="Ex.: GR-2026-001" /></Field>
            </div></section>

            <section className="rounded-xl border border-border/70 overflow-hidden"><div className="px-4 py-3 bg-muted/40 flex items-center gap-2"><PackageCheck className="w-4 h-4 text-primary" /><p className="text-sm font-semibold">Matéria-prima e lote</p></div><div className="p-4 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Fornecedor *"><Select value={form.fornecedorId ? String(form.fornecedorId) : "none"} onValueChange={value => setForm(current => ({ ...current, fornecedorId: Number(value), materiaPrimaId: 0 }))}><SelectTrigger><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger><SelectContent>{fornecedores?.map(fornecedor => <SelectItem key={fornecedor.id} value={String(fornecedor.id)}>{fornecedor.nome}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Matéria-prima *"><Select disabled={!form.fabricaId || !form.fornecedorId} value={form.materiaPrimaId ? String(form.materiaPrimaId) : "none"} onValueChange={value => setForm(current => ({ ...current, materiaPrimaId: Number(value) }))}><SelectTrigger><SelectValue placeholder={!form.fabricaId ? "Escolha primeiro a fábrica" : !form.fornecedorId ? "Escolha primeiro o fornecedor" : "Selecionar MP aprovada"} /></SelectTrigger><SelectContent>{materiasAprovadas.length > 0 ? materiasAprovadas.map(mp => <SelectItem key={mp.id} value={String(mp.id)}>{mp.nome}</SelectItem>) : <div className="px-2 py-3 text-xs text-muted-foreground">Não existem MP aprovadas para este fornecedor nesta fábrica.</div>}</SelectContent></Select></Field>
              <Field label="Lote"><Input value={form.lote} onChange={event => setForm(current => ({ ...current, lote: event.target.value }))} placeholder="Lote do fornecedor" /></Field>
              <Field label="Validade"><Input type="date" value={form.validade} onChange={event => setForm(current => ({ ...current, validade: event.target.value }))} /></Field>
              <Field label="Quantidade *"><Input type="number" min="0" step="0.001" value={form.quantidade || ""} onChange={event => setForm(current => ({ ...current, quantidade: Number(event.target.value) || 0 }))} placeholder="0" /></Field>
              <Field label="Unidade"><Select value={form.unidade} onValueChange={value => setForm(current => ({ ...current, unidade: value as RececaoForm["unidade"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNIDADES_RECECAO.map(unidade => <SelectItem key={unidade.value} value={unidade.value}>{unidade.label}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Nº de paletes LPR"><Input type="number" min="0" value={form.numeroPaletesLpr} onChange={event => setForm(current => ({ ...current, numeroPaletesLpr: event.target.value }))} placeholder="0" /></Field>
              <Field label="Responsável *"><Input value={form.responsavel} onChange={event => setForm(current => ({ ...current, responsavel: event.target.value }))} placeholder="Nome do responsável" /></Field>
            </div></section>

            <section className="rounded-xl border border-border/70 overflow-hidden"><div className="px-4 py-3 bg-muted/40 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"><div className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /><p className="text-sm font-semibold">Pontos de controlo</p></div><ConformidadeBadge estado={conformidadeCalculada} /></div><div className="p-4 grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <ControlCard title="MP em saco" icon={<Thermometer className="w-4 h-4" />}><div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_9rem] items-end gap-2 sm:gap-3 py-3 border-b border-border/50"><div className="min-w-0"><p className="text-xs font-medium">Temperatura</p><Input type="number" step="0.1" value={form.controlos.temperaturaMpSaco?.valor ?? ""} onChange={event => setControl("temperaturaMpSaco", { ...form.controlos.temperaturaMpSaco, valor: event.target.value === "" ? null : Number(event.target.value) })} placeholder="ºC (opcional)" className="h-8 mt-1 text-xs w-full max-w-36" /></div><EstadoControlo value={form.controlos.temperaturaMpSaco?.estado} onChange={estado => setControl("temperaturaMpSaco", { ...form.controlos.temperaturaMpSaco, estado })} compact /></div><ControloRow label="Limpeza" value={form.controlos.limpeza} onChange={estado => setControl("limpeza", estado)} /><ControloRow label="Resíduos de infestação" value={form.controlos.residuosInfestacao} onChange={estado => setControl("residuosInfestacao", estado)} /><ControloRow label="Acondicionamento" value={form.controlos.acondicionamento} onChange={estado => setControl("acondicionamento", estado)} /></ControlCard>
              <ControlCard title="MP a granel" icon={<Truck className="w-4 h-4" />}><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-border/50"><Field label="Nº de selo"><Input value={form.controlos.numeroSelo ?? ""} onChange={event => setControl("numeroSelo", event.target.value)} placeholder="Selo" /></Field><Field label="Nº de silo"><Input value={form.controlos.numeroSilo ?? ""} onChange={event => setControl("numeroSilo", event.target.value)} placeholder="Silo" /></Field></div><ControloRow label="Crivo" value={form.controlos.crivo} onChange={estado => setControl("crivo", estado)} /><ControloRow label="Fecho da boca de carga do silo" value={form.controlos.fechoBocaCarga} onChange={estado => setControl("fechoBocaCarga", estado)} /></ControlCard>
              <ControlCard title="Produto" icon={<PackageCheck className="w-4 h-4" />}><ControloRow label="Aspeto macroscópico" value={form.controlos.aspetoMacroscopico} onChange={estado => setControl("aspetoMacroscopico", estado)} /><ControloRow label="Presença de matérias estranhas" value={form.controlos.materiasEstranhas} onChange={estado => setControl("materiasEstranhas", estado)} /><ControloRow label="Infestação" value={form.controlos.infestacaoProduto} onChange={estado => setControl("infestacaoProduto", estado)} /><ControloRow label="Datas de validade" value={form.controlos.datasValidade} onChange={estado => setControl("datasValidade", estado)} /></ControlCard>
            </div></section>

            {conformidadeCalculada === "nao_conforme" && <div className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="flex items-center gap-2 text-red-800"><AlertTriangle className="w-4 h-4" /><p className="text-sm font-semibold">Tratamento de não conformidade obrigatório</p></div><Textarea value={form.motivoNaoConformidade} onChange={event => setForm(current => ({ ...current, motivoNaoConformidade: event.target.value }))} placeholder="Descreva a não conformidade identificada e a ação imediata tomada..." className="mt-3 bg-background" /></div>}
            <Field label="Observações"><Textarea value={form.observacoes} onChange={event => setForm(current => ({ ...current, observacoes: event.target.value }))} placeholder="Observações complementares da receção..." /></Field>
            <div className="flex justify-end gap-3 pt-2 border-t border-border/60"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={guardar} disabled={upsert.isPending}>{upsert.isPending ? "A guardar..." : form.id ? "Guardar alterações" : "Registar receção"}</Button></div>
          </div>
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
  return <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

function ControlCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="min-w-0 rounded-xl border border-border/70 bg-background overflow-hidden"><div className="px-3 py-2.5 bg-muted/30 flex items-center gap-2 text-xs font-semibold">{icon}{title}</div><div className="px-3">{children}</div></div>;
}

function ConformidadeBadge({ estado }: { estado: "conforme" | "nao_conforme" | "pendente" }) {
  const config = CONFORMIDADE_CONFIG[estado];
  const Icon = config.icon;
  return <span className={cn("inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-medium", config.className)}><Icon className="w-3.5 h-3.5" />{config.label}</span>;
}
