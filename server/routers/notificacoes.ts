import { z } from "zod";
import { qualidadeProcedure, router } from "../_core/trpc";
import { getNotificacoesQualidade, marcarNotificacaoQualidade } from "../db";

export const notificacoesRouter = router({
  list: qualidadeProcedure.query(async () => getNotificacoesQualidade()),

  marcarLida: qualidadeProcedure
    .input(z.object({ id: z.number(), lida: z.boolean() }))
    .mutation(async ({ input }) => {
      await marcarNotificacaoQualidade(input.id, input.lida);
      return { success: true } as const;
    }),
});
