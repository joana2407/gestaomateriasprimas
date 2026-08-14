import { describe, expect, it } from "vitest";
import { mpAprovadaParaRececao } from "../shared/rececao-fornecedor";

describe("elegibilidade de MP para receção", () => {
  const mp = { id: 42, fabricasIds: [1, 3], fornecedoresIds: [7, 9] };

  it("permite a MP apenas quando fornecedor e fábrica estão associados", () => {
    expect(mpAprovadaParaRececao(mp, 3, 7)).toBe(true);
  });

  it("bloqueia um fornecedor não aprovado, mesmo que a MP esteja disponível na fábrica", () => {
    expect(mpAprovadaParaRececao(mp, 3, 8)).toBe(false);
  });

  it("bloqueia uma fábrica sem associação, mesmo que o fornecedor esteja aprovado", () => {
    expect(mpAprovadaParaRececao(mp, 2, 7)).toBe(false);
  });
});
