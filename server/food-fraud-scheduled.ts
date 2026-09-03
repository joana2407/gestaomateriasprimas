import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { foodFraudRelatorios } from "../drizzle/schema";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { normalizarOcorrenciaFoodFraud } from "../shared/food-fraud";

const reportInput = z.object({
  periodoInicio: z.string().datetime(),
  periodoFim: z.string().datetime(),
  anoMes: z.string().regex(/^\d{4}-\d{2}$/),
  estado: z.enum(["sucesso", "sem_dados", "erro"]),
  totalAvaliados: z.number().int().nonnegative().max(10000),
  totalRelevantes: z.number().int().nonnegative().max(10000),
  resumo: z.string().min(1).max(10000),
  ocorrencias: z
    .array(z.record(z.string(), z.unknown()))
    .max(10000)
    .default([]),
  fontes: z.array(z.string().url()).min(1).max(100).default([]),
  erro: z.string().max(5000).optional().nullable(),
});

export async function handleFoodFraudScheduled(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid)
      return res.status(403).json({ error: "cron-only" });
    const config = await db.getFoodFraudVigilanciaByTaskUid(taskUid);
    if (!config) return res.json({ ok: true, skipped: "orphan" });
    if (req.method === "GET")
      return res.json({
        ok: true,
        config,
        contexto: await db.getFoodFraudContexto(),
      });
    const input = reportInput.parse(req.body);
    const ocorrencias = input.ocorrencias.map((ocorrencia, index) =>
      normalizarOcorrenciaFoodFraud(ocorrencia, index)
    );
    const totalRelevantes = ocorrencias.filter(
      ocorrencia => ocorrencia.relevante
    ).length;
    const database = await db.getDb();
    if (!database) throw new Error("Database unavailable");
    const existing = await database
      .select({ id: foodFraudRelatorios.id })
      .from(foodFraudRelatorios)
      .where(
        and(
          eq(foodFraudRelatorios.vigilanciaId, config.id),
          eq(foodFraudRelatorios.anoMes, input.anoMes)
        )
      )
      .limit(1);
    if (existing[0]) {
      const notificacoesCriadas = await db.criarNotificacoesFoodFraudRelevantes(
        existing[0].id,
        ocorrencias,
        input.anoMes
      );
      return res.json({
        ok: true,
        duplicate: true,
        reportId: existing[0].id,
        notificacoesCriadas,
      });
    }
    const report = await db.criarFoodFraudRelatorio({
      vigilanciaId: config.id,
      periodoInicio: new Date(input.periodoInicio),
      periodoFim: new Date(input.periodoFim),
      anoMes: input.anoMes,
      nomeFicheiro: `food-fraud-${input.anoMes}.xlsx`,
      origem: "mensal",
      estado: input.estado,
      totalAvaliados: input.totalAvaliados,
      totalRelevantes,
      resumo: input.resumo,
      ocorrencias,
      fontes: input.fontes,
      erro: input.erro ?? null,
      geradoPor: null,
    });
    const notificacoesCriadas = report?.id
      ? await db.criarNotificacoesFoodFraudRelevantes(
          report.id,
          ocorrencias,
          input.anoMes
        )
      : 0;
    return res.json({
      ok: true,
      reportId: report?.id ?? null,
      notificacoesCriadas,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res
      .status(500)
      .json({
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
        context: { url: req.originalUrl, taskUid },
        timestamp: new Date().toISOString(),
      });
  }
}
