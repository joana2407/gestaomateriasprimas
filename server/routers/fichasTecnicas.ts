import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getFichasTecnicasFornecedor, upsertFichaTecnicaFornecedor,
  getFichasTecnicasComAlerta, addAuditLog, atualizarEstadosFichasTecnicas
} from "../db";

export const fichasTecnicasRouter = router({
  list: publicProcedure
    .input(z.object({ materiaPrimaId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      await atualizarEstadosFichasTecnicas();
      return getFichasTecnicasFornecedor(input?.materiaPrimaId);
    }),

  alertas: publicProcedure.query(async () => {
    await atualizarEstadosFichasTecnicas();
    return getFichasTecnicasComAlerta();
  }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      materiaPrimaId: z.number(),
      versao: z.string().default("1.0"),
      dataEmissao: z.date(),
      dataValidade: z.date(),
      ficheiroUrl: z.string().optional(),
      ficheiroKey: z.string().optional(),
      notas: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await upsertFichaTecnicaFornecedor({
        ...input,
        uploadedBy: ctx.user.id,
      });
      await addAuditLog({
        entidade: "ficha_tecnica_fornecedor",
        entidadeId: id,
        acao: input.id ? "atualizado" : "criado",
        dadosNovos: input,
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { id };
    }),
});

