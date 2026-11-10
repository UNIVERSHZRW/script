/* Canonical economy navigation. Only aliases /economia and /economia/ are redirected; existing API, Coins and INFT routes remain untouched. */
export default {async fetch(request){
 const u=new URL(request.url);
 if(u.pathname!=='/economia'&&u.pathname!=='/economia/')return new Response('No encontrado',{status:404});
 if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405,headers:{Allow:'GET, HEAD'}});
 const target=new URL('/economia/centro',u.origin);target.search=u.search;
 return Response.redirect(target.toString(),308);
}};