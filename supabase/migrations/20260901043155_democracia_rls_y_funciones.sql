-- RLS, agregados públicos (solo conteos) y funciones de la vertical Democracia.

-- ─────────────────────────────────────────────── RLS
alter table democracia.votantes    enable row level security;
alter table democracia.votos        enable row level security;
alter table democracia.iniciativas  enable row level security;

-- votantes: cada quien ve/borra solo su propia fila (alta va por RPC SECURITY DEFINER).
drop policy if exists votante_propio_select on democracia.votantes;
create policy votante_propio_select on democracia.votantes
  for select using (auth.uid() = id);
drop policy if exists votante_propio_delete on democracia.votantes;
create policy votante_propio_delete on democracia.votantes
  for delete using (auth.uid() = id);

-- votos: el dueño ve y gestiona SOLO los suyos; nadie ve el voto nominal de otro.
drop policy if exists voto_propio_all on democracia.votos;
create policy voto_propio_all on democracia.votos
  for all using (auth.uid() = votante_id) with check (auth.uid() = votante_id);

-- iniciativas: lectura pública; escritura solo autenticados (el flujo de voto las siembra).
drop policy if exists iniciativa_lectura on democracia.iniciativas;
create policy iniciativa_lectura on democracia.iniciativas
  for select using (true);
drop policy if exists iniciativa_upsert on democracia.iniciativas;
create policy iniciativa_upsert on democracia.iniciativas
  for insert to authenticated with check (true);

-- ─────────────────────────────────────────────── agregados: definidor, solo conteos
drop view if exists democracia.agregados_publicos;
create view democracia.agregados_publicos
with (security_invoker = false) as
  select camara, ref,
         count(*) filter (where valor = 1)  as a_favor,
         count(*) filter (where valor = -1) as en_contra,
         count(*)                            as total
  from democracia.votos
  group by camara, ref;

-- ─────────────────────────────────────────────── permisos de esquema
grant usage on schema democracia to anon, authenticated;
grant select on democracia.iniciativas to anon, authenticated;
grant select on democracia.agregados_publicos to anon, authenticated;
grant select, insert, update, delete on democracia.votos to authenticated;
grant select, delete on democracia.votantes to authenticated;
grant insert on democracia.iniciativas to authenticated;

-- ─────────────────────────────────────────────── hash de cédula (pepper interno)
create or replace function democracia.hash_cedula(p_cedula text)
returns text language sql security definer set search_path = democracia, extensions as $$
  select encode(
    extensions.hmac(
      regexp_replace(p_cedula, '\D', '', 'g'),
      (select valor from democracia.secretos where clave = 'cedula_pepper'),
      'sha256'),
    'hex');
$$;

-- ─────────────────────────────────────────────── verificador Luhn de cédula (11 díg.)
create or replace function democracia.cedula_valida(p_cedula text)
returns boolean language plpgsql immutable as $$
declare c text; suma int := 0; d int; peso int; i int;
begin
  c := regexp_replace(coalesce(p_cedula,''), '\D', '', 'g');
  if length(c) <> 11 then return false; end if;
  for i in 1..10 loop
    peso := case when i % 2 = 1 then 1 else 2 end;
    d := (substr(c, i, 1))::int * peso;
    suma := suma + case when d > 9 then d - 9 else d end;
  end loop;
  return ((10 - suma % 10) % 10) = (substr(c, 11, 1))::int;
end;
$$;

-- ─────────────────────────────────────────────── alta de votante (SECURITY DEFINER)
create or replace function democracia.registrar_votante(p_cedula text)
returns json language plpgsql security definer set search_path = democracia as $$
declare v_uid uuid := auth.uid(); v_hash text;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'error', 'sesion_requerida');
  end if;
  if not democracia.cedula_valida(p_cedula) then
    return json_build_object('ok', false, 'error', 'cedula_invalida');
  end if;
  if exists (select 1 from democracia.votantes where id = v_uid) then
    return json_build_object('ok', true, 'estado', 'ya_registrado');
  end if;
  v_hash := democracia.hash_cedula(p_cedula);
  if exists (select 1 from democracia.votantes where cedula_hash = v_hash) then
    return json_build_object('ok', false, 'error', 'cedula_en_uso');
  end if;
  insert into democracia.votantes (id, cedula_hash) values (v_uid, v_hash);
  return json_build_object('ok', true, 'estado', 'registrado');
end;
$$;

-- ─────────────────────────────────────────────── emitir/cambiar voto (siembra iniciativa)
create or replace function democracia.emitir_voto(
  p_camara text, p_ref text, p_valor int,
  p_numero text default null, p_titulo text default null, p_grupo text default null)
returns json language plpgsql security definer set search_path = democracia as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from democracia.votantes where id = v_uid) then
    return json_build_object('ok', false, 'error', 'registro_requerido');
  end if;
  if p_valor not in (-1, 1) or p_camara not in ('diputados','senado') then
    return json_build_object('ok', false, 'error', 'parametros');
  end if;
  insert into democracia.iniciativas (camara, ref, numero, titulo, grupo)
  values (p_camara, p_ref, p_numero, p_titulo, p_grupo)
  on conflict (camara, ref) do update
    set numero = coalesce(excluded.numero, democracia.iniciativas.numero),
        titulo = coalesce(excluded.titulo, democracia.iniciativas.titulo),
        grupo  = coalesce(excluded.grupo,  democracia.iniciativas.grupo);
  insert into democracia.votos (votante_id, camara, ref, valor)
  values (v_uid, p_camara, p_ref, p_valor)
  on conflict (votante_id, camara, ref) do update
    set valor = excluded.valor, actualizado = now();
  return json_build_object('ok', true);
end;
$$;

-- ─────────────────────────────────────────────── quitar voto
create or replace function democracia.quitar_voto(p_camara text, p_ref text)
returns json language plpgsql security definer set search_path = democracia as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('ok', false, 'error', 'sesion_requerida'); end if;
  delete from democracia.votos where votante_id = v_uid and camara = p_camara and ref = p_ref;
  return json_build_object('ok', true);
end;
$$;

-- ─────────────────────────────────────────────── derecho al olvido (Ley 172-13)
create or replace function democracia.eliminar_votante()
returns json language plpgsql security definer set search_path = democracia as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('ok', false, 'error', 'sesion_requerida'); end if;
  delete from democracia.votantes where id = v_uid;  -- votos caen en cascada
  return json_build_object('ok', true);
end;
$$;

grant execute on function democracia.registrar_votante(text) to authenticated;
grant execute on function democracia.emitir_voto(text,text,int,text,text,text) to authenticated;
grant execute on function democracia.quitar_voto(text,text) to authenticated;
grant execute on function democracia.eliminar_votante() to authenticated;
grant execute on function democracia.cedula_valida(text) to anon, authenticated;
-- hash_cedula NO se concede a nadie: solo lo usa registrar_votante internamente.
revoke execute on function democracia.hash_cedula(text) from anon, authenticated;

-- Exponer el schema a PostgREST (fuera de migración en el proyecto: alter role
-- authenticator set pgrst.db_schemas = 'public, storage, graphql_public, democracia').
