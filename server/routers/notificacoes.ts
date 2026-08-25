import { z } from "zod";
import { consultaGlobalProcedure, qualidadeProcedure, router } from "../_core/trpc";
import { getNotificacoesQualidade, marcarNotificacaoQualidade } from "../db";

export const notificacoesRouter = router({
  list: consultaGlobalProcedure.query(async () => getNotificacoesQualidade()),

  marcarLida: qualidadeProcedure
    .input(z.object({ id: z.number(), lida: z.boolean() }))
    .mutation(async ({ input }) => {
      await marcarNotificacaoQualidade(input.id, input.lida);
      return { success: true } as const;
    }),
});
