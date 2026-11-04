-- Aplicada manualmente pelo SQL Editor do Supabase em 04/11/2026.
-- Tabela mínima para o cron anti-pausa (Vercel Cron, 1x por dia).
-- Uma linha só (id = 1); o cron atualiza pinged_at.
create table public.keep_alive (
  id smallint primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);
alter table public.keep_alive enable row level security;
revoke all on table public.keep_alive from anon, authenticated;
grant select, insert, update on table public.keep_alive to service_role;
insert into public.keep_alive (id) values (1);
