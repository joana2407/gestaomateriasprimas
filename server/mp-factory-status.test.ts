import { describe, expect, it } from "vitest";
import { ESTADOS_MP_FABRICA, getEstadoMpFabrica } from "../shared/mp-factory-status";

describe("estado operacional de MP por fábrica", () => {
  it("define exatamente os três estados operacionais permitidos por unidade", () => {
    expect(ESTADOS_MP_FABRICA.map(estado => estado.id)).toEqual(["ativa", "para_testes", "inativa"]);
  });

  it("mantém o estado padrão como Ativa quando a relação ainda não tem estado definido", () => {
    expect(getEstadoMpFabrica(undefined).id).toBe("ativa");
  });

  it("devolve a apresentação correta para uma MP inativa numa fábrica específica", () => {
    expect(getEstadoMpFabrica("inativa").label).toBe("Inativa");
  });
});
