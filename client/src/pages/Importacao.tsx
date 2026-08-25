import { SigaLayout } from "@/components/SigaLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Database, Download, Factory, Package, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Importacao() {
  const { isAuthenticated, user } = useAuth();
  const podeGerirDadosMestre = isAuthenticated && user?.role === "qualidade";
  const [importResult, setImportResult] = useState<any>(null);
  const [seedResult, setSeedResult] = useState<any>(null);

  const seedFabricas = trpc.fabricas.seed.useMutation({
    onSuccess: (data) => { toast.success(data.message); setSeedResult(data); },
    onError: (e) => toast.error(e.message),
  });
  const importar = trpc.importacao.importarDadosExcel.useMutation({
    onSuccess: (data) => { toast.success("Dados importados com sucesso!"); setImportResult(data); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <SigaLayout title="Importação de Dados">
        <div className="card-elegant p-12 text-center">
          <Settings className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Autenticação necessária</p>
          <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Inicie sessão para aceder às funcionalidades de importação</p>
          <Button onClick={() => startLogin()}>Iniciar Sessão</Button>
        </div>
      </SigaLayout>
    );
  }

  return (
    <SigaLayout
      title="Importação e Configuração"
      subtitle="Inicializar o sistema com os dados das matrizes Excel das 3 fábricas"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Passo 1: Criar Fábricas */}
        <div className="card-elegant p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Factory className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Passo 1: Criar Fábricas</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Cria as três unidades fabris com as suas regras de contaminação cruzada:
                Fábrica I (Tradicional Fatiado), Fábrica II (Tradicional Granel) e Fábrica III (Sem Glúten).
              </p>
              {seedResult && (
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {seedResult.message}
                </div>
              )}
              {podeGerirDadosMestre ? <Button
                onClick={() => seedFabricas.mutate()}
                disabled={seedFabricas.isPending}
                className="mt-3"
                size="sm"
              >
                {seedFabricas.isPending ? "A criar..." : "Criar Fábricas"}
              </Button> : <p className="mt-3 text-xs font-medium text-violet-800">Modo de consulta — criação reservada à Qualidade.</p>}
            </div>
          </div>
        </div>

        {/* Passo 2: Importar Dados Excel */}
        <div className="card-elegant p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Passo 2: Importar Dados das Matrizes Excel</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Importa automaticamente todos os dados das três matrizes Excel:
                matérias-primas, fornecedores, perfis alergénicos e produtos de cada fábrica.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                {[
                  { fab: "Fábrica I", mp: "36 MP", prod: "15 produtos" },
                  { fab: "Fábrica II", mp: "18 MP", prod: "5 produtos" },
                  { fab: "Fábrica III", mp: "21 MP", prod: "15 produtos" },
                ].map(({ fab, mp, prod }) => (
                  <div key={fab} className="p-2.5 rounded-lg bg-muted/50 border border-border/40">
                    <p className="font-medium text-foreground">{fab}</p>
                    <p className="text-muted-foreground">{mp}</p>
                    <p className="text-muted-foreground">{prod}</p>
                  </div>
                ))}
              </div>
              {importResult && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Importação concluída com sucesso!
                  </div>
                  <p>{importResult.fornecedores} fornecedores · {importResult.mpFab1 + importResult.mpFab2 + importResult.mpFab3} MP · {importResult.produtosFab1 + importResult.produtosFab2 + importResult.produtosFab3} produtos</p>
                </div>
              )}
              {podeGerirDadosMestre ? <Button
                onClick={() => importar.mutate()}
                disabled={importar.isPending}
                className="mt-3"
                size="sm"
                variant="outline"
              >
                {importar.isPending ? "A importar..." : "Importar Dados Excel"}
              </Button> : <p className="mt-3 text-xs font-medium text-violet-800">Modo de consulta — importação reservada à Qualidade.</p>}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border/40 text-xs text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground">Sobre a importação</p>
          <p>Os dados são extraídos diretamente das matrizes Excel das três fábricas (PL-P5.3, PL-P5.10 e PL-P5.4) e incluem todos os perfis alergénicos (via formulação © e via contaminação cruzada c).</p>
          <p>A importação é idempotente — pode ser executada múltiplas vezes sem duplicar dados.</p>
        </div>
      </div>
    </SigaLayout>
  );
}

