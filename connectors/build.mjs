import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import*as esbuild from'../admin/node_modules/esbuild/lib/main.js';
import { repairAccountEndpoints } from '../shared-ui/public-ui/repair-account-endpoints.mjs';
await mkdir('connectors/generated',{recursive:true});await mkdir('connectors/dist',{recursive:true});
const contribution=await esbuild.build({entryPoints:['connectors/contribution.js'],bundle:true,minify:true,format:'iife',target:['es2022'],write:false});
const client=contribution.outputFiles[0].text;await writeFile('connectors/generated/contribution.txt',client);
let core=repairAccountEndpoints(await readFile('connectors/original/univershzrw-comunidad.mjs','utf8'));
function replaceOnce(source,old,value){if(source.split(old).length!==2)throw Error('Patch target changed: '+old.slice(0,90));return source.replace(old,value);}
core=replaceOnce(core,'async function backend(req,env) {','async function backend(req,env) {\n if(new URL(req.url).pathname.startsWith(MEDIA_PATH))return mediaHandler(req,env,{sessionFor,ownerUser,trustedWrite,limited,jsonBody});');
core=replaceOnce(core,"const out=new Response(upstream.body,{status:upstream.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});for(const cookie of session.cookies)out.headers.append('Set-Cookie',cookie);return out;", "const data=await upstream.json();const wrapped=upstream.ok?await mediaLinks(data,{request:req,env,user:session.u}):data;const out=new Response(JSON.stringify(wrapped),{status:upstream.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});for(const cookie of session.cookies)out.headers.append('Set-Cookie',cookie);return out;");
await writeFile('connectors/generated/community-entry.mjs',"import{MEDIA_PATH,mediaHandler,mediaLinks}from'../media-service.mjs';\n"+core);
await esbuild.build({entryPoints:['connectors/generated/community-entry.mjs'],bundle:true,minify:false,format:'esm',platform:'neutral',target:['es2022'],loader:{'.html':'text','.js':'text','.txt':'text'},outfile:'connectors/dist/univershzrw-comunidad.mjs'});
// Active contribution Worker and the older creator/collaboration screens receive the same client.
let aportes=await readFile('connectors/original/univershzrw-aportes.mjs','utf8');
aportes=replaceOnce(aportes,'<script src=\\"/Aportar_contenido/app.js\\" defer></script>','<script src=\\"/_uhz/portal/backend/media/contribution.js?v=1\\" defer></script><script src=\\"/Aportar_contenido/app.js\\" defer></script>');
aportes=replaceOnce(aportes,'</head>',"<link rel=\\\"stylesheet\\\" href=\\\"/herramientas/inline.css?v=20261109-inplace\\\"><script defer src=\\\"/herramientas/inline.js?v=20261109-inplace\\\"></script>"+'</head>');
await writeFile('connectors/dist/univershzrw-aportes.mjs',aportes);
const main=await readFile('connectors/original/univershzrw.mjs','utf8');
const extra="<script src=\"/_uhz/portal/backend/media/contribution.js?v=1\" defer></script>";
const patched=replaceOnce(main,'export{Ba as default};',`var linked={async fetch(req,env,ctx){const r=await Ba.fetch(req,env,ctx);if(req.method==='HEAD'||!r.headers.get('content-type')?.includes('text/html')||!['/creadores','/mejoras'].some(p=>new URL(req.url).pathname.startsWith(p)))return r;const body=(await r.text()).replace('</head>',${JSON.stringify(extra)}+'</head>');const headers=new Headers(r.headers);headers.delete('content-length');headers.delete('etag');return new Response(body,{status:r.status,headers});}};export{linked as default};`);
await writeFile('connectors/dist/univershzrw.mjs',patched);
const report={builtAt:new Date().toISOString(),providers:10,dependenciesOnFAK:0,workers:{}};for(const name of ['univershzrw-comunidad','univershzrw-aportes','univershzrw']){const code=await readFile('connectors/dist/'+name+'.mjs');report.workers[name]={bytes:code.length,sha256:createHash('sha256').update(code).digest('hex')};}await writeFile('connectors/dist/build.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
