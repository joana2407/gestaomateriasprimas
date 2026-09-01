const MESES_PT: Record<string, string> = {
  janeiro: "01", fevereiro: "02", marco: "03", março: "03", abril: "04", maio: "05", junho: "06",
  julho: "07", agosto: "08", setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
};

export function extrairDataNotificacao(texto: string): string | undefined {
  const iso = texto.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const europeia = texto.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](20\d{2}|\d{2})\b/);
  if (europeia) return `${europeia[3].length === 2 ? `20${europeia[3]}` : europeia[3]}-${europeia[2].padStart(2, "0")}-${europeia[1].padStart(2, "0")}`;
  const porExtenso = texto.toLocaleLowerCase("pt-PT").match(/\b(\d{1,2})\s+de?\s+(janeiro|fevereiro|mar(?:ç|c)o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(20\d{2})\b/);
  if (porExtenso) return `${porExtenso[3]}-${MESES_PT[porExtenso[2]]}-${porExtenso[1].padStart(2, "0")}`;
  return undefined;
}
