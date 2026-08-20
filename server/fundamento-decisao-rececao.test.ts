import { describe, expect, it } from "vitest";
import { fundamentoDecisaoValido } from "../shared/fundamento-decisao-rececao";

describe("fundamento da decisão de receção", () => {
  it("aceita um fundamento curto mas informado", () => {
    expect(fundamentoDecisaoValido("erro")).toBe(true);
  });

  it("rejeita um campo vazio ou apenas com espaços", () => {
    expect(fundamentoDecisaoValido("  ")).toBe(false);
  });
});
