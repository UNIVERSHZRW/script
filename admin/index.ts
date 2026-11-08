import {createClient} from 'npm:@supabase/supabase-js@2.95.0';
import {OWNER_EMAIL,normalizeUpload,fileType,publicAssetURL} from './core.mjs';
const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const storageOrigin=url.replace('.supabase.co','.storage.supabase.co');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const actions=new Set(['overview','uploads','upload_reserve','upload_renew','upload_complete','upload_open','archive','restore','cancel']);
const reply=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private,no-store','x-content-type-options':'nosniff'}});
const decorate=(f:any)=>({...f,url:publicAssetURL(f)});
Deno.serve(async(req)=>{
 if(req.method!=='POST')return reply({message:'Método no permitido.'},405);
 try{
  const token=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');if(!token)return reply({message:'Inicia sesión.'},401);
  const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return reply({message:'Inicia sesión.'},401);
  if(user.email?.toLowerCase()!==OWNER_EMAIL)return reply({message:'Acceso exclusivo del propietario.'},403);
  let session;try{session=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).session_id;}catch{}if(!uuid.test(session||''))return reply({message:'Sesión inválida.'},401);
  const raw=await req.text();if(raw.length>16000)return reply({message:'Solicitud demasiado grande.'},413);
  const body=JSON.parse(raw),action=body.action,p=body.payload||{};if(!actions.has(action)||!p||typeof p!=='object'||Array.isArray(p))throw Error('Acción no permitida.');
  const rpc=async(a:string,v:any={})=>{const {data,error}=await db.rpc('uhz_admin_console',{p_actor:user.id,p_session:session,p_action:a,p_payload:v});
   if(error){if(['P0001','42501'].includes(error.code))throw Error(error.message);if(error.code==='23505')throw Error('Esta subida ya está registrada. Actualiza la biblioteca.');throw Error('No se pudo registrar la operación. Revisa los datos.');}return data;};
  // Every action checks the current DB session and canonical owner identity.
  if(action==='overview')return reply(await rpc('overview'));
  if(action==='uploads'){const d=await rpc('uploads',{archived:p.archived===true});d.files=d.files.map(decorate);return reply(d);}
  if(p.id&&!uuid.test(p.id))throw Error('Identificador de archivo inválido.');
  if(action==='upload_reserve'||action==='upload_renew'){
   let d;if(action==='upload_reserve'){const data=normalizeUpload(p);if(!uuid.test(data.request_key||''))throw Error('Identificador de subida inválido.');d=await rpc('reserve',data);}else d=await rpc('renew',{id:p.id});
   let f=d.file;if(f.status==='ready')return reply({...d,file:decorate(f),duplicate:true});
   if(f.status!=='reserved')throw Error('La subida ya está cerrada.');
   if(Date.parse(f.expires_at)<=Date.now()+60000){d=await rpc('renew',{id:f.id});f=d.file;}
   const {data,error}=await db.storage.from(f.bucket).createSignedUploadUrl(f.object_path,{upsert:false});if(error)throw Error('No se pudo autorizar la subida. Reintenta con tu sesión activa.');
   return reply({...d,file:decorate(f),upload:{endpoint:storageOrigin+'/storage/v1/upload/resumable',signature:data.token,signed_url:data.signedUrl,expires_at:f.expires_at,chunk_bytes:6291456}});
  }
  const record=await rpc('file',{id:p.id}),f=record.file;
  if(action==='upload_open'){
   if(!['ready','archived'].includes(f.status))throw Error('El archivo todavía no está completo.');
   const {data,error}=await db.storage.from(f.bucket).createSignedUrl(f.object_path,120,{download:f.file_name});if(error)throw Error('No se pudo abrir el archivo.');return reply({ok:true,url:data.signedUrl});
  }
  if(action==='upload_complete'){
   if(f.status==='ready')return reply({ok:true,file:decorate(f)});
   if(f.status!=='reserved')throw Error('La subida ya está cerrada.');
   const {data,error}=await db.storage.from(f.bucket).download(f.object_path);if(error||!data)throw Error('La carga todavía no está completa. Reanúdala y vuelve a comprobar.');
   if(data.size!==Number(f.expected_bytes)||data.size>20971520)throw Error('El tamaño del archivo no coincide con el reservado.');
   const bytes=new Uint8Array(await data.arrayBuffer());if(fileType(bytes)!==f.mime_type)throw Error('El contenido del archivo no corresponde al formato indicado.');
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
   if(sha!==f.sha256)throw Error('La integridad del archivo cambió. Selecciona de nuevo el original.');
   const result=await rpc('complete',{id:f.id,verified_sha256:sha});return reply({...result,file:decorate(result.file)});
  }
  const result=await rpc(action,{id:f.id});return reply({...result,file:decorate(result.file)});
 }catch(e){return reply({message:e instanceof SyntaxError?'Solicitud inválida.':e instanceof Error?e.message:'No se pudo completar la operación.'},400);}
});
