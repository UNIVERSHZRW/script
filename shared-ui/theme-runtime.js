/* UNIVERSHZRW Brand Themes · runtime v1 (MIT).
   Preserve original theme switch, balances, cookies, auth and page components.
   Some old pages rely on important layered declarations that override theme
   tokens; apply a minimal set of inline surface colors for stable contrast. */
;(()=>{'use strict';
if(window.__uhzBrandThemeRuntime)return;
window.__uhzBrandThemeRuntime=true;
const themes={
 colorful:{
  canvas:'#EFF8F5',surface:'#FFFFFF',soft:'#E2F2ED',ink:'#002941',muted:'#42616F',
  header:'#002941',headerInk:'#CFE8E1',panel:'#08394D',tile:'#10475A',
  menuInk:'#E8FAF7',line:'#447C84',footer:'#002941',footerMuted:'#B2D3CF',
  hero:'#002941',heroInk:'#CFE8E1'
 },
 dark:{
  canvas:'#1C1C1C',surface:'#292929',soft:'#343230',ink:'#EDE6D8',muted:'#C8BFB1',
  header:'#1C1C1C',headerInk:'#EDE6D8',panel:'#292929',tile:'#373431',
  menuInk:'#EDE6D8',line:'#645D53',footer:'#1C1C1C',footerMuted:'#C7BFAF',
  hero:'#292929',heroInk:'#EDE6D8'
 }
};
const root=document.documentElement;
const one=s=>document.querySelector(s);
const all=s=>document.querySelectorAll(s);
function paint(node,vars){
 if(!node)return;
 for(const [prop,val] of Object.entries(vars)){
  if(node.style.getPropertyValue(prop)!==val||node.style.getPropertyPriority(prop)!=='important')
   node.style.setProperty(prop,val,'important');
 }
}
function paintAll(query,vars){for(const node of all(query))paint(node,vars)}
function apply(){
 if(!document.body)return;
 const mode=root.getAttribute('data-uhz-theme')==='dark'?'dark':'colorful';
 const t=themes[mode];
 root.dataset.uhzPalette=mode==='dark'?'charcoal-bone':'mint-navy';
 paint(document.body,{background:t.canvas,color:t.ink});
 paint(one('#uhz-global-header'),{background:t.header,color:t.headerInk,'border-color':t.line});
 paintAll('#uhz-global-header .uhzg-brand,#uhz-global-header .uhzg-brand strong,#uhz-global-header .uhzg-brand small,#uhz-global-header .uhz-v3-nav-link,#uhz-global-header .uhzg-notifications,#uhz-global-header .uhz-v3-more-trigger',{color:t.headerInk});
 paint(one('#uhz-global-header .uhz-v3-more-menu'),{background:t.panel,color:t.menuInk,'border-color':t.line});
 paintAll('#uhz-global-header .uhz-v3-menu-links a,#uhz-global-header .uhz-v3-chip,#uhz-global-header .uhz-v3-theme',{background:t.tile,color:t.menuInk,'border-color':t.line});
 paintAll('#uhz-global-header .uhz-v3-chip-label,#uhz-global-header .uhz-v3-chip-value',{color:t.menuInk});
 paint(one('#uhz-native-head .uhz-app-menu'),{background:t.surface,color:t.ink});
 paint(one('#uhz-native-head .uhz-app-menu .uhz-menu-heading'),{background:t.surface,color:t.ink});
 paintAll('#uhz-native-head .uhz-v3-mobile-links a,#uhz-native-head .uhz-v3-mobile-chip',{background:t.soft,color:t.ink,'border-color':t.line});
 paint(one('#uhz-native-head .uhz-v3-mobile-wallet'),{background:t.soft,'border-color':t.line});
 paint(one('#uhz-global-site-footer'),{background:t.footer,color:t.headerInk,'border-color':t.line});
 paint(one('#uhz-global-site-footer .uhz-v4-bottom'),{background:t.footer,color:t.footerMuted,'border-color':t.line});
 paintAll('#uhz-global-site-footer .uhz-v4-wordmark strong,#uhz-global-site-footer .uhz-v4-heading,#uhz-global-site-footer .uhz-v4-col-toggle summary',{color:t.headerInk});
 paintAll('#uhz-global-site-footer .uhz-v4-nav a,#uhz-global-site-footer .uhz-v4-desc,#uhz-global-site-footer .uhz-v4-trust-note',{color:t.footerMuted});
 paintAll('#uhz-global-site-footer .uhz-v4-action',{background:t.tile,color:t.menuInk,'border-color':t.line});
 paintAll('#uhz-global-site-footer .uhz-v4-cta-primary',{background:mode==='dark'?'#EDE6D8':'#CFE8E1',color:mode==='dark'?'#1C1C1C':'#002941','border-color':mode==='dark'?'#EDE6D8':'#CFE8E1'});
 paintAll('main.uhz-plans,main.studio-main,main.container',{color:t.ink});
 paintAll('.uhz-plans .hero,.hero-shop',{background:t.hero,color:t.heroInk,'border-color':t.line});
 paintAll('.uhz-plans .hero h1,.uhz-plans .hero p,.hero-shop h1,.hero-shop p',{color:t.heroInk});
 paintAll('.uhz-plans .membership,.uhz-plans .account,.uhz-plans .compare,.uhz-plans .content-section .panel',{background:t.surface,color:t.ink,'border-color':t.line});
 paintAll('.uhz-plans .membership h2,.uhz-plans .membership h3,.uhz-plans .content-section h2',{color:t.ink});
 for(const n of all('main .card,main .panel,main .stat-card,main .account-card')){
  if(n.matches('.hero-card')||n.querySelector('img,video,canvas,iframe'))continue;
  paint(n,{background:t.surface,color:t.ink,'border-color':t.line});
 }
 paint(one('.site-head'),{background:t.header,color:t.headerInk});
 document.documentElement.style.setProperty('--uhz-theme-applied',mode);
}
let queued=false;
const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply()})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
window.addEventListener('load',apply,{once:true});
window.addEventListener('pageshow',apply);
window.addEventListener('uhz:theme-change',schedule);
const observer=new MutationObserver(records=>{
 if(records.some(r=>r.type==='attributes'&&r.target===root)||records.some(r=>r.type==='childList'&&[...r.addedNodes].some(n=>n.nodeType===1&&(n.id==='uhz-global-header'||n.id==='uhz-global-site-footer'||n.querySelector?.('#uhz-global-header,#uhz-global-site-footer')))))schedule();
});
observer.observe(root,{attributes:true,attributeFilter:['data-uhz-theme'],childList:true,subtree:true});
})();