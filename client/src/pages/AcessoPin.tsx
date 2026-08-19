import { Button } from "@/components/ui/button";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Check, KeyRound, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function AcessoPin() {
  const [pin, setPin] = useState("");
  const [operadorId, setOperadorId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data: operadores, isLoading: operadoresEmCarga } = trpc.acessoPin.operadores.useQuery();
  const entrar = trpc.acessoPin.entrar.useMutation({
    onSuccess: async ({ user }) => {
      await utils.auth.me.invalidate();
      window.location.assign(user.role === "logistica" ? "/rececoes" : "/");
    },
    onError: error => {
      setPin("");
      inputRef.current?.focus();
      toast.error(error.message || "Não foi possível validar o PIN.");
    },
  });

  useEffect(() => { if (operadorId) inputRef.current?.focus(); }, [operadorId]);

  function submeter(event: React.FormEvent) {
    event.preventDefault();
    if (!operadorId) {
      toast.error("Selecione o utilizador antes de introduzir o PIN.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error("Introduza um PIN de quatro dígitos.");
      return;
    }
    entrar.mutate({ operadorId, pin });
  }

  return <main className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50/60 grid place-items-center p-4 sm:p-5">
    <div className="w-full max-w-xl"><PwaInstallPrompt /><section className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl shadow-emerald-950/5">
      <div className="bg-primary px-7 py-8 text-primary-foreground"><div className="w-11 h-11 rounded-xl bg-white/15 grid place-items-center mb-5"><ShieldCheck className="w-6 h-6" /></div><p className="text-xl font-semibold tracking-tight">Gestão Matérias Primas A&amp;S</p><p className="mt-1.5 text-sm text-primary-foreground/75">Sistema de gestão de alergénios</p></div>
      <form onSubmit={submeter} className="p-7 space-y-6"><div><div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="w-4 h-4 text-primary" />Acesso por PIN</div><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Selecione o seu utilizador e introduza o respetivo PIN individual para aceder ao módulo autorizado.</p></div>
        <div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">1. Selecione o utilizador</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{operadoresEmCarga ? <div className="col-span-full h-24 rounded-lg border border-dashed grid place-items-center text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /></div> : operadores?.map(operador => { const selecionado = operadorId === operador.operadorId; const nome = operador.name ?? "Operador"; return <button key={operador.operadorId} type="button" onClick={() => { setOperadorId(operador.operadorId); setPin(""); }} className={cn("relative text-left rounded-xl border p-3 transition-all", selecionado ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50 hover:bg-accent/40")}><div className="flex items-center gap-2.5"><div className={cn("w-8 h-8 rounded-lg grid place-items-center text-xs font-semibold", selecionado ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{nome[0]?.toUpperCase() ?? <UserRound className="w-4 h-4" />}</div><div className="min-w-0"><p className="text-sm font-medium truncate">{nome}</p><p className="text-[10px] text-muted-foreground">{operador.role === "logistica" ? "Logística" : "Qualidade"}</p></div></div>{selecionado && <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground grid place-items-center"><Check className="w-2.5 h-2.5" /></span>}</button>; })}</div></div>
        <div className="space-y-2"><label htmlFor="pin" className="text-xs font-medium text-muted-foreground">2. PIN de acesso</label><Input ref={inputRef} id="pin" type="password" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={4} value={pin} disabled={!operadorId} onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className="h-14 text-center text-2xl tracking-[0.7em] font-semibold" aria-label="PIN de quatro dígitos" /></div><Button type="submit" className="w-full h-11" disabled={!operadorId || entrar.isPending}>{entrar.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />A validar...</> : "Entrar"}</Button><p className="text-center text-[11px] text-muted-foreground">O acesso é registado para efeitos de rastreabilidade.</p></form>
    </section></div>
  </main>;
}
