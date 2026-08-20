export function podeRegistarRececaoAbaixoValidadeMinima({
  alertaValidade,
  role,
}: {
  alertaValidade: boolean;
  role?: string | null;
}) {
  return !alertaValidade || role === "qualidade";
}
