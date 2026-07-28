import { describe, expect, it } from "vitest";
import { calcularPerfilAlergenico, REGRAS_FABRICAS } from "../shared/allergens";

describe("Motor da Árvore de Decisão Q1-Q6", () => {
  it("Q1: alergénio via formulação é identificado corretamente", () => {
    const ingredientes = [
      { alergeniosFormulacao: ["gluten" as any], alergeniosContaminacao: [] },
    ];
    const { perfil } = calcularPerfilAlergenico(ingredientes, REGRAS_FABRICAS["FAB1"]);
    expect(perfil["gluten"]).toBe("formulacao");
  });

  it("Q2: alergénio via contaminação cruzada no fornecedor é identificado", () => {
    const ingredientes = [
      { alergeniosFormulacao: [], alergeniosContaminacao: ["ovos" as any] },
    ];
    const { perfil } = calcularPerfilAlergenico(ingredientes, REGRAS_FABRICAS["FAB1"]);
    // ovos via contaminação no fornecedor → resultado deve ser contaminacao
    expect(perfil["ovos"]).toBe("contaminacao");
  });

  it("Q1 tem prioridade sobre Q2: formulação sobrepõe-se à contaminação", () => {
    const ingredientes = [
      { alergeniosFormulacao: ["soja" as any], alergeniosContaminacao: ["soja" as any] },
    ];
    const { perfil } = calcularPerfilAlergenico(ingredientes, REGRAS_FABRICAS["FAB1"]);
    expect(perfil["soja"]).toBe("formulacao");
  });

  it("Alergénio ausente em ingredientes e linha → resultado ausente", () => {
    const ingredientes = [
      { alergeniosFormulacao: [], alergeniosContaminacao: [] },
    ];
    const { perfil } = calcularPerfilAlergenico(ingredientes, REGRAS_FABRICAS["FAB1"], "AMASSADEIRA");
    // gluten está na linha AMASSADEIRA → contaminacao
    expect(perfil["gluten"]).toBe("contaminacao");
    // crustaceos não está em nenhum lado → ausente
    expect(perfil["crustaceos"]).toBe("ausente");
  });

  it("Fábrica III: bloqueio de glúten não afeta o cálculo (é validado no router)", () => {
    const ingredientes = [
      { alergeniosFormulacao: [], alergeniosContaminacao: [] },
    ];
    const { perfil } = calcularPerfilAlergenico(ingredientes, REGRAS_FABRICAS["FAB3"]);
    // Fábrica III não tem glúten nos equipamentos
    expect(perfil["gluten"]).toBe("ausente");
  });

  it("Múltiplos ingredientes: perfil é a união de todos", () => {
    const ingredientes = [
      { alergeniosFormulacao: ["gluten" as any], alergeniosContaminacao: ["soja" as any] },
      { alergeniosFormulacao: ["ovos" as any], alergeniosContaminacao: [] },
    ];
    const { perfil } = calcularPerfilAlergenico(ingredientes, REGRAS_FABRICAS["FAB1"]);
    expect(perfil["gluten"]).toBe("formulacao");
    expect(perfil["ovos"]).toBe("formulacao");
    expect(perfil["soja"]).toBe("contaminacao");
  });

  it("Detalhe Q1-Q6 é retornado para cada alergénio", () => {
    const ingredientes = [
      { alergeniosFormulacao: ["leite" as any], alergeniosContaminacao: [] },
    ];
    const { detalheQ1Q6 } = calcularPerfilAlergenico(ingredientes, REGRAS_FABRICAS["FAB1"]);
    expect(detalheQ1Q6["leite"]).toBeDefined();
    expect(detalheQ1Q6["leite"].Q1).toBe(true);
  });
});

describe("Regras das Fábricas", () => {
  it("FAB1 tem equipamentos AMASSADEIRA e BATEDEIRA", () => {
    expect(REGRAS_FABRICAS["FAB1"].equipamentos).toHaveProperty("AMASSADEIRA");
    expect(REGRAS_FABRICAS["FAB1"].equipamentos).toHaveProperty("BATEDEIRA");
  });

  it("FAB3 tem bloqueio total de glúten", () => {
    expect(REGRAS_FABRICAS["FAB3"].bloqueioTotal).toContain("gluten");
  });

  it("FAB2 tem equipamento BATEDEIRA_TACHO", () => {
    expect(REGRAS_FABRICAS["FAB2"].equipamentos).toHaveProperty("BATEDEIRA_TACHO");
  });
});

