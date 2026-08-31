import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { rasffRelatorios } from "../drizzle/schema";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { obterSemanaRasff } from "@shared/rasff-semana";

const reportInput = z.object({
  periodoInicio: z.string().datetime(),
  periodoFim: z.string().datetime(),
  estado: z.enum(["sucesso", "sem_dados", "erro"]),
  totalAvaliados: z.number().int().nonnegative().max(10000),
  totalRelevantes: z.number().int().nonnegative().max(10000),
  resumo: z.string().min(1).max(10000),
  conteudoMarkdown: z.string().min(1).max(150000),
  ocorrencias: z.array(z.record(z.string(), z.unknown())).max(200).optional().default([]),
  fontes: z.array(z.string().url()).min(1).max(20),
  erro: z.string().max(5000).optional().nullable(),
});

export async function handleRasffScheduled(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const config = await db.getRasffVigilanciaByTaskUid(taskUid);
    if (!config) {
      return res.json({ ok: true, skipped: "orphan" });
    }

    if (req.method === "GET") {
      const contexto = await db.getRasffContexto();
      return res.json({ ok: true, config, contexto });
    }

    const input = reportInput.parse(req.body);
    const semana = obterSemanaRasff(input.periodoInicio);
    const periodoInicio = semana.inicio;
    const periodoFim = semana.fim;
    const database = await db.getDb();
    if (!database) throw new Error("Database unavailable");

    // A mesma execução pode ser repetida pelo scheduler; o período final é a chave idempotente.
    const existing = await database.select({ id: rasffRelatorios.id })
      .from(rasffRelatorios)
      .where(and(
        eq(rasffRelatorios.vigilanciaId, config.id),
        eq(rasffRelatorios.codigoSemana, semana.codigo),
      ))
      .limit(1);
    if (existing[0]) {
      const notificacoesCriadas = await db.criarNotificacoesRasffRelevantes(existing[0].id, input.ocorrencias, semana.codigo);
      return res.json({ ok: true, duplicate: true, reportId: existing[0].id, notificacoesCriadas });
    }

    const report = await db.criarRasffRelatorio({
      vigilanciaId: config.id,
      periodoInicio,
      periodoFim,
      anoSemana: semana.ano,
      numeroSemana: semana.numero,
      codigoSemana: semana.codigo,
      nomeFicheiro: semana.nomeFicheiro,
      estado: input.estado,
      totalAvaliados: input.totalAvaliados,
      totalRelevantes: input.totalRelevantes,
      resumo: input.resumo,
      conteudoMarkdown: input.conteudoMarkdown,
      ocorrencias: input.ocorrencias,
      fontes: input.fontes,
      erro: input.erro ?? null,
      geradoPor: null,
    });
    const notificacoesCriadas = report?.id
      ? await db.criarNotificacoesRasffRelevantes(report.id, input.ocorrencias, semana.codigo)
      : 0;
    return res.json({ ok: true, reportId: report?.id ?? null, notificacoesCriadas });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
