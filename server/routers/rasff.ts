import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { consultaGlobalProcedure, qualidadeProcedure, router } from "../_core/trpc";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import * as dbHelpers from "../db";
import { rasffRelatorios, rasffVigilancias } from "../../drizzle/schema";

const cronInput = z.object({
  cron: z.string().regex(/^\d+ \d+ \d+ \* \* \d+$/, "Use o formato cron UTC: segundo minuto hora * * dia-da-semana"),
});

export const rasffRouter = router({
  config: consultaGlobalProcedure.query(async ({ ctx }) => {
    const config = await dbHelpers.getRasffVigilancia();
    return config ?? {
      id: null,
      nome: "Vigilância RASFF — Panificação e Pastelaria",
      ativa: false,
      cronExpression: "0 0 6 * * 1",
      timezone: "Europe/Lisbon",
      scheduleCronTaskUid: null,
      categorias: dbHelpers.RASFF_CATEGORIAS_PADRAO,
      perigos: dbHelpers.RASFF_PERIGOS_PADRAO,
      createdBy: ctx.user.id,
      createdAt: null,
      updatedAt: null,
    };
  }),

  relatorios: consultaGlobalProcedure.query(async () => dbHelpers.listarRasffRelatorios()),

  contexto: consultaGlobalProcedure.query(async () => dbHelpers.getRasffContexto()),

  inicializar: qualidadeProcedure.mutation(async ({ ctx }) => {
    const config = await dbHelpers.criarRasffVigilancia(ctx.user.id);
    if (!config) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar a configuração RASFF." });
    return config;
  }),

  ativarAgendamento: qualidadeProcedure.input(cronInput).mutation(async ({ ctx, input }) => {
    let config = await dbHelpers.getRasffVigilancia();
    if (!config) config = await dbHelpers.criarRasffVigilancia(ctx.user.id);
    if (!config) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível preparar a vigilância RASFF." });
    const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão não disponível para criar o agendamento." });

    if (config.scheduleCronTaskUid) {
      await updateHeartbeatJob(config.scheduleCronTaskUid, { cron: input.cron, enable: true }, sessionToken);
      return dbHelpers.getRasffVigilancia();
    }

    const job = await createHeartbeatJob({
      name: "siga-rasff-semanal",
      cron: input.cron,
      path: "/api/scheduled/rasff",
      description: "Vigilância semanal RASFF para matérias-primas e origens do SIGA",
    }, sessionToken);
    await dbHelpers.atualizarRasffTaskUid(config.id, job.taskUid);
    return dbHelpers.getRasffVigilancia();
  }),

  pausarAgendamento: qualidadeProcedure.mutation(async ({ ctx }) => {
    const config = await dbHelpers.getRasffVigilancia();
    if (!config?.scheduleCronTaskUid) return config;
    const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão não disponível para alterar o agendamento." });
    await updateHeartbeatJob(config.scheduleCronTaskUid, { enable: false }, sessionToken);
    return dbHelpers.getRasffVigilancia();
  }),

  relatorio: consultaGlobalProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const database = await dbHelpers.getDb();
    if (!database) return null;
    const rows = await database.select().from(rasffRelatorios).where(eq(rasffRelatorios.id, input.id)).limit(1);
    return rows[0] ?? null;
  }),
});
