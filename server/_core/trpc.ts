import { UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const anonymousProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const rececoesProcedure = t.procedure.use(requireUser);

export const qualidadeProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'qualidade') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Esta ação está reservada ao perfil de Qualidade." });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const gestaoAcessosProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user?.podeGerirAcessos) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Esta ação está reservada à Responsável de Qualidade." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Por defeito, os routers de gestão permanecem reservados à Qualidade.
// As leituras identificadas como públicas continuam a exigir uma sessão PIN,
// mas podem ser consumidas pelos fluxos operacionais de Receções.
export const protectedProcedure = qualidadeProcedure;
export const publicProcedure = rececoesProcedure;
export const adminProcedure = qualidadeProcedure;
