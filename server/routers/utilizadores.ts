import { z } from "zod";
import { qualidadeProcedure, router } from "../_core/trpc";
import { addAuditLog, atualizarPerfilUtilizador, getUtilizadores } from "../db";

const perfilSchema = z.enum(["logistica", "qualidade"]);

export const utilizadoresRouter = router({
  list: qualidadeProcedure.query(async () => getUtilizadores()),

  definirPerfil: qualidadeProcedure
    .input(z.object({ id: z.number(), role: perfilSchema }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id) {
        throw new Error("Não pode alterar o seu próprio perfil de acesso.");
      }
      await atualizarPerfilUtilizador(input.id, input.role);
      await addAuditLog({
        entidade: "utilizador",
        entidadeId: input.id,
        acao: "atualizado",
        dadosNovos: { role: input.role },
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { success: true } as const;
    }),
});
