/* UNIVERSHZRW: propinas Coin por post y ficha, sin procesar dinero real. */
(()=>{'use strict';
if(window.__UHZ_COIN_TIPS_20261110)return;window.__UHZ_COIN_TIPS_20261110=true;
const RPC='/_uhz/portal/backend/rest/v1/rpc/',isResource=x=>/^[A-Za-z0-9_-]{3,110}$/.test(x)||/^[a-f0-9-]{36}$/i.test(x);
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
let dlg=null,state={kind:'resource',id:'',resource:'',recipient:'platform',options:null,busy:false};
async function rpc(name,payload){const r=await fetch(RPC+name,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});let data;try{data=await r.json()}catch{throw Error('El servicio no respondió correctamente.')}if(!r.ok)throw Error(data.message||data.error||'Necesitas iniciar sesión para continuar.');return data;}
function identity(card){
let id=card.dataset.resourceId||card.getAttribute('data-content-id')||'';
const link=card.querySelector('a[href*="/recurso/"]');
if(!id&&link){try{id=decodeURIComponent(new URL(link.href,location.href).pathname.split('/recurso/')[1]||'').split('/')[0]}catch{}}
if(!id&&location.pathname.toLowerCase().startsWith('/recurso/')){try{id=decodeURIComponent(location.pathname.split('/')[2]||'')}catch{}}
if(!isResource(id))return null;
return {kind:'resource',id};
}
function css(){if(document.getElementById('uhz-coin-tip-css'))return;const l=document.createElement('link');l.id='uhz-coin-tip-css';l.rel='stylesheet';l.href='/herramientas/coins-tip.css?v=20261110';document.head.append(l)}
function tipButton(card){
if(card.querySelector('.uhz-coin-tip-trigger'))return;
const ref=identity(card);if(!ref)return;
const bar=node('div','uhz-coin-tip-bar'),btn=node('button','uhz-coin-tip-trigger','♡ Apoyar con Coins');
btn.type='button';btn.setAttribute('aria-label','Donar Coins al creador de esta publicación o a UNIVERSHZRW');
btn.addEventListener('click',()=>openTip(ref));bar.append(btn);
const host=card.querySelector('.uhz-social-actions')||card.querySelector('.uhzr-actions')||card;
host.append(bar);
}
let scheduled=false;
function scan(){const root=document.querySelector('#seccionResultados')||document.body;root.querySelectorAll('article.resource-card,article.uhzr-card,article.uhz-txt-resource-card').forEach(tipButton);if(location.pathname.toLowerCase().startsWith('/recurso/'))document.querySelectorAll('article.uhzr-card').forEach(tipButton)}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan()})}
function ensureDialog(){
if(dlg)return dlg;
dlg=node('dialog','uhz-coin-dialog');dlg.setAttribute('aria-label','Apoyar con Coins');
const form=node('form','uhz-coin-modal');form.method='dialog';form.addEventListener('submit',e=>e.preventDefault());
const head=node('div','uhz-coin-head'),title=node('strong','','Apoyar con Coins'),close=node('button','uhz-coin-close','×');close.type='button';close.setAttribute('aria-label','Cerrar');close.onclick=()=>dlg.close();head.append(title,close);form.append(head);
const info=node('div','uhz-coin-info');info.id='uhz-coin-info';form.append(info);
const msg=node('p','uhz-coin-message');msg.id='uhz-coin-message';msg.setAttribute('role','status');form.append(msg);
const choices=node('div','uhz-coin-recipient');choices.id='uhz-coin-recipient';form.append(choices);
const amounts=node('div','uhz-coin-amounts');amounts.id='uhz-coin-amounts';[1,5,10,25].forEach(a=>{const btn=node('button','uhz-coin-choice',a+' Coins');btn.type='button';btn.dataset.amount=a;btn.addEventListener('click',()=>{document.getElementById('uhz-coin-custom').value=a;mark(a)});amounts.append(btn)});form.append(amounts);
const field=node('label','uhz-coin-field','O escribe la cantidad (1 a 100 Coins)');const inp=node('input','');inp.id='uhz-coin-custom';inp.type='number';inp.min=1;inp.max=100;inp.step=1;inp.value=5;inp.required=true;inp.addEventListener('input',()=>mark(Number(inp.value)));field.append(inp);form.append(field);
const bal=node('p','uhz-coin-balance','Saldo: —');bal.id='uhz-coin-balance';form.append(bal);
const send=node('button','uhz-coin-submit','Confirmar donación');send.type='button';send.id='uhz-coin-send';send.onclick=sendTip;form.append(send);
const foot=node('p','uhz-coin-foot','Los Coins son puntos internos, no dinero ni INFYNITY. Las donaciones son voluntarias y no se pueden retirar.');form.append(foot);
dlg.append(form);document.body.append(dlg);dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});return dlg;
}
function mark(n){document.querySelectorAll('.uhz-coin-choice').forEach(b=>b.classList.toggle('is-selected',Number(b.dataset.amount)===n));}
function notice(t,error=false){const e=document.getElementById('uhz-coin-message');if(e){e.textContent=t;e.classList.toggle('is-error',error)}}
function recipientButton(kind,label,self){
const b=node('button','uhz-coin-destination',label+(self?' (tu cuenta)':''));b.type='button';b.disabled=!!self;b.dataset.recipient=kind;b.onclick=()=>{state.recipient=kind;highlightRecipient()};return b;
}
function highlightRecipient(){document.querySelectorAll('.uhz-coin-destination').forEach(x=>x.classList.toggle('is-selected',x.dataset.recipient===state.recipient))}
async function openTip(ref){
state={...ref,recipient:'platform',options:null,busy:false};const d=ensureDialog();d.showModal();
const c=document.getElementById('uhz-coin-recipient'),submit=document.getElementById('uhz-coin-send');
c.replaceChildren();submit.disabled=true;document.getElementById('uhz-coin-info').textContent='Consultando destinatarios…';document.getElementById('uhz-coin-balance').textContent='Saldo: —';notice('');
document.getElementById('uhz-coin-custom').value=5;mark(5);
try{
const [info,coins]=await Promise.allSettled([rpc('uhz_coin_tip_options',{p_kind:ref.kind,p_identifier:ref.id}),rpc('community_my_coins',{})]);
if(!d.open||state.id!==ref.id)return;
if(info.status!=='fulfilled'||!info.value.ok)throw Error('Esta publicación no acepta donaciones por ahora.');
const data=info.value;state.options=data;state.id=data.id;state.kind=data.kind;
document.getElementById('uhz-coin-info').textContent=data.title||'Publicación';
if(data.creator?.available&&!data.creator.self)c.append(recipientButton('creator','Apoyar a '+data.creator.label,false));
if(data.platform?.available&&!data.platform.self)c.append(recipientButton('platform','Apoyar a '+data.platform.label,false));
const first=c.querySelector('button:not(:disabled)');if(first){state.recipient=first.dataset.recipient;highlightRecipient()}else notice('No puedes enviarte Coins a ti mismo.',true);
if(coins.status==='fulfilled'){document.getElementById('uhz-coin-balance').textContent='Tu saldo: '+(Number(coins.value.balance)||0).toLocaleString('es-MX')+' Coins';submit.disabled=!first;}
else{document.getElementById('uhz-coin-balance').textContent='Inicia sesión para apoyar a los creadores.';submit.disabled=true;const l=node('a','uhz-coin-login','Iniciar sesión');l.href='/iniciar-sesion?next='+encodeURIComponent(location.pathname+location.search);c.append(l)}
}catch(e){notice(e.message||'No se pudo cargar la donación.',true);submit.disabled=true}
}
async function sendTip(){
if(state.busy||!state.options)return;const n=Number(document.getElementById('uhz-coin-custom').value),submit=document.getElementById('uhz-coin-send');
if(!Number.isInteger(n)||n<1||n>100){notice('Elige entre 1 y 100 Coins.',true);return;}
if(!document.querySelector('.uhz-coin-destination.is-selected')){notice('Elige a quién apoyar.',true);return;}
state.busy=true;submit.disabled=true;notice('Procesando donación segura…');
const id=crypto.randomUUID();
try{const data=await rpc('uhz_coin_send_tip',{p_kind:state.kind,p_identifier:state.id,p_recipient:state.recipient,p_coins:n,p_request_id:id});
if(!data.ok){if(data.error==='insufficient_coins')throw Error('No tienes Coins suficientes. Saldo: '+(data.balance||0));if(data.error==='daily_limit')throw Error('Alcanzaste el límite diario de donaciones.');throw Error(data.message||data.error||'No se pudo completar la donación.')}
notice('¡Gracias! Enviaste '+n+' Coins a '+(data.recipient||'tu destinatario')+'.');
const bal=document.getElementById('uhz-coin-balance');if(Number.isFinite(Number(data.balance)))bal.textContent='Tu saldo: '+Number(data.balance).toLocaleString('es-MX')+' Coins';
document.dispatchEvent(new CustomEvent('uhz:coins-changed',{detail:{balance:data.balance}}));
}catch(e){notice(e.message||'Error de donación.',true);submit.disabled=false}finally{state.busy=false}
}
css();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scan();new MutationObserver(schedule).observe(document.querySelector('#seccionResultados')||document.body,{childList:true,subtree:true});},{once:true});
else{scan();new MutationObserver(schedule).observe(document.querySelector('#seccionResultados')||document.body,{childList:true,subtree:true})}
})();