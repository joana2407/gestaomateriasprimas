import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { anonymousProcedure, router } from "./_core/trpc";
import { fabricasRouter } from "./routers/fabricas";
import { fornecedoresRouter } from "./routers/fornecedores";
import { materiasPrimasRouter } from "./routers/materiasPrimas";
import { fichasTecnicasRouter } from "./routers/fichasTecnicas";
import { receitasRouter } from "./routers/receitas";
import { produtosRouter } from "./routers/produtos";
import { dashboardRouter } from "./routers/dashboard";
import { importacaoRouter } from "./routers/importacao";
import { rececoesRouter } from "./routers/rececoes";
import { utilizadoresRouter } from "./routers/utilizadores";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: anonymousProcedure.query(opts => opts.ctx.user),
    logout: anonymousProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  fabricas: fabricasRouter,
  fornecedores: fornecedoresRouter,
  materiasPrimas: materiasPrimasRouter,
  fichasTecnicas: fichasTecnicasRouter,
  receitas: receitasRouter,
  produtos: produtosRouter,
  dashboard: dashboardRouter,
  importacao: importacaoRouter,
  rececoes: rececoesRouter,
  utilizadores: utilizadoresRouter,
});

export type AppRouter = typeof appRouter;
