import { describe, expect, it } from "vitest";
import {
  ePerfilGestao,
  PERFIL_ACESSO_LABEL,
  podeAlterarDados,
  podeConsultarTodosModulos,
} from "./perfis-acesso";
import { podeEditarRececao } from "./rececao-permissoes";

describe("perfil Gestão", () => {
  it("é reconhecido como perfil de consulta global", () => {
    expect(ePerfilGestao("gestao")).toBe(true);
    expect(podeConsultarTodosModulos("gestao")).toBe(true);
    expect(PERFIL_ACESSO_LABEL.gestao).toBe("Gestão");
  });

  it("não recebe permissões de alteração", () => {
    expect(podeAlterarDados("gestao")).toBe(false);
    expect(podeEditarRececao({ role: "gestao", userId: 1, registadoPor: 1 })).toBe(false);
  });

  it("mantém a separação entre consulta global e qualidade operacional", () => {
    expect(podeConsultarTodosModulos("qualidade")).toBe(true);
    expect(podeAlterarDados("qualidade")).toBe(true);
    expect(podeConsultarTodosModulos("logistica")).toBe(false);
  });
});
