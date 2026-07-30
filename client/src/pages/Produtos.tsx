import { SigaLayout } from "@/components/SigaLayout";
import { AllergenGrid } from "@/components/AllergenGrid";
import { FactoryBadge } from "@/components/FactoryBadge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { type AlergenioId, ALERGENIOS_14 } from "../../../shared/allergens";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown, ChevronUp, Edit2, FileText, FlaskConical, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Produtos() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [fabricaFilter, setFabricaFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ id: undefined as number | undefined, nome: "", codigo: "", marca: "", fabricaId: 0, receitaId: undefined as number | undefined, gama: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: produtos, refetch } = trpc.produtos.list.useQuery({ fabricaId: fabricaFilter !== "all" ? parseInt(fabricaFilter) : undefined });
  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: receitas } = trpc.receitas.list.useQuery();

  const upsert = trpc.produtos.upsert.useMutation({
    onSuccess: () => { toast.success(form.id ? "Produto atualizado" : "Produto criado"); setDialogOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteProduto = trpc.produtos.delete.useMutation({
    onSuccess: () => { toast.success("Produto eliminado"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const calcularPerfil = trpc.produtos.calcularEGuardarPerfil.useMutation({
    onSuccess: (data) => { toast.success(`Perfil calculado: ${data.formulacao.length} via formulação, ${data.contaminacao.length} via contaminação`); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const gerarFTP = trpc.produtos.gerarFTP.useMutation({
    onSuccess: () => { toast.success("FTP gerada com sucesso"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (produtos ?? []).filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <SigaLayout
      title="Produtos"
      subtitle={`${filtered.length} produtos ativos`}
      actions={
        isAuthenticated ? (
          <Button onClick={() => { setForm({ id: undefined, nome: "", codigo: "", marca: "", fabricaId: fabricas?.[0]?.id ?? 0, receitaId: undefined, gama: "" }); setDialogOpen(true); }} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Novo Produto
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
            <Input placeholder="Pesquisar produtos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
              <FlaskConical className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          )}
          {filtered.map(produto => {
            const fab = fabricas?.find(f => f.id === produto.fabricaId);
            const isExpanded = expandedId === produto.id;
            return (
              <div key={produto.id} className="card-elegant overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : produto.id)}
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{produto.nome}</p>
                      {produto.marca && <span className="text-[10px] text-muted-foreground">· {produto.marca}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {fab && <FactoryBadge nome={fab.nome} codigo={fab.codigo} size="sm" />}
                      {produto.gama && <span className="text-[10px] text-muted-foreground">{produto.gama}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isAuthenticated && produto.receitaId && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); calcularPerfil.mutate({ produtoId: produto.id }); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
                          title="Calcular perfil alergénico"
                        >
                          <RefreshCw className="w-3 h-3" /> Calcular
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); gerarFTP.mutate({ produtoId: produto.id }); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200"
                          title="Gerar Ficha Técnica de Produto"
                        >
                          <FileText className="w-3 h-3" /> FTP
                        </button>
                      </>
                    )}
                    {isAuthenticated && (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setForm({
                              id: produto.id,
                              nome: produto.nome,
                              codigo: produto.codigo ?? "",
                              marca: produto.marca ?? "",
                              fabricaId: produto.fabricaId,
                              receitaId: produto.receitaId ?? undefined,
                              gama: produto.gama ?? "",
                            });
                            setDialogOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar produto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(produto.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Eliminar produto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
                  </div>
                </div>

                {isExpanded && (
                  <ProdutoDetalhe produtoId={produto.id} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do produto" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Código</label>
                <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="PRD-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Marca</label>
                <Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Ex: MP, DF, Do Forno" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Gama</label>
                <Input value={form.gama} onChange={e => setForm(f => ({ ...f, gama: e.target.value }))} placeholder="Ex: Padaria, Pastelaria" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fábrica *</label>
              <Select value={String(form.fabricaId)} onValueChange={v => setForm(f => ({ ...f, fabricaId: parseInt(v) }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar fábrica..." /></SelectTrigger>
                <SelectContent>{fabricas?.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Receita Associada</label>
              <Select
                value={form.receitaId ? String(form.receitaId) : "none"}
                onValueChange={v => setForm(f => ({ ...f, receitaId: v !== "none" ? parseInt(v) : undefined }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar receita..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem receita</SelectItem>
                  {receitas?.filter(r => r.fabricaId === form.fabricaId).map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.nome} (v{r.versao})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={!form.nome || !form.fabricaId || upsert.isPending}>
                {upsert.isPending ? "A guardar..." : form.id ? "Guardar" : "Criar Produto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de eliminação */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Eliminar Produto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá desativar o produto. O histórico e as fichas técnicas associadas serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteProduto.mutate({ id: deleteId })}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteProduto.isPending ? "A eliminar..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SigaLayout>
  );
}

function ProdutoDetalhe({ produtoId }: { produtoId: number }) {
  const { data: produto } = trpc.produtos.byId.useQuery({ id: produtoId });
  if (!produto) return <div className="p-4 text-center text-xs text-muted-foreground">A carregar...</div>;
  const formulacao = (produto.perfil?.alergeniosFormulacao as string[] ?? []) as AlergenioId[];
  const contaminacao = (produto.perfil?.alergeniosContaminacao as string[] ?? []) as AlergenioId[];
  return (
    <div className="border-t border-border/60 p-5 bg-muted/20 animate-fade-in">
      {produto.perfil ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Perfil Alergénico (Motor Q1–Q6)</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-red-700 mb-2">Contém via Formulação:</p>
              <div className="flex flex-wrap gap-1.5">
                {formulacao.length === 0 ? <span className="text-xs text-muted-foreground italic">Nenhum</span> :
                  formulacao.map(a => { const al = ALERGENIOS_14.find(x => x.id === a); return al ? <span key={a} className="text-xs px-2 py-0.5 rounded-md alerg-formulacao font-medium">{al.label}</span> : null; })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-amber-700 mb-2">Pode conter vestígios de:</p>
              <div className="flex flex-wrap gap-1.5">
                {contaminacao.length === 0 ? <span className="text-xs text-muted-foreground italic">Nenhum</span> :
                  contaminacao.map(a => { const al = ALERGENIOS_14.find(x => x.id === a); return al ? <span key={a} className="text-xs px-2 py-0.5 rounded-md alerg-contaminacao font-medium">{al.label}</span> : null; })}
              </div>
            </div>
          </div>
          <AllergenGrid formulacao={formulacao} contaminacao={contaminacao} readonly compact={false} />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Perfil alergénico não calculado. Associe uma receita e clique em "Calcular".</p>
      )}
    </div>
  );
}
