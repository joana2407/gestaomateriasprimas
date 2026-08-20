import { describe, expect, it } from "vitest";
import { podeRegistarRececaoAbaixoValidadeMinima } from "../shared/rececao-autorizacao-validade";

describe("autorização histórica para exceções de validade mínima", () => {
  it("mantém a semântica do perfil Qualidade para regras administrativas existentes", () => {
    expect(podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: true, role: "logistica" })).toBe(false);
    expect(podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: true, role: "qualidade" })).toBe(true);
  });
});
