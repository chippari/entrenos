# Identidade visual do EntreNós

- Origem: decisões V1 a V7 da Issue #34, tomadas antes dos mockups do bloco 1.
- Requisitos que esta identidade precisa cumprir: RNF-US-03 (contraste de texto), RNF-US-04 (contraste de bordas, botões, foco e ícones), RNF-US-10 (erro nunca só por cor) e RNF-US-11 (foco sempre visível), em `docs/specs/usabilidade.md`.
- Escopo: cores dos temas claro e escuro, cores de status, erro e foco, componentes básicos (botões e link), fonte, tamanhos de texto e ícones.
- Fora do escopo: aplicar as cores e a fonte no código (`globals.css`, `layout.tsx`), instalar a biblioteca de ícones, estados dos componentes (pressionado, desabilitado, passar o mouse), logo, ilustrações e o desenho das telas.

## Decisões

| ID | Decisão | Alternativas consideradas | Por quê |
|---|---|---|---|
| V1 | Verde como cor principal e terracota como acento | Verde-azulado com coral; verde-sálvia com mostarda; terracota como cor principal | O verde passa confiança e calma; o terracota passa calor de vizinhança. Terracota como cor principal foi descartado porque a família do vermelho é lida como erro ou alerta |
| V2 | Manter os temas claro e escuro, seguindo a preferência do aparelho | Só o tema claro | O projeto já tinha tema escuro, e o RNF-US-03 e o RNF-US-04 exigem contraste nos dois |
| V3 | Fonte Atkinson Hyperlegible Next, texto base de 18 px | Manter a Geist | Fonte feita para pessoas com baixa visão, com letras que não se confundem (I, l e 1; O e 0). O público inclui pessoas idosas |
| V4 | Ícones da biblioteca Lucide | Gerar ícones com IA de imagem | Ícones vetoriais no mesmo traço, que mudam de cor com o tema. Ícones gerados um a um saem em estilos diferentes e em pixels |
| V5 | Registro neste arquivo | Registrar só nos mockups | As cores precisam de uma fonte única de verdade, com o contraste conferido |
| V6 | Logo depois desta paleta, gerado com IA de imagem e finalizado em vetor (SVG) com as cores exatas | Logo antes da paleta | Assim o logo nasce dentro da paleta. Gerador de imagem não garante o código de cor exato |
| V7 | Selos de status com preenchimento claro no tema claro e escuro no tema escuro, e texto da mesma família de cor com pelo menos 4,5:1 sobre o preenchimento: Aberta verde, Aceita azul, Concluída cinza, Cancelada vermelho e aviso mostarda | Selo só com contorno; selo com a cor forte dos botões; outras combinações de cor | Selo só com contorno deixava as cores quase iguais. Selo com a cor dos botões parece botão. Verde para Concluída daria dois sentidos ao verde ("agir" e "já acabou") |

## Cores

| Nome | Tema claro | Tema escuro | Uso |
|---|---|---|---|
| `fundo` | `#F3F7F2` | `#0F1712` | Fundo da página |
| `cartao` | `#FFFFFF` | `#17221B` | Fundo de cartões, campos e botões secundários |
| `texto` | `#1C2E22` | `#E7F0E9` | Texto principal e texto de botões secundários |
| `texto-secundario` | `#4A5E50` | `#A8BBAE` | Informações de apoio (data, categoria) |
| `principal` | `#2F6B48` | `#7CC79A` | Botão principal (Aceitar, Confirmar, Publicar), links e nome do app |
| `texto-no-principal` | `#FFFFFF` | `#0D2016` | Texto sobre a cor `principal` |
| `acento` | `#B04A28` | `#F09A76` | Só o botão Pedir ajuda (RU-02) |
| `texto-no-acento` | `#FFFFFF` | `#2A1209` | Texto sobre a cor `acento` |
| `borda` | `#6E8274` | `#7D9384` | Bordas de cartões, campos e botões secundários |
| `erro` | `#B0213F` | `#FF8FA3` | Borda, ícone e mensagem de campo com erro (RU-03) |
| `foco` | `#1C2E22` | `#E7F0E9` | Contorno do foco do teclado (RU-01) |

## Componentes básicos

| Componente | Fundo | Borda | Texto | Onde aparece |
|---|---|---|---|---|
| Botão principal | `principal` | — | `texto-no-principal` | Aceitar, Confirmar, Publicar |
| Botão Pedir ajuda | `acento` | — | `texto-no-acento` | Só a entrada para criar uma solicitação (RU-02) |
| Botão secundário | `cartao` | `borda` | `texto` | Voltar, Detalhes e ações de menor peso |
| Link | — | — | `principal`, sublinhado | Links no meio de textos e de cartões |

Os estados desses componentes (pressionado, desabilitado, passar o mouse) são definidos nos mockups, seguindo a RU-07.

## Cores de status

Cada selo usa o preenchimento e o texto da tabela, sempre com ícone e palavra (RU-05).

| Status | Ícone | Preenchimento (claro) | Texto (claro) | Preenchimento (escuro) | Texto (escuro) |
|---|---|---|---|---|---|
| Aberta | círculo | `#DDF0E3` | `#1F5235` | `#1F3D2B` | `#A9E2BF` |
| Aceita | pessoa com sinal de certo | `#DCE9F6` | `#1D4A72` | `#1C3349` | `#B7D6F2` |
| Concluída | sinal de certo | `#E6EBE7` | `#3C4D41` | `#2A332D` | `#C9D6CD` |
| Cancelada | X | `#F8DDE2` | `#8A1C33` | `#4A1E28` | `#FFB8C4` |
| Aviso (rótulos de exibição) | relógio | `#F6EBCF` | `#5F4614` | `#3D3217` | `#EED69F` |

Os rótulos de exibição ("Horário passou, ninguém aceitou", "Aguardando sua confirmação", "Aguardando confirmação do solicitante") usam a cor de aviso. Eles não são status, e os textos ainda são exemplos ⚠️ (`docs/casos-de-uso/ciclo-da-solicitacao.md`, seção 5).

O preenchimento do selo fica perto da cor do cartão e do fundo (de 1,10:1 a 1,53:1). Isso não fere o RNF-US-04: o selo não tem borda, não é interativo, e a informação está no texto e no ícone, já conferidos a 4,5:1 ou mais.

## Contraste

Calculado pela razão de contraste da WCAG 2.2, a partir da luminância relativa de cada cor. Todos os pares usados passam no mínimo do critério.

| Par | Mínimo | Claro | Escuro | Critério |
|---|---|---|---|---|
| Texto sobre fundo | 4,5:1 | 13,26:1 | 15,66:1 | RNF-US-03 |
| Texto sobre cartão (inclui o botão secundário) | 4,5:1 | 14,35:1 | 14,08:1 | RNF-US-03 |
| Texto secundário sobre fundo | 4,5:1 | 6,45:1 | 9,02:1 | RNF-US-03 |
| Texto secundário sobre cartão | 4,5:1 | 6,98:1 | 8,11:1 | RNF-US-03 |
| Principal como texto sobre fundo (nome do app, links) | 4,5:1 | 5,85:1 | 9,11:1 | RNF-US-03 |
| Principal como texto sobre cartão (links) | 4,5:1 | 6,33:1 | 8,19:1 | RNF-US-03 |
| Texto no botão principal | 4,5:1 | 6,33:1 | 8,49:1 | RNF-US-03 |
| Texto no botão Pedir ajuda | 4,5:1 | 5,45:1 | 8,07:1 | RNF-US-03 |
| Erro como texto sobre cartão | 4,5:1 | 6,70:1 | 7,58:1 | RNF-US-03 |
| Erro como texto sobre fundo | 4,5:1 | 6,19:1 | 8,43:1 | RNF-US-03 |
| Selo Aberta (texto sobre preenchimento) | 4,5:1 | 7,62:1 | 8,13:1 | RNF-US-03 |
| Selo Aceita | 4,5:1 | 7,49:1 | 8,59:1 | RNF-US-03 |
| Selo Concluída | 4,5:1 | 7,47:1 | 8,69:1 | RNF-US-03 |
| Selo Cancelada | 4,5:1 | 7,16:1 | 8,56:1 | RNF-US-03 |
| Selo de aviso | 4,5:1 | 7,46:1 | 8,85:1 | RNF-US-03 |
| Botão principal contra o cartão | 3:1 | 6,33:1 | 8,19:1 | RNF-US-04 |
| Botão principal contra o fundo | 3:1 | 5,85:1 | 9,11:1 | RNF-US-04 |
| Botão Pedir ajuda contra o fundo | 3:1 | 5,03:1 | 8,33:1 | RNF-US-04 |
| Botão Pedir ajuda contra o cartão | 3:1 | 5,45:1 | 7,49:1 | RNF-US-04 |
| Borda contra o cartão (inclui o botão secundário) | 3:1 | 4,11:1 | 4,98:1 | RNF-US-04 |
| Borda contra o fundo | 3:1 | 3,80:1 | 5,54:1 | RNF-US-04 |
| Borda e ícone de campo com erro contra o cartão | 3:1 | 6,70:1 | 7,58:1 | RNF-US-04 |
| Foco contra o fundo | 3:1 | 13,26:1 | 15,66:1 | RNF-US-04 |
| Foco contra o cartão | 3:1 | 14,35:1 | 14,08:1 | RNF-US-04 |

**Pares que não passam e por isso são proibidos pelas regras de uso:**

| Par | Claro | Escuro | Regra que impede |
|---|---|---|---|
| Foco encostado no botão principal | 2,27:1 | 1,72:1 | RU-01 |
| Foco encostado no botão Pedir ajuda | 2,64:1 | 1,88:1 | RU-01 |
| Erro e acento lado a lado (mesmo brilho) | 1,23:1 | 1,01:1 | RU-02 e RU-03 |
| Texto da Cancelada e erro lado a lado (mesmo brilho) | 1,37:1 | 1,33:1 | RU-03 e RU-04 |

## Regras de uso

| ID | Regra | Por quê |
|---|---|---|
| RU-01 | O foco do teclado é um contorno de 2 px na cor `foco`, com 3 px de afastamento do elemento. Nunca encostado. | Encostado nos botões coloridos, o contraste fica abaixo de 3:1 (tabela acima). Com o afastamento, o contorno é comparado com o fundo ou o cartão |
| RU-02 | A cor `acento` só aparece no botão Pedir ajuda, que abre a criação de uma solicitação. O botão que envia o formulário (Publicar) usa a cor `principal`. Nunca há acento em texto, selo, aviso ou erro. | Mantém o terracota com um sentido só ("eu peço") e fora dos formulários, onde aparece o erro |
| RU-03 | A cor `erro` só aparece junto de um campo de formulário: na borda do campo, no ícone de alerta e na mensagem, sempre com texto (RNF-US-10). | Erro, acento e Cancelada têm brilho parecido; quem tem dificuldade com vermelhos pode confundir as cores, então o lugar, o ícone e o texto fazem a diferença |
| RU-04 | O vermelho da Cancelada só aparece no selo de status, com o ícone de X. | Mesmo motivo da RU-03 |
| RU-05 | Todo status aparece com ícone e palavra. A cor nunca é a única informação. | WCAG 1.4.1 |
| RU-06 | Selo usa só as cores da tabela "Cores de status". As cores `principal`, `acento` e `erro` nunca preenchem um selo. | Selo com a cor dos botões parece botão e convida a tocar |
| RU-07 | Nenhuma cor fora deste arquivo. Uma cor nova exige calcular o contraste e atualizar as tabelas no mesmo PR. | Mantém o arquivo como fonte única de verdade e a verificação do RNF-US-03 e do RNF-US-04 válida |

## Fonte e tamanhos

- **Fonte:** Atkinson Hyperlegible Next, com pesos 400 (normal) e 700 (negrito). Fonte de reserva: a fonte sem serifa do sistema. ⚠️ Carregamento pelo `next/font` a conferir quando a fonte for aplicada no código.
- **Texto base:** 18 px.
- **Títulos de cartão:** 18 px em negrito.
- **Selos de status:** 14 px em negrito.
- **Tamanho mínimo:** nenhum texto abaixo de 14 px.
- Texto grande, para o RNF-US-03, segue a DEF-US-05: pelo menos 24 px, ou 18,66 px em negrito.

## Ícones

- **Biblioteca:** Lucide, licença ISC (conferida no repositório do projeto em 05/11/2026). Pacote para React: `lucide-react`.
- Ícones que transmitem informação seguem o RNF-US-04 (contraste de 3:1) e, quando estão sozinhos num botão, o RNF-US-09 (nome falado pelo leitor de tela).
- Ícones usados até agora: círculo (Aberta), pessoa com sinal de certo (Aceita), sinal de certo (Concluída), X (Cancelada), relógio (aviso), alerta (erro). ⚠️ Os nomes exatos no Lucide são conferidos na instalação.

## Logo e imagens

- **Logo (V6):** gerado com IA de imagem a partir das cores `principal` e `acento` desta tabela e finalizado como vetor (SVG) com os códigos exatos. Precisa funcionar sobre o fundo claro e sobre o escuro.
- **Ilustrações:** sem texto dentro da imagem; cada imagem com texto alternativo, ou marcada como decorativa.
- ⚠️ Antes de publicar qualquer imagem gerada por IA no repositório público, conferir os termos de uso do serviço na versão em vigor.

## Observações

- Os números de contraste foram calculados por script a partir dos códigos de cor desta tabela e recalculados de forma independente na revisão da Issue #34. Qualquer pessoa pode refazer o cálculo com um verificador de contraste da WCAG.
- A RU-05 se apoia direto na WCAG 1.4.1. ⚠️ A spec `docs/specs/usabilidade.md` só cobre "nunca só por cor" para erros de preenchimento (RNF-US-10); estender essa regra a status e avisos fica como pendência da spec.
- O exemplo aprovado mostrou cores, fonte e status aplicados a cartões de solicitação. O desenho das telas é decidido nos mockups.
- O `src/app/globals.css` ainda tem as cores do modelo do Next (`#ffffff`, `#171717`, `#0a0a0a`, `#ededed`) e a fonte Arial no `body`, embora o `layout.tsx` carregue a Geist. Isso muda na fase das telas, junto com a aplicação desta identidade.
