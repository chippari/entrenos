# Tasks: webhook mínimo do Telegram

Spec: `docs/specs/telegram-webhook.md`. Camadas conforme a seção 4 da constituição (ADR-27).

| ID | O que faz | Cláusulas | Depende de | Tamanho | Critério de aceite (binário) | Issue / PR | Status |
|---|---|---|---|---|---|---|---|
| T-08 | Spec EARS do webhook e este arquivo de tasks | todas (redação) | T-07 | S | Spec com RB, RF e RNF identificados, cada WHEN com seus IF/THEN e uma forma de verificação por cláusula; tasks T-08 a T-13 com cláusulas, dependências, tamanho e critério; CI verde | #13 / #14 | Concluída |
| T-09 | Domínio (leitura da atualização, TXT-TW-01), portas `RegistroDeAtualizacoes` e `Mensageiro`, e caso de uso `processarAtualizacaoTelegram`, em TDD | RF-TW-01, 05, 06 (parte: não enviar), 07, 08, 09, RB-TW-01, RNF-TW-03 | T-08 | M | Testes escritos antes e vistos falhando; um teste por cláusula, todos passando; Fake do registro e Mock do envio; sem banco nem rede; lint, tipos e testes passam | #15 / #16 | Concluída |
| T-10 | Migration `telegram_updates` (RLS ligado, `grant` só para `service_role`) e implementação Supabase de `RegistroDeAtualizacoes` | RF-TW-01, 05, 06, RNF-TW-04, P-03 | T-09 | M | Migration revisada e aplicada; testes da implementação com dublê do cliente (registro novo, repetido e erro); lint, tipos e testes passam | a definir | Planejada |
| T-11 | Implementação Telegram de `Mensageiro` (`sendMessage`) | RF-TW-07, 09, RNF-TW-02 | T-09 | S | Testes com `fetch` simulado (envio certo, resposta de erro, falha de rede, token fora de logs); lint, tipos e testes passam | a definir | Planejada |
| T-12 | Rota `POST /api/telegram/webhook`: segredo em tempo constante, leitura do corpo e montagem do caso de uso, em TDD | RF-TW-02, 03, 04, 06, RNF-TW-01, 02, 05 | T-09, T-10, T-11 | M | Testes escritos antes e vistos falhando; um teste por cláusula, todos passando; lint, tipos e testes passam | a definir | Planejada |
| T-13 | Deploy, `setWebhook` (feito pelo desenvolvedor) e caso de teste manual no celular | todas | T-12 | S | Caso de teste manual com os 9 campos registrado; mensagem no celular recebe TXT-TW-01; mesma atualização reenviada não gera segunda resposta | a definir | Planejada |
