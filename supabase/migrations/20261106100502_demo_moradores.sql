-- Demonstração temporária. Aplicada manualmente pelo SQL Editor do Supabase.
-- Moradores da página /demo: um cadastro para cada usuário do Supabase Auth que entra na demonstração.
-- Usada só pelo service_role (rotas /api/demo), e só para leitura.
-- Sem política RLS: nenhum papel sujeito ao RLS recebe grant (P-03, ADR-31).
create table public.demo_moradores (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  unidade text not null,
  telefone text not null,
  chat_telegram bigint null,
  criado_em timestamptz not null default now()
);
alter table public.demo_moradores enable row level security;
revoke all on table public.demo_moradores from anon, authenticated, service_role;
grant select on table public.demo_moradores to service_role;

-- Em demo_pedidos, as colunas solicitante e apoiador (text) passam a guardar o usuario_id como texto.
-- Não há migration nova para ela. Os pedidos antigos guardam 'ana' e 'bruno', que não são usuario_id:
-- apague-os antes de usar a demonstração com login (descomente a linha abaixo).
-- delete from public.demo_pedidos;

-- Exemplo de cadastro de um morador (valores de exemplo; o usuário já precisa existir no Supabase Auth):
-- insert into public.demo_moradores (usuario_id, nome, unidade, telefone)
-- select id, 'Morador Teste 1', 'Apto 101', '(11) 90000-0001'
-- from auth.users
-- where email = 'morador1@example.com';
