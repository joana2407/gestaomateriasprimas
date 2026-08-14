import { SigaLayout } from "@/components/SigaLayout";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { BarChart3, CheckCircle2, Edit2, Plus, Trash2, XCircle } from "lucide-react";

const ACAO_CONFIG: Record<string, { icon: React.ElementType; class: string; label: string }> = {
  criado: { icon: Plus, class: "bg-emerald-50 text-emerald-600", label: "Criado" },
  atualizado: { icon: Edit2, class: "bg-blue-50 text-blue-600", label: "Atualizado" },
  eliminado: { icon: Trash2, class: "bg-red-50 text-red-600", label: "Eliminado" },
  aprovado: { icon: CheckCircle2, class: "bg-emerald-50 text-emerald-600", label: "Aprovado" },
  rejeitado: { icon: XCircle, class: "bg-red-50 text-red-600", label: "Rejeitado" },
};

const ENTIDADE_LABELS: Record<string, string> = {
  materia_prima: "Matéria-Prima",
  fornecedor: "Fornecedor",
  receita: "Receita",
  produto: "Produto",
  rececao_mp: "Receção de MP",
  transferencia_mp: "Transferência de MP entre fábricas",
  ficha_tecnica_fornecedor: "FT Fornecedor",
  ficha_tecnica_produto: "FT Produto",
};

export default function Historico() {
  const { data: logs, isLoading } = trpc.dashboard.auditLog.useQuery();

  return (
    <SigaLayout
      title="Histórico de Alterações"
      subtitle="Audit trail completo de todas as operações no sistema"
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
          </div>
        )}
        {(logs?.length ?? 0) === 0 && !isLoading && (
          <div className="card-elegant p-12 text-center">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma alteração registada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">As alterações aparecerão aqui à medida que o sistema for utilizado</p>
          </div>
        )}
        <div className="space-y-2">
          {logs?.map(log => {
            const config = ACAO_CONFIG[log.acao] ?? ACAO_CONFIG.atualizado;
            const Icon = config.icon;
            return (
              <div key={log.id} className="card-elegant flex items-start gap-4 p-4">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.class)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{config.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {ENTIDADE_LABELS[log.entidade] ?? log.entidade} #{log.entidadeId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{log.userName ?? "Sistema"}</span>
                    <span>·</span>
                    <span>{format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SigaLayout>
  );
}
