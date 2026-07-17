create extension if not exists pgcrypto;

create table if not exists public.encryption_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'anonymous',
  file_name text not null,
  original_size integer not null,
  encrypted_size integer not null,
  encryption_time_ms real not null,
  success boolean not null default true,
  error_message text,
  settings text not null default '{}',
  created_at timestamp not null default now()
);

create index if not exists encryption_history_user_created_idx
  on public.encryption_history (user_id, created_at desc);

create index if not exists encryption_history_user_success_idx
  on public.encryption_history (user_id, success);

create table if not exists public.encryption_stats (
  id uuid primary key default gen_random_uuid(),
  total_files integer not null default 0,
  total_encrypted integer not null default 0,
  total_failed integer not null default 0,
  avg_process_time_ms real not null default 0,
  updated_at timestamp not null default now()
);
