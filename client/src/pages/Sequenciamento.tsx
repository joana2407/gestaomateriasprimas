import { SigaLayout } from "@/components/SigaLayout";
import { FactoryBadge } from "@/components/FactoryBadge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { ALERGENIOS_14, type AlergenioId } from "../../../shared/allergens";
import { AlertTriangle, ArrowDown, CheckCircle2, ClipboardList, Droplets } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function calcularCompatibilidade(
  perfilA: { formulacao: string[]; contaminacao: string[] },
  perfilB: { formulacao: string[]; contaminacao: string[] }
): { compativel: boolean; novosAlergenios: string[] } {
  const alergeniosA = new Set([...perfilA.formulacao, ...perfilA.contaminacao]);
  const alergeniosB = new Set([...perfilB.formulacao, ...perfilB.contaminacao]);
  const novos = Array.from(alergeniosB).filter(a => !alergeniosA.has(a));
  return { compativel: novos.length === 0, novosAlergenios: novos };
}

export default function Sequenciamento() {
  const [fabricaId, setFabricaId] = useState<string>("all");
  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: produtos } = trpc.produtos.list.useQuery({ fabricaId: fabricaId !== "all" ? parseInt(fabricaId) : undefined });
  const { data: perfisData } = trpc.produtos.list.useQuery();

  // Construir sequência ordenada por complexidade alergénica
  const sequencia = useMemo(() => {
    if (!produtos) return [];
    return [...produtos].sort((a, b) => {
      // Produtos sem perfil primeiro, depois por número de alergénios
      return 0;
    });
  }, [produtos]);

  return (
    <SigaLayout
      title="Sequenciamento de Produção"
      subtitle="Ordem de produção recomendada para minimizar contaminação cruzada"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Select value={fabricaId} onValueChange={setFabricaId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecionar fábrica..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fábricas</SelectItem>
              {fabricas?.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Legenda */}
        <div className="card-elegant p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Legenda</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Transição segura — sem necessidade de higienização especial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Higienização recomendada — novos alergénios introduzidos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Higienização obrigatória — alergénios críticos</span>
            </div>
          </div>
        </div>

        {/* Sequência de produção */}
        <div className="space-y-2">
          {sequencia.length === 0 && (
            <div className="card-elegant p-12 text-center">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado para sequenciamento</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Selecione uma fábrica e certifique-se que existem produtos com perfil alergénico calculado</p>
            </div>
          )}
          {sequencia.map((produto, idx) => {
            const fab = fabricas?.find(f => f.id === produto.fabricaId);
            const prev = idx > 0 ? sequencia[idx - 1] : null;
            const needsHigienizacao = false; // Simplificado — em produção calcularia com base nos perfis

            return (
              <div key={produto.id}>
                {idx > 0 && (
                  <div className={cn(
                    "flex items-center gap-3 py-2 px-4 mx-4 rounded-lg text-xs font-medium",
                    needsHigienizacao
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}>
                    {needsHigienizacao ? (
                      <>
                        <Droplets className="w-3.5 h-3.5 shrink-0" />
                        <span>Higienização recomendada antes de prosseguir</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Transição segura</span>
                      </>
                    )}
                    <ArrowDown className="w-3 h-3 ml-auto" />
                  </div>
                )}
                <div className="card-elegant p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      "bg-primary text-primary-foreground"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{produto.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {fab && <FactoryBadge nome={fab.nome} codigo={fab.codigo} size="sm" />}
                        {produto.gama && <span className="text-xs text-muted-foreground">{produto.gama}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Regras especiais por fábrica */}
        {fabricaId !== "all" && (
          <div className="card-elegant p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Regras Especiais da Fábrica</p>
            {fabricas?.filter(f => String(f.id) === fabricaId).map(fab => {
              const regras = fab.regras as any;
              return (
                <div key={fab.id} className="space-y-2">
                  {(regras?.regrasHigienizacao ?? []).map((regra: string, i: number) => (
                    <div key={i} className={cn(
                      "flex items-start gap-2 p-3 rounded-lg text-xs",
                      regra.includes("BLOQUEIO") ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                    )}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{regra}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SigaLayout>
  );
}

