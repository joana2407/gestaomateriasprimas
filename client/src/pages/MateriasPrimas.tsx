import { SigaLayout } from "@/components/SigaLayout";
import { AllergenGrid } from "@/components/AllergenGrid";
import { FactoryBadge } from "@/components/FactoryBadge";
import { ValidityBadge } from "@/components/ValidityBadge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { useState, useMemo, useCallback } from "react";
import type { AlergenioId } from "../../../shared/allergens";
import { ALERGENIOS_14 } from "../../../shared/allergens";
import {
  AlertTriangle, ChevronDown, ChevronUp, Edit2, Globe, Layers,
  Package, Plus, Search, Star, Trash2, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface SubIngrediente {
  nome: string;
  paisOrigem?: string;
  percentagem?: number;
  observacoes?: string;
}

interface FornecedorMp {
  fornecedorId: number;
  referenciaFornecedor?: string;
  paisOrigem?: string;
  preferencial?: boolean;
}

interface MPFormData {
  id?: number;
  nome: string;
  codigo: string;
  fabricasIds: number[];
  alergeniosFormulacao: AlergenioId[];
  alergeniosContaminacao: AlergenioId[];
  observacoes: string;
  tipo: "simples" | "composta";
  paisOrigem: string;
  subIngredientes: SubIngrediente[];
  fornecedoresMp: FornecedorMp[];
}

const EMPTY_FORM: MPFormData = {
  nome: "", codigo: "", fabricasIds: [],
  alergeniosFormulacao: [], alergeniosContaminacao: [],
  observacoes: "", tipo: "simples", paisOrigem: "",
  subIngredientes: [], fornecedoresMp: [],
};

export default function MateriasPrimas() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [fabricaFilter, setFabricaFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MPFormData>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"alergenios" | "origem" | "fornecedores">("alergenios");

  const utils = trpc.useUtils();
  const [loadingEdit, setLoadingEdit] = useState(false);

  const { data: mps, refetch } = trpc.materiasPrimas.list.useQuery(
    { fabricaId: fabricaFilter !== "all" ? parseInt(fabricaFilter) : undefined }
  );
  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: fornecedores } = trpc.fornecedores.list.useQuery();
  const { data: fichas } = trpc.fichasTecnicas.list.useQuery();

  const upsert = trpc.materiasPrimas.upsert.useMutation({
    onSuccess: () => {
      toast.success(form.id ? "MP atualizada" : "MP criada com sucesso");
      setDialogOpen(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMp = trpc.materiasPrimas.delete.useMutation({
    onSuccess: () => { toast.success("MP removida"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const fornecedorMap = useMemo(() => new Map((fornecedores ?? []).map(f => [f.id, f])), [fornecedores]);

  const filtered = (mps ?? []).filter(mp =>
    mp.nome.toLowerCase().includes(search.toLowerCase()) ||
    (mp.codigo ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(EMPTY_FORM); setActiveTab("alergenios"); setDialogOpen(true); };
  const openEdit = useCallback(async (mpId: number) => {
    setLoadingEdit(true);
    try {
      // Carregar dados completos incluindo fornecedoresMp via byId
      const mpDetalhes = await utils.materiasPrimas.byId.fetch({ id: mpId });
      if (!mpDetalhes) { toast.error("Erro ao carregar MP"); return; }
      setForm({
        id: mpDetalhes.id,
        nome: mpDetalhes.nome,
        codigo: mpDetalhes.codigo ?? "",
        fabricasIds: (mpDetalhes.fabricasIds as number[]) ?? [],
        alergeniosFormulacao: (mpDetalhes.alergeniosFormulacao as AlergenioId[]) ?? [],
        alergeniosContaminacao: (mpDetalhes.alergeniosContaminacao as AlergenioId[]) ?? [],
        observacoes: mpDetalhes.observacoes ?? "",
        tipo: (mpDetalhes.tipo as any) ?? "simples",
        paisOrigem: mpDetalhes.paisOrigem ?? "",
        subIngredientes: (mpDetalhes.subIngredientes as SubIngrediente[]) ?? [],
        fornecedoresMp: ((mpDetalhes as any).fornecedoresMp ?? []).map((f: any) => ({
          fornecedorId: f.fornecedorId,
          referenciaFornecedor: f.referenciaFornecedor ?? "",
          paisOrigem: f.paisOrigem ?? "",
          preferencial: f.preferencial ?? false,
        })),
      });
      setActiveTab("alergenios");
      setDialogOpen(true);
    } finally {
      setLoadingEdit(false);
    }
  }, [utils]);

  const getFichaAtiva = (mpId: number) =>
    fichas?.filter(f => f.materiaPrimaId === mpId)
      .sort((a, b) => new Date(b.dataValidade).getTime() - new Date(a.dataValidade).getTime())[0];

  const toggleFabrica = (fabId: number) =>
    setForm(f => ({
      ...f,
      fabricasIds: f.fabricasIds.includes(fabId)
        ? f.fabricasIds.filter(id => id !== fabId)
        : [...f.fabricasIds, fabId],
    }));

  const addFornecedor = (fornId: number) => {
    if (form.fornecedoresMp.some(f => f.fornecedorId === fornId)) return;
    setForm(f => ({
      ...f,
      fornecedoresMp: [...f.fornecedoresMp, {
        fornecedorId: fornId,
        preferencial: f.fornecedoresMp.length === 0,
      }],
    }));
  };

  const removeFornecedor = (fornId: number) =>
    setForm(f => ({ ...f, fornecedoresMp: f.fornecedoresMp.filter(x => x.fornecedorId !== fornId) }));

  const setPreferencial = (fornId: number) =>
    setForm(f => ({
      ...f,
      fornecedoresMp: f.fornecedoresMp.map(x => ({ ...x, preferencial: x.fornecedorId === fornId })),
    }));

  const addSubIngrediente = () =>
    setForm(f => ({ ...f, subIngredientes: [...f.subIngredientes, { nome: "" }] }));

  const removeSubIngrediente = (idx: number) =>
    setForm(f => ({ ...f, subIngredientes: f.subIngredientes.filter((_, i) => i !== idx) }));

  const updateSubIngrediente = (idx: number, field: keyof SubIngrediente, value: any) =>
    setForm(f => ({
      ...f,
      subIngredientes: f.subIngredientes.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));

  const TABS = [
    { id: "alergenios", label: "Alergénios" },
    { id: "fornecedores", label: "Fornecedores" },
    { id: "origem", label: "Origem" },
  ] as const;

  return (
    <SigaLayout
      title="Matérias-Primas"
      subtitle={`${filtered.length} MP registadas`}
      actions={
        isAuthenticated ? (
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nova MP
          </Button>
        ) : (
          <Button onClick={() => startLogin()} size="sm" variant="outline">Iniciar Sessão</Button>
        )
      }
    >
      <div className="space-y-5">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={fabricaFilter} onValueChange={setFabricaFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Todas as fábricas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fábricas</SelectItem>
              {fabricas?.map(f => (
                <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="card-elegant p-12 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma matéria-prima encontrada</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {search ? "Tente outro termo de pesquisa" : "Clique em 'Nova MP' para adicionar"}
              </p>
            </div>
          )}
          {filtered.map(mp => {
            const fichaAtiva = getFichaAtiva(mp.id);
            const formulacao = (mp.alergeniosFormulacao as AlergenioId[]) ?? [];
            const contaminacao = (mp.alergeniosContaminacao as AlergenioId[]) ?? [];
            const mpFabricas = fabricas?.filter(f => ((mp.fabricasIds as number[]) ?? []).includes(f.id)) ?? [];
            const isExpanded = expandedId === mp.id;
            const isComposta = mp.tipo === "composta";

            return (
              <div key={mp.id} className="card-elegant overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : mp.id)}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    isComposta ? "bg-violet-50" : "bg-blue-50"
                  )}>
                    {isComposta
                      ? <Layers className="w-4.5 h-4.5 text-violet-600" />
                      : <Package className="w-4.5 h-4.5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{mp.nome}</p>
                      {mp.codigo && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {mp.codigo}
                        </span>
                      )}
                      {isComposta && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 font-medium">
                          Composta
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {mpFabricas.map(f => (
                        <FactoryBadge key={f.id} nome={f.nome} codigo={f.codigo} size="sm" />
                      ))}
                      {fichaAtiva && <ValidityBadge dataValidade={fichaAtiva.dataValidade} />}
                      {mp.paisOrigem && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Globe className="w-3 h-3" />{mp.paisOrigem}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Resumo alergénios */}
                    <div className="hidden sm:flex gap-1">
                      {formulacao.slice(0, 3).map(a => {
                        const al = ALERGENIOS_14.find(x => x.id === a);
                        return al ? (
                          <span key={a} className="text-[10px] px-1.5 py-0.5 rounded alerg-formulacao font-medium">
                            {al.abrev}
                          </span>
                        ) : null;
                      })}
                      {formulacao.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded alerg-formulacao font-medium">
                          +{formulacao.length - 3}
                        </span>
                      )}
                    </div>
                    {isAuthenticated && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); openEdit(mp.id); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          disabled={loadingEdit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar Matéria-Prima</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem a certeza que pretende eliminar <strong>{mp.nome}</strong>?
                                Esta ação não pode ser desfeita e a MP ficará inativa no sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMp.mutate({ id: mp.id })}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <MPDetalhe mp={mp} fornecedorMap={fornecedorMap} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Matéria-Prima" : "Nova Matéria-Prima"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Campos base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <Input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Farinha de Trigo T65"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Código</label>
                <Input
                  value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                  placeholder="Ex: FT-001"
                />
              </div>
            </div>

            {/* Tipo e fábricas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <div className="flex gap-2">
                  {(["simples", "composta"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                        form.tipo === t
                          ? t === "composta"
                            ? "bg-violet-100 text-violet-700 border-violet-300"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {t === "simples" ? "Simples" : "Composta"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">País/Região de Origem</label>
                <Input
                  value={form.paisOrigem}
                  onChange={e => setForm(f => ({ ...f, paisOrigem: e.target.value }))}
                  placeholder="Ex: Portugal, Espanha, UE"
                />
              </div>
            </div>

            {/* Fábricas */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fábricas onde é utilizada</label>
              <div className="flex flex-wrap gap-2">
                {fabricas?.map(fab => (
                  <button
                    key={fab.id}
                    type="button"
                    onClick={() => toggleFabrica(fab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      form.fabricasIds.includes(fab.id)
                        ? fab.codigo === "FAB1" ? "bg-blue-100 text-blue-700 border-blue-300"
                          : fab.codigo === "FAB2" ? "bg-violet-100 text-violet-700 border-violet-300"
                          : "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    {fab.nome.replace("Fábrica ", "Fab. ")}
                  </button>
                ))}
              </div>
              {form.fabricasIds.includes(3) && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Fábrica III (Sem Glúten): MP com glúten via formulação serão bloqueadas.
                </div>
              )}
            </div>

            {/* Tabs: Alergénios / Fornecedores / Origem */}
            <div>
              <div className="flex border-b border-border/60 mb-4">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-xs font-medium border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab: Alergénios */}
              {activeTab === "alergenios" && (
                <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-3">
                    Clique <strong>©</strong> para alergénio via formulação, <strong>c</strong> para via contaminação cruzada.
                  </p>
                  <AllergenGrid
                    formulacao={form.alergeniosFormulacao}
                    contaminacao={form.alergeniosContaminacao}
                    onChange={(f, c) => setForm(prev => ({ ...prev, alergeniosFormulacao: f, alergeniosContaminacao: c }))}
                  />
                </div>
              )}

              {/* Tab: Fornecedores */}
              {activeTab === "fornecedores" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Adicionar Fornecedor</label>
                    <Select onValueChange={v => addFornecedor(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar fornecedor para adicionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores?.filter(f => !form.fornecedoresMp.some(x => x.fornecedorId === f.id)).map(f => (
                          <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    {form.fornecedoresMp.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-4">
                        Nenhum fornecedor associado. Selecione acima para adicionar.
                      </p>
                    )}
                    {form.fornecedoresMp.map((fp, idx) => {
                      const forn = fornecedorMap.get(fp.fornecedorId);
                      return (
                        <div key={fp.fornecedorId} className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{forn?.nome}</span>
                              {fp.preferencial && (
                                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                                  <Star className="w-2.5 h-2.5" /> Preferencial
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {!fp.preferencial && (
                                <button
                                  type="button"
                                  onClick={() => setPreferencial(fp.fornecedorId)}
                                  className="text-[10px] px-2 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                                >
                                  Definir preferencial
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFornecedor(fp.fornecedorId)}
                                className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-muted-foreground">Referência do Fornecedor</label>
                              <Input
                                value={fp.referenciaFornecedor ?? ""}
                                onChange={e => setForm(f => ({
                                  ...f,
                                  fornecedoresMp: f.fornecedoresMp.map((x, i) =>
                                    x.fornecedorId === fp.fornecedorId ? { ...x, referenciaFornecedor: e.target.value } : x
                                  ),
                                }))}
                                placeholder="Ref. interna do fornecedor"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-muted-foreground">País de Origem (este fornecedor)</label>
                              <Input
                                value={fp.paisOrigem ?? ""}
                                onChange={e => setForm(f => ({
                                  ...f,
                                  fornecedoresMp: f.fornecedoresMp.map((x, i) =>
                                    x.fornecedorId === fp.fornecedorId ? { ...x, paisOrigem: e.target.value } : x
                                  ),
                                }))}
                                placeholder="Ex: Portugal, Espanha"
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Origem */}
              {activeTab === "origem" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Observações</label>
                    <textarea
                      value={form.observacoes}
                      onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                      placeholder="Notas adicionais sobre esta MP..."
                      rows={2}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Sub-ingredientes para MP compostas */}
                  {form.tipo === "composta" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">
                          Ingredientes da MP Composta
                        </label>
                        <button
                          type="button"
                          onClick={addSubIngrediente}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Adicionar ingrediente
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 text-xs text-violet-700">
                        <p className="font-medium mb-1">MP Composta</p>
                        <p>Liste os ingredientes que compõem esta MP, com o seu país de origem. Útil para rastreabilidade e declaração de proveniência.</p>
                      </div>
                      <div className="space-y-2">
                        {form.subIngredientes.length === 0 && (
                          <p className="text-xs text-muted-foreground italic text-center py-3">
                            Clique em "Adicionar ingrediente" para listar os componentes desta MP.
                          </p>
                        )}
                        {form.subIngredientes.map((sub, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border border-border/60 bg-muted/20">
                            <div className="col-span-4 space-y-1">
                              <label className="text-[10px] font-medium text-muted-foreground">Nome do ingrediente *</label>
                              <Input
                                value={sub.nome}
                                onChange={e => updateSubIngrediente(idx, "nome", e.target.value)}
                                placeholder="Ex: Açúcar, Sal"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="col-span-3 space-y-1">
                              <label className="text-[10px] font-medium text-muted-foreground">País de origem</label>
                              <Input
                                value={sub.paisOrigem ?? ""}
                                onChange={e => updateSubIngrediente(idx, "paisOrigem", e.target.value)}
                                placeholder="Ex: Portugal"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] font-medium text-muted-foreground">% (opcional)</label>
                              <Input
                                type="number"
                                value={sub.percentagem ?? ""}
                                onChange={e => updateSubIngrediente(idx, "percentagem", parseFloat(e.target.value) || undefined)}
                                placeholder="0"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] font-medium text-muted-foreground">Obs.</label>
                              <Input
                                value={sub.observacoes ?? ""}
                                onChange={e => updateSubIngrediente(idx, "observacoes", e.target.value)}
                                placeholder="Nota"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="col-span-1 pt-5">
                              <button
                                type="button"
                                onClick={() => removeSubIngrediente(idx)}
                                className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => upsert.mutate(form)}
                disabled={!form.nome || upsert.isPending}
              >
                {upsert.isPending ? "A guardar..." : form.id ? "Guardar Alterações" : "Criar MP"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SigaLayout>
  );
}

function MPDetalhe({ mp, fornecedorMap }: { mp: any; fornecedorMap: Map<number, any> }) {
  const { data: mpDetalhes } = trpc.materiasPrimas.byId.useQuery({ id: mp.id });
  const formulacao = (mp.alergeniosFormulacao as AlergenioId[]) ?? [];
  const contaminacao = (mp.alergeniosContaminacao as AlergenioId[]) ?? [];
  const subIngredientes = (mp.subIngredientes as any[]) ?? [];
  const fornecedoresMp = (mpDetalhes?.fornecedoresMp ?? []) as any[];

  return (
    <div className="border-t border-border/60 p-5 bg-muted/20 animate-fade-in">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alergénios */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Perfil Alergénico</p>
          <AllergenGrid formulacao={formulacao} contaminacao={contaminacao} readonly compact={false} />
        </div>

        {/* Fornecedores e Origem */}
        <div className="space-y-4">
          {/* Fornecedores */}
          {fornecedoresMp.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Fornecedores</p>
              <div className="space-y-1.5">
                {fornecedoresMp.map((fp: any) => {
                  const forn = fornecedorMap.get(fp.fornecedorId);
                  return (
                    <div key={fp.id} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{forn?.nome ?? `Fornecedor #${fp.fornecedorId}`}</span>
                          {fp.preferencial && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-600">
                              <Star className="w-2.5 h-2.5" /> Preferencial
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-0.5">
                          {fp.referenciaFornecedor && (
                            <span className="text-[10px] text-muted-foreground font-mono">{fp.referenciaFornecedor}</span>
                          )}
                          {fp.paisOrigem && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Globe className="w-2.5 h-2.5" />{fp.paisOrigem}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Origem */}
          {mp.paisOrigem && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Origem</p>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>{mp.paisOrigem}</span>
              </div>
            </div>
          )}

          {/* Sub-ingredientes para MP compostas */}
          {mp.tipo === "composta" && subIngredientes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Composição da MP
              </p>
              <div className="space-y-1.5">
                {subIngredientes.map((sub: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                    <span className="text-xs font-medium flex-1">{sub.nome}</span>
                    {sub.percentagem && <span className="text-xs text-muted-foreground">{sub.percentagem}%</span>}
                    {sub.paisOrigem && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Globe className="w-2.5 h-2.5" />{sub.paisOrigem}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mp.observacoes && (
            <p className="text-xs text-muted-foreground italic">{mp.observacoes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
