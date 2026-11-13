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
const root=document.querySelector('#uhz-global-header'),nav=root?.querySelector('.uhzg-main');
if(!root||!nav||root.dataset.unifiedV2)return;
root.dataset.unifiedV2='1';
const group=el('div','uhz-v2-group');const button=el('button','uhz-v2-trigger','Herramientas');
button.type='button';button.setAttribute('aria-controls','uhz-v2-panel');button.setAttribute('aria-expanded','false');
const panel=el('div','uhz-v2-panel');panel.id='uhz-v2-panel';panel.hidden=true;
const label=el('span','uhz-v2-kicker','SERVICIOS UNIVERSHZRW');panel.append(label);
for(const [name,href] of tools)panel.append(a(name,href));
group.append(button,panel);
const extras=[...nav.querySelectorAll('a.uhzg-link')].filter(x=>['Herramientas','Centro económico','Estudio Premium','Economía y Centro'].includes(x.textContent.trim()));
nav.insertBefore(group,extras[0]||nav.querySelector('select')||null);extras.forEach(x=>x.remove());
const open=v=>{panel.hidden=!v;button.setAttribute('aria-expanded',String(v));group.classList.toggle('is-open',v)};
button.addEventListener('click',()=>open(panel.hidden));
document.addEventListener('pointerdown',e=>{if(!group.contains(e.target))open(false)},true);
group.addEventListener('keydown',e=>{if(e.key==='Escape'){open(false);button.focus();e.preventDefault()}});
group.addEventListener('focusout',e=>{if(!group.contains(e.relatedTarget))open(false)});
if(tools.some(([,href])=>active(href)))group.classList.add('is-current');
const community=[...nav.querySelectorAll('a')].find(x=>/^(comunidad|comunichat)$/i.test(x.textContent.trim()));
if(community){community.textContent='Comunichat';community.href='/mi-cuenta?section=comunichat'}
}
function mobile(){
const menu=document.querySelector('#uhz-native-head .uhz-app-menu');
if(!menu||menu.dataset.unifiedV2)return;menu.dataset.unifiedV2='1';
const disclosure=menu.closest('details');if(disclosure)disclosure.addEventListener('click',e=>{if(e.target===disclosure&&disclosure.open)disclosure.open=false});
const paths=new Set([...menu.querySelectorAll('a')].map(x=>{try{return new URL(x.href).pathname.toLowerCase()}catch{return''}}));
const before=menu.querySelector('.uhz-menu-section-label'),label=el('span','uhz-menu-section-label uhz-v2-mobile-title','Herramientas y servicios');
menu.insertBefore(label,before);
for(const [name,href]of tools){if(paths.has(href.toLowerCase()))continue;const item=a(name,href);item.className='uhz-v2-mobile-link';menu.insertBefore(item,before)}
}
function footer(){
const existing=document.querySelector('footer.uhz-pro-footer'),injected=document.querySelector('#uhz-v2-footer');
if(existing){existing.classList.add('uhz-v2-legal-footer');if(injected)injected.remove();return}
if(injected)return;
if(document.querySelector('script[src*="site-footer.js"]')&&document.readyState!=='complete')return;
const foot=el('footer','uhz-v2-footer');foot.id='uhz-v2-footer';foot.setAttribute('aria-label','Pie de página UNIVERSHZRW');
const inner=el('div','uhz-v2-footer-grid');
const brand=el('div','uhz-v2-brand');const home=a('UNIVERSHZRW','/');home.className='uhz-v2-wordmark';
const icon=el('img');icon.src='/_uhz/univershzrw-favicon.svg';icon.alt='';icon.width=42;icon.height=42;icon.loading='lazy';home.prepend(icon);
brand.append(home,el('p',null,'DONDE TODO ES POSIBLE'),el('span',null,'Conocimiento, tecnología y comunidad, en un solo lugar.'));inner.append(brand);
for(const [heading,links]of sections){const block=el('section','uhz-v2-footer-column'),title=el('h2',null,heading),nav=el('nav');nav.setAttribute('aria-label',heading);for(const [t,h]of links)nav.append(a(t,h));block.append(title,nav);inner.append(block)}
foot.append(inner);const base=el('div','uhz-v2-footer-base'),copy=el('span',null,'© '+new Date().getFullYear()+' UNIVERSHZRW · Todos los derechos reservados.'),notice=el('span',null,'Respeta licencias y derechos de terceros.'),go=el('button',null,'Volver arriba ↑');go.type='button';go.addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));base.append(copy,notice,go);foot.append(base);
const tabs=document.getElementById('uhz-native-tabs');if(tabs?.parentElement===document.body)document.body.insertBefore(foot,tabs);else document.body.append(foot);
}
function init(){header();mobile();footer()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('load',init,{once:true});window.addEventListener('pageshow',init);
})();