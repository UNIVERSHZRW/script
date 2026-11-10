/* UNIVERSHZRW — Herramientas integradas. 100% navegador; sin uploads, APIs o proxy de archivos. */
(()=>{'use strict';
if(window.__UHZ_INLINE_TOOLS_20261109__)return;
window.__UHZ_INLINE_TOOLS_20261109__=true;
const ORIGIN='https://univershzrw.com';
const $=(root,sel)=>root.querySelector(sel);
const trim=s=>String(s||'').trim();
const make=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!=null)el.textContent=txt;return el;};
const setResult=(root,message,kind='')=>{const target=$(root,'.uht-output');if(!target)return;target.replaceChildren();target.className='uht-output'+(kind?' uht-'+kind:'');target.textContent=message;};
function safeURL(raw){if(typeof raw!=='string'||raw.length>2048||/[\u0000-\u001f\\]/.test(raw))throw Error('Pega una dirección HTTPS válida.');const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Solo enlaces HTTPS, sin usuario, contraseña o puerto.');for(const key of [...u.searchParams.keys()])if(/^(utm_.+|fbclid|gclid|igshid|pli)$/i.test(key))u.searchParams.delete(key);return u;}
const hostMatch=(h,base)=>h===base||h.endsWith('.'+base);
function providerInfo(text,kind='auto'){
 const u=safeURL(trim(text)),h=u.hostname.toLowerCase();let name='Sitio externo',preview=u.href,download=null,note='Abre la página original. No se ha comprobado el archivo.';
 if(h==='drive.google.com'){name='Google Drive';const id=u.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)/)?.[1]||(['/open','/uc'].includes(u.pathname)?u.searchParams.get('id'):null);
  if(id&&/^[A-Za-z0-9_-]{10,}$/.test(id)){const rk=u.searchParams.get('resourcekey');preview='https://drive.google.com/file/d/'+id+'/preview'+(rk?'?resourcekey='+encodeURIComponent(rk):'');download='https://drive.google.com/uc?export=download&id='+encodeURIComponent(id)+(rk?'&resourcekey='+encodeURIComponent(rk):'');note='La vista previa y descarga dependen de los permisos y límites de Google.';}}
 else if(h==='docs.google.com'){name='Google Docs';note='Se conserva la URL oficial del documento.';}
 else if(h==='mega.nz'||h==='www.mega.nz'){name='MEGA';const m=u.pathname.match(/^\/(?:file|embed)\/([A-Za-z0-9_-]+)\/?$/);if(m&&/^#[A-Za-z0-9_-]+$/.test(u.hash)){download='https://mega.nz/file/'+m[1]+u.hash;preview=kind==='video'?'https://mega.nz/embed/'+m[1]+u.hash:download;note='La página y el visor pertenecen a MEGA; están sujetos a sus cuotas.';}}
 else if(h==='mediafire.com'||h==='www.mediafire.com')name='MediaFire';
 else if(h==='1drv.ms'||h==='onedrive.live.com'||hostMatch(h,'sharepoint.com'))name='OneDrive / SharePoint';
 else if(h==='dropbox.com'||h==='www.dropbox.com')name='Dropbox';
 else if(['terabox.com','terabox.app','1024tera.com','1024terabox.com'].some(d=>hostMatch(h,d)))name='TeraBox';
 return {name,original:u.href,preview,download,note};
}
async function copyText(s){try{await navigator.clipboard.writeText(s);return true;}catch{return false;}}
function controlRow(label,buttons){const r=make('div','uht-actions');const cap=make('span','uht-muted',label);r.append(cap);for(const [name,value] of buttons){const b=make('button','uht-action',name);b.type='button';b.addEventListener('click',async()=>{if(await copyText(value))cap.textContent='Copiado: '+name;else cap.textContent='No se pudo copiar automáticamente.';});r.append(b);}return r;}
function linkWidget(root,context){root.innerHTML='<div class="uht-fields"><label>URL externa <input class="uht-link-url" type="url" placeholder="https://drive.google.com/file/d/..." maxlength="2048"></label><label>Tipo <select class="uht-link-type"><option value="auto">Automático</option><option value="video">Video</option><option value="other">Otro</option></select></label></div><button type="button" class="uht-primary uht-run">Inspeccionar enlace</button><div class="uht-output" role="status" aria-live="polite"></div>';
 const url=$(root,'.uht-link-url');
 const seed=()=>{if(url.value)return;const inputs=[...context.querySelectorAll('input[type="url"],input[name*="url"],input[id*="url"]')].filter(e=>e!==url);const found=inputs.find(x=>/^https:\/\//.test(x.value));if(found)url.value=found.value;};
 seed();url.addEventListener('focus',seed,{once:true});
 $(root,'.uht-run').addEventListener('click',()=>{try{const item=providerInfo(url.value,$(root,'.uht-link-type').value);setResult(root,item.name+' · Estructura reconocida. Disponibilidad: no verificada. '+item.note,'ok');const out=$(root,'.uht-output');out.append(controlRow('Usar enlace', [['URL limpia',item.original],['Vista previa oficial',item.preview],...(item.download?[['Descarga del proveedor',item.download]]:[])]));}catch(e){setResult(root,e.message,'error')}});
}
function imageWidget(root){
 root.innerHTML='<label>Imagen del dispositivo (JPG, PNG o WebP, hasta 20 MB)<input type="file" accept="image/jpeg,image/png,image/webp" class="uht-file"></label><div class="uht-fields"><label>Ancho máximo <select class="uht-width"><option>640</option><option>960</option><option selected>1280</option><option>1920</option></select></label><label>Formato <select class="uht-format"><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label></div><label>Calidad <input type="range" class="uht-quality" min="45" max="100" value="80"></label><button type="button" class="uht-primary uht-run">Optimizar en el navegador</button><div class="uht-output" role="status" aria-live="polite"></div><a class="uht-download" hidden download>Guardar imagen resultante</a>';
 let previous=null;
 $(root,'.uht-run').addEventListener('click',async()=>{const f=$(root,'.uht-file').files?.[0];try{
 if(!f||!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>20*1048576)throw Error('Selecciona una imagen JPG/PNG/WebP de máximo 20 MB.');
 if(previous){URL.revokeObjectURL(previous);previous=null;}
 const inputURL=URL.createObjectURL(f),image=new Image();try{image.src=inputURL;await image.decode()}finally{URL.revokeObjectURL(inputURL)}
 const factor=Math.min(1,Number($(root,'.uht-width').value)/image.naturalWidth,4096/image.naturalHeight);
 const w=Math.max(1,Math.round(image.naturalWidth*factor)),h=Math.max(1,Math.round(image.naturalHeight*factor));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas no disponible');
 const type=$(root,'.uht-format').value;if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}ctx.drawImage(image,0,0,w,h);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,Number($(root,'.uht-quality').value)/100));if(!blob)throw Error('El navegador no pudo convertir la imagen.');
 previous=URL.createObjectURL(blob);const download=$(root,'.uht-download');download.href=previous;download.download='univershzrw-portada.'+({ 'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[type]);download.hidden=false;
 setResult(root,'Optimizada: '+(f.size/1024).toFixed(0)+' KB → '+(blob.size/1024).toFixed(0)+' KB · '+w+'×'+h+' px. '+(blob.size>=f.size?'Si es mayor, conserva el original.':''),'ok');
 }catch(e){$(root,'.uht-download').hidden=true;setResult(root,e.message,'error')}});
}
function findEditorialInput(context,needles){
 const root=context.closest('.dialog,.modal,[role="dialog"]')||context.closest('form')||document;
 const labels=[...root.querySelectorAll('label')];for(const label of labels){const t=trim(label.textContent).toLowerCase();if(needles.some(x=>t.includes(x))){const id=label.getAttribute('for');const el=(id&&document.getElementById(id))||label.querySelector('input,textarea');if(el)return el.value||'';}}
 for(const selector of (needles.includes('título')?['input[name="title"]','#title']:['textarea[name="summary"]','#summary'])){const item=root.querySelector(selector);if(item)return item.value||'';}
 return '';
}
function seoWidget(root,context){
 root.innerHTML='<label>Título<input class="uht-title" maxlength="300" type="text" placeholder="Título de la ficha"></label><label>Descripción / sinopsis<textarea class="uht-summary" rows="3" maxlength="1200" placeholder="Resumen editorial"></textarea></label><label>Licencia / autorización<input class="uht-license" maxlength="200" type="text" placeholder="Titular o licencia del contenido"></label><button type="button" class="uht-primary uht-run">Evaluar texto editorial</button><div class="uht-output" role="status" aria-live="polite"></div>';
 const seed=()=>{const t=$(root,'.uht-title'),d=$(root,'.uht-summary'),l=$(root,'.uht-license');if(!t.value)t.value=findEditorialInput(context,['título']);if(!d.value)d.value=findEditorialInput(context,['resumen','sinopsis','descripción']);if(!l.value)l.value=findEditorialInput(context,['licencia']);};
 seed();root.addEventListener('focusin',seed,{once:true});
 $(root,'.uht-run').addEventListener('click',()=>{const t=trim($(root,'.uht-title').value),d=trim($(root,'.uht-summary').value),l=trim($(root,'.uht-license').value);const notes=[];
 if(!t)notes.push('Falta el título');else if(t.length<35)notes.push('El título podría ser más descriptivo');else if(t.length>75)notes.push('El título podría recortarse en buscadores');
 if(!d)notes.push('Falta una sinopsis');else if(d.length<70)notes.push('Agrega contexto a la sinopsis');else if(d.length>200)notes.push('La sinopsis es extensa para un resultado breve');
 if(!l)notes.push('Confirma los derechos de uso y la licencia');setResult(root,notes.length?'Revisiones sugeridas: '+notes.join(' · '):'Ficha con elementos editoriales básicos completos. No sustituye revisión de derechos.','ok');});
}
function metaWidget(root){
 root.innerHTML='<label>Código HTML autorizado<textarea class="uht-html" rows="5" maxlength="100000" placeholder="Pega el HTML de la publicación"></textarea></label><button class="uht-primary uht-run" type="button">Leer metadatos localmente</button><div class="uht-output" role="status" aria-live="polite"></div>';
 $(root,'.uht-run').addEventListener('click',()=>{const raw=$(root,'.uht-html').value;if(!trim(raw)){setResult(root,'Pega código HTML para revisar.','error');return}const d=new DOMParser().parseFromString(raw,'text/html');const val=(key,attr)=>d.querySelector('meta['+attr+'="'+key+'"]')?.getAttribute('content')||'Sin dato';
 const lines=[['Título',d.title||'Sin dato'],['Descripción',val('description','name')],['Open Graph',val('og:title','property')],['Imagen social',val('og:image','property')],['Canónica',d.querySelector('link[rel="canonical"]')?.getAttribute('href')||'Sin dato']];
 setResult(root,'Metadatos obtenidos exclusivamente del HTML pegado:','ok');const out=$(root,'.uht-output');for(const [k,v] of lines){const p=make('p');const b=make('strong',null,k+': ');p.append(b,document.createTextNode(String(v).slice(0,420)));out.append(p)}});
}
function loadQR(){
 if(window.QRCode)return Promise.resolve();
 if(window.__uhzQRload)return window.__uhzQRload;
 const src=location.hostname==='admin.univershzrw.com'?'/_uhz/inline-qrcode.js':'/herramientas/qrcode.min.js';
 window.__uhzQRload=new Promise((resolve,reject)=>{const sc=document.createElement('script');sc.src=src;sc.onload=()=>window.QRCode?resolve():reject(Error('Biblioteca QR no disponible'));sc.onerror=()=>reject(Error('No se pudo iniciar el generador QR'));document.head.append(sc)});
 return window.__uhzQRload;
}
function qrWidget(root,publicURL){
 root.innerHTML='<p class="uht-muted">Comparte la página pública del artículo, nunca los datos privados de acceso al archivo.</p><button type="button" class="uht-primary uht-run">Crear QR de esta ficha</button><div class="uht-qr"></div><a class="uht-download" hidden download="univershzrw-ficha.png">Guardar QR (PNG)</a><div class="uht-output" role="status" aria-live="polite"></div>';
 $(root,'.uht-run').addEventListener('click',async()=>{try{await loadQR();const target=$(root,'.uht-qr');target.replaceChildren();new QRCode(target,{text:publicURL,width:208,height:208,colorDark:'#122e51',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});const d=$(root,'.uht-download');const canvas=target.querySelector('canvas'),img=target.querySelector('img');const png=canvas?.width>0?canvas.toDataURL('image/png'):img?.src;if(!png)throw Error('No se pudo generar PNG');d.href=png;d.hidden=false;setResult(root,'Código QR listo para compartir.','ok');}catch(e){setResult(root,e.message,'error')}});
}
const OPTIONS={enlaces:['Inspeccionar URL',linkWidget],imagenes:['Optimizar imagen',imageWidget],seo:['Revisar SEO',seoWidget],meta:['Metadatos HTML',metaWidget]};
function toolbox({id,title,tools,context,insertBefore=null,container}){
 if(document.getElementById(id))return;
 const outer=make('section','uht-shell');outer.id=id;outer.setAttribute('aria-label',title);
 const heading=make('div','uht-heading');heading.append(make('strong',null,title),make('small',null,'Gratis · Se procesa en tu dispositivo'));outer.append(heading);
 const nav=make('div','uht-switch');nav.setAttribute('role','group');nav.setAttribute('aria-label','Seleccionar herramienta');outer.append(nav);
 const body=make('div','uht-body');outer.append(body);
 for(const type of tools){const [label,render]=OPTIONS[type];if(!render)continue;const button=make('button','uht-chip',label);button.type='button';button.dataset.tool=type;const panel=make('div','uht-pane');panel.hidden=true;panel.dataset.tool=type;body.append(panel);nav.append(button);button.addEventListener('click',()=>{const showing=!panel.hidden;for(const e of body.children)e.hidden=true;for(const b of nav.children)b.setAttribute('aria-pressed','false');if(!showing){panel.hidden=false;button.setAttribute('aria-pressed','true');if(!panel.dataset.ready){render(panel,context);panel.dataset.ready='1'}}});}
 if(insertBefore)container.insertBefore(outer,insertBefore);else container.append(outer);
}
function mountContribution(){
 if(!location.pathname.toLowerCase().startsWith('/aportar_contenido'))return;const old=document.getElementById('uhz-tools-contribute');if(old)old.remove();const main=document.querySelector('main#contenido');if(!main||document.getElementById('uhz-contribution-inline'))return;
 const h=main.querySelector('h1');const host=h?.parentElement===main?main:main;toolbox({id:'uhz-contribution-inline',title:'Herramientas para preparar tu aportación',tools:['enlaces','imagenes','seo'],context:main,container:host,insertBefore:h?h.nextSibling:null});
}
function mountArticle(){
 const resourcePath=location.pathname.toLowerCase().startsWith('/recurso/');
 const query=new URLSearchParams(location.search),recordId=query.get('_uhz_ficha');
 const resourceQuery=location.pathname==='/'&&/^[a-f0-9-]{36}$/i.test(recordId||'');
 if(!resourcePath&&!resourceQuery)return;
 document.getElementById('uhz-tools-share')?.remove();
 const main=resourcePath?document.querySelector('main'):document.querySelector('.uhzf-dialog[open],.uhzf-dialog[aria-modal="true"],.uhzf-dialog');
 if(!main||main.querySelector('#uhz-article-inline'))return;
 const articleURL=resourcePath?location.origin+location.pathname:location.origin+'/?_uhz_ficha='+encodeURIComponent(recordId);
 const panel=make('section','uht-shell uht-article');panel.id='uhz-article-inline';
 panel.append(make('strong',null,'Compartir artículo mediante QR'),make('small','uht-muted','Gratis · Generado en tu navegador'));
 const body=make('div','uht-pane');panel.append(body);qrWidget(body,articleURL);
 const heading=main.querySelector('h1,h2');if(heading)heading.insertAdjacentElement('afterend',panel);else main.prepend(panel);
}
function mountAdmin(){
 if(location.hostname!=='admin.univershzrw.com')return;
 document.querySelectorAll('.source-field').forEach(field=>{
  const existing=field.querySelector('.uht-source-embedded');if(existing)return;
  const holder=field.querySelector('[data-uhz-admin-tools="source"]')||make('div','uht-source-embedded');
  if(!holder.isConnected)field.append(holder);
  holder.classList.add('uht-source-embedded');
  toolbox({id:'uht-source-'+Math.random().toString(36).slice(2),title:'Comprobar estructura del enlace',tools:['enlaces'],context:field,container:holder});
 });
 document.querySelectorAll('.editor-tabs').forEach(tabs=>{
  const parent=tabs.parentElement;if(!parent||parent.querySelector('#uht-admin-editor'))return;
  const holder=parent.querySelector('[data-uhz-admin-tools="editor"]')||parent;
  toolbox({id:'uht-admin-editor',title:'Asistente editorial integrado',tools:['seo','imagenes','meta'],context:parent,container:holder,insertBefore:holder===parent?tabs.nextSibling:null});
 });
 document.querySelectorAll('.connector-check').forEach(form=>{
  const parent=form.parentElement;if(!parent||parent.querySelector('#uht-admin-connectors'))return;
  const holder=parent.querySelector('[data-uhz-admin-tools="connectors"]')||parent;
  toolbox({id:'uht-admin-connectors',title:'Inspección local del enlace',tools:['enlaces'],context:form,container:holder,insertBefore:holder===parent?form.nextSibling:null});
 });
 document.querySelectorAll('[data-uhz-admin-tools="catalog"]').forEach(holder=>{
  if(holder.querySelector('#uht-admin-catalog'))return;
  toolbox({id:'uht-admin-catalog',title:'Utilidades de publicaciones',tools:['seo','imagenes','meta'],context:holder.parentElement||holder,container:holder});
 });
}
const run=()=>{try{mountContribution();mountArticle();mountAdmin()}catch(e){console.warn('UNIVERSHZRW tools',e)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;run()})});observer.observe(document.documentElement,{childList:true,subtree:true});window.UHZInlineTools={refresh:run,providerInfo};
})();