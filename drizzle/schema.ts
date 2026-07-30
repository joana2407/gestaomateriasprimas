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
  // Contacto comercial
  contactoComercialNome: varchar("contacto_comercial_nome", { length: 150 }),
  contactoComercialEmail: varchar("contacto_comercial_email", { length: 320 }),
  contactoComercialTelemovel: varchar("contacto_comercial_telemovel", { length: 30 }),
  // Contacto qualidade
  contactoQualidadeNome: varchar("contacto_qualidade_nome", { length: 150 }),
  contactoQualidadeEmail: varchar("contacto_qualidade_email", { length: 320 }),
  contactoQualidadeTelemovel: varchar("contacto_qualidade_telemovel", { length: 30 }),
  // Campos legados (mantidos para compatibilidade)
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
  fabricasIds: json("fabricas_ids"),
  alergeniosFormulacao: json("alergenios_formulacao"),
  alergeniosContaminacao: json("alergenios_contaminacao"),
  observacoes: text("observacoes"),
  // Tipo: "simples" ou "composta" (MP com sub-ingredientes)
  tipo: mysqlEnum("tipo", ["simples", "composta"]).default("simples").notNull(),
  // País/região de origem principal
  paisOrigem: varchar("pais_origem", { length: 100 }),
  // Para MP compostas: lista de sub-ingredientes com origem
  subIngredientes: json("sub_ingredientes"),
  // ── Logística ──────────────────────────────────────────────────────────────
  // Forma de fornecimento: saco, granel, bigbag, caixa, outro
  formaFornecimento: mysqlEnum("forma_fornecimento", ["saco", "granel", "bigbag", "caixa", "outro"]),
  // Quando forma = saco: peso por saco (kg)
  kgPorSaco: float("kg_por_saco"),
  // Quando forma = saco: número de sacos por palete
  sacosPorPalete: int("sacos_por_palete"),
  // Quando forma = bigbag: peso por bigbag (kg)
  kgPorBigbag: float("kg_por_bigbag"),
  // Observações logísticas (condições de armazenamento, prazo validade, etc.)
  observacoesLogistica: text("observacoes_logistica"),
  // Múltiplas formas de fornecimento (array JSON: ["saco","granel","bigbag","caixa","outro"])
  formasFornecimento: json("formas_fornecimento"),
  // Quando caixa está selecionada: quantidade/peso por caixa
  unidadesPorCaixa: float("unidades_por_caixa"),
  // Quando caixa está selecionada: número de caixas por palete
  caixasPorPalete: int("caixas_por_palete"),
  ativa: boolean("ativa").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MateriaPrima = typeof materiasPrimas.$inferSelect;

// ─── RELAÇÃO MP ↔ FORNECEDORES (N:N) ─────────────────────────────────────────
export const mpFornecedores = mysqlTable("mp_fornecedores", {
  id: int("id").autoincrement().primaryKey(),
  materiaPrimaId: int("materia_prima_id").notNull().references(() => materiasPrimas.id),
  fornecedorId: int("fornecedor_id").notNull().references(() => fornecedores.id),
  // Referência do fornecedor para esta MP (código interno do fornecedor)
  referenciaFornecedor: varchar("referencia_fornecedor", { length: 100 }),
  // País de origem desta MP neste fornecedor específico
  paisOrigem: varchar("pais_origem", { length: 100 }),
  // Fornecedor preferencial para esta MP
  preferencial: boolean("preferencial").default(false).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MpFornecedor = typeof mpFornecedores.$inferSelect;

// ─── FICHAS TÉCNICAS DE FORNECEDOR ────────────────────────────────────────────
export const fichasTecnicasFornecedor = mysqlTable("fichas_tecnicas_fornecedor", {
  id: int("id").autoincrement().primaryKey(),
  materiaPrimaId: int("materia_prima_id").notNull().references(() => materiasPrimas.id),
  // Fornecedor específico desta FT (opcional — permite FT por par MP+Fornecedor)
  fornecedorId: int("fornecedor_id").references(() => fornecedores.id),
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

// ─── DOCUMENTOS DE QUALIDADE DO FORNECEDOR ────────────────────────────────────
export const documentosFornecedor = mysqlTable("documentos_fornecedor", {
  id: int("id").autoincrement().primaryKey(),
  fornecedorId: int("fornecedor_id").notNull().references(() => fornecedores.id),
  tipo: mysqlEnum("tipo", [
    "certificacao_iso",
    "certificacao_fssc",
    "certificacao_ifs",
    "certificacao_brc",
    "declaracao_alergenios",
    "declaracao_ogm",
    "declaracao_halal",
    "declaracao_kosher",
    "analise_laboratorial",
    "auditoria_fornecedor",
    "outro"
  ]).notNull().default("outro"),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  dataEmissao: timestamp("data_emissao").notNull(),
  dataValidade: timestamp("data_validade").notNull(),
  ficheiroUrl: text("ficheiro_url"),
  ficheiroKey: text("ficheiro_key"),
  nomeOriginal: varchar("nome_original", { length: 255 }),
  estado: mysqlEnum("estado", ["valido", "a_expirar_60", "a_expirar_30", "expirado"]).default("valido").notNull(),
  uploadedBy: int("uploaded_by").references(() => users.id),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DocumentoFornecedor = typeof documentosFornecedor.$inferSelect;

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
