import { describe, expect, it } from "vitest";
import { podeEditarRececao } from "../shared/rececao-permissoes";

describe("permissões de edição de receções", () => {
  it("permite à Qualidade editar qualquer receção", () => {
    expect(podeEditarRececao({ role: "qualidade", userId: 4, registadoPor: 7 })).toBe(true);
  });

  it("permite apenas ao operador que registou a receção editar no perfil Logística", () => {
    expect(podeEditarRececao({ role: "logistica", userId: 7, registadoPor: 7 })).toBe(true);
    expect(podeEditarRececao({ role: "logistica", userId: 8, registadoPor: 7 })).toBe(false);
  });
});
