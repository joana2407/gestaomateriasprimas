import { SigaLayout } from "@/components/SigaLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { KeyRound, Loader2, Plus, Power, Settings2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Perfil = "logistica" | "qualidade" | "gestao";
const emptyNovo = { nome: "", role: "logistica" as Perfil, pin: "", confirmarPin: "" };

function etiquetaPerfil(perfil: Perfil) { return perfil === "qualidade" ? "Qualidade" : perfil === "gestao" ? "Gestão" : "Logística"; }

export default function Utilizadores() {
  const { user } = useAuth();
  const podeGerirAcessos = Boolean(user?.podeGerirAcessos);
  const utils = trpc.useUtils();
  const { data: operadores, isLoading } = trpc.operadores.list.useQuery();
  const [dialogNovo, setDialogNovo] = useState(false);
  const [novo, setNovo] = useState(emptyNovo);
  const [pinTarget, setPinTarget] = useState<any | null>(null);
  const [novoPin, setNovoPin] = useState("");
  const [confirmarPin, setConfirmarPin] = useState("");

  const criar = trpc.operadores.criar.useMutation({
    onSuccess: () => { toast.success("Operador criado e disponível no painel de entrada."); setDialogNovo(false); setNovo(emptyNovo); utils.operadores.list.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const atualizar = trpc.operadores.atualizar.useMutation({
    onSuccess: () => { toast.success("Configuração do operador atualizada."); setPinTarget(null); setNovoPin(""); setConfirmarPin(""); utils.operadores.list.invalidate(); },
    onError: error => toast.error(error.message),
  });

  function criarOperador(event: React.FormEvent) {
    event.preventDefault();
    if (!novo.nome.trim()) return toast.error("Indique o nome do utilizador.");
    if (!/^\d{4}$/.test(novo.pin)) return toast.error("Defina um PIN de quatro dígitos.");
    if (novo.pin !== novo.confirmarPin) return toast.error("A confirmação do PIN não corresponde.");
    criar.mutate({ nome: novo.nome.trim(), role: novo.role, pin: novo.pin });
  }

  function alterarPin(event: React.FormEvent) {
    event.preventDefault();
    if (!pinTarget) return;
    if (!/^\d{4}$/.test(novoPin)) return toast.error("O PIN deve ter quatro dígitos.");
    if (novoPin !== confirmarPin) return toast.error("A confirmação do PIN não corresponde.");
    atualizar.mutate({ operadorId: pinTarget.operadorId, pin: novoPin });
  }

  return <SigaLayout title="Configurações" subtitle="Gestão de utilizadores, perfis e acessos por PIN">
    <div className="space-y-5">
      <div className="card-elegant p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Settings2 className="w-5 h-5" /></div><div><p className="text-sm font-semibold">Utilizadores e controlo de acesso</p><p className="mt-1 text-xs text-muted-foreground">A Responsável de Qualidade pode criar operadores, alterar perfis, gerir estados de acesso, permissões e PINs.</p></div></div>{podeGerirAcessos ? <Button onClick={() => setDialogNovo(true)} className="gap-2"><UserPlus className="w-4 h-4" />Adicionar utilizador</Button> : <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800">Modo de consulta</span>}</div>

      <div className="grid gap-3 md:grid-cols-3"><div className="card-elegant p-4"><div className="flex items-center gap-2 text-primary"><Users className="w-4 h-4" /><p className="text-sm font-semibold">Logística</p></div><p className="mt-2 text-xs text-muted-foreground">Acesso exclusivo ao módulo de Receções para consulta e registo de controlos de entrada.</p></div><div className="card-elegant p-4"><div className="flex items-center gap-2 text-emerald-700"><ShieldCheck className="w-4 h-4" /><p className="text-sm font-semibold">Qualidade</p></div><p className="mt-2 text-xs text-muted-foreground">Acesso integral ao SIGA e às operações de qualidade.</p></div><div className="card-elegant border-violet-200 bg-violet-50/50 p-4"><div className="flex items-center gap-2 text-violet-700"><ShieldCheck className="w-4 h-4" /><p className="text-sm font-semibold">Gestão</p></div><p className="mt-2 text-xs text-violet-800">Acesso a todos os módulos em consulta. Não pode criar, editar, eliminar ou validar registos.</p></div></div>

      <div className="card-elegant overflow-hidden"><div className="px-5 py-4 border-b border-border/60"><p className="text-sm font-semibold">Operadores configurados</p><p className="mt-1 text-xs text-muted-foreground">Os PINs não são apresentados nem recuperáveis. Para os alterar, defina um novo código.</p></div>{isLoading ? <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />A carregar operadores...</div> : <div className="divide-y divide-border/60">{operadores?.map(operador => { const perfil = operador.role as Perfil; const isSelf = operador.userId === user?.id; return <div key={operador.operadorId} className="p-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex gap-3 min-w-0"><div className={`w-10 h-10 shrink-0 rounded-xl grid place-items-center text-sm font-semibold ${operador.ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{operador.name?.[0]?.toUpperCase() ?? "U"}</div><div className="min-w-0"><div className="flex gap-2 items-center flex-wrap"><p className="text-sm font-semibold truncate">{operador.name ?? "Sem nome"}</p><Badge variant="outline" className={operador.ativo ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-muted bg-muted text-muted-foreground"}>{operador.ativo ? "Ativo" : "Desativado"}</Badge>{operador.podeGerirAcessos && <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Gestão de acessos</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">Último acesso: {operador.ultimoAcessoEm ? new Date(operador.ultimoAcessoEm).toLocaleString("pt-PT") : "Ainda não registado"}</p></div></div><div className="flex flex-wrap items-center gap-2">{podeGerirAcessos ? <><Select disabled={atualizar.isPending || isSelf} value={perfil} onValueChange={role => atualizar.mutate({ operadorId: operador.operadorId, role: role as Perfil })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="logistica">Logística</SelectItem><SelectItem value="qualidade">Qualidade</SelectItem><SelectItem value="gestao">Gestão</SelectItem></SelectContent></Select>{perfil === "qualidade" && <Button size="sm" variant={operador.podeGerirAcessos ? "default" : "outline"} disabled={isSelf || atualizar.isPending} className="gap-1.5" onClick={() => atualizar.mutate({ operadorId: operador.operadorId, podeGerirAcessos: !operador.podeGerirAcessos })}><ShieldCheck className="w-3.5 h-3.5" />{operador.podeGerirAcessos ? "Administração ativa" : "Dar administração"}</Button>}<Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPinTarget(operador)}><KeyRound className="w-3.5 h-3.5" />Alterar PIN</Button><Button size="sm" variant={operador.ativo ? "outline" : "default"} disabled={isSelf || atualizar.isPending} className={operador.ativo ? "gap-1.5 text-red-700 hover:text-red-800" : "gap-1.5"} onClick={() => atualizar.mutate({ operadorId: operador.operadorId, ativo: !operador.ativo })}><Power className="w-3.5 h-3.5" />{operador.ativo ? "Desativar" : "Ativar"}</Button></> : <span className="text-xs text-violet-700">Consulta sem alterações</span>}</div></div>; })}</div>}</div>
    </div>

    <Dialog open={dialogNovo} onOpenChange={setDialogNovo}><DialogContent><DialogHeader><DialogTitle>Adicionar utilizador</DialogTitle><DialogDescription>O utilizador ficará disponível no painel de acesso após criar o respetivo PIN.</DialogDescription></DialogHeader><form onSubmit={criarOperador} className="space-y-4"><div className="space-y-1.5"><label className="text-xs font-medium">Nome</label><Input value={novo.nome} onChange={event => setNovo({ ...novo, nome: event.target.value })} placeholder="Nome do utilizador" /></div><div className="space-y-1.5"><label className="text-xs font-medium">Perfil</label><Select value={novo.role} onValueChange={role => setNovo({ ...novo, role: role as Perfil })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="logistica">Logística</SelectItem><SelectItem value="qualidade">Qualidade</SelectItem><SelectItem value="gestao">Gestão</SelectItem></SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><label className="text-xs font-medium">PIN</label><Input type="password" inputMode="numeric" maxLength={4} value={novo.pin} onChange={event => setNovo({ ...novo, pin: event.target.value.replace(/\D/g, "").slice(0, 4) })} /></div><div className="space-y-1.5"><label className="text-xs font-medium">Confirmar PIN</label><Input type="password" inputMode="numeric" maxLength={4} value={novo.confirmarPin} onChange={event => setNovo({ ...novo, confirmarPin: event.target.value.replace(/\D/g, "").slice(0, 4) })} /></div></div><Button type="submit" className="w-full" disabled={criar.isPending}>{criar.isPending ? "A criar..." : "Criar utilizador"}</Button></form></DialogContent></Dialog>
    <Dialog open={Boolean(pinTarget)} onOpenChange={open => !open && setPinTarget(null)}><DialogContent><DialogHeader><DialogTitle>Alterar PIN de {pinTarget?.name}</DialogTitle><DialogDescription>O PIN anterior deixa de ser válido assim que guardar o novo código.</DialogDescription></DialogHeader><form onSubmit={alterarPin} className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><label className="text-xs font-medium">Novo PIN</label><Input type="password" inputMode="numeric" maxLength={4} value={novoPin} onChange={event => setNovoPin(event.target.value.replace(/\D/g, "").slice(0, 4))} /></div><div className="space-y-1.5"><label className="text-xs font-medium">Confirmar PIN</label><Input type="password" inputMode="numeric" maxLength={4} value={confirmarPin} onChange={event => setConfirmarPin(event.target.value.replace(/\D/g, "").slice(0, 4))} /></div></div><Button type="submit" className="w-full" disabled={atualizar.isPending}>{atualizar.isPending ? "A guardar..." : "Guardar novo PIN"}</Button></form></DialogContent></Dialog>
  </SigaLayout>;
}
