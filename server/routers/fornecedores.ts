import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getFornecedores, upsertFornecedor, addAuditLog, getDb } from "../db";
import { fornecedores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const fornecedoresRouter = router({
  list: publicProcedure.query(async () => getFornecedores()),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      nome: z.string().min(1),
      codigo: z.string().optional(),
      contacto: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await upsertFornecedor(input);
      await addAuditLog({
        entidade: "fornecedor",
        entidadeId: id,
        acao: input.id ? "atualizado" : "criado",
        dadosNovos: input,
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.update(fornecedores).set({ ativo: false }).where(eq(fornecedores.id, input.id));
      await addAuditLog({
        entidade: "fornecedor",
        entidadeId: input.id,
        acao: "eliminado",
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { success: true };
    }),
});

