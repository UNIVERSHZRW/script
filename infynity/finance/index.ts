import { createClient } from 'npm:@supabase/supabase-js@2.80.0';
import { userActions, adminActions, validClabe, paymentLink, fileType, safePayload } from './core.mjs';
import { depositReceiver } from './deposit-order.mjs';

const project=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb=createClient(project,service,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket=sb.storage.from('uhz-finance-proofs');
const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async(req)=>{
  if(req.method!=='POST')return response({message:'Método no permitido.'},405);
  try {
    const token=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');
    if(!token)return response({message:'Inicia sesión.'},401);
    const {data:{user},error:authError}=await sb.auth.getUser(token);if(authError||!user)return response({message:'Inicia sesión.'},401);
    let session:string;try {const raw=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');session=JSON.parse(atob(raw)).session_id;}catch{return response({message:'Sesión inválida.'},401);}
    if(!uuid.test(session!))return response({message:'Sesión inválida.'},401);
    const raw=await req.text();if(raw.length>20000)return response({message:'Solicitud demasiado grande.'},413);
    const body=JSON.parse(raw);const action=String(body.action||'');
    if(!userActions.has(action)&&!adminActions.has(action))return response({message:'Acción no permitida.'},400);
    const p=safePayload(body);
    if(p.id&&!uuid.test(p.id))throw Error('Folio inválido.');
    const rpc=async(a:string,data:any={})=>{const {data:out,error}=await sb.rpc('uhz_finance',{p_actor:user.id,p_session:session,p_action:a,p_payload:data});if(error){if(error.code==='23505')throw Error('La referencia o el comprobante ya está registrado.');if(error.code==='23514')throw Error('Revisa el importe y el saldo disponible.');if(['P0001','42501'].includes(error.code))throw Error(error.message);throw Error('No se pudo registrar la operación. Revisa los datos.');}return out;};
    // Fresh DB session and owner role are checked on every request, including uploads.
    const dash=await rpc(adminActions.has(action)?'admin_dashboard':'dashboard');
    if(action==='admin_dashboard') {
      const existingSpei=depositReceiver({
        name:Deno.env.get('SPEI_BANK_NAME'),
        holder:Deno.env.get('SPEI_BENEFICIARY_NAME'),
        clabe:Deno.env.get('SPEI_CLABE')?.replace(/\D/g,'')
      });
      return response({...dash,existing_spei:existingSpei});
    }
    if(action==='dashboard')return response(dash);
    if(action==='admin_config') {
      if(p.bank_clabe&&!validClabe(p.bank_clabe))throw Error('La CLABE receptora no es válida.');
      if(p.bank_clabe&&(!p.bank_name?.trim()||String(p.bank_holder||'').trim().length<4))throw Error('Registra el banco y el titular de la cuenta receptora.');
    }
    if(action==='create_request') {
      if(p.kind==='withdraw_mxn'&&!validClabe(p.clabe||''))throw Error('La CLABE de retiro no es válida.');
      if(!uuid.test(p.request_key||''))throw Error('Identificador inválido.');
    }
    if(action==='upload_url') {
      const detail=await rpc('request_detail',{id:p.id});const r=detail.request;
      if(r.kind!=='deposit_mxn'||!['requested','review'].includes(r.status))throw Error('Esta solicitud no admite comprobantes.');
      const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'} as any)[p.mime];if(!ext)throw Error('Adjunta PDF, JPG, PNG o WebP de hasta 2 MB.');
      const path=user.id+'/'+p.id+'/'+crypto.randomUUID()+'.'+ext;
      const {data,error}=await bucket.createSignedUploadUrl(path);if(error)throw Error('No se pudo preparar el comprobante.');return response({ok:true,path,signed_url:data.signedUrl});
    }
    if(action==='attach_proof') {
      await rpc('request_detail',{id:p.id});
      if(typeof p.path!=='string'||!p.path.startsWith(user.id+'/'+p.id+'/')||p.path.includes('..'))throw Error('Comprobante inválido.');
      const {data,error}=await bucket.download(p.path);if(error||!data||data.size>2097152)throw Error('Revisa el comprobante (máximo 2 MB).');
      const bytes=new Uint8Array(await data.arrayBuffer());if(!fileType(bytes))throw Error('El archivo debe ser PDF, JPG, PNG o WebP.');
      p.sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
    }
    if(action==='proof_url'||action==='admin_proof_url') {
      const detail=await rpc(action==='proof_url'?'request_detail':'admin_detail',{id:p.id});if(!detail.request.proof_path)throw Error('No hay comprobante adjunto.');
      const {data,error}=await bucket.createSignedUrl(detail.request.proof_path,60,{download:true});if(error)throw Error('No se pudo abrir el comprobante.');return response({ok:true,url:data.signedUrl});
    }
    if(action==='admin_review') {
      if(p.decision==='payment_link'&&!paymentLink(p.payment_link||''))throw Error('Utiliza un enlace HTTPS de Mercado Pago.');
      if(p.decision==='complete'&&p.verified!==true)throw Error('Confirma la revisión de la operación.');
    }
    return response(await rpc(action,p));
  }catch(e) {
    const message=e instanceof SyntaxError?'Solicitud inválida.':e instanceof Error?e.message:'No se pudo completar la operación.';
    return response({message},400);
  }
});
