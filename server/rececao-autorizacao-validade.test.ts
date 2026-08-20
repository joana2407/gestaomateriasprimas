import { describe, expect, it } from "vitest";
import { podeRegistarRececaoAbaixoValidadeMinima } from "../shared/rececao-autorizacao-validade";

describe("autorização para exceções de validade mínima", () => {
  it("permite a receção quando a validade cumpre a regra", () => {
    expect(podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: false, role: "logistica" })).toBe(true);
  });

  it("bloqueia Logística quando a validade fica abaixo do mínimo", () => {
    expect(podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: true, role: "logistica" })).toBe(false);
  });

  it("permite a exceção a qualquer membro de Qualidade", () => {
    expect(podeRegistarRececaoAbaixoValidadeMinima({ alertaValidade: true, role: "qualidade" })).toBe(true);
  });
});
