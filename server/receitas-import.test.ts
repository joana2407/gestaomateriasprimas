import { describe, expect, it } from "vitest";
import {
  buildFormulacaoRecipeDescription,
  FORMULACAO_ALIASES,
  normalizeImportName,
} from "../shared/receitas-import";

describe("importação da formulação da Fábrica III", () => {
  it("normaliza acentos, sufixo SG e variações de escrita sem perder a identidade da MP", () => {
    expect(normalizeImportName("Amêndoa Inteira com pele")).toBe(normalizeImportName("Amêndoa Inteira"));
    expect(normalizeImportName("Mix  Muffin Limão")).toBe(normalizeImportName("Mix Muffin Limão"));
    expect(normalizeImportName("Ovo Liquido pasteurizado")).toBe(normalizeImportName("Ovo pasteurizado"));
  });

  it("mantém aliases explícitos para nomes diferentes entre Excel e base de dados", () => {
    expect(FORMULACAO_ALIASES[normalizeImportName("Mix Baguette")]).toBe("Mix Baguette SG");
    expect(FORMULACAO_ALIASES[normalizeImportName("Molho Pizza")]).toBe("Molho Tomate (Pizza)");
    expect(FORMULACAO_ALIASES[normalizeImportName("Farinha de milho")]).toBe("Farinho de milho");
  });

  it("regista Gama, Versão e linha de origem nas observações da receita", () => {
    expect(buildFormulacaoRecipeDescription({ gama: "PANIDOR", versao: "V02, 4/01/2023", sourceRow: 74 })).toBe(
      "Gama: PANIDOR\nVersão da receita: V02, 4/01/2023\nOrigem: aba formulação — linha 74",
    );
  });

  it("usa marcadores explícitos quando a fonte não tem Gama ou Versão", () => {
    expect(buildFormulacaoRecipeDescription({ gama: "", versao: "", sourceRow: 12 })).toContain("Gama: Não indicada na fonte");
    expect(buildFormulacaoRecipeDescription({ gama: "", versao: "", sourceRow: 12 })).toContain("Versão da receita: Não indicada na fonte");
  });
});
