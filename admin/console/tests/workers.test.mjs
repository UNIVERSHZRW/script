import test from 'node:test';import assert from 'node:assert/strict';
import admin from '../dist/univershzrw-admin.mjs';import proxy from '../dist/univershzrw-comunidad.mjs';import files from '../public-files-worker.mjs';
import {fileType,normalizeUpload,publicAssetURL} from '../core.mjs';
import finance from '../dist/univershzrw-inft-panel.mjs';
const owner={id:'10000000-0000-4000-8000-000000000001',email:'univershzrw@gmail.com',role:'superadmin',email_confirmed_at:new Date().toISOString(),must_change_password:false};
const limit={limit:async()=>({success:true})};
test('shell and upload assets have safe MIME, fresh versions and bounded storage origins',async()=>{
 const response=await admin.fetch(new Request('https://admin.univershzrw.com/'),{});assert.equal(response.status,200);const h=await response.text();assert.ok(h.includes('data-uhz-admin-shell="2"'));assert.ok(h.includes('univershzrw@gmail.com'));assert.ok(h.includes('id="uploadView"'));assert.equal(response.headers.get('X-UHZ-Admin-Shell'),'2');assert.ok(!response.headers.get('content-security-policy').includes("script-src 'self' 'unsafe-inline'"));
 for(const path of ['/admin.js','/admin.css','/_uhz/admin-uploads.js','/_uhz/admin-child.js','/_uhz/admin-child.css']){const r=await admin.fetch(new Request('https://admin.univershzrw.com'+path),{});assert.equal(r.status,200,path);assert.ok(r.headers.get('content-security-policy').includes('https://kgqkszlennwhlyngktcc.storage.supabase.co'));}
});
test('finance embeds only into its admin origin and retains customer frame denial',async()=>{
 const a=await finance.fetch(new Request('https://admin.univershzrw.com/inft?embed=1'));assert.equal(a.headers.get('x-frame-options'),'SAMEORIGIN');assert.ok(a.headers.get('content-security-policy').includes("frame-ancestors 'self'"));assert.ok((await a.text()).includes('/_uhz/admin-child.js'));
 const b=await finance.fetch(new Request('https://univershzrw.com/criptomoneda/panel'));assert.equal(b.headers.get('x-frame-options'),'DENY');assert.ok(b.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
});
test('protected modules reject an unrelated superadmin email',async()=>{
 const env={COMMUNITY_APP:{fetch:async()=>Response.json({...owner,email:'foreign@example.test'})}};const r=await admin.fetch(new Request('https://admin.univershzrw.com/economia/administrar'),env);assert.equal(r.status,401);
});
test('canonical owner modules share upload helper and maintain same-origin frames',async()=>{
 const env={COMMUNITY_APP:{fetch:async()=>Response.json(owner)}};for(const path of ['/economia/administrar','/catalogo','/legacy?view=products']){const r=await admin.fetch(new Request('https://admin.univershzrw.com'+path),env);assert.equal(r.status,200,path);const h=await r.text();assert.ok(h.includes('/_uhz/admin-uploads.js'));assert.ok(h.includes('/_uhz/admin-child.js'));if(path.startsWith('/legacy')){const meta=h.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/)?.[0];assert.ok(meta?.includes('https://kgqkszlennwhlyngktcc.storage.supabase.co'),'legacy meta CSP must allow resumable uploads');}assert.ok(r.headers.get('content-security-policy').includes("frame-ancestors 'self'"));}
});
test('legacy writes fall back to the configured limiter rather than failing with missing WRITE_LIMIT',async()=>{
 const prior=globalThis.fetch;let forwarded=false;globalThis.fetch=async input=>{const u=String(input);if(u.includes('/auth/v1/user'))return Response.json(owner);if(u.includes('/rpc/uhz_account_status'))return Response.json({role:'superadmin',must_change_password:false});if(u.includes('/rest/v1/products')){forwarded=true;return Response.json({ok:true});}throw Error('Unexpected '+u);};
 try{const r=await proxy.fetch(new Request('https://admin.univershzrw.com/admin-backend/rest/v1/products?id=eq.fixture',{method:'PATCH',headers:{Origin:'https://admin.univershzrw.com','content-type':'application/json',cookie:'__Host-uhz-access=fixture-token'},body:JSON.stringify({name:'Fixture'})}),{API_LIMIT:limit});assert.equal(r.status,200,await r.clone().text());assert.equal(forwarded,true);}finally{globalThis.fetch=prior;}
});
test('owner recovery keeps the must-change-password signal available without granting module access',async()=>{
 const prior=globalThis.fetch;globalThis.fetch=async input=>String(input).includes('/auth/v1/user')?Response.json(owner):Response.json({role:'superadmin',must_change_password:true});
 try{const r=await proxy.fetch(new Request('https://admin.univershzrw.com/backend/auth/v1/user',{headers:{cookie:'__Host-uhz-access=fixture-token'}}),{API_LIMIT:limit});assert.equal(r.status,200);assert.equal((await r.json()).must_change_password,true);}finally{globalThis.fetch=prior;}
});
test('administration API refuses cross-site writes and customer-host control access',async()=>{
 const env={API_LIMIT:limit};let r=await proxy.fetch(new Request('https://admin.univershzrw.com/admin-backend/rest/v1/products',{method:'POST',headers:{Origin:'https://other.example','content-type':'application/json'},body:'{}'}),env);assert.equal(r.status,403);
 r=await proxy.fetch(new Request('https://univershzrw.com/backend/functions/v1/uhz-admin-control',{method:'POST',headers:{Origin:'https://univershzrw.com','content-type':'application/json'},body:'{"action":"overview"}'}),env);assert.equal(r.status,403);
});
test('file declarations reject path tricks, unknown formats and oversized files',()=>{
 const p={name:'../../photo.png',mime:'image/png',size:50,bucket:'uhz-public',purpose:'product',sha256:'a'.repeat(64),request_key:crypto.randomUUID()};const d=normalizeUpload(p);assert.equal(d.name.includes('/'),false);assert.throws(()=>normalizeUpload({...p,mime:'text/html'}));assert.throws(()=>normalizeUpload({...p,size:20971521}));assert.throws(()=>normalizeUpload({...p,bucket:'uhz-finance-proofs'}));assert.equal(fileType(new TextEncoder().encode('<html>')),'');assert.equal(fileType(new TextEncoder().encode('%PDF-1.7')),'application/pdf');assert.equal(publicAssetURL({bucket:'uhz-private',id:'x'}),null);
});
test('public files are gated by an actual public record and support PDF attachment and video ranges',async()=>{
 const prior=globalThis.fetch,id='10000000-0000-4000-8000-000000000001',record={ok:true,bucket:'uhz-public',path:'admin/'+id+'/'+id+'.pdf',mime:'application/pdf',size:100,name:'documento de prueba.pdf',sha256:'a'.repeat(64)};let storageCalls=0;
 globalThis.fetch=async(input,options)=>{if(String(input).includes('/rpc/'))return Response.json(record);storageCalls++;return new Response('fixture',{status:options.headers.Range?206:200,headers:{'content-type':record.mime,'accept-ranges':'bytes','content-range':'bytes 0-7/100'}});};
 try{let r=await files.fetch(new Request('https://univershzrw.com/_uhz/admin-files/'+id));assert.equal(r.status,200);assert.ok(r.headers.get('content-disposition').includes('attachment;'));assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 record.mime='video/mp4';record.path=record.path.replace('.pdf','.mp4');r=await files.fetch(new Request('https://univershzrw.com/_uhz/admin-files/'+id,{headers:{Range:'bytes=0-7'}}));assert.equal(r.status,206);assert.equal(r.headers.get('accept-ranges'),'bytes');
 record.ok=false;const before=storageCalls;r=await files.fetch(new Request('https://univershzrw.com/_uhz/admin-files/'+id));assert.equal(r.status,404);assert.equal(storageCalls,before);
 }finally{globalThis.fetch=prior;}
});
