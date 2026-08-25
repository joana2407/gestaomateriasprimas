import { SigaLayout } from "@/components/SigaLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Check, Loader2, ShieldCheck, ShieldOff, UsersRound } from "lucide-react";
import { toast } from "sonner";

type Perfil = "logistica" | "qualidade" | "gestao";

const PERMISSOES: Record<Perfil, string[]> = {
  logistica: ["Receções", "Consulta de lotes e transferências", "Registo e transferência de lote"],
  qualidade: ["Todos os módulos SIGA", "Criação e edição de dados", "Eliminação de receções", "Dashboard, histórico e notificações"],
  gestao: ["Todos os módulos SIGA", "Consulta de MP, fornecedores e documentos", "Consulta de receções e transferências", "Consulta de histórico e notificações"],
};

export default function Permissoes() {
  const { user } = useAuth();
  const podeGerirAcessos = Boolean(user?.podeGerirAcessos);
  const utils = trpc.useUtils();
  const { data: operadores, isLoading } = trpc.operadores.list.useQuery();
  const atualizar = trpc.operadores.atualizar.useMutation({
    onSuccess: () => { toast.success("Permissões atualizadas."); utils.operadores.list.invalidate(); },
    onError: error => toast.error(error.message),
  });

  return <SigaLayout title="Permissões" subtitle="Configure o acesso operacional de cada utilizador">
    <div className="space-y-5">
      <section className="card-elegant p-5 flex gap-3"><div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary grid place-items-center"><ShieldCheck className="w-5 h-5" /></div><div><h2 className="text-sm font-semibold">Gestão individual de acessos</h2><p className="mt-1 text-xs text-muted-foreground">Logística trabalha em Receções; Qualidade gere os módulos e operações; Gestão consulta toda a informação sem alterar registos. A administração pode ser delegada a outro utilizador de Qualidade.</p></div></section>

      {isLoading ? <div className="card-elegant p-10 text-center text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />A carregar permissões...</div> : <div className="space-y-3">{operadores?.map(operador => {
        const perfil = operador.role as Perfil;
        const isSelf = operador.userId === user?.id;
        return <section key={operador.operadorId} className="card-elegant overflow-hidden"><div className="p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 gap-3"><div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary grid place-items-center font-semibold">{operador.name?.[0]?.toUpperCase() ?? "U"}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold truncate">{operador.name ?? "Sem nome"}</h2><Badge variant="outline" className={operador.ativo ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-muted bg-muted text-muted-foreground"}>{operador.ativo ? "Ativo" : "Desativado"}</Badge>{operador.podeGerirAcessos && <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Administração de acessos</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">Último acesso: {operador.ultimoAcessoEm ? new Date(operador.ultimoAcessoEm).toLocaleString("pt-PT") : "Ainda não registado"}</p></div></div><div className="w-full lg:w-48">{podeGerirAcessos ? <><label className="mb-1.5 block text-xs font-medium">Perfil operacional</label><Select disabled={atualizar.isPending || isSelf} value={perfil} onValueChange={role => atualizar.mutate({ operadorId: operador.operadorId, role: role as Perfil })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="logistica">Logística</SelectItem><SelectItem value="qualidade">Qualidade</SelectItem><SelectItem value="gestao">Gestão</SelectItem></SelectContent></Select></> : <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-800">Consulta sem alterações</span>}</div></div><div className="border-t border-border/60 bg-muted/15 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-2">{PERMISSOES[perfil].map(permissao => <span key={permissao} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] text-foreground"><Check className="w-3 h-3 text-emerald-600" />{permissao}</span>)}</div>{podeGerirAcessos && perfil === "qualidade" && <Button size="sm" variant={operador.podeGerirAcessos ? "default" : "outline"} disabled={isSelf || atualizar.isPending} className="gap-1.5" onClick={() => atualizar.mutate({ operadorId: operador.operadorId, podeGerirAcessos: !operador.podeGerirAcessos })}>{operador.podeGerirAcessos ? <ShieldOff className="w-3.5 h-3.5" /> : <UsersRound className="w-3.5 h-3.5" />}{operador.podeGerirAcessos ? "Retirar administração" : "Dar administração"}</Button>}</div></section>;
      })}</div>}
    </div>
  </SigaLayout>;
}
