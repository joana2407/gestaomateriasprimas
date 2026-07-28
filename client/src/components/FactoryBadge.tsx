import { cn } from "@/lib/utils";

interface FactoryBadgeProps {
  nome: string;
  codigo?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FactoryBadge({ nome, codigo, size = "md", className }: FactoryBadgeProps) {
  const badgeClass = codigo === "FAB1"
    ? "badge-fab1"
    : codigo === "FAB2"
    ? "badge-fab2"
    : "badge-fab3";

  const sizeClass = size === "sm"
    ? "text-xs px-2 py-0.5"
    : size === "lg"
    ? "text-sm px-3 py-1.5"
    : "text-xs px-2.5 py-1";

  const shortName = nome.replace("Fábrica ", "Fab. ").replace(": ", " — ");

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium border",
      badgeClass, sizeClass, className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {size === "sm" ? (codigo ?? shortName) : shortName}
    </span>
  );
}

