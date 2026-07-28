import { SigaLayout } from "@/components/SigaLayout";
import { AllergenGrid } from "@/components/AllergenGrid";
import { FactoryBadge } from "@/components/FactoryBadge";
import { ValidityBadge } from "@/components/ValidityBadge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { useState } from "react";
import type { AlergenioId } from "../../../shared/allergens";
import { ALERGENIOS_14 } from "../../../shared/allergens";
import {
  AlertTriangle, Edit2, Package, Plus, Search, Trash2, X, ChevronDown, ChevronUp
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MPFormData {
  id?: number;
  nome: string;
  codigo: string;
  fornecedorId?: number;
  fabricasIds: number[];
  alergeniosFormulacao: AlergenioId[];
  alergeniosContaminacao: AlergenioId[];
  observacoes: string;
}

const EMPTY_FORM: MPFormData = {
  nome: "", codigo: "", fabricasIds: [],
  alergeniosFormulacao: [], alergeniosContaminacao: [], observacoes: "",
};

export default function MateriasPrimas() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [fabricaFilter, setFabricaFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MPFormData>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: mps, refetch } = trpc.materiasPrimas.list.useQuery({ fabricaId: fabricaFilter !== "all" ? parseInt(fabricaFilter) : undefined });
  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: fornecedores } = trpc.fornecedores.list.useQuery();
  const { data: fichas } = trpc.fichasTecnicas.list.useQuery();

  const upsert = trpc.materiasPrimas.upsert.useMutation({
    onSuccess: () => { toast.success(form.id ? "MP atualizada" : "MP criada com sucesso"); setDialogOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMp = trpc.materiasPrimas.delete.useMutation({
    onSuccess: () => { toast.success("MP removida"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (mps ?? []).filter(mp =>
    mp.nome.toLowerCase().includes(search.toLowerCase()) ||
    (mp.codigo ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (mp: any) => {
    setForm({
      id: mp.id, nome: mp.nome, codigo: mp.codigo ?? "",
      fornecedorId: mp.fornecedorId ?? undefined,
      fabricasIds: (mp.fabricasIds as number[]) ?? [],
      alergeniosFormulacao: (mp.alergeniosFormulacao as AlergenioId[]) ?? [],
      alergeniosContaminacao: (mp.alergeniosContaminacao as AlergenioId[]) ?? [],
      observacoes: mp.observacoes ?? "",
    });
    setDialogOpen(true);
  };

  const getFichaAtiva = (mpId: number) => {
    return fichas?.filter(f => f.materiaPrimaId === mpId).sort((a, b) =>
      new Date(b.dataValidade).getTime() - new Date(a.dataValidade).getTime()
    )[0];
  };

  const toggleFabrica = (fabId: number) => {
    setForm(f => ({
      ...f,
      fabricasIds: f.fabricasIds.includes(fabId)
        ? f.fabricasIds.filter(id => id !== fabId)
        : [...f.fabricasIds, fabId],
    }));
  };

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

            return (
              <div key={mp.id} className="card-elegant overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : mp.id)}
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Package className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{mp.nome}</p>
                      {mp.codigo && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {mp.codigo}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {mpFabricas.map(f => (
                        <FactoryBadge key={f.id} nome={f.nome} codigo={f.codigo} size="sm" />
                      ))}
                      {fichaAtiva && <ValidityBadge dataValidade={fichaAtiva.dataValidade} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(mp); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/60 p-4 bg-muted/20 animate-fade-in">
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Perfil Alergénico
                      </p>
                      <AllergenGrid
                        formulacao={formulacao}
                        contaminacao={contaminacao}
                        readonly
                        compact={false}
                      />
                    </div>
                    {mp.observacoes && (
                      <p className="text-xs text-muted-foreground mt-3 italic">{mp.observacoes}</p>
                    )}
                  </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Farinha de Trigo T65" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Código</label>
                <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ex: FT-001" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fornecedor</label>
              <Select
                value={form.fornecedorId ? String(form.fornecedorId) : "none"}
                onValueChange={v => setForm(f => ({ ...f, fornecedorId: v !== "none" ? parseInt(v) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem fornecedor</SelectItem>
                  {fornecedores?.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  Fábrica III (Sem Glúten): matérias-primas com glúten via formulação serão bloqueadas.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Perfil Alergénico — clique © para formulação, c para contaminação cruzada
              </label>
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20">
                <AllergenGrid
                  formulacao={form.alergeniosFormulacao}
                  contaminacao={form.alergeniosContaminacao}
                  onChange={(f, c) => setForm(prev => ({ ...prev, alergeniosFormulacao: f, alergeniosContaminacao: c }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Notas adicionais..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
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

