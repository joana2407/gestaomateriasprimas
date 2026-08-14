import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  addAuditLog,
  getMateriasPrimas,
  getRececaoMateriaPrimaById,
  getRececoesMateriasPrimas,
  upsertRececaoMateriaPrima,
} from "../db";
import { calcularConformidadeRececao, type ControlosRececao } from "../../shared/rececao-controlos";

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
  unidade: z.enum(["kg", "g", "l", "un", "caixa", "saco", "palete", "bigbag"]),
  controlos: controlosSchema,
  numeroPaletesLpr: z.number().int().min(0).nullable().optional(),
  responsavel: z.string().min(2).max(150),
  numeroGuia: z.string().max(100).nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  motivoNaoConformidade: z.string().max(5000).nullable().optional(),
});

export const rececoesRouter = router({
  list: publicProcedure
    .input(z.object({
      fabricaId: z.number().optional(),
      armazem: z.enum(["ambiente_secos", "frio", "embalagens"]).optional(),
      conformidade: z.enum(["conforme", "nao_conforme", "pendente"]).optional(),
    }).optional())
    .query(({ input }) => getRececoesMateriasPrimas(input)),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getRececaoMateriaPrimaById(input.id)),

  upsert: protectedProcedure
    .input(rececaoInput)
    .mutation(async ({ input, ctx }) => {
      const materiasPrimas = await getMateriasPrimas();
      const materiaPrima = materiasPrimas.find(mp => mp.id === input.materiaPrimaId);
      if (!materiaPrima) throw new Error("Matéria-prima não encontrada ou inativa");
      const fabricasMp = (materiaPrima.fabricasIds as number[] | null) ?? [];
      if (!fabricasMp.includes(input.fabricaId)) {
        throw new Error("A matéria-prima selecionada não está disponível na fábrica indicada");
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
      return { id, conformidade };
    }),
});
