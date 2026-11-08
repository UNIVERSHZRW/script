import{describeURL,secureURL,canFetch,mediaKind}from'./providers.mjs';
export async function limitedText(response,max=400000){
 if(!response.body)return '';const reader=response.body.getReader(),parts=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw Error('La respuesta del proveedor es demasiado grande.');parts.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}return new TextDecoder().decode(bytes);
}
export async function providerFetch(value,provider,{method='GET',headers={},fetcher=fetch}={}){
 let u=secureURL(value);
 for(let i=0;i<5;i++){
  if(!canFetch(u.hostname,provider))throw Error('El proveedor redirigió a un destino no autorizado.');
  const r=await fetcher(u.href,{method,redirect:'manual',headers:{Accept:'*/*',...headers},signal:AbortSignal.timeout(12000)});
  if(r.status>=300&&r.status<400&&r.headers.get('location')){await r.body?.cancel();u=secureURL(new URL(r.headers.get('location'),u).href);continue;}
  return {response:r,url:u.href};
 }throw Error('El proveedor devolvió demasiadas redirecciones.');
}
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#38;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'");
export function parseMediaFire(html){
 // Read only the public download link. Never execute provider scripts or solve challenges.
 if(/captcha|cf-chl-|challenge-platform/i.test(html)&&!/id=["']downloadButton["']/i.test(html))return null;
 for(const tag of html.match(/<a\b[^>]*>/gi)||[]){
  if(!/\bid\s*=\s*["']downloadButton["']/i.test(tag))continue;
  const href=tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];if(!href)continue;
  const u=secureURL(decode(href));if(!/^download[0-9]+\.mediafire\.com$/.test(u.hostname))throw Error('El destino de descarga no pertenece a MediaFire.');return u.href;
 }return null;
}
function contentName(response,url,fallback){const d=response.headers.get('content-disposition')||'';let name=d.match(/filename\*=UTF-8''([^;]+)/i)?.[1]||d.match(/filename="([^"]+)"/i)?.[1];try{name=name?decodeURIComponent(name):decodeURIComponent(new URL(url).pathname.split('/').pop());}catch{}return (name||fallback||'Archivo').replace(/[\u0000-\u001f]/g,'').slice(0,200);}
export async function resolveSource(value,{fetcher=fetch}={}){
 const info=describeURL(value);if(info.folder)return {...info,state:'folder'};
 if(info.embed)return {...info,state:'preview',kind:'embed'};
 if(['terabox','onedrive','mega'].includes(info.provider))return {...info,state:'connection_required',kind:'external'};
 let direct=info.url;
 if(info.provider==='mediafire'){
  const {response}=await providerFetch(info.url,'mediafire',{fetcher});
  if(!response.ok){await response.body?.cancel();return {...info,state:response.status===404||response.status===410?'unavailable':'restricted',kind:'external'};}
  const html=await limitedText(response);direct=parseMediaFire(html);
  if(!direct)return {...info,state:'restricted',kind:'external'};
 }
 if(info.provider==='dropbox'){const u=new URL(info.url);u.searchParams.delete('dl');u.searchParams.set('raw','1');direct=u.href;}
 // A bounded Range GET confirms MIME type and support without downloading the file.
 const {response,url}=await providerFetch(direct,info.provider,{headers:{Range:'bytes=0-0'},fetcher});
 const type=response.headers.get('content-type')||'',name=contentName(response,url,info.name),size=Number(response.headers.get('content-range')?.split('/')[1]||response.headers.get('content-length')||0)||null;
 await response.body?.cancel();
 if(!response.ok)return {...info,name,state:response.status===404||response.status===410?'unavailable':'restricted',kind:'external'};
 if(/text\/html|application\/(?:xhtml|json)/i.test(type))return {...info,name,state:'restricted',kind:'external'};
 return {...info,name,state:'ready',kind:mediaKind(type,name),direct:url,type,size,range:response.status===206||response.headers.get('accept-ranges')==='bytes'};
}
