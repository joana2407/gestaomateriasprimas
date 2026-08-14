import { describe, expect, it } from "vitest";
import { criarTokenSessaoPin, lerUtilizadorSessaoPin, PIN_SESSION_COOKIE } from "./_core/pinSession";

describe("sessão de acesso por PIN", () => {
  it("recupera o utilizador a partir de um cookie assinado", async () => {
    const token = await criarTokenSessaoPin(42);
    const userId = await lerUtilizadorSessaoPin({ headers: { cookie: `${PIN_SESSION_COOKIE}=${token}` } } as any);
    expect(userId).toBe(42);
  });

  it("rejeita um token PIN alterado", async () => {
    const userId = await lerUtilizadorSessaoPin({ headers: { cookie: `${PIN_SESSION_COOKIE}=token-invalido` } } as any);
    expect(userId).toBeNull();
  });
});
