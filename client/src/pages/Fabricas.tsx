import { SigaLayout } from "@/components/SigaLayout";
import { FactoryBadge } from "@/components/FactoryBadge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AlertTriangle, Factory, Settings } from "lucide-react";

export default function Fabricas() {
  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();

  return (
    <SigaLayout title="Unidades Fabris" subtitle="Configuração e estado das três unidades de produção">
      <div className="space-y-5">
        {(fabricas?.length ?? 0) === 0 && (
          <div className="card-elegant p-12 text-center">
            <Factory className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma fábrica configurada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Vá a Importação → Passo 1 para criar as fábricas</p>
          </div>
        )}
        {fabricas?.map(fab => {
          const regras = fab.regras as any;
          const equipamentos = regras?.equipamentos ? Object.entries(regras.equipamentos) : [];
          const bloqueio = regras?.bloqueioTotal ?? [];
          const regrasHig = regras?.regrasHigienizacao ?? [];
          return (
            <div key={fab.id} className="card-elegant p-6">
              <div className="flex items-start gap-5">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  fab.codigo === "FAB1" ? "bg-blue-50" : fab.codigo === "FAB2" ? "bg-violet-50" : "bg-emerald-50"
                )}>
                  <Factory className={cn(
                    "w-6 h-6",
                    fab.codigo === "FAB1" ? "text-blue-600" : fab.codigo === "FAB2" ? "text-violet-600" : "text-emerald-600"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h2 className="text-base font-bold text-foreground">{fab.nome}</h2>
                    <FactoryBadge nome={fab.nome} codigo={fab.codigo} />
                    {fab.ativa && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">Ativa</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{fab.descricao}</p>

                  {/* Equipamentos */}
                  {equipamentos.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Equipamentos e Alergénios de Linha</p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {equipamentos.map(([eq, alergs]: [string, any]) => (
                          <div key={eq} className="p-3 rounded-lg bg-muted/40 border border-border/40">
                            <p className="text-xs font-semibold font-mono text-foreground mb-2">{eq}</p>
                            <div className="flex flex-wrap gap-1">
                              {(alergs as string[]).map(a => (
                                <span key={a} className="text-[10px] px-1.5 py-0.5 rounded alerg-contaminacao font-medium">{a}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bloqueios */}
                  {bloqueio.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-bold">BLOQUEIO TOTAL: {bloqueio.join(", ")}</p>
                      </div>
                      <p className="text-xs text-red-600 mt-1">Nenhuma matéria-prima com estes alergénios via formulação pode ser utilizada nesta fábrica.</p>
                    </div>
                  )}

                  {/* Regras de higienização */}
                  {regrasHig.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Regras de Higienização</p>
                      <div className="space-y-1.5">
                        {regrasHig.map((regra: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                            <Settings className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{regra}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SigaLayout>
  );
}

