import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getFornecedores, upsertFornecedor, addAuditLog, getDb,
  getDocumentosFornecedor, getDocumentosComAlerta,
  upsertDocumentoFornecedor, deleteDocumentoFornecedor,
} from "../db";
import { fornecedores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";

const TIPOS_DOCUMENTO = [
  "certificacao_iso","certificacao_fssc","certificacao_ifs","certificacao_brc",
  "declaracao_alergenios","declaracao_ogm","declaracao_halal","declaracao_kosher",
  "analise_laboratorial","auditoria_fornecedor","outro"
] as const;

export const fornecedoresRouter = router({
  list: publicProcedure.query(async () => getFornecedores()),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(fornecedores).where(eq(fornecedores.id, input.id)).limit(1);
      if (!result[0]) return null;
      const documentos = await getDocumentosFornecedor(input.id);
      return { ...result[0], documentos };
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      nome: z.string().min(1),
      codigo: z.string().optional(),
      // Contacto comercial
      contactoComercialNome: z.string().optional(),
      contactoComercialEmail: z.string().optional(),
      contactoComercialTelemovel: z.string().optional(),
      // Contacto qualidade
      contactoQualidadeNome: z.string().optional(),
      contactoQualidadeEmail: z.string().optional(),
      contactoQualidadeTelemovel: z.string().optional(),
      // Legado
      contacto: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await upsertFornecedor(input as any);
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

  // ── Documentos de Qualidade ──────────────────────────────────────────────────
  documentos: router({
    list: publicProcedure
      .input(z.object({ fornecedorId: z.number().optional() }).optional())
      .query(async ({ input }) => getDocumentosFornecedor(input?.fornecedorId)),

    alertas: publicProcedure.query(async () => getDocumentosComAlerta()),

    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        fornecedorId: z.number(),
        tipo: z.enum(TIPOS_DOCUMENTO),
        nome: z.string().min(1),
        descricao: z.string().optional(),
        dataEmissao: z.date(),
        dataValidade: z.date(),
        ficheiroUrl: z.string().optional(),
        ficheiroKey: z.string().optional(),
        nomeOriginal: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await upsertDocumentoFornecedor({
          ...input,
          uploadedBy: ctx.user.id,
        } as any);
        await addAuditLog({
          entidade: "documento_fornecedor",
          entidadeId: id,
          acao: input.id ? "atualizado" : "criado",
          dadosNovos: { nome: input.nome, tipo: input.tipo, fornecedorId: input.fornecedorId },
          userId: ctx.user.id,
          userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
        });
        return { id };
      }),

    uploadFicheiro: protectedProcedure
      .input(z.object({
        ficheiroBase64: z.string(),
        nomeOriginal: z.string(),
        mimeType: z.string(),
        fornecedorId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.ficheiroBase64, "base64");
        const ext = input.nomeOriginal.split(".").pop() ?? "pdf";
        const key = `docs-fornecedor/${input.fornecedorId}/${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url, key, nomeOriginal: input.nomeOriginal };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteDocumentoFornecedor(input.id);
        await addAuditLog({
          entidade: "documento_fornecedor",
          entidadeId: input.id,
          acao: "eliminado",
          userId: ctx.user.id,
          userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
        });
        return { success: true };
      }),
  }),
});
