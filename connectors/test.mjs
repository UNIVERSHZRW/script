import test from'node:test';import assert from'node:assert/strict';import{readFile,mkdir}from'node:fs/promises';import{build}from'../admin/node_modules/esbuild/lib/main.js';import{describeURL,secureURL}from'./providers.mjs';import{resolveSource,parseMediaFire,providerFetch,limitedText}from'./resolver.mjs';import{seal,unseal}from'./tickets.mjs';
await mkdir('connectors/tests-generated',{recursive:true});await build({entryPoints:['connectors/media-service.mjs'],bundle:true,format:'esm',platform:'node',loader:{'.js':'text','.html':'text','.txt':'text'},outfile:'connectors/tests-generated/service.mjs'});
const{mediaHandler,mediaLinks}=await import('./tests-generated/service.mjs');
const{default:core}=await import('./dist/univershzrw-comunidad.mjs');
const secret='isolated-tests-only-not-a-production-key',origin='https://univershzrw.com',owner='10000000-0000-4000-8000-000000000001',sample='https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const env={ADMIN_GUARDIAN_TOKEN:secret,API_LIMIT:{limit:async()=>({success:true})}};
const deps={sessionFor:async()=>({u:null,cookies:[]}),ownerUser:u=>u?.id===owner,trustedWrite:r=>r.headers.get('origin')===new URL(r.url).origin,limited:async()=>{},jsonBody:(r)=>r.json()};
const req=(action,t,opts={})=>new Request(origin+'/backend/media/'+action+(t?'?t='+encodeURIComponent(t):''),opts);
test('provider normalization preserves resource keys, fragment keys and SharePoint permissions',()=>{
 assert.equal(describeURL('https://drive.google.com/open?id=123456789012345&resourcekey=keep-me&utm_source=x').embed,'https://drive.google.com/file/d/123456789012345/preview?resourcekey=keep-me');
 assert.equal(describeURL('https://mega.nz/file/abcdefgh#secret-key').url,'https://mega.nz/file/abcdefgh#secret-key');assert.equal(describeURL('https://tenant.sharepoint.com/:v:/s/library/abc?e=permission').provider,'onedrive');
 assert.equal(describeURL('https://www.terabox.com/s/abcdef').provider,'terabox');assert.equal(describeURL('https://drive.google.com/drive/folders/abc').folder,true);
 assert.throws(()=>describeURL('https://www.mediafire.com/file/abcdefghij/test.mp4/file','terabox'));
});
test('rejects credentials, protocols, fake domains, local networks, alternate ports and obfuscated hosts',()=>{
 for(const url of ['http://www.mediafire.com/file/abc/file','https://www.mediafire.com.evil.test/file/abc/file','https://127.0.0.1/x','https://[::1]/x','https://2130706433/x','https://mediafire.com@evil.test/file','https://www.mediafire.com:444/file/abc/file','https://www.mediafire.com./file/abc/file','https://www.mediafire.com\\@evil.test/x','javascript:alert(1)','https://localhost/x','https://metadata.google.internal/x'])assert.throws(()=>describeURL(url),url);
});
test('MediaFire parses only its public download button and validates the destination',()=>{
 const direct='https://download123.mediafire.com/random/file/archivo.mp4';assert.equal(parseMediaFire(`<a href="${direct}?a=1&amp;b=2" id="downloadButton">Download</a>`),direct+'?a=1&b=2');
 assert.equal(parseMediaFire('<script>fakeDownload()</script><div>captcha</div>'),null);assert.throws(()=>parseMediaFire('<a id="downloadButton" href="https://evil.test/file.mp4">Download</a>'));
});
test('resolver confirms MIME, size and Range; it does not label a login page playable',async()=>{
 const calls=[];const f=async(url,o)=>{calls.push({url,o});return url.includes('www.mediafire.com')?new Response('<a id="downloadButton" href="https://download123.mediafire.com/a/movie.mp4">D</a>',{headers:{'content-type':'text/html'}}):new Response('x',{status:206,headers:{'content-type':'video/mp4','content-range':'bytes 0-0/4321'}});};
 const d=await resolveSource('https://www.mediafire.com/file/abcdefghijk/movie.mp4/file',{fetcher:f});assert.equal(d.state,'ready');assert.equal(d.kind,'video');assert.equal(d.size,4321);assert.equal(calls[1].o.headers.Range,'bytes=0-0');
 const b=await resolveSource(sample,{fetcher:async()=>new Response('<html>login</html>',{headers:{'content-type':'text/html'}})});assert.equal(b.state,'restricted');assert.equal(b.direct,undefined);
});
test('redirects to a private network or unrelated host are rejected before any follow-up fetch',async()=>{
 let n=0;await assert.rejects(()=>providerFetch(sample,'direct',{fetcher:async()=>{n++;return new Response(null,{status:302,headers:{location:'https://127.0.0.1/admin'}});}}));assert.equal(n,1);
 await assert.rejects(()=>limitedText(new Response('x'.repeat(100)),50));
});
test('TeraBox, MEGA and OneDrive report connection requirements without a FAK request',async()=>{
 for(const url of ['https://terabox.com/s/a','https://mega.nz/file/abc#key','https://1drv.ms/v/s!abc']){const d=await resolveSource(url,{fetcher:()=>{throw Error('No network expected');}});assert.equal(d.state,'connection_required');assert.equal(d.direct,undefined);}
});
test('capabilities hide the original, reject tampering, wrong audience and expiry',async()=>{
 const cap=await seal({aud:'source',url:sample,origin,user:null},secret,100000);assert.equal(cap.includes(sample),false);assert.equal((await unseal(cap,secret,'source',100001)).url,sample);
 await assert.rejects(()=>unseal(cap,secret,'stream',100001));await assert.rejects(()=>unseal(cap,secret,'source',1000000));await assert.rejects(()=>unseal(cap.slice(0,-5)+'abcde',secret,'source',100001));
});
test('catalog decoration occurs after confirmed access and preserves unconfirmed results',async()=>{
 const input={ok:true,sources:[{kind:'original',url:sample}]},d=await mediaLinks(input,{request:req('inspect'),env,user:{id:owner}});assert.equal(d.sources[0].url.includes(sample),false);const cap=new URL(d.sources[0].url).searchParams.get('t');assert.equal((await unseal(cap,secret,'source')).user,owner);const rejected={ok:false,error:'payment_required'};assert.equal(await mediaLinks(rejected,{request:req('inspect'),env}),rejected);
});
test('admin inspection refuses unauthenticated, non-owner and cross-origin requests',async()=>{
 const options={method:'POST',headers:{Origin:origin,'content-type':'application/json'},body:JSON.stringify({url:sample})};assert.equal((await mediaHandler(req('inspect',null,options),env,deps)).status,401);
 assert.equal((await mediaHandler(req('inspect',null,options),env,{...deps,sessionFor:async()=>({u:{id:'another'},cookies:[]})})).status,403);
 assert.equal((await mediaHandler(req('inspect',null,{...options,headers:{origin:'https://evil.test'}}),env,deps)).status,403);
});
test('built core serves connectors and transforms only successful authorized catalog responses',async()=>{
 const prior=globalThis.fetch;let grant=false;globalThis.fetch=async(input,opts)=>{assert.ok(String(input).includes('/rest/v1/rpc/uhz_catalog_api'));assert.equal(JSON.parse(opts.body).p_action,'access');return Response.json(grant?{ok:true,sources:[{kind:'original',url:sample}]}:{ok:false,error:'payment_required'});};
 try{const r=await core.fetch(req('providers'),env);assert.equal((await r.json()).providers.length,10);
 const make=()=>new Request(origin+'/backend/rest/v1/rpc/uhz_catalog_api',{method:'POST',headers:{Origin:origin,'content-type':'application/json'},body:JSON.stringify({p_action:'access',p_payload:{id:'fixture'}})});
 let result=await(await core.fetch(make(),env)).json();assert.equal(result.error,'payment_required');assert.equal(result.sources,undefined);grant=true;result=await(await core.fetch(make(),env)).json();assert.ok(result.sources[0].url.startsWith(origin+'/_uhz/portal/backend/media/watch?t='));assert.equal(result.sources[0].url.includes(sample),false);
 }finally{globalThis.fetch=prior;}
});
test('watch, info and stream require matching session, origin and a valid capability',async()=>{
 const t=await seal({aud:'source',url:sample,user:owner,origin},secret);assert.equal((await mediaHandler(req('watch',t),env,deps)).status,401);
 const anon=await seal({aud:'source',url:sample,user:null,origin},secret);const r=await mediaHandler(req('watch',anon),env,deps);assert.equal(r.status,200);assert.ok(r.headers.get('content-security-policy').includes("frame-ancestors 'none'"));assert.ok(r.headers.get('content-security-policy').includes("connect-src 'self'"));assert.ok((await r.text()).includes('Visor de contenido'));
 const other=new Request('https://admin.univershzrw.com/backend/media/watch?t='+anon);assert.equal((await mediaHandler(other,env,deps)).status,403);
});
test('player returns only an encrypted stream URL and forwards valid byte ranges',async()=>{
 const t=await seal({aud:'source',url:sample,user:null,origin},secret);const fetcher=async(url,opts)=>new Response('x',{status:206,headers:{'content-type':'video/mp4','content-range':opts.headers.Range==='bytes=0-0'?'bytes 0-0/400':'bytes 0-5/400','accept-ranges':'bytes'}});
 let r=await mediaHandler(req('info',t),env,{...deps,fetcher}),d=await r.json();assert.equal(d.state,'ready');assert.equal(d.url,undefined);assert.equal(d.direct,undefined);assert.ok(d.stream.startsWith(origin+'/_uhz/portal/backend/media/stream?'));assert.equal(d.stream.includes(sample),false);
 const streamTicket=new URL(d.stream).searchParams.get('t');r=await mediaHandler(req('stream',streamTicket,{headers:{Range:'bytes=0-5'}}),env,{...deps,fetcher});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 0-5/400');assert.equal(await r.text(),'x');
 r=await mediaHandler(req('stream',streamTicket,{headers:{Range:'bytes=0-5,10-20'}}),env,{...deps,fetcher});assert.equal(r.status,416);
});
test('expanded provider validator rejects forged domains in isolated Postgres',async()=>{
 const {PGlite}=await import('../admin/node_modules/@electric-sql/pglite/dist/index.js');const db=new PGlite();try{await db.exec('create schema private;');await db.exec(await readFile('connectors/provider-domains.sql','utf8'));
 for(const [value,expected]of [['https://1drv.ms/v/abc',true],['https://tenant.sharepoint.com/:v:/abc',true],['https://www.mediafire.com/file/abc/file',true],['https://mega.io/file/a#key',true],['https://univershzrw.com/_uhz/admin-files/abc',true],['https://drive.google.com.evil.test/file/d/abc',false],['https://www.mediafire.com@evil.test/a',false],['https://mediafire.com:443/a',false],['https://mediafire.com\\@evil.test/a',false],['https://127.0.0.1/a',false]])assert.equal((await db.query('select private.uhz_catalog_safe_url($1) as ok',[value])).rows[0].ok,expected,value);
 }finally{await db.close();}
});
