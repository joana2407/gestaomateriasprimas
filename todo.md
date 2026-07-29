# SIGA — Sistema Integrado de Gestão de Alergénios
# TODO

## Fase 1: Base de Dados e Backend
- [x] Esquema de BD: tabelas fabricas, fornecedores, materias_primas, fichas_tecnicas_fornecedor
- [x] Esquema de BD: tabelas receitas, ingredientes_receita, produtos, perfil_alergenico_produto
- [x] Esquema de BD: tabelas audit_log, fichas_tecnicas_produto
- [x] Migração SQL aplicada via webdev_execute_sql
- [x] Router tRPC: fabricas (CRUD + seed)
- [x] Router tRPC: fornecedores (CRUD)
- [x] Router tRPC: materias_primas (CRUD + perfil alergénico + bloqueio FAB3)
- [x] Router tRPC: fichas_tecnicas (upload, validade, alertas)
- [x] Router tRPC: receitas (CRUD + versionamento + aprovação)
- [x] Router tRPC: ingredientes (CRUD via setIngredientes)
- [x] Router tRPC: motor_alergenios (Q1-Q6, calcularPerfil)
- [x] Router tRPC: produtos (CRUD + calcularEGuardarPerfil + gerarFTP)
- [x] Router tRPC: dashboard (alertas, KPIs, auditLog)
- [x] Router tRPC: importacao (dados Excel das 3 fábricas)

## Fase 2: Design System e Layout
- [x] Paleta de cores elegante (verde institucional OKLCH)
- [x] Tipografia refinada (Inter com font-feature-settings)
- [x] SigaLayout com sidebar responsivo e navegação por grupos
- [x] Rotas configuradas em App.tsx (11 rotas)
- [x] Componente AllergenGrid (grelha 14 alergénios com estados visuais e edição)
- [x] Componente ValidityBadge (semáforo de conformidade)
- [x] Componente FactoryBadge (identificação por fábrica com cores distintas)

## Fase 3: Dashboard Principal
- [x] KPIs: MP, Receitas, Produtos, Fornecedores
- [x] Painel de alertas: FT a expirar (60/30 dias) com semáforo de cores
- [x] Visão geral das 3 fábricas com equipamentos e regras
- [x] Ações rápidas (Nova MP, Upload FT, Nova Receita, Novo Produto, Importar)

## Fase 4: Gestão de Matérias-Primas
- [x] Listagem de MP com filtros por fábrica e pesquisa
- [x] Formulário de registo/edição de MP com grelha alergénica
- [x] Grelha visual dos 14 alergénios (formulação © vs. contaminação cruzada c)
- [x] Associação a múltiplas fábricas
- [x] Indicador de estado da FT de fornecedor (válida/a expirar/expirada)

## Fase 5: Fichas Técnicas de Fornecedores
- [x] Registo de FT com data de emissão e cálculo automático de data de revisão (12 meses)
- [x] Listagem com estado de validade (semáforo 4 estados)
- [x] Alertas automáticos a 60 e 30 dias
- [x] Filtro por estado de validade

## Fase 6: Gestão de Receitas e Formulações
- [x] Construtor de receitas com pesquisa de MP
- [x] Pré-visualização alergénica em tempo real (painel lateral)
- [x] Versionamento de receitas (Rascunho → Em Revisão → Aprovada → Obsoleta)
- [x] Bloqueio de MP com glúten na Fábrica III (validado no backend)
- [x] Expansão de receita com perfil alergénico calculado pelo motor Q1-Q6

## Fase 7: Motor da Árvore de Decisão (Q1-Q6)
- [x] Implementação da lógica Q1 (alergénio via formulação)
- [x] Implementação da lógica Q2 (contaminação cruzada no fornecedor)
- [x] Implementação da lógica Q3 (risco na linha de produção)
- [x] Implementação da lógica Q4 (higienização validada)
- [x] Implementação da lógica Q5 (risco residual)
- [x] Implementação da lógica Q6 (segregação física/temporal)
- [x] Resultado: "formulacao" / "contaminacao" / "ausente"
- [x] Interface de visualização do resultado por produto/fábrica

## Fase 8: Sequenciamento de Produção
- [x] Listagem de produtos por fábrica para sequenciamento
- [x] Avisos visuais de higienização entre lotes
- [x] Regras específicas por fábrica (Croutons, Rabanadas, bloqueio SG)
- [x] Legenda de cores (verde/amarelo/vermelho)

## Fase 9: Fichas Técnicas de Produto (FTP)
- [x] Geração automática de FTP a partir de produto com receita
- [x] Declaração de alergénios (Contém / Pode conter vestígios)
- [x] Grelha visual de alergénios na FTP
- [x] Versionamento automático (versão incrementada a cada geração)

## Fase 10: Histórico e Audit Trail
- [x] Registo de todas as alterações com data, hora e utilizador
- [x] Visualização de histórico com ícones por tipo de ação
- [x] Audit trail para conformidade com auditorias

## Fase 11: Importação de Dados Excel
- [x] Importação de MP e alergénios da Fábrica I (36 MP, 15 produtos)
- [x] Importação de MP e alergénios da Fábrica II (18 MP, 5 produtos)
- [x] Importação de MP e alergénios da Fábrica III (21 MP, 15 produtos)
- [x] Interface de importação com 2 passos (seed fábricas + importar dados)

## Testes
- [x] Testes vitest para motor da árvore de decisão (Q1-Q6) — 10 testes
- [x] Testes vitest para auth.logout — 1 teste
- [x] Total: 11/11 testes passados

## Melhorias v1.1
- [x] Eliminar fornecedores (soft-delete com confirmação AlertDialog)
- [x] Eliminar matérias-primas (soft-delete com confirmação AlertDialog)
- [x] Múltiplos fornecedores por MP (tabela mp_fornecedores N:N)
- [x] Upload de FT de fornecedor com ficheiro PDF/imagem (S3 via base64)
- [x] FT associada a par MP+Fornecedor (campo fornecedor_id em fichas_tecnicas_fornecedor)
- [x] Campo de país/região de origem por fornecedor de MP (pais_origem em mp_fornecedores)
- [x] Referência interna do fornecedor por MP (referencia_fornecedor em mp_fornecedores)
- [x] Fornecedor preferencial por MP (flag preferencial)
- [x] Campos de origem para MP compostas: lista de sub-ingredientes com país de origem e %
- [x] Indicador visual de MP composta vs. MP simples (ícone Layers + badge "Composta")
- [x] Campo país de origem principal da MP (pais_origem em materias_primas)
- [x] Migração SQL aplicada (tabela mp_fornecedores + colunas tipo/pais_origem/sub_ingredientes)
- [x] Tabs no formulário de MP: Alergénios / Fornecedores / Origem
- [x] Painel expandível de MP com fornecedores, origem e sub-ingredientes

## Melhorias v1.2
- [x] Filtro por fornecedor na página de Matérias-Primas (select + contador de resultados)
- [x] Botão "Limpar filtros" quando algum filtro está ativo
- [x] Painel expandido de MP: cartões por fornecedor com origem, referência e estado da FT
- [x] Link direto para ficheiro FT dentro do cartão de cada fornecedor
- [x] Semáforo de validade da FT por fornecedor no painel expandido
- [x] FT geral (sem fornecedor específico) mostrada quando MP não tem fornecedores associados
- [x] Tabela de sub-ingredientes para MP compostas com colunas: ingrediente, origem, %, obs.

## Melhorias v1.3
- [x] Corrigir cálculo de validade das FT de MP para 3 anos (em vez de 1 ano)
- [x] Atualizar texto de aviso no diálogo de FT para "3 anos após a emissão"
