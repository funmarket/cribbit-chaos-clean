create table if not exists clean_game_sessions (
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

alter table clean_game_sessions
  add constraint clean_game_sessions_current_turn_participant_fk
  foreign key (current_turn_participant_id)
  references game_participants(id);

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
