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
if(!document.getElementById('uhz-brand-theme-css')){
 const style=document.createElement('link');style.rel='stylesheet';style.id='uhz-brand-theme-css';
 style.href='/_uhz/shared-header.js?asset=brand-theme-v1&v=20261112-mint-charcoal';
 document.head.append(style);
}
if(!document.getElementById('uhz-brand-theme-runtime')){
 const script=document.createElement('script');
 script.id='uhz-brand-theme-runtime';
 script.src='/_uhz/shared-header.js?asset=brand-theme-runtime-v1&v=20261112';
 script.defer=true;document.head.append(script);
}
function syncIndependentTheme(){
 let selected='colorful';
 try{selected=localStorage.getItem('uhz_header_theme')==='dark'?'dark':'colorful'}catch{}
 document.documentElement.dataset.uhzTheme=selected;
 document.documentElement.dataset.theme=selected==='dark'?'dark':'light';
 document.documentElement.style.colorScheme=selected==='dark'?'dark':'light';
}
syncIndependentTheme();
window.addEventListener('storage',event=>{if(event.key==='uhz_header_theme')syncIndependentTheme()});
const p=path;
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x};
const active=href=>{try{const x=new URL(href,location.origin);return x.pathname.toLowerCase()===p&&(!x.search||x.search===location.search)}catch{return false}};
const a=(name,href)=>{const n=el('a',null,name);n.href=href;if(active(href))n.setAttribute('aria-current','page');return n};
function footer(){
 if(document.getElementById('uhz-classic-footer-loader'))return;
 const script=document.createElement('script');
 script.id='uhz-classic-footer-loader';
 script.src='/_uhz/shared-header.js?asset=footer-classic-v1&v=20261112';
 script.defer=true;
 document.head.append(script);
}
function mount(){footer()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.addEventListener('load',mount,{once:true});
window.addEventListener('pageshow',mount);
})();