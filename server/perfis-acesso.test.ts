import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { temAcessoQualidade } from "../shared/perfis-acesso";

function criarContexto(role: "logistica" | "qualidade"): TrpcContext {
  const now = new Date();
  return {
    user: { id: role === "qualidade" ? 1 : 2, openId: `teste-${role}`, name: "Teste", email: null, loginMethod: "teste", role, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("perfis Logística e Qualidade", () => {
  it("reconhece apenas Qualidade como perfil de acesso completo", () => {
    expect(temAcessoQualidade("qualidade")).toBe(true);
    expect(temAcessoQualidade("logistica")).toBe(false);
  });

  it("bloqueia o acesso da Logística aos dados de Qualidade", async () => {
    const caller = appRouter.createCaller(criarContexto("logistica"));
    await expect(caller.dashboard.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia a eliminação de receções pelo perfil de Logística", async () => {
    const caller = appRouter.createCaller(criarContexto("logistica"));
    await expect(caller.rececoes.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
