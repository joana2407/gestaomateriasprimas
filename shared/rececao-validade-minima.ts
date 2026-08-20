type DataPossivel = Date | string | null | undefined;

function paraData(data: DataPossivel): Date | null {
  if (!data) return null;
  const valor = data instanceof Date ? new Date(data) : new Date(data);
  return Number.isNaN(valor.getTime()) ? null : valor;
}

function adicionarMeses(data: Date, meses: number): Date {
  const resultado = new Date(data);
  const diaOriginal = resultado.getDate();
  resultado.setDate(1);
  resultado.setMonth(resultado.getMonth() + meses);
  const ultimoDia = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate();
  resultado.setDate(Math.min(diaOriginal, ultimoDia));
  return resultado;
}

export function avaliarValidadeMinimaRececao({
  dataRececao,
  validade,
  validadeEstipuladaMeses,
}: {
  dataRececao: DataPossivel;
  validade: DataPossivel;
  validadeEstipuladaMeses: number | null | undefined;
}) {
  const rececao = paraData(dataRececao);
  const validadeProduto = paraData(validade);
  const mesesEstipulados = Number(validadeEstipuladaMeses ?? 0);

  if (!rececao || !validadeProduto || !Number.isFinite(mesesEstipulados) || mesesEstipulados < 1) {
    return { aplicavel: false, alerta: false, mesesEstipulados: 0, mesesMinimos: 0, dataMinimaValidade: null as Date | null };
  }

  const mesesMinimos = Math.ceil((mesesEstipulados * 2) / 3);
  const dataMinimaValidade = adicionarMeses(rececao, mesesMinimos);
  return {
    aplicavel: true,
    alerta: validadeProduto.getTime() < dataMinimaValidade.getTime(),
    mesesEstipulados,
    mesesMinimos,
    dataMinimaValidade,
  };
}
