import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const js=readFileSync(new URL('./embedded-tools.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./embedded-tools.css',import.meta.url),'utf8');
const article=readFileSync(new URL('./article-inline-worker.mjs',import.meta.url),'utf8');

function inspect(v,type) {
 const context={window:{},document:{readyState:'loading',documentElement:{},addEventListener(){}},MutationObserver:class {observe(){}},URL,console};
 runInNewContext(js,context);
 return context.window.UHZInlineTools.providerInfo(v,type);
}

test('inline script parses and mounts within each existing page',()=>{
 assert.doesNotThrow(()=>new Script(js));
 for(const part of ['mountContribution','mountArticle','mountAdmin','imageWidget','seoWidget','linkWidget','metaWidget','qrWidget'])
  assert.ok(js.includes(part),part);
 assert.match(css,/\.uht-shell/);
});
test('Google Drive link conversion is only structural; strips tracking',()=>{
 const r=inspect('https://drive.google.com/file/d/1Ll690M7sFyfMbgasHgrb14QkYFGrkLtt/view?fbclid=abc');
 assert.equal(r.name,'Google Drive');
 assert.equal(r.original,'https://drive.google.com/file/d/1Ll690M7sFyfMbgasHgrb14QkYFGrkLtt/view');
 assert.equal(r.preview,'https://drive.google.com/file/d/1Ll690M7sFyfMbgasHgrb14QkYFGrkLtt/preview');
 assert.match(r.note,/permisos/);
});
test('MEGA share decryption key survives transform',()=>{
 const key='#F87gnIJemsoNyqWws23EOJx-IuWHfa1w-CNqj_VuHII';
 const r=inspect('https://mega.nz/file/JGsG2YiQ'+key,'video');
 assert.equal(r.preview,'https://mega.nz/embed/JGsG2YiQ'+key);
 assert.equal(r.download,'https://mega.nz/file/JGsG2YiQ'+key);
});
test('no off-site file transfer or new paywall',()=>{
 assert.doesNotMatch(js,/\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\b|\bFormData\b/);
 assert.match(js,/canvas\.toBlob/);
 assert.doesNotMatch(js,/coins[-_]?charge|debit[-_]?coins|wallet[-_]?charge/i);
});
test('article worker injects UI only into html for /recurso/',()=>{
 assert.match(article,/pathname\.toLowerCase\(\)\.startsWith\('\/recurso\/'\)/);
 assert.match(article,/HTMLRewriter/);
 assert.doesNotMatch(article,/fetch\('https:\/\/mega|fetch\('https:\/\/drive/);
});
