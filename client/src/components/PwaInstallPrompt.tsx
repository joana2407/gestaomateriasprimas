import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

type DeferredInstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isRunningStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<DeferredInstallEvent | null>(null);
  const [installed, setInstalled] = useState(isRunningStandalone);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as DeferredInstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function instalar() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (installed) return null;

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/[0.04] px-3.5 py-3 text-xs text-foreground sm:hidden">
      {installEvent ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="font-semibold">Instalar SIGA</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">Aceda mais rapidamente pelo ícone no ecrã principal.</p></div>
          <button type="button" onClick={instalar} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Download className="h-3.5 w-3.5" />Instalar</button>
        </div>
      ) : isIos ? (
        <div className="flex items-start gap-2"><Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p><strong>Instalar SIGA:</strong> no Safari, toque em Partilhar e selecione <strong>Adicionar ao ecrã principal</strong>.</p></div>
      ) : (
        <div className="flex items-start gap-2"><Download className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p><strong>Instalar SIGA:</strong> no menu do browser, escolha <strong>Instalar aplicação</strong> ou <strong>Adicionar ao ecrã principal</strong>.</p></div>
      )}
    </div>
  );
}
