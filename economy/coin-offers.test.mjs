import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('./planes-offers-worker.mjs',import.meta.url),'utf8');
const sql=readFileSync(new URL('./migrations/20261109_coin_promotions.sql',import.meta.url),'utf8');
const i=worker.indexOf('const HTML='),j=worker.indexOf(';\n',i);
const html=JSON.parse(worker.slice(i+11,j));
function client(){const a=html.indexOf('<script>\n'),b=html.lastIndexOf('</script>');return html.slice(a+9,b);}
test('All three advertised offers match backend rounding rules',()=>{
 for(const [base,bonus,percent] of [[50,5,10],[150,23,15],[500,100,20]]){
  assert.match(html,new RegExp('>'+base+' Coins<'));
  assert.match(html,new RegExp('Recibes '+(base+bonus)+' Coins'));
  assert.ok(html.includes('+'+percent+'% EXTRA'));
  assert.match(sql,new RegExp('WHEN '+base+' THEN '+bonus));
 }
});
test('Official footer and browser favicon are present',()=>{
 assert.match(html,/class="uhz-pro-footer"/);
 assert.match(html,/uhz-footer-grid/);
 assert.match(html,/site-footer\.css/);
 assert.match(html,/site-footer\.js/);
 assert.match(html,/univershzrw-favicon\.svg/);
});
test('Crypto is fail-closed and obsolete nonpayment CTA is absent',()=>{
 assert.doesNotMatch(html,/Registrar solicitud sin cobro|sin bono/);
 assert.match(worker,/\/planes\/crypto\/status/);
 assert.match(worker,/ready:false/);
 assert.match(html,/Pagar con criptomonedas/);
 assert.match(html,/disabled/);
});
test('Selectable offer cards and client JavaScript parse',()=>{
 assert.equal((html.match(/data-coin-package=/g)||[]).length,3);
 assert.doesNotThrow(()=>new Function(client()));
 assert.equal((html.match(/<\/body>/g)||[]).length,1);
});
