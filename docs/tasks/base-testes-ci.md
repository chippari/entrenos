# Tasks: base de testes e CI

| ID | O que faz | Cláusulas | Depende de | Tamanho | Critério de aceite (binário) | Issue / PR | Status |
|---|---|---|---|---|---|---|---|
| T-01 | Instalar Vitest, config e scripts | infraestrutura | nenhuma | S | vitest --version = 5.1.0; npm test, lint, tsc e build passam | #1 / #2 | Concluída |
| T-02 | Spec da keep-alive (legado) + testes de caracterização | RF-KA-01 a 05, RNF-KA-02 | T-01 | M | 1 teste por cláusula testável, todos passando; teste de sanidade mostra falha quando a regra é quebrada; lint e tsc passam | #3 / #5 | Concluída |
| T-03 | CI no GitHub Actions | infraestrutura | T-02 | S | Workflow roda lint, tipos e testes com cobertura em push e PR, e fica verde | a definir | Planejada |
| T-04 | Proteger a main (painel do GitHub) | infraestrutura | T-03 | S | PR sem CI verde não consegue fazer merge | a definir | Planejada |
