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
- [x] Total: 61/61 testes passados

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

## Dados v3.6 — Novas matérias-primas da Fábrica III

- [x] Confirmar fornecedores existentes e IDs da Fábrica III
- [x] Verificar duplicados por nome antes da criação
- [x] Garantir que as 26 MP pedidas ficam registadas/disponíveis na Fábrica III (24 novas + Sal e Canela em Pó reutilizadas)
- [x] Associar fornecedores conforme a lista recebida
- [x] Manter Vinho do Porto sem fornecedor associado
- [x] Verificar os registos criados e criar checkpoint

## Dados v3.7 — Matriz de alergénios da Fábrica III

- [x] Extrair os cabeçalhos, legenda e símbolos da matriz fornecida
- [x] Mapear cada símbolo para formulação ou contaminação cruzada
- [x] Atualizar as MP da Fábrica III sem alterar outras fábricas
- [x] Verificar a correspondência entre MP, fornecedor e alergénios
- [x] Criar checkpoint da atualização da matriz

## Dados v3.8 — Receitas da Fábrica III a partir da aba formulação

- [x] Analisar a aba “formulação”, cabeçalhos e linhas de produto
- [x] Mapear gama, nome, versão e MP assinaladas com “x”
- [x] Validar correspondência das MP com a base de dados da Fábrica III
- [x] Criar uma receita por produto para a Fábrica III
- [x] Registar a gama e a versão nas observações da receita
- [x] Verificar receitas e ingredientes importados e criar checkpoint

- [x] v3.8: preparar importação idempotente da aba formulação, com relatório de correspondência e sem omitir marcações x
- [x] v3.8: criar como pendentes as MP auxiliares da formulação que não existam na Fábrica III, mantendo o perfil alergénico por validar
- [x] v3.8: confirmar cálculo do perfil Q1-Q6 para receitas importadas e actualizar testes
- [x] v3.7: matriz MP_SG importada com 62 MP, 30 presenças via formulação e 19 via contaminação; uma MP nova ficou pendente de FT e validação

## Melhoria v3.9 — Associação interativa Produto–Receita

- [x] Analisar o fluxo atual de produtos e receitas nas três fábricas
- [x] Criar uma interface interativa de associação Produto–Receita, filtrada pela fábrica respetiva
- [x] Permitir pesquisa, associação, substituição e remoção segura da receita associada
- [x] Verificar a integração com o cálculo de perfil alergénico e a geração de FTP
- [x] Atualizar testes, validar visualmente e criar checkpoint

## Melhoria v4.0 — Receção de Matérias-Primas

- [x] Extrair e confirmar os campos de controlo do modelo de receção fornecido
- [x] Criar o modelo de dados de receções, incluindo fábrica, armazém, fornecedor, MP, lote, validade, quantidade e responsável
- [x] Disponibilizar os três armazéns por fábrica: Ambiente/Secos, Frio e Embalagens
- [x] Registar os controlos de veículo, MP saco/granel, palete, produto e decisão de conformidade
- [x] Criar uma interface de registo e consulta com filtros, indicadores de conformidade e tratamento de não conformidades
- [x] Validar testes, interface e criar checkpoint

## Correção v4.1 — Legibilidade dos Controlos de Receção

- [x] Inspecionar o painel de controlos de receção em desktop e mobile
- [x] Corrigir sobreposições com uma grelha responsiva e áreas de ação separadas
- [x] Validar visualmente, executar testes e criar checkpoint

## Regra funcional v4.2 — Estado operacional por MP × Fábrica

- [x] Analisar as dependências do estado global de MP e os dados atuais por fábrica
- [x] Criar a relação MP × Fábrica com estado Ativa, Para testes ou Inativa
- [x] Migrar os estados existentes sem perder a associação atual das MP às fábricas
- [x] Atualizar os formulários, badges, filtros e validações para usar o estado da fábrica selecionada
- [x] Validar a regra com testes e criar checkpoint

## Correção v4.3 — Rótulo do separador Estado

- [x] Verificar o rótulo do separador indicado em Matérias-Primas
- [x] Alterar para “Estado” e validar a interface
- [x] Criar checkpoint da correção visual

## Correção v4.4 — Receções por fornecedor aprovado

- [x] Analisar o formulário de receções e a associação MP–Fornecedor
- [x] Filtrar as MP pelo fornecedor aprovado e pela fábrica selecionada
- [x] Limpar a MP selecionada quando o fornecedor ou fábrica deixam de ser compatíveis
- [x] Corrigir o aviso ResizeObserver em Receções
- [x] Validar testes, interface e criar checkpoint

## Correção v4.5 — Unidades de receção

- [x] Identificar as unidades usadas no formulário e no contrato de receções
- [x] Alterar as unidades disponíveis para Kg, Lt e Ton
- [x] Alterar o rótulo para “Fecho da boca de carga do silo”
- [x] Validar a alteração e criar checkpoint

## Regra funcional v4.6 — Perfis Logística e Qualidade

- [x] Analisar o modelo atual de utilizadores, permissões e operações de receções
- [x] Criar os perfis Logística e Qualidade no modelo de utilizadores
- [x] Restringir a Logística ao módulo de Receções no backend e na navegação
- [x] Reservar à Qualidade a eliminação de receções, com registo de auditoria
- [x] Validar permissões, testes e criar checkpoint

## Regra funcional v4.7 — Alerta de observações em receções

- [x] Analisar o registo de receções e o canal de notificação de Qualidade
- [x] Notificar a Qualidade quando uma receção tiver observações
- [x] Validar a condição de alerta, testes e criar checkpoint

## Melhoria v4.8 — Centro de notificações de Qualidade

- [x] Definir o modelo de notificações de Qualidade e o link direto à receção
- [x] Criar persistência, rotas e estados lida/não lida
- [x] Guardar uma notificação interna ao registar observações numa receção
- [x] Implementar o centro de notificações e a abertura direta da receção
- [x] Validar testes, interface e criar checkpoint

## Regra funcional v4.9 — Controlo de acesso por PIN

- [x] Definir operadores, perfis e regras de sessão por PIN
- [x] Criar persistência de PIN com hash e migração dos operadores iniciais
- [x] Implementar autenticação e encerramento de sessão por PIN
- [x] Aplicar a sessão por PIN às permissões e à interface
- [x] Validar perfis, segurança e testes e criar checkpoint

## Melhoria v4.11 — Seleção de utilizador no acesso por PIN

- [x] Expor os operadores ativos no painel de acesso sem revelar PINs
- [x] Permitir selecionar o utilizador antes de introduzir o PIN
- [x] Validar que o PIN corresponde ao utilizador selecionado
- [x] Validar interface, testes e criar checkpoint

## Correção v4.10 — Consulta operacional de Receções para Logística

- [x] Identificar a consulta de Receções que ainda requer Qualidade
- [x] Autorizar a Logística apenas na consulta operacional necessária
- [x] Validar o perfil Logística, testes e criar checkpoint

## Melhoria v4.12 — Configurações de utilizadores e PINs

- [x] Criar operações exclusivas de Qualidade para listar, adicionar e desativar operadores
- [x] Permitir alterar perfil e PIN sem armazenar códigos em texto legível
- [x] Implementar a página Configurações com gestão de utilizadores
- [x] Validar permissões, testes e criar checkpoint

## Correção v4.13 — Formulário e pesquisa de Receções responsivos

- [x] Inspecionar os campos e filtros atuais no painel de Receções
- [x] Reestruturar o formulário de registo para PC, tablet e telemóvel
- [x] Adicionar filtros de pesquisa de receções por MP, fornecedor, lote, guia, fábrica, armazém e conformidade
- [x] Validar interface responsiva, testes e criar checkpoint

## Correção v4.14 — Estabilidade visual de Receções

- [x] Inspecionar atualizações repetidas e registos do navegador em Receções
- [x] Corrigir a origem do efeito de piscar
- [x] Validar estabilidade, testes e criar checkpoint

## Correção v4.15 — Dimensionamento fluído do formulário de Receções

- [x] Analisar os pontos de compressão de campos e textos em tablet e telemóvel
- [x] Aplicar grelhas fluídas, larguras mínimas e quebras seguras aos campos
- [x] Validar em telemóvel, tablet e desktop e criar checkpoint

## Melhoria v4.16 — Intervalo de datas nas Receções

- [x] Analisar o formato das datas e os filtros existentes nas Receções
- [x] Adicionar data inicial e data final à pesquisa combinada
- [x] Validar filtro, testes e criar checkpoint

## Melhoria v4.17 — Transferências de MP e responsável de receção

- [x] Analisar associações MP × Fábrica e o registo atual de receções
- [x] Criar transferência auditada de uma MP para uma fábrica de destino
- [x] Tornar explícito o campo Responsável pela receção no formulário e no histórico
- [x] Validar rastreabilidade, testes e criar checkpoint

## Correção v4.18 — Navegação após acesso por PIN

- [x] Inspecionar sessão PIN, rotas protegidas e registos do navegador
- [x] Tornar explícita a limitação do perfil Logística e disponibilizar troca de utilizador
- [x] Corrigir o bloqueio que impede navegar nos módulos autorizados
- [x] Validar o acesso às páginas e criar checkpoint

## Correção v4.19 — Visibilidade de transferências de MP

- [x] Localizar a ação de transferência e a condição de visibilidade atual
- [x] Expor a transferência num local visível do painel de Matérias-Primas para Qualidade
- [x] Validar o acesso e criar checkpoint

## Correção v4.20 — Transferência física de stock em Receções

- [x] Remover a transferência do detalhe de Matérias-Primas
- [x] Adaptar a transferência a movimento físico com data, quantidade, responsável e motivo
- [x] Criar a ação de transferência entre fábricas no painel de Receções
- [x] Validar rastreabilidade, testes e criar checkpoint

## Correção v4.21 — Transferência por receção e lote

- [x] Associar a transferência a uma receção, lote e MP de origem específicos
- [x] Calcular e validar a quantidade ainda disponível para transferência desse lote
- [x] Criar a ação de transferir a partir do registo da receção
- [x] Registar data, quantidade, responsável e motivo em cada movimento
- [x] Validar rastreabilidade, testes e criar checkpoint

## Melhoria v4.22 — Utilizadores de Logística e permissões configuráveis

- [x] Rever operadores existentes e o modelo de administração de permissões
- [x] Criar Richard Dias, Marcelo Loureiro, Pedro Magina e Pedro Lemos como utilizadores de Logística
- [x] Permitir à Responsável de Qualidade gerir perfis, estados de acesso e permissões operacionais
- [x] Validar apresentação no acesso por PIN, testes e criar checkpoint

## Correção v4.23 — Ação de transferência de lote em Receções

- [x] Inspecionar a condição que controla a visibilidade da transferência por lote
- [x] Tornar a ação acessível no registo de receção e lote correto
- [x] Validar a operação para Qualidade, testes e criar checkpoint

## Correção v4.24 — Transferência e histórico por receção

- [x] Expor a ação de transferência em cada matéria-prima rececionada elegível
- [x] Criar o detalhe expandido da receção e do lote
- [x] Mostrar no detalhe o histórico completo de transferências associadas ao lote
- [x] Validar rastreabilidade, testes e criar checkpoint

## Melhoria v4.25 — Transferência acessível a todos os utilizadores

- [x] Rever a autorização atual de transferência de lote
- [x] Permitir a transferência aos utilizadores de Logística e Qualidade
- [x] Substituir o texto da ação por ícone com tooltip acessível
- [x] Adicionar um filtro específico por lote nas Receções
- [x] Criar um painel informativo de receções acessível a todos os operadores
- [x] Limitar a edição à equipa de Qualidade ou ao responsável que registou a receção
- [x] Confirmar a eliminação de receções exclusivamente pela equipa de Qualidade
- [x] Validar permissões, interface e criar checkpoint

## Melhoria v4.26 — Validações no detalhe de receção

- [x] Rever a estrutura de controlos registados em cada receção
- [x] Mostrar todas as validações efetuadas no detalhe do lote
- [x] Validar apresentação e criar checkpoint

## Correção v4.27 — Controlos exclusivos de MP a granel

- [x] Identificar o tipo de fornecimento da MP na receção
- [x] Marcar selo, silo, crivo e fecho de carga como Não Aplicável para MP em saco
- [x] Validar formulário, detalhe de lote e criar checkpoint

## Correção v4.28 — Rótulo de validação da MP

- [x] Verificar o rótulo de validação indicado no detalhe da receção
- [x] Alterar o rótulo para “Conformidade da MP”
- [x] Validar e criar checkpoint

## Correção v4.29 — Rótulo de conformidade do veículo

- [x] Verificar o rótulo indicado no formulário de Receções
- [x] Alterar o rótulo para “Conformidade do Veículo”
- [x] Validar e criar checkpoint

## Melhoria v4.30 — Unidades Cx e Unid

- [x] Rever a definição e utilização das unidades de receção
- [x] Adicionar Cx e Unid ao formulário, validação e apresentação
- [x] Validar unidades e criar checkpoint

## Correção v4.31 — Acesso ao Dashboard

- [x] Inspecionar sessão, consola, rede e pedidos do Dashboard
- [x] Corrigir o bloqueio que impede trabalhar no Dashboard
- [x] Validar o acesso e criar checkpoint

## Melhoria v4.32 — Gestão granular de permissões

- [x] Rever operadores e permissões atuais
- [x] Remover o utilizador genérico Logística
- [x] Criar a página de permissões individuais por utilizador
- [x] Validar permissões, testes e criar checkpoint

## Correção v4.33 — Acesso a fornecedores

- [x] Inspecionar sessão, permissões, rotas e erros de fornecedores
- [x] Corrigir a consulta e criação de fornecedores
- [x] Validar os fluxos e criar checkpoint

## Correção v4.34 — Bloqueio na criação de dados mestre

- [x] Diagnosticar o bloqueio na criação de matérias-primas e fornecedores
- [x] Corrigir permissões, validações ou interface que impedem a criação
- [x] Validar os dois fluxos e publicar checkpoint

## Melhoria v4.35 — Validação contextualizada de dados mestre

- [x] Rever requisitos obrigatórios nos formulários de Nova MP e Novo Fornecedor
- [x] Mostrar mensagens de validação junto aos campos inválidos
- [x] Validar os dois fluxos, testes e publicar checkpoint

## Correção v4.36 — Erro de criação de dados mestre

- [x] Reproduzir e identificar o erro na criação de fornecedor e matéria-prima
- [x] Corrigir a causa sem bloquear os fluxos de gravação autorizados
- [x] Validar criação, testes e publicar checkpoint

## Correção v4.37 — Acesso e execução de ações

- [x] Reproduzir o bloqueio de acesso aos módulos e instruções reportado
- [x] Corrigir a falha de sessão, navegação ou execução de ações
- [x] Validar o acesso e os fluxos críticos e publicar checkpoint

## Correção v4.38 — Criação crítica de fornecedor e MP

- [x] Reproduzir uma criação real reversível de fornecedor e matéria-prima no domínio publicado
- [x] Corrigir a falha identificada no fluxo de criação
- [x] Validar operações reais, testes e publicar checkpoint

## Correção v4.39 — Botões Criar novo

- [x] Isolar o clique dos botões Criar novo de fornecedor e MP
- [x] Corrigir a abertura dos respetivos painéis de criação
- [x] Validar os botões, testes e publicar checkpoint

## Melhoria v4.40 — Forma de fornecimento Unidades

- [x] Rever o modelo atual de formas de fornecimento e a referência visual
- [x] Adicionar Unidades ao formulário e aos dados logísticos de MP
- [x] Validar a nova opção, testes e publicar checkpoint

## Melhoria v4.41 — Responsável no cartão de receção

- [x] Rever os dados disponíveis e o cartão resumido de receção
- [x] Mostrar o responsável que registou a receção no cartão
- [x] Validar a apresentação, testes e publicar checkpoint

## Correção v4.42 — Eliminação de receções dependentes

- [x] Identificar os registos que bloqueiam a eliminação de receções
- [x] Limpar transferências, receções e dependências de teste
- [x] Corrigir a eliminação segura de receções e dependências
- [x] Validar o fluxo, testes e publicar checkpoint

## Aplicação móvel SIGA

- [x] Definir o formato como aplicação web instalável em telemóvel
- [x] Configurar instalação e identidade da aplicação móvel
- [x] Otimizar acesso PIN, receções, lotes e transferências em telemóvel
- [x] Validar os fluxos móveis e publicar a primeira versão

## Melhoria v4.43 — Validade no detalhe de receção

- [x] Rever os dados de validade disponíveis na receção
- [x] Substituir a guia pela validade do produto no cartão e detalhe do lote
- [x] Validar a apresentação, testes e publicar checkpoint

## Melhoria v4.44 — Validade mínima à receção

- [x] Definir e persistir a validade estipulada por matéria-prima e fornecedor em meses
- [x] Mostrar a validade por fornecedor no formulário e detalhe de matéria-prima
- [x] Alertar receções com validade restante inferior a 2/3 da validade do fornecedor selecionado
- [x] Validar o cálculo, testes e publicar checkpoint

## Correção v4.45 — Atalho de detalhe de matéria-prima

- [x] Rever o atalho de matéria-prima no painel de fornecedor
- [x] Abrir diretamente o painel informativo da matéria-prima selecionada
- [x] Validar a navegação, testes e publicar checkpoint

## Regra v4.46 — Aprovação de validade abaixo do mínimo

- [x] Identificar de forma segura a Responsável da Qualidade
- [x] Bloquear a gravação abaixo de 2/3 para os restantes utilizadores
- [x] Indicar a autorização necessária no formulário de receção
- [x] Validar perfis, testes e publicar checkpoint

## Regra v4.47 — Exceção de validade pela Qualidade

- [x] Rever a autorização atual para validade abaixo do mínimo
- [x] Permitir a exceção a qualquer membro da Qualidade
- [x] Manter o bloqueio para Logística e validar perfis, testes e checkpoint

## Melhoria v4.48 — Controlos específicos para receção a granel

- [x] Identificar Farinha de Trigo 65, Farinha de Centeio 130 e Pellets como MP elegíveis
- [x] Mostrar a escolha saco/granel antes dos pontos de controlo apenas para MP elegíveis
- [x] Dispensar a Conformidade do Veículo quando a receção é a granel
- [x] Substituir a orientação do alerta por contacto com a Equipa da Qualidade
- [x] Validar os controlos, testes e publicar checkpoint

## Melhoria v4.49 — Validação condicional de receções

- [x] Definir estados de pendente, validada e recusada para receções condicionais
- [x] Guardar a decisão, o responsável e a justificação de validação ou recusa
- [x] Criar alerta de Qualidade para validade insuficiente ou qualquer não conformidade
- [x] Restringir o acesso operacional até à validação da receção
- [x] Validar o fluxo completo, testes e publicar checkpoint

## Melhoria v4.50 — Tratamento de decisão de Qualidade

- [x] Exigir fundamento de aceitação ou recusa no tratamento condicional
- [x] Mostrar a decisão, o validador e a data no detalhe da receção
- [x] Mostrar o fundamento registado pela Qualidade no detalhe da receção
- [x] Criar tratamento estruturado de não conformidade com responsáveis, prazos e evidências
- [x] Mostrar o número de notificações pendentes no acesso ao centro de notificações
- [x] (Adiado) Enviar e-mail à Joana Pina e Sabrina Esteves para alertas de tratamento de Qualidade
- [x] (Adiado) Avaliar e configurar SMS para alertas críticos da Qualidade
- [x] (Adiado por decisão da utilizadora) Configurar WhatsApp Business oficial para alertas críticos à Joana Pina
- [x] Validar o fluxo web, testes e publicar checkpoint

## Correção v4.51 — Decisão de receção condicional

- [x] Reproduzir o bloqueio do botão de validação ou recusa
- [x] Corrigir a validação do fundamento e a ação de decisão
- [x] Validar o ciclo completo, testes e publicar checkpoint

## Correção v4.52 — Alerta imediato de validade mínima

- [x] Reproduzir a ausência de alerta no formulário de nova receção
- [x] Corrigir o cálculo reativo de validade mínima por fornecedor
- [x] Mostrar o alerta antes da gravação para qualquer operador
- [x] Validar o alerta, testes e publicar checkpoint

## Nova funcionalidade — Perfil Gestão com consulta global

- [x] Criar o utilizador PIN Gestão (2403) com perfil de consulta global
- [x] Permitir navegação e consulta a todos os módulos sem operações de escrita
- [x] Validar autenticação, bloqueios de escrita, testes e publicação


## Nova funcionalidade — Perfil Gestão com consulta global

- [x] Criar o utilizador PIN Gestão (2403) com perfil de consulta global
- [x] Permitir navegação e consulta a todos os módulos sem operações de escrita
- [x] Validar autenticação, bloqueios de escrita, testes e publicação


## Nova tarefa — Agente de vigilância RASFF semanal

- [x] Analisar o anexo e confirmar fontes públicas/oficiais do RASFF
- [x] Definir critérios de correspondência com MP, fornecedores, fábricas e origens
- [x] Criar painel, histórico e relatório semanal descarregável
- [x] Configurar execução recorrente às segundas-feiras às 07:00
- [x] Validar testes, cobertura, limitações e publicação


## Correção — Período civil e arquivo semanal RASFF

- [x] Alterar o período analisado para domingo 00:00 até sábado 23:59
- [x] Guardar e apresentar cada relatório com o número da semana
- [x] Atualizar o agente, testar e publicar a alteração


## Melhoria — Alertas internos para RASFF relevante

- [x] Criar alerta interno para cada ocorrência RASFF potencialmente relevante para MP, fornecedor ou origem
- [x] Evitar duplicados e ligar o alerta ao relatório semanal e à ocorrência correspondente
- [x] Mostrar a relevância no centro de notificações e no relatório semanal


## Melhoria — Análise de ficheiro RASFF

- [x] Definir formatos suportados, limites e campos reconhecidos
- [x] Implementar carregamento seguro e análise estruturada de vários alertas
- [x] Gerar resumo, correspondências e alertas internos para a Qualidade
- [x] Adicionar upload, resultados e download do resumo no painel RASFF
- [x] Validar testes, segurança e publicação


## Melhoria — Metodologia e fontes da vigilância RASFF

- [x] Explicar a metodologia de leitura, filtragem, cruzamento e classificação
- [x] Apresentar a matriz de relevância por categoria, perigo e relação com MP/origem
- [x] Mostrar as fontes oficiais e limitações de cobertura no painel e no relatório
- [x] Validar a interface e publicar a melhoria


## Correção — Resumo completo de incidências BPHF

- [x] (Cancelado — pertence a outro projeto) Adicionar o campo de colaborador inspecionado ao registo de incidência
- [x] (Cancelado — pertence a outro projeto) Mostrar o colaborador no cartão e no detalhe, com contexto completo da incidência
- [x] (Cancelado — pertence a outro projeto) Validar formulário, persistência, testes e publicação


## Correção — Limiar de NC BPHF por colaborador

- [x] (Cancelado — pertence a outro projeto) Contar incidências pelo colaborador inspecionado, não pelo ponto de verificação
- [x] (Cancelado — pertence a outro projeto) Emitir alerta de abertura de NC ao atingir a terceira incidência do colaborador
- [x] (Cancelado — pertence a outro projeto) Validar regra, interface, testes e publicação


## Melhoria — Sinal extra de tendência por origem no RASFF

- [x] Atualizar a matriz com categorias, perigos e prioridades da referência
- [x] Classificar trigo, farinha e centeio por país de origem como vigilância de tendência
- [x] Alinhar o agente, validar a apresentação e publicar


## Correção — Parsing de ficheiros RASFF

- [x] Detetar contentores binários/Office e impedir a apresentação de bytes ilegíveis
- [x] Interpretar corretamente formatos suportados ou rejeitar formatos não reconhecidos
- [x] Mostrar mensagens de erro úteis e validar testes/publicação


## Melhoria — Exportação Excel e filtros da análise RASFF

- [x] Acrescentar filtro por prioridade
- [x] Acrescentar filtros por data inicial e final do alerta
- [x] Permitir descarregar o resumo filtrado em ficheiro Excel
- [x] Validar testes, interface e publicação


## Melhoria — Hiperligação da fonte original dos alertas RASFF

- [x] Reconhecer e validar URLs de origem nas linhas/ocorrências analisadas
- [x] Abrir a fonte original ao selecionar um alerta, em novo separador
- [x] Indicar claramente quando não existe URL e validar testes/publicação


## Melhoria — Filtro por número de alerta RASFF

- [x] Extrair e apresentar o número do alerta RASFF quando reconhecido
- [x] Filtrar resultados pelo número do alerta
- [x] Incluir o número no resumo e na exportação Excel e validar publicação


## Correção — Alertas RASFF ausentes no filtro de agosto

- [x] Reproduzir a análise mensal de agosto e identificar a causa
- [x] Corrigir parsing de datas e filtragem sem perder alertas
- [x] Mostrar aviso explícito para datas não reconhecidas e validar publicação


## Melhoria — Filtro por MP afetada na análise RASFF

- [x] Adicionar seleção de MP afetada com base nas correspondências encontradas
- [x] Aplicar o filtro à lista, resumo e exportação Excel
- [x] Validar a pesquisa, limpar filtros, testes e publicação


## Melhoria — Ordenação cronológica dos alertas RASFF

- [x] Ordenar os resultados por data do alerta, do mais recente para o mais antigo
- [x] Colocar alertas sem data reconhecida no final da lista
- [x] Aplicar a ordem ao resumo e Excel e validar publicação


## Melhoria — Prioridades RASFF editáveis e aprendizagem assistida

- [x] Permitir à Qualidade editar a prioridade de cada alerta
- [x] Guardar aprendizagem local das alterações de prioridade; auditoria central de utilizador fica para evolução futura
- [x] Criar sugestões assistidas com base nas categorizações aprovadas
- [x] Aplicar a prioridade editada à lista, filtros, resumo e Excel
- [x] Validar segurança, testes e publicação


## Melhoria — Confiança das sugestões IA RASFF

- [x] Acrescentar confiança estruturada na resposta do assistente IA
- [x] Mostrar indicador visual e legenda de confiança por sugestão
- [x] Validar testes, interface e publicação


## Correção — Remover resumo Markdown da análise RASFF

- [x] Remover botão e função de descarga Markdown
- [x] Atualizar textos para indicar Excel como formato de exportação
- [x] Validar filtros, exportação Excel, testes e publicação


## Melhoria — Pesquisa livre na análise RASFF

- [x] Adicionar campo de pesquisa livre aos filtros
- [x] Pesquisar conteúdo, número, prioridade, MP e origem em simultâneo
- [x] Atualizar limpeza, exportação Excel e validar testes/publicação


## Correção — Arquivo integral e histórico de análises manuais RASFF

- [x] Identificar porque algumas linhas/alertas do ficheiro não são apresentadas
- [x] Mostrar contagem total, reconhecidos, não reconhecidos e filtrados sem ocultação silenciosa
- [x] Guardar análises manuais no histórico com nome do ficheiro e período
- [x] Permitir consultar e descarregar análises manuais arquivadas
- [x] Validar persistência, testes, interface e publicação


## Correção — Estado do fluxo semanal RASFF

- [x] Confirmar o estado real da tarefa agendada e o identificador configurado
- [x] Corrigir a indicação “Ainda não ativado” no painel
- [x] Validar atualização do estado, testes e publicação


## Correção — Guardar relatório RASFF com muitas fontes

- [x] Aumentar o limite de fontes sem truncar o relatório
- [x] Testar o armazenamento com mais de 100 fontes
- [x] Validar ocorrências, testes e publicação


## Correção — Prioridade informativa e edição isolada RASFF

- [x] Impedir ação direta quando a prioridade é Informativa
- [x] Garantir que a edição de prioridade altera apenas o alerta selecionado
- [x] Isolar aprendizagem/sugestão por alerta e validar testes/publicação


## Correção — Gravação de análises manuais RASFF

- [x] Reproduzir a falha de gravação e localizar a causa no fluxo completo
- [x] Corrigir a validação, mutação ou persistência sem perder alertas
- [x] Garantir feedback e atualização do histórico, com testes e publicação


## Nova funcionalidade — Vigilância automática Food Fraud

- [x] Analisar o registo mensal e definir fontes públicas e periodicidade
- [x] Definir matriz de risco e correspondência com MP, fornecedores e origens
- [x] Criar painel, histórico e relatório descarregável de Food Fraud
- [x] Ligar agente automático, callback, notificações e agendamento
- [x] Validar testes, segurança, publicação e limitações


## Decisão — Periodicidade da vigilância Food Fraud

- [x] Periodicidade confirmada: mensal, alinhada com o Registo Mensal PQ-FF-01


## Melhoria v4.0 — Vigilância Food Fraud
- [x] Implementar API e persistência mensal Food Fraud
- [x] Integrar página Food Fraud nas rotas e navegação global
- [x] Montar callback mensal autenticado e idempotente em /api/scheduled/foodfraud
- [x] Criar testes Vitest para cálculo de risco e persistência do relatório Food Fraud
- [x] Verificar visualmente o painel Food Fraud e guardar checkpoint publicado

## Melhoria v4.1 — Formatos adicionais na análise Food Fraud
- [x] Suportar ficheiros Excel (.xlsx, .xls, .xlsm, .ods)
- [x] Suportar ficheiros Word (.docx, .doc)
- [x] Suportar ficheiros PDF
- [x] Suportar imagens JPG/JPEG e PNG com extração de texto/OCR
- [x] Atualizar validações, textos da interface e testes
- [x] Verificar visualmente e publicar checkpoint

## Correção v4.2 — Worker PDF.js
- [x] Corrigir a configuração GlobalWorkerOptions.workerSrc no leitor PDF
- [x] Validar carregamento de PDF, testes e build
- [x] Publicar checkpoint da correção
