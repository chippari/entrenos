# Tasks: fundação (constituição e arquitetura)

| ID | O que faz | Cláusulas | Depende de | Tamanho | Critério de aceite (binário) | Issue / PR | Status |
|---|---|---|---|---|---|---|---|
| T-06 | Criar docs/constitution.md e CLAUDE.md importando AGENTS.md e a constituição | P-01 a P-08, D-01 a D-03, PROC-01 a PROC-07 | nenhuma | S | constitution.md com P-01 a P-08, D-01 a D-03 e PROC-01 a PROC-07, cada um com verificação; CLAUDE.md importa AGENTS.md e a constituição; o /context de uma sessão nova do Claude Code lista os dois; CI verde | #9 / #10 | Concluída |
| T-07 | ADR de camadas: estrutura de pastas, direção dos imports e regra no ESLint; preencher a seção 4 da constituição | Seção 4 da constituição | T-06 | M | a definir no ADR | a definir | Planejada |
