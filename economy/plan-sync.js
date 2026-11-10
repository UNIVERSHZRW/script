(()=>{'use strict';
const numeric=p=>Number.isFinite(Number(p))&&Number(p)>=0?Number(p):null;
async function sync(){
 const main=document.querySelector('main');if(!main)return;
 const badge=document.createElement('p');badge.setAttribute('role','status');badge.className='uhz-price-sync';badge.style.cssText='font:600 12px/1.6 system-ui;margin:12px 0;color:inherit;opacity:.72';badge.textContent='Verificando precios y beneficios…';
 const cards=[...main.querySelectorAll('article.card')];const control=main.querySelector('.cards')||main;
 control.insertAdjacentElement('afterend',badge);
 try{
  const response=await fetch('/economia/centro/api',{cache:'no-store',headers:{accept:'application/json'}});
  const data=await response.json();if(!response.ok||!data.ok||!Array.isArray(data.plans))throw Error('Sin catálogo');
  for(const plan of data.plans){
   const card=cards.find(c=>c.querySelector('h3')?.textContent.trim().toLowerCase()===String(plan.name).trim().toLowerCase());
   if(!card)continue;
   const price=card.querySelector('.price');
   if(price){price.replaceChildren(document.createTextNode(new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(numeric(plan.price_mxn)||0)+' '));const period=document.createElement('small');period.textContent=Number(plan.period_days)>0?'MXN · '+plan.period_days+' días':'MXN · sin vencimiento';price.append(period);}
   if(plan.code==='premium'){const existing=card.querySelector('ul.features');if(existing){const li=document.createElement('li');li.textContent=Number(plan.coins)>0?'Incluye '+plan.coins+' Coins':'Coins por separado (no incluidos)';if(!existing.textContent.includes('Coins'))existing.append(li);}}
  }
  badge.textContent='Precios confirmados en Supabase. Las solicitudes no son cobros ni activaciones automáticas.';
 }catch{
  cards.forEach(c=>{const price=c.querySelector('.price');if(price)price.textContent='Precio por verificar';});
  badge.textContent='No fue posible confirmar el precio actual. No se pueden considerar vigentes los importes anteriores.';
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();