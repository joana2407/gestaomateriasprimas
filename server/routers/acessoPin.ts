import { createHash } from "node:crypto";
import { z } from "zod";
import { getSessionCookieOptions } from "../_core/cookies";
import { criarTokenSessaoPin, PIN_SESSION_COOKIE, PIN_SESSION_MAX_AGE_MS } from "../_core/pinSession";
import { anonymousProcedure, router } from "../_core/trpc";
import { addAuditLog, getOperadorAtivoPorPinHash, registarAcessoOperador } from "../db";

const pinSchema = z.string().regex(/^\d{4}$/, "Introduza um PIN de quatro dígitos.");
const hashPin = (pin: string) => createHash("sha256").update(pin).digest("hex");

export const acessoPinRouter = router({
  entrar: anonymousProcedure
    .input(z.object({ pin: pinSchema }))
    .mutation(async ({ input, ctx }) => {
      const operador = await getOperadorAtivoPorPinHash(hashPin(input.pin));
      if (!operador) throw new Error("PIN inválido ou acesso inativo.");

      await registarAcessoOperador(operador.operadorId, operador.userId);
      const token = await criarTokenSessaoPin(operador.userId);
      ctx.res.cookie(PIN_SESSION_COOKIE, token, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: PIN_SESSION_MAX_AGE_MS,
      });
      await addAuditLog({
        entidade: "acesso_pin",
        entidadeId: operador.userId,
        acao: "criado",
        dadosNovos: { role: operador.role },
        userId: operador.userId,
        userName: operador.name ?? "Operador",
      });
      return {
        user: {
          id: operador.userId,
          name: operador.name,
          email: operador.email,
          role: operador.role,
        },
      };
    }),

  sair: anonymousProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(PIN_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
    return { success: true } as const;
  }),
});
