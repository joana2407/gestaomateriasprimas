export const ESTADOS_MP_FABRICA = [
  { id: "ativa", label: "Ativa", shortLabel: "Ativa", icon: "✓", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "para_testes", label: "Para testes", shortLabel: "Testes", icon: "◈", className: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "inativa", label: "Inativa", shortLabel: "Inativa", icon: "×", className: "bg-red-50 text-red-700 border-red-200" },
] as const;

export type EstadoMpFabrica = (typeof ESTADOS_MP_FABRICA)[number]["id"];

export function getEstadoMpFabrica(estado?: EstadoMpFabrica | null) {
  return ESTADOS_MP_FABRICA.find(item => item.id === estado) ?? ESTADOS_MP_FABRICA[0];
}
