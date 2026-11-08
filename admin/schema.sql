-- One verified owner, existing sessions and a shared upload/control plane.
create or replace function private.uhz_owner_identity(p_actor uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join private.admin_users a on a.user_id=u.id
 where u.id=p_actor and lower(u.email)='univershzrw@gmail.com' and lower(a.email::text)='univershzrw@gmail.com'
 and u.email_confirmed_at is not null and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now())
 and a.enabled and a.role='owner' and u.raw_app_meta_data->>'uhz_role'='superadmin');
$$;
create or replace function private.uhz_require_superadmin() returns uuid language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=private.community_check_member();begin
 if not private.uhz_owner_identity(actor) then raise exception 'Acceso exclusivo del propietario de UNIVERSHZRW.' using errcode='42501';end if;return actor;
end$$;
create or replace function private.is_admin() returns boolean language plpgsql stable security definer set search_path='' as $$begin
 perform private.uhz_require_superadmin();return true;exception when insufficient_privilege then return false;end$$;
create or replace function private.is_owner() returns boolean language sql stable security definer set search_path='' as $$select private.is_admin()$$;
create or replace function private.uhz_license_admin() returns boolean language sql stable security definer set search_path='' as $$select private.is_admin()$$;
create or replace function private.uhz_fin_admin(p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$select private.uhz_owner_identity(p_actor)$$;
create or replace function private.uhz_account_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=private.uhz_active_session();result jsonb;begin
 select jsonb_build_object('role',case when private.uhz_owner_identity(u.id) then 'superadmin' else 'member' end,
 'must_change_password',coalesce((u.raw_app_meta_data->>'uhz_password_reset_required')::boolean,false)) into result from auth.users u where u.id=actor;return result;
end$$;
create or replace function private.sync_admin_from_auth() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.email is null or lower(new.email)<>'univershzrw@gmail.com' or new.email_confirmed_at is null then
  update private.admin_users set enabled=false where user_id=new.id;return new;
 end if;
 if new.raw_app_meta_data->>'uhz_role'='superadmin' and exists(select 1 from private.admin_allowed_emails where lower(email::text)='univershzrw@gmail.com' and enabled and role='owner') then
  insert into private.admin_users(user_id,email,role,enabled,last_seen_at) values(new.id,new.email,'owner',true,now())
  on conflict(user_id) do update set email=excluded.email,role='owner',enabled=true,last_seen_at=now();
 end if;return new;
end$$;
update private.admin_users set enabled=false where lower(email::text)<>'univershzrw@gmail.com' or role<>'owner';
update private.admin_allowed_emails set enabled=false where lower(email::text)<>'univershzrw@gmail.com' or role<>'owner';
alter table private.admin_users add constraint uhz_single_owner_enabled check(not enabled or coalesce((lower(email::text)='univershzrw@gmail.com' and role='owner'),false));
alter table private.admin_allowed_emails add constraint uhz_single_owner_allowlist check(not enabled or coalesce((lower(email::text)='univershzrw@gmail.com' and role='owner'),false));
revoke all on function private.uhz_owner_identity(uuid) from public,anon,authenticated;

create table private.uhz_admin_console_config(
 id integer primary key check(id=1),email text not null default 'univershzrw@gmail.com' check(email='univershzrw@gmail.com'),
 phone text not null default '+524931431385',storage_budget bigint not null default 1000000000 check(storage_budget between 100000000 and 1000000000),
 threshold_percent integer not null default 90 check(threshold_percent=90)
);
insert into private.uhz_admin_console_config(id) values(1);
create table private.uhz_admin_uploads(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null,request_key uuid not null,
 bucket text not null check(bucket in ('uhz-public','uhz-private')),object_path text not null unique,
 file_name text not null check(length(file_name) between 1 and 180),mime_type text not null,
 expected_bytes bigint not null check(expected_bytes>0 and expected_bytes<=20971520),sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 purpose text not null check(purpose in ('content','product','ad','document')),
 status text not null default 'reserved' check(status in ('reserved','ready','archived','cancelled')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '2 hours',
 unique(owner_id,request_key)
);
create index uhz_admin_uploads_recent on private.uhz_admin_uploads(owner_id,created_at desc);
create index uhz_admin_uploads_fingerprint on private.uhz_admin_uploads(sha256,bucket) where status='ready';
create table private.uhz_site_changes(
 revision bigint generated always as identity primary key,module text not null,operation text not null,actor_id uuid,created_at timestamptz not null default now()
);
create index uhz_site_changes_recent on private.uhz_site_changes(created_at desc);
alter table private.uhz_admin_console_config enable row level security;
alter table private.uhz_admin_uploads enable row level security;
alter table private.uhz_site_changes enable row level security;
revoke all on private.uhz_admin_console_config,private.uhz_admin_uploads,private.uhz_site_changes from public,anon,authenticated;

create function private.uhz_record_site_change() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into private.uhz_site_changes(module,operation,actor_id) values(tg_table_name,lower(tg_op),auth.uid());return null;
end$$;
do $$declare table_name text;begin
 foreach table_name in array array['content_resources','downloads','products','ads','ad_plans','site_config','shop_config','chatbot_knowledge','chatbot_config'] loop
  execute format('create trigger uhz_console_change after insert or update or delete on public.%I for each statement execute function private.uhz_record_site_change()',table_name);
 end loop;
end$$;
create function private.uhz_control_actor(p_actor uuid,p_session uuid) returns void language plpgsql stable security definer set search_path='' as $$begin
 if not private.uhz_owner_identity(p_actor) or not exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id
 where s.id=p_session and s.user_id=p_actor and (s.not_after is null or s.not_after>now())
 and not coalesce((u.raw_app_meta_data->>'uhz_password_reset_required')::boolean,false))
 or exists(select 1 from private.uhz_member_controls c where c.user_id=p_actor and c.state<>'active') then
 raise exception 'Inicia sesión con la cuenta propietaria verificada.' using errcode='42501';end if;
end$$;
create function private.uhz_control_storage() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('used_bytes',(select coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end),0) from storage.objects),
 'reserved_bytes',(select coalesce(sum(expected_bytes),0) from private.uhz_admin_uploads where status='reserved' and expires_at>now())+(select coalesce(sum(bytes),0) from private.uhz_catalog_images where state='reserved' and created_at>now()-interval '2 hours'),
 'budget_bytes',c.storage_budget,'threshold_percent',c.threshold_percent,'limit_bytes',c.storage_budget*c.threshold_percent/100,
 'buckets',(select jsonb_agg(jsonb_build_object('id',b.id,'public',b.public,'max_bytes',least(coalesce(b.file_size_limit,20971520),20971520),'mime_types',b.allowed_mime_types)) from storage.buckets b where b.id in ('uhz-public','uhz-private')))
 from private.uhz_admin_console_config c where c.id=1;
$$;
create function private.uhz_admin_console(p_actor uuid,p_session uuid,p_action text,p jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare r private.uhz_admin_uploads%rowtype;bucket_row storage.buckets%rowtype;capacity jsonb;key_value uuid;new_id uuid;size_value bigint;duplicate boolean:=false;observed bigint;begin
 perform private.uhz_control_actor(p_actor,p_session);
 if jsonb_typeof(p)<>'object' or octet_length(p::text)>12000 then raise exception 'Solicitud inválida.';end if;
 if p_action='overview' then
  return jsonb_build_object('ok',true,'owner',(select jsonb_build_object('email',email,'phone',phone) from private.uhz_admin_console_config where id=1),
   'storage',private.uhz_control_storage(),'revision',(select coalesce(max(revision),0) from private.uhz_site_changes),
   'counts',jsonb_build_object('content',(select count(*) from public.content_resources),'published',(select count(*) from public.content_resources where publish and record_status='ACTIVO'),
   'products',(select count(*) from public.products),'orders',(select count(*) from public.shop_orders),'users',(select count(*) from auth.users where deleted_at is null),
   'contributions',(select count(*) from public.contributions where management_status in ('PENDIENTE DE REVISIÓN','EN REVISIÓN')),
   'proposals',(select count(*) from private.uhz_resource_proposals where lower(state) not in ('approved','rejected','cancelled','published','aprobado','rechazado')),
   'rights',(select count(*) from public.rights_reports where status in ('RECIBIDO','EN REVISIÓN')),'questions',(select count(*) from public.chatbot_questions where status='PENDIENTE'),
   'finance',(select count(*) from private.uhz_fin_requests where status in ('requested','quoted','review','processing'))),
   'changes',coalesce((select jsonb_agg(to_jsonb(x) order by x.revision desc) from(select revision,module,operation,created_at from private.uhz_site_changes order by revision desc limit 30)x),'[]'),
   'integrations',coalesce((select jsonb_agg(jsonb_build_object('name',integration,'enabled',enabled,'configured',configured,'checked_at',last_ok_at)) from public.integration_status where integration in ('mercado_pago','spei_direct','email')),'[]'));
 end if;
 if p_action='uploads' then
  return jsonb_build_object('ok',true,'storage',private.uhz_control_storage(),'files',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from(
   select id,bucket,object_path,file_name,mime_type,expected_bytes,sha256,purpose,status,created_at,expires_at from private.uhz_admin_uploads
   where owner_id=p_actor and ((coalesce(p->>'archived','')='true' and status='archived') or (coalesce(p->>'archived','')<>'true' and status in ('ready','reserved')))
   order by created_at desc limit 200)x),'[]'));
 end if;
 if p_action='reserve' then
  perform pg_advisory_xact_lock(hashtextextended('uhz-admin-storage',0));
  key_value:=(p->>'request_key')::uuid;size_value:=(p->>'size')::bigint;
  select * into r from private.uhz_admin_uploads where owner_id=p_actor and request_key=key_value;
  if r.id is not null then return jsonb_build_object('ok',true,'file',to_jsonb(r),'duplicate',r.status='ready');end if;
  select * into bucket_row from storage.buckets where id=p->>'bucket' and id in ('uhz-public','uhz-private');
  if bucket_row.id is null or size_value is null or size_value<=0 or size_value>least(coalesce(bucket_row.file_size_limit,20971520),20971520)
  or not coalesce((p->>'mime')=any(bucket_row.allowed_mime_types),false) or coalesce(p->>'ext','') !~ '^(pdf|png|jpg|webp|gif|mp4)$'
  or coalesce(p->>'sha256','') !~ '^[0-9a-f]{64}$' then raise exception 'Revisa el formato y el tamaño permitidos para este archivo.';end if;
  select u.* into r from private.uhz_admin_uploads u join storage.objects o on o.bucket_id=u.bucket and o.name=u.object_path
  where u.owner_id=p_actor and u.status='ready' and u.sha256=p->>'sha256' and u.bucket=bucket_row.id limit 1;
  if r.id is not null then return jsonb_build_object('ok',true,'file',to_jsonb(r),'duplicate',true);end if;
  select * into r from private.uhz_admin_uploads where owner_id=p_actor and status='reserved' and sha256=p->>'sha256' and bucket=bucket_row.id and created_at>now()-interval '24 hours' order by created_at desc limit 1;
  if r.id is not null then return jsonb_build_object('ok',true,'file',to_jsonb(r),'duplicate',false);end if;
  capacity:=private.uhz_control_storage();
  if (capacity->>'used_bytes')::bigint+(capacity->>'reserved_bytes')::bigint+size_value>(capacity->>'limit_bytes')::bigint then raise exception 'El almacenamiento alcanzó el límite configurado del 90 por ciento. Libera espacio o utiliza un enlace externo.';end if;
  if (select count(*) from private.uhz_admin_uploads where owner_id=p_actor and created_at>now()-interval '1 day')>=300 then raise exception 'Alcanzaste el límite diario de archivos.';end if;
  new_id:=gen_random_uuid();insert into private.uhz_admin_uploads(id,owner_id,request_key,bucket,object_path,file_name,mime_type,expected_bytes,sha256,purpose)
  values(new_id,p_actor,key_value,bucket_row.id,'admin/'||p_actor::text||'/'||new_id::text||'.'||(p->>'ext'),trim(p->>'name'),p->>'mime',size_value,p->>'sha256',p->>'purpose') returning * into r;
  insert into private.uhz_site_changes(module,operation,actor_id) values('uploads','reserved',p_actor);
  return jsonb_build_object('ok',true,'file',to_jsonb(r),'duplicate',false);
 end if;
 select * into r from private.uhz_admin_uploads where id=(p->>'id')::uuid and owner_id=p_actor for update;
 if r.id is null then raise exception 'Archivo no encontrado.';end if;
 if p_action='file' then return jsonb_build_object('ok',true,'file',to_jsonb(r));end if;
 if p_action='renew' then
  if r.status<>'reserved' then raise exception 'La subida ya está cerrada.';end if;
  perform pg_advisory_xact_lock(hashtextextended('uhz-admin-storage',0));capacity:=private.uhz_control_storage();
  if (capacity->>'used_bytes')::bigint+(capacity->>'reserved_bytes')::bigint+(case when r.expires_at<=now() then r.expected_bytes else 0 end)>(capacity->>'limit_bytes')::bigint then raise exception 'Almacenamiento reservado al 90 por ciento.';end if;
  update private.uhz_admin_uploads set expires_at=now()+interval '2 hours',updated_at=now() where id=r.id returning * into r;
  return jsonb_build_object('ok',true,'file',to_jsonb(r));
 end if;
 if p_action='complete' then
  if r.status='ready' then return jsonb_build_object('ok',true,'file',to_jsonb(r));end if;
  if r.status<>'reserved' or p->>'verified_sha256' is distinct from r.sha256 then raise exception 'El archivo no coincide con la subida reservada.';end if;
  select (metadata->>'size')::bigint into observed from storage.objects where bucket_id=r.bucket and name=r.object_path;
  if observed is distinct from r.expected_bytes then raise exception 'El archivo todavía no está completo o su tamaño cambió.';end if;
  update private.uhz_admin_uploads set status='ready',updated_at=now() where id=r.id returning * into r;
  insert into private.uhz_site_changes(module,operation,actor_id) values('uploads','completed',p_actor);
  return jsonb_build_object('ok',true,'file',to_jsonb(r));
 end if;
 if p_action in ('archive','restore','cancel') then
  if p_action='restore' and r.status<>'archived' or p_action='archive' and r.status<>'ready' or p_action='cancel' and r.status<>'reserved' then raise exception 'El estado del archivo cambió. Actualiza la biblioteca.';end if;
  update private.uhz_admin_uploads set status=case p_action when 'restore' then 'ready' when 'cancel' then 'cancelled' else 'archived' end,updated_at=now() where id=r.id returning * into r;
  insert into private.uhz_site_changes(module,operation,actor_id) values('uploads',p_action,p_actor);return jsonb_build_object('ok',true,'file',to_jsonb(r));
 end if;
 raise exception 'Acción no permitida.';
end$$;
create function public.uhz_admin_console(p_actor uuid,p_session uuid,p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.uhz_admin_console(p_actor,p_session,p_action,p_payload)$$;
revoke all on function public.uhz_admin_console(uuid,uuid,text,jsonb),private.uhz_admin_console(uuid,uuid,text,jsonb),private.uhz_control_actor(uuid,uuid),private.uhz_control_storage(),private.uhz_record_site_change() from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function public.uhz_admin_console(uuid,uuid,text,jsonb),private.uhz_admin_console(uuid,uuid,text,jsonb) to service_role;
insert into public.site_config(key,value,description,is_public) values('ADMIN_CONTACT_PHONE','"+524931431385"'::jsonb,'Contacto de administración de UNIVERSHZRW; no verifica un factor de autenticación.',false)
on conflict(key) do update set value=excluded.value,description=excluded.description,is_public=false,updated_at=now();

-- Single explicitly public asset lookup; no listing or private object exposure.
create function public.uhz_admin_asset_public(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('ok',true,'bucket',bucket,'path',object_path,'mime',mime_type,'size',expected_bytes,'name',file_name,'sha256',sha256)
 from private.uhz_admin_uploads where id=p_id and bucket='uhz-public' and status in ('ready','archived');
$$;
revoke all on function public.uhz_admin_asset_public(uuid) from public;
grant execute on function public.uhz_admin_asset_public(uuid) to anon,authenticated,service_role;
