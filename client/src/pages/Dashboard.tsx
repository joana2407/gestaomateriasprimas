import { SigaLayout } from "@/components/SigaLayout";
import { ValidityBadge } from "@/components/ValidityBadge";
import { FactoryBadge } from "@/components/FactoryBadge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, ArrowRight, BarChart3, CheckCircle2,
  ClipboardList, Factory, FileText, Package, RefreshCw, Shield, Users
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

function StatCard({ icon: Icon, label, value, sub, color = "primary" }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/8 text-primary",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="card-elegant p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl", colorMap[color] ?? colorMap.primary)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function AlertRow({ ft, fabricas }: { ft: any; fabricas: any[] }) {
  const validade = new Date(ft.dataValidade);
  const hoje = new Date();
  const dias = Math.floor((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  const estado = dias < 0 ? "expirada" : dias <= 30 ? "a_expirar_30" : "a_expirar_60";
  const rowClass = estado === "expirada" ? "alerta-expirada" : estado === "a_expirar_30" ? "alerta-30" : "alerta-60";

  return (
    <div className={cn("flex items-center gap-4 px-4 py-3 rounded-lg", rowClass)}>
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">MP #{ft.materiaPrimaId} — FT v{ft.versao}</p>
        <p className="text-xs opacity-80">
          Validade: {format(validade, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
        </p>
      </div>
      <ValidityBadge dataValidade={ft.dataValidade} showDate={false} />
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading, refetch } = trpc.dashboard.stats.useQuery();
  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: alertas } = trpc.fichasTecnicas.alertas.useQuery();
  const { data: fornecedores } = trpc.fornecedores.list.useQuery();
  const { data: alertasDoc } = trpc.fornecedores.documentos.alertas.useQuery();
  const fornMap = new Map((fornecedores ?? []).map(f => [f.id, f]));
  const docsExpirados = (alertasDoc ?? []).filter((d: any) => d.estado === "expirado");
  const docs30 = (alertasDoc ?? []).filter((d: any) => d.estado === "a_expirar_30");
  const docs60 = (alertasDoc ?? []).filter((d: any) => d.estado === "a_expirar_60");

  const alertasExpiradas = alertas?.filter(a => {
    const dias = Math.floor((new Date(a.dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias < 0;
  }) ?? [];
  const alertas30 = alertas?.filter(a => {
    const dias = Math.floor((new Date(a.dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= 30;
  }) ?? [];
  const alertas60 = alertas?.filter(a => {
    const dias = Math.floor((new Date(a.dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias > 30 && dias <= 60;
  }) ?? [];

  return (
    <SigaLayout
      title="Dashboard"
      subtitle="Visão geral do sistema de gestão de alergénios"
      actions={
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      }
    >
      <div className="space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Matérias-Primas" value={stats?.totalMP ?? "—"} sub="ativas no sistema" color="blue" />
          <StatCard icon={ClipboardList} label="Receitas" value={stats?.totalReceitas ?? "—"} sub="formulações registadas" color="violet" />
          <StatCard icon={FileText} label="Produtos" value={stats?.totalProdutos ?? "—"} sub="produtos ativos" color="emerald" />
          <StatCard icon={Users} label="Fornecedores" value={stats?.totalFornecedores ?? "—"} sub="fornecedores ativos" color="amber" />
        </div>

        {/* Alertas de Fichas Técnicas */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Alertas de Documentos de Fornecedor */}
          {(alertasDoc ?? []).length > 0 && (
            <div className="lg:col-span-2 card-elegant p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Documentação de Fornecedores</h2>
                    <p className="text-xs text-muted-foreground">Certificações e declarações com validade a expirar</p>
                  </div>
                </div>
                <Link href="/fornecedores">
                  <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Ver fornecedores <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="text-2xl font-bold text-red-600">{docsExpirados.length}</div>
                  <div className="text-xs text-red-600 mt-0.5">Expirados</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600">{docs30.length}</div>
                  <div className="text-xs text-orange-600 mt-0.5">≤ 30 dias</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <div className="text-2xl font-bold text-yellow-600">{docs60.length}</div>
                  <div className="text-xs text-yellow-600 mt-0.5">≤ 60 dias</div>
                </div>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(alertasDoc ?? []).slice(0, 6).map((doc: any) => {
                  const forn = fornMap.get(doc.fornecedorId);
                  const dias = Math.floor((new Date(doc.dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const rowClass = doc.estado === "expirado" ? "alerta-expirada" : doc.estado === "a_expirar_30" ? "alerta-30" : "alerta-60";
                  return (
                    <div key={doc.id} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg", rowClass)}>
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{doc.nome}</p>
                        <p className="text-[10px] opacity-80">{forn?.nome ?? `Fornecedor #${doc.fornecedorId}`}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                        doc.estado === "expirado" ? "bg-red-100 text-red-700 border-red-200" :
                        doc.estado === "a_expirar_30" ? "bg-orange-100 text-orange-700 border-orange-200" :
                        "bg-yellow-100 text-yellow-700 border-yellow-200"
                      )}>
                        {doc.estado === "expirado" ? "Expirado" : `${dias}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card-elegant p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Alertas de Fichas Técnicas</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Fichas técnicas de fornecedores a expirar</p>
              </div>
              <Link href="/fichas-tecnicas">
                <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {/* Resumo semáforo */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="text-2xl font-bold text-red-600">{alertasExpiradas.length}</div>
                <div className="text-xs text-red-600 mt-0.5">Expiradas</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-100">
                <div className="text-2xl font-bold text-orange-600">{alertas30.length}</div>
                <div className="text-xs text-orange-600 mt-0.5">≤ 30 dias</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                <div className="text-2xl font-bold text-yellow-600">{alertas60.length}</div>
                <div className="text-xs text-yellow-600 mt-0.5">≤ 60 dias</div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(alertas?.length ?? 0) === 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 py-4 justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                  Todas as fichas técnicas estão válidas
                </div>
              )}
              {alertas?.slice(0, 8).map(ft => (
                <AlertRow key={ft.id} ft={ft} fabricas={fabricas ?? []} />
              ))}
            </div>
          </div>

          {/* Fábricas */}
          <div className="card-elegant p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Unidades Fabris</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Estado e configuração das fábricas</p>
              </div>
              <Link href="/fabricas">
                <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                  Gerir <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
            <div className="space-y-3">
              {isLoading && [1,2,3].map(i => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
              {fabricas?.map(fab => {
                const regras = fab.regras as any;
                const equipamentos = regras?.equipamentos ? Object.keys(regras.equipamentos) : [];
                const bloqueio = regras?.bloqueioTotal ?? [];
                return (
                  <div key={fab.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/60 hover:border-primary/30 transition-colors">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      fab.codigo === "FAB1" ? "bg-blue-50" : fab.codigo === "FAB2" ? "bg-violet-50" : "bg-emerald-50"
                    )}>
                      <Factory className={cn(
                        "w-5 h-5",
                        fab.codigo === "FAB1" ? "text-blue-600" : fab.codigo === "FAB2" ? "text-violet-600" : "text-emerald-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{fab.nome}</p>
                        {fab.ativa && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">
                            Ativa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{fab.descricao}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {equipamentos.map(eq => (
                          <span key={eq} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {eq}
                          </span>
                        ))}
                        {bloqueio.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-medium">
                            ⛔ Bloqueio: {bloqueio.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!isLoading && (fabricas?.length ?? 0) === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Factory className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma fábrica configurada</p>
                  <p className="text-xs mt-1">Vá a Importação para inicializar os dados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="card-elegant p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { href: "/materias-primas", icon: Package, label: "Nova MP", color: "blue" },
              { href: "/fichas-tecnicas", icon: FileText, label: "Upload FT", color: "violet" },
              { href: "/receitas", icon: ClipboardList, label: "Nova Receita", color: "emerald" },
              { href: "/produtos", icon: BarChart3, label: "Novo Produto", color: "amber" },
              { href: "/importacao", icon: RefreshCw, label: "Importar Dados", color: "primary" },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-accent/50 transition-all duration-150 cursor-pointer text-center"
                )}>
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SigaLayout>
  );
}
