const MESES_PT: Record<string, string> = {
  janeiro: "01", fevereiro: "02", marco: "03", março: "03", abril: "04", maio: "05", junho: "06",
  julho: "07", agosto: "08", setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
};

/** Reconhece datas comuns exportadas pelo RASFF Window/Excel e devolve YYYY-MM-DD. */
export function extrairDataAlertaRasff(linha: string): string | undefined {
  const normalizada = linha.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const iso = normalizada.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const pt = normalizada.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (pt) return `${pt[3]}-${pt[2].padStart(2, "0")}-${pt[1].padStart(2, "0")}`;
  const textual = normalizada.match(/\b(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(20\d{2})\b/i);
  if (!textual) return undefined;
  const mes = MESES_PT[textual[2].toLocaleLowerCase("pt-PT")];
  return mes ? `${textual[3]}-${mes}-${textual[1].padStart(2, "0")}` : undefined;
}

export function dataEstaNoIntervalo(data: string | undefined, inicio: string, fim: string): boolean {
  if (!inicio && !fim) return true;
  if (!data) return false;
  return (!inicio || data >= inicio) && (!fim || data <= fim);
}
