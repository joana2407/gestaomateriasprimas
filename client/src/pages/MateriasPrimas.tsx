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
  AlertTriangle, ChevronDown, ChevronUp, Edit2, ExternalLink, FileText, Globe, Layers,
  Package, Plus, Search, Star, Trash2, X, GripVertical
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
  const [fornecedorFilter, setFornecedorFilter] = useState<string>("all");
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

  // Mapa de MP → IDs de fornecedores (para filtro client-side)
  // Usamos as fichas técnicas para inferir fornecedores associados a cada MP
  // A relação mp_fornecedores é carregada via byId; para a listagem usamos as fichas como proxy
  const fichasPorMp = useMemo(() => {
    const map = new Map<number, typeof fichas>();
    (fichas ?? []).forEach(ft => {
      if (!map.has(ft.materiaPrimaId)) map.set(ft.materiaPrimaId, []);
      map.get(ft.materiaPrimaId)!.push(ft);
    });
    return map;
  }, [fichas]);

  const filtered = useMemo(() => {
    return (mps ?? []).filter(mp => {
      const matchSearch = mp.nome.toLowerCase().includes(search.toLowerCase()) ||
        (mp.codigo ?? "").toLowerCase().includes(search.toLowerCase());
      // Filtro por fornecedor: usar a relação direta mp_fornecedores devolvida pela listagem
      const matchFornecedor = fornecedorFilter === "all" ||
        ((mp as any).fornecedoresIds as number[] ?? []).some((id: number) => String(id) === fornecedorFilter);
      return matchSearch && matchFornecedor;
    });
  }, [mps, search, fornecedorFilter]);

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
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas as fábricas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fábricas</SelectItem>
              {fabricas?.map(f => (
                <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fornecedorFilter} onValueChange={setFornecedorFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Todos os fornecedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os fornecedores</SelectItem>
              {fornecedores?.map(f => (
                <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || fabricaFilter !== "all" || fornecedorFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setFabricaFilter("all"); setFornecedorFilter("all"); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-border/60 shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        {/* Contador de resultados com filtros ativos */}
        {(search || fabricaFilter !== "all" || fornecedorFilter !== "all") && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</span>
            {fornecedorFilter !== "all" && (
              <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 font-medium">
                Fornecedor: {fornecedorMap.get(parseInt(fornecedorFilter))?.nome}
              </span>
            )}
          </div>
        )}

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
                      {/* Cabeçalho com contador e botão */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Ingredientes da MP Composta</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {form.subIngredientes.length} ingrediente{form.subIngredientes.length !== 1 ? "s" : ""} registado{form.subIngredientes.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addSubIngrediente}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar ingrediente
                        </button>
                      </div>

                      {/* Lista vazia */}
                      {form.subIngredientes.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/40">
                          <Layers className="w-7 h-7 text-violet-400" />
                          <p className="text-xs font-medium text-violet-700">Nenhum ingrediente adicionado</p>
                          <p className="text-[10px] text-violet-600 text-center max-w-xs">
                            Clique em "Adicionar ingrediente" para registar cada componente com a sua origem e % de incorporação.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {form.subIngredientes.map((sub, idx) => (
                            <div key={idx} className="rounded-xl border border-border/70 bg-card overflow-hidden">
                              {/* Cabeçalho do cartão */}
                              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {sub.nome || <span className="text-muted-foreground italic font-normal">Ingrediente {idx + 1}</span>}
                                  </span>
                                  {sub.percentagem != null && sub.percentagem > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold">
                                      {sub.percentagem}%
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSubIngrediente(idx)}
                                  className="p-1 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground"
                                  title="Remover ingrediente"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {/* Campos do cartão */}
                              <div className="p-4 grid grid-cols-3 gap-4">
                                <div className="col-span-3 space-y-1.5">
                                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    Nome do Ingrediente *
                                  </label>
                                  <Input
                                    value={sub.nome}
                                    onChange={e => updateSubIngrediente(idx, "nome", e.target.value)}
                                    placeholder="Ex: Farinha de Trigo, Açúcar, Sal marinho..."
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    País / Região de Origem
                                  </label>
                                  <Input
                                    value={sub.paisOrigem ?? ""}
                                    onChange={e => updateSubIngrediente(idx, "paisOrigem", e.target.value)}
                                    placeholder="Ex: Portugal, Espanha, UE..."
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    % de Incorporação
                                  </label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={sub.percentagem ?? ""}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        updateSubIngrediente(idx, "percentagem", isNaN(val) ? undefined : Math.min(100, Math.max(0, val)));
                                      }}
                                      placeholder="0.0"
                                      className="pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">%</span>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    Observações
                                  </label>
                                  <Input
                                    value={sub.observacoes ?? ""}
                                    onChange={e => updateSubIngrediente(idx, "observacoes", e.target.value)}
                                    placeholder="Notas adicionais..."
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Indicador de soma das percentagens */}
                  {form.tipo === "composta" && form.subIngredientes.some(s => s.percentagem) && (() => {
                    const soma = form.subIngredientes.reduce((acc, s) => acc + (s.percentagem ?? 0), 0);
                    const ok = Math.abs(soma - 100) < 0.1;
                    return (
                      <div className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border",
                        ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                      )}>
                        <span>Total de incorporação</span>
                        <span className="font-bold">{soma.toFixed(1)}%{ok ? " ✓" : " (deve somar 100%)"}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Aviso quando tipo é composta mas sem ingredientes ainda */}
              {form.tipo === "composta" && activeTab === "origem" && form.subIngredientes.length === 0 && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-violet-50 border border-violet-200 text-xs text-violet-700">
                  <Layers className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">MP Composta — Composição por preencher</p>
                    <p>Aceda ao separador <strong>Origem</strong> e clique em <strong>"Adicionar ingrediente"</strong> para listar os componentes desta MP com origem e % de incorporação.</p>
                  </div>
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
  const { data: fichasMp } = trpc.fichasTecnicas.list.useQuery({ materiaPrimaId: mp.id });
  const formulacao = (mp.alergeniosFormulacao as AlergenioId[]) ?? [];
  const contaminacao = (mp.alergeniosContaminacao as AlergenioId[]) ?? [];
  const subIngredientes = (mpDetalhes?.subIngredientes as any[]) ?? (mp.subIngredientes as any[]) ?? [];
  const fornecedoresMp = (mpDetalhes?.fornecedoresMp ?? []) as any[];
  const paisOrigem = mpDetalhes?.paisOrigem ?? mp.paisOrigem;
  const observacoes = mpDetalhes?.observacoes ?? mp.observacoes;
  const tipo = mpDetalhes?.tipo ?? mp.tipo;

  // Agrupar fichas técnicas por fornecedor para cruzamento
  const fichasPorFornecedor = useMemo(() => {
    const map = new Map<number | null, typeof fichasMp>();
    (fichasMp ?? []).forEach(ft => {
      const key = ft.fornecedorId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ft);
    });
    return map;
  }, [fichasMp]);

  // Obter a FT mais recente para um fornecedor específico
  const getFtParaFornecedor = (fornId: number | null) => {
    const fts = fichasPorFornecedor.get(fornId) ?? fichasPorFornecedor.get(null) ?? [];
    return fts.sort((a, b) => new Date(b.dataValidade).getTime() - new Date(a.dataValidade).getTime())[0];
  };

  return (
    <div className="border-t border-border/60 p-5 bg-muted/20 animate-fade-in">
      <div className="space-y-6">
        {/* ── Perfil Alergénico ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Perfil Alergénico</p>
          <AllergenGrid formulacao={formulacao} contaminacao={contaminacao} readonly compact={false} />
        </div>

        {/* ── Fornecedores com FT e Origem ── */}
        {fornecedoresMp.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Fornecedores, Origens e Fichas Técnicas
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fornecedoresMp.map((fp: any) => {
                const forn = fornecedorMap.get(fp.fornecedorId);
                const ft = getFtParaFornecedor(fp.fornecedorId);
                const ftGeral = !ft ? getFtParaFornecedor(null) : null;
                const ftAtiva = ft ?? ftGeral;
                const diasValidade = ftAtiva
                  ? Math.floor((new Date(ftAtiva.dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const estadoFt = ftAtiva
                  ? diasValidade! < 0 ? "expirada"
                    : diasValidade! <= 30 ? "a_expirar_30"
                    : diasValidade! <= 60 ? "a_expirar_60"
                    : "valida"
                  : null;

                return (
                  <div key={fp.id ?? fp.fornecedorId} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                    {/* Cabeçalho do fornecedor */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {forn?.nome ?? `Fornecedor #${fp.fornecedorId}`}
                          </span>
                          {fp.preferencial && (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                              <Star className="w-2.5 h-2.5" /> Preferencial
                            </span>
                          )}
                        </div>
                        {fp.referenciaFornecedor && (
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            Ref: {fp.referenciaFornecedor}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Origem */}
                    {(fp.paisOrigem || paisOrigem) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                        <span>{fp.paisOrigem || paisOrigem}</span>
                      </div>
                    )}

                    {/* Ficha Técnica */}
                    <div className="pt-2 border-t border-border/40">
                      {ftAtiva ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                FT v{ftAtiva.versao}
                                {!ft && ftGeral && (
                                  <span className="ml-1 text-[10px] opacity-70">(geral)</span>
                                )}
                              </span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                              estadoFt === "expirada" ? "bg-red-50 text-red-600 border-red-200" :
                              estadoFt === "a_expirar_30" ? "bg-orange-50 text-orange-600 border-orange-200" :
                              estadoFt === "a_expirar_60" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                              "bg-emerald-50 text-emerald-600 border-emerald-200"
                            )}>
                              {estadoFt === "expirada" ? "Expirada" :
                               estadoFt === "a_expirar_30" ? `${diasValidade}d` :
                               estadoFt === "a_expirar_60" ? `${diasValidade}d` :
                               "Válida"}
                            </span>
                          </div>
                          {ftAtiva.ficheiroUrl ? (
                            <a
                              href={ftAtiva.ficheiroUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Abrir ficheiro FT
                            </a>
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic">Sem ficheiro anexado</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
                          <FileText className="w-3 h-3" />
                          Sem ficha técnica registada
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Origem da MP (quando sem fornecedores associados) ── */}
        {fornecedoresMp.length === 0 && paisOrigem && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Origem</p>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>{paisOrigem}</span>
            </div>
          </div>
        )}

        {/* ── FT geral (sem fornecedor específico) quando não há fornecedores associados ── */}
        {fornecedoresMp.length === 0 && (fichasMp ?? []).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Fichas Técnicas
            </p>
            <div className="space-y-2">
              {(fichasMp ?? []).slice(0, 3).map(ft => {
                const diasV = Math.floor((new Date(ft.dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const est = diasV < 0 ? "expirada" : diasV <= 30 ? "a_expirar_30" : diasV <= 60 ? "a_expirar_60" : "valida";
                return (
                  <div key={ft.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">v{ft.versao}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Válida até {new Date(ft.dataValidade).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0",
                      est === "expirada" ? "bg-red-50 text-red-600 border-red-200" :
                      est === "a_expirar_30" ? "bg-orange-50 text-orange-600 border-orange-200" :
                      est === "a_expirar_60" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                      "bg-emerald-50 text-emerald-600 border-emerald-200"
                    )}>
                      {est === "expirada" ? "Expirada" : est === "valida" ? "Válida" : `${diasV}d`}
                    </span>
                    {ft.ficheiroUrl && (
                      <a
                        href={ft.ficheiroUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> PDF
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MP Composta: sub-ingredientes ── */}
        {tipo === "composta" && subIngredientes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Composição da MP
            </p>
            <div className="rounded-xl border border-violet-200 overflow-hidden">
              <div className="grid grid-cols-12 gap-0 px-3 py-2 bg-violet-50 text-[10px] font-semibold text-violet-700 uppercase tracking-wide">
                <span className="col-span-5">Ingrediente</span>
                <span className="col-span-3">País de Origem</span>
                <span className="col-span-2 text-right">%</span>
                <span className="col-span-2 pl-2">Obs.</span>
              </div>
              {subIngredientes.map((sub: any, idx: number) => (
                <div key={idx} className={cn(
                  "grid grid-cols-12 gap-0 px-3 py-2.5 text-xs border-t border-violet-100",
                  idx % 2 === 0 ? "bg-white" : "bg-violet-50/30"
                )}>
                  <span className="col-span-5 font-medium text-foreground">{sub.nome}</span>
                  <span className="col-span-3 flex items-center gap-1 text-muted-foreground">
                    {sub.paisOrigem ? (
                      <><Globe className="w-3 h-3 shrink-0" />{sub.paisOrigem}</>
                    ) : <span className="opacity-40">—</span>}
                  </span>
                  <span className="col-span-2 text-right text-muted-foreground">
                    {sub.percentagem ? `${sub.percentagem}%` : <span className="opacity-40">—</span>}
                  </span>
                  <span className="col-span-2 pl-2 text-muted-foreground italic text-[10px]">
                    {sub.observacoes || ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Observações ── */}
        {observacoes && (
          <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-3">{observacoes}</p>
        )}
      </div>
    </div>
  );
}
