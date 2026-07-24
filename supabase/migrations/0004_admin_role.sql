alter table public.auth_users
  add column if not exists role text not null default 'user';
