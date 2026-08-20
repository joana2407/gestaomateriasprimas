import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { qualidadeProcedure, rececoesProcedure, router } from "../_core/trpc";
import {
  addAuditLog,
  criarNotificacaoQualidade,
  decidirValidacaoRececaoMateriaPrima,
  deleteRececaoMateriaPrima,
  getFabricas,
  getFornecedores,
  getMateriasPrimas,
  getMpFornecedores,
  getRececaoMateriaPrimaById,
  getRececoesMateriasPrimas,
  getTransferenciasStock,
  transferirMateriaPrimaEntreFabricas,
  upsertRececaoMateriaPrima,
} from "../db";
import { calcularConformidadeRececao, type ControlosRececao } from "../../shared/rececao-controlos";
import { UNIDADES_RECECAO_IDS } from "../../shared/rececao-unidades";
import { resumirObservacoesRececao, temObservacoesRececao } from "../../shared/rececao-observacoes";
import { notifyOwner } from "../_core/notification";
import { validarTransferenciaStock } from "../../shared/transferencia-stock";
import { podeEditarRececao } from "../../shared/rececao-permissoes";
import { avaliarValidadeMinimaRececao } from "../../shared/rececao-validade-minima";
import { motivoValidacaoCondicional, rececaoAcessivelOperacionalmente, requerValidacaoCondicional } from "../../shared/rececao-condicional";

const estadoControlo = z.enum(["c", "nc", "na"]);
const controlosSchema = z.object({
  tipoRececao: z.enum(["saco", "granel"]).optional(),
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

const transferenciaStockInput = z.object({
  rececaoOrigemId: z.number().int().positive(),
  fabricaDestinoId: z.number().int().positive(),
  dataTransferencia: z.date(),
  quantidade: z.number().positive(),
  responsavel: z.string().min(2).max(150),
  motivo: z.string().min(3).max(5000),
  observacoes: z.string().max(5000).nullable().optional(),
});

export const rececoesRouter = router({
  contextoOperacional: rececoesProcedure.query(async () => {
    const [fabricas, fornecedores, materiasPrimas] = await Promise.all([
      getFabricas(),
      getFornecedores(),
      getMateriasPrimas(),
    ]);
    return { fabricas, fornecedores, materiasPrimas };
  }),

  list: rececoesProcedure
    .input(z.object({
      fabricaId: z.number().optional(),
      armazem: z.enum(["ambiente_secos", "frio", "embalagens"]).optional(),
      conformidade: z.enum(["conforme", "nao_conforme", "pendente"]).optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const rececoes = await getRececoesMateriasPrimas(input);
      return ctx.user.role === "qualidade" ? rececoes : rececoes.filter(rececao => rececaoAcessivelOperacionalmente(rececao.estadoValidacao));
    }),

  byId: rececoesProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const rececao = await getRececaoMateriaPrimaById(input.id);
      if (rececao && ctx.user.role !== "qualidade" && !rececaoAcessivelOperacionalmente(rececao.estadoValidacao)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Esta receção aguarda validação da Qualidade." });
      }
      return rececao;
    }),

  transferenciasStock: rececoesProcedure.query(() => getTransferenciasStock()),

  transferirStock: rececoesProcedure
    .input(transferenciaStockInput)
    .mutation(async ({ input, ctx }) => {
      validarTransferenciaStock(input);
      const rececao = await getRececaoMateriaPrimaById(input.rececaoOrigemId);
      if (!rececao) throw new Error("A receção de origem não foi encontrada.");
      if (!rececaoAcessivelOperacionalmente(rececao.estadoValidacao)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "A transferência só fica disponível após a validação da receção pela Qualidade." });
      }
      const id = await transferirMateriaPrimaEntreFabricas({
        ...input,
        observacoes: input.observacoes?.trim() || null,
        transferidoPor: ctx.user.id,
      });
      await addAuditLog({
        entidade: "transferencia_stock_mp",
        entidadeId: id,
        acao: "criado",
        dadosNovos: { ...input, materiaPrimaId: rececao.materiaPrimaId, lote: rececao.lote, fabricaOrigemId: rececao.fabricaId, unidade: rececao.unidade },
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { id };
    }),

  upsert: rececoesProcedure
    .input(rececaoInput)
    .mutation(async ({ input, ctx }) => {
      if (input.id) {
        const rececaoExistente = await getRececaoMateriaPrimaById(input.id);
        if (!rececaoExistente) throw new Error("A receção a editar não foi encontrada.");
        if (!podeEditarRececao({ role: ctx.user.role, userId: ctx.user.id, registadoPor: rececaoExistente.registadoPor })) {
          throw new Error("Só a equipa de Qualidade ou o responsável pelo registo pode editar esta receção.");
        }
      }
      const materiasPrimas = await getMateriasPrimas();
      const materiaPrima = materiasPrimas.find(mp => mp.id === input.materiaPrimaId);
      if (!materiaPrima) throw new Error("Matéria-prima não encontrada ou inativa");
      const fabricasMp = (materiaPrima.fabricasIds as number[] | null) ?? [];
      if (!fabricasMp.includes(input.fabricaId)) {
        throw new Error("A matéria-prima selecionada não está disponível na fábrica indicada");
      }
      const fornecedoresAprovados = await getMpFornecedores(input.materiaPrimaId);
      const fornecedorDaMp = fornecedoresAprovados.find(rel => rel.fornecedorId === input.fornecedorId);
      if (!fornecedorDaMp) {
        throw new Error("A matéria-prima selecionada não está aprovada para o fornecedor indicado");
      }

      const alertaValidade = avaliarValidadeMinimaRececao({
        dataRececao: input.dataRececao,
        validade: input.validade,
        validadeEstipuladaMeses: fornecedorDaMp.validadeEstipuladaMeses,
      });
      const controlos = input.controlos as ControlosRececao;
      const conformidade = calcularConformidadeRececao(controlos);
      if (conformidade === "nao_conforme" && !input.motivoNaoConformidade?.trim()) {
        throw new Error("Descreva o motivo da não conformidade antes de guardar a receção");
      }

      const requerValidacao = requerValidacaoCondicional({ alertaValidade: alertaValidade.alerta, conformidade });
      const estadoValidacao = requerValidacao ? "pendente" : "nao_aplicavel" as const;
      const motivoCondicional = requerValidacao ? motivoValidacaoCondicional({ alertaValidade: alertaValidade.alerta, conformidade }) : null;

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
        estadoValidacao,
        motivoValidacaoCondicional: motivoCondicional,
        validadoPor: null,
        validadoPorNome: null,
        validadoEm: null,
        registadoPor: ctx.user.id,
      } as any);

      await addAuditLog({
        entidade: "rececao_mp",
        entidadeId: id,
        acao: input.id ? "atualizado" : "criado",
        dadosNovos: { ...input, conformidade, alertaValidade, estadoValidacao, motivoCondicional },
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      let notificacaoQualidadeEnviada = false;
      if (temObservacoesRececao(input.observacoes) || requerValidacao) {
        const protocolo = (ctx.req.get("x-forwarded-proto") ?? ctx.req.protocol ?? "https").split(",")[0].trim();
        const host = ctx.req.get("x-forwarded-host") ?? ctx.req.get("host");
        const linkRececao = host ? `${protocolo}://${host}/rececoes?rececaoId=${id}` : `/rececoes?rececaoId=${id}`;
        const titulo = requerValidacao ? `Receção #${id} aguarda validação da Qualidade` : `Receção #${id} com observações`;
        const mensagem = requerValidacao
          ? `A matéria-prima “${materiaPrima.nome}” foi registada condicionalmente por ${ctx.user.name ?? ctx.user.email ?? "um utilizador"} devido a ${motivoCondicional}. A receção permanece inacessível até validação ou recusa justificada pela Qualidade.${temObservacoesRececao(input.observacoes) ? `\n\nObservações: ${resumirObservacoesRececao(input.observacoes!)}` : ""}`
          : `A matéria-prima “${materiaPrima.nome}” foi ${input.id ? "atualizada" : "registada"} com observações por ${ctx.user.name ?? ctx.user.email ?? "um utilizador"}.\n\nObservações: ${resumirObservacoesRececao(input.observacoes!)}`;
        await criarNotificacaoQualidade({
          tipo: requerValidacao ? "rececao_validacao_condicional" : "rececao_observacoes",
          titulo,
          mensagem,
          link: linkRececao,
          rececaoId: id,
        });
        try {
          notificacaoQualidadeEnviada = await notifyOwner({
            title: titulo,
            content: `${mensagem}\n\nVer detalhes da receção: ${linkRececao}`,
          });
        } catch (error) {
          console.warn("[Receções] Não foi possível enviar a notificação de Qualidade", error);
        }
      }
      return { id, conformidade, estadoValidacao, notificacaoQualidadeEnviada, alertaValidade };
    }),

  validarCondicional: qualidadeProcedure
    .input(z.object({ id: z.number().int().positive(), decisao: z.enum(["validada", "recusada"]), justificacao: z.string().trim().min(5).max(5000) }))
    .mutation(async ({ input, ctx }) => {
      const rececao = await getRececaoMateriaPrimaById(input.id);
      if (!rececao) throw new Error("Receção não encontrada.");
      if (rececao.estadoValidacao !== "pendente") throw new Error("Esta receção não aguarda validação condicional.");
      const responsavel = ctx.user.name ?? ctx.user.email ?? "Equipa de Qualidade";
      await decidirValidacaoRececaoMateriaPrima({
        id: input.id,
        estadoValidacao: input.decisao,
        motivoValidacaoCondicional: input.justificacao,
        validadoPor: ctx.user.id,
        validadoPorNome: responsavel,
      });
      await addAuditLog({
        entidade: "rececao_mp",
        entidadeId: input.id,
        acao: input.decisao === "validada" ? "aprovado" : "rejeitado",
        dadosAnteriores: { estadoValidacao: "pendente" },
        dadosNovos: { estadoValidacao: input.decisao, justificacao: input.justificacao },
        userId: ctx.user.id,
        userName: responsavel,
      });
      return { estadoValidacao: input.decisao };
    }),

  delete: qualidadeProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const rececao = await getRececaoMateriaPrimaById(input.id);
      if (!rececao) throw new Error("Receção não encontrada");
      const { transferenciasEliminadas } = await deleteRececaoMateriaPrima(input.id);
      await addAuditLog({
        entidade: "rececao_mp",
        entidadeId: input.id,
        acao: "eliminado",
        dadosAnteriores: rececao,
        dadosNovos: { transferenciasEliminadas },
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { success: true, transferenciasEliminadas } as const;
    }),
});
