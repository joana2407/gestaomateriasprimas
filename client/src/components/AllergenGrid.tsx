import { cn } from "@/lib/utils";
import { ALERGENIOS_14, type AlergenioId, type ResultadoAlergenio } from "../../../shared/allergens";

interface AllergenGridProps {
  formulacao?: AlergenioId[];
  contaminacao?: AlergenioId[];
  onChange?: (formulacao: AlergenioId[], contaminacao: AlergenioId[]) => void;
  readonly?: boolean;
  compact?: boolean;
}

export function AllergenGrid({
  formulacao = [],
  contaminacao = [],
  onChange,
  readonly = false,
  compact = false,
}: AllergenGridProps) {
  const toggleFormulacao = (id: AlergenioId) => {
    if (readonly || !onChange) return;
    const newF = formulacao.includes(id) ? formulacao.filter(a => a !== id) : [...formulacao, id];
    const newC = contaminacao.filter(a => a !== id);
    onChange(newF, newC);
  };

  const toggleContaminacao = (id: AlergenioId) => {
    if (readonly || !onChange) return;
    if (formulacao.includes(id)) return; // Formulação tem prioridade
    const newC = contaminacao.includes(id) ? contaminacao.filter(a => a !== id) : [...contaminacao, id];
    onChange(formulacao, newC);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {ALERGENIOS_14.map(({ id, abrev, label }) => {
          const isF = formulacao.includes(id as AlergenioId);
          const isC = contaminacao.includes(id as AlergenioId);
          if (!isF && !isC) return null;
          return (
            <span
              key={id}
              title={label}
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                isF ? "alerg-formulacao" : "alerg-contaminacao"
              )}
            >
              {abrev}
              <span className="ml-1 text-[10px] opacity-70">{isF ? "F" : "C"}</span>
            </span>
          );
        })}
        {formulacao.length === 0 && contaminacao.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Nenhum alergénio</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Legenda */}
      {!readonly && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
            <span>Via Formulação (©)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300 inline-block" />
            <span>Via Contaminação Cruzada (c)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
            <span>Ausente</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {ALERGENIOS_14.map(({ id, label, abrev }) => {
          const isF = formulacao.includes(id as AlergenioId);
          const isC = contaminacao.includes(id as AlergenioId);
          const state = isF ? "formulacao" : isC ? "contaminacao" : "ausente";

          return (
            <div key={id} className="space-y-1">
              <div
                className={cn(
                  "rounded-lg border p-2.5 text-center transition-all duration-150",
                  state === "formulacao" && "bg-red-50 border-red-200",
                  state === "contaminacao" && "bg-amber-50 border-amber-200",
                  state === "ausente" && "bg-slate-50 border-slate-200",
                  !readonly && "cursor-default"
                )}
              >
                <div className={cn(
                  "text-xs font-bold tracking-wide",
                  state === "formulacao" && "text-red-700",
                  state === "contaminacao" && "text-amber-700",
                  state === "ausente" && "text-slate-400"
                )}>
                  {abrev}
                </div>
                <div className={cn(
                  "text-[10px] mt-0.5 leading-tight",
                  state === "formulacao" && "text-red-600",
                  state === "contaminacao" && "text-amber-600",
                  state === "ausente" && "text-slate-400"
                )}>
                  {label.length > 14 ? label.substring(0, 13) + "…" : label}
                </div>
              </div>
              {!readonly && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFormulacao(id as AlergenioId)}
                    title="Via Formulação (©)"
                    className={cn(
                      "flex-1 h-6 rounded text-[10px] font-semibold border transition-all duration-150",
                      isF
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-slate-400 border-slate-200 hover:border-red-300 hover:text-red-500"
                    )}
                  >
                    ©
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleContaminacao(id as AlergenioId)}
                    title="Via Contaminação Cruzada (c)"
                    disabled={isF}
                    className={cn(
                      "flex-1 h-6 rounded text-[10px] font-semibold border transition-all duration-150",
                      isC
                        ? "bg-amber-400 text-white border-amber-400"
                        : "bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-500",
                      isF && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    c
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

