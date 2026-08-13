import { and, eq } from "drizzle-orm";
import { ingredientesReceita, materiasPrimas, receitas } from "../drizzle/schema";
import { getDb } from "../server/db";
import { ALERGENIOS_14, calcularPerfilAlergenico, REGRAS_FABRICAS } from "../shared/allergens";

const db = await getDb();
if (!db) throw new Error("DB not available");

const factoryRecipes = await db.select().from(receitas).where(eq(receitas.fabricaId, 3));
const ingredientRows = await db.select().from(ingredientesReceita);
const mps = await db.select().from(materiasPrimas).where(eq(materiasPrimas.ativa, true));
const mpMap = new Map(mps.map(mp => [mp.id, mp]));
const ingredientMap = new Map<number, typeof ingredientRows>();
for (const row of ingredientRows) {
  const list = ingredientMap.get(row.receitaId) ?? [];
  list.push(row);
  ingredientMap.set(row.receitaId, list);
}

const results = factoryRecipes.map(recipe => {
  const ingredients = ingredientMap.get(recipe.id) ?? [];
  const calculated = calcularPerfilAlergenico(
    ingredients.map(ingredient => ({
      alergeniosFormulacao: (mpMap.get(ingredient.materiaPrimaId)?.alergeniosFormulacao as string[] | null) ?? [],
      alergeniosContaminacao: (mpMap.get(ingredient.materiaPrimaId)?.alergeniosContaminacao as string[] | null) ?? [],
    })),
    REGRAS_FABRICAS.FAB3,
  );
  const missingIds = ALERGENIOS_14.filter(allergen => !(allergen.id in calculated.perfil)).map(allergen => allergen.id);
  return {
    id: recipe.id,
    nome: recipe.nome,
    gama: recipe.descricao?.split("\n")[0] ?? "",
    ingredients: ingredients.length,
    missingAllergenKeys: missingIds,
    counts: {
      formulacao: Object.values(calculated.perfil).filter(value => value === "formulacao").length,
      contaminacao: Object.values(calculated.perfil).filter(value => value === "contaminacao").length,
      ausente: Object.values(calculated.perfil).filter(value => value === "ausente").length,
    },
  };
});

const withIngredients = results.filter(result => result.ingredients > 0);
const withoutIngredients = results.filter(result => result.ingredients === 0);
const invalid = results.filter(result => result.missingAllergenKeys.length > 0);
console.log(JSON.stringify({
  factoryId: 3,
  totalRecipes: results.length,
  recipesWithIngredients: withIngredients.length,
  recipesWithoutIngredients: withoutIngredients.map(({ id, nome, gama }) => ({ id, nome, gama })),
  totalIngredients: withIngredients.reduce((sum, result) => sum + result.ingredients, 0),
  invalidProfiles: invalid,
  sample: results.slice(0, 5),
}, null, 2));
process.exit(invalid.length ? 1 : 0);
