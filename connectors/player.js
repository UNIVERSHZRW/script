(()=>{'use strict';const $=id=>document.getElementById(id),ticket=new URL(location.href).searchParams.get('t');
 const action=(label,url,secondary=false)=>{const a=document.createElement('a');a.textContent=label;a.href=url;a.className='action'+(secondary?' secondary':'');a.rel='noopener noreferrer';$('actions').append(a);return a;};
 function empty(title,text){const box=document.createElement('div');box.className='empty';const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent='↗';symbol.setAttribute('aria-hidden','true');const b=document.createElement('b');b.textContent=title;const p=document.createElement('p');p.textContent=text;box.append(symbol,b,p);$('stage').replaceChildren(box);}
 async function start(){try{
  if(!ticket)throw Error('Abre el contenido desde su ficha de UNIVERSHZRW.');
  const u=new URL('./info',location.href);u.searchParams.set('t',ticket);const r=await fetch(u,{credentials:'same-origin',cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.message||'Vuelve a abrir el contenido desde su ficha.');
  $('title').textContent=d.title||d.name||'Contenido digital';document.title=$('title').textContent+' | UNIVERSHZRW';$('meta').textContent=[d.providerName,d.size?new Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(d.size/1048576)+' MB':null].filter(Boolean).join(' · ');
  if(d.kind==='embed'&&d.embed){const b=document.createElement('button');b.className='action';b.textContent='Abrir vista previa';empty('Vista previa de '+d.providerName,'Consulta el contenido con los permisos establecidos por su autor.');$('stage').firstChild.append(b);b.onclick=()=>{const frame=document.createElement('iframe');frame.src=d.embed;frame.title='Vista previa del contenido';frame.allow='fullscreen; picture-in-picture; encrypted-media';frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-presentation');$('stage').replaceChildren(frame);};}
  else if(d.state==='ready'&&['video','audio','image','pdf'].includes(d.kind)){
   const el=document.createElement(d.kind==='image'?'img':d.kind==='pdf'?'iframe':d.kind);el.src=d.stream;
   if(d.kind==='video'||d.kind==='audio'){
    el.controls=true;el.preload='metadata';el.setAttribute('playsinline','');let renewal=d.renew,nextStream=d.stream,streamTime=Date.now(),renewing=false,recovering=false;
    async function renew(){if(renewing)return;renewing=true;try{const response=await fetch(renewal,{credentials:'same-origin',cache:'no-store'}),fresh=await response.json();if(!response.ok)throw Error(fresh.message||'Vuelve a abrir la ficha.');renewal=fresh.renew;nextStream=fresh.stream||nextStream;for(const a of $('actions').querySelectorAll('a')){if(a.textContent==='Descargar archivo'&&fresh.download)a.href=fresh.download;else if(a.textContent.startsWith('Abrir en '))a.href=fresh.original;}return true;}catch(e){$('status').textContent=e.message;return false;}finally{renewing=false;}}
    function reconnect(){if(recovering||nextStream===el.src)return;recovering=true;const position=el.currentTime,paused=el.paused;el.src=nextStream;streamTime=Date.now();el.addEventListener('loadedmetadata',()=>{el.currentTime=position;recovering=false;if(!paused)el.play().catch(()=>{});},{once:true});}
    el.addEventListener('seeking',()=>{if(Date.now()-streamTime>7*60*1000)reconnect();});
    el.addEventListener('error',async()=>{if(await renew()){reconnect();}else $('status').textContent='El navegador no pudo reproducir este formato. Puedes descargar el archivo.';});
    const interval=setInterval(()=>{if(document.contains(el))void renew();else clearInterval(interval);},6*60*1000);
   }
   if(d.kind==='image')el.alt=d.title||d.name;if(d.kind==='pdf')el.title='Documento PDF';$('stage').replaceChildren(el);
  }else if(d.state==='ready')empty('Archivo listo para descargar',d.name||'Contenido digital');
  else if(d.state==='folder')empty('Carpeta compartida','Abre la carpeta para elegir el archivo que deseas consultar.');
  else empty('Contenido en '+d.providerName,'Abre la fuente para consultar el archivo con sus permisos de acceso.');
  if(d.download)action('Descargar archivo',d.download);action('Abrir en '+d.providerName,d.original,!!d.download);
  $('stage').setAttribute('aria-busy','false');
 }catch(e){$('title').textContent='Acceso al contenido';$('meta').textContent='UNIVERSHZRW';empty('Vuelve a la ficha del recurso',e.message);action('Ir a UNIVERSHZRW','https://univershzrw.com/');$('stage').setAttribute('aria-busy','false');}}
 start();})();
