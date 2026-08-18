export function podeEditarRececao(params: {
  role?: "logistica" | "qualidade";
  userId?: number;
  registadoPor?: number | null;
}) {
  return params.role === "qualidade" || (params.userId !== undefined && params.registadoPor === params.userId);
}
