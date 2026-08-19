import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

describe("configuração do cookie de sessão", () => {
  it("usa um cookie seguro e same-site lax em domínios publicados, mesmo atrás de proxy", () => {
    const options = getSessionCookieOptions({
      hostname: "sigaalergia-stnijz7j.manus.space",
      protocol: "http",
      headers: {},
    } as any);

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(true);
  });

  it("mantém compatibilidade com o desenvolvimento local sem HTTPS", () => {
    const options = getSessionCookieOptions({
      hostname: "localhost",
      protocol: "http",
      headers: {},
    } as any);

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });
});
