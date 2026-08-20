import { describe, expect, it } from "vitest";
import { contarNotificacoesPendentes } from "../shared/notificacoes-pendentes";

describe("contador de notificações pendentes", () => {
  it("conta apenas notificações ainda não lidas", () => {
    expect(contarNotificacoesPendentes([{ lida: false }, { lida: true }, { lida: false }])).toBe(2);
  });
});
