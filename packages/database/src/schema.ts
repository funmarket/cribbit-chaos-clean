export const P6_MIGRATION_SQL = `create table game_sessions (
  session_id text primary key,
  canonical_state jsonb not null,
  revision bigint not null check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table game_session_memberships (
  session_id text not null references game_sessions(session_id) on delete cascade,
  principal_id text not null,
  player_id text not null,
  primary key (session_id, principal_id),
  unique (session_id, player_id)
);

create table accepted_command_receipts (
  session_id text not null references game_sessions(session_id) on delete cascade,
  command_id text not null,
  command_fingerprint text not null,
  actor_player_id text not null,
  accepted_revision bigint not null check (accepted_revision >= 0),
  created_at timestamptz not null default now(),
  primary key (session_id, command_id)
);

create table game_outbox (
  outbox_id bigserial primary key,
  session_id text not null references game_sessions(session_id) on delete cascade,
  accepted_revision bigint not null check (accepted_revision >= 0),
  audience jsonb not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  published_at timestamptz null,
  lease_token text null,
  lease_expires_at timestamptz null
);

create index game_outbox_unpublished_idx
  on game_outbox (outbox_id)
  where published_at is null;

create table game_deadline_jobs (
  deadline_id text primary key,
  session_id text not null references game_sessions(session_id) on delete cascade,
  due_at timestamptz not null,
  principal_id text not null,
  command_id text not null,
  command_fingerprint text not null,
  expected_revision bigint not null check (expected_revision >= 0),
  command_payload jsonb not null,
  status text not null check (status in ('pending', 'leased', 'completed')),
  lease_token text null,
  lease_expires_at timestamptz null,
  completed_at timestamptz null
);

create index game_deadline_jobs_due_idx
  on game_deadline_jobs (due_at, deadline_id)
  where status <> 'completed';
`;

export interface SqlClient {
  query(sql: string): Promise<unknown>;
}

export async function applyP6Migration(client: SqlClient): Promise<void> {
  await client.query(P6_MIGRATION_SQL);
}
