# Validação v4.35

O ambiente de desenvolvimento carregou corretamente o ecrã de acesso por PIN com os perfis individuais ativos. Foi preparada uma sessão de Qualidade e o painel de Novo Fornecedor abriu corretamente, sem criar dados de teste.

A submissão vazia apresentou a mensagem geral de correção. A confirmação da mensagem específica no campo será concluída através da inspeção do estado da interface.

O navegador está a receber o código atualizado que contém o manipulador de submissão e os identificadores de erro por campo. A página será recarregada para garantir que esse código é montado na interface ativa.

Após recarregar, a validação geral foi acionada novamente. A apresentação do estado específico do campo será revista antes da publicação.

Foi confirmado que o botão Criar executa o manipulador atualizado, incluindo a regra de obrigatoriedade do nome. A persistência do estado visual de erro está a ser analisada.

O manipulador confirmado define o mapa de erros e interrompe a criação quando encontra um campo inválido. A apresentação será reforçada para garantir que a mensagem permanece visível junto ao campo.

O ambiente foi reiniciado e a validação geral voltou a ser acionada. A visualização contextualizada será implementada sem depender de um estado transitório do formulário.

O formulário voltou a ser submetido sem dados após a persistência dos erros. A verificação de acessibilidade e da renderização do erro continua pendente antes da publicação.

Mesmo com a estabilização da abertura por rota, a mensagem específica ainda não foi refletida no DOM do formulário. Será aplicado um mecanismo explícito de apresentação de erros no próprio controlo para garantir a indicação junto a cada campo.

O mecanismo explícito foi acionado numa nova submissão de teste. A verificação final da mensagem visível será feita com inspeção direta do DOM antes de concluir a validação.

O manipulador ativo contém a chamada para apresentação explícita do erro. A inspeção do DOM não observou a mensagem, pelo que a indicação será renderizada diretamente a partir da ação de submissão.

A apresentação foi reagendada após a reconciliação da interface. A confirmação definitiva será recolhida por inspeção do DOM antes do checkpoint.
