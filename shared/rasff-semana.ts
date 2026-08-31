export type SemanaRasff = {
  ano: number;
  numero: number;
  codigo: string;
  nomeFicheiro: string;
  inicio: Date;
  fim: Date;
};

/**
 * Calcula a semana civil com início ao domingo e fim ao sábado.
 * As datas são tratadas em UTC porque o callback recebe ISO UTC.
 */
export function obterSemanaRasff(dateInput: Date | string): SemanaRasff {
  const date = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput.getTime());
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida para calcular a semana RASFF.");

  // Quando recebe uma ISO com offset de Portugal, preserva a data civil do texto.
  // Assim, domingo 00:00+01:00 não recua para sábado em UTC.
  const civilDate = typeof dateInput === "string" ? dateInput.slice(0, 10) : null;
  const inicio = civilDate && /^\d{4}-\d{2}-\d{2}$/.test(civilDate)
    ? new Date(`${civilDate}T00:00:00.000Z`)
    : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const domingoOffset = inicio.getUTCDay();
  inicio.setUTCDate(inicio.getUTCDate() - domingoOffset);
  const fim = new Date(inicio.getTime());
  fim.setUTCDate(fim.getUTCDate() + 6);
  fim.setUTCHours(23, 59, 59, 999);

  const ano = inicio.getUTCFullYear();
  const primeiroJaneiro = new Date(Date.UTC(ano, 0, 1));
  const diasDesdeInicioAno = Math.floor((inicio.getTime() - primeiroJaneiro.getTime()) / 86_400_000);
  const numero = Math.floor((diasDesdeInicioAno + primeiroJaneiro.getUTCDay()) / 7) + 1;
  const codigo = `${ano}-S${String(numero).padStart(2, "0")}`;

  return {
    ano,
    numero,
    codigo,
    nomeFicheiro: `relatorio-rasff-${codigo}.md`,
    inicio,
    fim,
  };
}

export function formatarPeriodoSemanaRasff(semana: SemanaRasff): string {
  return `${semana.inicio.toISOString()} → ${semana.fim.toISOString()}`;
}
