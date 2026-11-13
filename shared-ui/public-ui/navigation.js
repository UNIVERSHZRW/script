// UNIVERSHZRW: directory and contextual shortcuts, without handling user files.
(()=>{const show=()=>{
const p=location.pathname.toLowerCase();
if(p.startsWith('/aportar_contenido')&&!document.getElementById('uhz-tools-contribute')){
 const main=document.querySelector('main#contenido,main');if(main){
  const n=document.createElement('nav');n.id='uhz-tools-contribute';n.setAttribute('aria-label','Herramientas de apoyo para aportar');
  n.style.cssText='display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0 20px;padding:12px 14px;border:1px solid #568dbb80;border-radius:12px;background:rgba(41,125,197,.09);font-size:13px';
  const b=document.createElement('strong');b.textContent='Prepara tu aporte · Gratis';n.append(b);
  for(const [label,hash] of [['Revisar enlace','enlaces'],['Preparar imagen','imagenes'],['Revisar ficha','seo']]){const a=document.createElement('a');a.href='/herramientas#'+hash;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;a.style.cssText='color:inherit;text-decoration:underline;text-underline-offset:3px;font-weight:650';n.append(a)}
  const h=main.querySelector('h1');if(h)h.insertAdjacentElement('afterend',n);else main.prepend(n);
 }
}
if(p.startsWith('/recurso/')&&!document.getElementById('uhz-tools-share')){
 const main=document.querySelector('main');if(main){
 const a=document.createElement('a');a.id='uhz-tools-share';a.href='/herramientas?page='+encodeURIComponent(location.href)+'#qr';a.target='_blank';a.rel='noopener noreferrer';a.textContent='Compartir ficha con QR ↗';a.style.cssText='display:inline-block;margin:14px 0;padding:9px 13px;border:1px solid #4d82b680;border-radius:9px;color:inherit;font-size:13px;font-weight:650;text-decoration:none;background:rgba(53,128,187,.08)';
 const h=main.querySelector('h1');if(h)h.insertAdjacentElement('afterend',a);else main.prepend(a);
 }
}
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});else show();})();
window.UHZModules=Object.freeze([
 {label:'Mi cuenta',path:'/mi-cuenta',group:'Cuenta'},
 {label:'Perfil y avatar',path:'/perfil',group:'Cuenta'},
 {label:'Mis contenidos',path:'/mis-contenidos',group:'Cuenta'},
 {label:'Mis Coins',path:'/coins',group:'Coins'},
 
 {label:'Planes',path:'/planes',group:'Coins'},
 {label:'Estudio de Creadores · Premium',path:'/estudio',group:'Creadores'},
 {label:'INFYNITY · INFT',path:'/criptomoneda',group:'Coins'},
 {label:'Comunichat',path:'/comunichat',group:'Participación'},
 {label:'Mejoras y revisiones',path:'/mejoras',group:'Participación'},
 {label:'Mis aportaciones',path:'/mi-cuenta?section=contribute',group:'Participación'},
 {label:'Favoritos',path:'/mi-cuenta?section=favorites',group:'Participación'},
 {label:'Mis avisos',path:'/mi-cuenta?section=notifications',group:'Participación'},
 {label:'Material exclusivo',path:'/mi-cuenta?section=marketplace',group:'Participación'},
 {label:'Enviar mi opinión',path:'/mi-cuenta?section=feedback',group:'Participación'},
 {label:'Biblioteca',path:'/biblioteca',group:'Explorar'},
 {label:'Herramientas gratuitas',path:'/herramientas',group:'Explorar'},
 {label:'Inspector de enlaces',path:'/herramientas#enlaces',group:'Herramientas'},
 {label:'Generar QR',path:'/herramientas#qr',group:'Herramientas'},
 {label:'Optimizar imágenes',path:'/herramientas#imagenes',group:'Herramientas'},
 {label:'Revisión SEO',path:'/herramientas#seo',group:'Herramientas'},
 {label:'Metadatos HTML',path:'/herramientas#meta',group:'Herramientas'},
 {label:'Creadores',path:'/creadores',group:'Explorar'},
 {label:'Administración',path:'/usuarios',group:'Administración',admin:true}
]);

(()=>{
'use strict';
const root=document.documentElement;
if(!root.hasAttribute('data-uhz-ui')||window.UHZUI)return;
const bars='#uhz-ui-desktop,#uhz-ui-mobile,#uhz-ui-footer';
const mobile=matchMedia('(max-width: 800px)');
const pagePath=location.pathname.toLowerCase().replace(/\/+$/,'')||'/';
const attributes=['placeholder','aria-label','title','alt'];
const sourceText=new WeakMap();
const sourceAttributes=new WeakMap();
const pendingNodes=new Set();
const ignored='script,style,noscript,code,pre,kbd,samp,svg,math,[translate="no"],[data-user-content],[contenteditable],.uhzr-article,.c-comment-body,.chat-message,.message-text,.uhz-content-title,[data-uhz-avatar]';
const backend='/_uhz/portal/backend';
let language='es';
let theme='colorful';
let observer;
let frame=0;
let started=false;
let member=false;
let memberId=null;
let accountData=null;
let accountEpoch=0;
let pendingAccount;
let checkedAt=-Infinity;
let publicCatalogIds=[];
let plansHistory;
let dictionary=Object.create(null);
let pendingDictionary;
function loadDictionary() {
  if(window.UHZTranslations){dictionary=window.UHZTranslations;return Promise.resolve();}
  if(pendingDictionary)return pendingDictionary;
  const link=document.createElement('script');
  link.src='/_uhz/shared-header.js?asset=ui-en-5';
  pendingDictionary=new Promise(resolve=>{
    link.addEventListener('load',()=>{
      dictionary=window.UHZTranslations||dictionary;
      if(language==='en'){observer?.disconnect();translatePage();updateBalances();watchTranslations();window.dispatchEvent(new CustomEvent('uhz:language-change',{detail:{language}}));}
      resolve();
    },{once:true});
    link.addEventListener('error',()=>{pendingDictionary=null;link.remove();resolve();},{once:true});
  });
  document.head.append(link);
  return pendingDictionary;
}
function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function save(key,value) {
  try { localStorage.setItem(key,value); } catch {}
}
function applyTheme(value,persist=true,notify=true) {
  theme=value==='dark'?'dark':'colorful';
  const dark=theme==='dark';
  root.dataset.uhzTheme=theme;
  root.dataset.theme=dark?'dark':'light';
  root.style.colorScheme=dark?'dark':'light';
  root.style.backgroundColor=dark?'#1c1c1c':'#eff8f5';
  document.body?.classList.toggle('dark-mode',dark);
  document.body?.classList.toggle('modo-oscuro',dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#1c1c1c':'#eff8f5');
  for(const button of document.querySelectorAll('[data-uhz-theme-choice]')) {
    button.setAttribute('aria-pressed',String(button.dataset.uhzThemeChoice===theme));
  }
  if(persist) {
    save('uhz_header_theme',theme);
    save('modo_oscuro_univershzrw',dark?'1':'0');
  }
  if(notify)window.dispatchEvent(new CustomEvent('uhz:theme-change',{detail:{theme}}));
}
function textInLanguage(original) {
  if(language!=='en')return original;
  const key=original.trim().replace(/\s+/g,' ');
  let value=Object.hasOwn(dictionary,key)?dictionary[key]:null;
  const price=key.match(/^([\d,]+) Coins · Referencia \$([\d,]+) MXN · INFT requerido: por cotizar$/);
  if(!value&&price)value=price[1]+' Coins · $'+price[2]+' MXN reference value · INFT quote pending';
  const contribution=key.match(/^Con \$([\d,]+) MXN ayudas a dedicar recursos a mantener UNIVERSHZRW, preparar aportaciones y mejorar el servicio\.$/);
  if(!value&&contribution)value='With $'+contribution[1]+' MXN, you help maintain UNIVERSHZRW, prepare contributions and improve the service.';
  if(!value&&key.endsWith('*')) {
    const required=key.slice(0,-1).trim();
    if(Object.hasOwn(dictionary,required))value=dictionary[required]+' *';
  }
  return value?original.replace(/\S[\s\S]*\S|\S/,value):original;
}
function translateText(node) {
  if(!node.parentElement||!node.data.trim()||node.parentElement.closest(ignored))return;
  const option=node.parentElement.closest('option');
  if(option&&!option.hasAttribute('value'))option.value=option.value;
  const old=sourceText.get(node);
  const original=old?.output===node.data?old.original:node.data;
  const output=textInLanguage(original);
  if(output!==original||old)sourceText.set(node,{original,output});
  if(output!==node.data)node.data=output;
}
function translateAttributes(node) {
  if(node.closest(ignored))return;
  let record=sourceAttributes.get(node);
  for(const name of attributes) {
    const value=node.getAttribute(name);
    if(value===null)continue;
    const previous=record?.[name];
    const original=previous?.output===value?previous.original:value;
    const output=textInLanguage(original);
    if(output!==original||previous) {
      if(!record){record={};sourceAttributes.set(node,record);}
      record[name]={original,output};
    }
    if(output!==value)node.setAttribute(name,output);
  }
}
function translateTree(node) {
  if(!node.isConnected)return;
  if(node.nodeType===Node.TEXT_NODE){translateText(node);return;}
  if(node.nodeType!==Node.ELEMENT_NODE||node.closest(ignored))return;
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{
    acceptNode(part) {
      if(part.nodeType===Node.ELEMENT_NODE&&part.matches(ignored))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  translateAttributes(node);
  let part;
  while((part=walker.nextNode())) {
    if(part.nodeType===Node.TEXT_NODE)translateText(part);
    else translateAttributes(part);
  }
}
function translatePage() {
  translateTree(document.body);
  translateTree(document.querySelector('title')||root);
}
function flushTranslations() {
  frame=0;
  const nodes=[...pendingNodes];
  pendingNodes.clear();
  for(const node of nodes) {
    if(node.nodeType===Node.TEXT_NODE)translateText(node);
    else translateTree(node);
  }
}
function watchTranslations() {
  observer?.disconnect();
  if(language!=='en') {
    cancelAnimationFrame(frame);
    frame=0;
    pendingNodes.clear();
    return;
  }
  observer??=new MutationObserver(records=>{
    for(const entry of records) {
      if(entry.type==='childList') {
        for(const node of entry.addedNodes)pendingNodes.add(node);
      } else if(entry.type==='characterData') {
        if(sourceText.get(entry.target)?.output!==entry.target.data)pendingNodes.add(entry.target);
      } else {
        const current=entry.target.getAttribute(entry.attributeName);
        if(sourceAttributes.get(entry.target)?.[entry.attributeName]?.output!==current)pendingNodes.add(entry.target);
      }
    }
    if(!frame&&pendingNodes.size)frame=requestAnimationFrame(flushTranslations);
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
  const title=document.querySelector('title');
  if(title)observer.observe(title,{childList:true,characterData:true,subtree:true});
}
function setLanguage(value,updateURL=false,persist=true) {
  const next=value==='en'?'en':'es';
  const changed=language!==next;
  language=next;
  root.lang=language==='en'?'en':'es-MX';
  if(persist)save('uhz_language',language);
  if(updateURL) {
    const url=new URL(location.href.startsWith('http')?location.href:'https://univershzrw.com/');
    if(language==='en'||url.searchParams.has('lang'))url.searchParams.set('lang',language);
    if(location.protocol==='https:'||location.protocol==='http:')history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  if(started) {
    if(window.UHZTranslations)dictionary=window.UHZTranslations;
    observer?.disconnect();
    for(const button of document.querySelectorAll('[data-uhz-lang-choice]')) {
      button.setAttribute('aria-pressed',String(button.dataset.uhzLangChoice===language));
    }
    if(changed||language==='en')translatePage();
    if(language==='en')void loadDictionary();
    updateBalances();
    watchTranslations();
  }
  window.dispatchEvent(new CustomEvent('uhz:language-change',{detail:{language}}));
}
function activeLinks() {
  const current=new URL(location.href.startsWith('http')?location.href:'https://univershzrw.com/');
  for(const link of document.querySelectorAll('#uhz-ui-desktop a[href^="/"],#uhz-ui-mobile a[href^="/"]')) {
    const target=new URL(link.getAttribute('href'),current.origin);
    const pathname=target.pathname.toLowerCase().replace(/\/+$/,'')||'/';
    const samePath=pathname===pagePath||(pathname==='/comunichat'&&(
      pagePath==='/comunidad'||pagePath==='/mi-cuenta'&&current.searchParams.get('section')==='comunichat'
    ));
    const sameSection=target.searchParams.has('section')?
      target.searchParams.get('section')===current.searchParams.get('section'):
      !current.searchParams.has('section')||pathname==='/comunichat';
    if(samePath&&sameSection&&(!target.hash||target.hash===location.hash))link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
}
function updateBalances() {
  const format=(value,digits=0)=>value!==undefined&&value!==null&&value!==''&&Number.isFinite(Number(value))?
    new Intl.NumberFormat(language==='en'?'en-US':'es-MX',{maximumFractionDigits:digits}).format(Number(value)):'—';
  const labels={free:'Gratis',premium:'Premium',creator:'Creador',studio:'Estudio'};
  const balance={
    coins:format(accountData?.coins_balance),
    inft:format(accountData?.inft_platform_available,6),
    plan:textInLanguage(labels[String(accountData?.plan||'').toLowerCase()]||'—')
  };
  for(const node of document.querySelectorAll('[data-uhz-balance]'))node.textContent=balance[node.dataset.uhzBalance];
}
async function request(path,body) {
  const config={credentials:'same-origin',cache:'no-store'};
  if(AbortSignal.timeout)config.signal=AbortSignal.timeout(8000);
  if(body!==undefined)Object.assign(config,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  return fetch(backend+path,config);
}
async function value(path,body) {
  try {
    const response=await request(path,body);
    return response.ok?await response.json():null;
  } catch { return null; }
}
function updateMember(user) {
  const nextId=user?.id&&user.email_confirmed_at?user.id:null;
  if(memberId!==nextId) {
    for(const node of document.querySelectorAll('[data-uhz-avatar]'))node.remove();
    accountData=null;
    publicCatalogIds=[];
    for(const node of document.querySelectorAll('[data-uhz-notice-count]'))node.hidden=true;
  }
  memberId=nextId;
  member=Boolean(memberId);
  for(const node of document.querySelectorAll('[data-uhz-member]'))node.hidden=!member;
  for(const node of document.querySelectorAll('[data-uhz-notices]')) {
    node.href=member?'/mi-cuenta?section=notifications':'/iniciar-sesion?next=%2Fmi-cuenta%3Fsection%3Dnotifications';
  }
  for(const node of document.querySelectorAll('[data-uhz-account]')) {
    node.href=member?'/mi-cuenta':'/iniciar-sesion';
    const label=node.querySelector('span');
    const name=member?'Mi cuenta':'Entrar';
    if(label.firstChild?.nodeType===Node.TEXT_NODE) {
      const node=label.firstChild;
      const output=textInLanguage(name);
      sourceText.set(node,{original:name,output});
      node.data=output;
    } else label.textContent=name;
    if(!member)node.querySelector('img[data-uhz-avatar]')?.remove();
    const icon=node.querySelector('svg');
    if(icon&&!node.querySelector('img[data-uhz-avatar]'))icon.style.removeProperty('display');
  }
  updateBalances();
}
function showAvatar(profile,id) {
  const key=profile?.[0]?.avatar_key;
  if(typeof key!=='string'||!key.startsWith(id+'/')||!/^[-0-9a-f]{36}\/[-0-9a-f]{36}\.webp$/i.test(key))return;
  for(const link of document.querySelectorAll('[data-uhz-account]')) {
    const old=link.querySelector('img[data-uhz-avatar]');
    if(old?.getAttribute('src')==='/_uhz/portal/media/'+key)continue;
    old?.remove();
    const img=document.createElement('img');
    img.dataset.uhzAvatar='';
    img.alt='';
    img.width=23;
    img.height=23;
    const icon=link.querySelector('svg');
    img.addEventListener('load',()=>{if(icon)icon.style.display='none';},{once:true});
    img.addEventListener('error',()=>{img.remove();if(icon)icon.style.removeProperty('display');},{once:true});
    img.src='/_uhz/portal/media/'+key;
    link.prepend(img);
  }
}
function showNotifications(notices,catalog) {
  const known=read('uhz_catalog_seen_v1');
  if(Array.isArray(catalog?.items)) {
    publicCatalogIds=[...new Set(catalog.items.filter(item=>item?.available!==false).map(item=>String(item?.id||item?.slug||'')).filter(Boolean))].slice(0,700);
  }
  let recent=0;
  try {
    const past=known?JSON.parse(known):null;
    if(Array.isArray(past)) {
      const knownIds=new Set(past);
      recent=publicCatalogIds.filter(id=>!knownIds.has(id)).length;
    } else if(publicCatalogIds.length)save('uhz_catalog_seen_v1',JSON.stringify(publicCatalogIds));
  } catch {}
  const count=(Array.isArray(notices)?notices.length:0)+recent;
  for(const badge of document.querySelectorAll('[data-uhz-notice-count]')) {
    badge.textContent=count>99?'99+':String(count);
    badge.hidden=!count;
  }
}
function showPlansAccount(state,epoch) {
  if(!root.hasAttribute('data-uhz-plans-account'))return;
  const tier=document.getElementById('tier');
  const balance=document.getElementById('balance');
  const accountLink=document.getElementById('accountLink');
  const sent=document.getElementById('uhzTipSentList');
  const received=document.getElementById('uhzTipReceivedList');
  const sentTotal=document.getElementById('uhzTipSent');
  const receivedTotal=document.getElementById('uhzTipReceived');
  if(!tier||!balance||!accountLink||!sent||!received||!sentTotal||!receivedTotal)return;
  const message=(list,label)=>{
    const item=document.createElement('li');
    item.textContent=label;
    list.replaceChildren(item);
  };
  if(state!=='member') {
    plansHistory=null;
    accountData=null;
    updateBalances();
    const guest=state==='guest';
    tier.textContent=guest?'Inicia sesión para consultar':'No pudimos consultar tu cuenta.';
    balance.textContent='—';
    accountLink.href='/iniciar-sesion?next=%2Fplanes';
    sentTotal.textContent=receivedTotal.textContent='—';
    for(const list of [sent,received])message(list,guest?'Inicia sesión para consultar tus apoyos.':'No pudimos consultar tus apoyos.');
    return;
  }
  paintPlansAccount();
  void value('/rest/v1/rpc/uhz_coin_tip_my_history',{}).then(history=>{
    if(epoch!==accountEpoch)return;
    plansHistory=history?.ok===true?history:null;
    if(plansHistory)paintPlansAccount();
    else {
      sentTotal.textContent=receivedTotal.textContent='—';
      for(const list of [sent,received])message(list,'No pudimos consultar tus apoyos.');
    }
  });
}
function paintPlansAccount() {
  if(!root.hasAttribute('data-uhz-plans-account')||!accountData)return;
  const tier=document.getElementById('tier');
  const balance=document.getElementById('balance');
  const accountLink=document.getElementById('accountLink');
  const sentTotal=document.getElementById('uhzTipSent');
  const receivedTotal=document.getElementById('uhzTipReceived');
  if(!tier||!balance||!accountLink||!sentTotal||!receivedTotal)return;
  const locale=language==='en'?'en-US':'es-MX';
  const numbers=new Intl.NumberFormat(locale);
  const number=value=>numbers.format(Number(value)||0);
  tier.textContent=accountData.plan==='premium'?'Premium':'Gratis';
  balance.textContent='₡'+number(accountData.coins_balance);
  accountLink.href='/mi-cuenta';
  if(!plansHistory)return;
  const formatter=new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric'});
  function paint(id,entries,other) {
    const items=(Array.isArray(entries)&&entries.length?entries.slice(0,10):[null]).map(entry=>{
      const item=document.createElement('li');
      if(entry) {
        const date=new Date(entry.created_at);
        const day=Number.isNaN(+date)?'':formatter.format(date);
        item.setAttribute('translate','no');
        item.textContent=number(entry.amount_coins)+' Coins · '+(entry[other]||'—')+' · '+day;
      } else item.textContent='Sin movimientos todavía.';
      return item;
    });
    document.getElementById(id)?.replaceChildren(...items);
  }
  sentTotal.textContent=number(plansHistory.sent_coins)+' Coins';
  receivedTotal.textContent=number(plansHistory.received_coins)+' Coins';
  paint('uhzTipSentList',plansHistory.sent,'recipient');
  paint('uhzTipReceivedList',plansHistory.received,'donor');
}
function refreshAccount(force=false) {
  if(pendingAccount&&!force)return pendingAccount;
  if(!force&&Date.now()-checkedAt<45000)return;
  checkedAt=Date.now();
  const epoch=++accountEpoch;
  const job=(async()=>{
    try {
      const res=await request('/auth/v1/user');
      if(epoch!==accountEpoch)return;
      if(res.status===401||res.status===403){updateMember(null);showPlansAccount('guest',epoch);return;}
      if(!res.ok){showPlansAccount('unavailable',epoch);return;}
      const user=await res.json();
      if(epoch!==accountEpoch)return;
      updateMember(user);
      if(!member){showPlansAccount('guest',epoch);return;}
      if(user.must_change_password){showPlansAccount('unavailable',epoch);return;}
      const id=memberId;
      await Promise.all([
        value('/rest/v1/rpc/uhz_header_account_summary',{}).then(data=>{
          if(epoch!==accountEpoch)return;
          if(data?.ok!==true){showPlansAccount('unavailable',epoch);return;}
          accountData=data;updateBalances();
          showPlansAccount('member',epoch);
        }),
        value('/rest/v1/community_profiles?select=avatar_key&user_id=eq.'+encodeURIComponent(id)+'&limit=1').then(profile=>{
          if(epoch===accountEpoch)showAvatar(profile,id);
        }),
        Promise.all([value('/rest/v1/rpc/uhz_notifications',{}),value('/rest/v1/rpc/uhz_eco_catalog',{})]).then(([notices,catalog])=>{
          if(epoch===accountEpoch)showNotifications(notices,catalog);
        })
      ]);
    } catch {if(epoch===accountEpoch)showPlansAccount('unavailable',epoch);}
  })();
  pendingAccount=job;
  void job.finally(()=>{if(pendingAccount===job)pendingAccount=null;});
  return job;
}
function showShareStatus(message) {
  const status=document.querySelector('#uhz-ui-footer .uhz-ui-share-status');
  if(status)status.textContent=textInLanguage(message);
}
async function share(button) {
  const url=new URL(location.href);
  for(const name of ['token','token_hash','access_token','refresh_token','code'])url.searchParams.delete(name);
  if(/(?:access_token|refresh_token|token_hash)=/.test(url.hash))url.hash='';
  const type=['facebook','instagram','whatsapp','x','copy'].find(name=>button.classList.contains(name));
  const href=encodeURIComponent(url.href);
  const services={
    facebook:'https://www.facebook.com/sharer/sharer.php?u='+href,
    whatsapp:'https://wa.me/?text='+href,
    x:'https://twitter.com/intent/tweet?url='+href
  };
  if(Object.hasOwn(services,type)) {
    window.open(services[type],'_blank','noopener,noreferrer');
    return;
  }
  try {
    if(type==='instagram'&&navigator.share)await navigator.share({title:document.title,url:url.href});
    else {
      await navigator.clipboard.writeText(url.href);
      showShareStatus('Enlace copiado');
    }
  } catch(error) {
    if(error.name!=='AbortError')showShareStatus('Copia la dirección desde la barra del navegador');
  }
}
function closeMenus(except) {
  for(const menu of document.querySelectorAll('.uhz-ui-disclosure[open]')) {
    if(menu!==except)menu.open=false;
  }
}
function wireNavigation() {
  const disclosures=document.querySelectorAll('.uhz-ui-disclosure');
  for(const detail of disclosures) {
    detail.addEventListener('toggle',()=>{
      if(detail.open)closeMenus(detail);
    });
  }
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest('.uhz-ui-disclosure'))closeMenus();
  },{passive:true});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const menu=document.querySelector('.uhz-ui-disclosure[open]');
    if(!menu)return;
    menu.open=false;
    menu.querySelector('summary')?.focus();
  });
  for(const region of document.querySelectorAll(bars)) {
    region.addEventListener('click',event=>{
      const option=event.target.closest('[data-uhz-theme-choice],[data-uhz-lang-choice]');
      if(option?.dataset.uhzThemeChoice)applyTheme(option.dataset.uhzThemeChoice);
      else if(option?.dataset.uhzLangChoice)setLanguage(option.dataset.uhzLangChoice,true);
      const sharing=event.target.closest('#uhz-ui-footer button.uhz-share-btn');
      if(sharing){event.preventDefault();void share(sharing);}
      const logout=event.target.closest('[data-uhz-logout]');
      if(logout){document.getElementById('exit')?.click();closeMenus();return;}
      const seal=event.target.closest('#uhz-ui-footer .uhz-footer-verification');
      if(seal){
        event.preventDefault();
        if(typeof window.UHZOpenVerification==='function')window.UHZOpenVerification();
        else {
          const script=document.createElement('script');
          script.src='/_uhz/shared-header.js?asset=site-verification-2';
          script.addEventListener('load',()=>{
            if(typeof window.UHZOpenVerification==='function')window.UHZOpenVerification();
            else location.assign(seal.href);
          },{once:true});
          script.addEventListener('error',()=>location.assign(seal.href),{once:true});
          document.head.append(script);
        }
      }
      const link=event.target.closest('a[href]');
      if(link) {
        if(link.hasAttribute('data-uhz-notices')&&publicCatalogIds.length) {
          save('uhz_catalog_seen_v1',JSON.stringify(publicCatalogIds));
        }
        closeMenus();
      }
    });
  }
  mobile.addEventListener('change',()=>closeMenus());
  window.addEventListener('hashchange',activeLinks);
}
function init() {
  if(started||!document.body)return;
  started=true;
  const requested=new URLSearchParams(location.search).get('lang');
  const stored=read('uhz_header_theme')||root.dataset.uhzTheme;
  applyTheme(stored,false,false);
  setLanguage(requested==='en'||requested==='es'?requested:read('uhz_language'),false,Boolean(requested));
  activeLinks();
  wireNavigation();
  if(root.hasAttribute('data-uhz-portal')) {
    root.classList.add('uhzg-active');
    const target=document.querySelector('.uhz-account-navigation');
    const legacy=document.querySelector('.uhz-page-header');
    if(target&&legacy) {
      const recoverControls=()=>{
        for(const id of ['uhzEmbedNav']) {
          const node=legacy.querySelector('#'+id);
          if(node)target.append(node);
        }
        const more=legacy.querySelector('.uhz-more-account');
        if(more)target.append(more);
      };
      new MutationObserver(recoverControls).observe(legacy,{childList:true});
      recoverControls();
    }
  }
  const check=()=>{void refreshAccount();};
  if(typeof requestIdleCallback==='function')requestIdleCallback(check,{timeout:1500});
  else setTimeout(check,500);
  if(root.hasAttribute('data-uhz-portal')||root.classList.contains('uhz-account-app')) {
    let wasSignedIn=root.classList.contains('uhz-signed-in');
    new MutationObserver(()=>{
      const signedIn=root.classList.contains('uhz-signed-in');
      if(signedIn===wasSignedIn)return;
      wasSignedIn=signedIn;
      if(!signedIn)updateMember(null);
      void refreshAccount(true);
    }).observe(root,{attributes:true,attributeFilter:['class']});
  }
  window.addEventListener('pageshow',event=>{if(event.persisted){closeMenus();void refreshAccount(true);}});
  window.addEventListener('focus',check);
  for(const event of ['uhz:coins-updated','uhz:coins-changed','uhz:plan-updated','uhz:session']) {
    window.addEventListener(event,()=>{void refreshAccount(true);});
  }
  if(root.hasAttribute('data-uhz-plans-account'))window.addEventListener('uhz:language-change',paintPlansAccount);
  window.addEventListener('message',event=>{
    if(event.origin===location.origin&&event.data?.type==='uhz:session')void refreshAccount(true);
  });
  window.addEventListener('storage',event=>{
    if(event.key==='uhz_header_theme')applyTheme(event.newValue,false);
    if(event.key==='uhz_language')setLanguage(event.newValue,false,false);
  });
}
window.UHZUI=Object.freeze({setTheme:applyTheme,translate:textInLanguage});
window.UHZLanguage=Object.freeze({setLanguage,getLanguage:()=>language});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
