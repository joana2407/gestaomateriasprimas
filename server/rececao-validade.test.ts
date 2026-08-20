import { describe, expect, it } from "vitest";
import { formatarValidadeRececao } from "../shared/rececao-validade";

describe("validade no detalhe de receções", () => {
  it("formata uma validade registada para consulta operacional", () => {
    expect(formatarValidadeRececao(new Date(2026, 7, 19))).toBe("19/08/2026");
  });

  it("indica quando a validade não foi registada", () => {
    expect(formatarValidadeRececao(null)).toBe("Não indicada");
  });
});
