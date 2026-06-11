-- Tabla: salas
create table if not exists salas (
  id text primary key,
  nombre text not null,
  modo text not null check (modo in ('dinero', 'retos')),
  cuota integer default 0,
  castigos jsonb default '[]'::jsonb,
  flash jsonb default '[]'::jsonb,
  stage text default 'grupos',
  created_at timestamptz default now()
);

-- Tabla: participantes
create table if not exists participantes (
  id uuid primary key default gen_random_uuid(),
  sala_id text references salas(id) on delete cascade,
  nombre text not null,
  equipo text not null,
  flag text not null,
  points integer default 0,
  penalties integer default 0,
  eliminado boolean default false,
  pron_camp text default '',
  pron_camp_flag text default '',
  pron_sub text default '',
  pron_sub_flag text default '',
  created_at timestamptz default now()
);

-- Realtime
alter publication supabase_realtime add table participantes;
alter publication supabase_realtime add table salas;

-- RLS (permisivo para app de amigos sin auth)
alter table salas enable row level security;
alter table participantes enable row level security;

create policy "allow all salas" on salas for all using (true) with check (true);
create policy "allow all participantes" on participantes for all using (true) with check (true);
