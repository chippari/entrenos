# Roteiro de teste manual: webhook do Telegram

- Spec: `docs/specs/telegram-webhook.md`. Task: T-13.
- Executado em 05/11/2026, em produção, depois do deploy do PR #23.
- Formato: caso de teste com os 9 campos da aula 7 (A7 s.14–15).

## Pré-requisitos comuns

- Deploy de produção do commit `89aa8a8` (PR #23) com status Ready na Vercel.
- Variáveis `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SECRET_KEY` configuradas na Vercel (conferidas só pelo nome).
- Tabela `telegram_updates` aplicada, com RLS ligado e só `insert` para `service_role`.
- Webhook registrado com `setWebhook` (`secret_token`, `allowed_updates: ["message"]`, `drop_pending_updates: true`). O `getWebhookInfo` mostrou a URL certa, `pending_update_count: 0`, `allowed_updates: ["message"]` e nenhum `last_error_message`, antes e depois dos testes.

## Casos de teste

| Campo | CT-TW-01 |
|---|---|
| ID do teste | CT-TW-01 |
| Cenário | Requisição sem o cabeçalho de segredo é recusada (RF-TW-02) |
| Passos | `curl -i -X POST` para `https://entrenos-teal.vercel.app/api/telegram/webhook`, sem o cabeçalho `X-Telegram-Bot-Api-Secret-Token`, com corpo `{}` |
| Pré-requisitos | Pré-requisitos comuns |
| Plataforma | Produção na Vercel (função em `gru1`); `curl` no `cmd` do Windows |
| Dados do teste | Corpo `{}` |
| Resultados esperados | Status 401; resposta vinda da rota |
| Resultados obtidos | `HTTP/1.1 401 Unauthorized`; cabeçalho `X-Matched-Path: /api/telegram/webhook` |
| Status | Sucesso |

| Campo | CT-TW-02 |
|---|---|
| ID do teste | CT-TW-02 |
| Cenário | Mensagem de texto num chat privado recebe as instruções (RF-TW-01, RF-TW-07, RB-TW-01) |
| Passos | 1. No app do Telegram, abrir a conversa com o @EntreNosOficialBot. 2. Enviar `oi`. |
| Pré-requisitos | Pré-requisitos comuns |
| Plataforma | App do Telegram (chat privado do desenvolvedor); produção na Vercel |
| Dados do teste | Texto `oi`; `update_id` 680634978 |
| Resultados esperados | O bot responde com o texto TXT-TW-01; o `update_id` fica registrado |
| Resultados obtidos | Resposta com o texto TXT-TW-01, idêntico ao da spec; `update_id` 680634978 registrado na tabela |
| Status | Sucesso |

| Campo | CT-TW-03 |
|---|---|
| ID do teste | CT-TW-03 |
| Cenário | A mesma atualização enviada duas vezes gera uma única resposta (RF-TW-05, P-06; chave primária no banco real) |
| Passos | 1. `curl -X POST` para a rota, com o segredo certo e um corpo com `update_id` 1, mensagem de texto e chat privado do desenvolvedor. 2. Repetir exatamente o mesmo comando. |
| Pré-requisitos | Pré-requisitos comuns; o `update_id` 1 não estava registrado |
| Plataforma | `curl` no `cmd` do Windows; app do Telegram; produção na Vercel |
| Dados do teste | `update_id` 1; texto `teste de reenvio` |
| Resultados esperados | 1ª vez: `{"ok":true}` e uma resposta no Telegram. 2ª vez: `{"ok":true}` e nenhuma resposta nova |
| Resultados obtidos | 1ª vez: `{"ok":true}` e resposta recebida. 2ª vez: `{"ok":true}` e nenhuma mensagem nova; `update_id` 1 registrado uma única vez |
| Status | Sucesso |

| Campo | CT-TW-04 |
|---|---|
| ID do teste | CT-TW-04 |
| Cenário | Corpo que não é JSON, com o segredo certo, é recusado (RF-TW-04, RNF-TW-05) |
| Passos | `curl -s -X POST` para a rota, com o segredo certo e o corpo `nao e json` |
| Pré-requisitos | Pré-requisitos comuns |
| Plataforma | `curl` no `cmd` do Windows; produção na Vercel |
| Dados do teste | Corpo `nao e json` |
| Resultados esperados | Resposta `{"ok":false}` (status 400) |
| Resultados obtidos | Resposta `{"ok":false}`. O status não foi exibido (opção `-s`); o 400 está coberto pelos testes unitários da T-12 |
| Status | Sucesso |

| Campo | CT-TW-05 |
|---|---|
| ID do teste | CT-TW-05 |
| Cenário | O banco guarda só as atualizações processadas, com dados mínimos (RF-TW-01, RNF-TW-04) |
| Passos | No SQL Editor do Supabase: `select update_id, recebido_em from public.telegram_updates order by recebido_em;` |
| Pré-requisitos | CT-TW-02 e CT-TW-03 executados |
| Plataforma | SQL Editor do Supabase |
| Dados do teste | Atualizações 680634976 e 680634977, enviadas antes do `setWebhook` e descartadas pelo `drop_pending_updates` |
| Resultados esperados | Exatamente 2 linhas (680634978 e 1), só com `update_id` e `recebido_em`; as atualizações descartadas não aparecem |
| Resultados obtidos | 2 linhas: 680634978 e 1, só com as duas colunas; 680634976 e 680634977 ausentes |
| Status | Sucesso |

## Observações

- Os dados pessoais do Telegram (nome, nome de usuário e `chat.id`) foram omitidos deste arquivo de propósito: o repositório é público.
- O `update_id` 1 é um valor de teste, escolhido para nunca coincidir com os reais.
