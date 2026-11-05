# Spec: usabilidade e acessibilidade (RNF01 e RNF02)

- Origem: decomposição do RNF01 ("criar/aceitar em até 3 toques") e do RNF02 ("leitor de tela, aumento de fonte, contraste") em critérios verificáveis, antes dos mockups (aula 3, A3 s.17 e s.25). Issue #32.
- Decisões relacionadas: D1 a D7 da Issue #32. Casos de uso: UC-01 e UC-02 (`docs/casos-de-uso/ciclo-da-solicitacao.md`). Constituição: P-01, P-02, P-04 e P-05.
- Escopo: todas as telas do webapp e todas as mensagens do bot.
- Fora do escopo: conformidade completa com a WCAG 2.2 nível AA; a acessibilidade do próprio aplicativo do Telegram; testes automáticos de acessibilidade; a identidade visual (paleta, fonte e ícones), que vem em outra Issue e precisa cumprir o RNF-US-03 e o RNF-US-04.

## Definições

| ID | Definição |
|---|---|
| DEF-US-01 | **Toque:** um toque ou clique que leva o fluxo adiante. Exemplos: abrir uma tela, escolher um item de uma lista, enviar, confirmar, tocar num botão de uma mensagem do bot. |
| DEF-US-02 | **Não conta como toque:** digitar, escolher um valor dentro de um campo do formulário (por exemplo categoria, data ou horário) e rolar a tela. |
| DEF-US-03 | **Início da contagem:** no webapp, a tela inicial, com sessão ativa e com a comunidade já escolhida. No bot, a mensagem de aviso recebida. |
| DEF-US-04 | **Fim da contagem:** o toque que faz a mudança acontecer (publicar ou confirmar a aceitação). |
| DEF-US-05 | **Texto grande:** texto com pelo menos 24 px, ou com pelo menos 18,66 px em negrito (equivale aos 18 pt e 14 pt em negrito da WCAG 2.2). |
| DEF-US-06 | **Elemento interativo:** botão, link, campo, item de lista que pode ser tocado ou botão de mensagem do bot. |

## Requisitos

| ID | Padrão EARS | Cláusula |
|---|---|---|
| RF-US-01 | Event-driven | WHEN um morador toca em Aceitar numa solicitação, no webapp ou no bot, THE SYSTEM SHALL pedir uma confirmação antes de aceitar AND dizer que, ao confirmar, ele passa a ver a unidade e o telefone do solicitante. |
| RF-US-02 | Unwanted behavior | IF o morador não confirma (no webapp, toca em Voltar ou sai da tela; no bot, toca em Voltar ou não toca em Confirmar), THEN THE SYSTEM SHALL manter a solicitação como estava AND não revelar a unidade nem o telefone do solicitante. |
| RNF-US-01 | Ubiquitous | THE SYSTEM SHALL permitir que um morador com vínculo ativo publique uma solicitação no webapp com no máximo 3 toques, contados como em DEF-US-01 a DEF-US-04. |
| RNF-US-02 | Ubiquitous | THE SYSTEM SHALL permitir que um morador com vínculo ativo aceite uma solicitação, no webapp ou no bot, com no máximo 3 toques, contados como em DEF-US-01 a DEF-US-04, incluindo o toque de confirmação do RF-US-01. |
| RNF-US-03 | Ubiquitous | THE SYSTEM SHALL exibir todo texto do webapp com contraste de pelo menos 4,5:1 contra o fundo, ou de pelo menos 3:1 para texto grande (DEF-US-05), no tema claro e no tema escuro, exceto texto de elemento desabilitado, texto só decorativo e texto que faz parte de um logotipo. |
| RNF-US-04 | Ubiquitous | THE SYSTEM SHALL exibir bordas de campos, botões, indicador de foco e ícones que transmitem informação com contraste de pelo menos 3:1 contra as cores vizinhas, no tema claro e no tema escuro, exceto em elemento desabilitado. |
| RNF-US-05 | Ubiquitous | THE SYSTEM SHALL manter todo conteúdo do webapp visível e toda função acionável, sem texto cortado ou sobreposto, com o zoom do navegador em 200%. |
| RNF-US-06 | Ubiquitous | THE SYSTEM SHALL exibir todas as telas do webapp numa largura de 320 px sem rolagem horizontal. |
| RNF-US-07 | Ubiquitous | THE SYSTEM SHALL dar a todo elemento interativo do webapp (DEF-US-06) uma área de toque de pelo menos 44 × 44 px, exceto links no meio de um parágrafo de texto. |
| RNF-US-08 | Ubiquitous | THE SYSTEM SHALL dar a todo campo de formulário do webapp um rótulo visível, ligado ao campo, que o leitor de tela lê ao entrar no campo. |
| RNF-US-09 | Ubiquitous | THE SYSTEM SHALL dar a todo botão e link do webapp, inclusive os que só têm ícone, um nome que o leitor de tela fala. |
| RNF-US-10 | Ubiquitous | THE SYSTEM SHALL indicar cada erro de preenchimento do webapp com um texto junto ao campo, que diz qual é o campo e o que corrigir, nunca só com cor. |
| RNF-US-11 | Ubiquitous | THE SYSTEM SHALL permitir usar todas as funções do webapp só com o teclado, com o foco passando pelos elementos na ordem em que aparecem na tela (de cima para baixo e da esquerda para a direita) e sempre visível. |
| RNF-US-12 | Ubiquitous | THE SYSTEM SHALL dar texto a todo botão das mensagens do bot; emoji nunca aparece sozinho num botão. |

## Regra de ouro (cada WHEN com seus IF/THEN)

| WHEN | IF/THEN que cobrem a falha |
|---|---|
| RF-US-01 (toca em Aceitar) | RF-US-02 (não confirma). Outro morador aceitou antes de confirmar, solicitação encerrada, horário vencido, próprio solicitante e vínculo não ativo: exceções E1 a E5 do UC-02. No bot, também as exceções EB-1 (chat não conectado) e EB-2 (sem vínculo ativo). Todas são conferidas no momento da confirmação. |

## Verificação

| Cláusula | Onde se confere | Como |
|---|---|---|
| RF-US-01, RF-US-02 | Mockup e, depois, teste da tela e do bot | Fluxo de aceitar mostra a confirmação com o aviso; o caminho Voltar não muda nada |
| RNF-US-01, RNF-US-02 | Mockup | Contar os toques em cada fluxo seguindo DEF-US-01 a DEF-US-04 e anotar o número no próprio mockup |
| RNF-US-03, RNF-US-04 | Mockup e tela | Contraste calculado para cada par de cores da paleta, nos dois temas, numa tabela da identidade visual |
| RNF-US-05 | Tela | Zoom do navegador em 200% e percorrer cada tela |
| RNF-US-06 | Tela | Janela com 320 px de largura; nenhuma tela com rolagem horizontal |
| RNF-US-07 | Mockup e tela | Medir a área de toque de cada elemento interativo |
| RNF-US-08, RNF-US-09 | Mockup (rótulo visível) e tela (leitor de tela ⚠️ a escolher) | Percorrer cada tela com o leitor de tela e conferir o que ele fala |
| RNF-US-10 | Mockup | Cada tela com formulário tem o estado de erro desenhado, com o texto do erro |
| RNF-US-11 | Tela | Percorrer cada fluxo só com Tab, Shift+Tab, Enter e Espaço e anotar a ordem do foco |
| RNF-US-12 | Catálogo de mensagens do bot | Conferir o texto de cada botão |

## Observações

- **Consequência para os mockups (RNF-US-02 com o RF-US-01):** com a confirmação, aceitar no webapp já gasta 3 toques a partir da lista (escolher, Aceitar, Confirmar). Então a tela inicial precisa já mostrar a lista de solicitações abertas, ou o botão Aceitar precisa estar no próprio item da lista. Se abrir a lista custar um toque, o RNF-US-02 falha. No bot, aceitar gasta 2 toques (Aceitar e Confirmar).
- **Relação com a constituição:** a confirmação não é um status e não registra Transição da solicitação; a máquina de estados continua a mesma (P-02). A aceitação só acontece no toque em Confirmar, e é nesse momento que vale a regra de aceitação única (P-01) e que o bot confere se o chat é de um usuário identificado com vínculo ativo (P-05). A confirmação existe para proteger a unidade e o telefone do solicitante de uma aceitação por engano (P-04).
- Os critérios RNF-US-03 a RNF-US-06 e RNF-US-08 a RNF-US-11 são um recorte do nível AA da WCAG 2.2, a versão em vigor do W3C. O RNF-US-07 (área de toque de 44 × 44 px) é do nível AAA (critério 2.5.5); a escolha do AAA nesse ponto vem do público, que inclui pessoas idosas. Este arquivo não declara conformidade completa com a WCAG.
- Origem de cada critério: RNF-US-01 e RNF-US-02 vêm do RNF01; RNF-US-03 a RNF-US-12 vêm do RNF02. Critérios da WCAG 2.2: 1.4.3 (RNF-US-03), 1.4.11 (RNF-US-04), 1.4.4 (RNF-US-05), 1.4.10 (RNF-US-06), 2.5.5 (RNF-US-07), 1.3.1 e 3.3.2 (RNF-US-08), 4.1.2 (RNF-US-09), 1.4.1, 3.3.1 e 3.3.3 (RNF-US-10), 2.1.1, 2.4.3 e 2.4.7 (RNF-US-11).
- O RF-US-01 e o RF-US-02 nasceram da decomposição do RNF01 (decisão D3). Por descreverem comportamento, ficam como RF (A3 s.20), não como RNF.
- O idioma da página em pt-BR já está em `src/app/layout.tsx` e não entrou como critério novo.
- Nesta versão, nenhum critério tem teste automático. A verificação é feita no mockup e, depois, na tela, pelos roteiros da tabela acima.
