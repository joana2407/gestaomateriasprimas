import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { auditLog, fabricas, materiasPrimas } from "../drizzle/schema";
import { getDb } from "../server/db";
import { normalizeImportName } from "../shared/receitas-import";
import { matrixSymbolsToAllergenArrays } from "../shared/mp-sg-matrix";

type MatrixRecord = {
  sourceRow: number;
  nome: string;
  fornecedor: string;
  dataFichaExcel: string;
  formulacao: string[];
  contaminacao: string[];
  symbols: Record<string, string>;
};

type MatrixData = {
  records: MatrixRecord[];
  legend: Record<string, string>;
};

const APPLY = process.argv.includes("--apply");
const SOURCE = process.argv.slice(2).find(argument => !argument.startsWith("--")) ?? "/home/ubuntu/mp_sg_matrix.json";
const FACTORY_CODE = "FAB3";

const aliases: Record<string, string> = {
  [normalizeImportName("Sementes de Linhaça Castanha")]: "Sementes de Linhaça",
  [normalizeImportName("Gema liquida pasteurizada")]: "Gema Pasteurizada",
  [normalizeImportName("Sementes Papoila")]: "Sementes de Papoila",
  [normalizeImportName("Ácido Sórbico")]: "Ácido sorbico",
  [normalizeImportName("Propionato de Cálcio")]: "Propionato de calcio",
  [normalizeImportName("Mix Muffin Limão")]: "Mix Muffin Limão SG",
  [normalizeImportName("Mix Muffin Chocolate")]: "Mix Muffin Chocolate SG",
  [normalizeImportName("Mix Baguette")]: "Mix Baguette SG",
  [normalizeImportName("Mix Kernel")]: "Mix Kernel SG",
  [normalizeImportName("Mix Muffin")]: "Mix Muffin SG",
  [normalizeImportName("Mix Brownie")]: "Mix Brownie SG",
  [normalizeImportName("Mix Pão Forma Branco")]: "Mix Pão Forma Branco SG",
  [normalizeImportName("Mix Universal Neutro")]: "Mix Universal Neutro SG",
  [normalizeImportName("Mix 5 sementes")]: "Mix 5 sementes SG",
  [normalizeImportName("Mix Decor")]: "Mix Decor SG",
  [normalizeImportName("Mix Baguete artesanal")]: "Mix Baguete artesanal SG",
  [normalizeImportName("Mix  Muffin Limão")]: "Mix Muffin Limão SG",
  [normalizeImportName("Mix Muffin Ireks")]: "Mix Muffin Ireks SG",
  [normalizeImportName("Sementes de Sésamo")]: "Sementes de Sésamo SG",
  [normalizeImportName("Recheio de Frutos Vermelhos")]: "Recheio Frutos Vermelhos",
  [normalizeImportName("Margarina Pastel Nata")]: "Margarina Pastel de Nata",
  [normalizeImportName("Mix SoftCake")]: "Mix SoftCake",
};

function pendingNote(sourceRow: number) {
  return `Criada pela migração da matriz MP_SG (linha ${sourceRow}); validar fornecedor e FT.`;
}

async function main() {
  const source = JSON.parse(fs.readFileSync(path.resolve(SOURCE), "utf8")) as MatrixData;
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const factory = (await db.select().from(fabricas).where(eq(fabricas.codigo, FACTORY_CODE)).limit(1))[0];
  if (!factory) throw new Error(`Fábrica ${FACTORY_CODE} não encontrada`);

  const allActive = await db.select().from(materiasPrimas).where(eq(materiasPrimas.ativa, true));
  const factoryMps = allActive.filter(mp => Array.isArray(mp.fabricasIds) && (mp.fabricasIds as number[]).includes(factory.id));
  const byFactoryName = new Map(factoryMps.map(mp => [normalizeImportName(mp.nome), mp]));
  const byAnyName = new Map(allActive.map(mp => [normalizeImportName(mp.nome), mp]));
  const unresolved = source.records.filter(record => {
    const normalized = normalizeImportName(record.nome);
    const target = aliases[normalized];
    return !byFactoryName.get(normalized) && !byFactoryName.get(normalizeImportName(target ?? "")) && !byAnyName.get(normalized) && !byAnyName.get(normalizeImportName(target ?? ""));
  }).map(record => ({ sourceRow: record.sourceRow, nome: record.nome }));

  if (!APPLY) {
    console.log(JSON.stringify({ mode: "dry-run", factory: { id: factory.id, codigo: factory.codigo, nome: factory.nome }, records: source.records.length, unresolved, legend: source.legend }, null, 2));
    process.exit(0);
  }

  const changes: Array<{ sourceRow: number; matrixName: string; materiaPrimaId: number; materiaPrimaNome: string; method: string; formulacao: string[]; contaminacao: string[] }> = [];
  await db.transaction(async tx => {
    const currentByFactoryName = new Map(factoryMps.map(mp => [normalizeImportName(mp.nome), mp]));
    const currentByAnyName = new Map(allActive.map(mp => [normalizeImportName(mp.nome), mp]));

    for (const record of source.records) {
      const derived = matrixSymbolsToAllergenArrays(record.symbols);
      const same = (left: string[], right: string[]) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
      if (!same(derived.formulacao, record.formulacao) || !same(derived.contaminacao, record.contaminacao)) {
        throw new Error(`Legenda inconsistente na linha ${record.sourceRow}: ${record.nome}`);
      }
      const normalized = normalizeImportName(record.nome);
      const targetName = aliases[normalized];
      let mp = currentByFactoryName.get(normalized) ?? (targetName ? currentByFactoryName.get(normalizeImportName(targetName)) : undefined);
      let method = mp ? (normalizeImportName(mp.nome) === normalized ? "normalizado" : "alias") : "";

      if (!mp) {
        const global = currentByAnyName.get(normalized) ?? (targetName ? currentByAnyName.get(normalizeImportName(targetName)) : undefined);
        if (global) {
          const ids = Array.isArray(global.fabricasIds) ? [...(global.fabricasIds as number[])] : [];
          if (!ids.includes(factory.id)) {
            ids.push(factory.id);
            await tx.update(materiasPrimas).set({
              fabricasIds: ids,
              statusMp: "pendente",
              observacoesPendencia: global.observacoesPendencia || pendingNote(record.sourceRow),
              updatedAt: new Date(),
            }).where(eq(materiasPrimas.id, global.id));
          }
          mp = { ...global, fabricasIds: ids, statusMp: "pendente" as const } as typeof global;
          currentByFactoryName.set(normalizeImportName(mp.nome), mp);
          currentByAnyName.set(normalizeImportName(mp.nome), mp);
          method = "existente_reclassificada";
        }
      }

      if (!mp) {
        const createdValues = {
          nome: record.nome.trim(),
          fabricasIds: [factory.id],
          alergeniosFormulacao: record.formulacao,
          alergeniosContaminacao: record.contaminacao,
          tipo: "simples" as const,
          statusMp: "pendente" as const,
          observacoesPendencia: pendingNote(record.sourceRow),
          categoria: "em_utilizacao" as const,
          ativa: true,
        };
        const result = await tx.insert(materiasPrimas).values(createdValues);
        const id = Number((result[0] as any).insertId);
        mp = { ...createdValues, id } as typeof mp;
        currentByFactoryName.set(normalizeImportName(mp.nome), mp);
        currentByAnyName.set(normalizeImportName(mp.nome), mp);
        method = "criada";
      } else {
        await tx.update(materiasPrimas).set({
          alergeniosFormulacao: record.formulacao,
          alergeniosContaminacao: record.contaminacao,
          updatedAt: new Date(),
        }).where(eq(materiasPrimas.id, mp.id));
      }

      changes.push({ sourceRow: record.sourceRow, matrixName: record.nome, materiaPrimaId: mp.id, materiaPrimaNome: mp.nome, method, formulacao: record.formulacao, contaminacao: record.contaminacao });
      await tx.insert(auditLog).values({
        entidade: "materia_prima",
        entidadeId: mp.id,
        acao: "atualizado",
        dadosNovos: {
          origem: "MP_SG",
          linha: record.sourceRow,
          nomeFonte: record.nome,
          fornecedorFonte: record.fornecedor || null,
          dataFichaExcel: record.dataFichaExcel || null,
          simbolos: record.symbols,
          alergeniosFormulacao: record.formulacao,
          alergeniosContaminacao: record.contaminacao,
        },
        userName: "Migração matriz MP_SG — Fábrica III",
      });
    }
  });

  console.log(JSON.stringify({ mode: "applied", factory: { id: factory.id, codigo: factory.codigo, nome: factory.nome }, records: source.records.length, changes, legend: source.legend }, null, 2));
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
