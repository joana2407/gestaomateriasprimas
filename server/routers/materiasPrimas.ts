import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getMateriasPrimas, getMateriaPrimaById, upsertMateriaPrima,
  deleteMateriaPrima, addAuditLog, getFornecedores
} from "../db";
import { TRPCError } from "@trpc/server";

const AlergenioIdSchema = z.enum([
  "gluten","crustaceos","ovos","peixe","amendoins","soja","leite",
  "frutos_casca_rija","aipo","mostarda","sesamo","sulfitos","tremoco","moluscos"
]);

export const materiasPrimasRouter = router({
  list: publicProcedure
    .input(z.object({ fabricaId: z.number().optional() }).optional())
    .query(async ({ input }) => getMateriasPrimas(input?.fabricaId)),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => getMateriaPrimaById(input.id)),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      nome: z.string().min(1),
      codigo: z.string().optional(),
      fornecedorId: z.number().optional(),
      fabricasIds: z.array(z.number()).optional(),
      alergeniosFormulacao: z.array(AlergenioIdSchema).optional(),
      alergeniosContaminacao: z.array(AlergenioIdSchema).optional(),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar bloqueio de glúten na Fábrica III
      if (input.fabricasIds?.includes(3) || input.fabricasIds?.some(id => id === 3)) {
        if (input.alergeniosFormulacao?.includes("gluten")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "BLOQUEIO: A Fábrica III (Sem Glúten) não permite matérias-primas com glúten via formulação.",
          });
        }
      }
      const anterior = input.id ? await getMateriaPrimaById(input.id) : null;
      const id = await upsertMateriaPrima(input);
      await addAuditLog({
        entidade: "materia_prima",
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
});

