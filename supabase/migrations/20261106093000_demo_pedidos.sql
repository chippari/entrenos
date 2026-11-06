-- Demonstração temporária da apresentação. Aplicada manualmente pelo SQL Editor do Supabase.
-- Pedidos dos dois moradores fictícios da página /demo. Usada só pelo service_role (rota /api/demo).
-- Sem política RLS: nenhum papel sujeito ao RLS recebe grant (P-03, ADR-31).
create table public.demo_pedidos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  categoria text not null,
  data_e_hora timestamptz not null,
  solicitante text not null,
  apoiador text null,
  status text not null default 'aberta'
    check (status in ('aberta', 'aceita', 'concluida', 'cancelada')),
  criado_em timestamptz not null default now()
);
alter table public.demo_pedidos enable row level security;
revoke all on table public.demo_pedidos from anon, authenticated, service_role;
grant select, insert, update, delete on table public.demo_pedidos to service_role;
