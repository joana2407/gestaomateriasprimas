import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function AcessoPin() {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
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

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submeter(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      toast.error("Introduza um PIN de quatro dígitos.");
      return;
    }
    entrar.mutate({ pin });
  }

  return <main className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50/60 grid place-items-center p-5">
    <section className="w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl shadow-emerald-950/5">
      <div className="bg-primary px-7 py-8 text-primary-foreground"><div className="w-11 h-11 rounded-xl bg-white/15 grid place-items-center mb-5"><ShieldCheck className="w-6 h-6" /></div><p className="text-xl font-semibold tracking-tight">Gestão Matérias Primas A&amp;S</p><p className="mt-1.5 text-sm text-primary-foreground/75">Sistema de gestão de alergénios</p></div>
      <form onSubmit={submeter} className="p-7 space-y-6"><div><div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="w-4 h-4 text-primary" />Acesso por PIN</div><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Introduza o seu PIN individual para aceder ao módulo autorizado para o seu perfil.</p></div><div className="space-y-2"><label htmlFor="pin" className="text-xs font-medium text-muted-foreground">PIN de acesso</label><Input ref={inputRef} id="pin" type="password" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={4} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className="h-14 text-center text-2xl tracking-[0.7em] font-semibold" aria-label="PIN de quatro dígitos" /></div><Button type="submit" className="w-full h-11" disabled={entrar.isPending}>{entrar.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />A validar...</> : "Entrar"}</Button><p className="text-center text-[11px] text-muted-foreground">O acesso é registado para efeitos de rastreabilidade.</p></form>
    </section>
  </main>;
}
