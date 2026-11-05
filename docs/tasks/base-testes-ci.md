# Tasks: base de testes e CI

| ID | O que faz | Cláusulas | Depende de | Tamanho | Critério de aceite (binário) | Issue / PR | Status |
|---|---|---|---|---|---|---|---|
| T-01 | Instalar Vitest, config e scripts | infraestrutura | nenhuma | S | vitest --version = 5.1.0; npm test, lint, tsc e build passam | #1 / #2 | Concluída |
| T-02 | Spec da keep-alive (legado) + testes de caracterização | RF-KA-01 a 05, RNF-KA-02 | T-01 | M | 1 teste por cláusula testável, todos passando; teste de sanidade mostra falha quando a regra é quebrada; lint e tsc passam | #3 / #5 | Concluída |
| T-03 | CI no GitHub Actions | infraestrutura | T-02 | S | Workflow roda lint, tipos e testes com cobertura em push e PR, e fica verde | #6 / #7 | Concluída |
| T-04 | Proteger a main (painel do GitHub) | infraestrutura | T-03 | S | PR sem CI verde não consegue fazer merge | a definir | Planejada |
| T-05 | Spec (legado) e testes do src/lib/supabase/admin.ts; limite de cobertura nas 4 métricas | a definir na spec | T-03 | S | admin.ts coberto; CI exige 70% em lines, statements, branches e functions e fica verde | a definir | Planejada |

Observação (05/11/2026): na T-03 o limite de cobertura ficou só em lines e statements (70%), porque branches (68,75%) e functions (66,66%) ficam abaixo de 70% enquanto o admin.ts não tem teste. A T-05 resolve isso e sobe o limite para as 4 métricas. A métrica exigida pela aula não está definida (A8 s.14) ⚠️.
