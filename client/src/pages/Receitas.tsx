import { SigaLayout } from "@/components/SigaLayout";
import { AllergenGrid } from "@/components/AllergenGrid";
import { FactoryBadge } from "@/components/FactoryBadge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { useState, useMemo, useCallback } from "react";
import { ALERGENIOS_14, type AlergenioId } from "../../../shared/allergens";
import { cn } from "@/lib/utils";
import {
  BookOpen, CheckCircle2, ChevronDown, ChevronUp, Edit2, GripVertical,
  Minus, Plus, Search, Trash2, Zap, AlertTriangle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ESTADO_LABELS: Record<string, { label: string; class: string }> = {
  rascunho: { label: "Rascunho", class: "bg-slate-100 text-slate-600 border-slate-200" },
  em_revisao: { label: "Em Revisão", class: "bg-blue-50 text-blue-600 border-blue-200" },
  aprovada: { label: "Aprovada", class: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  obsoleta: { label: "Obsoleta", class: "bg-red-50 text-red-500 border-red-200" },
};

const UNIDADES = ["g", "kg", "ml", "L", "unid"] as const;

interface IngredienteForm {
  id?: number; materiaPrimaId: number; quantidade: number; unidade: string; percentagem: number; ordem: number;
}

export default function Receitas() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [fabricaFilter, setFabricaFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ id: undefined as number | undefined, nome: "", codigo: "", fabricaId: 0, descricao: "", estado: "rascunho" as any });
  const [ingredientes, setIngredientes] = useState<IngredienteForm[]>([]);
  const [mpSearch, setMpSearch] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: receitas, refetch } = trpc.receitas.list.useQuery({ fabricaId: fabricaFilter !== "all" ? parseInt(fabricaFilter) : undefined });
  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: mps } = trpc.materiasPrimas.list.useQuery();

  const upsertReceita = trpc.receitas.upsert.useMutation({
    onSuccess: async (data) => {
      await setIngredientesMutation.mutateAsync({ receitaId: data.id, ingredientes });
      toast.success(form.id ? "Receita atualizada" : "Receita criada");
      setDialogOpen(false); refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const setIngredientesMutation = trpc.receitas.setIngredientes.useMutation();
  const aprovarReceita = trpc.receitas.aprovar.useMutation({
    onSuccess: () => { toast.success("Receita aprovada"); refetch(); },
  });
  const deleteReceita = trpc.receitas.delete.useMutation({
    onSuccess: () => { toast.success("Receita eliminada"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const mpMap = useMemo(() => new Map((mps ?? []).map(mp => [mp.id, mp])), [mps]);

  const perfilTempoReal = useMemo(() => {
    const formulacao = new Set<string>();
    const contaminacao = new Set<string>();
    for (const ing of ingredientes) {
      const mp = mpMap.get(ing.materiaPrimaId);
      if (!mp) continue;
      for (const a of (mp.alergeniosFormulacao as string[] ?? [])) formulacao.add(a);
      for (const a of (mp.alergeniosContaminacao as string[] ?? [])) {
        if (!formulacao.has(a)) contaminacao.add(a);
      }
    }
    return { formulacao: Array.from(formulacao) as AlergenioId[], contaminacao: Array.from(contaminacao) as AlergenioId[] };
  }, [ingredientes, mpMap]);

  const filteredMps = (mps ?? []).filter(mp =>
    mp.nome.toLowerCase().includes(mpSearch.toLowerCase()) &&
    !ingredientes.some(i => i.materiaPrimaId === mp.id)
  );

  const addIngrediente = (mpId: number) => {
    setIngredientes(prev => [...prev, { materiaPrimaId: mpId, quantidade: 0, unidade: "g", percentagem: 0, ordem: prev.length }]);
    setMpSearch("");
  };

  const removeIngrediente = (idx: number) => setIngredientes(prev => prev.filter((_, i) => i !== idx));

  const updateIngrediente = (idx: number, field: keyof IngredienteForm, value: any) =>
    setIngredientes(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));

  const openCreate = () => {
    setForm({ id: undefined, nome: "", codigo: "", fabricaId: fabricas?.[0]?.id ?? 0, descricao: "", estado: "rascunho" });
    setIngredientes([]);
    setDialogOpen(true);
  };

  const openEdit = useCallback(async (receitaId: number) => {
    setLoadingEdit(true);
    try {
      const receita = await utils.receitas.byId.fetch({ id: receitaId });
      if (!receita) { toast.error("Erro ao carregar receita"); return; }
      setForm({
        id: receita.id,
        nome: receita.nome,
        codigo: receita.codigo ?? "",
        fabricaId: receita.fabricaId,
        descricao: receita.descricao ?? "",
        estado: receita.estado,
      });
      setIngredientes((receita.ingredientes ?? []).map((ing: any) => ({
        id: ing.id,
        materiaPrimaId: ing.materiaPrimaId,
        quantidade: ing.quantidade ?? 0,
        unidade: ing.unidade ?? "g",
        percentagem: ing.percentagem ?? 0,
        ordem: ing.ordem ?? 0,
      })));
      setDialogOpen(true);
    } finally {
      setLoadingEdit(false);
    }
  }, [utils]);

  const filtered = (receitas ?? []).filter(r =>
    r.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SigaLayout
      title="Receitas e Formulações"
      subtitle={`${filtered.length} receitas registadas`}
      actions={
        isAuthenticated ? (
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nova Receita
          </Button>
        ) : (
          <Button onClick={() => startLogin()} size="sm" variant="outline">Iniciar Sessão</Button>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Pesquisar receitas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={fabricaFilter} onValueChange={setFabricaFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Todas as fábricas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fábricas</SelectItem>
              {fabricas?.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="card-elegant p-12 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhuma receita encontrada</p>
            </div>
          )}
          {filtered.map(receita => {
            const fab = fabricas?.find(f => f.id === receita.fabricaId);
            const estadoConfig = ESTADO_LABELS[receita.estado] ?? ESTADO_LABELS.rascunho;
            const isExpanded = expandedId === receita.id;

            return (
              <div key={receita.id} className="card-elegant overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : receita.id)}
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{receita.nome}</p>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">v{receita.versao}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {fab && <FactoryBadge nome={fab.nome} codigo={fab.codigo} size="sm" />}
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", estadoConfig.class)}>
                        {estadoConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    {isAuthenticated && receita.estado === "rascunho" && (
                      <button
                        onClick={() => aprovarReceita.mutate({ id: receita.id })}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Aprovar
                      </button>
                    )}
                    {isAuthenticated && (
                      <>
                        <button
                          onClick={() => openEdit(receita.id)}
                          disabled={loadingEdit}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar receita"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(receita.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Eliminar receita"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
                  </div>
                </div>

                {isExpanded && (
                  <ReceitaDetalhe receitaId={receita.id} fabricaId={receita.fabricaId} fabricaCodigo={fab?.codigo ?? "FAB1"} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Receita" : "Nova Receita"}</DialogTitle>
          </DialogHeader>
          <div className="grid lg:grid-cols-2 gap-6 pt-2">
            {/* Formulário */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                  <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome da receita" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Código</label>
                  <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="REC-001" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fábrica *</label>
                <Select value={String(form.fabricaId)} onValueChange={v => setForm(f => ({ ...f, fabricaId: parseInt(v) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar fábrica..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fabricas?.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Ingredientes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Ingredientes</label>
                  <span className="text-[10px] text-muted-foreground">{ingredientes.length} adicionados</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar MP para adicionar..."
                    value={mpSearch}
                    onChange={e => setMpSearch(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>
                {mpSearch && filteredMps.length > 0 && (
                  <div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    {filteredMps.slice(0, 8).map(mp => (
                      <button
                        key={mp.id}
                        type="button"
                        onClick={() => addIngrediente(mp.id)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors border-b last:border-0"
                      >
                        <span className="font-medium">{mp.nome}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {ingredientes.map((ing, idx) => {
                    const mp = mpMap.get(ing.materiaPrimaId);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-xs font-medium truncate">{mp?.nome}</span>
                        {/* Quantidade */}
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={ing.quantidade || ""}
                          onChange={e => updateIngrediente(idx, "quantidade", parseFloat(e.target.value) || 0)}
                          className="w-16 h-7 text-xs text-right"
                          placeholder="0"
                        />
                        {/* Seletor de unidade g/kg */}
                        <Select
                          value={ing.unidade}
                          onValueChange={v => updateIngrediente(idx, "unidade", v)}
                        >
                          <SelectTrigger className="w-14 h-7 text-xs px-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIDADES.map(u => (
                              <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button type="button" onClick={() => removeIngrediente(idx)} className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {ingredientes.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">Pesquise e adicione ingredientes acima</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pré-visualização alergénica em tempo real */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <label className="text-xs font-semibold text-foreground">Pré-visualização Alergénica</label>
                <span className="text-[10px] text-muted-foreground">(tempo real)</span>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 min-h-48">
                {ingredientes.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <p className="text-xs text-center">Adicione ingredientes para ver o perfil alergénico</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {perfilTempoReal.formulacao.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-2">Contém via Formulação:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {perfilTempoReal.formulacao.map(a => {
                            const al = ALERGENIOS_14.find(x => x.id === a);
                            return al ? (
                              <span key={a} className="text-xs px-2 py-0.5 rounded-md alerg-formulacao font-medium">
                                {al.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {perfilTempoReal.contaminacao.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-2">Pode conter vestígios de:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {perfilTempoReal.contaminacao.map(a => {
                            const al = ALERGENIOS_14.find(x => x.id === a);
                            return al ? (
                              <span key={a} className="text-xs px-2 py-0.5 rounded-md alerg-contaminacao font-medium">
                                {al.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {perfilTempoReal.formulacao.length === 0 && perfilTempoReal.contaminacao.length === 0 && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <p className="text-xs font-medium">Nenhum alergénio identificado</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border/40">
                      <AllergenGrid
                        formulacao={perfilTempoReal.formulacao}
                        contaminacao={perfilTempoReal.contaminacao}
                        readonly
                        compact
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => upsertReceita.mutate(form)}
              disabled={!form.nome || !form.fabricaId || upsertReceita.isPending}
            >
              {upsertReceita.isPending ? "A guardar..." : form.id ? "Guardar Alterações" : "Criar Receita"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de eliminação */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Eliminar Receita
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A receita e todos os seus ingredientes serão permanentemente eliminados.
              Os produtos que utilizam esta receita perderão a associação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteReceita.mutate({ id: deleteId })}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteReceita.isPending ? "A eliminar..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SigaLayout>
  );
}

function ReceitaDetalhe({ receitaId, fabricaId, fabricaCodigo }: { receitaId: number; fabricaId: number; fabricaCodigo: string }) {
  const { data: receita } = trpc.receitas.byId.useQuery({ id: receitaId });
  const { data: mps } = trpc.materiasPrimas.list.useQuery();
  const { data: perfil } = trpc.receitas.calcularPerfil.useQuery({ receitaId, fabricaCodigo });
  const mpMap = useMemo(() => new Map((mps ?? []).map(mp => [mp.id, mp])), [mps]);

  if (!receita) return <div className="p-4 text-center text-sm text-muted-foreground">A carregar...</div>;

  const formulacao = perfil ? Object.entries(perfil.perfil).filter(([,v]) => v === "formulacao").map(([k]) => k) : [];
  const contaminacao = perfil ? Object.entries(perfil.perfil).filter(([,v]) => v === "contaminacao").map(([k]) => k) : [];

  return (
    <div className="border-t border-border/60 p-5 bg-muted/20 animate-fade-in">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ingredientes */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Ingredientes ({(receita.ingredientes ?? []).length})
          </p>
          {(receita.ingredientes ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sem ingredientes registados</p>
          ) : (
            <div className="space-y-1.5">
              {receita.ingredientes?.map((ing, idx) => {
                const mp = mpMap.get(ing.materiaPrimaId);
                return (
                  <div key={ing.id} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}.</span>
                    <span className="flex-1 text-xs font-medium">{mp?.nome ?? `MP #${ing.materiaPrimaId}`}</span>
                    {ing.quantidade != null && ing.quantidade > 0 && (
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {ing.quantidade} {ing.unidade ?? "g"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Perfil alergénico calculado */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Perfil Alergénico (Motor Q1–Q6)
          </p>
          {perfil ? (
            <AllergenGrid
              formulacao={formulacao as AlergenioId[]}
              contaminacao={contaminacao as AlergenioId[]}
              readonly
              compact={false}
            />
          ) : (
            <p className="text-xs text-muted-foreground italic">A calcular perfil...</p>
          )}
        </div>
      </div>
    </div>
  );
}
