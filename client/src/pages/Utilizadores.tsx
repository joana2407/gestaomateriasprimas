import { SigaLayout } from "@/components/SigaLayout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PERFIL_ACESSO_LABEL, type PerfilAcesso } from "../../../shared/perfis-acesso";
import { ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

export default function Utilizadores() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: utilizadores, isLoading } = trpc.utilizadores.list.useQuery();
  const definirPerfil = trpc.utilizadores.definirPerfil.useMutation({
    onSuccess: () => {
      toast.success("Perfil de acesso atualizado.");
      utils.utilizadores.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  return <SigaLayout title="Utilizadores e acessos" subtitle="Gestão dos perfis Logística e Qualidade">
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="card-elegant p-4"><div className="flex items-center gap-2 text-primary"><Users className="w-4 h-4" /><p className="text-sm font-semibold">Logística</p></div><p className="mt-2 text-xs text-muted-foreground">Acesso exclusivo ao módulo de Receções, para consultar e registar controlos de entrada.</p></div>
        <div className="card-elegant p-4"><div className="flex items-center gap-2 text-emerald-700"><ShieldCheck className="w-4 h-4" /><p className="text-sm font-semibold">Qualidade</p></div><p className="mt-2 text-xs text-muted-foreground">Acesso integral ao SIGA, à gestão de perfis e à eliminação auditada de receções.</p></div>
      </div>
      <div className="card-elegant overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60"><p className="text-sm font-semibold">Utilizadores registados</p><p className="mt-1 text-xs text-muted-foreground">Os novos utilizadores começam com o perfil Logística até serem reclassificados pela Qualidade.</p></div>
        {isLoading ? <div className="p-8 text-sm text-muted-foreground">A carregar utilizadores...</div> : <div className="divide-y divide-border/60">{utilizadores?.map(item => {
          const perfil = item.role as PerfilAcesso;
          const isCurrentUser = item.id === user?.id;
          return <div key={item.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-medium truncate">{item.name ?? item.email ?? `Utilizador #${item.id}`}</p><p className="mt-1 text-xs text-muted-foreground truncate">{item.email ?? "Sem e-mail"} · Último acesso: {new Date(item.lastSignedIn).toLocaleDateString("pt-PT")}</p></div><div className="flex items-center gap-3"><Badge variant="outline" className={perfil === "qualidade" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}>{PERFIL_ACESSO_LABEL[perfil]}</Badge><Select disabled={isCurrentUser || definirPerfil.isPending} value={perfil} onValueChange={value => definirPerfil.mutate({ id: item.id, role: value as PerfilAcesso })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="logistica">Logística</SelectItem><SelectItem value="qualidade">Qualidade</SelectItem></SelectContent></Select></div></div>;
        })}</div>}
      </div>
    </div>
  </SigaLayout>;
}
