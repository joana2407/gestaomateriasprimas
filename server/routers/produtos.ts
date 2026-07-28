import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getProdutos, getProdutoById, upsertProduto,
  getIngredientesByReceita, getMateriasPrimas, getFabricaById,
  upsertPerfilAlergenico, getPerfilAlergenico,
  getFichasTecnicasProduto, upsertFichaTecnicaProduto,
  addAuditLog, getReceitaById
} from "../db";
import { calcularPerfilAlergenico, REGRAS_FABRICAS } from "../../shared/allergens";

export const produtosRouter = router({
  list: publicProcedure
    .input(z.object({ fabricaId: z.number().optional() }).optional())
    .query(async ({ input }) => getProdutos(input?.fabricaId)),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const produto = await getProdutoById(input.id);
      if (!produto) return null;
      const perfil = await getPerfilAlergenico(input.id);
      const fichas = await getFichasTecnicasProduto(input.id);
      return { ...produto, perfil, fichas };
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      nome: z.string().min(1),
      codigo: z.string().optional(),
      marca: z.string().optional(),
      fabricaId: z.number(),
      receitaId: z.number().optional(),
      gama: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await upsertProduto(input);
      await addAuditLog({
        entidade: "produto",
        entidadeId: id,
        acao: input.id ? "atualizado" : "criado",
        dadosNovos: input,
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Utilizador",
      });
      return { id };
    }),

  calcularEGuardarPerfil: protectedProcedure
    .input(z.object({ produtoId: z.number(), equipamento: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const produto = await getProdutoById(input.produtoId);
      if (!produto || !produto.receitaId) throw new Error("Produto sem receita associada");
      const fabrica = await getFabricaById(produto.fabricaId);
      if (!fabrica) throw new Error("Fábrica não encontrada");
      const ingredientes = await getIngredientesByReceita(produto.receitaId);
      const mps = await getMateriasPrimas();
      const mpMap = new Map(mps.map(mp => [mp.id, mp]));
      const ingredientesComPerfil = ingredientes.map(ing => ({
        alergeniosFormulacao: (mpMap.get(ing.materiaPrimaId)?.alergeniosFormulacao as string[] ?? []) as any[],
        alergeniosContaminacao: (mpMap.get(ing.materiaPrimaId)?.alergeniosContaminacao as string[] ?? []) as any[],
      }));
      const regras = REGRAS_FABRICAS[fabrica.codigo] ?? REGRAS_FABRICAS["FAB1"];
      const { perfil, detalheQ1Q6 } = calcularPerfilAlergenico(ingredientesComPerfil, regras, input.equipamento);
      const formulacao = Object.entries(perfil).filter(([,v]) => v === "formulacao").map(([k]) => k);
      const contaminacao = Object.entries(perfil).filter(([,v]) => v === "contaminacao").map(([k]) => k);
      const perfilId = await upsertPerfilAlergenico({
        produtoId: input.produtoId,
        receitaId: produto.receitaId,
        fabricaId: produto.fabricaId,
        resultadoQ1Q6: detalheQ1Q6,
        alergeniosFormulacao: formulacao,
        alergeniosContaminacao: contaminacao,
        calculadoPor: ctx.user.id,
      });
      return { perfilId, perfil, formulacao, contaminacao };
    }),

  gerarFTP: protectedProcedure
    .input(z.object({ produtoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const produto = await getProdutoById(input.produtoId);
      if (!produto) throw new Error("Produto não encontrado");
      const perfil = await getPerfilAlergenico(input.produtoId);
      const fabrica = await getFabricaById(produto.fabricaId);
      const receita = produto.receitaId ? await getReceitaById(produto.receitaId) : null;
      const ingredientes = produto.receitaId ? await getIngredientesByReceita(produto.receitaId) : [];
      const mps = await getMateriasPrimas();
      const mpMap = new Map(mps.map(mp => [mp.id, mp]));
      const conteudo = {
        produto: { nome: produto.nome, codigo: produto.codigo, marca: produto.marca, gama: produto.gama },
        fabrica: { nome: fabrica?.nome, codigo: fabrica?.codigo },
        receita: { nome: receita?.nome, versao: receita?.versao, estado: receita?.estado },
        composicao: ingredientes.map(ing => {
          const mp = mpMap.get(ing.materiaPrimaId);
          return { mp: mp?.nome, quantidade: ing.quantidade, unidade: ing.unidade, percentagem: ing.percentagem };
        }),
        alergeniosFormulacao: perfil?.alergeniosFormulacao ?? [],
        alergeniosContaminacao: perfil?.alergeniosContaminacao ?? [],
        geradoEm: new Date().toISOString(),
        geradoPor: ctx.user.name ?? ctx.user.email,
      };
      const fichas = await getFichasTecnicasProduto(input.produtoId);
      const novaVersao = (fichas.length > 0 ? Math.max(...fichas.map(f => f.versao)) : 0) + 1;
      const id = await upsertFichaTecnicaProduto({
        produtoId: input.produtoId,
        versao: novaVersao,
        estado: "rascunho",
        conteudo,
        geradoPor: ctx.user.id,
      });
      return { id, conteudo };
    }),
});

