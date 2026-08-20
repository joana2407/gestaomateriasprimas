export function podeRegistarRececaoAbaixoValidadeMinima({
  alertaValidade,
  podeGerirAcessos,
}: {
  alertaValidade: boolean;
  podeGerirAcessos?: boolean | null;
}) {
  return !alertaValidade || Boolean(podeGerirAcessos);
}
