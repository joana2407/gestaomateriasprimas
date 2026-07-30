import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getReceitas, getReceitaById, upsertReceita,
  getIngredientesByReceita, upsertIngrediente,
  deleteIngredientesByReceita, deleteReceita, addAuditLog, getMateriasPrimas, getDb
} from "../db";
import { receitas } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { calcularPerfilAlergenico, REGRAS_FABRICAS } from "../../shared/allergens";

export const receitasRouter = router({
  list: publicProcedure
    .input(z.object({ fabricaId: z.number().optional() }).optional())
    .query(async ({ input }) => getReceitas(input?.fabricaId)),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const receita = await getReceitaById(input.id);
      if (!receita) return null;
      const ingredientes = await getIngredientesByReceita(input.id);
      return { ...receita, ingredientes };
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      nome: z.string().min(1),
      codigo: z.string().optional(),
      fabricaId: z.number(),
      descricao: z.string().optional(),
      estado: z.enum(["rascunho","em_revisao","aprovada","obsoleta"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const anterior = input.id ? await getReceitaById(input.id) : null;
      const id = await upsertReceita({ ...input, createdBy: ctx.user.id });
      await addAuditLog({
        entidade: "receita",
        entidadeId: id,
        acao: input.id ? "atualizado" : "criado",
        dadosAnteriores: anterior,
        dadosNovos: input,
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteReceita(input.id);
      await addAuditLog({
        entidade: "receita",
        entidadeId: input.id,
        acao: "eliminado",
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { success: true };
    }),

  aprovar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.update(receitas).set({
        estado: "aprovada",
        aprovadoPor: ctx.user.id,
        aprovadoEm: new Date(),
      }).where(eq(receitas.id, input.id));
      await addAuditLog({
        entidade: "receita",
        entidadeId: input.id,
        acao: "aprovado",
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { success: true };
    }),

  setIngredientes: protectedProcedure
    .input(z.object({
      receitaId: z.number(),
      ingredientes: z.array(z.object({
        id: z.number().optional(),
        materiaPrimaId: z.number(),
        quantidade: z.number().optional(),
        unidade: z.string().optional(),
        percentagem: z.number().optional(),
        ordem: z.number().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      await deleteIngredientesByReceita(input.receitaId);
      for (const ing of input.ingredientes) {
        await upsertIngrediente({ ...ing, receitaId: input.receitaId });
      }
      return { success: true };
    }),

  calcularPerfil: publicProcedure
    .input(z.object({
      receitaId: z.number(),
      fabricaCodigo: z.string(),
      equipamento: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const ingredientes = await getIngredientesByReceita(input.receitaId);
      const mps = await getMateriasPrimas();
      const mpMap = new Map(mps.map(mp => [mp.id, mp]));
      const ingredientesComPerfil = ingredientes.map(ing => {
        const mp = mpMap.get(ing.materiaPrimaId);
        return {
          alergeniosFormulacao: (mp?.alergeniosFormulacao as string[] ?? []) as any[],
          alergeniosContaminacao: (mp?.alergeniosContaminacao as string[] ?? []) as any[],
        };
      });
      const regras = REGRAS_FABRICAS[input.fabricaCodigo] ?? REGRAS_FABRICAS["FAB1"];
      return calcularPerfilAlergenico(ingredientesComPerfil, regras, input.equipamento);
    }),
});

