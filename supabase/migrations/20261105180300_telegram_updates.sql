-- Aplicada manualmente pelo SQL Editor do Supabase em 05/11/2026.
-- Registro de atualizações do webhook do Telegram (idempotência, P-06).
-- Guarda só o update_id e o horário de recebimento (RNF-TW-04).
create table public.telegram_updates (
  update_id bigint primary key,
  recebido_em timestamptz not null default now()
);
alter table public.telegram_updates enable row level security;
revoke all on table public.telegram_updates from anon, authenticated;
revoke all on table public.telegram_updates from service_role;
grant insert on table public.telegram_updates to service_role;
