import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
let esbuild;try{esbuild=require('esbuild');}catch{esbuild=require(process.env.ESBUILD_PATH||'/workspace/scratch/e1b3688161c0/univershzrw/node_modules/esbuild');}
await esbuild.transform(await readFile('index.ts','utf8'),{loader:'ts',format:'esm'});
const files=Object.fromEntries(await Promise.all(['panel.html','panel.css','panel.js','core.mjs'].map(async name=>[name,await readFile(name,'utf8')])));
const version=createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0,12);
files['panel.html']=files['panel.html'].replaceAll('?v=1','?v='+version);
files['panel.js']=files['panel.js'].replace("'./core.mjs'","'./core.mjs?v="+version+"'");
await mkdir('dist',{recursive:true});
const worker=`const FILES=${JSON.stringify(files)};
const SECURITY={'x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','strict-transport-security':'max-age=31536000; includeSubDomains','permissions-policy':'camera=(), microphone=(), geolocation=()','x-robots-tag':'noindex, nofollow, noarchive','cross-origin-opener-policy':'same-origin-allow-popups','content-security-policy':"default-src 'self'; script-src 'self' https://univershzrw.com; style-src 'self' 'unsafe-inline' https://univershzrw.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://univershzrw.com; connect-src 'self' https://univershzrw.com https://kgqkszlennwhlyngktcc.supabase.co; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests"};
export default {async fetch(req){const u=new URL(req.url);if(!['univershzrw.com','www.univershzrw.com','admin.univershzrw.com'].includes(u.hostname))return new Response('No encontrado',{status:404});if(u.hostname==='www.univershzrw.com')return Response.redirect('https://univershzrw.com'+u.pathname+u.search,308);if(!['GET','HEAD'].includes(req.method))return new Response('Método no permitido',{status:405,headers:{...SECURITY,Allow:'GET, HEAD'}});const base=u.hostname==='admin.univershzrw.com'?'/inft':'/criptomoneda/panel';const path=u.pathname.replace(/\\/$/,'');let name;if(path===base)name='panel.html';else if(path.startsWith(base+'/'))name=path.slice(base.length+1);if(!Object.hasOwn(FILES,name||''))return new Response('No encontrado',{status:404,headers:SECURITY});const type=name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':'application/javascript';let body=FILES[name];if(name==='panel.html')body=body.replaceAll('__BASE__',base);return new Response(req.method==='HEAD'?null:body,{headers:{...SECURITY,'content-type':type+'; charset=utf-8','cache-control':name==='panel.html'?'private, no-store':'public, max-age=3600','x-uhz-finance-version':'1.0.0'}})}};
`;
await writeFile('dist/worker.mjs',worker);
await esbuild.transform(worker,{loader:'js',format:'esm'});
console.log('Financial portal and Edge Function syntax validated. Worker bytes:',Buffer.byteLength(worker));
