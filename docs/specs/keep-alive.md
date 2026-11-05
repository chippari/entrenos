# Spec: keep-alive (cron anti-pausa)

- Origem: código já existente (ciclo de legado, aula 6, A6 s.16–17). Extraída de src/app/api/keep-alive/route.ts em 05/11/2026.
- Decisão relacionada: ADR-19 (Vercel Cron).
- Escopo: rota GET /api/keep-alive, chamada 1x por dia pelo Vercel Cron.
- Regras de negócio (RB): nenhuma. É infraestrutura; não existe regra do domínio aqui.

## Requisitos

| ID | Padrão EARS | Cláusula |
|---|---|---|
| RF-KA-01 | Event-driven | WHEN a rota recebe GET com o cabeçalho Authorization igual a "Bearer <CRON_SECRET>", THE SYSTEM SHALL atualizar pinged_at da linha id = 1 da tabela keep_alive com o horário atual AND responder 200 com { ok: true, pinged_at }. |
| RF-KA-02 | Unwanted behavior | IF a variável CRON_SECRET não estiver configurada, THEN THE SYSTEM SHALL responder 500 com { ok: false, error: "CRON_SECRET não configurado" } AND não acessar o banco. |
| RF-KA-03 | Unwanted behavior | IF o cabeçalho Authorization estiver ausente ou for diferente de "Bearer <CRON_SECRET>", THEN THE SYSTEM SHALL responder 401 com { ok: false } AND não acessar o banco. |
| RF-KA-04 | Unwanted behavior | IF faltar a configuração do Supabase (URL ou chave secreta), THEN THE SYSTEM SHALL responder 500 com { ok: false, error: "configuração do Supabase ausente" } AND registrar em log só o nome da variável ausente. |
| RF-KA-05 | Unwanted behavior | IF o banco devolver erro na atualização, THEN THE SYSTEM SHALL responder 500 com { ok: false, error: "falha ao atualizar keep_alive" }. |
| RNF-KA-01 | Ubiquitous | THE SYSTEM SHALL comparar o cabeçalho Authorization com o segredo em tempo constante. |
| RNF-KA-02 | Ubiquitous | THE SYSTEM SHALL nunca incluir o valor de CRON_SECRET, de SUPABASE_SECRET_KEY ou do cabeçalho Authorization em respostas ou logs. |

## Verificação

| Cláusula | Como verificar |
|---|---|
| RF-KA-01 a RF-KA-05 | Teste unitário (tests/app/api/keep-alive/route.test.ts) |
| RNF-KA-01 | Revisão de código: tempo de execução não é verificável em teste unitário ⚠️ (confirmar com o professor) |
| RNF-KA-02 | Teste unitário com Mock em console.error (vi.spyOn + mockImplementation) e checagem do corpo das respostas |

## Observações da curadoria (05/11/2026)

- RF-KA-02 acontece ANTES da checagem de autorização: quem chama sem segredo descobre que a variável falta. Mantido por ser o comportamento atual (ciclo de legado). Mudança registrada na Issue #4 (bug, prioridade baixa).
- RNF-KA-01: quando os tamanhos são diferentes, a comparação termina antes (exigência do timingSafeEqual). Isso revela só o tamanho do valor recebido, nunca o conteúdo do segredo.
- RF-KA-04: nos testes, a detecção da variável ausente (feita em src/lib/supabase/admin.ts) é simulada por um dublê. O teste cobre como a ROTA reage; o admin.ts em si não é testado nesta task.
