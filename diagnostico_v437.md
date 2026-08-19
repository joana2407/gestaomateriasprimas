# Diagnóstico v4.37 — Acesso publicado

O ambiente publicado apresenta corretamente o ecrã de acesso por PIN e a lista dos perfis ativos. Foi iniciada a reprodução com o perfil de Qualidade para testar a sessão e os módulos exatamente no domínio utilizado pela equipa.

O perfil Joana Pina foi selecionado e o PIN de Qualidade foi introduzido no domínio publicado. O passo seguinte é confirmar o acesso e a navegação para os módulos de trabalho.

O acesso PIN de Qualidade concluiu no domínio publicado. O Dashboard carregou com navegação disponível para Matérias-Primas, Fornecedores, Receções e os restantes módulos, pelo que a sessão está funcional. Será agora testada uma ação de criação diretamente no módulo afetado.

No domínio publicado, a sessão de Qualidade abriu o módulo de Fornecedores e o painel de Novo Fornecedor sem bloqueio. A falha precisa, por isso, de ser isolada na submissão da criação e nas mensagens devolvidas pela API.

Foi preparada uma interceção temporária do pedido de criação para validar a estrutura enviada pelo formulário sem gravar dados de teste. A lista de elementos do navegador mudou durante essa preparação; a recolha será repetida com a referência atualizada.

No formulário publicado, a árvore de elementos continua a atualizar-se entre a recolha e o foco de um campo, deixando os controlos de criação obsoletos. Esta instabilidade pode explicar a perceção de que as instruções e ações não são executadas; a origem da atualização será agora investigada no cliente.

No domínio publicado, uma chamada protegida ao registo de fornecedor foi autorizada pela sessão de Qualidade e devolveu apenas o erro esperado de validação do nome vazio (HTTP 400), não um bloqueio de autenticação (401/403). A autorização e a API de criação estão, portanto, acessíveis na sessão reproduzida.

O painel de novo fornecedor permanece aberto na sessão publicada. A automação de foco por elemento revelou alterações constantes na árvore visual, sem evidência de falha de autorização; a validação continuará por observação dos pedidos de rede e simplificação do fluxo cliente, se necessária.
