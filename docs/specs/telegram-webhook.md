# Spec: webhook do Telegram (versão mínima)

- Origem: código novo. Segue o ciclo SDD + TDD (aula 6, A6 s.2 e s.9).
- Decisões relacionadas: ADR-20 (Telegram), ADR-27 (camadas). Constituição: P-05, P-06 e P-08.
- Escopo: rota `POST /api/telegram/webhook`, chamada pelo Telegram. O webhook é registrado com `allowed_updates: ["message"]`.
- Fora do escopo: conectar a conta do Telegram a um usuário (RF23), notificações (RF07), botões (`callback_query`) e qualquer leitura ou escrita de dados de comunidade.

## Regras de negócio

| ID | Regra |
|---|---|
| RB-TW-01 | Um chat do Telegram que não está vinculado a um usuário ativo só recebe as instruções de como conectar a conta (P-05). Nesta versão, nenhum chat está vinculado. |

## Texto de instruções (TXT-TW-01)

> Olá! Eu sou o bot do EntreNós. Em breve você vai poder conectar sua conta pelo site: https://entrenos-teal.vercel.app

## Requisitos

| ID | Padrão EARS | Cláusula |
|---|---|---|
| RF-TW-01 | Event-driven | WHEN a rota recebe POST com o cabeçalho `X-Telegram-Bot-Api-Secret-Token` igual a `TELEGRAM_WEBHOOK_SECRET` e um corpo JSON com `update_id`, THE SYSTEM SHALL registrar o `update_id` como recebido antes de qualquer outro processamento AND responder 200. |
| RF-TW-02 | Unwanted behavior | IF o cabeçalho `X-Telegram-Bot-Api-Secret-Token` estiver ausente ou for diferente de `TELEGRAM_WEBHOOK_SECRET`, THEN THE SYSTEM SHALL responder 401 AND não ler o corpo, não acessar o banco e não enviar mensagem. |
| RF-TW-03 | Unwanted behavior | IF a variável `TELEGRAM_WEBHOOK_SECRET` não estiver configurada, THEN THE SYSTEM SHALL responder 401, igual ao RF-TW-02, AND registrar em log só o nome da variável ausente. |
| RF-TW-04 | Unwanted behavior | IF o corpo não for JSON válido ou não tiver `update_id` inteiro positivo, THEN THE SYSTEM SHALL responder 400 AND não acessar o banco. |
| RF-TW-05 | Unwanted behavior | IF o `update_id` já tiver sido registrado, THEN THE SYSTEM SHALL responder 200 AND não executar nenhuma ação. |
| RF-TW-06 | Unwanted behavior | IF o registro do `update_id` falhar, THEN THE SYSTEM SHALL responder 500 AND não enviar mensagem. |
| RF-TW-07 | Event-driven | WHEN um `update_id` novo traz uma mensagem de texto de um chat privado, THE SYSTEM SHALL enviar a esse chat o texto TXT-TW-01 (RB-TW-01). |
| RF-TW-08 | Unwanted behavior | IF um `update_id` novo não tiver `message`, ou a mensagem não tiver texto, ou o chat não for privado, THEN THE SYSTEM SHALL responder 200 AND não enviar mensagem. |
| RF-TW-09 | Unwanted behavior | IF o envio do texto TXT-TW-01 falhar, THEN THE SYSTEM SHALL registrar a falha em log AND responder 200. |
| RF-TW-10 | Unwanted behavior | IF `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL` ou `SUPABASE_SECRET_KEY` não estiverem configurados, THEN THE SYSTEM SHALL responder 500 AND registrar em log só o nome da variável ausente AND não registrar a atualização. |
| RNF-TW-01 | Ubiquitous | THE SYSTEM SHALL comparar o cabeçalho `X-Telegram-Bot-Api-Secret-Token` com o segredo em tempo constante. |
| RNF-TW-02 | Ubiquitous | THE SYSTEM SHALL nunca incluir o valor de `TELEGRAM_WEBHOOK_SECRET`, de `TELEGRAM_BOT_TOKEN`, de `SUPABASE_SECRET_KEY` ou do cabeçalho recebido em respostas ou logs. |
| RNF-TW-03 | Ubiquitous | THE SYSTEM SHALL nunca registrar em log o texto das mensagens recebidas nem o nome ou o nome de usuário de quem enviou. |
| RNF-TW-04 | Ubiquitous | THE SYSTEM SHALL guardar de cada atualização só o `update_id` e o horário de recebimento. |
| RNF-TW-05 | Ubiquitous | THE SYSTEM SHALL responder sempre em JSON no formato `{ ok: true }` ou `{ ok: false }`, sem o campo `method`. |

## Regra de ouro (cada WHEN com seus IF/THEN)

| WHEN | IF/THEN que cobrem a falha |
|---|---|
| RF-TW-01 (atualização recebida) | RF-TW-02 (segredo errado), RF-TW-03 (segredo não configurado), RF-TW-04 (corpo inválido), RF-TW-05 (repetida), RF-TW-06 (falha ao registrar), RF-TW-10 (configuração ausente) |
| RF-TW-07 (mensagem de texto privada) | RF-TW-08 (não é mensagem de texto privada), RF-TW-09 (falha ao enviar) |

## Verificação

| Cláusula | Como verificar |
|---|---|
| RF-TW-01, 05, 07, 08, 09, RB-TW-01, RNF-TW-03 | Testes unitários do caso de uso, com Fake do registro e Mock do envio (T-09) |
| RF-TW-01, 05 no banco real | Testes unitários da implementação do registro com dublê do cliente (T-10). A garantia de "uma vez só" vem da chave única no banco: verificada no caso de teste manual CT-TW-03 (`docs/testes/webhook-telegram-manual.md`) |
| RF-TW-07 (envio de fato), RNF-TW-02 (token) | Testes unitários da implementação do envio, com `fetch` simulado (T-11) |
| RF-TW-02, 03, 04, 06, 10, RNF-TW-02, 05 | Testes unitários da rota, com dublê do caso de uso (T-12) |
| RNF-TW-01 | Revisão de código, como na RNF-KA-01 (teste unitário não mede tempo) ⚠️ |
| RNF-TW-04 | Revisão da migration (T-10) |
| Todas | Roteiro de teste manual `docs/testes/webhook-telegram-manual.md` (T-13) |

## Observações

- Ordem escolhida (P-06): o `update_id` é registrado antes de processar. Se o envio falhar depois do registro (RF-TW-09), a resposta 200 evita um reenvio que seria ignorado de qualquer forma: a mensagem de instruções se perde, mas nada é executado duas vezes.
- RF-TW-03 aplica a lição da Issue #4: quem não está autorizado não descobre nada da configuração.
- O `update_id` é sequencial e o `chat.id` pode passar de 32 bits (até 52). No banco, os dois vão como `bigint`.
- RF-TW-10 (incluído na T-12): com configuração ausente, a resposta 500 faz o Telegram reenviar depois. Como o `update_id` não foi registrado, a mensagem ainda é processada quando a configuração for corrigida.
