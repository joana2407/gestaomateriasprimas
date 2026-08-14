import fs from "node:fs";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { auditLog, fabricas, ingredientesReceita, materiasPrimas, materiasPrimasFabricas, receitas } from "../drizzle/schema";
import { getDb } from "../server/db";
import { buildFormulacaoRecipeDescription, FORMULACAO_ALIASES, normalizeImportName } from "../shared/receitas-import";

type FormulacaoData = {
  headers: Record<string, string>;
  products: Array<{
    sourceRow: number;
    gama: string;
    nome: string;
    versao: string;
    mps: Array<{ col: number; name: string; mark: string }>;
  }>;
};

type MpRow = typeof materiasPrimas.$inferSelect;

type MpResolution = {
  header: string;
  materiaPrimaId: number;
  materiaPrimaNome: string;
  method: "normalizado" | "alias" | "existente_reclassificada" | "criada";
};

const APPLY = process.argv.includes("--apply");
const SOURCE = process.argv.slice(2).find(argument => !argument.startsWith("--")) ?? "/home/ubuntu/formulacao_data.json";
const FACTORY_CODE = "FAB3";


function appendPendingNote(current: string | null | undefined, note: string) {
  if (!current) return note;
  if (current.includes(note)) return current;
  return `${current}\n${note}`;
}

async function main() {
  const source = JSON.parse(fs.readFileSync(path.resolve(SOURCE), "utf8")) as FormulacaoData;
  const usedHeaders = [...new Set(source.products.flatMap(product => product.mps.map(mp => mp.name)))];
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const factory = (await db.select().from(fabricas).where(eq(fabricas.codigo, FACTORY_CODE)).limit(1))[0];
  if (!factory) throw new Error(`Fábrica ${FACTORY_CODE} não encontrada`);

  const allActive = await db.select().from(materiasPrimas).where(eq(materiasPrimas.ativa, true));
  const factoryMps = allActive.filter(mp => Array.isArray(mp.fabricasIds) && (mp.fabricasIds as number[]).includes(factory.id));
  const byName = new Map(factoryMps.map(mp => [normalizeImportName(mp.nome), mp]));
  const allByName = new Map(allActive.map(mp => [normalizeImportName(mp.nome), mp]));
  const resolutions: MpResolution[] = [];
  const unresolved = usedHeaders.filter(header => {
    const normalized = normalizeImportName(header);
    const resolved = byName.get(normalized) || byName.get(normalizeImportName(FORMULACAO_ALIASES[normalized] ?? ""));
    return !resolved && !allByName.get(normalized) && !allByName.get(normalizeImportName(FORMULACAO_ALIASES[normalized] ?? ""));
  });

  if (!APPLY) {
    console.log(JSON.stringify({ mode: "dry-run", factory: { id: factory.id, codigo: factory.codigo, nome: factory.nome }, products: source.products.length, usedHeaders: usedHeaders.length, unresolved, headers: usedHeaders }, null, 2));
    process.exit(0);
  }

  await db.transaction(async tx => {
    const currentFactoryMps = [...factoryMps];
    const currentByName = new Map(currentFactoryMps.map(mp => [normalizeImportName(mp.nome), mp]));
    const currentAllByName = new Map(allActive.map(mp => [normalizeImportName(mp.nome), mp]));

    async function resolveMp(header: string): Promise<MpResolution> {
      const normalized = normalizeImportName(header);
      const targetName = FORMULACAO_ALIASES[normalized];
      const local = currentByName.get(normalized) || (targetName ? currentByName.get(normalizeImportName(targetName)) : undefined);
      if (local) {
        return { header, materiaPrimaId: local.id, materiaPrimaNome: local.nome, method: local.nome === header ? "normalizado" : "alias" };
      }

      const global = currentAllByName.get(normalized) || (targetName ? currentAllByName.get(normalizeImportName(targetName)) : undefined);
      if (global) {
        const ids = Array.isArray(global.fabricasIds) ? [...(global.fabricasIds as number[])] : [];
        if (!ids.includes(factory.id)) {
          ids.push(factory.id);
          await tx.update(materiasPrimas).set({
            fabricasIds: ids,
            statusMp: "pendente",
            observacoesPendencia: appendPendingNote(global.observacoesPendencia, "Associada à Fábrica III pela migração da aba formulação; validar FT e perfil de alergénios."),
            updatedAt: new Date(),
          }).where(eq(materiasPrimas.id, global.id));
          await tx.insert(materiasPrimasFabricas).values({
            materiaPrimaId: global.id,
            fabricaId: factory.id,
            estado: "ativa",
          }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
          const promoted = { ...global, fabricasIds: ids, statusMp: "pendente" as const } as MpRow;
          currentFactoryMps.push(promoted);
          currentByName.set(normalizeImportName(promoted.nome), promoted);
          currentAllByName.set(normalizeImportName(promoted.nome), promoted);
          return { header, materiaPrimaId: promoted.id, materiaPrimaNome: promoted.nome, method: "existente_reclassificada" };
        }
        return { header, materiaPrimaId: global.id, materiaPrimaNome: global.nome, method: "alias" };
      }

      const createdValues = {
        nome: header.trim(),
        fabricasIds: [factory.id],
        alergeniosFormulacao: [],
        alergeniosContaminacao: [],
        tipo: "simples" as const,
        statusMp: "pendente" as const,
        observacoesPendencia: "Criada automaticamente pela migração da aba formulação; validar fornecedor, FT e perfil de alergénios.",
        ativa: true,
      };
      const result = await tx.insert(materiasPrimas).values(createdValues);
      const id = Number((result[0] as any).insertId);
      await tx.insert(materiasPrimasFabricas).values({ materiaPrimaId: id, fabricaId: factory.id, estado: "ativa" });
      const created = { ...createdValues, id } as MpRow;
      currentFactoryMps.push(created);
      currentByName.set(normalizeImportName(created.nome), created);
      currentAllByName.set(normalizeImportName(created.nome), created);
      return { header, materiaPrimaId: id, materiaPrimaNome: header.trim(), method: "criada" };
    }

    for (const header of usedHeaders) {
      resolutions.push(await resolveMp(header));
    }

    const existingRecipes = await tx.select().from(receitas).where(eq(receitas.fabricaId, factory.id)).orderBy(desc(receitas.createdAt));
    const recipeByKey = new Map(existingRecipes.map(recipe => [`${recipe.nome}||${recipe.descricao ?? ""}`, recipe]));
    const resolutionMap = new Map(resolutions.map(item => [item.header, item]));

    for (const product of source.products) {
      const descricao = buildFormulacaoRecipeDescription(product);
      const key = `${product.nome.trim()}||${descricao}`;
      let recipe = recipeByKey.get(key);
      if (!recipe) {
        const result = await tx.insert(receitas).values({
          nome: product.nome.trim(),
          fabricaId: factory.id,
          versao: 1,
          estado: "rascunho",
          descricao,
        });
        const id = Number((result[0] as any).insertId);
        recipe = { id, nome: product.nome.trim(), descricao } as typeof recipe;
        recipeByKey.set(key, recipe);
        await tx.insert(auditLog).values({
          entidade: "receita",
          entidadeId: id,
          acao: "criado",
          dadosNovos: { origem: "formulação", linha: product.sourceRow, gama: product.gama, versaoFonte: product.versao, fabricaId: factory.id },
          userName: "Migração formulação — Fábrica III",
        });
      }

      await tx.delete(ingredientesReceita).where(eq(ingredientesReceita.receitaId, recipe.id));
      const ingredients = product.mps.map((mp, index) => {
        const resolution = resolutionMap.get(mp.name);
        if (!resolution) throw new Error(`MP não resolvida: ${mp.name}`);
        return {
          receitaId: recipe!.id,
          materiaPrimaId: resolution.materiaPrimaId,
          unidade: "g",
          ordem: index + 1,
        };
      });
      if (ingredients.length) await tx.insert(ingredientesReceita).values(ingredients);
    }
  });

  const finalRecipes = await db.select({ id: receitas.id }).from(receitas).where(eq(receitas.fabricaId, factory.id));
  console.log(JSON.stringify({
    mode: "applied",
    factory: { id: factory.id, codigo: factory.codigo, nome: factory.nome },
    productsImported: source.products.length,
    recipesInFactoryAfterImport: finalRecipes.length,
    usedHeaders: usedHeaders.length,
    resolutions,
    source: path.resolve(SOURCE),
  }, null, 2));
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
