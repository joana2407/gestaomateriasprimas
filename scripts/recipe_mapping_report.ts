import fs from "node:fs";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { materiasPrimas } from "../drizzle/schema";

type ParsedData = {
  headers: Record<string, string>;
  products: Array<{ sourceRow: number; gama: string; nome: string; versao: string; mps: Array<{ col: number; name: string; mark: string }> }>;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/sg\b/g, "")
    .replace(/\bcom pele\b/g, "")
    .replace(/\bcredin\b/g, "")
    .replace(/\bpasteurizado(s|a)?\b/g, "")
    .replace(/\bliquido\b/g, "")
    .replace(/\bpo\b/g, "")
    .replace(/\bsem lactose\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

const aliases: Record<string, string> = {
  [normalize("Mix Universal Neutro")]: "Mix Universal Neutro SG",
  [normalize("Amêndoa Inteira com pele")]: "Amêndoa Inteira",
  [normalize("Avelãs")]: "Avelâ",
  [normalize("Abóbora Branca, Verde e Vermelha")]: "Abóbora Branca/Vermelha/Verde",
  [normalize("Ovo Liquido pasteurizado")]: "Ovo pasteurizado",
  [normalize("Gema liquida pasteurizada")]: "Gema Pasteurizada",
  [normalize("Farinha de Arroz")]: "Farinha de Arroz SG",
  [normalize("Farinha de Alfarroba")]: "Farinha de Alfarroba",
  [normalize("Farinha de milho")]: "Farinho de milho",
  [normalize("Mix Baguette")]: "Mix Baguette SG",
  [normalize("Mix Kernel")]: "Mix Kernel SG",
  [normalize("Mix Muffin")]: "Mix Muffin SG",
  [normalize("Mix Brownie")]: "Mix Brownie SG",
  [normalize("Mix pão forma branco")]: "Mix Pão Forma Branco SG",
  [normalize("Mix 5 sementes")]: "Mix 5 sementes SG",
  [normalize("Mix Decor")]: "Mix Decor SG",
  [normalize("Mix Baguete artesanal")]: "Mix Baguete artesanal SG",
  [normalize("Mix Muffin Limão")]: "Mix Muffin Limão SG",
  [normalize("Mix Muffin Chocolate")]: "Mix Muffin Chocolate SG",
  [normalize("Mix Brioche Vegan")]: "Mix Brioche Vegan SG",
  [normalize("Mix Muffin Ireks")]: "Mix Muffin Ireks SG",
  [normalize("Sementes Sésamo")]: "Sementes de Sésamo SG",
  [normalize("Recheio de Frutos vermelhos")]: "Recheio Frutos Vermelhos",
  [normalize("Margarina Pastel Nata")]: "Margarina Pastel de Nata",
  [normalize("Cacau em Pó")]: "Cacau em Pó",
  [normalize("Sementes de Linhaça Castanha")]: "Sementes de Linhaça",
  [normalize("Sementes de Girassol")]: "Sementes de Girassol",
  [normalize("Oleo Girassol")]: "Oleo Girassol",
  [normalize("Mix Grand Oro Levado")]: "Mix Oro Gran Levado",
  [normalize("Mix Burguer Credin")]: "Mix burguer",
  [normalize("Mix Sponge")]: "Mix sponge",
  [normalize("Mix Soft Cake")]: "Mix SoftCake",
  [normalize("Canela em Pó")]: "Canela em Pó",
};

const data = JSON.parse(fs.readFileSync("/home/ubuntu/formulacao_data.json", "utf8")) as ParsedData;
const db = await getDb();
if (!db) throw new Error("DB not available");
const all = await db.select({ id: materiasPrimas.id, nome: materiasPrimas.nome, fabricasIds: materiasPrimas.fabricasIds, ativa: materiasPrimas.ativa }).from(materiasPrimas).where(eq(materiasPrimas.ativa, true));
const factory = all.filter(mp => Array.isArray(mp.fabricasIds) && (mp.fabricasIds as number[]).includes(3));
const byNormalized = new Map(factory.map(mp => [normalize(mp.nome), mp]));
const mapping = data.headers;
const report = Object.values(mapping).map(header => {
  const exact = byNormalized.get(normalize(header));
  const targetName = aliases[normalize(header)];
  const aliased = targetName ? factory.find(mp => normalize(mp.nome) === normalize(targetName)) : undefined;
  const candidates = factory.filter(mp => normalize(mp.nome).includes(normalize(header)) || normalize(header).includes(normalize(mp.nome))).slice(0, 5);
  return { header, matched: exact ?? aliased ?? null, via: exact ? "normalizado" : aliased ? "alias" : null, candidates: candidates.map(c => ({ id: c.id, nome: c.nome })) };
});
const used = new Set(data.products.flatMap(p => p.mps.map(mp => mp.name)));
console.log(JSON.stringify({ totalFactoryMp: factory.length, totalHeaders: Object.values(mapping).length, totalUsedHeaders: used.size, unresolved: report.filter(r => used.has(r.header) && !r.matched), report }, null, 2));
