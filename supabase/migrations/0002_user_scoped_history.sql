alter table public.encryption_history
  add column if not exists user_id text not null default 'anonymous';

create index if not exists encryption_history_user_created_idx
  on public.encryption_history (user_id, created_at desc);

create index if not exists encryption_history_user_success_idx
  on public.encryption_history (user_id, success);
