
;(()=>{const p=location.pathname;if(!['/','/index.html'].includes(p)&&!p.startsWith('/recurso/'))return;(()=>{'use strict';if(window.uhzFlowUI26)return;window.uhzFlowUI26=1;const article=location.pathname.startsWith('/recurso/'),E=(t,s,c)=>{let e=document.createElement(t);if(s!=null)e.textContent=s;if(c)e.className=c;return e},local=s=>{try{let u=new URL(s,location.href);return u.origin===location.origin?u.pathname+u.search:''}catch{return''}};function popup(title,link,id,kind){
 document.getElementById('uhzFlowPopup')?.remove();
 const d=E('dialog',null,'uhzf-dialog');d.id='uhzFlowPopup';
 const close=E('button','×','uhzf-close');close.type='button';close.setAttribute('aria-label','Cerrar ventana');close.onclick=()=>d.close();
 const head=E('header',null,'uhzf-dialog-head');
 const eyebrow=E('span','UNIVERSHZRW · CONSULTAR ACCESO','uhzf-eyebrow');
 const heading=E('h2',title||'Contenido','uhzf-dialog-title');heading.id='uhzf-dialog-title';
 const typeChip=E('span',kind||'Contenido','uhzf-type-chip');
 head.append(eyebrow,heading,typeChip,close);d.setAttribute('aria-labelledby',heading.id);
 const main=E('div',null,'uhzf-dialog-body');
 const price=E('section',null,'uhzf-price-card is-pending');
 const priceTop=E('div',null,'uhzf-price-top');
 const priceLabel=E('span','ACCESO AL CONTENIDO','uhzf-price-label');
 const priceBadge=E('span','CONSULTANDO','uhzf-price-badge');
 priceTop.append(priceLabel,priceBadge);
 const priceAmount=E('div','Consultando…','uhzf-price-amount');
 price.append(priceTop,priceAmount);
 const welcome=E('p','Estamos consultando el acceso a este contenido.','uhzf-welcome');
 const credit=E('p','Contenido compartido en UNIVERSHZRW','uhzf-credit');
 const status=E('p','', 'uhzf-status');status.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const box=E('div',null,'uhzf-options');
 main.append(price,welcome,credit,status,box);d.append(head,main);
 d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal();
 const query=async(op,extra={})=>{const response=await fetch('/_uhz/portal/backend/rest/v1/rpc/uhz_article_access',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({p_action:op,p_payload:{resource_id:id,...extra}})});const v=await response.json();if(!response.ok)throw Error(v.message||v.error||'No se pudo consultar el acceso');return v};
 const a=(txt,href,cls='uhzf-option')=>{const l=E('a',txt,cls);l.href=href;box.append(l);return l};
 const b=(txt,fn)=>{const k=E('button',txt,'uhzf-option uhzf-primary');k.type='button';k.onclick=fn;box.append(k);return k};
 const provider=s=>{try{const h=new URL(s).hostname.toLowerCase();if(h.includes('1024tera')||h.includes('terabox'))return 'TeraBox';if(h.includes('mediafire'))return 'MediaFire';if(h.includes('mega.nz'))return 'MEGA';if(h==='drive.google.com')return 'Google Drive';if(h.includes('onedrive')||h.includes('1drv.ms'))return 'OneDrive';return h}catch{return 'Servidor'}};
 const viewer=s=>{try{const u=new URL(s);if(provider(s)==='TeraBox')return 'https://teradl.faizankhichi.me/?link='+encodeURIComponent(btoa(u.href))+(info?.viewer_filename?'&open='+encodeURIComponent(btoa(unescape(encodeURIComponent(info.viewer_filename)))):'');if(provider(s)==='Google Drive'){const m=u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);if(m)return 'https://drive.google.com/file/d/'+m[1]+'/preview'}}catch{}return null};
 let sourceId=id;try{sourceId=new URL(link,location.origin).searchParams.get('id')||id}catch{}
 const exit=(i,view)=>'/_uhz/exit-robot?'+new URLSearchParams({tipo:'download',id:sourceId,uhz_flow:id,uhz_src:String(i),uhz_view:view?'1':'0'});
 
 const steps=Array.from({length:101},(_,i)=>i);
 const range=document.createElement('input');range.type='range';range.min='0';range.max=String(steps.length-1);range.step='1';range.value='0';range.className='uhzf-tip-range';range.setAttribute('aria-label','Cantidad de Coins para donar');
 const scale=E('div',null,'uhzf-tip-scale');scale.append(E('span','0 Coins'),E('span','100 Coins'));
 const balanceText=E('p','Consultando tus Coins disponibles…','uhzf-tip-balance');
 const getCoins=E('a','Conseguir Coins','uhzf-tip-get');getCoins.href='/planes#coins';getCoins.hidden=true;
 const hint=E('p','','uhzf-tip-hint');hint.setAttribute('aria-live','polite');
 const sendTipButton=E('button','Donar Coins','uhzf-tip-send');sendTipButton.type='button';sendTipButton.hidden=true;sendTipButton.disabled=true;
 
 const donation=E('section',null,'uhzf-donation');donation.setAttribute('aria-label','Apoyo voluntario con Coins');
 const dHead=E('div',null,'uhzf-donate-head');dHead.append(E('strong','Apoyar con Coins'),E('span','VOLUNTARIO','uhzf-donate-badge'));
 const dInfo=E('p','El acceso no requiere donación. Si deseas agradecer, puedes hacerlo con Coins.','uhzf-donate-intro');
 const quick=E('div',null,'uhzf-tip-choices');quick.setAttribute('role','group');quick.setAttribute('aria-label','Cantidad de Coins');
 const selectLabel=E('p','Sin donación seleccionada','uhzf-tip-amount');
 const custom=E('div',null,'uhzf-tip-custom');
 const cLabel=E('label','Otra cantidad');cLabel.htmlFor='uhzfTipCustom';
 const cInput=E('input');cInput.type='number';cInput.min='1';cInput.max='100';cInput.step='1';cInput.inputMode='numeric';cInput.id='uhzfTipCustom';cInput.placeholder='1–100';custom.append(cLabel,cInput);
 const review=E('div',null,'uhzf-tip-review');review.hidden=true;
 const reviewTitle=E('strong','Revisar donación'),reviewText=E('p','');
 const reviewBack=E('button','← Cambiar cantidad');reviewBack.type='button';review.append(reviewTitle,reviewText,reviewBack);
 const legal=E('p','Apoyo voluntario y definitivo. Máximo 100 Coins por envío y 200 al día. Los Coins son créditos internos.','uhzf-tip-legal');
 let confirmation=false;const quickButtons=new Map();
 function setCoinAmount(n){
  if(tipBusy)return;
  confirmation=false;review.hidden=true;
  const amount=Number.isInteger(n)&&n>=1&&n<=100?n:0;
  range.value=String(amount);range.dispatchEvent(new Event('input',{bubbles:true}));
  quickButtons.forEach((btn,number)=>{btn.classList.toggle('is-selected',number===amount);btn.setAttribute('aria-pressed',String(number===amount))});
  selectLabel.textContent=amount?(amount===1?'1 Coin':amount+' Coins')+' de apoyo':'Sin donación seleccionada';
 }
 [1,5,10,25].forEach(n=>{const button=E('button',n===1?'1 Coin':n+' Coins','uhzf-tip-choice');button.type='button';button.setAttribute('aria-pressed','false');button.onclick=()=>{cInput.value='';setCoinAmount(n)};quickButtons.set(n,button);quick.append(button)});
 cInput.addEventListener('input',()=>setCoinAmount(cInput.value===''?0:Number(cInput.value)));
 reviewBack.onclick=()=>{confirmation=false;review.hidden=true;refreshTip()};
 sendTipButton.addEventListener('click',ev=>{
  if(tipBusy||confirmation||sendTipButton.disabled)return;
  const amount=Number(range.value);if(!Number.isInteger(amount)||amount<1||amount>100)return;
  confirmation=true;review.hidden=false;
  reviewText.textContent='Donarás '+(amount===1?'1 Coin':amount+' Coins')+'. Saldo después del envío: '+Math.max(0,tipBalance-amount).toLocaleString('es-MX')+' Coins.';
  refreshTip();ev.preventDefault();ev.stopImmediatePropagation()
 },true);
 donation.append(dHead,dInfo,quick,custom,selectLabel,range,scale,balanceText,getCoins,hint,review,sendTipButton,legal);
 credit.insertAdjacentElement('afterend',donation);

 let tipInfo=null,tipBalance=null,tipRecipient='',tipBusy=false;
 function refreshTip(){
   const n=steps[Number(range.value)]||0;range.setAttribute('aria-valuetext',n===1?'1 Coin':n+' Coins');
   const insufficient=tipBalance!==null&&n>tipBalance;
   getCoins.hidden=tipBalance===null||tipBalance>0&&!insufficient;
   sendTipButton.hidden=n===0;sendTipButton.disabled=tipBusy||n===0||insufficient||tipBalance===null||!tipInfo?.ok||!tipRecipient;
   sendTipButton.textContent=tipBusy?'Enviando…':confirmation?'Confirmar y donar '+(n===1?'1 Coin':n+' Coins'):'Continuar con '+(n===1?'1 Coin':n+' Coins');
   hint.textContent=insufficient?'Te faltan '+(n-tipBalance)+' Coins. Puedes continuar sin donar.':n===0?'La donación es opcional. Puedes continuar con 0 Coins.':'';
 }
 range.addEventListener('input',refreshTip);
 const tipRpc=async(name,payload)=>{const response=await fetch('/_uhz/portal/backend/rest/v1/rpc/'+name,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const v=await response.json();if(!response.ok)throw Error(v.message||v.error||'Servicio no disponible');return v};
 tipRpc('uhz_coin_tip_options',{p_kind:'resource',p_identifier:id}).then(v=>{
   if(!v?.ok)throw Error('Las donaciones no están habilitadas.');
   tipInfo=v;
   const contributorHasProfile=!!(v.creator?.available&&v.creator?.catalog_id); const creatorEligible=contributorHasProfile&&!v.creator.self; const platformEligible=v.platform?.available&&!v.platform?.self; tipRecipient=creatorEligible?'creator':platformEligible?'platform':''; const byName=contributorHasProfile?(v.creator.label||'Creador de UNIVERSHZRW'):'UNIVERSHZRW'; const catalog=contributorHasProfile?v.creator.catalog_id:'univershzrw'; credit.replaceChildren(E('span','Aportado por ')); const authorLink=E('a',byName,'uhzf-creator-link'); authorLink.href='/creador/'+encodeURIComponent(catalog); credit.append(authorLink);
   refreshTip();
 }).catch(()=>{hint.textContent='Las donaciones no están disponibles en esta publicación.';sendTipButton.disabled=true;});
 tipRpc('community_my_coins',{}).then(v=>{
   const b=Number(v?.balance);if(!Number.isFinite(b)||b<0)throw Error('Saldo inválido');
   tipBalance=Math.trunc(b);balanceText.textContent='Tus Coins disponibles: '+tipBalance.toLocaleString('es-MX');refreshTip();
 }).catch(()=>{
   balanceText.textContent='Inicia sesión para consultar tus Coins.';
   const l=E('a','Iniciar sesión','uhzf-tip-get');l.href='/iniciar-sesion?next='+encodeURIComponent(location.pathname);donation.append(l);refreshTip();
 });
 sendTipButton.addEventListener('click',async()=>{
   const amount=steps[Number(range.value)]||0;if(tipBusy||!tipInfo?.ok||!tipRecipient||tipBalance===null||amount<1||amount>tipBalance)return;
   tipBusy=true;refreshTip();
   try{const v=await tipRpc('uhz_coin_send_tip',{p_kind:'resource',p_identifier:tipInfo.id,p_recipient:tipRecipient,p_coins:amount,p_request_id:crypto.randomUUID()});
     if(!v.ok)throw Error(v.message||v.error||'No se pudo enviar la donación');
     if(Number.isFinite(Number(v.balance)))tipBalance=Math.max(0,Math.trunc(Number(v.balance)));
     balanceText.textContent='Tus Coins disponibles: '+tipBalance.toLocaleString('es-MX');
     range.value='0';confirmation=false;review.hidden=true;selectLabel.textContent='Sin donación seleccionada';quickButtons.forEach(button=>{button.classList.remove('is-selected');button.setAttribute('aria-pressed','false')});cInput.value='';window.dispatchEvent(new CustomEvent('uhz:coins-changed',{detail:{balance:tipBalance}}));
     status.hidden=false;status.textContent='Gracias: donaste '+amount+' Coins. Puedes continuar a los enlaces.';
   }catch(e){status.hidden=false;status.textContent=e.message||'No se pudo completar la donación.'}
   finally{tipBusy=false;refreshTip()}
 });
 refreshTip();
let info;
 const open=async(pay=false)=>{
  box.replaceChildren();status.hidden=false;status.textContent='Comprobando acceso…';
  try{const r=await query('list');
   if(!r.ok){status.textContent=r.message||({payment_required:'Requiere desbloqueo por Coins.',insufficient_coins:'Saldo insuficiente.',login_required:'Inicia sesión para guardar tu compra.'}[r.error]||'Acceso no disponible.');
     if(r.error==='payment_required')box.append(E('p','Esta publicación aún conserva condiciones previas de acceso. La donación nunca es un pago obligatorio.'));
     if(['payment_required','insufficient_coins','login_required'].includes(r.error)){a('Ganar Coins','/Aportar_contenido');a('Comprar Coins','/planes#coins');a('Ver planes','/planes');if(r.error==='login_required')a('Iniciar sesión','/iniciar-sesion')}return}
   status.textContent='Enlaces autorizados. Puedes continuar sin realizar ninguna donación.';
   const sources=(r.sources||[]).filter(x=>{try{return new URL(x.url).protocol==='https:'}catch{return false}});
   if(!sources.length){box.append(E('p','No hay enlaces autorizados disponibles.'));return}
   box.append(E('p','Selecciona un servidor. El robot será el último paso antes de salir de UNIVERSHZRW.','uhzf-muted'));
   const primary=sources.findIndex(x=>viewer(x.url));if(primary>=0)a('Ver en línea y descargar',exit(primary,true),'uhzf-option uhzf-view');
   sources.forEach((s,i)=>a('Ver en '+provider(s.url),exit(i,false),'uhzf-option uhzf-original'));
  }catch(e){status.textContent=e.message||'Error al consultar'}}
 query('detail').then(r=>{if(!r.ok)throw Error('Recurso no disponible');info=r;
   const free=Boolean(r.free),pending=Boolean(r.pricing_pending),numericCost=Number(r.cost);
   price.className='uhzf-price-card '+(pending?'is-pending':free?'is-free':'is-paid');price.hidden=free;
   d.classList.toggle('uhzf-is-free',free);
   priceBadge.textContent=pending?'PENDIENTE':free?'GRATIS':'CON COINS';priceAmount.textContent=pending?'Por configurar':free?'0 Coins':Number.isFinite(numericCost)?numericCost+' Coins':'Consultar precio';
   refreshTip()
   welcome.textContent=r.available?(free?'':pending?'El acceso está pendiente de configuración.':'Este contenido requiere '+(Number.isFinite(numericCost)?numericCost+' Coins':'Coins')+' para desbloquearse.'):'Este contenido todavía no tiene enlaces autorizados disponibles.';welcome.hidden=Boolean(r.available&&free);
   if(!tipInfo?.ok){const name=String(r.contributor||'').trim();const platform=!name||name.toLowerCase().includes('univershzrw');credit.replaceChildren(E('span','Aportado por '));if(platform){const a=E('a','UNIVERSHZRW','uhzf-creator-link');a.href='/creador/univershzrw';credit.append(a)}else credit.append(E('span',name))}
   status.textContent='';status.hidden=true;
   if(!r.available){box.append(E('p','No hay enlaces autorizados disponibles.'));return}
   b('Continuar a los enlaces',()=>open());
 }).catch(e=>{price.className='uhzf-price-card is-pending';priceBadge.textContent='NO DISPONIBLE';priceAmount.textContent='Sin información';welcome.hidden=false;welcome.textContent='No pudimos consultar la información de acceso.';status.hidden=false;status.textContent=e.message||'Error al consultar';});
}function linkContribution(card,id){
 const label=window.UHZUI?.translate('Aportado por')||'Aportado por';
 const key=[...card.querySelectorAll('dt')].find(x=>['aportado por',label.toLowerCase()].includes(x.textContent.trim().toLowerCase()));
 const target=key?.nextElementSibling;
 if(!target||target.tagName!=='DD')return;
 const original=(target.textContent||'').trim();
 const render=(text,profile)=>{const a=E('a',text,'uhzf-creator-link');a.href='/creador/'+encodeURIComponent(profile);target.replaceChildren(a)};
 if(!original||original.toLowerCase().includes('univershzrw'))render('UNIVERSHZRW','univershzrw');
 if(!id)return;
 fetch('/_uhz/portal/backend/rest/v1/rpc/uhz_coin_tip_options',{
  method:'POST',credentials:'same-origin',cache:'no-store',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({p_kind:'resource',p_identifier:id})
 }).then(r=>r.ok?r.json():null).then(v=>{
   if(!v?.ok)return;
   if(v.creator?.available&&v.creator.catalog_id)render(v.creator.label||'Creador',v.creator.catalog_id);
   else render('UNIVERSHZRW','univershzrw');
 }).catch(()=>{});
}
function enhance(card){if(card.dataset.uhzfDone)return;card.dataset.uhzfDone='1';let title=card.querySelector('.uhz-txt-title')?.textContent?.trim()||'Recurso',id=card.getAttribute('data-resource-id')||'';if(!article){if(!card.closest('#contenedorResultados'))return;card.classList.add('uhzf-compact');let href=local(card.querySelector('.uhz-txt-title a')?.getAttribute('href')||'/recurso/'+encodeURIComponent(id));if(href){let go=E('a','Ir al artículo ↗','uhzf-go');go.href=href;card.append(go)}return}let foot=card.querySelector('.uhzr-actions');if(!foot)return;const links=[...foot.querySelectorAll('a[href]')];
 const source=links.find(link=>link.relList.contains('external'));
 const acc=links.find(link=>{
   const target=new URL(link.href,location.origin);
   return target.origin===location.origin&&(target.searchParams.get('_uhz_robot')==='1'||/^\/(?:robot(?:\.html)?|_uhz\/exit-robot)$/i.test(target.pathname));
 });
 const improve=links.find(link=>new URL(link.href,location.origin).pathname==='/mejoras');let row=E('div',null,'uhzf-row');if(source){let a=E('a','Fuente original ↗','uhzf-action uhzf-source');a.href=source.href;a.target='_blank';a.rel='noopener noreferrer';row.append(a)}let b=E('button','Apoya al creador','uhzf-action uhzf-access');b.type='button';const descriptors=[card.getAttribute('data-resource-type'),card.getAttribute('data-type'),card.querySelector('.uhzr-kicker')?.textContent,card.querySelector('.uhzr-article-type')?.textContent,card.querySelector('.uhzr-meta')?.textContent].filter(Boolean).join(' · ');
 const matchType=descriptors.match(/(pel[ií]cula|film|pdf|serie|documento|document|libro|book|art[ií]culo|article|blog|m[uú]sica|music|audio|videojuego|game|v[ií]deo|software)/i);
 const kind=matchType?(matchType[1].toLocaleLowerCase('es')==='pdf'?'PDF':matchType[1].charAt(0).toLocaleUpperCase('es')+matchType[1].slice(1).toLocaleLowerCase('es')):'Contenido';
 b.onclick=()=>popup(title,acc?.getAttribute('href')||'',id,kind);row.append(b);let m=E('a','Proponer mejora','uhzf-action uhzf-improve');m.href=local(improve?.getAttribute('href'))||'/mejoras?recurso='+encodeURIComponent(id);row.append(m);foot.replaceChildren(row);let report=E('a','Reportar enlace caído','uhzf-report');report.href='mailto:univershzrw@gmail.com?subject='+encodeURIComponent('Reporte: '+title)+'&body='+encodeURIComponent('ID: '+id+' | Página: '+location.href);foot.append(report);linkContribution(card,id);card.classList.add('uhzf-article')}function run(){document.querySelectorAll('.uhzr-card:not([data-uhzf-done])').forEach(enhance)}function start(){run();new MutationObserver(run).observe(document.body,{childList:true,subtree:true})}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start()})();})();