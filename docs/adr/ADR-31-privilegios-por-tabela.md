# ADR-31 — Padrão de privilégios por tabela no Supabase

- Data: 05/11/2026
- Status: Aceito
- Issue: #17 (decisão tomada na T-10, PR #18); registrado no repositório pela #28
- Técnicas: aula 9 (A9 s.30–32); aula 6 (A6 s.14, dimensão de segurança)

## Contexto

- O servidor acessa as tabelas com a chave secreta, que usa o papel `service_role`. A chave secreta ignora o RLS (constituição, P-08).
- O projeto Supabase não expõe tabelas novas sozinho: cada papel precisa de `grant` (ADR-18).
- Mesmo assim, os privilégios padrão do schema `public` dão ao `service_role` os privilégios REFERENCES, TRIGGER e TRUNCATE em toda tabela nova, sem que a migration peça.
- A migration da `keep_alive` revogou só `anon` e `authenticated` e depois deu `select`, `insert` e `update` ao `service_role`. Na conferência de 05/11, o `service_role` tinha seis privilégios, e a rota só usa SELECT e UPDATE (Issue #19).
- O mesmo excesso apareceu na migration da `telegram_updates` durante a T-10. Ele foi achado antes do merge, pela consulta a `information_schema.role_table_grants`.
- As alternativas abaixo foram registradas depois da decisão, quando este ADR entrou no repositório.

## Alternativas

1. Como dar privilégios a uma tabela nova
   - A) Só `grant` do que cada papel usa, sem `revoke` no `service_role` (como na `keep_alive`).
   - B) `revoke all` de `anon`, `authenticated` e `service_role`, depois `grant` só do que cada papel usa.
   - C) Não mexer nos privilégios do `service_role` e confiar no RLS.
2. Como saber se deu certo
   - A) Só ler a migration.
   - B) Ler a migration e, depois de aplicar, conferir os privilégios reais em `information_schema.role_table_grants` e testar o acesso com `set local role` dentro de `begin ... rollback`.
3. Políticas RLS numa tabela usada só pelo `service_role`
   - A) Criar uma política explícita (por exemplo, uma que nega tudo).
   - B) Não criar política: com o RLS ligado e sem política, os papéis sujeitos ao RLS não acessam nada.

## Decisão

1B, 2B e 3B. A regra e a verificação estão na P-03 da constituição (`docs/constitution.md`).

## Porquê

- 1A deixa privilégios que ninguém pediu, como aconteceu na `keep_alive`. O `grant` só acrescenta; ele não tira o que veio do padrão do schema.
- 1C não protege: o `service_role` ignora o RLS. Para esse papel, os privilégios da tabela são a única trava.
- 1B dá a cada papel só o que o código usa. Um erro na rota ou um uso errado da chave secreta não consegue, por exemplo, apagar a tabela inteira com TRUNCATE.
- 2A não pega o problema: as migrations da `keep_alive` e da `telegram_updates` pareciam certas na leitura. Só a consulta aos privilégios reais mostrou o excesso.
- 3A não muda nada: o `service_role` ignora o RLS, e os outros papéis já ficam sem acesso com o RLS ligado e sem política (e sem `grant`). 3B deixa a migration menor e mostra a verdade: nenhum papel sujeito ao RLS usa a tabela. Esta alternativa entrou na revisão da Issue #28, quando a P-03 pedia políticas em toda tabela e as duas tabelas existentes não tinham nenhuma.

## Consequências

- Toda migration de tabela nova tem `revoke all` dos três papéis antes do `grant`.
- A conferência é manual, no SQL Editor, porque as migrations são aplicadas à mão (o projeto não usa a CLI do Supabase). ⚠️ Ela pode ser esquecida: por isso está na verificação da P-03 e deve estar no critério de aceite de toda task com migration.
- A `keep_alive` foi criada antes deste padrão e continua fora dele (Issue #19).
- Tabela nova que receba `grant` para `anon` ou `authenticated` precisa, na mesma migration, de política RLS para esse papel.
- Se uma rota passar a precisar de um privilégio novo, a migration precisa de um `grant` novo. Erro de permissão em produção é sinal de `grant` faltando, não motivo para dar `all`.

## Verificação

- Depois de aplicar a migration, rodar no SQL Editor:

  ```sql
  select grantee, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = '<tabela>'
    and grantee in ('anon', 'authenticated', 'service_role')
  order by grantee, privilege_type;
  ```

  Resultado esperado: só os privilégios dados pelo `grant`.
- Testar o acesso: `begin;`, depois `set local role <papel>;`, uma operação permitida e uma proibida, e por fim `rollback;`. A operação proibida precisa falhar com erro de permissão.
