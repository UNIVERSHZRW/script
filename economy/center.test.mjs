import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './center-worker.mjs';
import {readFileSync} from 'node:fs';
const URL_BASE='https://univershzrw.com/economia/centro';
const source=readFileSync(new URL('./center.js',import.meta.url),'utf8');
const html=readFileSync(new URL('./center.html',import.meta.url),'utf8');
const expectedPlans=[{code:'free',name:'Gratis',price_mxn:0,period_days:0,coins:0,folder_limit:3,contribution_limit:3,creator_rewards:false},{code:'premium',name:'Premium',price_mxn:49,period_days:30,coins:0,folder_limit:100,contribution_limit:100,creator_rewards:true}];

test('Page is reachable and exposes five no-charge sections',async()=>{
 const r=await worker.fetch(new Request(URL_BASE));
 assert.equal(r.status,200);
 const body=await r.text();
 for(const value of ['id="cuenta"','id="planes"','id="coins"','id="inft"','Registrar solicitud sin pagar'])assert.ok(body.includes(value),value);
 assert.match(r.headers.get('content-security-policy'),/connect-src 'self'/);
});

test('HTTP restrictions and missing routes are enforced',async()=>{
 assert.equal((await worker.fetch(new Request(URL_BASE,{method:'POST'}))).status,405);
 assert.equal((await worker.fetch(new Request(URL_BASE+'/missing'))).status,404);
 assert.equal((await worker.fetch(new Request(URL_BASE,{method:'HEAD'}))).status,200);
});

test('Public data is sanitized and sourced only from verified catalog',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({ok:true,data:{plans:expectedPlans,reserve_reported_mxn:12345,internal_token:'NEVER_EXPOSE'}}),{status:200,headers:{'content-type':'application/json'}});
 try{
 const r=await worker.fetch(new Request(URL_BASE+'/api'));assert.equal(r.status,200);
 const data=await r.json();assert.equal(data.plans.length,2);assert.equal(data.plans[1].price_mxn,49);
 assert.equal(data.checkout_live,false);assert.equal(data.crypto_trade_live,false);
 assert.equal(data.reserve_reported_mxn,undefined);assert.equal(data.internal_token,undefined);
 }finally{globalThis.fetch=old;}
});

test('Catalog failure fails closed instead of inventing prices',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response('error',{status:503});
 try{const r=await worker.fetch(new Request(URL_BASE+'/api'));assert.equal(r.status,503);assert.equal((await r.json()).ok,false);}finally{globalThis.fetch=old;}
});

test('Only authenticated legacy RPCs may create requests, never capture payments',()=>{
 assert.match(source,/uhz_eco_custom_pack_request/);
 assert.match(source,/community_my_coins/);
 assert.match(source,/uhz_economy_my_dashboard/);
 assert.doesNotMatch(source,/card_number|cvv|secret_key|service_role|mint\(/i);
 assert.match(source,/result\.paid!==false/);
 assert.match(html,/Las solicitudes de Coins no generan cargos/);
});
