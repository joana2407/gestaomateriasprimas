export type MatrixAllergenArrays = {
  formulacao: string[];
  contaminacao: string[];
};

export function matrixSymbolsToAllergenArrays(symbols: Record<string, string>): MatrixAllergenArrays {
  const formulacao: string[] = [];
  const contaminacao: string[] = [];
  for (const [allergenId, symbol] of Object.entries(symbols)) {
    const normalized = symbol.trim().toLowerCase();
    if (symbol.trim().startsWith("©")) formulacao.push(allergenId);
    else if (normalized.startsWith("c")) contaminacao.push(allergenId);
  }
  return { formulacao, contaminacao };
}
