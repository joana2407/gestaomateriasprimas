import { describe, expect, it } from "vitest";
import { formatarUnidadeRececao, UNIDADES_RECECAO_IDS } from "../shared/rececao-unidades";

describe("unidades de receção", () => {
  it("inclui as unidades operacionais Kg, Lt, Ton, Cx e Unid", () => {
    expect(UNIDADES_RECECAO_IDS).toEqual(["kg", "lt", "ton", "cx", "unid"]);
  });

  it("apresenta as unidades na capitalização usada no painel", () => {
    expect(formatarUnidadeRececao("kg")).toBe("Kg");
    expect(formatarUnidadeRececao("lt")).toBe("Lt");
    expect(formatarUnidadeRececao("ton")).toBe("Ton");
    expect(formatarUnidadeRececao("cx")).toBe("Cx");
    expect(formatarUnidadeRececao("unid")).toBe("Unid");
  });
});
