import { describe, expect, it } from "vitest";
import { formatarUnidadeRececao, UNIDADES_RECECAO_IDS } from "../shared/rececao-unidades";

describe("unidades de receção", () => {
  it("limita as unidades operacionais a Kg, Lt e Ton", () => {
    expect(UNIDADES_RECECAO_IDS).toEqual(["kg", "lt", "ton"]);
  });

  it("apresenta as unidades na capitalização usada no painel", () => {
    expect(formatarUnidadeRececao("kg")).toBe("Kg");
    expect(formatarUnidadeRececao("lt")).toBe("Lt");
    expect(formatarUnidadeRececao("ton")).toBe("Ton");
  });
});
