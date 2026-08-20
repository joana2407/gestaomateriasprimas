import { describe, expect, it } from "vitest";
import { motivoValidacaoCondicional, rececaoAcessivelOperacionalmente, requerValidacaoCondicional } from "../shared/rececao-condicional";

describe("receções condicionais", () => {
  it("fica pendente quando a validade está abaixo do mínimo", () => {
    expect(requerValidacaoCondicional({ alertaValidade: true, conformidade: "conforme" })).toBe(true);
  });

  it("fica pendente para qualquer não conformidade de receção", () => {
    expect(requerValidacaoCondicional({ alertaValidade: false, conformidade: "nao_conforme" })).toBe(true);
    expect(motivoValidacaoCondicional({ alertaValidade: false, conformidade: "nao_conforme" })).toContain("não conformidade");
  });

  it("só fica acessível operacionalmente depois de validada", () => {
    expect(rececaoAcessivelOperacionalmente("pendente")).toBe(false);
    expect(rececaoAcessivelOperacionalmente("recusada")).toBe(false);
    expect(rececaoAcessivelOperacionalmente("validada")).toBe(true);
  });
});
