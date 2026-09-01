-- Democracia Legislativa — piloto ciudadano independiente.
-- Todo aislado en el schema `democracia`; el pool de Auth es compartido, así que
-- votar exige un registro de votante creado solo por el flujo de cédula.

create schema if not exists democracia;

-- Extensión para HMAC (hash de cédula con pepper).
create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────── secreto (pepper) fuera de alcance
create table if not exists democracia.secretos (
  clave  text primary key,
  valor  text not null
);
-- Sin GRANT a anon/authenticated: solo lo leen las funciones SECURITY DEFINER.
revoke all on democracia.secretos from anon, authenticated;

-- Sembramos un pepper aleatorio si no existe (una sola vez).
insert into democracia.secretos (clave, valor)
values ('cedula_pepper', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (clave) do nothing;

-- ─────────────────────────────────────────────── votantes
create table if not exists democracia.votantes (
  id          uuid primary key references auth.users (id) on delete cascade,
  cedula_hash text unique not null,
  creado      timestamptz not null default now()
);

-- ─────────────────────────────────────────────── iniciativas (espejo denormalizado)
create table if not exists democracia.iniciativas (
  camara text not null check (camara in ('diputados','senado')),
  ref    text not null,
  numero text,
  titulo text,
  grupo  text,
  creado timestamptz not null default now(),
  primary key (camara, ref)
);

-- ─────────────────────────────────────────────── votos
create table if not exists democracia.votos (
  votante_id  uuid not null references democracia.votantes (id) on delete cascade,
  camara      text not null,
  ref         text not null,
  valor       smallint not null check (valor in (-1, 1)),
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  primary key (votante_id, camara, ref),
  foreign key (camara, ref) references democracia.iniciativas (camara, ref) on delete cascade
);
create index if not exists votos_iniciativa_idx on democracia.votos (camara, ref);
