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
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, Edit2, FileText, FlaskConical, Link2, Link2Off, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
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
  const [linkerOpen, setLinkerOpen] = useState(false);
  const [linkerFabricaId, setLinkerFabricaId] = useState(0);
  const [linkerProdutoSearch, setLinkerProdutoSearch] = useState("");
  const [linkerReceitaSearch, setLinkerReceitaSearch] = useState("");
  const [selectedProdutoId, setSelectedProdutoId] = useState<number | null>(null);

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
  const associarReceita = trpc.produtos.associarReceita.useMutation({
    onSuccess: ({ produtoId, receitaId }) => {
      toast.success(receitaId ? "Receita associada e perfil alergénico atualizado" : "Associação de receita removida");
      refetch();
      if (receitaId) calcularPerfil.mutate({ produtoId });
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (produtos ?? []).filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  const receitasPorId = useMemo(() => new Map((receitas ?? []).map(receita => [receita.id, receita])), [receitas]);
  const produtosDoAssociador = useMemo(() => (produtos ?? [])
    .filter(produto => linkerFabricaId === 0 || produto.fabricaId === linkerFabricaId)
    .filter(produto => produto.nome.toLowerCase().includes(linkerProdutoSearch.toLowerCase())), [produtos, linkerFabricaId, linkerProdutoSearch]);
  const produtoSelecionado = useMemo(() => (produtos ?? []).find(produto => produto.id === selectedProdutoId) ?? null, [produtos, selectedProdutoId]);
  const receitasCandidatas = useMemo(() => {
    if (!produtoSelecionado) return [];
    const pesquisa = linkerReceitaSearch.trim().toLowerCase();
    const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const produtoNome = normalizar(produtoSelecionado.nome);
    return (receitas ?? [])
      .filter(receita => receita.fabricaId === produtoSelecionado.fabricaId)
      .filter(receita => !pesquisa || receita.nome.toLowerCase().includes(pesquisa) || (receita.descricao ?? "").toLowerCase().includes(pesquisa))
      .sort((a, b) => {
        const aMatch = normalizar(a.nome).includes(produtoNome) || produtoNome.includes(normalizar(a.nome));
        const bMatch = normalizar(b.nome).includes(produtoNome) || produtoNome.includes(normalizar(b.nome));
        return Number(bMatch) - Number(aMatch) || a.nome.localeCompare(b.nome);
      });
  }, [receitas, produtoSelecionado, linkerReceitaSearch]);

  const openAssociador = () => {
    const primeiraFabrica = fabricas?.[0]?.id ?? 0;
    const fabricaId = fabricaFilter !== "all" ? parseInt(fabricaFilter) : primeiraFabrica;
    const primeiroProduto = (produtos ?? []).find(produto => produto.fabricaId === fabricaId && !produto.receitaId)
      ?? (produtos ?? []).find(produto => produto.fabricaId === fabricaId)
      ?? null;
    setLinkerFabricaId(fabricaId);
    setSelectedProdutoId(primeiroProduto?.id ?? null);
    setLinkerProdutoSearch("");
    setLinkerReceitaSearch("");
    setLinkerOpen(true);
  };

  return (
    <SigaLayout
      title="Produtos"
      subtitle={`${filtered.length} produtos ativos`}
      actions={
        isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Button onClick={openAssociador} size="sm" variant="outline" className="gap-1.5 bg-background">
              <Link2 className="w-3.5 h-3.5" /> Associar receitas
            </Button>
            <Button onClick={() => { setForm({ id: undefined, nome: "", codigo: "", marca: "", fabricaId: fabricas?.[0]?.id ?? 0, receitaId: undefined, gama: "" }); setDialogOpen(true); }} size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Novo Produto
            </Button>
          </div>
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
            const receitaAssociada = produto.receitaId ? receitasPorId.get(produto.receitaId) : null;
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
                      {receitaAssociada ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5">
                          <BookOpen className="w-2.5 h-2.5" /> {receitaAssociada.nome}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-1.5 py-0.5">Sem receita</span>
                      )}
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

      <Dialog open={linkerOpen} onOpenChange={setLinkerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-600" /> Associar Produtos e Receitas
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Selecione um produto e associe uma receita da mesma fábrica. O perfil alergénico é recalculado automaticamente.</p>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 py-1">
            <Select value={String(linkerFabricaId)} onValueChange={value => {
              const fabricaId = parseInt(value);
              setLinkerFabricaId(fabricaId);
              setSelectedProdutoId((produtos ?? []).find(produto => produto.fabricaId === fabricaId && !produto.receitaId)?.id ?? (produtos ?? []).find(produto => produto.fabricaId === fabricaId)?.id ?? null);
              setLinkerProdutoSearch("");
              setLinkerReceitaSearch("");
            }}>
              <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Selecionar fábrica" /></SelectTrigger>
              <SelectContent>{fabricas?.map(fabrica => <SelectItem key={fabrica.id} value={String(fabrica.id)}>{fabrica.nome}</SelectItem>)}</SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground flex items-center px-1">Apenas receitas da unidade selecionada são disponibilizadas.</div>
          </div>
          <div className="grid lg:grid-cols-5 gap-5 min-h-0 flex-1 overflow-hidden pt-2">
            <section className="lg:col-span-2 min-h-0 flex flex-col rounded-xl border border-border/70 bg-muted/15 overflow-hidden">
              <div className="p-3 border-b border-border/60 bg-background/70">
                <p className="text-xs font-semibold">Produtos comerciais</p>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={linkerProdutoSearch} onChange={event => setLinkerProdutoSearch(event.target.value)} placeholder="Pesquisar produto..." className="h-8 pl-8 text-xs" />
                </div>
              </div>
              <div className="p-2 overflow-y-auto max-h-[48vh] space-y-1">
                {produtosDoAssociador.length === 0 ? <p className="p-5 text-xs text-center text-muted-foreground">Nenhum produto nesta fábrica.</p> : produtosDoAssociador.map(produto => {
                  const receita = produto.receitaId ? receitasPorId.get(produto.receitaId) : null;
                  const selected = produto.id === selectedProdutoId;
                  return <button key={produto.id} type="button" onClick={() => { setSelectedProdutoId(produto.id); setLinkerReceitaSearch(""); }} className={cn("w-full text-left rounded-lg p-3 transition-colors border", selected ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-background border-transparent hover:bg-accent/60 hover:border-border/70")}>
                    <div className="flex items-start gap-2">
                      <FlaskConical className={cn("w-4 h-4 mt-0.5 shrink-0", selected ? "text-emerald-600" : "text-muted-foreground")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{produto.nome}</p>
                        <p className={cn("mt-1 text-[10px] truncate", receita ? "text-emerald-700" : "text-amber-700")}>{receita ? `Receita: ${receita.nome}` : "Sem receita associada"}</p>
                      </div>
                    </div>
                  </button>;
                })}
              </div>
            </section>

            <section className="lg:col-span-3 min-h-0 flex flex-col rounded-xl border border-border/70 overflow-hidden">
              {!produtoSelecionado ? <div className="flex-1 p-10 flex flex-col items-center justify-center text-center text-muted-foreground"><FlaskConical className="w-8 h-8 mb-3 opacity-30" /><p className="text-sm">Selecione um produto para ver as receitas disponíveis.</p></div> : <>
                <div className="p-4 border-b border-border/60 bg-emerald-50/40">
                  <div className="flex items-start gap-3 justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold">Produto selecionado</p>
                      <p className="mt-1 font-semibold text-sm truncate">{produtoSelecionado.nome}</p>
                      {produtoSelecionado.receitaId && receitasPorId.get(produtoSelecionado.receitaId) ? <p className="mt-1 text-xs text-emerald-700 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Associado a: {receitasPorId.get(produtoSelecionado.receitaId)?.nome}</p> : <p className="mt-1 text-xs text-amber-700">Ainda sem receita associada.</p>}
                    </div>
                    {produtoSelecionado.receitaId && <Button type="button" variant="outline" size="sm" className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50" disabled={associarReceita.isPending} onClick={() => associarReceita.mutate({ produtoId: produtoSelecionado.id, receitaId: null })}><Link2Off className="w-3.5 h-3.5" /> Remover</Button>}
                  </div>
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input value={linkerReceitaSearch} onChange={event => setLinkerReceitaSearch(event.target.value)} placeholder="Pesquisar receitas desta fábrica..." className="h-9 pl-8 text-xs bg-background" />
                  </div>
                </div>
                <div className="p-3 overflow-y-auto max-h-[42vh] space-y-2 bg-muted/10">
                  {receitasCandidatas.length === 0 ? <div className="p-8 text-center text-xs text-muted-foreground"><BookOpen className="w-6 h-6 mx-auto mb-2 opacity-30" />Não existem receitas que correspondam à pesquisa nesta fábrica.</div> : receitasCandidatas.map(receita => {
                    const associada = produtoSelecionado.receitaId === receita.id;
                    return <div key={receita.id} className={cn("rounded-lg border p-3 flex items-center gap-3", associada ? "bg-emerald-50 border-emerald-200" : "bg-background border-border/70")}>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", associada ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}><BookOpen className="w-4 h-4" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap"><p className="text-xs font-semibold truncate">{receita.nome}</p><span className="text-[10px] text-muted-foreground">v{receita.versao}</span>{associada && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Associada</span>}</div>
                        {receita.descricao && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{receita.descricao.replace(/\n/g, " · ")}</p>}
                      </div>
                      <Button type="button" size="sm" variant={associada ? "outline" : "default"} disabled={associada || associarReceita.isPending} onClick={() => associarReceita.mutate({ produtoId: produtoSelecionado.id, receitaId: receita.id })}>{associada ? "Atual" : "Associar"}</Button>
                    </div>;
                  })}
                </div>
              </>}
            </section>
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
