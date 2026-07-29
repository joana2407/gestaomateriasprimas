import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getFichasTecnicasFornecedor, upsertFichaTecnicaFornecedor,
  getFichasTecnicasComAlerta, addAuditLog, atualizarEstadosFichasTecnicas,
  getDb
} from "../db";
import { fichasTecnicasFornecedor } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";

export const fichasTecnicasRouter = router({
  list: publicProcedure
    .input(z.object({ materiaPrimaId: z.number().optional(), fornecedorId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      await atualizarEstadosFichasTecnicas();
      const all = await getFichasTecnicasFornecedor(input?.materiaPrimaId);
      if (input?.fornecedorId) return all.filter(f => f.fornecedorId === input.fornecedorId);
      return all;
    }),

  alertas: publicProcedure.query(async () => {
    await atualizarEstadosFichasTecnicas();
    return getFichasTecnicasComAlerta();
  }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      materiaPrimaId: z.number(),
      fornecedorId: z.number().optional(),
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

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(fichasTecnicasFornecedor).where(eq(fichasTecnicasFornecedor.id, input.id));
      await addAuditLog({
        entidade: "ficha_tecnica_fornecedor",
        entidadeId: input.id,
        acao: "eliminado",
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { success: true };
    }),

  // Upload de ficheiro FT para S3 — recebe base64 do frontend
  uploadFicheiro: protectedProcedure
    .input(z.object({
      ficheiroBase64: z.string(),
      nomeOriginal: z.string(),
      mimeType: z.string().default("application/pdf"),
      materiaPrimaId: z.number(),
      fornecedorId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.ficheiroBase64, "base64");
      const ext = input.nomeOriginal.split(".").pop() ?? "pdf";
      const key = `ft-fornecedor/${input.materiaPrimaId}/${Date.now()}-${ctx.user.id}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { key, url, nomeOriginal: input.nomeOriginal };
    }),
});
