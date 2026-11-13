/* UNIVERSHZRW Shell v2 · MIT licensed. Accessible disclosure pattern:
   https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/
   Mobile offcanvas inspired by Bootstrap 5 (MIT). No external runtime. */
;(()=>{'use strict';
if(window.__uhzUnifiedShellV2)return;window.__uhzUnifiedShellV2=true;
const p=location.pathname.toLowerCase(),q=new URLSearchParams(location.search);
if(top!==self||q.get('embed')==='1'||q.get('_uhz_robot')==='1'||/\/(?:robot|archivos|control-sd)(?:\/|$)/.test(p))return;
if(!document.getElementById('uhz-unified-shell-v2-css')){const s=document.createElement('link');s.id='uhz-unified-shell-v2-css';s.rel='stylesheet';s.href='/_uhz/shared-header.js?asset=shell-v2&v=20261112';document.head.append(s)}
const tools=[['Herramientas','/herramientas'],['Planes','/planes'],['Estudio Premium','/estudio'],['Biblioteca','/biblioteca'],['INFYNITY','/criptomoneda'],['Coins','/economia'],['Ayuda','/centro-de-ayuda']];
const sections=[
['Explorar',[['Inicio','/'],['Biblioteca','/biblioteca'],['Tienda online','/tienda_online'],['Herramientas','/herramientas'],['Peticiones','/peticiones']]],
['Participar',[['Aportar contenido','/Aportar_contenido'],['Comunichat','/mi-cuenta?section=comunichat'],['Creadores','/creadores'],['Donar','/donar'],['Reportar contenido','/reportar-contenido']]],
['Mi cuenta',[['Mi cuenta','/mi-cuenta'],['Planes','/planes'],['Mis Coins','/coins'],['INFYNITY','/criptomoneda'],['Estudio Premium','/estudio']]],
['Legal y ayuda',[['Centro de ayuda','/centro-de-ayuda'],['Seguridad','/seguridad'],['Privacidad','/politica-de-privacidad'],['Términos','/terminos-y-condiciones'],['Contacto','/contacto']]]];
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x};
const active=href=>{try{const x=new URL(href,location.origin);return x.pathname.toLowerCase()===p&&(!x.search||x.search===location.search)}catch{return false}};
const a=(name,href)=>{const n=el('a',null,name);n.href=href;if(active(href))n.setAttribute('aria-current','page');return n};
function header(){
  const root=document.getElementById('uhz-global-header');
  const nav=root?.querySelector('.uhzg-main');
  if(!root||!nav||root.dataset.unifiedV3)return;
  const bell=nav.querySelector('.uhzg-notifications');
  const account=nav.querySelector('.uhzg-account');
  const theme=nav.querySelector('.uhzg-theme-picker');
  if(!bell||!account||!theme)return; // Never replace navigation unless the original session controls exist.
  root.dataset.unifiedV3='1';
  root.classList.add('uhz-v3-header');
  const originalWallet=account.querySelector('[aria-label="Ver plan y saldo de Coins"]');
  if(originalWallet){originalWallet.className='uhzg-wallet uhz-v3-legacy-wallet';originalWallet.hidden=true;originalWallet.style.setProperty('display','none','important')}
  const primary=el('div','uhz-v3-primary');
  const entries=[['aportar','Aportar'],['tienda','Tienda'],['comunidad','Comunichat'],['economy','Planes'],['tools','Herramientas']];
  for(const [key,text] of entries){
    const original=nav.querySelector('[data-action="'+key+'"]');
    if(!original)continue;
    original.textContent=text;original.classList.add('uhz-v3-nav-link');
    primary.append(original);
  }
  const more=el('details','uhz-v3-more');
  const summary=el('summary','uhz-v3-more-trigger','Más');
  summary.setAttribute('aria-label','Más secciones de UNIVERSHZRW');
  summary.setAttribute('aria-expanded','false');
  const menu=el('div','uhz-v3-more-menu');
  const menuLabel=el('strong','uhz-v3-menu-label','EXPLORAR Y PARTICIPAR');
  menu.append(menuLabel);
  const menuItems=[
    ['Biblioteca','/biblioteca'],['INFYNITY','/criptomoneda'],
    ['Creadores','/creadores'],['Peticiones','/peticiones'],
    ['Estudio Premium','/estudio'],['Donar','/donar'],
    ['Seguridad','/seguridad'],['Centro de ayuda','/centro-de-ayuda'],
    ['Reportar contenido','/reportar-contenido'],['Contacto','/contacto']
  ];
  const moreLinks=el('div','uhz-v3-menu-links');
  for(const [label,href] of menuItems)moreLinks.append(a(label,href));
  for(const [label,href] of [['Herramientas','/herramientas'],['Comunichat','/mi-cuenta?section=comunichat']]){
    const extra=a(label,href);extra.classList.add('uhz-v3-compact-only');moreLinks.prepend(extra);
  }
  menu.append(moreLinks);
  const options=el('div','uhz-v3-menu-options');
  const themeWrap=el('label','uhz-v3-theme-wrap');
  themeWrap.append(el('span',null,'Apariencia'));
  theme.style.cssText='';theme.classList.add('uhz-v3-theme');
  themeWrap.append(theme);options.append(themeWrap);
  const langWrap=el('div','uhz-v3-language');
  langWrap.append(el('span',null,'Idioma'));
  const buttons=el('div','uhz-v3-language-buttons');
  for(const [code,text] of [['es','ES'],['en','EN']]){
    const button=el('button',null,text);
    button.type='button';button.dataset.uhzV3Lang=code;
    button.setAttribute('aria-label',code==='es'?'Mostrar en español':'Show in English');
    button.addEventListener('click',()=>{
      const original=document.querySelector('#uhz-native-head [data-uhz-language="'+code+'"]');
      if(original)original.click();
    });
    buttons.append(button);
  }
  langWrap.append(buttons);options.append(langWrap);
  menu.append(options);
  const contact=el('div','uhz-v3-menu-contact');
  const email=nav.querySelector('a[href^="mailto:"]');
  const whatsapp=nav.querySelector('a[href^="https://wa.me/"]');
  if(email){email.textContent='Correo';contact.append(email)}
  if(whatsapp){whatsapp.textContent='WhatsApp';contact.append(whatsapp)}
  menu.append(contact);
  more.append(summary,menu);primary.append(more);
  more.addEventListener('toggle',()=>summary.setAttribute('aria-expanded',String(more.open)));
  document.addEventListener('pointerdown',event=>{if(more.open&&!more.contains(event.target))more.open=false},true);
  more.addEventListener('keydown',event=>{if(event.key==='Escape'){more.open=false;summary.focus();event.preventDefault()}});
  more.addEventListener('click',event=>{if(event.target.closest('a'))more.open=false});
  const userbar=el('div','uhz-v3-userbar');
  const balances=el('div','uhz-v3-balances');
  balances.id='uhz-v3-balances';balances.hidden=true;
  const chip=(className,label,href,id,note)=>{
    const item=a('',href);item.className='uhz-v3-chip '+className;
    const labelEl=el('span','uhz-v3-chip-label',label);
    const value=el('strong','uhz-v3-chip-value','—');value.id=id;
    item.append(labelEl,value);
    if(note)item.title=note;
    return item;
  };
  balances.append(
    chip('uhz-v3-coins','Coins','/coins','uhz-v3-coins','Saldo de Coins internos'),
    chip('uhz-v3-inft','INFT','/criptomoneda/panel','uhz-v3-inft','INFT registrado dentro de UNIVERSHZRW; no incluye cartera externa'),
    chip('uhz-v3-plan','Plan','/planes','uhz-v3-plan','Consultar tu membresía activa')
  );
  const live=el('span','uhz-v3-sr-only');live.id='uhz-v3-live';live.setAttribute('role','status');live.setAttribute('aria-live','polite');
  const own=el('div','uhz-v3-account');
  own.append(account);
  userbar.append(balances,bell,own,live);
  nav.replaceChildren(primary,userbar);
  nav.classList.add('uhz-v3-nav');
  const setSummary=data=>{
    const money=data?.coins_balance,coin=Number(money),inft=Number(data?.inft_platform_available);
    const safeCoins=money!==undefined&&money!==null&&Number.isSafeInteger(coin)&&coin>=0;
    const safeInft=data?.inft_platform_available!==undefined&&Number.isFinite(inft)&&inft>=0;
    const fmt=new Intl.NumberFormat('es-MX',{maximumFractionDigits:0});
    const fmtInft=new Intl.NumberFormat('es-MX',{minimumFractionDigits:2,maximumFractionDigits:6});
    const plan=String(data?.plan||'').toLowerCase();
    const planLabel=({'free':'Gratis','premium':'Premium','creator':'Creador','studio':'Estudio'})[plan]||'Consultar';
    const c=safeCoins?fmt.format(coin):'—',i=safeInft?fmtInft.format(inft):'—';
    const nodes=[['uhz-v3-coins',c],['uhz-v3-inft',i],['uhz-v3-plan',planLabel],
      ['uhz-v3-mobile-coins',c],['uhz-v3-mobile-inft',i],['uhz-v3-mobile-plan',planLabel]];
    for(const [id,value] of nodes){const n=document.getElementById(id);if(n)n.textContent=value}
    const mn=document.getElementById('uhz-v3-mobile-wallet');if(mn)mn.hidden=false;
    live.textContent='Estado de tu cuenta actualizado';
  };
  let member=false,loading=false,lastLoaded=0,generation=0;
  async function load(){
    if(!member||loading)return;
    loading=true;const stamp=++generation;
    try{
      const r=await fetch('/_uhz/portal/backend/rest/v1/rpc/uhz_header_account_summary',{
        method:'POST',credentials:'include',cache:'no-store',
        headers:{'content-type':'application/json'},body:'{}'
      });
      if(!r.ok)throw Error('Cuenta no disponible');
      const data=await r.json();
      if(!data||data.ok!==true)throw Error('Resumen inválido');
      if(member&&stamp===generation){setSummary(data);lastLoaded=Date.now()}
    }catch{
      if(member&&stamp===generation)live.textContent='No fue posible actualizar el saldo; abre Mi cuenta para consultarlo';
    }finally{loading=false}
  }
  function sync(){
    const next=account.classList.contains('is-member');
    if(member!==next){
      member=next;
      balances.hidden=!member;
      const mn=document.getElementById('uhz-v3-mobile-wallet');
      if(mn)mn.hidden=!member;
      if(!member){
        generation++;lastLoaded=0;
        for(const id of ['uhz-v3-coins','uhz-v3-inft','uhz-v3-plan','uhz-v3-mobile-coins','uhz-v3-mobile-inft','uhz-v3-mobile-plan']){
          const n=document.getElementById(id);if(n)n.textContent='—';
        }
      }else void load();
    }
    if(member&&Date.now()-lastLoaded>60000)void load();
  }
  window.__uhzV3SyncHeader=sync;
  new MutationObserver(sync).observe(account,{attributes:true,attributeFilter:['class']});
  window.addEventListener('focus',()=>{if(member)void load()});
  window.addEventListener('pageshow',()=>{if(member)void load()});
  window.addEventListener('uhz:coins-updated',()=>{if(member)void load()});
  window.addEventListener('uhz:plan-updated',()=>{if(member)void load()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&member&&Date.now()-lastLoaded>30000)void load()});
  sync();
  const syncLang=()=>{const current=document.querySelector('#uhz-native-head [data-uhz-language][aria-pressed="true"]')?.dataset.uhzLanguage||'es';
    for(const b of buttons.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.uhzV3Lang===current))};
  for(const b of buttons.querySelectorAll('button'))b.addEventListener('click',syncLang);
  more.addEventListener('toggle',()=>{if(more.open)syncLang()});
}
function mobile(){
  const menu=document.querySelector('#uhz-native-head .uhz-app-menu');
  if(!menu||menu.dataset.unifiedV3)return;
  menu.dataset.unifiedV3='1';
  const existingTitle=menu.querySelector('.uhz-menu-heading');
  const existingTheme=menu.querySelector('.uhz-menu-theme');
  const existingLanguage=menu.querySelector('.uhz-menu-language');
  if(!existingTitle||!existingTheme||!existingLanguage)return;
  const wallet=el('div','uhz-v3-mobile-wallet');wallet.id='uhz-v3-mobile-wallet';wallet.hidden=true;
  const title=el('span','uhz-v3-mobile-wallet-title','TU CUENTA');
  const chips=el('div','uhz-v3-mobile-chips');
  for(const [name,href,id] of [
    ['Coins','/coins','uhz-v3-mobile-coins'],
    ['INFT','/criptomoneda/panel','uhz-v3-mobile-inft'],
    ['Plan','/planes','uhz-v3-mobile-plan']]){
    const card=a('',href);card.className='uhz-v3-mobile-chip';card.append(el('span',null,name));
    const val=el('strong',null,'—');val.id=id;card.append(val);chips.append(card);
  }
  wallet.append(title,chips);
  menu.replaceChildren(existingTitle,wallet);
  for(const [heading,links] of [
    ['Principal',[['Inicio','/'],['Aportar contenido','/Aportar_contenido'],['Tienda online','/tienda_online'],['Comunichat','/mi-cuenta?section=comunichat'],['Planes','/planes']]],
    ['Explorar',[['Herramientas','/herramientas'],['Biblioteca','/biblioteca'],['Peticiones','/peticiones'],['Creadores','/creadores'],['INFYNITY','/criptomoneda'],['Estudio Premium','/estudio']]],
    ['Mi cuenta',[['Mi cuenta','/mi-cuenta'],['Mis Coins','/coins'],['Notificaciones','/mi-cuenta?section=notifications']]],
    ['Ayuda',[['Donar','/donar'],['Reportar contenido','/reportar-contenido'],['Centro de ayuda','/centro-de-ayuda'],['Seguridad','/seguridad']]]]){
    menu.append(el('span','uhz-v3-mobile-heading',heading));
    const group=el('div','uhz-v3-mobile-links');
    for(const [name,href] of links)group.append(a(name,href));
    menu.append(group);
  }
  menu.append(el('span','uhz-v3-mobile-heading','Preferencias'),existingTheme,existingLanguage);
  const contact=el('div','uhz-v3-mobile-contact');
  const mail=a('Correo','mailto:univershzrw@gmail.com');
  const whats=a('WhatsApp','https://wa.me/524931431385');
  whats.target='_blank';whats.rel='noopener noreferrer';
  contact.append(mail,whats);menu.append(contact);
  const details=menu.closest('details');
  if(details)details.addEventListener('click',e=>{if(e.target===details&&details.open)details.open=false});
  window.__uhzV3SyncHeader?.();
}
function footer(){
  // One shared public footer. Preserve specialist and legal footers in the DOM
  // for pre-existing verification/cookie handlers and page-specific notices.
  const id='uhz-global-site-footer';
  const legacySelector='footer.uhz-pro-footer,footer.uhz-tools-footer,footer.inft-footer,footer.uhz-global-footer,footer.footer';
  const legacy=[...document.querySelectorAll(legacySelector)].filter(x=>
    x.id!==id&&!x.closest('#'+id)&&!x.closest('article,dialog'));
  const known=()=>document.getElementById(id);
  if(!document.body)return;
  let foot=known();
  if(!foot){
    foot=el('footer','uhz-v4-footer');
    foot.id=id;foot.setAttribute('aria-label','Pie de página UNIVERSHZRW');
    foot.dataset.uhzFooter='v4';
    const top=el('div','uhz-v4-top');
    const brand=el('div','uhz-v4-brand');
    const logo=a('','/');logo.className='uhz-v4-logo';
    logo.setAttribute('aria-label','UNIVERSHZRW, ir al inicio');
    const mark=el('img');mark.src='/_uhz/univershzrw-favicon.svg';
    mark.alt='';mark.width=46;mark.height=46;mark.loading='lazy';
    const wordmark=el('span','uhz-v4-wordmark');
    wordmark.append(el('strong',null,'UNIVERSHZRW'),el('small',null,'DONDE TODO ES POSIBLE'));
    logo.append(mark,wordmark);brand.append(logo);
    brand.append(el('p','uhz-v4-desc','Tecnología, conocimiento y comunidad en un solo lugar.'));
    const cta=el('div','uhz-v4-cta');
    const explore=a('Explorar contenidos','/');explore.className='uhz-v4-cta-primary';
    const contribute=a('Aportar contenido','/Aportar_contenido');contribute.className='uhz-v4-cta-secondary';
    cta.append(explore,contribute);brand.append(cta);
    top.append(brand);
    const cols=[
      ['Explorar',[['Inicio','/'],['Biblioteca','/biblioteca'],['Tienda online','/tienda_online'],['Herramientas','/herramientas'],['Planes','/planes'],['INFYNITY · INFT','/criptomoneda']]],
      ['Participar',[['Comunichat','/mi-cuenta?section=comunichat'],['Peticiones','/peticiones'],['Creadores','/creadores'],['Estudio Premium','/estudio'],['Donar','/donar'],['Mis contenidos','/mis-contenidos']]],
      ['Ayuda y contacto',[['Centro de ayuda','/centro-de-ayuda'],['Preguntas frecuentes','/preguntas-frecuentes'],['Contacto','/contacto'],['Reportar contenido','/reportar-contenido'],['Seguridad','/seguridad'],['Preferencias de cookies','/preferencias-de-cookies']]],
      ['Información legal',[['Términos y condiciones','/terminos-y-condiciones'],['Política de privacidad','/politica-de-privacidad'],['Derechos de autor','/derechos-de-autor'],['Documentación legal','/documentacion-legal'],['Enlaces externos','/enlaces-externos'],['Software y licencias','/software-y-licencias'],['Publicidad','/publicidad']]]
    ];
    for(const [heading,links] of cols){
      const sec=el('section','uhz-v4-col');
      const h=el('h2','uhz-v4-heading',heading);
      const nav=el('nav','uhz-v4-nav');nav.setAttribute('aria-label',heading);
      for(const [name,href]of links)nav.append(a(name,href));
      sec.append(h,nav);top.append(sec);
    }
    foot.append(top);
    const trust=el('div','uhz-v4-trust');
    const note=el('p','uhz-v4-trust-note',
      'Coins: créditos internos · INFYNITY: proyecto en prelanzamiento. Consulta las condiciones antes de utilizar cualquier servicio.');
    const actions=el('div','uhz-v4-actions');
    const verification=el('button','uhz-v4-action','Verificar sitio');
    verification.type='button';
    verification.addEventListener('click',()=>{
      const original=document.getElementById('uhz-footer-verification');
      if(original&&original!==verification){original.click();return}
      location.assign('/seguridad');
    });
    const share=el('button','uhz-v4-action','Compartir');
    share.type='button';share.setAttribute('aria-label','Compartir esta página');
    const announcement=el('span','uhz-v4-status');
    announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');
    share.addEventListener('click',async()=>{
      const page={title:document.title,url:location.href};
      try{
        if(navigator.share){await navigator.share(page);return}
        if(navigator.clipboard?.writeText){
          await navigator.clipboard.writeText(page.url);
          announcement.textContent='Enlace copiado';return;
        }
        announcement.textContent='Copia la dirección desde tu navegador';
      }catch(err){if(err?.name!=='AbortError')announcement.textContent='No se pudo compartir el enlace'}
    });
    const back=el('button','uhz-v4-action','Volver arriba');
    back.type='button';
    back.addEventListener('click',()=>window.scrollTo({
      top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'
    }));
    actions.append(verification,share,back,announcement);
    trust.append(note,actions);foot.append(trust);
    const details=el('details','uhz-v4-context');
    details.id='uhz-v4-context';details.hidden=true;
    const summary=el('summary',null,'Información adicional de esta página');
    const content=el('div','uhz-v4-context-links');content.id='uhz-v4-context-links';
    details.append(summary,content);foot.append(details);
    const base=el('div','uhz-v4-bottom');
    base.append(el('span',null,'© '+new Date().getFullYear()+' UNIVERSHZRW. Todos los derechos reservados.'));
    const statement=el('span',null,'Los derechos de las obras y marcas pertenecen a sus titulares.');
    base.append(statement);foot.append(base);
    const mobileTabs=document.getElementById('uhz-native-tabs');
    if(mobileTabs?.parentElement===document.body)
      document.body.insertBefore(foot,mobileTabs);
    else document.body.append(foot);
    document.documentElement.classList.add('uhz-v4-footer-active');
  }
  // Keep the original elements (and bound event listeners) to avoid breaking
  // existing privacy, report, share and verification integrations.
  for(const old of legacy)old.dataset.uhzLegacyFooter='1';
  const details=foot.querySelector('#uhz-v4-context'),container=foot.querySelector('#uhz-v4-context-links');
  if(details&&container&&legacy.length){
    const canonical=new Set([...foot.querySelectorAll('a[href]')].map(x=>x.href.split('#')[0]));
    const extra=new Map(),notes=new Set();
    for(const old of legacy){
      for(const link of old.querySelectorAll('a[href]')){
        const name=link.textContent.replace(/\s+/g,' ').trim();
        const raw=link.getAttribute('href')||'';
        if(!name||name.length>95||!/^(\/|#|https?:\/\/|mailto:)/i.test(raw))continue;
        const resolved=new URL(raw,location.href);
        if(!/^https?:$|^mailto:$/.test(resolved.protocol))continue;
        const href=resolved.href;
        if(canonical.has(href.split('#')[0])||extra.has(href)||extra.size>=12)continue;
        extra.set(href,name);
      }
      if(old.matches('.inft-footer,.uhz-tools-footer')){
        const text=old.querySelector('small,.uhz-tools-footer-brand p')?.textContent?.replace(/\s+/g,' ').trim();
        if(text&&text.length>12&&text.length<260)notes.add(text);
      }
    }
    const signature=JSON.stringify([[...extra],[...notes]]);
    if(container.dataset.signature!==signature){
      container.replaceChildren();
      for(const note of notes)container.append(el('p','uhz-v4-specific-note',note));
      for(const [href,name] of extra)container.append(a(name,href));
      container.dataset.signature=signature;
    }
    details.hidden=!extra.size&&!notes.size;
  }else if(details){details.hidden=true}
  if(!window.__uhzFooterV4Observer){
    window.__uhzFooterV4Observer=true;
    const observer=new MutationObserver(records=>{
      const newFooter=records.some(record=>[...record.addedNodes].some(n=>
        n.nodeType===1&&n.id!==id&&(
          n.matches?.(legacySelector)||!!n.querySelector?.(legacySelector)
        )
      ));
      if(newFooter)footer();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
}
function init(){header();mobile();footer();window.__uhzV3SyncHeader?.()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('load',init,{once:true});window.addEventListener('pageshow',init);
})();