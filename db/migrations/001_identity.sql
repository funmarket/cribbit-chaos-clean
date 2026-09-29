create table if not exists users (
  id text primary key default gen_random_uuid()::text,
  display_name text not null,
  display_username text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  provider text not null check (provider in ('telegram', 'web_password')),
  provider_user_id text not null,
  provider_username text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id),
  unique (user_id, provider)
);

create table if not exists web_credentials (
  user_id text primary key references users(id) on delete cascade,
  login_username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  provider text not null check (provider in ('web_guest', 'web_password')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists auth_sessions_user_active_idx
  on auth_sessions(user_id, expires_at)
  where revoked_at is null;
