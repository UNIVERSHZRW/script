import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=process.env.PGLITE_ROOT||'@electric-sql/pglite';const {PGlite}=require(root);
const owner='10000000-0000-4000-8000-000000000001',foreign='10000000-0000-4000-8000-000000000002',session=u=>u.replace('10000000','20000000');let db;
const call=async(a,p={},actor=owner)=>(await db.query('select private.uhz_admin_console($1,$2,$3,$4) as d',[actor,session(actor),a,p])).rows[0].d;
const file=(extra={})=>({request_key:crypto.randomUUID(),name:'fixture.pdf',mime:'application/pdf',size:1024,bucket:'uhz-public',purpose:'content',sha256:'a'.repeat(64),ext:'pdf',...extra});
test('owner identity, storage reservations, integrity, deduplication and publication events',async t=>{
 db=new PGlite();await db.exec(`create schema private;create schema auth;create schema storage;create role anon;create role authenticated;create role service_role;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now(),deleted_at timestamptz,banned_until timestamptz,raw_app_meta_data jsonb default '{}');
 create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);
 create table private.admin_users(user_id uuid primary key,email text,role text,enabled boolean default true,last_seen_at timestamptz,created_at timestamptz default now());
 create table private.admin_allowed_emails(email text primary key,role text,enabled boolean default true,created_at timestamptz default now());create table private.uhz_member_controls(user_id uuid,state text);
 create function private.community_check_member() returns uuid language plpgsql stable as $$begin if auth.uid() is null then raise exception 'No session' using errcode='42501';end if;return auth.uid();end$$;
 create function private.uhz_active_session() returns uuid language sql stable as $$select auth.uid()$$;
 create table storage.buckets(id text primary key,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(bucket_id text,name text,metadata jsonb,primary key(bucket_id,name));
 insert into storage.buckets values('uhz-public',true,20971520,array['image/png','image/jpeg','image/webp','image/gif','application/pdf','video/mp4']),('uhz-private',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp']);
 create table public.site_config(key text primary key,value jsonb,description text,is_public boolean,updated_at timestamptz default now());create table public.shop_config(key text,value jsonb);
 create table public.content_resources(id uuid default gen_random_uuid(),publish boolean,record_status text);create table public.downloads(id uuid default gen_random_uuid());
 create table public.products(id uuid default gen_random_uuid());create table public.shop_orders(id uuid default gen_random_uuid());create table public.ads(id uuid);create table public.ad_plans(id uuid);create table public.chatbot_knowledge(id uuid);create table public.chatbot_config(key text);
 create table public.contributions(management_status text);create table public.rights_reports(status text);create table public.chatbot_questions(status text);create table public.integration_status(integration text,enabled boolean,configured boolean,last_ok_at timestamptz);
 create table private.uhz_fin_requests(status text);create table private.uhz_resource_proposals(state text);
 create table private.uhz_catalog_images(key text primary key,bytes integer,width integer,height integer,owner_id uuid,state text default 'reserved',created_at timestamptz default now());create table private.uhz_eco_content(details jsonb,state text);
 `);
 for(const [id,email] of [[owner,'univershzrw@gmail.com'],[foreign,'foreign@example.test']]){await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,$2,'{\"uhz_role\":\"superadmin\"}')",[id,email]);await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[session(id),id]);await db.query("insert into private.admin_users(user_id,email,role) values($1,$2,'owner')",[id,email]);await db.query("insert into private.admin_allowed_emails(email,role) values($1,'owner')",[email]);}
 const schema=await readFile(new URL('../schema.sql',import.meta.url),'utf8')+'\n'+await readFile(new URL('../catalog-quota.sql',import.meta.url),'utf8');try{await db.exec(schema);}catch(e){throw Error('Schema: '+e.message+' at '+e.position);}
 await t.test('only the verified canonical owner can administer, even with forged superadmin metadata',async()=>{
  assert.equal((await call('overview')).owner.phone,'+524931431385');await assert.rejects(()=>call('overview',{},foreign),/propietaria/);
  const flags=(await db.query("select has_function_privilege('anon','public.uhz_admin_console(uuid,uuid,text,jsonb)','EXECUTE') as anon,has_function_privilege('authenticated','public.uhz_admin_console(uuid,uuid,text,jsonb)','EXECUTE') as member")).rows[0];assert.equal(flags.anon,false);assert.equal(flags.member,false);
  await assert.rejects(()=>db.query("update private.admin_users set enabled=true where user_id=$1",[foreign]),/check constraint/);
  await db.query("select set_config('test.uid',$1,false)",[owner]);assert.equal((await db.query('select private.is_admin() as ok')).rows[0].ok,true);
  await db.query("select set_config('test.uid',$1,false)",[foreign]);assert.equal((await db.query('select private.is_admin() as ok')).rows[0].ok,false);
 });
 let record;
 await t.test('requests are idempotent and unpublished uploads have no public metadata',async()=>{
  const p=file(),a=await call('reserve',p),b=await call('reserve',p);record=a.file;assert.equal(a.file.id,b.file.id);
  assert.equal((await db.query('select public.uhz_admin_asset_public($1) as d',[record.id])).rows[0].d,null);
  await assert.rejects(()=>call('complete',{id:record.id,verified_sha256:'a'.repeat(64)}),/todavía/);
  await assert.rejects(()=>call('reserve',file({bucket:'uhz-private',size:10485761})),/formato/);
 });
 await t.test('completion requires a full stored object and the server-verified hash; duplicates reuse it',async()=>{
  await db.query('insert into storage.objects values($1,$2,$3)',[record.bucket,record.object_path,{size:1024}]);
  await assert.rejects(()=>call('complete',{id:record.id,verified_sha256:'b'.repeat(64)}),/coincide/);
  await call('complete',{id:record.id,verified_sha256:'a'.repeat(64)});await call('complete',{id:record.id,verified_sha256:'a'.repeat(64)});
  const d=await call('reserve',file());assert.equal(d.duplicate,true);assert.equal(d.file.id,record.id);
  assert.equal((await db.query('select public.uhz_admin_asset_public($1) as d',[record.id])).rows[0].d.ok,true);
  await call('archive',{id:record.id});assert.equal((await call('uploads')).files.length,0);assert.equal((await call('uploads',{archived:true})).files[0].status,'archived');await call('restore',{id:record.id});
 });
 await t.test('private assets stay private and partial uploads resume with the same path',async()=>{
  const p=file({bucket:'uhz-private',sha256:'c'.repeat(64)}),a=await call('reserve',p),b=await call('reserve',{...p,request_key:crypto.randomUUID()});assert.equal(a.file.object_path,b.file.object_path);
  await db.query('insert into storage.objects values($1,$2,$3)',[a.file.bucket,a.file.object_path,{size:1024}]);await call('complete',{id:a.file.id,verified_sha256:p.sha256});assert.equal((await db.query('select public.uhz_admin_asset_public($1) as d',[a.file.id])).rows[0].d,null);
 });
 await t.test('storage reservations enforce the 90 percent budget across concurrent requests',async()=>{
  await db.exec('update private.uhz_admin_console_config set storage_budget=100000000 where id=1');const results=await Promise.allSettled(Array.from({length:5},(_,i)=>call('reserve',file({size:20971520,mime:'video/mp4',ext:'mp4',sha256:String(i+1).repeat(64)}))));assert.equal(results.filter(r=>r.status==='fulfilled').length,4);assert.equal(results.filter(r=>r.status==='rejected').length,1);
  const usage=(await call('overview')).storage;assert.ok(Number(usage.used_bytes)+Number(usage.reserved_bytes)<=Number(usage.limit_bytes));
  await db.query("insert into storage.objects values('uhz-public','quota-fixture','{\"size\":6000000}')");await db.query("select set_config('test.uid',$1,false)",[owner]);await assert.rejects(()=>db.query("select public.uhz_catalog_media('reserve',$1)",[{key:crypto.randomUUID()+'.webp',bytes:307200,width:1200,height:800}]),/90 por ciento/);await db.query("delete from storage.objects where name='quota-fixture'");
 });
 await t.test('public table changes are recorded and session revocation closes access immediately',async()=>{
  const before=(await call('overview')).revision;await db.exec("insert into public.products default values");const after=await call('overview');assert.ok(Number(after.revision)>Number(before));assert.equal(after.counts.products,1);
  await db.query('delete from auth.sessions where user_id=$1',[owner]);await assert.rejects(()=>call('overview'),/propietaria/);
 });await db.close();
});
