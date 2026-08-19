# Diagnóstico v4.37 — Acesso publicado

O ambiente publicado apresenta corretamente o ecrã de acesso por PIN e a lista dos perfis ativos. Foi iniciada a reprodução com o perfil de Qualidade para testar a sessão e os módulos exatamente no domínio utilizado pela equipa.

O perfil Joana Pina foi selecionado e o PIN de Qualidade foi introduzido no domínio publicado. O passo seguinte é confirmar o acesso e a navegação para os módulos de trabalho.

O acesso PIN de Qualidade concluiu no domínio publicado. O Dashboard carregou com navegação disponível para Matérias-Primas, Fornecedores, Receções e os restantes módulos, pelo que a sessão está funcional. Será agora testada uma ação de criação diretamente no módulo afetado.

No domínio publicado, a sessão de Qualidade abriu o módulo de Fornecedores e o painel de Novo Fornecedor sem bloqueio. A falha precisa, por isso, de ser isolada na submissão da criação e nas mensagens devolvidas pela API.

Foi preparada uma interceção temporária do pedido de criação para validar a estrutura enviada pelo formulário sem gravar dados de teste. A lista de elementos do navegador mudou durante essa preparação; a recolha será repetida com a referência atualizada.

No formulário publicado, a árvore de elementos continua a atualizar-se entre a recolha e o foco de um campo, deixando os controlos de criação obsoletos. Esta instabilidade pode explicar a perceção de que as instruções e ações não são executadas; a origem da atualização será agora investigada no cliente.

No domínio publicado, uma chamada protegida ao registo de fornecedor foi autorizada pela sessão de Qualidade e devolveu apenas o erro esperado de validação do nome vazio (HTTP 400), não um bloqueio de autenticação (401/403). A autorização e a API de criação estão, portanto, acessíveis na sessão reproduzida.

O painel de novo fornecedor permanece aberto na sessão publicada. A automação de foco por elemento revelou alterações constantes na árvore visual, sem evidência de falha de autorização; a validação continuará por observação dos pedidos de rede e simplificação do fluxo cliente, se necessária.

Após o carregamento completo, a lista de fornecedores e o formulário de novo fornecedor ficam disponíveis no domínio publicado. A validação crítica seguirá pelo pedido de criação real e reversível, para isolar o comportamento sem depender da automação de foco do navegador.

Foi executada no domínio publicado uma criação técnica reversível pela API, seguida de desativação, ambas com HTTP 200. Foi também preenchido e submetido o próprio formulário de Novo Fornecedor: o registo técnico temporário foi criado com sucesso e devolveu o identificador 120002. O registo de interface será desativado na sequência desta validação.

O fornecedor técnico temporário criado pelo formulário foi desativado com sucesso. Foi também executada uma criação técnica reversível de Matéria-Prima, na Fábrica I, seguida de desativação: criação e eliminação devolveram HTTP 200. Os dois routers publicados aceitam e concluem a criação com uma sessão de Qualidade ativa.

O formulário publicado de Nova Matéria-Prima foi preenchido com nome e Fábrica I, submetido pelo próprio botão Criar MP e criou com sucesso o registo técnico temporário 480002. O registo será desativado de imediato, terminando a validação sem deixar dados ativos de teste.

A Matéria-Prima técnica temporária 480002 foi desativada com HTTP 200. A criação real, tanto de fornecedor como de matéria-prima, foi confirmada pelo próprio formulário no domínio publicado com uma sessão PIN de Qualidade; não ficaram registos técnicos ativos.

Foi iniciada a verificação do segundo domínio publicado, gestaomateriasprimas.manus.space, para excluir uma divergência entre os endereços usados pela equipa. No carregamento inicial, a lista de operadores PIN ainda não estava apresentada; será confirmado se conclui ou se representa uma falha específica deste domínio.

No segundo domínio, a lista de operadores PIN concluiu o carregamento corretamente. Não foi identificada uma divergência de versão entre os dois endereços publicados.
