import { createClient } from 'npm:@supabase/supabase-js@2.80.0';
import { verifyMessage, formatUnits } from 'npm:viem@2.57.16';
import { userActions, adminActions, validClabe, paymentLink, fileType, safePayload, validateTransfer, isInftSymbol } from './core.mjs';

const project=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb=createClient(project,service,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket=sb.storage.from('uhz-finance-proofs');
const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash=/^0x[0-9a-fA-F]{64}$/;
const address=/^0x[0-9a-fA-F]{40}$/;

async function chainCall(method:string,params:unknown[]) {
  for(const endpoint of ['https://polygon-bor-rpc.publicnode.com','https://polygon.drpc.org']) {
    try {const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(7000)});const j=await r.json();if(!r.ok||j.error||j.result===undefined)throw Error();return j.result;}catch{}
  }
  throw Error('La verificación blockchain está en proceso. Reintenta la conciliación.');
}
async function reserveProof(cfg:any,r:any,p:any) {
  if(!address.test(cfg.token_address||'')||!address.test(cfg.treasury_address||''))throw Error('Registra el contrato y la tesorería en Configuración.');
  if(BigInt(await chainCall('eth_chainId',[]))!==137n)throw Error('Red de verificación incorrecta.');
  const latest=BigInt(await chainCall('eth_blockNumber',[]));const block='0x'+(latest-128n).toString(16);
  const code=await chainCall('eth_getCode',[cfg.token_address,block]);if(code==='0x')throw Error('El contrato no existe en Polygon.');
  const decimals=Number(BigInt(await chainCall('eth_call',[{to:cfg.token_address,data:'0x313ce567'},block])));
  if(decimals!==cfg.token_decimals)throw Error('La precisión del contrato cambió. Revisa la configuración.');
  const balance=BigInt(await chainCall('eth_call',[{to:cfg.token_address,data:'0x70a08231'+cfg.treasury_address.slice(2).padStart(64,'0')},block]));
  // Both a confirmed snapshot and the current reserve must cover custody liabilities.
  const current=BigInt(await chainCall('eth_call',[{to:cfg.token_address,data:'0x70a08231'+cfg.treasury_address.slice(2).padStart(64,'0')},'latest']));
  const proof:any={chain_verified:true,token_address:cfg.token_address,treasury_address:cfg.treasury_address,reserve_inft:formatUnits(balance<current?balance:current,decimals),observed_at:new Date().toISOString(),block};
  if(['deposit_inft','withdraw_inft'].includes(r.kind)) {
    const tx=p.crypto_hash||r.crypto_hash;if(!hash.test(tx||''))throw Error('Registra el hash de la transferencia.');
    const receipt=await chainCall('eth_getTransactionReceipt',[tx]);
    if(!receipt||receipt.status!=='0x1'||BigInt(receipt.blockNumber)>latest-128n)throw Error('La transferencia necesita 128 confirmaciones en Polygon.');
    const canonical=await chainCall('eth_getBlockByNumber',[receipt.blockNumber,false]);
    validateTransfer(receipt,canonical,cfg,r,tx,latest);
    Object.assign(proof,{crypto_hash:tx.toLowerCase(),transfer_inft:r.amount,block:receipt.blockNumber});
  }
  return proof;
}

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
    let p=safePayload(body);
    if(p.id&&!uuid.test(p.id))throw Error('Folio inválido.');
    const rpc=async(a:string,data:any={})=>{const {data:out,error}=await sb.rpc('uhz_finance',{p_actor:user.id,p_session:session,p_action:a,p_payload:data});if(error){if(error.code==='23505')throw Error('La referencia o el comprobante ya está registrado.');if(error.code==='23514')throw Error('Revisa el importe y el saldo disponible.');if(['P0001','42501'].includes(error.code))throw Error(error.message);throw Error('No se pudo registrar la operación. Revisa los datos.');}return out;};
    // Fresh DB session and owner role are checked on every request, including uploads.
    const dash=await rpc(adminActions.has(action)?'admin_dashboard':'dashboard');
    if(action==='dashboard'||action==='admin_dashboard')return response(dash);
    if(action==='admin_config') {
      if(p.bank_clabe&&!validClabe(p.bank_clabe))throw Error('La CLABE receptora no es válida.');
      if(p.bank_clabe&&(!p.bank_name?.trim()||String(p.bank_holder||'').trim().length<4))throw Error('Registra el banco y el titular de la cuenta receptora.');
      if(p.token_address) {
        if(!address.test(p.token_address)||!address.test(p.treasury_address||'')||/^0x0{40}$/i.test(p.token_address)||/^0x0{40}$/i.test(p.treasury_address))throw Error('Revisa las direcciones del contrato y la tesorería.');
        if(BigInt(await chainCall('eth_chainId',[]))!==137n)throw Error('Red incorrecta.');
        const symbol=await chainCall('eth_call',[{to:p.token_address,data:'0x95d89b41'},'latest']);if(!isInftSymbol(symbol))throw Error('El contrato debe corresponder al token INFT.');
        const decimals=Number(BigInt(await chainCall('eth_call',[{to:p.token_address,data:'0x313ce567'},'latest'])));if(decimals<0||decimals>18)throw Error('Precisión de contrato incompatible.');p.token_decimals=decimals;
      }
    }
    if(action==='create_request') {
      if(p.kind==='withdraw_mxn'&&!validClabe(p.clabe||''))throw Error('La CLABE de retiro no es válida.');
      if(!uuid.test(p.request_key||''))throw Error('Identificador inválido.');
    }
    if(action==='wallet_bind') {
      if(!address.test(p.address||'')||!/^0x[0-9a-fA-F]{130}$/.test(p.signature||'')||!uuid.test(p.nonce||''))throw Error('Firma inválida.');
      const challenge=await rpc('challenge_data',{nonce:p.nonce});if(!challenge?.message)throw Error('La firma caducó. Vincula nuevamente.');
      if(!await verifyMessage({address:p.address,message:challenge.message,signature:p.signature}))throw Error('La firma no corresponde a la cartera.');
      return response(await rpc('wallet_bind_verified',{address:p.address.toLowerCase(),nonce:p.nonce}));
    }
    if(action==='upload_url') {
      const detail=await rpc('request_detail',{id:p.id});const r=detail.request;
      if(!['deposit_mxn','deposit_inft'].includes(r.kind)||!['requested','review'].includes(r.status))throw Error('Esta solicitud no admite comprobantes.');
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
      if(p.decision==='complete') {
        if(p.verified!==true)throw Error('Confirma la conciliación bancaria o blockchain.');
        const detail=await rpc('admin_detail',{id:p.id});if(!['deposit_mxn','withdraw_mxn'].includes(detail.request.kind))p={...p,...await reserveProof(dash.config,detail.request,p)};
      }
    }
    return response(await rpc(action,p));
  }catch(e) {
    const message=e instanceof SyntaxError?'Solicitud inválida.':e instanceof Error?e.message:'No se pudo completar la operación.';
    return response({message},400);
  }
});
