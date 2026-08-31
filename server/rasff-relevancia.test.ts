import { describe, expect, it } from "vitest";
import { classificarLigacaoRasff, correspondeAoContextoMp, correspondeAOrigemRasff, normalizarTermoRasff } from "../shared/rasff-relevancia";

describe("relevância RASFF", () => {
  it("normaliza acentos e separadores para comparação estável", () => {
    expect(normalizarTermoRasff("Farinha de Trigo 65%")) .toBe("farinha de trigo 65");
  });

  it("deteta uma correspondência direta por MP e origem", () => {
    expect(correspondeAoContextoMp("Farinha de trigo com origem Portugal", {
      nome: "Farinha de Trigo 65",
      paisOrigemFornecedor: "Portugal",
    })).toBe(true);
  });

  it("regista uma origem importada como sinal de tendência mesmo sem fornecedor direto", () => {
    expect(correspondeAOrigemRasff("alerta sobre farinha proveniente de Espanha", { nome: "Farinha de Trigo 65", paisOrigemFornecedor: "Espanha" })).toBe(true);
    expect(classificarLigacaoRasff("alerta sobre farinha proveniente de Espanha", { nome: "Farinha de Trigo 65", paisOrigemFornecedor: "Espanha" })).toBe("indireta");
  });

  it("classifica uma MP do setor sem correspondência textual como indireta", () => {
    expect(classificarLigacaoRasff("notificação sobre cereais", { nome: "Farinha de Centeio 130" })).toBe("indireta");
  });

  it("mantém o nível informativo quando não existe ligação setorial", () => {
    expect(classificarLigacaoRasff("notificação sobre peixe", { nome: "Sal" })).toBe("informativa");
  });
});
