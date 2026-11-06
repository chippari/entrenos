# ADR-35 — Dados de teste criados à mão para chegar antes ao fluxo completo

- Data: 06/11/2026
- Status: Aceito
- Issue: #49
- Técnicas: aula 9 (A9 s.30 a s.32: ADR); aula 6 (A6 s.3: tasks atômicas; A6 s.9: uma task por vez)

## Contexto

- A entrega é no fim de novembro de 2026. Em 06/11, nenhum dos 24 requisitos funcionais está implementado. O ciclo da solicitação (UC-01 a UC-05) já está todo descrito nos casos de uso e desenhado nos mockups.
- Para o ciclo funcionar de verdade, o sistema precisa de uma comunidade ativa, de usuários com login e de vínculos ativos. Pelo plano, quem cria isso é a entrada na rede (bloco 2, citado em `docs/casos-de-uso/ciclo-da-solicitacao.md`): cadastro e aprovação de comunidade (RF19 e RF20), convite por e-mail (RF02), cadastro com convite (RF01, só a parte do cadastro) e reenvio de convite (RF21). Os números vêm da tabela de requisitos da documentação do projeto (fora do repositório).
- O bloco 2 ainda não tem casos de uso. Ele também depende do envio de e-mail por SMTP, que ainda não foi testado (pré-decisão do ADR-33).
- Fazer o bloco 2 antes adia o primeiro fluxo completo até ficarem prontos os casos de uso, as specs e as telas desses cinco requisitos, além do envio de e-mail. Os problemas de integração (login, RLS, deploy) só apareceriam perto da entrega.
- A P-07 da constituição exige comunidade ativa e vínculo ativo para criar ou aceitar solicitações. Qualquer atalho precisa respeitar essa regra.

## Alternativas

1. Como os dados de teste entram
   - A) À mão no painel do Supabase, sem nenhum arquivo no repositório.
   - B) Um script SQL versionado no repositório, rodado pelo desenvolvedor no SQL Editor. Os usuários de login são criados no painel do Supabase Auth, e o script encontra cada um pelo e-mail.
   - C) Sem atalho: implementar o bloco 2 antes do ciclo da solicitação.
2. Quais dados
   - A) Uma comunidade e dois usuários (quem pede e quem ajuda).
   - B) Duas comunidades ativas (A e B) e quatro usuários. Morador Teste 1: ativo em A e em B. Moradores Teste 2 e 3: ativos em A (com o Morador Teste 1, são três ativos na mesma comunidade). Morador Teste 4: ativo em B e suspenso em A. O Morador Teste 2 também tem um vínculo removido em B.
3. Onde os dados ficam
   - A) No projeto do Supabase que já existe (o único, hoje sem nenhum usuário real).
   - B) Num segundo projeto do Supabase, só para teste.
4. Como o código trata esses dados
   - A) Um "modo teste" no app, que libera o fluxo sem comunidade ativa ou sem vínculo ativo.
   - B) Nenhum código de atalho. O script só cria estados que o bloco 2 criaria (comunidade ativa; vínculo ativo, suspenso ou removido), e as regras valem do mesmo jeito.
5. Até quando o atalho vale
   - A) Até o bloco 2 ser implementado. Se não der tempo, a entrega vai com o atalho, declarado como limitação.
   - B) Para sempre: o bloco 2 sai do escopo.

## Decisão

1B, 2B, 3A, 4B e 5A. Detalhes:

- O script fica em `supabase/dados-de-teste.sql`, fora de `supabase/migrations/`.
- Os nomes são rótulos genéricos ("Morador Teste 1"). Nenhum nome de pessoa.
- Os e-mails usam um domínio reservado para testes (`example.com` ou `.test`), que nunca pertence a ninguém. ⚠️ Conferir se o Supabase Auth aceita esse domínio na hora de criar os usuários.
- As senhas dos usuários de teste ficam só com o desenvolvedor. Nunca vão para o repositório, para a descrição de PR nem para a conversa com agentes.
- Os telefones são fictícios. ⚠️ O formato é escolhido junto com a migration de perfis.

## Porquê

- 1B: os dados ficam reproduzíveis e revisáveis no PR. A opção A não deixa registro: quem avalia não consegue ver nem refazer o que foi criado. A opção C adia o primeiro fluxo completo e empurra a integração para perto da entrega.
- 2B: cada dado existe para testar uma regra. As duas comunidades e o Morador Teste 1 testam o isolamento (P-03) e o seletor de comunidade (RF22). O vínculo suspenso e o removido testam a P-07, e o Morador Teste 4 testa o bloqueio em A junto com a liberação em B (MD-05). Os três vínculos ativos em A testam a corrida do aceite (P-01) e a troca de apoiador antes da conclusão (UC-05 E4). A opção A não testa nenhuma dessas regras.
- 3A: hoje não há usuário real, então não há dado real para misturar. A opção B dobra o trabalho manual (migrations aplicadas duas vezes no SQL Editor e variáveis separadas na Vercel) para evitar um risco que ainda não existe.
- 4B: o atalho pula telas, não regras. A opção A criaria um caminho em que a P-07 e o RLS não valem, e esse caminho poderia chegar à produção. Seria também sobre-implementação (PROC-06).
- 5A: o bloco 2 continua no plano, sem esconder que ele pode não ficar pronto. A opção B tiraria do escopo requisitos que vêm dos documentos da matéria (RF01 e RF02).

## Consequências

- Ordem de trabalho: ADR-35 → spec EARS do ciclo da solicitação → máquina de estados em TDD → três fatias, só pelo webapp (criar e listar; aceitar; Meus pedidos, desistir, cancelar e concluir).
- Ficam para depois: o cadastro do RF01, o RF02, o RF19, o RF20 e o RF21. O login do RF01 entra na primeira fatia, porque o ciclo precisa de usuário identificado.
- O SMTP (ADR-33) fica para depois. Hoje ele só serve ao convite e ao aviso por e-mail (RF24), que também ficaram para depois.
- Sem SMTP, o login da primeira fatia não depende de e-mail. Os usuários de teste são criados já confirmados no painel do Supabase Auth (opção de confirmar o usuário na criação; ⚠️ conferir no painel na hora de criar). A confirmação de cadastro e a recuperação de senha por e-mail ficam para depois.
- O RF23 (conectar o Telegram) não muda e continua na fase do bot.
- O script entra na primeira fatia, no mesmo PR das migrations das tabelas que ele preenche, porque antes disso as tabelas não existem. Ele precisa poder rodar de novo sem duplicar dados. Conferência no PR: rodar o script duas vezes e mostrar que o número de linhas de cada tabela não muda.
- O script é infraestrutura pura, não código de regra. Por isso fica fora do ciclo SDD + TDD, como a PROC-02 permite, e a exceção é declarada no PR.
- A P-01, a P-03 e a P-07 não mudam. Os dados de teste servem ao teste manual e não substituem os testes que a própria constituição prevê para esses princípios.
- Os dados de teste ficam no mesmo projeto do Supabase que vai receber usuários reais. Pendência: apagar esses dados antes de qualquer uso real, acompanhada numa Issue própria, de prioridade baixa.
- Se o bloco 2 não ficar pronto até a entrega, a limitação é registrada na seção "Divergências com os documentos da matéria" da documentação do projeto (`projeto_entrenos`, fora do repositório).
- ⚠️ A aceitação do atalho pelo professor ainda precisa ser confirmada. A pergunta já está registrada na documentação do projeto. Se ele não aceitar, um ADR novo substitui este e volta a opção 1C.

## Verificação

- Revisão só em leitura numa sessão nova do Claude Code, na Issue #49: 1 problema, 6 lacunas e 4 ajustes.
- Aplicados: 5 lacunas (L2 a L6) e os 4 ajustes. A L2, a L3, a L4, a L5, o A2, o A3 e o A4 entraram com texto ajustado. A L3 mudou a decisão 2B (e a alternativa 4B passou a citar o vínculo removido), com a aprovação do desenvolvedor.
- Descartados: o problema P1, porque a citação "A6 s.9: uma task por vez" confere com o slide; e a L1, porque a spec do ciclo entra num PR próprio antes do código, como a spec do webhook (#14) entrou antes do código (#16, #18, #21 e #23). Depois disso, toda mudança de comportamento muda a spec no mesmo PR do código (PROC-02).
