import { z } from "zod";
import { protectedProcedure, publicProcedure, qualidadeProcedure, router } from "../_core/trpc";
import { getDb,
  getMateriasPrimas, getMateriaPrimaById, upsertMateriaPrima,
  deleteMateriaPrima, addAuditLog, getFornecedores,
  getMpFornecedores, setMpFornecedores, getMpFabricas, setMpFabricas
} from "../db";
import { desc, eq } from "drizzle-orm";
import { validacoesMp, materiasPrimas } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

const AlergenioIdSchema = z.enum([
  "gluten","crustaceos","ovos","peixe","amendoins","soja","leite",
  "frutos_casca_rija","aipo","mostarda","sesamo","sulfitos","tremoco","moluscos"
]);

const FornecedorMpSchema = z.object({
  fornecedorId: z.number(),
  referenciaFornecedor: z.string().optional(),
  paisOrigem: z.string().optional(),
  preferencial: z.boolean().optional(),
});

const SubIngredienteSchema = z.object({
  nome: z.string(),
  paisOrigem: z.string().optional(),
  percentagem: z.number().optional(),
  observacoes: z.string().optional(),
});

export const materiasPrimasRouter = router({
  list: publicProcedure
    .input(z.object({ fabricaId: z.number().optional() }).optional())
    .query(async ({ input }) => getMateriasPrimas(input?.fabricaId)),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const mp = await getMateriaPrimaById(input.id);
      if (!mp) return null;
      const fornecedoresMp = await getMpFornecedores(input.id);
      const fabricasEstado = await getMpFabricas(input.id);
      return { ...mp, fabricasIds: fabricasEstado.map(rel => rel.fabricaId), fabricasEstado, fornecedoresMp };
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      nome: z.string().min(1),
      codigo: z.string().optional(),
      fabricasIds: z.array(z.number()).optional(),
      fabricasEstado: z.array(z.object({
        fabricaId: z.number(),
        estado: z.enum(["ativa", "para_testes", "inativa"]),
      })).optional(),
      alergeniosFormulacao: z.array(AlergenioIdSchema).optional(),
      alergeniosContaminacao: z.array(AlergenioIdSchema).optional(),
      observacoes: z.string().optional(),
      tipo: z.enum(["simples", "composta"]).optional(),
      paisOrigem: z.string().optional(),
      subIngredientes: z.array(SubIngredienteSchema).optional(),
      fornecedoresMp: z.array(FornecedorMpSchema).optional(),
      // Logística
      formaFornecimento: z.enum(["saco", "granel", "bigbag", "caixa", "unidades", "outro"]).optional().nullable(),
      kgPorSaco: z.number().optional().nullable(),
      sacosPorPalete: z.number().int().optional().nullable(),
      kgPorBigbag: z.number().optional().nullable(),
      observacoesLogistica: z.string().optional().nullable(),
      // Logística múltipla
      formasFornecimento: z.array(z.enum(["saco", "granel", "bigbag", "caixa", "unidades", "outro"])).optional().nullable(),
      unidadesPorCaixa: z.number().optional().nullable(),
      caixasPorPalete: z.number().int().optional().nullable(),
      // Estado de completude
      statusMp: z.enum(["completo", "pendente", "incompleto"]).optional(),
      observacoesPendencia: z.string().optional().nullable(),
      dataValidacao: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar bloqueio de glúten na Fábrica III
      const fabricasSelecionadas = input.fabricasEstado?.map(rel => rel.fabricaId) ?? input.fabricasIds ?? [];
      if (fabricasSelecionadas.includes(3)) {
        if (input.alergeniosFormulacao?.includes("gluten")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "BLOQUEIO: A Fábrica III (Sem Glúten) não permite matérias-primas com glúten via formulação.",
          });
        }
      }
      const anterior = input.id ? await getMateriaPrimaById(input.id) : null;
      const { fornecedoresMp, fabricasEstado, fabricasIds: _legacyFabricasIds, ...mpData } = input;
      const estadosNormalizados = fabricasEstado ?? fabricasSelecionadas.map(fabricaId => ({ fabricaId, estado: "ativa" as const }));
      const mpDataComFabricas = { ...mpData, fabricasIds: estadosNormalizados.map(rel => rel.fabricaId) };
      const id = await upsertMateriaPrima(mpDataComFabricas);
      if (fabricasEstado !== undefined || _legacyFabricasIds !== undefined) {
        await setMpFabricas(id, estadosNormalizados);
      }
      // Atualizar relação N:N com fornecedores
      if (fornecedoresMp !== undefined) {
        await setMpFornecedores(id, fornecedoresMp);
      }
      await addAuditLog({
        entidade: "materia_prima",
        entidadeId: id,
        acao: input.id ? "atualizado" : "criado",
        dadosAnteriores: anterior,
        dadosNovos: { ...mpDataComFabricas, fabricasEstado: estadosNormalizados },
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteMateriaPrima(input.id);
      await addAuditLog({
        entidade: "materia_prima",
        entidadeId: input.id,
        acao: "eliminado",
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { success: true };
    }),

  validacoes: protectedProcedure
    .input(z.object({ mpId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      
      return db.select().from(validacoesMp).where(eq(validacoesMp.mpId, input.mpId)).orderBy(desc(validacoesMp.criadoEm));
    }),

  criarValidacao: protectedProcedure
    .input(z.object({ mpId: z.number(), dataValidacao: z.date(), notas: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      
      await db.insert(validacoesMp).values({
        mpId: input.mpId,
        dataValidacao: input.dataValidacao,
        notas: input.notas || null,
        usuarioId: ctx.user.id,
      });
      // Atualizar dataValidacao na MP
      await db.update(materiasPrimas).set({ dataValidacao: input.dataValidacao }).where(eq(materiasPrimas.id, input.mpId));
      return { success: true };
    }),

});
