(()=>{'use strict';
const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(n);
const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el};
const status=(id,value)=>{const el=$(id);if(el)el.textContent=String(value)};
const api='/_uhz/portal/backend/rest/v1/rpc/';
async function rpc(name,body){const r=await fetch(api+name,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const data=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(data.message||data.error||'No se pudo procesar la solicitud.'),{status:r.status});return data;}
async function renderPlans(){
try{
 const response=await fetch('/economia/centro/api',{headers:{accept:'application/json'},cache:'no-store'}),data=await response.json();
 if(!response.ok||data.ok!==true||!Array.isArray(data.plans))throw Error('Planes temporalmente no disponibles');
 const root=$('plan-grid');root.replaceChildren();
 for(const plan of data.plans){
  const article=make('article','card'+(plan.code==='premium'?' featured':''));
  article.append(make('p','eyebrow',plan.code==='premium'?'MÁS HERRAMIENTAS':'ACCESO ESENCIAL'),make('h3',null,plan.name),make('div','price',fmt(plan.price_mxn)));
  article.append(make('p','muted',plan.period_days>0?'Por '+plan.period_days+' días. Sin renovación automática.':'Sin cuota de membresía.'));
  const features=make('ul','features');
  for(const item of ['Hasta '+plan.folder_limit+' carpetas personales','Hasta '+plan.contribution_limit+' aportaciones por periodo',plan.coins>0?plan.coins+' Coins incluidos':'Coins disponibles por separado',plan.creator_rewards?'Elegible para recompensas verificadas':'Actividades gratuitas según disponibilidad'])features.append(make('li',null,item));
  article.append(features);
  if(plan.code==='premium'){const btn=make('button','action','Solicitar Premium sin pagar');btn.type='button';btn.addEventListener('click',()=>requestPremium(btn));article.append(btn);}else{const a=make('a','action','Continuar gratis');a.href='/mi-cuenta';article.append(a);}
  root.append(article);
 }
 status('plan-notice','Catálogo consultado a Supabase. Solicitar Premium no realiza un cargo ni activa automáticamente la membresía.');
}catch{const root=$('plan-grid');root.replaceChildren(make('article','card','No fue posible confirmar los precios. Intenta nuevamente más tarde.'));status('plan-notice','Los precios permanecen ocultos hasta poder verificarlos.');}
}
async function personal(){
 let hasAccount=false;
 try{const x=await rpc('community_my_coins',{});if(Number.isFinite(Number(x.balance))){$('coin-balance').textContent=new Intl.NumberFormat('es-MX').format(Number(x.balance));status('coin-state','Saldo de créditos internos. No canjeable actualmente.');hasAccount=true;}}
 catch(e){status('coin-state',e.status===401?'Inicia sesión para consultar tus Coins.':'No se pudo verificar el saldo.');}
 try{const x=await rpc('uhz_economy_my_dashboard',{});if(x.plan==='free'||x.plan==='premium'){$('member-plan').textContent=x.plan==='premium'?'Premium':'Gratis';status('plan-state','Estado verificado por Supabase.');hasAccount=true;}}
 catch(e){status('plan-state',e.status===401?'Sin sesión activa.':'No se pudo verificar tu plan.');}
 status('account-status',hasAccount?'Tu cuenta se consulta desde la sesión actual.':'Inicia sesión para consultar tu información personal.');
 $('request-coins').disabled=false;
}
async function requestPremium(btn){
 if(!confirm('Se registrará una solicitud de Premium. No habrá cobro ni activación automática. ¿Continuar?'))return;
 btn.disabled=true;status('plan-notice','Registrando solicitud…');
 try{const r=await fetch('/api/public-social/membership',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({tier:'premium'})});if(r.status===401){location.href='/iniciar-sesion?next=%2Feconomia%2Fcentro';return;}const x=await r.json().catch(()=>({}));if(!r.ok)throw Error(x.message||'No se pudo registrar la solicitud.');status('plan-notice',x.message||'Solicitud registrada. Sin cobro ni activación.');}
 catch(e){status('plan-notice',e.message)}finally{btn.disabled=false}
}
const slider=$('coin-amount');
function calculate(){const count=Math.min(50,Math.max(5,Math.round(Number(slider.value)||5))),bonus=count>=10?Math.floor(count*.20):0;
 status('range-value',count);status('base-coins',count);status('bonus-coins','+'+bonus);status('total-coins',count+bonus);status('proposal-price',fmt(count));return count;}
slider.addEventListener('input',calculate);
document.querySelectorAll('[data-amount]').forEach(button=>button.addEventListener('click',()=>{slider.value=button.dataset.amount;calculate()}));
$('request-coins').addEventListener('click',async()=>{
 const count=calculate();if(!confirm('Registrar una solicitud de '+count+' Coins base sin pagar ni recibir Coins todavía. ¿Continuar?'))return;
 const button=$('request-coins');button.disabled=true;status('coin-order-status','Registrando solicitud…');
 try{const result=await rpc('uhz_eco_custom_pack_request',{p_base_coins:count,p_request_id:crypto.randomUUID()});if(result.paid!==false||Number(result.credited)!==0)throw Error('Respuesta inesperada: no se confirmó ningún pago.');status('coin-order-status','Solicitud registrada. Folio: '+String(result.folio||'no disponible')+'. Total propuesto: '+String(result.total_coins||count)+' Coins. Sin cargo ni acreditación.');}
 catch(e){if(e.status===401){location.href='/iniciar-sesion?next=%2Feconomia%2Fcentro';return;}status('coin-order-status',e.message);}
 finally{button.disabled=false}
});
calculate();renderPlans();personal();
})();