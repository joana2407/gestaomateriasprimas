import { z } from "zod";
import { escritaSemGestaoProcedure, publicProcedure, router } from "../_core/trpc";
import { getFabricas, getFabricaById, getDb } from "../db";
import { fabricas } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { REGRAS_FABRICAS } from "../../shared/allergens";

export const fabricasRouter = router({
  list: publicProcedure.query(async () => {
    return getFabricas();
  }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return getFabricaById(input.id);
  }),

  seed: escritaSemGestaoProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    const existing = await getFabricas();
    if (existing.length > 0) return { seeded: false, message: "Fábricas já existem" };
    await db.insert(fabricas).values([
      {
        codigo: "FAB1",
        nome: "Fábrica I: Tradicional Fatiado",
        descricao: "Produção de pão tradicional fatiado e pastelaria. Equipamentos: Amassadeira (padaria) e Batedeira (pastelaria).",
        regras: REGRAS_FABRICAS["FAB1"],
        ativa: true,
      },
      {
        codigo: "FAB2",
        nome: "Fábrica II: Tradicional Granel",
        descricao: "Produção de pão tradicional a granel. Equipamentos: Amassadeira, Batedeira e Tacho.",
        regras: REGRAS_FABRICAS["FAB2"],
        ativa: true,
      },
      {
        codigo: "FAB3",
        nome: "Fábrica III: Sem Glúten",
        descricao: "Produção exclusiva de produtos sem glúten. BLOQUEIO TOTAL de matérias-primas com glúten.",
        regras: REGRAS_FABRICAS["FAB3"],
        ativa: true,
      },
    ]);
    return { seeded: true, message: "3 fábricas criadas com sucesso" };
  }),
});

