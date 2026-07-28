import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  json,
} from "drizzle-orm/mysql-core";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── FÁBRICAS ─────────────────────────────────────────────────────────────────
export const fabricas = mysqlTable("fabricas", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  regras: json("regras"),
  ativa: boolean("ativa").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Fabrica = typeof fabricas.$inferSelect;

// ─── FORNECEDORES ─────────────────────────────────────────────────────────────
export const fornecedores = mysqlTable("fornecedores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 150 }).notNull(),
  codigo: varchar("codigo", { length: 50 }),
  contacto: varchar("contacto", { length: 200 }),
  email: varchar("email", { length: 320 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Fornecedor = typeof fornecedores.$inferSelect;

// ─── MATÉRIAS-PRIMAS ──────────────────────────────────────────────────────────
export const materiasPrimas = mysqlTable("materias_primas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  codigo: varchar("codigo", { length: 50 }),
  fornecedorId: int("fornecedor_id").references(() => fornecedores.id),
  fabricasIds: json("fabricas_ids"),
  alergeniosFormulacao: json("alergenios_formulacao"),
  alergeniosContaminacao: json("alergenios_contaminacao"),
  observacoes: text("observacoes"),
  ativa: boolean("ativa").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MateriaPrima = typeof materiasPrimas.$inferSelect;

// ─── FICHAS TÉCNICAS DE FORNECEDOR ────────────────────────────────────────────
export const fichasTecnicasFornecedor = mysqlTable("fichas_tecnicas_fornecedor", {
  id: int("id").autoincrement().primaryKey(),
  materiaPrimaId: int("materia_prima_id").notNull().references(() => materiasPrimas.id),
  versao: varchar("versao", { length: 20 }).notNull().default("1.0"),
  dataEmissao: timestamp("data_emissao").notNull(),
  dataValidade: timestamp("data_validade").notNull(),
  ficheiroUrl: text("ficheiro_url"),
  ficheiroKey: text("ficheiro_key"),
  estado: mysqlEnum("estado", ["valida", "a_expirar_60", "a_expirar_30", "expirada"]).default("valida").notNull(),
  notas: text("notas"),
  uploadedBy: int("uploaded_by").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FichaTecnicaFornecedor = typeof fichasTecnicasFornecedor.$inferSelect;

// ─── RECEITAS ─────────────────────────────────────────────────────────────────
export const receitas = mysqlTable("receitas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  codigo: varchar("codigo", { length: 50 }),
  fabricaId: int("fabrica_id").notNull().references(() => fabricas.id),
  versao: int("versao").default(1).notNull(),
  estado: mysqlEnum("estado", ["rascunho", "em_revisao", "aprovada", "obsoleta"]).default("rascunho").notNull(),
  descricao: text("descricao"),
  receitaPaiId: int("receita_pai_id"),
  aprovadoPor: int("aprovado_por").references(() => users.id),
  aprovadoEm: timestamp("aprovado_em"),
  createdBy: int("created_by").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Receita = typeof receitas.$inferSelect;

// ─── INGREDIENTES DA RECEITA ──────────────────────────────────────────────────
export const ingredientesReceita = mysqlTable("ingredientes_receita", {
  id: int("id").autoincrement().primaryKey(),
  receitaId: int("receita_id").notNull().references(() => receitas.id),
  materiaPrimaId: int("materia_prima_id").notNull().references(() => materiasPrimas.id),
  quantidade: float("quantidade"),
  unidade: varchar("unidade", { length: 20 }).default("g"),
  percentagem: float("percentagem"),
  ordem: int("ordem").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IngredienteReceita = typeof ingredientesReceita.$inferSelect;

// ─── PRODUTOS FINAIS ──────────────────────────────────────────────────────────
export const produtos = mysqlTable("produtos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  codigo: varchar("codigo", { length: 50 }),
  marca: varchar("marca", { length: 100 }),
  fabricaId: int("fabrica_id").notNull().references(() => fabricas.id),
  receitaId: int("receita_id").references(() => receitas.id),
  gama: varchar("gama", { length: 100 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Produto = typeof produtos.$inferSelect;

// ─── PERFIL ALERGÉNICO DO PRODUTO ─────────────────────────────────────────────
export const perfilAlergenicoProduto = mysqlTable("perfil_alergenico_produto", {
  id: int("id").autoincrement().primaryKey(),
  produtoId: int("produto_id").notNull().references(() => produtos.id),
  receitaId: int("receita_id").notNull().references(() => receitas.id),
  fabricaId: int("fabrica_id").notNull().references(() => fabricas.id),
  resultadoQ1Q6: json("resultado_q1q6"),
  alergeniosFormulacao: json("alergenios_formulacao"),
  alergeniosContaminacao: json("alergenios_contaminacao"),
  calculadoEm: timestamp("calculado_em").defaultNow().notNull(),
  calculadoPor: int("calculado_por").references(() => users.id),
});
export type PerfilAlergenico = typeof perfilAlergenicoProduto.$inferSelect;

// ─── FICHAS TÉCNICAS DE PRODUTO ───────────────────────────────────────────────
export const fichasTecnicasProduto = mysqlTable("fichas_tecnicas_produto", {
  id: int("id").autoincrement().primaryKey(),
  produtoId: int("produto_id").notNull().references(() => produtos.id),
  versao: int("versao").default(1).notNull(),
  estado: mysqlEnum("estado", ["rascunho", "aprovada", "obsoleta"]).default("rascunho").notNull(),
  conteudo: json("conteudo"),
  ficheiroUrl: text("ficheiro_url"),
  ficheiroKey: text("ficheiro_key"),
  geradoPor: int("gerado_por").references(() => users.id),
  geradoEm: timestamp("gerado_em").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FichaTecnicaProduto = typeof fichasTecnicasProduto.$inferSelect;

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  entidade: varchar("entidade", { length: 50 }).notNull(),
  entidadeId: int("entidade_id").notNull(),
  acao: mysqlEnum("acao", ["criado", "atualizado", "eliminado", "aprovado", "rejeitado"]).notNull(),
  dadosAnteriores: json("dados_anteriores"),
  dadosNovos: json("dados_novos"),
  userId: int("user_id").references(() => users.id),
  userName: varchar("user_name", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLogEntry = typeof auditLog.$inferSelect;
