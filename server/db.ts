import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLog,
  fabricas,
  fichasTecnicasFornecedor,
  fichasTecnicasProduto,
  fornecedores,
  ingredientesReceita,
  InsertUser,
  materiasPrimas,
  materiasPrimasFabricas,
  mpFornecedores,
  perfilAlergenicoProduto,
  produtos,
  rececoesMateriasPrimas,
  receitas,
  users,
} from "../drizzle/schema";
import { documentosFornecedor } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    const value = user[field];
    if (value !== undefined) { values[field] = value ?? null; updateSet[field] = value ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUtilizadores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.lastSignedIn));
}

export async function atualizarPerfilUtilizador(id: number, role: "logistica" | "qualidade") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
}

// ─── FÁBRICAS ─────────────────────────────────────────────────────────────────
export async function getFabricas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fabricas).where(eq(fabricas.ativa, true));
}

export async function getFabricaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(fabricas).where(eq(fabricas.id, id)).limit(1);
  return result[0];
}

// ─── FORNECEDORES ─────────────────────────────────────────────────────────────
export async function getFornecedores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fornecedores).where(eq(fornecedores.ativo, true));
}

export async function upsertFornecedor(data: typeof fornecedores.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.id) {
    await db.update(fornecedores).set({ ...data, updatedAt: new Date() }).where(eq(fornecedores.id, data.id));
    return data.id;
  }
  const result = await db.insert(fornecedores).values(data);
  return (result[0] as any).insertId as number;
}

// ─── DOCUMENTOS DE QUALIDADE DO FORNECEDOR ────────────────────────────────────
export async function getDocumentosFornecedor(fornecedorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (fornecedorId) {
    return db.select().from(documentosFornecedor)
      .where(and(eq(documentosFornecedor.fornecedorId, fornecedorId), eq(documentosFornecedor.ativo, true)))
      .orderBy(documentosFornecedor.dataValidade);
  }
  return db.select().from(documentosFornecedor)
    .where(eq(documentosFornecedor.ativo, true))
    .orderBy(documentosFornecedor.dataValidade);
}

export async function getDocumentosComAlerta() {
  const db = await getDb();
  if (!db) return [];
  const em60Dias = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  return db.select().from(documentosFornecedor)
    .where(and(eq(documentosFornecedor.ativo, true), lte(documentosFornecedor.dataValidade, em60Dias)))
    .orderBy(documentosFornecedor.dataValidade);
}

export async function upsertDocumentoFornecedor(data: typeof documentosFornecedor.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const agora = new Date();
  const dias = Math.floor((data.dataValidade.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
  let estado: "valido" | "a_expirar_60" | "a_expirar_30" | "expirado" = "valido";
  if (dias < 0) estado = "expirado";
  else if (dias <= 30) estado = "a_expirar_30";
  else if (dias <= 60) estado = "a_expirar_60";
  const payload = { ...data, estado };
  if (data.id) {
    await db.update(documentosFornecedor).set({ ...payload, updatedAt: new Date() }).where(eq(documentosFornecedor.id, data.id!));
    return data.id;
  }
  const result = await db.insert(documentosFornecedor).values(payload);
  return (result[0] as any).insertId as number;
}

export async function deleteDocumentoFornecedor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(documentosFornecedor).set({ ativo: false }).where(eq(documentosFornecedor.id, id));
}

// ─── MATÉRIAS-PRIMAS ──────────────────────────────────────────────────────────
export async function getMateriasPrimas(fabricaId?: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(materiasPrimas).where(eq(materiasPrimas.ativa, true));
  const allMpFabricas = await db.select().from(materiasPrimasFabricas);
  const fabricasMap = new Map<number, Array<{ fabricaId: number; estado: "ativa" | "para_testes" | "inativa" }>>();
  for (const rel of allMpFabricas) {
    if (!fabricasMap.has(rel.materiaPrimaId)) fabricasMap.set(rel.materiaPrimaId, []);
    fabricasMap.get(rel.materiaPrimaId)!.push({ fabricaId: rel.fabricaId, estado: rel.estado });
  }
  const filtered = !fabricaId ? rows : rows.filter(mp =>
    (fabricasMap.get(mp.id) ?? []).some(rel => rel.fabricaId === fabricaId)
  );
  // Enriquecer com fornecedores associados (tabela mp_fornecedores)
  const allMpFornecedores = await db.select().from(mpFornecedores).where(eq(mpFornecedores.ativo, true));
  const fornMap = new Map<number, Array<{ fornecedorId: number; preferencial: boolean | null }>>();
  for (const rel of allMpFornecedores) {
    if (!fornMap.has(rel.materiaPrimaId)) fornMap.set(rel.materiaPrimaId, []);
    fornMap.get(rel.materiaPrimaId)!.push({ fornecedorId: rel.fornecedorId, preferencial: rel.preferencial });
  }
  return filtered.map(mp => ({
    ...mp,
    fabricasIds: (fabricasMap.get(mp.id) ?? []).map(rel => rel.fabricaId),
    fabricasEstado: fabricasMap.get(mp.id) ?? [],
    fornecedoresIds: (fornMap.get(mp.id) ?? []).map(f => f.fornecedorId),
  }));
}

export async function getMateriaPrimaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(materiasPrimas).where(eq(materiasPrimas.id, id)).limit(1);
  return result[0];
}

export async function upsertMateriaPrima(data: typeof materiasPrimas.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.id) {
    await db.update(materiasPrimas).set({ ...data, updatedAt: new Date() }).where(eq(materiasPrimas.id, data.id));
    return data.id;
  }
  const result = await db.insert(materiasPrimas).values(data);
  return (result[0] as any).insertId as number;
}

export async function getMpFabricas(materiaPrimaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materiasPrimasFabricas)
    .where(eq(materiasPrimasFabricas.materiaPrimaId, materiaPrimaId));
}

export async function setMpFabricas(
  materiaPrimaId: number,
  fabricasEstado: Array<{ fabricaId: number; estado: "ativa" | "para_testes" | "inativa" }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(materiasPrimasFabricas).where(eq(materiasPrimasFabricas.materiaPrimaId, materiaPrimaId));
  for (const rel of fabricasEstado) {
    await db.insert(materiasPrimasFabricas).values({
      materiaPrimaId,
      fabricaId: rel.fabricaId,
      estado: rel.estado,
    });
  }
}

// ─── MP ↔ FORNECEDORES (N:N) ─────────────────────────────────────────────────
export async function getMpFornecedores(materiaPrimaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mpFornecedores)
    .where(and(eq(mpFornecedores.materiaPrimaId, materiaPrimaId), eq(mpFornecedores.ativo, true)));
}

export async function setMpFornecedores(
  materiaPrimaId: number,
  fornecedoresList: Array<{ fornecedorId: number; referenciaFornecedor?: string; paisOrigem?: string; preferencial?: boolean }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Soft-delete todos os existentes
  await db.update(mpFornecedores).set({ ativo: false }).where(eq(mpFornecedores.materiaPrimaId, materiaPrimaId));
  // Inserir os novos
  for (const f of fornecedoresList) {
    await db.insert(mpFornecedores).values({
      materiaPrimaId,
      fornecedorId: f.fornecedorId,
      referenciaFornecedor: f.referenciaFornecedor,
      paisOrigem: f.paisOrigem,
      preferencial: f.preferencial ?? false,
      ativo: true,
    });
  }
}

export async function deleteMateriaPrima(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(materiasPrimas).set({ ativa: false, updatedAt: new Date() }).where(eq(materiasPrimas.id, id));
}

// ─── FICHAS TÉCNICAS DE FORNECEDOR ────────────────────────────────────────────
export async function getFichasTecnicasFornecedor(materiaPrimaId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (materiaPrimaId) {
    return db.select().from(fichasTecnicasFornecedor)
      .where(eq(fichasTecnicasFornecedor.materiaPrimaId, materiaPrimaId))
      .orderBy(desc(fichasTecnicasFornecedor.createdAt));
  }
  return db.select().from(fichasTecnicasFornecedor).orderBy(desc(fichasTecnicasFornecedor.createdAt));
}

export async function getFichasTecnicasComAlerta() {
  const db = await getDb();
  if (!db) return [];
  const agora = new Date();
  const em60Dias = new Date(agora.getTime() + 60 * 24 * 60 * 60 * 1000);
  return db.select().from(fichasTecnicasFornecedor)
    .where(lte(fichasTecnicasFornecedor.dataValidade, em60Dias))
    .orderBy(fichasTecnicasFornecedor.dataValidade);
}

export async function upsertFichaTecnicaFornecedor(data: typeof fichasTecnicasFornecedor.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Calcular estado baseado na data de validade
  const agora = new Date();
  const diasAteValidade = Math.floor((data.dataValidade.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
  let estado: "valida" | "a_expirar_60" | "a_expirar_30" | "expirada" = "valida";
  if (diasAteValidade < 0) estado = "expirada";
  else if (diasAteValidade <= 30) estado = "a_expirar_30";
  else if (diasAteValidade <= 60) estado = "a_expirar_60";
  const dataComEstado = { ...data, estado };
  if (data.id) {
    await db.update(fichasTecnicasFornecedor).set({ ...dataComEstado, updatedAt: new Date() }).where(eq(fichasTecnicasFornecedor.id, data.id));
    return data.id;
  }
  const result = await db.insert(fichasTecnicasFornecedor).values(dataComEstado);
  return (result[0] as any).insertId as number;
}

export async function atualizarEstadosFichasTecnicas() {
  const db = await getDb();
  if (!db) return;
  const agora = new Date();
  const em30 = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
  const em60 = new Date(agora.getTime() + 60 * 24 * 60 * 60 * 1000);
  await db.update(fichasTecnicasFornecedor).set({ estado: "expirada" }).where(lte(fichasTecnicasFornecedor.dataValidade, agora));
  await db.update(fichasTecnicasFornecedor).set({ estado: "a_expirar_30" }).where(and(gte(fichasTecnicasFornecedor.dataValidade, agora), lte(fichasTecnicasFornecedor.dataValidade, em30)));
  await db.update(fichasTecnicasFornecedor).set({ estado: "a_expirar_60" }).where(and(gte(fichasTecnicasFornecedor.dataValidade, em30), lte(fichasTecnicasFornecedor.dataValidade, em60)));
  await db.update(fichasTecnicasFornecedor).set({ estado: "valida" }).where(gte(fichasTecnicasFornecedor.dataValidade, em60));
}

// ─── RECEITAS ─────────────────────────────────────────────────────────────────
export async function getReceitas(fabricaId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (fabricaId) {
    return db.select().from(receitas).where(eq(receitas.fabricaId, fabricaId)).orderBy(desc(receitas.createdAt));
  }
  return db.select().from(receitas).orderBy(desc(receitas.createdAt));
}

export async function getReceitaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(receitas).where(eq(receitas.id, id)).limit(1);
  return result[0];
}

export async function upsertReceita(data: typeof receitas.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.id) {
    await db.update(receitas).set({ ...data, updatedAt: new Date() }).where(eq(receitas.id, data.id));
    return data.id;
  }
  const result = await db.insert(receitas).values(data);
  return (result[0] as any).insertId as number;
}

// ─── INGREDIENTES ─────────────────────────────────────────────────────────────
export async function getIngredientesByReceita(receitaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ingredientesReceita).where(eq(ingredientesReceita.receitaId, receitaId));
}

export async function upsertIngrediente(data: typeof ingredientesReceita.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.id) {
    await db.update(ingredientesReceita).set(data).where(eq(ingredientesReceita.id, data.id));
    return data.id;
  }
  const result = await db.insert(ingredientesReceita).values(data);
  return (result[0] as any).insertId as number;
}

export async function deleteIngrediente(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ingredientesReceita).where(eq(ingredientesReceita.id, id));
}

export async function deleteIngredientesByReceita(receitaId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ingredientesReceita).where(eq(ingredientesReceita.receitaId, receitaId));
}

export async function deleteReceita(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Desassociar produtos que referenciam esta receita (evitar FK violation)
  await db.update(produtos).set({ receitaId: null, updatedAt: new Date() }).where(eq(produtos.receitaId, id));
  // Eliminar ingredientes e depois a receita
  await db.delete(ingredientesReceita).where(eq(ingredientesReceita.receitaId, id));
  await db.delete(receitas).where(eq(receitas.id, id));
}

export async function deleteProduto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(produtos).set({ ativo: false, updatedAt: new Date() }).where(eq(produtos.id, id));
}

// ─── PRODUTOS ─────────────────────────────────────────────────────────────────
export async function getProdutos(fabricaId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (fabricaId) {
    return db.select().from(produtos).where(and(eq(produtos.fabricaId, fabricaId), eq(produtos.ativo, true)));
  }
  return db.select().from(produtos).where(eq(produtos.ativo, true));
}

export async function getProdutoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  return result[0];
}

export async function upsertProduto(data: typeof produtos.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.id) {
    await db.update(produtos).set({ ...data, updatedAt: new Date() }).where(eq(produtos.id, data.id));
    return data.id;
  }
  const result = await db.insert(produtos).values(data);
  return (result[0] as any).insertId as number;
}

export async function associarReceitaAoProduto(produtoId: number, receitaId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(produtos).set({ receitaId, updatedAt: new Date() }).where(eq(produtos.id, produtoId));
  await db.delete(perfilAlergenicoProduto).where(eq(perfilAlergenicoProduto.produtoId, produtoId));
}

// ─── RECEÇÕES DE MATÉRIAS-PRIMAS ──────────────────────────────────────────────
export async function getRececoesMateriasPrimas(filtros?: { fabricaId?: number; armazem?: string; conformidade?: string }) {
  const db = await getDb();
  if (!db) return [];
  const condicoes = [];
  if (filtros?.fabricaId) condicoes.push(eq(rececoesMateriasPrimas.fabricaId, filtros.fabricaId));
  if (filtros?.armazem) condicoes.push(eq(rececoesMateriasPrimas.armazem, filtros.armazem as any));
  if (filtros?.conformidade) condicoes.push(eq(rececoesMateriasPrimas.conformidade, filtros.conformidade as any));
  const query = db.select({
    id: rececoesMateriasPrimas.id,
    fabricaId: rececoesMateriasPrimas.fabricaId,
    armazem: rececoesMateriasPrimas.armazem,
    dataRececao: rececoesMateriasPrimas.dataRececao,
    fornecedorId: rececoesMateriasPrimas.fornecedorId,
    fornecedorNome: fornecedores.nome,
    materiaPrimaId: rececoesMateriasPrimas.materiaPrimaId,
    materiaPrimaNome: materiasPrimas.nome,
    validade: rececoesMateriasPrimas.validade,
    lote: rececoesMateriasPrimas.lote,
    quantidade: rececoesMateriasPrimas.quantidade,
    unidade: rececoesMateriasPrimas.unidade,
    controlos: rececoesMateriasPrimas.controlos,
    conformidade: rececoesMateriasPrimas.conformidade,
    numeroPaletesLpr: rececoesMateriasPrimas.numeroPaletesLpr,
    responsavel: rececoesMateriasPrimas.responsavel,
    numeroGuia: rececoesMateriasPrimas.numeroGuia,
    observacoes: rececoesMateriasPrimas.observacoes,
    motivoNaoConformidade: rececoesMateriasPrimas.motivoNaoConformidade,
    createdAt: rececoesMateriasPrimas.createdAt,
  }).from(rececoesMateriasPrimas)
    .innerJoin(fornecedores, eq(rececoesMateriasPrimas.fornecedorId, fornecedores.id))
    .innerJoin(materiasPrimas, eq(rececoesMateriasPrimas.materiaPrimaId, materiasPrimas.id));
  if (condicoes.length) return query.where(and(...condicoes)).orderBy(desc(rececoesMateriasPrimas.dataRececao));
  return query.orderBy(desc(rececoesMateriasPrimas.dataRececao));
}

export async function getRececaoMateriaPrimaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rececoesMateriasPrimas).where(eq(rececoesMateriasPrimas.id, id)).limit(1);
  return result[0];
}

export async function upsertRececaoMateriaPrima(data: typeof rececoesMateriasPrimas.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.id) {
    await db.update(rececoesMateriasPrimas).set({ ...data, updatedAt: new Date() }).where(eq(rececoesMateriasPrimas.id, data.id));
    return data.id;
  }
  const result = await db.insert(rececoesMateriasPrimas).values(data);
  return (result[0] as any).insertId as number;
}

export async function deleteRececaoMateriaPrima(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(rececoesMateriasPrimas).where(eq(rececoesMateriasPrimas.id, id));
}

// ─── PERFIL ALERGÉNICO ────────────────────────────────────────────────────────
export async function getPerfilAlergenico(produtoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(perfilAlergenicoProduto)
    .where(eq(perfilAlergenicoProduto.produtoId, produtoId))
    .orderBy(desc(perfilAlergenicoProduto.calculadoEm)).limit(1);
  return result[0];
}

export async function upsertPerfilAlergenico(data: typeof perfilAlergenicoProduto.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Substituir perfil existente para o mesmo produto
  await db.delete(perfilAlergenicoProduto).where(eq(perfilAlergenicoProduto.produtoId, data.produtoId));
  const result = await db.insert(perfilAlergenicoProduto).values(data);
  return (result[0] as any).insertId as number;
}

// ─── FICHAS TÉCNICAS DE PRODUTO ───────────────────────────────────────────────
export async function getFichasTecnicasProduto(produtoId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (produtoId) {
    return db.select().from(fichasTecnicasProduto)
      .where(eq(fichasTecnicasProduto.produtoId, produtoId))
      .orderBy(desc(fichasTecnicasProduto.geradoEm));
  }
  return db.select().from(fichasTecnicasProduto).orderBy(desc(fichasTecnicasProduto.geradoEm));
}

export async function upsertFichaTecnicaProduto(data: typeof fichasTecnicasProduto.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(fichasTecnicasProduto).values(data);
  return (result[0] as any).insertId as number;
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
export async function addAuditLog(data: typeof auditLog.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(data);
}

export async function getAuditLog(entidade?: string, entidadeId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (entidade && entidadeId) {
    return db.select().from(auditLog)
      .where(and(eq(auditLog.entidade, entidade), eq(auditLog.entidadeId, entidadeId)))
      .orderBy(desc(auditLog.createdAt)).limit(50);
  }
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100);
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  await atualizarEstadosFichasTecnicas();
  const [totalMP, totalReceitas, totalProdutos, totalFornecedores] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(materiasPrimas).where(eq(materiasPrimas.ativa, true)),
    db.select({ count: sql<number>`count(*)` }).from(receitas),
    db.select({ count: sql<number>`count(*)` }).from(produtos).where(eq(produtos.ativo, true)),
    db.select({ count: sql<number>`count(*)` }).from(fornecedores).where(eq(fornecedores.ativo, true)),
  ]);
  const alertas = await getFichasTecnicasComAlerta();
  const alertasDocFornecedor = await getDocumentosComAlerta();
  return {
    totalMP: Number(totalMP[0]?.count ?? 0),
    totalReceitas: Number(totalReceitas[0]?.count ?? 0),
    totalProdutos: Number(totalProdutos[0]?.count ?? 0),
    totalFornecedores: Number(totalFornecedores[0]?.count ?? 0),
    alertas,
    alertasDocFornecedor,
  };
}
// Listar todas as MP associadas a um fornecedor específico
export async function getMpPorFornecedor(fornecedorId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    mpId: mpFornecedores.materiaPrimaId,
    referenciaFornecedor: mpFornecedores.referenciaFornecedor,
    paisOrigem: mpFornecedores.paisOrigem,
    preferencial: mpFornecedores.preferencial,
  }).from(mpFornecedores)
    .where(and(eq(mpFornecedores.fornecedorId, fornecedorId), eq(mpFornecedores.ativo, true)));
  if (rows.length === 0) return [];
  // Enriquecer com dados da MP
  const mpIds = rows.map(r => r.mpId);
  const mps = await db.select().from(materiasPrimas)
    .where(inArray(materiasPrimas.id, mpIds));
  return rows.map(r => {
    const mp = mps.find(m => m.id === r.mpId);
    return { ...r, mp };
  }).filter(r => r.mp);
}


// ─── VALIDAÇÕES DE MP ──────────────────────────────────────────────────────────
export async function getValidacoesMp(mpId: number) {
  const db = await getDb();
  if (!db) return [];
  const { desc, eq } = await import("drizzle-orm");
  const { validacoesMp } = await import("../drizzle/schema");
  return db.select().from(validacoesMp).where(eq(validacoesMp.mpId, mpId)).orderBy(desc(validacoesMp.criadoEm));
}

export async function criarValidacaoMp(mpId: number, dataValidacao: Date, notas?: string, usuarioId?: number) {
  const db = await getDb();
  if (!db) return null;
  const { validacoesMp } = await import("../drizzle/schema");
  const result = await db.insert(validacoesMp).values({
    mpId,
    dataValidacao,
    notas: notas || null,
    usuarioId: usuarioId || null,
  });
  return result;
}

export async function atualizarDataValidacaoMp(mpId: number, dataValidacao: Date) {
  const db = await getDb();
  if (!db) return null;
  const { eq } = await import("drizzle-orm");
  return db.update(materiasPrimas).set({ dataValidacao }).where(eq(materiasPrimas.id, mpId));
}
