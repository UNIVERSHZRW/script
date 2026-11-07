const PROJECT='https://kgqkszlennwhlyngktcc.supabase.co',KEY='sb_publishable_9_e9NT4HdGejxqZ4mJ2yCw_5HoLAYQr';
const safeHeaders={'x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; frame-ancestors 'self'",'referrer-policy':'no-referrer','x-robots-tag':'noindex,nofollow','strict-transport-security':'max-age=31536000'};
const allowed=new Set(['image/png','image/jpeg','image/webp','image/gif','application/pdf','video/mp4']);
export default {async fetch(req){try{
 const u=new URL(req.url);if(u.hostname==='www.univershzrw.com')return Response.redirect('https://univershzrw.com'+u.pathname,308);
 if(u.hostname!=='univershzrw.com'||!/^\/_uhz\/admin-files\/[0-9a-f-]{36}$/.test(u.pathname))return new Response('No encontrado',{status:404,headers:safeHeaders});
 if(!['GET','HEAD'].includes(req.method))return new Response('Método no permitido',{status:405,headers:{...safeHeaders,Allow:'GET, HEAD'}});
 const id=u.pathname.split('/').pop(),r=await fetch(PROJECT+'/rest/v1/rpc/uhz_admin_asset_public',{method:'POST',headers:{apikey:KEY,'content-type':'application/json'},body:JSON.stringify({p_id:id}),signal:AbortSignal.timeout(8000)});
 const d=r.ok?await r.json():null;if(!d?.ok||d.bucket!=='uhz-public'||!/^admin\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|png|jpg|webp|gif|mp4)$/.test(d.path||'')||!allowed.has(d.mime)||d.size>20971520)return new Response('Archivo no disponible',{status:404,headers:safeHeaders});
 const etag='"'+d.sha256+'"';if(req.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers:{...safeHeaders,etag,'cache-control':'public,max-age=300'}});
 const headers={};const range=req.headers.get('range');if(range){if(!/^bytes=(\d+-\d*|-\d+)$/.test(range)||range.length>80)return new Response(null,{status:416,headers:safeHeaders});headers.Range=range;}
 const upstream=await fetch(PROJECT+'/storage/v1/object/public/uhz-public/'+d.path,{method:req.method,headers,signal:AbortSignal.timeout(15000)});
 if(!upstream.ok)return new Response('Archivo no disponible',{status:upstream.status===416?416:404,headers:safeHeaders});
 const out=new Headers({...safeHeaders,'content-type':d.mime,'cache-control':'public,max-age=300',etag});
 for(const h of ['content-length','content-range','accept-ranges'])if(upstream.headers.has(h))out.set(h,upstream.headers.get(h));
 if(d.mime==='application/pdf')out.set('content-disposition',"attachment; filename=\"documento.pdf\"; filename*=UTF-8''"+encodeURIComponent(d.name));
 return new Response(req.method==='HEAD'?null:upstream.body,{status:upstream.status,headers:out});
 }catch{return new Response('No se pudo consultar el archivo. Reintenta en un momento.',{status:503,headers:{...safeHeaders,'cache-control':'no-store'}});}}};
