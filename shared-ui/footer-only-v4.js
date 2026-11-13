/* UNIVERSHZRW footer-only entrypoint v4 · public catalog pages, no header changes.
   Original implementation reuses the USWDS-inspired shared footer. MIT. */
;(()=>{'use strict';
if(window.__uhzFooterOnlyV4||window.__uhzUnifiedShellV2)return;
const q=new URLSearchParams(location.search),path=location.pathname.toLowerCase();
if(top!==self||q.get('embed')==='1'||q.get('_uhz_robot')==='1'||
   /\/(?:robot|archivos)(?:\/|$)/.test(path))return;
window.__uhzFooterOnlyV4=true;
if(!document.getElementById('uhz-unified-shell-v2-css')){
 const style=document.createElement('link');
 style.rel='stylesheet';style.id='uhz-unified-shell-v2-css';
 style.href='/_uhz/shared-header.js?asset=shell-v2&v=footer-20261112-v4';
 document.head.append(style);
}
const p=path;
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x};
const active=href=>{try{const x=new URL(href,location.origin);return x.pathname.toLowerCase()===p&&(!x.search||x.search===location.search)}catch{return false}};
const a=(name,href)=>{const n=el('a',null,name);n.href=href;if(active(href))n.setAttribute('aria-current','page');return n};
function footer(){
  // One shared public footer. Preserve specialist and legal footers in the DOM
  // for pre-existing verification/cookie handlers and page-specific notices.
  const id='uhz-global-site-footer';
  const legacySelector='footer.uhz-pro-footer,footer.uhz-tools-footer,footer.inft-footer,footer.uhz-global-footer,footer.site-foot,footer.footer';
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
      ['Información legal',[['Términos y condiciones','/terminos-y-condiciones'],['Política de privacidad','/politica-de-privacidad'],['Derechos de autor','/derechos-de-autor'],['Documentación legal','/documentacion-legal'],['Enlaces externos','/enlaces-externos'],['Acerca de UNIVERSHZRW','/acerca-de-univershzrw'],['Software y licencias','/software-y-licencias'],['Publicidad','/publicidad']]]
    ];
    const desktopColumns=matchMedia('(min-width:720px)');
    for(const [heading,links] of cols){
      const sec=el('section','uhz-v4-col');
      const collapsible=el('details','uhz-v4-col-toggle');
      collapsible.open=desktopColumns.matches;
      const title=el('summary','uhz-v4-heading',heading);
      title.tabIndex=desktopColumns.matches?-1:0;
      title.setAttribute('aria-disabled',String(desktopColumns.matches));
      collapsible.addEventListener('click',event=>{
        if(desktopColumns.matches&&event.target.closest('summary'))event.preventDefault()
      });
      const nav=el('nav','uhz-v4-nav');nav.setAttribute('aria-label',heading);
      for(const [name,href]of links)nav.append(a(name,href));
      collapsible.append(title,nav);sec.append(collapsible);top.append(sec);
    }
    desktopColumns.addEventListener('change',()=>{
      for(const item of top.querySelectorAll('.uhz-v4-col-toggle')){
        item.open=desktopColumns.matches;
        const summary=item.querySelector('summary');
        summary.tabIndex=desktopColumns.matches?-1:0;
        summary.setAttribute('aria-disabled',String(desktopColumns.matches));
      }
    });
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

function mount(){footer()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.addEventListener('load',mount,{once:true});
window.addEventListener('pageshow',mount);
})();