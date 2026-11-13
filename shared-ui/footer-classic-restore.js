/* Restore the original UNIVERSHZRW footer from the live site. MIT. */
;(()=>{'use strict';
if(window.__uhzOriginalFooterRestore)return;
if(top!==self||new URLSearchParams(location.search).get('embed')==='1'||/\/(?:robot|archivos|control-sd)(?:\/|$)/.test(location.pathname.toLowerCase()))return;
window.__uhzOriginalFooterRestore=true;
const selector='footer.uhz-pro-footer';
let loading=false,lastTry=0;
function styles(){
 if(!document.getElementById('uhz-original-footer-css')&&![...document.querySelectorAll('link[rel=stylesheet]')].some(l=>(l.href||'').includes('/_uhz/site-footer.css'))){
  const link=document.createElement('link');link.id='uhz-original-footer-css';link.rel='stylesheet';
  link.href='/_uhz/site-footer.css?v=classic-restore-20261112';document.head.append(link);
 }
 if(document.getElementById('uhz-original-footer-guard'))return;
 const s=document.createElement('style');s.id='uhz-original-footer-guard';
 s.textContent=[
 'html.uhz-classic-footer-active body footer.uhz-pro-footer:not([data-uhz-duplicate-footer="1"]){display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:none!important;clear:both!important}',
 'html.uhz-classic-footer-active body footer.uhz-pro-footer[data-uhz-duplicate-footer="1"],',
 'html.uhz-classic-footer-active body footer.uhz-tools-footer,',
 'html.uhz-classic-footer-active body footer.inft-footer,',
 'html.uhz-classic-footer-active body footer.uhz-global-footer,',
 'html.uhz-classic-footer-active body footer.site-foot,',
 'html.uhz-classic-footer-active body footer.footer,',
 'html.uhz-classic-footer-active body #uhz-global-site-footer{display:none!important}',
 'html.uhz-classic-footer-active body footer.uhz-pro-footer :is(a,button):focus-visible{outline:3px solid #83e1f1!important;outline-offset:3px!important}'
 ].join('\n');
 document.head.append(s);
}
function share(footer){
 if(!footer.dataset.uhzImportedFooter||footer.dataset.uhzClassicShareReady)return;
 footer.dataset.uhzClassicShareReady='1';
 const note=document.createElement('span');note.className='uhz-classic-share-status';
 note.setAttribute('role','status');note.setAttribute('aria-live','polite');
 note.style.cssText='display:block;font-size:12px;color:#c9e8f6;margin-top:9px';
 footer.querySelector('.uhz-footer-social')?.append(note);
 const open=url=>window.open(url,'_blank','noopener,noreferrer');
 const copy=async()=>{try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(location.href);note.textContent='Enlace copiado'}
  else note.textContent='Copia la dirección desde la barra del navegador';
 }catch{note.textContent='No se pudo copiar el enlace'}};
 footer.addEventListener('click',event=>{
  const btn=event.target.closest('button.uhz-share-btn');if(!btn)return;
  event.preventDefault();
  const u=encodeURIComponent(location.href);
  if(btn.classList.contains('facebook'))open('https://www.facebook.com/sharer/sharer.php?u='+u);
  else if(btn.classList.contains('whatsapp'))open('https://wa.me/?text='+u);
  else if(btn.classList.contains('x'))open('https://twitter.com/intent/tweet?url='+u);
  else if(btn.classList.contains('instagram')){
    if(navigator.share)void navigator.share({title:document.title,url:location.href}).catch(()=>{});
    else void copy();
  }else if(btn.classList.contains('copy'))void copy();
 });
}
function verificationFallback(footer){
 if(footer.querySelector('#uhz-footer-verification'))return;
 const sec=footer.querySelector('.uhz-footer-social');
 if(!sec)return;
 const a=document.createElement('a');a.className='uhz-footer-verification';a.href='/seguridad';
 a.id='uhz-footer-verification';a.title='Centro de verificación y confianza de UNIVERSHZRW';
 a.setAttribute('aria-label','Consultar verificación y seguridad del sitio');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
 svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
 for(const d of ['M12 2 4 5v7c0 5 3 8 8 10 5-2 8-5 8-10V5z','m8.5 12 2.5 2.6 4.7-5.3']){
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);svg.append(path);
 }
 const text=document.createElement('span');text.textContent='Verificación del sitio';
 a.append(svg,text);sec.append(a);
}
function restore(footer){
 if(!footer||!document.body)return false;
 styles();
 document.getElementById('uhz-global-site-footer')?.remove();
 document.documentElement.classList.remove('uhz-v4-footer-active');
 document.documentElement.classList.add('uhz-classic-footer-active');
 footer.removeAttribute('hidden');
 footer.removeAttribute('data-uhz-legacy-footer');
 footer.removeAttribute('data-uhz-duplicate-footer');
 for(const f of document.querySelectorAll(selector))if(f!==footer)f.dataset.uhzDuplicateFooter='1';
 if(footer.dataset.uhzImportedFooter){
  for(const a of footer.querySelectorAll('a[href="#inputBusqueda"],a[href="#publicaciones"]'))
   a.href='/'+a.getAttribute('href');
 }
 share(footer);footer.dataset.uhzClassicVisible='1';
 return true;
}
async function inject(){
 if(loading||Date.now()-lastTry<6000)return;loading=true;lastTry=Date.now();
 try{
  for(const url of ['/donar','/']){
   const r=await fetch(url,{credentials:'same-origin',cache:'force-cache'});if(!r.ok)continue;
   const doc=new DOMParser().parseFromString(await r.text(),'text/html');
   const source=doc.querySelector(selector);if(!source)continue;
   const present=document.querySelector(selector);if(present){restore(present);return}
   const copy=document.importNode(source,true);copy.dataset.uhzImportedFooter='1';
   copy.querySelectorAll('script,iframe,form').forEach(n=>n.remove());
   copy.querySelectorAll('button.uhz-share-btn').forEach(n=>n.removeAttribute('onclick'));
   copy.querySelector('#uhz-footer-verification')?.remove();
   const dock=document.getElementById('uhz-native-tabs');
   if(dock?.parentElement===document.body)document.body.insertBefore(copy,dock);
   else document.body.append(copy);
   restore(copy);
   setTimeout(()=>{if(copy.isConnected)verificationFallback(copy)},1600);
   return;
  }
 }catch(e){console.warn('Pie original no disponible',e)}
 finally{loading=false}
}
function mount(){
 if(!document.body)return;
 const all=[...document.querySelectorAll(selector)].filter(n=>!n.closest('article,dialog'));
 const existing=all.find(n=>!n.dataset.uhzImportedFooter&&!n.hasAttribute('data-uhz-duplicate-footer'))
   ||all.find(n=>!n.hasAttribute('data-uhz-duplicate-footer'));
 if(existing)restore(existing);
 else void inject();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.addEventListener('load',mount,{once:true});
window.addEventListener('pageshow',mount);
const watcher=new MutationObserver(records=>{
 if(records.some(record=>[...record.addedNodes].some(node=>
  node.nodeType===1&&(node.matches?.(selector)||node.querySelector?.(selector))
  )))mount();
});
watcher.observe(document.documentElement,{childList:true,subtree:true});
})();