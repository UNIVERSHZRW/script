import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './browser-tools-worker.mjs';
const url=path=>'https://univershzrw.com'+path;

test('serves tools page with five functional sections',async()=>{
 const r=await worker.fetch(new Request(url('/herramientas')));
 assert.equal(r.status,200);
 assert.match(r.headers.get('content-type'),/text\/html/);
 const html=await r.text();
 for(const section of ['panel-enlaces','panel-qr','panel-imagenes','panel-seo','panel-meta'])assert.ok(html.includes(section),section);
 assert.match(html,/Herramientas gratuitas/);
});
test('permits shared same-origin assets and blocks off-site connections and forms',async()=>{
 const r=await worker.fetch(new Request(url('/herramientas')));
 const csp=r.headers.get('content-security-policy');
 const directives=new Map(csp.split(';').map(part=>part.trim().split(/\s+/)).map(([name,...values])=>[name,values]));
 assert.deepEqual(directives.get('script-src'),["'self'"]);
 assert.deepEqual(directives.get('connect-src'),["'self'"]);
 assert.deepEqual(directives.get('form-action'),["'none'"]);
});
test('browser processing code has no upload endpoint',async()=>{
 const r=await worker.fetch(new Request(url('/herramientas/app.js')));
 const js=await r.text();
 assert.match(js,/canvas\.toBlob/);
 assert.match(js,/new QRCode/);
 assert.match(js,/DOMParser/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon|FormData/);
});
test('QRCode library has full MIT attribution',async()=>{
 const r=await worker.fetch(new Request(url('/herramientas/qrcode.min.js')));
 assert.equal(r.status,200);
 assert.match(await r.text(),/Permission is hereby granted/);
});
test('rejects state-changing HTTP methods and unknown routes',async()=>{
 const write=await worker.fetch(new Request(url('/herramientas'),{method:'POST'}));
 const missing=await worker.fetch(new Request(url('/herramientas/no-such-path')));
 assert.equal(write.status,405);
 assert.equal(missing.status,404);
});

test('directory exposes five free tools and hash anchors',async()=>{const r=await worker.fetch(new Request(url('/herramientas')));const html=await r.text();for(const slug of ['enlaces','qr','imagenes','seo','meta'])assert.match(html,new RegExp('href="#'+slug+'"'));assert.match(html,/100% gratuitas/);});
test('hash based tool selection and QR public page input are supported',async()=>{const r=await worker.fetch(new Request(url('/herramientas/app.js')));const js=await r.text();assert.match(js,/hashchange/);assert.match(js,/function openTool/);assert.match(js,/URLSearchParams/);});
