import { materiasPrimas, materiasPrimasFabricas } from "../drizzle/schema";
import { getDb } from "../server/db";

type LegacyCategoria = "em_utilizacao" | "para_testes" | "obsoleta" | null;

function mapLegacyCategory(categoria: LegacyCategoria) {
  if (categoria === "para_testes") return "para_testes" as const;
  if (categoria === "obsoleta") return "inativa" as const;
  return "ativa" as const;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const db = await getDb();
  if (!db) throw new Error("A base de dados não está disponível");

  const mps = await db.select().from(materiasPrimas);
  const plano = mps.flatMap(mp => {
    const fabricasIds = Array.isArray(mp.fabricasIds) ? mp.fabricasIds as number[] : [];
    return fabricasIds.map(fabricaId => ({
      materiaPrimaId: mp.id,
      fabricaId,
      estado: mapLegacyCategory(mp.categoria as LegacyCategoria),
    }));
  });

  const resumo = plano.reduce<Record<string, number>>((acc, item) => {
    acc[item.estado] = (acc[item.estado] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    materiasPrimas: mps.length,
    associacoesMpFabrica: plano.length,
    porEstado: resumo,
  }, null, 2));

  if (!apply) return;

  for (const item of plano) {
    await db.insert(materiasPrimasFabricas).values(item).onDuplicateKeyUpdate({
      // Um reprocessamento não sobrescreve decisões já tomadas por fábrica.
      set: { updatedAt: new Date() },
    });
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
