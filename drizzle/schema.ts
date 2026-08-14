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
  date,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["logistica", "qualidade"]).default("logistica").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── OPERADORES COM ACESSO POR PIN ────────────────────────────────────────────
export const operadoresPin = mysqlTable("operadores_pin", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id).unique(),
  pinHash: varchar("pin_hash", { length: 64 }).notNull().unique(),
  ativo: boolean("ativo").default(true).notNull(),
  ultimoAcessoEm: timestamp("ultimo_acesso_em"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});
export type OperadorPin = typeof operadoresPin.$inferSelect;

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
  // Estado de completude
  statusFornecedor: mysqlEnum("status_fornecedor", ["completo", "pendente", "incompleto"]).default("completo"),
  observacoesPendencia: text("observacoes_pendencia"),
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
  // Estado de completude
  statusMp: mysqlEnum("status_mp", ["completo", "pendente", "incompleto"]).default("completo"),
  observacoesPendencia: text("observacoes_pendencia"),
  // Campo legado; o estado operacional corrente vive em materias_primas_fabricas.
  // Mantido temporariamente para compatibilidade com registos históricos.
  categoria: mysqlEnum("categoria", ["em_utilizacao", "obsoleta", "para_testes"]).default("em_utilizacao").notNull(),
  // Data da última validação
  dataValidacao: date("dataValidacao"),
  ativa: boolean("ativa").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MateriaPrima = typeof materiasPrimas.$inferSelect;

// ─── RELAÇÃO MP ↔ FÁBRICAS ───────────────────────────────────────────────────
// Uma MP pode ter um estado operacional distinto em cada unidade fabril.
export const materiasPrimasFabricas = mysqlTable("materias_primas_fabricas", {
  id: int("id").autoincrement().primaryKey(),
  materiaPrimaId: int("materia_prima_id").notNull().references(() => materiasPrimas.id),
  fabricaId: int("fabrica_id").notNull().references(() => fabricas.id),
  estado: mysqlEnum("estado", ["ativa", "para_testes", "inativa"]).default("ativa").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("materias_primas_fabricas_mp_fabrica_unique").on(table.materiaPrimaId, table.fabricaId),
]);
export type MateriaPrimaFabrica = typeof materiasPrimasFabricas.$inferSelect;

// ─── TRANSFERÊNCIAS DE MP ENTRE FÁBRICAS ──────────────────────────────────────
// Regista cada movimento de disponibilidade de uma MP entre unidades, incluindo
// os estados operacionais de origem/destino e o utilizador responsável.
export const transferenciasMateriasPrimas = mysqlTable("transferencias_materias_primas", {
  id: int("id").autoincrement().primaryKey(),
  rececaoOrigemId: int("rececao_origem_id").notNull().references(() => rececoesMateriasPrimas.id),
  materiaPrimaId: int("materia_prima_id").notNull().references(() => materiasPrimas.id),
  fabricaOrigemId: int("fabrica_origem_id").notNull().references(() => fabricas.id),
  fabricaDestinoId: int("fabrica_destino_id").notNull().references(() => fabricas.id),
  dataTransferencia: timestamp("data_transferencia").notNull(),
  quantidade: float("quantidade").notNull(),
  unidade: mysqlEnum("unidade", ["kg", "lt", "ton"]).default("kg").notNull(),
  responsavel: varchar("responsavel", { length: 150 }).notNull(),
  motivo: text("motivo").notNull(),
  estadoOrigem: mysqlEnum("estado_origem", ["ativa", "para_testes", "inativa"]).notNull(),
  estadoDestino: mysqlEnum("estado_destino", ["ativa", "para_testes", "inativa"]).notNull(),
  manterNaOrigem: boolean("manter_na_origem").default(false).notNull(),
  observacoes: text("observacoes"),
  transferidoPor: int("transferido_por").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TransferenciaMateriaPrima = typeof transferenciasMateriasPrimas.$inferSelect;

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
  dataValidacao: date("data_validacao"), // Data da última validação (para semáforo de validade)
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

// ─── RECEÇÕES DE MATÉRIAS-PRIMAS ──────────────────────────────────────────────
// Cada receção é registada na fábrica e no armazém de destino. Os pontos C/NC/NA
// do controlo de receção são mantidos no campo JSON para preservar o modelo
// operacional e permitir acrescentar verificações sem alterar a estrutura base.
export const rececoesMateriasPrimas = mysqlTable("rececoes_materias_primas", {
  id: int("id").autoincrement().primaryKey(),
  fabricaId: int("fabrica_id").notNull().references(() => fabricas.id),
  armazem: mysqlEnum("armazem", ["ambiente_secos", "frio", "embalagens"]).notNull(),
  dataRececao: timestamp("data_rececao").notNull(),
  fornecedorId: int("fornecedor_id").notNull().references(() => fornecedores.id),
  materiaPrimaId: int("materia_prima_id").notNull().references(() => materiasPrimas.id),
  validade: date("validade"),
  lote: varchar("lote", { length: 100 }),
  quantidade: float("quantidade").notNull(),
  unidade: mysqlEnum("unidade", ["kg", "lt", "ton"]).default("kg").notNull(),
  controlos: json("controlos"),
  conformidade: mysqlEnum("conformidade", ["conforme", "nao_conforme", "pendente"]).default("pendente").notNull(),
  numeroPaletesLpr: int("numero_paletes_lpr"),
  responsavel: varchar("responsavel", { length: 150 }).notNull(),
  numeroGuia: varchar("numero_guia", { length: 100 }),
  observacoes: text("observacoes"),
  motivoNaoConformidade: text("motivo_nao_conformidade"),
  registadoPor: int("registado_por").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RececaoMateriaPrima = typeof rececoesMateriasPrimas.$inferSelect;

// ─── NOTIFICAÇÕES DE QUALIDADE ─────────────────────────────────────────────────
export const notificacoesQualidade = mysqlTable("notificacoes_qualidade", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["rececao_observacoes"]).default("rececao_observacoes").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem").notNull(),
  link: varchar("link", { length: 1000 }).notNull(),
  rececaoId: int("rececao_id").references(() => rececoesMateriasPrimas.id),
  lida: boolean("lida").default(false).notNull(),
  lidaEm: timestamp("lida_em"),
  criadaEm: timestamp("criada_em").defaultNow().notNull(),
});
export type NotificacaoQualidade = typeof notificacoesQualidade.$inferSelect;

// ─── HISTÓRICO DE VALIDAÇÕES DE MP ───────────────────────────────────────────
export const validacoesMp = mysqlTable("validacoes_mp", {
  id: int("id").autoincrement().primaryKey(),
  mpId: int("mpId").notNull().references(() => materiasPrimas.id),
  dataValidacao: date("dataValidacao").notNull(),
  notas: text("notas"),
  usuarioId: int("usuarioId").references(() => users.id),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});
export type ValidacaoMp = typeof validacoesMp.$inferSelect;

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
