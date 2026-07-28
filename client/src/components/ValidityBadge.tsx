import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

interface ValidityBadgeProps {
  dataValidade: Date | string;
  showDate?: boolean;
  className?: string;
}

export function ValidityBadge({ dataValidade, showDate = true, className }: ValidityBadgeProps) {
  const validade = new Date(dataValidade);
  const hoje = new Date();
  const dias = differenceInDays(validade, hoje);

  let estado: "valida" | "a_expirar_60" | "a_expirar_30" | "expirada";
  if (dias < 0) estado = "expirada";
  else if (dias <= 30) estado = "a_expirar_30";
  else if (dias <= 60) estado = "a_expirar_60";
  else estado = "valida";

  const config = {
    expirada: { icon: XCircle, label: "Expirada", class: "bg-red-50 text-red-700 border-red-200" },
    a_expirar_30: { icon: AlertTriangle, label: `${dias}d`, class: "bg-orange-50 text-orange-700 border-orange-200" },
    a_expirar_60: { icon: Clock, label: `${dias}d`, class: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    valida: { icon: CheckCircle, label: "Válida", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  }[estado];

  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
      config.class, className
    )}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      {showDate && (
        <span className="opacity-70">
          · {format(validade, "dd/MM/yy", { locale: pt })}
        </span>
      )}
    </span>
  );
}

