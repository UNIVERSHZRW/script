/* UNIVERSHZRW article QR mount. Delegates existing article service; does not touch external media. */
const head='<link rel="stylesheet" href="/herramientas/inline.css?v=20261109-inplace"><script defer src="/herramientas/inline.js?v=20261109-inplace"></script>';
export default {
 async fetch(req,env,ctx){
  if(!env.ORIGINAL_SITE)return new Response('Servicio no disponible',{status:503});
  const upstream=await env.ORIGINAL_SITE.fetch(req);
  const u=new URL(req.url);
  if(req.method!=='GET'||!u.pathname.toLowerCase().startsWith('/recurso/')||!upstream.headers.get('content-type')?.includes('text/html')||upstream.status!==200)return upstream;
  const rewritten=new HTMLRewriter().on('head',{element(e){e.append(head,{html:true})}}).transform(upstream);
  const h=new Headers(rewritten.headers);h.delete('content-length');h.delete('etag');h.set('cache-control','no-store');
  return new Response(rewritten.body,{status:rewritten.status,statusText:rewritten.statusText,headers:h});
 }
};
