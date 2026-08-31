# Notas de pesquisa — Vigilância RASFF

## Anexo recebido
O anexo propõe uma vigilância diária/semanal direcionada para panificação e pastelaria, com quatro etapas: consultar o RASFF Window; filtrar por categorias e perigos relevantes; classificar como direto, indireto ou informativo; e registar a decisão/ação. A matriz indicada cobre cereais e produtos de padaria; frutos de casca rija e sementes; frutas desidratadas; cacau/chocolate; leite/lacticínios; ovos/ovoprodutos; aditivos/aromas; e materiais em contacto com alimentos.

Os critérios sugeridos incluem micotoxinas, alergénios não declarados, Salmonella, aflatoxinas, pesticidas, sulfitos, óxido de etileno, metais pesados, resíduos de medicamentos veterinários, uso não autorizado e migração de materiais. O prompt do anexo pesquisa as últimas 48 horas e termina com recomendação de ação.

## Fonte oficial confirmada
A Comissão Europeia descreve o RASFF como um sistema de troca de informação entre autoridades para reação rápida perante riscos para a saúde pública na cadeia alimentar. A base legal indicada é o artigo 50.º do Regulamento (CE) n.º 178/2002.

A página oficial confirma que o acesso completo ao RASFF é reservado às autoridades dos países membros e à Comissão Europeia. O RASFF Window oferece ao público informação resumida e pesquisa de notificações, atualmente desde 2020, mas não revela detalhes comerciais como marcas e operadores económicos. Existe também um portal de consumidores para recolhas e avisos de saúde pública.

## Fontes
1. Comissão Europeia — RASFF: https://food.ec.europa.eu/food-safety/rasff_en
2. RASFF Window — pesquisa pública: https://webgate.ec.europa.eu/rasff-window/screen/search
3. RASFF Consumers' Portal: https://webgate.ec.europa.eu/rasff-window/screen/consumers
4. EU Open Data Portal — Food and Feed Alert Notifications: https://data.europa.eu/data/datasets/restored_rasff?locale=en

## Implicação de arquitetura
A solução deve tratar a consulta pública como triagem, não como substituto do acesso institucional ao RASFF. O agente deve guardar a fonte, data/hora da consulta, filtros aplicados e um nível de confiança; alertas diretos só podem ser classificados como confirmados quando houver correspondência nos registos internos de MP/fornecedor/origem e confirmação manual da Qualidade quando os dados públicos não expõem detalhes comerciais.

## Observação de consulta
No teste visual de 31/08/2026, o RASFF Window público permaneceu no ecrã de carregamento e não expôs elementos pesquisáveis no navegador automatizado. A implementação não deve depender exclusivamente de automação visual do portal; deve usar uma fonte estruturada pública quando disponível, com fallback para ligação de confirmação no RASFF Window e indicação explícita de falha/indisponibilidade no relatório.
