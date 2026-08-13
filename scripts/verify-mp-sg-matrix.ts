import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { materiasPrimas } from "../drizzle/schema";
import { getDb } from "../server/db";
import { normalizeImportName } from "../shared/receitas-import";

type MatrixRecord = { sourceRow: number; nome: string; formulacao: string[]; contaminacao: string[] };
type MatrixData = { records: MatrixRecord[] };

const source = JSON.parse(fs.readFileSync(path.resolve(process.argv[2] ?? "/home/ubuntu/mp_sg_matrix.json"), "utf8")) as MatrixData;
const db = await getDb();
if (!db) throw new Error("DB not available");
const mps = await db.select().from(materiasPrimas).where(eq(materiasPrimas.ativa, true));
const byName = new Map(mps.map(mp => [normalizeImportName(mp.nome), mp]));
const aliases: Record<string, string> = {
  [normalizeImportName("Sementes Papoila")]: "Sementes de Papoila",
  [normalizeImportName("Sementes de Linhaça Castanha")]: "Sementes de Linhaça",
  [normalizeImportName("Gema liquida pasteurizada")]: "Gema Pasteurizada",
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
};

const normalizeArray = (value: unknown) => JSON.stringify([...((value as string[] | null) ?? [])].sort());
const mismatches: Array<Record<string, unknown>> = [];
for (const record of source.records) {
  const normalized = normalizeImportName(record.nome);
  const target = aliases[normalized];
  const mp = byName.get(normalized) ?? (target ? byName.get(normalizeImportName(target)) : undefined);
  if (!mp) {
    mismatches.push({ sourceRow: record.sourceRow, nome: record.nome, issue: "MP não encontrada" });
    continue;
  }
  const factoryIds = Array.isArray(mp.fabricasIds) ? (mp.fabricasIds as number[]) : [];
  if (!factoryIds.includes(3)) mismatches.push({ sourceRow: record.sourceRow, nome: record.nome, mpId: mp.id, issue: "MP não associada à Fábrica III" });
  if (normalizeArray(mp.alergeniosFormulacao) !== normalizeArray(record.formulacao)) mismatches.push({ sourceRow: record.sourceRow, nome: record.nome, mpId: mp.id, issue: "Formulação diferente", expected: record.formulacao, actual: mp.alergeniosFormulacao });
  if (normalizeArray(mp.alergeniosContaminacao) !== normalizeArray(record.contaminacao)) mismatches.push({ sourceRow: record.sourceRow, nome: record.nome, mpId: mp.id, issue: "Contaminação diferente", expected: record.contaminacao, actual: mp.alergeniosContaminacao });
}
console.log(JSON.stringify({ records: source.records.length, checked: source.records.length - mismatches.length, mismatches }, null, 2));
process.exit(mismatches.length ? 1 : 0);
