import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TextEncoder} from 'node:util';
import {Script} from 'node:vm';
const app=readFileSync(new URL('./studio-app.js',import.meta.url),'utf8');
const src=readFileSync(new URL('./studio-worker.mjs',import.meta.url),'utf8');
const markup=readFileSync(new URL('./studio.html',import.meta.url),'utf8');
const plan=readFileSync(new URL('./plans-page.html',import.meta.url),'utf8');
test('Creator Studio code compiles and implements 3 operational professional tools',()=>{
 assert.doesNotThrow(()=>new Script(app));
 assert.match(app,/function images\(/);assert.match(app,/async function qrs\(/);assert.match(app,/function audit\(/);
 assert.match(app,/createObjectURL/);assert.match(app,/canvas\.toBlob/);assert.match(app,/function zip\(/);
 assert.match(markup,/image-run/);assert.match(markup,/qr-run/);assert.match(markup,/seo-run/);
});
test('No upload or offsite requests from professional tools',()=>{
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|FormData/);
 assert.match(app,/80\*1048576/);
 assert.match(app,/urls\.length>50/);
 assert.match(app,/lines\.length>200/);
});
test('ZIP archives have valid local and central structures',async()=>{
 const encode=new TextEncoder();
 const crcTable=new Uint32Array(256);
 for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0}
 const crc=data=>{let c=-1;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^-1)>>>0};
 const fn=app.slice(app.indexOf('function zip('),app.indexOf('\nfunction download',app.indexOf('function zip(')));
 const pack=new Function('enc','crc','Blob',fn+'\nreturn zip')(encode,crc,Blob);
 const blob=pack([{name:'uno.txt',data:encode.encode('hola')},{name:'dos.csv',data:encode.encode('a,b\n1,2')}]);
 const buffer=await blob.arrayBuffer(),view=new DataView(buffer);
 assert.equal(view.getUint32(0,true),0x04034b50);
 assert.equal(view.getUint32(buffer.byteLength-22,true),0x06054b50);
 assert.equal(view.getUint16(buffer.byteLength-12,true),2);
});
test('Worker enforces real backend entitlements for app.js',()=>{
 assert.match(src,/if\(path==='\/estudio\/app.js'\)/);
 assert.match(src,/if\(!state\.access\)return new Response\('Acceso Premium requerido'/);
 assert.match(src,/member\.data\?\.plan==='premium'/);
 assert.match(src,/role\.data\?\.role==='superadmin'/);
 assert.match(src,/no-store/);
});
test('Plans keep the existing monetary gate and compare actual benefits',()=>{
 assert.match(plan,/Solicitar Premium sin pagar/);
 assert.match(plan,/data-tier="premium"/);
 assert.match(plan,/20 imágenes/);
 assert.match(plan,/50 códigos QR/);
 assert.match(plan,/200 fichas/);
 assert.match(plan,/no realiza un cargo|no realiza un cargo|no se realizó cobro/);
 assert.match(plan,/en evaluación|En evaluación/);
});
