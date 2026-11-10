import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyPaymentGuide} from './apply-payment-guide.mjs';

const guideJS=readFileSync(new URL('./payment-guide.js',import.meta.url),'utf8');
const guideCSS=readFileSync(new URL('./payment-guide.css',import.meta.url),'utf8');
const mp=readFileSync(new URL('./edge-payments/index.ts',import.meta.url),'utf8');
const webhook=readFileSync(new URL('./edge-mp-webhook/index.ts',import.meta.url),'utf8');

function sampleWorker(){
 const html='<html><head></head><body>Store</body></html>';
 const app="function feedback(message,error=false){};function go(res){if(res.initPoint&&/^https:\\/\\/[^/]*mercadopago\\./i.test(res.initPoint)){location.assign(res.initPoint);return}throw new Error('No se obtuvo el enlace de pago de Mercado Pago.');}function pending(u){if(![...u.keys()].some(k=>/status|payment|collection|preference/i.test(k)))return;}";
 const css='body{}';
 return 'const HTML='+JSON.stringify(html)+';\nconst CSS='+JSON.stringify(css)+';\nconst APP='+JSON.stringify(app)+';\nexport default {async fetch(request){const url=new URL(request.url),path=url.pathname;if(path===\\'/tienda_online/cp\\'){return new Response(\\'postal\\')}return new Response(\\'okay\\')}};';
}
function appFrom(worker){const a=worker.indexOf('const APP='),b=worker.indexOf(';\n',a);return JSON.parse(worker.slice(a+10,b))}

test('Shop patch adds same-origin assets without enabling checkout',()=>{
 const result=applyPaymentGuide(sampleWorker(),guideJS,guideCSS);
 assert.match(result,/PAY_GUIDE_JS/);assert.match(result,/payment-guide.css/);
 assert.match(result,/payment-guide.js/);assert.equal(result,applyPaymentGuide(result,guideJS,guideCSS));
 assert.doesNotMatch(result,/TIENDA_MODULO_ACTIVO.{0,12}true/);
});
test('Only HTTPS official Mercado Pago checkout destinations pass',()=>{
 const app=appFrom(applyPaymentGuide(sampleWorker(),guideJS,guideCSS));
 const i=app.indexOf('function safeHostedMercadoPagoCheckout'),j=app.indexOf('\nfunction feedback',i);
 const get=new Function(app.slice(i,j)+'\nreturn safeHostedMercadoPagoCheckout;');
 const check=get();
 assert.match(check('https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=abc'),/^https:/);
 for(const bad of ['http://www.mercadopago.com.mx/checkout/x','https://mercadopago.com.mx.evil.test/checkout/x','https://www.mercadopago.com.mx.evil.test/checkout/x','https://user:pass@mercadopago.com.mx/checkout/x','https://example.org/checkout/v1/redirect','https://mercadopago.com.mx/foo'])assert.equal(check(bad),null,bad);
 assert.match(app,/compra\|folio\|status\|payment/);
});
test('Guide has only explanatory payment methods, not payment collection',()=>{
 assert.doesNotThrow(()=>new Function(guideJS));
 assert.match(guideJS,/OXXO/);assert.match(guideJS,/SPEI_DIRECT/);
 assert.doesNotMatch(guideJS,/fetch\s*\(|CardElement|MP_ACCESS_TOKEN|creditCardNumber/);
});
test('Supabase payment processor authorizes methods and returns to the store',()=>{
 assert.match(mp,/assertShopMethod\(kind,row,'MERCADO_PAGO'\)/);
 assert.match(mp,/assertShopMethod\(kind,row,'SPEI_DIRECT'\)/);
 assert.match(mp,/https:\/\/univershzrw.com\/tienda_online\//);
 assert.match(mp,/safeMercadoPagoURL/);
});
test('Webhook verifies origin, money consistency and paid order idempotence',()=>{
 assert.match(webhook,/x-signature/);assert.match(webhook,/Moneda del pago distinta/);
 assert.match(webhook,/wasPaid/);assert.match(webhook,/REQUIERE_REVISION/);
 assert.match(webhook,/await processPayment\(dataId\);/);
 assert.match(webhook,/uhz_payment_apply_confirmed/);
});
