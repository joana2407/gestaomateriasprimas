import { z } from "zod";
import { qualidadeProcedure, rececoesProcedure, router } from "../_core/trpc";
import {
  addAuditLog,
  deleteRececaoMateriaPrima,
  getMateriasPrimas,
  getMpFornecedores,
  getRececaoMateriaPrimaById,
  getRececoesMateriasPrimas,
  upsertRececaoMateriaPrima,
} from "../db";
import { calcularConformidadeRececao, type ControlosRececao } from "../../shared/rececao-controlos";
import { UNIDADES_RECECAO_IDS } from "../../shared/rececao-unidades";
import { resumirObservacoesRececao, temObservacoesRececao } from "../../shared/rececao-observacoes";
import { notifyOwner } from "../_core/notification";

const estadoControlo = z.enum(["c", "nc", "na"]);
const controlosSchema = z.object({
  temperaturaMpSaco: z.object({ estado: estadoControlo.optional(), valor: z.number().nullable().optional() }).optional(),
  limpeza: estadoControlo.optional(),
  residuosInfestacao: estadoControlo.optional(),
  acondicionamento: estadoControlo.optional(),
  numeroSelo: z.string().max(100).optional(),
  numeroSilo: z.string().max(100).optional(),
  crivo: estadoControlo.optional(),
  fechoBocaCarga: estadoControlo.optional(),
  aspetoMacroscopico: estadoControlo.optional(),
  materiasEstranhas: estadoControlo.optional(),
  infestacaoProduto: estadoControlo.optional(),
  datasValidade: estadoControlo.optional(),
});

const rececaoInput = z.object({
  id: z.number().optional(),
  fabricaId: z.number(),
  armazem: z.enum(["ambiente_secos", "frio", "embalagens"]),
  dataRececao: z.date(),
  fornecedorId: z.number(),
  materiaPrimaId: z.number(),
  validade: z.date().nullable().optional(),
  lote: z.string().max(100).nullable().optional(),
  quantidade: z.number().positive(),
  unidade: z.enum(UNIDADES_RECECAO_IDS),
  controlos: controlosSchema,
  numeroPaletesLpr: z.number().int().min(0).nullable().optional(),
  responsavel: z.string().min(2).max(150),
  numeroGuia: z.string().max(100).nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  motivoNaoConformidade: z.string().max(5000).nullable().optional(),
});

export const rececoesRouter = router({
  list: rececoesProcedure
    .input(z.object({
      fabricaId: z.number().optional(),
      armazem: z.enum(["ambiente_secos", "frio", "embalagens"]).optional(),
      conformidade: z.enum(["conforme", "nao_conforme", "pendente"]).optional(),
    }).optional())
    .query(({ input }) => getRececoesMateriasPrimas(input)),

  byId: rececoesProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getRececaoMateriaPrimaById(input.id)),

  upsert: rececoesProcedure
    .input(rececaoInput)
    .mutation(async ({ input, ctx }) => {
      const materiasPrimas = await getMateriasPrimas();
      const materiaPrima = materiasPrimas.find(mp => mp.id === input.materiaPrimaId);
      if (!materiaPrima) throw new Error("Matéria-prima não encontrada ou inativa");
      const fabricasMp = (materiaPrima.fabricasIds as number[] | null) ?? [];
      if (!fabricasMp.includes(input.fabricaId)) {
        throw new Error("A matéria-prima selecionada não está disponível na fábrica indicada");
      }
      const fornecedoresAprovados = await getMpFornecedores(input.materiaPrimaId);
      if (!fornecedoresAprovados.some(rel => rel.fornecedorId === input.fornecedorId)) {
        throw new Error("A matéria-prima selecionada não está aprovada para o fornecedor indicado");
      }

      const controlos = input.controlos as ControlosRececao;
      const conformidade = calcularConformidadeRececao(controlos);
      if (conformidade === "nao_conforme" && !input.motivoNaoConformidade?.trim()) {
        throw new Error("Descreva o motivo da não conformidade antes de guardar a receção");
      }

      const id = await upsertRececaoMateriaPrima({
        ...input,
        lote: input.lote || null,
        validade: input.validade ?? null,
        numeroPaletesLpr: input.numeroPaletesLpr ?? null,
        numeroGuia: input.numeroGuia || null,
        observacoes: input.observacoes || null,
        motivoNaoConformidade: input.motivoNaoConformidade || null,
        controlos,
        conformidade,
        registadoPor: ctx.user.id,
      } as any);

      await addAuditLog({
        entidade: "rececao_mp",
        entidadeId: id,
        acao: input.id ? "atualizado" : "criado",
        dadosNovos: { ...input, conformidade },
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      let notificacaoQualidadeEnviada = false;
      if (temObservacoesRececao(input.observacoes)) {
        try {
          notificacaoQualidadeEnviada = await notifyOwner({
            title: `Receção #${id} com observações`,
            content: `A matéria-prima “${materiaPrima.nome}” foi ${input.id ? "atualizada" : "registada"} com observações por ${ctx.user.name ?? ctx.user.email ?? "um utilizador"}.\n\nObservações: ${resumirObservacoesRececao(input.observacoes!)}`,
          });
        } catch (error) {
          console.warn("[Receções] Não foi possível enviar a notificação de Qualidade", error);
        }
      }
      return { id, conformidade, notificacaoQualidadeEnviada };
    }),

  delete: qualidadeProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const rececao = await getRececaoMateriaPrimaById(input.id);
      if (!rececao) throw new Error("Receção não encontrada");
      await deleteRececaoMateriaPrima(input.id);
      await addAuditLog({
        entidade: "rececao_mp",
        entidadeId: input.id,
        acao: "eliminado",
        dadosAnteriores: rececao,
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { success: true } as const;
    }),
});
