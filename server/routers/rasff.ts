import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { consultaGlobalProcedure, qualidadeProcedure, router } from "../_core/trpc";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import * as dbHelpers from "../db";
import { rasffRelatorios, rasffVigilancias } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

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

  sugerirPrioridade: consultaGlobalProcedure.input(z.object({
    linha: z.string().min(1).max(4000),
    prioridadeAtual: z.enum(["Alta", "Média", "Baixa", "Informativa"]),
    exemplos: z.array(z.object({ texto: z.string().max(500), prioridade: z.enum(["Alta", "Média", "Baixa", "Informativa"]) })).max(20).default([]),
  })).mutation(async ({ input }) => {
    const exemplos = input.exemplos.map(exemplo => `- ${exemplo.prioridade}: ${exemplo.texto}`).join("\\n") || "(sem exemplos aprovados ainda)";
    const resposta = await invokeLLM({
      messages: [
        { role: "system", content: "És um assistente de triagem RASFF para uma indústria de panificação e pastelaria. Sugere uma prioridade, mas nunca substituis a decisão da Qualidade. Considera perigos, categoria de produto, origem e potencial impacto na cadeia. Responde exclusivamente no formato JSON solicitado." },
        { role: "user", content: `Prioridade automática atual: ${input.prioridadeAtual}\\nExemplos de categorizações aprovadas pela Qualidade:\\n${exemplos}\\n\\nAlerta a classificar:\\n${input.linha}` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "rasff_priority", strict: true, schema: { type: "object", properties: { prioridade: { type: "string", enum: ["Alta", "Média", "Baixa", "Informativa"] }, fundamento: { type: "string" }, confianca: { type: "number", minimum: 0, maximum: 100 } }, required: ["prioridade", "fundamento", "confianca"], additionalProperties: false } } },
    });
    const content = resposta.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "O assistente não devolveu uma sugestão válida." });
    try { const resultado = JSON.parse(content) as { prioridade: string; fundamento: string; confianca: number };
      return { ...resultado, confianca: Math.max(0, Math.min(100, Math.round(resultado.confianca))) }; } catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível interpretar a sugestão do assistente." }); }
  }),

  guardarAnaliseManual: qualidadeProcedure.input(z.object({
    ficheiro: z.string().min(1).max(255),
    periodoInicio: z.string().datetime().optional(),
    periodoFim: z.string().datetime().optional(),
    totalAvaliados: z.number().int().nonnegative().max(5000),
    totalRelevantes: z.number().int().nonnegative().max(5000),
    resumo: z.string().min(1).max(10000),
    ocorrencias: z.array(z.unknown()).max(10000).default([]),
    fontes: z.array(z.string().url()).max(100).default([]),
  })).mutation(async ({ ctx, input }) => {
    const agora = new Date();
    const inicio = input.periodoInicio ? new Date(input.periodoInicio) : new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fim = input.periodoFim ? new Date(input.periodoFim) : agora;
    const codigo = `MANUAL-${agora.getUTCFullYear()}${String(agora.getUTCMonth() + 1).padStart(2, "0")}${String(agora.getUTCDate()).padStart(2, "0")}-${String(agora.getUTCHours()).padStart(2, "0")}${String(agora.getUTCMinutes()).padStart(2, "0")}`;
    const nomeSeguro = input.ficheiro.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "ficheiro";
    const report = await dbHelpers.criarRasffRelatorio({
      vigilanciaId: 1,
      periodoInicio: inicio,
      periodoFim: fim,
      anoSemana: agora.getUTCFullYear(),
      numeroSemana: 0,
      codigoSemana: codigo.slice(0, 20),
      nomeFicheiro: `analise-manual-${nomeSeguro}.xlsx`.slice(0, 180),
      origem: "manual",
      ficheiroOrigem: input.ficheiro,
      estado: "sucesso",
      totalAvaliados: input.totalAvaliados,
      totalRelevantes: input.totalRelevantes,
      resumo: input.resumo,
      conteudoMarkdown: input.resumo,
      ocorrencias: input.ocorrencias,
      fontes: input.fontes,
      geradoPor: ctx.user.id,
    });
    if (!report) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível guardar a análise manual no histórico." });
    return report;
  }),

  relatorio: consultaGlobalProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const database = await dbHelpers.getDb();
    if (!database) return null;
    const rows = await database.select().from(rasffRelatorios).where(eq(rasffRelatorios.id, input.id)).limit(1);
    return rows[0] ?? null;
  }),
});
