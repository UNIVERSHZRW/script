#!/usr/bin/env node
/* UNIVERSHZRW Site Shell v2 - safe, opt-in publisher for the currently deployed Cloudflare Worker.
   Only applies the shared script/CSS addon; never redeploys a stale full Worker from the repo. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root=dirname(fileURLToPath(import.meta.url));
const js=readFileSync(resolve(root,'shell-v2.js'),'utf8');
const css=readFileSync(resolve(root,'shell-v2.css'),'utf8');
const apply=process.argv.includes('--apply');
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;
const worker='univershzrw-comunichat-nav';
if(!account||!token)throw Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your secure environment.');
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+worker;
const headers={Authorization:'Bearer '+token};
async function cloudflare(path,opts={}){
  const res=await fetch(path,{...opts,headers:{...headers,...opts.headers}});
  if(!res.ok)throw Error('Cloudflare HTTP '+res.status+' '+(await res.text()).slice(0,400));
  return res;
}
function once(src,search,replacement){
  const hits=src.split(search).length-1;
  if(hits!==1)throw Error('Unsafe source drift: expected 1 match, got '+hits+' for '+search.slice(0,60));
  return src.replace(search,replacement);
}
const response=await cloudflare(endpoint+'/content/v2');
const contentType=response.headers.get('content-type')||'';
if(!contentType.includes('multipart'))throw Error('Expected a multipart Worker source, received '+contentType);
const raw=await response.text();
const start=raw.indexOf('\r\n\r\n')+4,end=raw.lastIndexOf('\r\n--');
if(start<5||end<start)throw Error('Unexpected Worker multipart wrapper.');
let source=raw.slice(start,end);
const jsKey='const UHZ_UNIFIED_SHELL_JS=', cssKey=';\nconst UHZ_UNIFIED_SHELL_CSS=';
if(source.includes(jsKey)){
  const at=source.indexOf(jsKey),mid=source.indexOf(cssKey,at),after=source.indexOf(';\nfunction asset(req,body,type){',mid);
  if(mid<at||after<mid||source.indexOf(jsKey,at+1)>=0)throw Error('Unknown shell configuration.');
  source=source.slice(0,at)+jsKey+JSON.stringify(js)+cssKey+JSON.stringify(css)+source.slice(after);
}else{
  const anchor='function asset(req,body,type){';
  const cssRoute="url.searchParams.get('asset')==='app-shell'?asset(req,css,'text/css'):";
  const jsRoute="asset(req,header+UHZ_ARTICLE_BOOTSTRAP+UHZ_FLOW_ARTICLE_INLINE+UHZ_ARTICLE_FOOTER+UHZ_COIN_TIP_ARTICLE_LOADER,'application/javascript')";
  source=once(source,anchor,jsKey+JSON.stringify(js)+cssKey+JSON.stringify(css)+';\n'+anchor);
  source=once(source,cssRoute,cssRoute+"url.searchParams.get('asset')==='shell-v2'?asset(req,UHZ_UNIFIED_SHELL_CSS,'text/css'):");
  source=once(source,jsRoute,"asset(req,header+UHZ_ARTICLE_BOOTSTRAP+UHZ_FLOW_ARTICLE_INLINE+UHZ_ARTICLE_FOOTER+UHZ_COIN_TIP_ARTICLE_LOADER+UHZ_UNIFIED_SHELL_JS,'application/javascript')");
}
if(!source.includes('env.ORIGINAL_SITE.fetch(req)')||
   !source.includes("asset(req,UHZ_UNIFIED_SHELL_CSS,'text/css')")||
   !source.includes("UHZ_COIN_TIP_ARTICLE_LOADER+UHZ_UNIFIED_SHELL_JS"))
   throw Error('Required upstream binding or shared route missing.');
const lint=spawnSync('node',['--check','-'],{input:source,encoding:'utf8'});
if(lint.status!==0)throw Error('Worker syntax validation failed: '+lint.stderr.slice(0,1600));
const config=await (await cloudflare(endpoint+'/settings')).json();
if(!config.result?.bindings?.some(b=>b.name==='ORIGINAL_SITE'&&b.type==='service'))
  throw Error('The original site service binding is missing.');
console.log('Validated existing Cloudflare Worker:',worker,'size:',source.length,'bytes');
if(!apply){console.log('DRY RUN ONLY. Run with --apply to publish after review.');process.exit(0)}
const body=new FormData();
body.append('metadata',new Blob([JSON.stringify({main_module:'worker.mjs'})],{type:'application/json'}));
body.append('worker.mjs',new Blob([source],{type:'application/javascript+module'}),'worker.mjs');
const result=await (await cloudflare(endpoint+'/content',{method:'PUT',body})).json();
if(result.success!==true)throw Error('Cloudflare did not confirm deployment.');
const latest=await (await cloudflare(endpoint+'/content/v2')).text();
if(!latest.includes('UHZ_UNIFIED_SHELL_JS')||!latest.includes('UHZ_UNIFIED_SHELL_CSS'))
  throw Error('Published script is missing the shell addon.');
console.log('Shared shell v2 deployed. Confirm the site routes, menus, footer and legal pages.');
