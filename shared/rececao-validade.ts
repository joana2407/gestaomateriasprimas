export function formatarValidadeRececao(validade: Date | string | null | undefined): string {
  if (!validade) return "Não indicada";
  const data = validade instanceof Date ? validade : new Date(validade);
  return Number.isNaN(data.getTime()) ? "Não indicada" : data.toLocaleDateString("pt-PT");
}
