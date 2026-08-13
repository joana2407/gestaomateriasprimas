export function normalizeImportName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bsg\b/g, "")
    .replace(/\bcom pele\b/g, "")
    .replace(/\bcredin\b/g, "")
    .replace(/\bpasteurizado(s|a)?\b/g, "")
    .replace(/\bliquido\b/g, "")
    .replace(/\bpo\b/g, "")
    .replace(/\bsem lactose\b/g, "")
    .replace(/\bde\b/g, "")
    .replace(/\bem\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export const FORMULACAO_ALIASES: Record<string, string> = {
  [normalizeImportName("Amêndoa Inteira com pele")]: "Amêndoa Inteira",
  [normalizeImportName("Avelãs")]: "Avelâ",
  [normalizeImportName("Abóbora Branca, Verde e Vermelha")]: "Abóbora Branca/Vermelha/Verde",
  [normalizeImportName("Ovo Liquido pasteurizado")]: "Ovo pasteurizado",
  [normalizeImportName("Gema liquida pasteurizada")]: "Gema Pasteurizada",
  [normalizeImportName("Farinha de Arroz")]: "Farinha de Arroz SG",
  [normalizeImportName("Farinha de milho")]: "Farinho de milho",
  [normalizeImportName("Mix Baguette")]: "Mix Baguette SG",
  [normalizeImportName("Mix Kernel")]: "Mix Kernel SG",
  [normalizeImportName("Mix Muffin")]: "Mix Muffin SG",
  [normalizeImportName("Mix Brownie")]: "Mix Brownie SG",
  [normalizeImportName("Mix pão forma branco")]: "Mix Pão Forma Branco SG",
  [normalizeImportName("Mix 5 sementes")]: "Mix 5 sementes SG",
  [normalizeImportName("Mix Decor")]: "Mix Decor SG",
  [normalizeImportName("Mix Baguete artesanal")]: "Mix Baguete artesanal SG",
  [normalizeImportName("Mix Muffin Limão")]: "Mix Muffin Limão SG",
  [normalizeImportName("Mix Muffin Chocolate")]: "Mix Muffin Chocolate SG",
  [normalizeImportName("Mix Brioche Vegan")]: "Mix Brioche Vegan SG",
  [normalizeImportName("Mix Muffin Ireks")]: "Mix Muffin Ireks SG",
  [normalizeImportName("Sementes Sésamo")]: "Sementes de Sésamo SG",
  [normalizeImportName("Recheio de Frutos vermelhos")]: "Recheio Frutos Vermelhos",
  [normalizeImportName("Margarina Pastel Nata")]: "Margarina Pastel de Nata",
  [normalizeImportName("Sementes de Linhaça Castanha")]: "Sementes de Linhaça",
  [normalizeImportName("Mix Grand Oro Levado")]: "Mix Oro Gran Levado",
  [normalizeImportName("Mix Burguer Credin")]: "Mix burguer",
  [normalizeImportName("Mix Sponge")]: "Mix sponge",
  [normalizeImportName("Mix Soft Cake")]: "Mix SoftCake",
  [normalizeImportName("Molho Pizza")]: "Molho Tomate (Pizza)",
  [normalizeImportName("Fermento em Pó")]: "Fermento em Pó",
};

export function buildFormulacaoRecipeDescription(input: { gama: string; versao: string; sourceRow: number }) {
  const gama = input.gama.trim() || "Não indicada na fonte";
  const versao = input.versao.trim() || "Não indicada na fonte";
  return `Gama: ${gama}\nVersão da receita: ${versao}\nOrigem: aba formulação — linha ${input.sourceRow}`;
}
