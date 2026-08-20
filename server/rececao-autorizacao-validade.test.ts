import { describe, expect, it } from "vitest";
import { podeRegistarRececaoAbaixoValidadeMinima } from "../shared/rececao-autorizacao-validade";

describe("autorização para exceções de validade mínima", () => {
  it("permite a receção quando a validade cumpre a regra", () => {
    expect(podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: false, podeGerirAcessos: false })).toBe(true);
  });

  it("bloqueia técnicos de Qualidade quando a validade fica abaixo do mínimo", () => {
    expect(podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: true, podeGerirAcessos: false })).toBe(false);
  });

  it("permite a exceção à Responsável da Qualidade", () => {
    expect(podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: true, podeGerirAcessos: true })).toBe(true);
  });
});
