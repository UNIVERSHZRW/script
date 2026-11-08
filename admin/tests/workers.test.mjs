import test from 'node:test';import assert from 'node:assert/strict';
import admin from '../dist/univershzrw-admin.mjs';import proxy from '../dist/univershzrw-comunidad.mjs';import files from '../public-files-worker.mjs';
import {fileType,normalizeUpload,publicAssetURL} from '../core.mjs';
import finance from '../dist/univershzrw-inft-panel.mjs';
const owner={id:'10000000-0000-4000-8000-000000000001',email:'univershzrw@gmail.com',role:'superadmin',email_confirmed_at:new Date().toISOString(),must_change_password:false};
const limit={limit:async()=>({success:true})};
test('one native application has no embedded documents and refuses all frames',async()=>{
 const response=await admin.fetch(new Request('https://admin.univershzrw.com/'),{});assert.equal(response.status,200);const h=await response.text();assert.ok(h.includes('data-admin-app="3"'));assert.ok(!/<iframe|<object|<embed/i.test(h));assert.equal(response.headers.get('x-uhz-admin-app'),'3');assert.ok(response.headers.get('content-security-policy').includes("frame-src 'none'"));assert.ok(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));assert.equal(response.headers.get('x-frame-options'),'DENY');
 for(const path of ['/admin.js','/admin.css','/_uhz/admin-uploads.js']){const r=await admin.fetch(new Request('https://admin.univershzrw.com'+path),{});assert.equal(r.status,200,path);}
});
 test('old administrator URLs redirect to native application tools rather than serving subpages',async()=>{
 for(const [path,destination]of [['/legacy?view=products','#tienda/productos'],['/inft','#finanzas'],['/guardian','#contenido/guardian'],['/economia/administrar','#contenido/editorial'],['/licencias/expedientes','#comunidad/expedientes']]){const r=await admin.fetch(new Request('https://admin.univershzrw.com'+path),{});assert.equal(r.status,302,path);assert.ok(r.headers.get('location').includes(destination));}
 });
 test('API forwarding preserves method, cookies, query and same-origin protections',async()=>{
 let observed;const env={COMMUNITY_APP:{fetch:async r=>{observed={url:r.url,method:r.method,cookie:r.headers.get('cookie'),origin:r.headers.get('origin'),data:await r.json()};return Response.json({ok:true});}}};const r=await admin.fetch(new Request('https://admin.univershzrw.com/_uhz/admin-api/rest/v1/products?id=eq.fixture',{method:'PATCH',headers:{cookie:'__Host-uhz-access=test-fixture',origin:'https://admin.univershzrw.com','content-type':'application/json'},body:'{"name":"Fixture"}'}),env);assert.equal(r.status,200);assert.equal(observed.url,'https://admin.univershzrw.com/admin-backend/rest/v1/products?id=eq.fixture');assert.equal(observed.method,'PATCH');assert.equal(observed.cookie,'__Host-uhz-access=test-fixture');assert.equal(observed.origin,'https://admin.univershzrw.com');assert.equal(observed.data.name,'Fixture');
 });
 test('customer finance remains isolated from parent documents',async()=>{const r=await finance.fetch(new Request('https://univershzrw.com/criptomoneda/panel'));assert.equal(r.headers.get('x-frame-options'),'DENY');assert.ok(r.headers.get('content-security-policy').includes("frame-ancestors 'none'"));});
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
