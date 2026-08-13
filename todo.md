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

## Melhorias v1.4
- [x] Corrigir filtro por fornecedor nas MP: usar relação direta mp_fornecedores em vez de proxy via fichas técnicas
- [x] Enriquecer listagem getMateriasPrimas no backend com campo fornecedoresIds (todos os fornecedores, independente de preferencial)

## Melhorias v1.5
- [x] Adicionar campos de contacto comercial (nome, email, telemóvel) ao fornecedor
- [x] Adicionar campos de contacto de qualidade (nome, email, telemóvel) ao fornecedor
- [x] Criar tabela documentos_fornecedor (tipo, nome, ficheiro S3, dataEmissao, dataValidade, estado)
- [x] Upload de documentos de qualidade por fornecedor (certificações, declarações, etc.)
- [x] Validade automática de 1 ano para documentos de fornecedor
- [x] Filtro de documentos por estado (válido, a expirar 60d, a expirar 30d, expirado)
- [x] Alertas de documentos expirados/a expirar no Dashboard (banner + filtro por estado)
- [x] Vista de detalhe do fornecedor com tabs: Contactos, Documentos
- [x] Painel lateral de detalhe ao clicar num fornecedor
- [x] Indicador visual de alerta por fornecedor na lista (ponto colorido)

## Melhorias v1.6
- [x] Redesenhar formulário de sub-ingredientes de MP compostas com cartões individuais
- [x] Cada cartão com campos: Nome, País/Região de Origem, % de Incorporação, Observações
- [x] Indicador de número de ingredientes registados no cabeçalho
- [x] Percentagem com validação 0-100 e símbolo % no campo
- [x] Indicador de soma total das percentagens (verde se = 100%, âmbar caso contrário)
- [x] Estado vazio com área dashed e ícone quando sem ingredientes
- [x] Alertas de documentos de fornecedor no Dashboard (painel com semáforo + lista)
- [x] Alertas de documentos integrados no getDashboardStats do backend

## Melhorias v1.7
- [x] Receitas: editar receita existente (pré-carregar ingredientes e dados via byId)
- [x] Receitas: eliminar receita com diálogo de confirmação
- [x] Receitas: seletor de unidade por ingrediente (g, kg, ml, L, unid)
- [x] Produtos: associar receita diretamente no painel de produtos (select filtrado por fábrica)
- [x] Produtos: editar produto existente (botão editar na lista)
- [x] Produtos: eliminar produto com diálogo de confirmação
- [x] Backend: routers receitas.delete e produtos.delete com audit log

## Melhorias v1.8 — Logística de MP
- [x] Adicionar campos de logística à MP: tipo de embalagem (saco/granel/bigbag/caixa/outro)
- [x] Campo kg por saco (quando embalagem = saco)
- [x] Campo nº de sacos por palete (quando embalagem = saco)
- [x] Campo peso por palete (kg) calculado automaticamente
- [x] Campo kg por bigbag (quando embalagem = bigbag)
- [x] Campo observações logísticas
- [x] Tab "Logística" no formulário de edição de MP
- [x] Mostrar informação logística no painel expandido de cada MP (cartões com forma, pesos, palete calculada)
- [x] Migração SQL para novos campos de logística
- [x] Nota informativa sobre módulo de receções futuras

## Melhorias v2.0 — Logística múltipla
- [x] Alterar formaFornecimento de ENUM singular para JSON array (múltiplas formas) — campo formasFornecimento
- [x] Migração SQL: colunas formas_fornecimento, unidades_por_caixa, caixas_por_palete adicionadas
- [x] Campo unidadesPorCaixa (kg/un por caixa) quando caixa está selecionada
- [x] Campo caixasPorPalete (nº caixas por palete) com cálculo automático do total
- [x] Tab Logística: checkboxes multi-seleção com tick visual, campos condicionais por forma
- [x] Painel expandido MPDetalhe: badges de formas + cartões de detalhe por forma (saco, bigbag, caixa)
- [x] openEdit: carrega array de formas e campos de caixa

## Melhorias v2.1 — Estado de Completude
- [x] Adicionar campo status_mp (ENUM: completo, pendente, incompleto) à tabela materias_primas
- [x] Adicionar campo observacoes_pendencia (TEXT) à tabela materias_primas
- [x] Adicionar campo status_fornecedor (ENUM: completo, pendente, incompleto) à tabela fornecedores
- [x] Adicionar campo observacoes_pendencia (TEXT) à tabela fornecedores
- [x] Migração SQL aplicada para ambas as tabelas
- [x] Atualizar routers materiasPrimas e fornecedores para incluir status e observações
- [x] Atualizar formulário de MP com tab Estado: seletor 3 opções + textarea de observações
- [x] Atualizar formulário de Fornecedor com secção Estado: seletor + textarea
- [x] Badge de estado na lista de MP (⚠ Pendente / ✗ Incompleto, oculto quando Completo)
- [x] Badge de estado na lista de Fornecedores (inline sob o nome)
- [x] Painel expandido de MP: bloco colorido com estado e observações quando não completo
- [x] Tab Estado no painel de detalhe de Fornecedor com bloco visual + observações + botão editar
- [x] Filtro por estado de completude na página de Matérias-Primas (select + badge no contador)
- [x] Filtro por estado de completude na página de Fornecedores
- [x] Schema Drizzle atualizado com os novos campos em ambas as tabelas

## Melhorias v2.2 — MP por Fornecedor
- [x] Tab "Matérias-Primas" no painel de detalhe do Fornecedor com lista de MP associadas
- [x] Listar todas as MP associadas ao fornecedor (via tabela mp_fornecedores)
- [x] Ao clicar no ícone de link numa MP, navegar para /materias-primas e fechar o painel
- [x] Router backend fornecedores.mpList, associarMp e desassociarMp
- [x] Associar MP ao fornecedor com pesquisa em tempo real na lista de MP existentes
- [x] Desassociar MP com botão X por hover
- [x] Badge de preferencial e referência interna na lista de MP do fornecedor
- [x] Página MateriasPrimas lê query param ?expand=ID para abrir MP diretamente ao navegar do painel do fornecedor
- [x] Linha de MP no painel do fornecedor clicável (ícone de link) navega para MP e fecha painel

## Melhorias v2.5 — Categorização e Histórico de Validação de MP

- [x] Adicionar coluna `categoria` (enum: em_utilizacao, obsoleta, para_testes) à tabela materias_primas
- [x] Adicionar coluna `dataValidacao` (date) à tabela materias_primas
- [x] Criar tabela `validacoes_mp` com histórico de validações (id, mpId, dataValidacao, notas, usuarioId, criadoEm)
- [x] Atualizar router de materiasPrimas com endpoints para listar e criar validações
- [x] Adicionar propriedades categoria e dataValidacao à interface MPFormData (TypeScript)
- [x] Adicionar campo visual de categoria (3 botões: Ativa, Testes, Inativa) no formulário de edição de MP
- [x] Adicionar campo visual de data de validação (date picker) no formulário de edição de MP
- [x] Adicionar histórico de validações no painel expandido de MP
- [x] Adicionar badge de categoria na lista de MP (cor diferente por categoria)
- [x] Adicionar filtro por categoria na página de Matérias-Primas
- [x] Adicionar alertas no Dashboard para MP obsoletas ou para testes

## Melhorias v3.1 — Validade de FT por Fornecedor

- [x] Adicionar coluna `dataValidacao` à tabela `fichasTecnicasFornecedor` (em vez de estar em materias_primas)
- [x] Atualizar router de fichasTecnicas para incluir dataValidacao no input
- [x] Atualizar UI: mostrar "✓ Válida · DD/MM/YY" em cada cartão de FT de fornecedor
- [x] Atualizar painel expandido de MP: mostrar data da última validação da MP (campo dataValidacao em materias_primas)
- [x] Adicionar semáforo de validade por FT (verde se válida, vermelho se expirada, amarelo se < 60 dias)

## Correção v3.2 — Formulário de MP

- [x] Remover a secção superior duplicada de origem no formulário de edição de MP
- [x] Manter o separador inferior “Origem” com os campos de origem e composição
- [x] Verificar visualmente o formulário e executar testes

A validade individual das FTs por fornecedor e a data da última validação da MP permanecem inalteradas.

## Melhoria v3.3 — Criar fornecedor no formulário de MP

- [x] Adicionar ação “Novo fornecedor” no separador Fornecedores do formulário de MP
- [x] Criar formulário inline/modal com os dados essenciais do fornecedor
- [x] Associar automaticamente o novo fornecedor à MP após guardar
- [x] Verificar interação e executar testes

- [x] Persistir imediatamente a associação MP↔Fornecedor quando a MP já existe e indicar quando a associação depende de guardar uma MP nova

## Melhoria v3.4 — Validação de fornecedores duplicados

- [x] Impedir criação de fornecedor com nome já existente, ignorando maiúsculas/minúsculas, acentos e espaços extra
- [x] Impedir criação de fornecedor com código já existente, ignorando maiúsculas/minúsculas e espaços extra
- [x] Mostrar mensagens de erro específicas no formulário inline
- [x] Verificar testes e criar checkpoint

- [x] Mostrar erros de duplicação diretamente sob os campos Nome e Código no formulário inline
- [x] Criar checkpoint após a validação anti-duplicados

## Melhoria v3.5 — Completude no novo fornecedor

- [x] Adicionar a secção “Controlo de Completude” ao formulário inline de novo fornecedor
- [x] Permitir selecionar Completo, Pendente ou Incompleto
- [x] Adicionar observações para informação ou documentação em falta
- [x] Preservar o estado e as observações no fornecedor criado
- [x] Executar testes e criar checkpoint
