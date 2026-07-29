import { SigaLayout } from "@/components/SigaLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { useState } from "react";
import { Building2, Edit2, Mail, Phone, Plus, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface FornecedorForm {
  id?: number; nome: string; codigo: string; contacto: string; email: string;
}
const EMPTY: FornecedorForm = { nome: "", codigo: "", contacto: "", email: "" };

export default function Fornecedores() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FornecedorForm>(EMPTY);

  const { data: fornecedores, refetch } = trpc.fornecedores.list.useQuery();
  const upsert = trpc.fornecedores.upsert.useMutation({
    onSuccess: () => { toast.success(form.id ? "Fornecedor atualizado" : "Fornecedor criado"); setDialogOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteForn = trpc.fornecedores.delete.useMutation({
    onSuccess: () => { toast.success("Fornecedor removido"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (fornecedores ?? []).filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    (f.codigo ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SigaLayout
      title="Fornecedores"
      subtitle={`${filtered.length} fornecedores ativos`}
      actions={
        isAuthenticated ? (
          <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Novo Fornecedor
          </Button>
        ) : (
          <Button onClick={() => startLogin()} size="sm" variant="outline">Iniciar Sessão</Button>
        )
      }
    >
      <div className="space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar fornecedores..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(f => (
            <div key={f.id} className="card-elegant p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-violet-600" />
                </div>
                {isAuthenticated && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setForm({ id: f.id, nome: f.nome, codigo: f.codigo ?? "", contacto: f.contacto ?? "", email: f.email ?? "" });
                        setDialogOpen(true);
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Fornecedor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem a certeza que pretende eliminar <strong>{f.nome}</strong>?
                            O fornecedor ficará inativo mas os dados históricos serão preservados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteForn.mutate({ id: f.id })}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">{f.nome}</p>
              {f.codigo && <p className="text-xs text-muted-foreground font-mono mt-0.5">{f.codigo}</p>}
              <div className="mt-3 space-y-1.5">
                {f.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" /> {f.email}
                  </div>
                )}
                {f.contacto && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" /> {f.contacto}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full card-elegant p-12 text-center">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome *</label>
              <Input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Código</label>
                <Input
                  value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                  placeholder="Ex: FORN-001"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Contacto</label>
                <Input
                  value={form.contacto}
                  onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
                  placeholder="+351 ..."
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@fornecedor.pt"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={!form.nome || upsert.isPending}>
                {upsert.isPending ? "A guardar..." : form.id ? "Guardar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SigaLayout>
  );
}

