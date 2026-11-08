import{PROVIDERS,describeURL,secureURL,canFetch}from'./providers.mjs';import{resolveSource,providerFetch}from'./resolver.mjs';import{seal,unseal}from'./tickets.mjs';
import playerHTML from'./player.html';import playerJS from'./player.js';import contributionJS from'./generated/contribution.txt';
export const MEDIA_PATH='/backend/media/';
const publicPath=req=>new URL(req.url).origin+'/_uhz/portal'+MEDIA_PATH;
const secret=env=>env.ADMIN_GUARDIAN_TOKEN;
const security={'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex,nofollow','cross-origin-resource-policy':'same-origin'};
const json=(body,status=200,cookies=[])=>{const h=new Headers({...security,'content-type':'application/json; charset=utf-8'});for(const c of cookies)h.append('set-cookie',c);return new Response(JSON.stringify(body),{status,headers:h});};
export async function mediaLinks(data,{request,env,user}){
 if(data?.ok!==true||!Array.isArray(data.sources)||!secret(env))return data;
 const sources=[];
 for(const src of data.sources.slice(0,6)){
  try{const info=describeURL(src.url);const ticket=await seal({aud:'source',url:info.url,user:user?.id||null,origin:new URL(request.url).origin},secret(env));sources.push({...src,url:publicPath(request)+'watch?t='+encodeURIComponent(ticket),label:info.mode==='account'?'Consultar en UNIVERSHZRW · '+info.providerName:'Abrir en UNIVERSHZRW · '+info.providerName,provider:info.provider,kind:src.kind});}
  catch{sources.push(src);}
 }return {...data,sources};
}
export async function mediaHandler(request,env,{sessionFor,ownerUser,trustedWrite,limited,jsonBody,fetcher=fetch}){
 const u=new URL(request.url),action=u.pathname.slice(MEDIA_PATH.length),base=publicPath(request);
 try{
  if(action==='providers'&&request.method==='GET')return json({providers:PROVIDERS});
  if(action==='contribution.js'&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:contributionJS,{headers:{...security,'content-type':'application/javascript; charset=utf-8','cache-control':'public,max-age=300'}});
  if(action==='player.js'&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:playerJS,{headers:{...security,'content-type':'application/javascript; charset=utf-8','cache-control':'public,max-age=300'}});
  if(action==='inspect'&&request.method==='POST'){
   if(!trustedWrite(request))return json({message:'Origen no permitido.'},403);
   const s=await sessionFor(request);if(!s.u)return json({message:'Inicia sesión.'},401);if(!ownerUser(s.u)||s.u.uhz_status?.must_change_password)return json({message:'Se requiere la cuenta propietaria.'},403);
   await limited(env.API_LIMIT,'media-inspect:'+s.u.id);const b=await jsonBody(request,5000),info=describeURL(b.url,b.provider||'auto');
   const resolved=await resolveSource(info.url,{fetcher}),ticket=await seal({aud:'source',url:info.url,user:s.u.id,origin:u.origin},secret(env));
   const {direct,url,embed,...safe}=resolved;
   return json({...safe,normalized:info.url,watch:base+'watch?t='+encodeURIComponent(ticket)},200,s.cookies);
  }
  if(!['GET','HEAD'].includes(request.method))return json({message:'Método no permitido.'},405);
  if(!['watch','info','stream','download','original'].includes(action))return json({message:'Ruta no encontrada.'},404);
  const cap=await unseal(u.searchParams.get('t')||'',secret(env),['stream','download'].includes(action)?'stream':'source');
  if(cap.origin!==u.origin)return json({message:'El enlace no pertenece a este sitio.'},403);
  let cookies=[];
  if(cap.user){const s=await sessionFor(request);cookies=s.cookies;if(!s.u||s.u.id!==cap.user||s.u.uhz_status?.must_change_password)return json({message:'Inicia sesión con la cuenta que abrió este contenido.'},401);}
  await limited(env.API_LIMIT,'media:'+action+':'+(cap.user||request.headers.get('cf-connecting-ip')||'unknown'));
  const info=describeURL(cap.url);
  if(action==='original'){const h=new Headers({...security,location:info.url});for(const c of cookies)h.append('set-cookie',c);return new Response(null,{status:302,headers:h});}
  if(action==='watch'){
   const nonce=crypto.randomUUID().replaceAll('-','');const h=new Headers({...security,'content-type':'text/html; charset=utf-8','x-frame-options':'DENY','content-security-policy':`default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'nonce-${nonce}'; img-src 'self' https://univershzrw.com; media-src 'self'; frame-src 'self' https://drive.google.com https://docs.google.com https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`});
   for(const c of cookies)h.append('set-cookie',c);return new Response(request.method==='HEAD'?null:playerHTML.replace('<style>','<style nonce="'+nonce+'">'),{headers:h});
  }
  if(action==='info'){
   const resolved=await resolveSource(info.url,{fetcher}),{direct,url,...safe}=resolved;let links={};
   if(resolved.state==='ready'&&direct){const ticket=await seal({aud:'stream',url:info.url,direct,provider:info.provider,user:cap.user,origin:cap.origin,name:resolved.name,type:resolved.type},secret(env));links={stream:base+'stream?t='+encodeURIComponent(ticket),download:base+'download?t='+encodeURIComponent(ticket)};}
   const renewed=await seal({aud:'source',url:info.url,user:cap.user,origin:cap.origin},secret(env));
   return json({...safe,...links,renew:base+'info?t='+encodeURIComponent(renewed),original:base+'original?t='+encodeURIComponent(renewed)},200,cookies);
  }
  if(cap.provider!==info.provider||!canFetch(secureURL(cap.direct).hostname,info.provider))return json({message:'Destino no autorizado.'},403);
  const range=request.headers.get('range');if(range&&!/^bytes=(?:\d+-\d*|-\d+)$/.test(range))return json({message:'Rango de archivo no válido.'},416);
  const {response}=await providerFetch(cap.direct,info.provider,{method:request.method,headers:{...(range?{Range:range}:{}),...(request.headers.has('if-range')?{'If-Range':request.headers.get('if-range')}: {})},fetcher});
  const type=response.headers.get('content-type')||'application/octet-stream';if(/text\/html|application\/(?:xhtml|json)/i.test(type)){await response.body?.cancel();return json({message:'El proveedor requiere abrir de nuevo el archivo.'},409);}
  const h=new Headers({...security,'content-type':type,'x-frame-options':'SAMEORIGIN','content-security-policy':"default-src 'none'; sandbox; frame-ancestors 'self'"});for(const name of ['content-length','content-range','accept-ranges','etag','last-modified'])if(response.headers.has(name))h.set(name,response.headers.get(name));
  h.set('content-disposition',(action==='download'||!['video','audio','image','application/pdf'].some(p=>type.startsWith(p))?'attachment':'inline')+"; filename*=UTF-8''"+encodeURIComponent(cap.name||'Archivo').replace(/'/g,'%27'));
  for(const c of cookies)h.append('set-cookie',c);return new Response(response.body,{status:response.status,headers:h});
 }catch(e){return json({message:e.status?e.message:'No se pudo consultar el enlace. Revisa el acceso y vuelve a intentar.'},e.status||400);}
}
