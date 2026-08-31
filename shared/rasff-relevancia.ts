export type ContextoMpRasff = {
  nome?: string | null;
  codigo?: string | null;
  origem?: string | null;
  fornecedorNome?: string | null;
  paisOrigemFornecedor?: string | null;
};

export function normalizarTermoRasff(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-PT")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function correspondeAoContextoMp(alertText: string, contexto: ContextoMpRasff): boolean {
  const haystack = normalizarTermoRasff(alertText);
  const termos = [
    contexto.nome,
    contexto.codigo,
    contexto.origem,
    contexto.fornecedorNome,
    contexto.paisOrigemFornecedor,
  ].filter((value): value is string => Boolean(value && value.trim()));
  return termos.some(value => {
    const term = normalizarTermoRasff(value);
    return term.length >= 3 && haystack.includes(term);
  });
}

export function classificarLigacaoRasff(alertText: string, contexto: ContextoMpRasff): "direta" | "indireta" | "informativa" {
  if (correspondeAoContextoMp(alertText, contexto)) return "direta";
  const categoria = normalizarTermoRasff(contexto.nome);
  if (categoria && ["farinha", "trigo", "centeio", "amendoa", "avelã", "noz", "chocolate", "cacau", "sultana", "leite", "ovo"].some(term => categoria.includes(normalizarTermoRasff(term)))) return "indireta";
  return "informativa";
}
