import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import {
  consultaGlobalProcedure,
  qualidadeProcedure,
  router,
} from "../_core/trpc";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import * as dbHelpers from "../db";
import { foodFraudRelatorios } from "../../drizzle/schema";
import {
  ESTADOS_TRIAGEM_FOOD_FRAUD,
  MATRIZ_FOOD_FRAUD_VERSAO,
  NIVEIS_RISCO_FOOD_FRAUD,
  TIPOS_RELACAO_FOOD_FRAUD,
} from "../../shared/food-fraud";

const cronInput = z.object({
  cron: z
    .string()
    .regex(
      /^\d+ \d+ \d+ \d+ \* \*$/,
      "Use cron UTC de 6 campos: segundo minuto hora dia-do-mês * *"
    ),
});
const occurrence = z
  .object({
    chave: z.string().max(180).optional(),
    titulo: z.string().max(255).optional(),
    produto: z.string().max(255).optional(),
    categoria: z.string().max(150).optional(),
    origem: z.string().max(150).optional(),
    pratica: z.string().max(500).optional(),
    resumo: z.string().max(5000).optional(),
    tipoRelacao: z.enum(TIPOS_RELACAO_FOOD_FRAUD).optional(),
    estadoTriagem: z.enum(ESTADOS_TRIAGEM_FOOD_FRAUD).optional(),
    matrizVersao: z.string().max(30).optional(),
    criterios: z
      .object({
        p1: z.number().int().min(1).max(3).optional(),
        p2: z.number().int().min(1).max(3).optional(),
        p3: z.number().int().min(1).max(3).optional(),
        i1: z.number().int().min(1).max(3).optional(),
        i2: z.number().int().min(1).max(3).optional(),
        i3: z.number().int().min(1).max(3).optional(),
        i4: z.number().int().min(1).max(3).optional(),
      })
      .optional(),
    score: z.number().min(0).max(9).nullable().optional(),
    probabilidade: z.number().int().min(1).max(3).nullable().optional(),
    impacto: z.number().int().min(1).max(3).nullable().optional(),
    nivel: z.enum(NIVEIS_RISCO_FOOD_FRAUD).nullable().optional(),
    relevante: z.boolean().optional(),
    acaoRequerida: z.boolean().optional(),
    regraPrevalencia: z.enum(["relacao_direta", "impacto_direto"]).optional(),
    materiasPrimas: z.array(z.string().max(200)).max(100).optional(),
    evidenciaCorrespondencia: z.array(z.string().max(500)).max(100).optional(),
    medidasRecomendadas: z.array(z.string().max(1000)).max(20).optional(),
    fontes: z.array(z.string().url()).max(20).optional(),
  })
  .passthrough();

export function calcularRiscoFoodFraud(probabilidade: number, impacto: number) {
  const score = probabilidade * impacto;
  return {
    score,
    nivel: score >= 6 ? "Alto" : score >= 3 ? "Médio" : "Baixo",
  } as const;
}

export const foodFraudRouter = router({
  config: consultaGlobalProcedure.query(
    async ({ ctx }) =>
      dbHelpers.getFoodFraudVigilancia() ?? {
        id: null,
        nome: "Vigilância Food Fraud — EU Agri-Food Fraud Network",
        ativa: false,
        periodicidade: "mensal",
        cronExpression: "0 0 7 1 * *",
        timezone: "Europe/Lisbon",
        scheduleCronTaskUid: null,
        categorias: dbHelpers.FOOD_FRAUD_CATEGORIAS_PADRAO,
        fontes: dbHelpers.FOOD_FRAUD_FONTES_PADRAO,
        createdBy: ctx.user.id,
        createdAt: null,
        updatedAt: null,
      }
  ),
  relatorios: consultaGlobalProcedure.query(() =>
    dbHelpers.listarFoodFraudRelatorios()
  ),
  contexto: consultaGlobalProcedure.query(() =>
    dbHelpers.getFoodFraudContexto()
  ),
  inicializar: qualidadeProcedure.mutation(({ ctx }) =>
    dbHelpers.criarFoodFraudVigilancia(ctx.user.id)
  ),
  ativarAgendamento: qualidadeProcedure
    .input(cronInput)
    .mutation(async ({ ctx, input }) => {
      let config = await dbHelpers.getFoodFraudVigilancia();
      if (!config)
        config = await dbHelpers.criarFoodFraudVigilancia(ctx.user.id);
      if (!config)
        throw new Error("Não foi possível preparar a vigilância Food Fraud.");
      const sessionToken =
        parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (!sessionToken)
        throw new Error("Sessão não disponível para criar o agendamento.");
      if (config.scheduleCronTaskUid)
        await updateHeartbeatJob(
          config.scheduleCronTaskUid,
          { cron: input.cron, enable: true },
          sessionToken
        );
      else {
        const job = await createHeartbeatJob(
          {
            name: "siga-food-fraud-mensal",
            cron: input.cron,
            path: "/api/scheduled/foodfraud",
            description:
              "Vigilância mensal Food Fraud para matérias-primas e origens do SIGA",
          },
          sessionToken
        );
        await dbHelpers.atualizarFoodFraudTaskUid(config.id, job.taskUid);
      }
      return dbHelpers.getFoodFraudVigilancia();
    }),
  pausarAgendamento: qualidadeProcedure.mutation(async ({ ctx }) => {
    const config = await dbHelpers.getFoodFraudVigilancia();
    if (!config?.scheduleCronTaskUid) return config;
    const sessionToken =
      parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    if (!sessionToken)
      throw new Error("Sessão não disponível para alterar o agendamento.");
    await updateHeartbeatJob(
      config.scheduleCronTaskUid,
      { enable: false },
      sessionToken
    );
    return dbHelpers.getFoodFraudVigilancia();
  }),
  guardarAnaliseManual: qualidadeProcedure
    .input(
      z.object({
        ficheiro: z.string().min(1).max(255),
        periodoInicio: z.string().datetime(),
        periodoFim: z.string().datetime(),
        totalAvaliados: z.number().int().nonnegative().max(10000),
        totalRelevantes: z.number().int().nonnegative().max(10000),
        resumo: z.string().min(1).max(10000),
        ocorrencias: z.array(occurrence).max(10000).default([]),
        fontes: z.array(z.string().url()).max(10000).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let config = await dbHelpers.getFoodFraudVigilancia();
      if (!config)
        config = await dbHelpers.criarFoodFraudVigilancia(ctx.user.id);
      if (!config)
        throw new Error(
          "Não existe configuração Food Fraud disponível para arquivar o relatório."
        );
      const inicio = new Date(input.periodoInicio);
      const fim = new Date(input.periodoFim);
      const anoMes = `${fim.getUTCFullYear()}-${String(fim.getUTCMonth() + 1).padStart(2, "0")}`;
      const report = await dbHelpers.criarFoodFraudRelatorio({
        vigilanciaId: config.id,
        periodoInicio: inicio,
        periodoFim: fim,
        anoMes,
        nomeFicheiro: `food-fraud-${anoMes}.xlsx`,
        origem: "manual",
        ficheiroOrigem: input.ficheiro,
        estado: input.totalAvaliados ? "sucesso" : "sem_dados",
        totalAvaliados: input.totalAvaliados,
        totalRelevantes: input.totalRelevantes,
        resumo: input.resumo,
        ocorrencias: input.ocorrencias,
        fontes: input.fontes,
        geradoPor: ctx.user.id,
      });
      if (!report)
        throw new Error("Não foi possível guardar o relatório Food Fraud.");
      await dbHelpers.criarNotificacoesFoodFraudRelevantes(
        report.id,
        input.ocorrencias,
        anoMes
      );
      return report;
    }),
  eliminarRelatorio: qualidadeProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const existente = await dbHelpers.listarFoodFraudRelatorios(10000);
      if (!existente.some(report => report.id === input.id))
        throw new Error("Relatório Food Fraud não encontrado.");
      await dbHelpers.eliminarFoodFraudRelatorio(input.id);
      return { ok: true, id: input.id };
    }),
  relatorio: consultaGlobalProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await dbHelpers.getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(foodFraudRelatorios)
        .where(eq(foodFraudRelatorios.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),
});
