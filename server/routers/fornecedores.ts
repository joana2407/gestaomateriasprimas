import { z } from "zod";
import { escritaSemGestaoProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getFornecedores, upsertFornecedor, addAuditLog, getDb,
  getDocumentosFornecedor, getDocumentosComAlerta,
  upsertDocumentoFornecedor, deleteDocumentoFornecedor,
  getMpPorFornecedor,
} from "../db";
import { fornecedores, mpFornecedores } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { storagePut } from "../storage";

const TIPOS_DOCUMENTO = [
  "certificacao_iso","certificacao_fssc","certificacao_ifs","certificacao_brc",
  "declaracao_alergenios","declaracao_ogm","declaracao_halal","declaracao_kosher",
  "analise_laboratorial","auditoria_fornecedor","outro"
] as const;

export const fornecedoresRouter = router({
  list: publicProcedure.query(async () => getFornecedores()),

  // Listar MP associadas a um fornecedor
  mpList: publicProcedure
    .input(z.object({ fornecedorId: z.number() }))
    .query(async ({ input }) => getMpPorFornecedor(input.fornecedorId)),

  // Associar MP a um fornecedor (insere ou reactiva a relação N:N)
  associarMp: escritaSemGestaoProcedure
    .input(z.object({
      fornecedorId: z.number(),
      materiaPrimaId: z.number(),
      referenciaFornecedor: z.string().optional().nullable(),
      paisOrigem: z.string().optional().nullable(),
      validadeEstipuladaMeses: z.number().int().min(1).max(120).optional().nullable(),
      preferencial: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(mpFornecedores)
        .where(and(
          eq(mpFornecedores.materiaPrimaId, input.materiaPrimaId),
          eq(mpFornecedores.fornecedorId, input.fornecedorId)
        )).limit(1);
      if (existing.length > 0) {
        await db.update(mpFornecedores)
          .set({ ativo: true, referenciaFornecedor: input.referenciaFornecedor ?? null, paisOrigem: input.paisOrigem ?? null, validadeEstipuladaMeses: input.validadeEstipuladaMeses === undefined ? existing[0].validadeEstipuladaMeses : input.validadeEstipuladaMeses, preferencial: input.preferencial ?? false })
          .where(and(eq(mpFornecedores.materiaPrimaId, input.materiaPrimaId), eq(mpFornecedores.fornecedorId, input.fornecedorId)));
      } else {
        await db.insert(mpFornecedores).values({
          materiaPrimaId: input.materiaPrimaId,
          fornecedorId: input.fornecedorId,
          referenciaFornecedor: input.referenciaFornecedor ?? null,
          paisOrigem: input.paisOrigem ?? null,
          validadeEstipuladaMeses: input.validadeEstipuladaMeses ?? null,
          preferencial: input.preferencial ?? false,
          ativo: true,
        });
      }
      await addAuditLog({ entidade: "fornecedor", entidadeId: input.fornecedorId, acao: "atualizado", dadosNovos: { mpAssociada: input.materiaPrimaId }, userId: ctx.user.id, userName: ctx.user.name ?? ctx.user.email ?? "Utilizador" });
      return { success: true };
    }),

  // Remover associação MP-Fornecedor
  desassociarMp: escritaSemGestaoProcedure
    .input(z.object({ fornecedorId: z.number(), materiaPrimaId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.update(mpFornecedores).set({ ativo: false })
        .where(and(eq(mpFornecedores.materiaPrimaId, input.materiaPrimaId), eq(mpFornecedores.fornecedorId, input.fornecedorId)));
      await addAuditLog({ entidade: "fornecedor", entidadeId: input.fornecedorId, acao: "atualizado", dadosNovos: { mpDesassociada: input.materiaPrimaId }, userId: ctx.user.id, userName: ctx.user.name ?? ctx.user.email ?? "Utilizador" });
      return { success: true };
    }),

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

  upsert: escritaSemGestaoProcedure
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
      // Estado de completude
      statusFornecedor: z.enum(["completo", "pendente", "incompleto"]).optional(),
      observacoesPendencia: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!input.id) {
        const normalizar = (value?: string | null) =>
          (value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLocaleLowerCase();
        const fornecedoresAtivos = await getFornecedores();
        const nomeNormalizado = normalizar(input.nome);
        const codigoNormalizado = normalizar(input.codigo);
        const nomeDuplicado = fornecedoresAtivos.find(f => normalizar(f.nome) === nomeNormalizado);
        if (nomeDuplicado) {
          throw new Error(`Já existe um fornecedor com o nome “${nomeDuplicado.nome}”.`);
        }
        if (codigoNormalizado) {
          const codigoDuplicado = fornecedoresAtivos.find(f => normalizar(f.codigo) === codigoNormalizado);
          if (codigoDuplicado) {
            throw new Error(`Já existe um fornecedor com o código “${codigoDuplicado.codigo}”.`);
          }
        }
      }

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

  delete: escritaSemGestaoProcedure
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

    upsert: escritaSemGestaoProcedure
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

    uploadFicheiro: escritaSemGestaoProcedure
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

    delete: escritaSemGestaoProcedure
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
