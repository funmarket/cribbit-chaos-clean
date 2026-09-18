import type pg from 'pg';
import { P6_MIGRATION_SQL } from './schema.ts';

export const CLEAN_IDENTITY_MIGRATION_SQL = `create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  display_username text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  provider text not null check (provider in ('telegram', 'guest')),
  provider_user_id text not null,
  provider_username text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  provider text not null check (provider in ('telegram', 'guest')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists auth_sessions_user_active_idx
  on auth_sessions(user_id, expires_at)
  where revoked_at is null;
`;

export const CLEAN_GAME_CORE_MIGRATION_SQL = `create table if not exists clean_game_sessions (
  id uuid primary key default gen_random_uuid(),
  join_code text not null unique,
  status text not null check (status in ('LOBBY', 'ACTIVE', 'COMPLETED', 'ABANDONED')),
  host_user_id uuid not null references app_users(id),
  current_turn_participant_id uuid,
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references clean_game_sessions(id) on delete cascade,
  user_id uuid not null references app_users(id),
  display_name text not null,
  seat_index integer not null,
  role text not null default 'player' check (role in ('host', 'player', 'spectator')),
  joined_at timestamptz not null default now(),
  unique (session_id, user_id),
  unique (session_id, seat_index)
);

do $$ begin
  alter table clean_game_sessions
    add constraint clean_game_sessions_current_turn_participant_fk
    foreign key (current_turn_participant_id)
    references game_participants(id);
exception
  when duplicate_object then null;
end $$;

create table if not exists game_states (
  session_id uuid primary key references clean_game_sessions(id) on delete cascade,
  canonical_state jsonb not null,
  revision bigint not null check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_states_revision_idx
  on game_states(session_id, revision);

create table if not exists clean_game_commands (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references clean_game_sessions(id) on delete cascade,
  actor_participant_id uuid references game_participants(id),
  command_id text not null,
  command_type text not null,
  expected_revision bigint,
  payload jsonb not null default '{}'::jsonb,
  result_status text not null check (result_status in ('ACCEPTED', 'REJECTED')),
  result_payload jsonb not null default '{}'::jsonb,
  before_revision bigint not null,
  after_revision bigint,
  created_at timestamptz not null default now(),
  unique (session_id, command_id)
);

create index if not exists clean_game_commands_session_created_idx
  on clean_game_commands(session_id, created_at);

create table if not exists clean_game_outbox (
  id bigserial primary key,
  session_id uuid not null references clean_game_sessions(id) on delete cascade,
  revision bigint not null check (revision >= 0),
  audience jsonb not null default '{"kind":"session"}'::jsonb,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  lease_token text,
  lease_expires_at timestamptz
);

create index if not exists clean_game_outbox_unpublished_idx
  on clean_game_outbox(id)
  where published_at is null;

create index if not exists clean_game_outbox_session_revision_idx
  on clean_game_outbox(session_id, revision);

create table if not exists clean_game_deadline_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references clean_game_sessions(id) on delete cascade,
  due_at timestamptz not null,
  status text not null check (status in ('pending', 'leased', 'completed', 'cancelled')),
  command_payload jsonb not null,
  lease_token text,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists clean_game_deadline_jobs_due_idx
  on clean_game_deadline_jobs(due_at, id)
  where status in ('pending', 'leased');
`;

export async function applyCleanMigrations(client: Pick<pg.PoolClient | pg.Pool, 'query'>): Promise<void> {
  await client.query(P6_MIGRATION_SQL);
  await client.query(CLEAN_IDENTITY_MIGRATION_SQL);
  await client.query(CLEAN_GAME_CORE_MIGRATION_SQL);
}
