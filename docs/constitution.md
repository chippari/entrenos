# Constituição do EntreNós

Princípios que nenhuma task pode violar. Todo agente e todo humano lê este arquivo antes de começar uma task.

- Base nas técnicas da aula 6 (A6 s.2, s.5, s.13): a constituição guarda só princípios **verificáveis**.
- Quem mantém: o desenvolvedor do projeto (papel de "tech lead" da A6 s.13).
- Como mudar: só por PR. Mudar ou retirar um princípio exige um ADR novo explicando o porquê.
- Como ler a "Situação": **Em vigor** = a verificação já existe e roda; **Prevista** = a verificação nasce junto com o primeiro código que toca o princípio.

## 1. Princípios do domínio

### P-01 — Aceitação única garantida no banco
- **Regra:** a troca Aberta → Aceita é uma operação atômica condicionada ao status atual (`UPDATE ... WHERE id = $1 AND status = 'aberta' RETURNING`). Nunca "consultar e depois gravar". Se nenhuma linha voltar, alguém aceitou antes e a aceitação é recusada.
- **Porquê:** webapp e bot podem aceitar a mesma solicitação no mesmo segundo (RF09).
- **Verificação:** teste de integração contra um Postgres real, com duas aceitações simultâneas: só uma vence. Teste unitário com Fake não prova atomicidade. Revisão: nenhum caminho de aceitação lê o status para decidir antes de gravar.
- **Situação:** Prevista.

### P-02 — Máquina de estados única
- **Regra:** transições válidas da solicitação:
  - Aberta → Aceita (outro morador; o solicitante nunca aceita a própria solicitação);
  - Aceita → Aberta (o apoiador desiste);
  - Aberta → Cancelada e Aceita → Cancelada (o solicitante cancela);
  - Aceita → Concluída (o solicitante confirma).
  
  Concluída e Cancelada são finais. Qualquer outra transição gera erro explícito e nada muda. Webapp e bot chamam a **mesma** função de transição, escrita como tabela de transições (não como `switch`).
- **Porquê:** dois caminhos de código para a mesma ação divergem sem ninguém perceber.
- **Verificação:** testes unitários de cada transição válida e de cada transição inválida (toda cláusula IF/THEN tem teste de erro, A6 s.10). Revisão: nenhuma rota de API nem handler do bot muda status sem chamar essa função.
- **Situação:** Prevista.

### P-03 — Isolamento por comunidade no banco (RLS), por vínculo ativo
- **Regra:** toda leitura e escrita de dado de uma comunidade checa, no banco, se o usuário tem vínculo ativo naquela comunidade, mesmo que a API já tenha checado. Um usuário pode estar em várias comunidades: nunca assumir "a comunidade do usuário". Toda tabela nova nasce, na mesma migration, com RLS ligado, `grant` explícito só para os papéis que a usam e as políticas RLS.
- **Porquê:** é a última barreira se a API falhar (RNF06). O projeto Supabase não expõe tabelas novas sozinho (ADR-18).
- **Verificação:** testes de integração das políticas (usuário de outra comunidade e vínculo suspenso não leem nem gravam). Revisão de toda migration: RLS, `grant` e políticas presentes.
- **Situação:** revisão de migrations Em vigor (`keep_alive`: RLS ligado, sem acesso para `anon` e `authenticated`). Testes de integração: Previstos.

### P-04 — Privacidade progressiva
- **Regra:** a unidade e o telefone do solicitante só saem do banco para o apoiador que aceitou aquela solicitação. Nunca aparecem em listagens.
- **Porquê:** RNF05. Um campo a mais numa consulta vaza dados sem dar erro.
- **Verificação:** teste que confere os campos devolvidos pela listagem (unidade e telefone ausentes) e teste de que só o apoiador da solicitação aceita recebe esses dados. Revisão: consultas que devolvem dados de solicitação listam as colunas, sem `select('*')`.
- **Situação:** Prevista.

### P-05 — O bot só age sobre usuário identificado
- **Regra:** o chat do Telegram que enviou a mensagem precisa estar vinculado a um usuário ativo, com vínculo ativo na comunidade da solicitação. Se não casar, nenhuma ação é executada. "Ação" é ler ou alterar dados do EntreNós. As únicas respostas permitidas a um chat não vinculado são as instruções de como conectar a conta e o próprio fluxo de conexão (RF23).
- **Porquê:** o bot é uma porta de entrada para o banco.
- **Verificação:** testes unitários do webhook: chat não vinculado, usuário inativo e vínculo de outra comunidade não chamam nenhum caso de uso (Mock sem chamadas).
- **Situação:** Prevista. ⚠️ O mecanismo de conexão (RF23) ainda será decidido.

### P-06 — Webhook confiável e idempotente
- **Regra:** toda requisição ao webhook confere o cabeçalho `X-Telegram-Bot-Api-Secret-Token` com o `TELEGRAM_WEBHOOK_SECRET`, em tempo constante. Sem o cabeçalho ou com valor errado, nada é processado. Cada `update_id` é processado uma vez só: se chegar repetido, o webhook responde sucesso sem executar nada.
- **Porquê:** o Telegram reenvia atualizações; processar duas vezes pode aceitar ou concluir de novo.
- **Verificação:** testes unitários (cabeçalho ausente, cabeçalho errado, `update_id` repetido). Tempo constante: revisão de código, como na RNF-KA-01.
- **Situação:** Prevista.

### P-07 — Comunidade não aprovada e usuário suspenso não operam
- **Regra:** comunidade Pendente ou Reprovada não aceita membros nem solicitações. Usuário suspenso não cria nem aceita solicitações. Convite é de uso único, vale 7 dias e é consumido numa operação atômica.
- **Porquê:** são as regras de entrada que sustentam a confiança da rede.
- **Verificação:** testes unitários (status da comunidade, suspensão, convite expirado, usado ou revogado, com relógio controlado). Teste de integração para o consumo atômico do convite.
- **Situação:** Prevista.

### P-08 — Segredos só no servidor
- **Regra:** `SUPABASE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET` e as credenciais de SMTP ficam só em variáveis de ambiente: nunca com prefixo `NEXT_PUBLIC_`, nunca no código, nunca no GitHub. O cliente com a chave secreta importa `server-only`. O `.env.local` é editado só pelo desenvolvedor: agentes não abrem, não leem e não editam arquivos `.env*`. Testes usam só valores falsos e o CI não recebe segredo. Nenhum segredo aparece em resposta ou log.
- **Porquê:** o repositório é público (ADR-15). A chave secreta ignora o RLS; o token controla o bot inteiro.
- **Verificação:** `.gitignore` bloqueia `.env*`; conferência da aba Changes antes de cada commit; testes de vazamento (como `esperarNenhumVazamento` na `keep-alive`); revisão: nenhum segredo com prefixo `NEXT_PUBLIC_`.
- **Situação:** Em vigor. ⚠️ "Agentes não abrem `.env*`" hoje é só instrução, sem trava técnica.

## 2. Decisões de produto que nenhuma task reverte

| ID | Decisão | Origem |
|---|---|---|
| D-01 | Não existe avaliação entre moradores. Só existe denúncia. | ADR-13 |
| D-02 | Mensageria só por API oficial (Telegram Bot API). Nada de bibliotecas não oficiais. | ADR-20 |
| D-03 | Seis categorias fixas: receber encomendas, regar plantas, pequenas compras, auxílio com tecnologia, companhia, auxílio visual. Fora do escopo: serviços pagos, pagamentos, empréstimo ou transferência de dinheiro, orientação médica, transporte de pessoas, cuidado de crianças, emergências e atividades de risco ou que exigem profissional. | Documentos da matéria |

**Verificação:** revisão de todo PR. Reverter qualquer item exige ADR novo.

## 3. Regras de processo

| ID | Regra | Verificação | Situação |
|---|---|---|---|
| PROC-01 | Fluxo: Issue (com label, objetivo e critério de aceite) → branch `tipo/N-descricao` → PR com `Closes #N` → CI verde → Squash and merge (ADR-25). | Ruleset `protege-main` (ADR-26) | Em vigor |
| PROC-02 | Código de regra segue SDD + TDD (A6 s.2, s.9): spec em EARS em `docs/specs/` antes do código, com um IF/THEN para cada WHEN; task em `docs/tasks/`; teste que falha → código mínimo → teste passa → lint, tipos e testes completos. Spec e código no mesmo PR. Código antigo sem spec segue o ciclo de legado (ADR-22). Infraestrutura pura pode ser exceção, declarada no PR. | Descrição do PR com a evidência (teste falhando e passando) e a auditoria cláusula × implementada × teste × arquivo | Em vigor |
| PROC-03 | Task atômica (A6 s.3): ID, cláusulas, dependências, tamanho S ou M (nunca L) e critério de aceite binário. Uma task por sessão do agente; nunca várias juntas. | Arquivo em `docs/tasks/` e revisão | Em vigor |
| PROC-04 | Testes unitários (A8): AAA visível; F.I.R.S.T.; sem banco, rede ou arquivos; dependências trocadas por test doubles com os nomes da aula (Dummy, Stub, Mock, Fake, Spy); relógio controlado; arquivos em `tests/`, espelhando `src/`; cada teste cita a cláusula que cobre. | CI e revisão | Em vigor |
| PROC-05 | Antes de abrir PR, passam `npm run lint`, `npm run typecheck` e `npm run test:coverage`, com a cobertura mínima configurada no `vitest.config.mts` (ADR-24). | Job "Lint, tipos e testes" do CI | Em vigor |
| PROC-06 | Sem sobre-implementação: só o que a task e a spec pedem. O agente lista as decisões que tomou sem pedido explícito. Bug ou smell grande achado no caminho vira Issue nova; não é corrigido de carona. | Revisão do PR | Em vigor |
| PROC-07 | Commit com só o título: `tipo(escopo): descrição` (feat, fix, refactor, chore, test, docs). | Revisão | Em vigor |

## 4. Arquitetura

Definida pelo ADR-27 (`docs/adr/ADR-27-arquitetura-em-camadas.md`). Cada pasta nasce junto com o primeiro código que precisa dela.

| Pasta | Responsabilidade | Pode importar |
|---|---|---|
| `src/dominio/` | Regras puras: tipos, máquina de estados, validações | Só arquivos do próprio `dominio/` |
| `src/portas/` | Interfaces que os casos de uso usam (ex.: repositório, notificador, relógio) | `dominio/` |
| `src/casos-de-uso/` | Lógica da aplicação; a mesma função atende webapp e bot | `dominio/` e `portas/` |
| `src/infra/` | Implementações das portas (Supabase, Telegram) | `dominio/`, `portas/` e bibliotecas externas |
| `src/lib/` | Temporária: tratada como `infra/` até ser movida (refactor depois da T-05) | Igual a `infra/` |
| `src/app/` | Páginas e rotas de API: traduzem a entrada, montam as implementações e chamam um caso de uso | Todas as camadas |

| ID | Regra | Verificação | Situação |
|---|---|---|---|
| ARQ-01 | `dominio/`, `portas/` e `casos-de-uso/` não importam `app/`, `infra/`, `lib/` nem bibliotecas de infraestrutura (`@supabase/*`, `next`, `server-only`, `react`, `react-dom`, `node:*`). `dominio/` também não importa `portas/` nem `casos-de-uso/`; `portas/` não importa `casos-de-uso/`. | ESLint `no-restricted-imports` no CI | Em vigor |
| ARQ-02 | `infra/` e `lib/` não importam `app/` nem `casos-de-uso/`. | ESLint `no-restricted-imports` no CI | Em vigor |
| ARQ-03 | Rotas de API e o webhook do bot não contêm regra de negócio: traduzem a entrada e chamam um caso de uso. | Revisão do PR | Em vigor |
