// connectors/providers.mjs
var PROVIDERS = Object.freeze([
  { id: "univershzrw", name: "UNIVERSHZRW", mode: "direct", description: "Archivos y reproductor propios" },
  { id: "mediafire", name: "MediaFire", mode: "resolve", description: "Resoluci\xF3n de archivos p\xFAblicos y descarga" },
  { id: "drive", name: "Google Drive", mode: "preview", description: "Vista previa oficial; conserva permisos y clave del recurso" },
  { id: "onedrive", name: "OneDrive / SharePoint", mode: "account", description: "Enlace compartido; reproducci\xF3n directa requiere Microsoft Graph" },
  { id: "mega", name: "MEGA", mode: "account", description: "Enlace cifrado; conserva la clave y abre el proveedor" },
  { id: "terabox", name: "TeraBox", mode: "account", description: "Enlace compartido; reproducci\xF3n directa requiere conexi\xF3n autorizada" },
  { id: "dropbox", name: "Dropbox", mode: "direct", description: "Archivo compartido con representaci\xF3n directa" },
  { id: "youtube", name: "YouTube", mode: "preview", description: "Reproductor oficial para videos con inserci\xF3n permitida" },
  { id: "vimeo", name: "Vimeo", mode: "preview", description: "Reproductor oficial; conserva la clave de videos privados" },
  { id: "direct", name: "Archivo directo autorizado", mode: "direct", description: "Multimedia de los servidores autorizados" }
]);
var TERA = ["terabox.com", "terabox.app", "teraboxapp.com", "1024tera.com", "1024terabox.com", "mirrobox.com", "teraboxlink.com", "teraboxshare.com"];
var matches = (host, base) => host === base || host.endsWith("." + base);
function secureURL(value) {
  if (typeof value !== "string" || value.length > 1500 || /[\s\\\u0000-\u001f\u007f]/u.test(value)) throw Error("Usa una URL HTTPS v\xE1lida, sin espacios.");
  let u;
  try {
    u = new URL(value);
  } catch {
    throw Error("Pega el enlace completo del archivo.");
  }
  if (u.protocol !== "https:" || u.username || u.password || u.port || u.hostname.endsWith(".") || u.hostname.includes("%") || !u.hostname.includes(".") || /^\[|^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) throw Error("El destino del enlace no est\xE1 autorizado.");
  return u;
}
function describeURL(value, expected = "auto") {
  const u = secureURL(value), h = u.hostname;
  let id, folder = false, embed = null;
  if (["univershzrw.com", "www.univershzrw.com"].includes(h)) id = "univershzrw";
  else if (["mediafire.com", "www.mediafire.com"].includes(h)) id = "mediafire";
  else if (["drive.google.com", "docs.google.com"].includes(h)) id = "drive";
  else if (["onedrive.live.com", "1drv.ms"].includes(h) || matches(h, "sharepoint.com")) id = "onedrive";
  else if (["mega.nz", "www.mega.nz", "mega.io"].includes(h)) id = "mega";
  else if (TERA.some((b) => matches(h, b))) id = "terabox";
  else if (["dropbox.com", "www.dropbox.com", "dl.dropboxusercontent.com"].includes(h)) id = "dropbox";
  else if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"].includes(h)) id = "youtube";
  else if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(h)) id = "vimeo";
  else if (h === "interactive-examples.mdn.mozilla.net" || h === "kgqkszlennwhlyngktcc.supabase.co" || h === "kgqkszlennwhlyngktcc.storage.supabase.co") id = "direct";
  else throw Error("Selecciona un proveedor compatible o sube el archivo a UNIVERSHZRW.");
  if (expected !== "auto" && id !== expected) throw Error("El enlace corresponde a " + PROVIDERS.find((p) => p.id === id).name + ". Revisa la plataforma seleccionada.");
  for (const key2 of [...u.searchParams.keys()]) if (/^utm_|^fbclid$|^gclid$/i.test(key2)) u.searchParams.delete(key2);
  if (id === "mediafire") {
    folder = /^\/folder\//.test(u.pathname);
    if (!folder && !/^\/(?:file|file_premium|download)\/[a-z0-9]+(?:\/|$)/i.test(u.pathname) && ![...u.searchParams.keys()].some((x) => /^[a-z0-9]{10,}$/.test(x))) throw Error("Usa el enlace compartido de un archivo de MediaFire.");
  }
  if (id === "drive") {
    folder = /\/folders\//.test(u.pathname);
    let file = u.pathname.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/)?.[1] || u.searchParams.get("id");
    if (!folder && file && /^[a-zA-Z0-9_-]{10,}$/.test(file)) {
      const docs = h === "docs.google.com" && /^\/(document|spreadsheets|presentation)\//.test(u.pathname), base = docs ? "https://docs.google.com/" + u.pathname.split("/")[1] + "/d/" : "https://drive.google.com/file/d/";
      const n = new URL(base + file + (docs ? "/preview" : "/view"));
      const rk = u.searchParams.get("resourcekey");
      if (rk) n.searchParams.set("resourcekey", rk);
      u.href = n.href;
      embed = new URL(base + file + "/preview");
      if (rk) embed.searchParams.set("resourcekey", rk);
      embed = embed.href;
    }
  }
  if (id === "onedrive") folder = /\/:f:\//.test(u.pathname);
  if (id === "mega") folder = /^\/folder\/|^#F!/.test(u.pathname + u.hash);
  if (id === "dropbox") folder = /^\/scl\/fo\//.test(u.pathname);
  if (id === "youtube") {
    const video = h === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") || u.pathname.match(/\/(?:shorts|embed)\/([^/]+)/)?.[1];
    if (!/^[\w-]{11}$/.test(video || "")) throw Error("Usa el enlace de un video de YouTube.");
    u.href = "https://www.youtube.com/watch?v=" + video;
    embed = "https://www.youtube-nocookie.com/embed/" + video;
  }
  if (id === "vimeo") {
    const video = u.pathname.match(/(?:video\/)?(\d{5,})(?:\/([\w]+))?/);
    if (!video) throw Error("Usa el enlace de un video de Vimeo.");
    const v = new URL("https://player.vimeo.com/video/" + video[1]);
    const key2 = u.searchParams.get("h") || video[2];
    if (key2) v.searchParams.set("h", key2);
    embed = v.href;
  }
  const provider = PROVIDERS.find((p) => p.id === id), name = decodeName(u.pathname.split("/").filter(Boolean).at(-1) || provider.name);
  return { provider: id, providerName: provider.name, url: u.href, folder, embed, mode: folder ? "folder" : provider.mode, name, description: folder ? "Carpeta compartida: selecciona un archivo individual para reproducir." : provider.description };
}
function decodeName(x) {
  try {
    return decodeURIComponent(x).slice(0, 200);
  } catch {
    return x.slice(0, 200);
  }
}
function mediaKind(type = "", name = "") {
  type = type.split(";")[0].toLowerCase();
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(type)) return "image";
  if (type === "application/pdf") return "pdf";
  if (!type || type === "application/octet-stream") {
    if (/\.(mp4|webm|m4v|mov)$/i.test(name)) return "video";
    if (/\.(mp3|m4a|wav|ogg|flac)$/i.test(name)) return "audio";
    if (/\.(png|jpe?g|webp|avif|gif)$/i.test(name)) return "image";
    if (/\.pdf$/i.test(name)) return "pdf";
  }
  return "file";
}
function canFetch(h, provider) {
  if (provider === "mediafire") return h === "www.mediafire.com" || h === "mediafire.com" || /^download[0-9]+\.mediafire\.com$/.test(h);
  if (provider === "dropbox") return ["dropbox.com", "www.dropbox.com", "dl.dropboxusercontent.com"].includes(h) || matches(h, "dropboxusercontent.com");
  if (provider === "univershzrw" || provider === "direct") return ["univershzrw.com", "www.univershzrw.com", "interactive-examples.mdn.mozilla.net", "kgqkszlennwhlyngktcc.supabase.co", "kgqkszlennwhlyngktcc.storage.supabase.co"].includes(h);
  return false;
}

// connectors/resolver.mjs
async function limitedText(response, max = 4e5) {
  if (!response.body) return "";
  const reader = response.body.getReader(), parts = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) throw Error("La respuesta del proveedor es demasiado grande.");
      parts.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {
    });
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    bytes.set(p, at);
    at += p.length;
  }
  return new TextDecoder().decode(bytes);
}
async function providerFetch(value, provider, { method = "GET", headers = {}, fetcher = fetch } = {}) {
  let u = secureURL(value);
  for (let i = 0; i < 5; i++) {
    if (!canFetch(u.hostname, provider)) throw Error("El proveedor redirigi\xF3 a un destino no autorizado.");
    const r = await fetcher(u.href, { method, redirect: "manual", headers: { Accept: "*/*", ...headers }, signal: AbortSignal.timeout(12e3) });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      await r.body?.cancel();
      u = secureURL(new URL(r.headers.get("location"), u).href);
      continue;
    }
    return { response: r, url: u.href };
  }
  throw Error("El proveedor devolvi\xF3 demasiadas redirecciones.");
}
var decode = (s) => s.replaceAll("&amp;", "&").replaceAll("&#38;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
function parseMediaFire(html) {
  if (/captcha|cf-chl-|challenge-platform/i.test(html) && !/id=["']downloadButton["']/i.test(html)) return null;
  for (const tag of html.match(/<a\b[^>]*>/gi) || []) {
    if (!/\bid\s*=\s*["']downloadButton["']/i.test(tag)) continue;
    const href = tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (!href) continue;
    const u = secureURL(decode(href));
    if (!/^download[0-9]+\.mediafire\.com$/.test(u.hostname)) throw Error("El destino de descarga no pertenece a MediaFire.");
    return u.href;
  }
  return null;
}
function contentName(response, url, fallback) {
  const d = response.headers.get("content-disposition") || "";
  let name = d.match(/filename\*=UTF-8''([^;]+)/i)?.[1] || d.match(/filename="([^"]+)"/i)?.[1];
  try {
    name = name ? decodeURIComponent(name) : decodeURIComponent(new URL(url).pathname.split("/").pop());
  } catch {
  }
  return (name || fallback || "Archivo").replace(/[\u0000-\u001f]/g, "").slice(0, 200);
}
async function resolveSource(value, { fetcher = fetch } = {}) {
  const info = describeURL(value);
  if (info.folder) return { ...info, state: "folder" };
  if (info.embed) return { ...info, state: "preview", kind: "embed" };
  if (["terabox", "onedrive", "mega"].includes(info.provider)) return { ...info, state: "connection_required", kind: "external" };
  let direct = info.url;
  if (info.provider === "mediafire") {
    const { response: response2 } = await providerFetch(info.url, "mediafire", { fetcher });
    if (!response2.ok) {
      await response2.body?.cancel();
      return { ...info, state: response2.status === 404 || response2.status === 410 ? "unavailable" : "restricted", kind: "external" };
    }
    const html = await limitedText(response2);
    direct = parseMediaFire(html);
    if (!direct) return { ...info, state: "restricted", kind: "external" };
  }
  if (info.provider === "dropbox") {
    const u = new URL(info.url);
    u.searchParams.delete("dl");
    u.searchParams.set("raw", "1");
    direct = u.href;
  }
  const { response, url } = await providerFetch(direct, info.provider, { headers: { Range: "bytes=0-0" }, fetcher });
  const type = response.headers.get("content-type") || "", name = contentName(response, url, info.name), size = Number(response.headers.get("content-range")?.split("/")[1] || response.headers.get("content-length") || 0) || null;
  await response.body?.cancel();
  if (!response.ok) return { ...info, name, state: response.status === 404 || response.status === 410 ? "unavailable" : "restricted", kind: "external" };
  if (/text\/html|application\/(?:xhtml|json)/i.test(type)) return { ...info, name, state: "restricted", kind: "external" };
  return { ...info, name, state: "ready", kind: mediaKind(type, name), direct: url, type, size, range: response.status === 206 || response.headers.get("accept-ranges") === "bytes" };
}

// connectors/tickets.mjs
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function b64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function unb64(s) {
  if (!/^[A-Za-z0-9_-]+$/.test(s) || s.length > 12e3) throw Error("invalid_ticket");
  return Uint8Array.from(atob(s.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
}
async function key(secret2) {
  if (!secret2 || secret2.length < 24) throw Error("media_not_configured");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode("univershzrw-media-capability-v1\0" + secret2));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function seal(payload, secret2, now = Date.now()) {
  const iv = crypto.getRandomValues(new Uint8Array(12)), bytes = encoder.encode(JSON.stringify({ ...payload, v: 1, iat: now, exp: now + 15 * 60 * 1e3 })), encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode("uhz-media-v1") }, await key(secret2), bytes));
  return b64(iv) + "." + b64(encrypted);
}
async function unseal(ticket, secret2, audience, now = Date.now()) {
  try {
    const parts = ticket.split(".");
    if (parts.length !== 2) throw Error();
    const iv = unb64(parts[0]);
    if (iv.length !== 12) throw Error();
    const raw = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: encoder.encode("uhz-media-v1") }, await key(secret2), unb64(parts[1]));
    const data = JSON.parse(decoder.decode(raw));
    if (data.v !== 1 || data.aud !== audience || data.exp <= now || data.iat > now + 3e4 || data.exp - data.iat > 9e5) throw Error();
    return data;
  } catch {
    throw Object.assign(Error("El enlace caduc\xF3. Abre de nuevo el contenido desde su ficha."), { status: 410 });
  }
}

// connectors/player.html
var player_default = '<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Visor de contenido | UNIVERSHZRW</title><link rel="icon" href="https://univershzrw.com/_uhz/univershzrw-favicon.svg"><style>\n:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#090e19;color:#eff4fc}*{box-sizing:border-box}body{margin:0}header,main,footer{max-width:1180px;margin:auto;padding:24px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #243145}a{color:inherit;text-decoration:none}.brand{font-weight:850;letter-spacing:.03em;display:flex;align-items:center;gap:12px}.logo{display:grid;place-items:center;width:36px;height:40px;border:1px solid #698dc8;border-radius:12px;color:#a5c6ff;font-size:25px}.quiet{color:#9daec6;font-size:13px}.tag{font-size:10px;letter-spacing:.14em;color:#9eb8e1;text-transform:uppercase}h1{font-size:clamp(24px,4vw,38px);line-height:1.2;margin:13px 0;overflow-wrap:anywhere}.meta{color:#9daec6;font-size:13px}.stage{border:1px solid #28364e;border-radius:16px;background:#050811;min-height:320px;margin:25px 0;display:grid;place-items:center;overflow:hidden;position:relative}.stage video,.stage iframe{width:100%;height:min(65vh,670px);border:0;display:block}.stage audio{width:min(85%,700px)}.stage img{max-width:100%;max-height:75vh;object-fit:contain}.empty{text-align:center;padding:50px 24px;max-width:560px}.empty b{display:block;font-size:21px;margin:15px 0}.empty p{color:#a5b2c8;line-height:1.7;font-size:14px}.symbol{font-size:45px;color:#93b9f3}.actions{display:flex;gap:12px;flex-wrap:wrap}.action{display:inline-flex;justify-content:center;align-items:center;min-height:46px;padding:12px 20px;border-radius:9px;background:#9ec2ff;color:#111e34;border:1px solid #9ec2ff;font:700 14px system-ui;cursor:pointer}.secondary{background:transparent;color:#c5d4ed;border-color:#374967}.notice{font-size:13px;color:#b0c3df;line-height:1.7}footer{border-top:1px solid #243145;font-size:12px;color:#8b9ab1;margin-top:38px}.sr-only{position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden}@media(max-width:600px){header,main,footer{padding:18px}.stage{min-height:240px;border-radius:11px}.stage video,.stage iframe{height:53vh}.quiet{display:none}.actions a{flex:1}}\n</style><script defer src="./player.js"></script></head><body><header><a class="brand" href="https://univershzrw.com/"><span class="logo">U</span>UNIVERSHZRW</a><span class="quiet">Biblioteca y contenido digital</span></header><main><span class="tag">Visor de contenido</span><h1 id="title">Preparando contenido</h1><p class="meta" id="meta" aria-live="polite">Consultando la fuente\u2026</p><div id="stage" class="stage" aria-busy="true"><div class="empty"><span class="symbol" aria-hidden="true">\u25CC</span><b>Abriendo tu archivo</b></div></div><div class="actions" id="actions"></div><p class="notice" id="status" role="status"></p></main><footer>UNIVERSHZRW \xB7 Donde todo es posible</footer></body></html>\n';

// connectors/player.js
var player_default2 = "(()=>{'use strict';const $=id=>document.getElementById(id),ticket=new URL(location.href).searchParams.get('t');\n const action=(label,url,secondary=false)=>{const a=document.createElement('a');a.textContent=label;a.href=url;a.className='action'+(secondary?' secondary':'');a.rel='noopener noreferrer';$('actions').append(a);return a;};\n function empty(title,text){const box=document.createElement('div');box.className='empty';const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent='\u2197';symbol.setAttribute('aria-hidden','true');const b=document.createElement('b');b.textContent=title;const p=document.createElement('p');p.textContent=text;box.append(symbol,b,p);$('stage').replaceChildren(box);}\n async function start(){try{\n  if(!ticket)throw Error('Abre el contenido desde su ficha de UNIVERSHZRW.');\n  const u=new URL('./info',location.href);u.searchParams.set('t',ticket);const r=await fetch(u,{credentials:'same-origin',cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.message||'Vuelve a abrir el contenido desde su ficha.');\n  $('title').textContent=d.title||d.name||'Contenido digital';document.title=$('title').textContent+' | UNIVERSHZRW';$('meta').textContent=[d.providerName,d.size?new Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(d.size/1048576)+' MB':null].filter(Boolean).join(' \xB7 ');\n  if(d.kind==='embed'&&d.embed){const b=document.createElement('button');b.className='action';b.textContent='Abrir vista previa';empty('Vista previa de '+d.providerName,'Consulta el contenido con los permisos establecidos por su autor.');$('stage').firstChild.append(b);b.onclick=()=>{const frame=document.createElement('iframe');frame.src=d.embed;frame.title='Vista previa del contenido';frame.allow='fullscreen; picture-in-picture; encrypted-media';frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-presentation');$('stage').replaceChildren(frame);};}\n  else if(d.state==='ready'&&['video','audio','image','pdf'].includes(d.kind)){\n   const el=document.createElement(d.kind==='image'?'img':d.kind==='pdf'?'iframe':d.kind);el.src=d.stream;\n   if(d.kind==='video'||d.kind==='audio'){\n    el.controls=true;el.preload='metadata';el.setAttribute('playsinline','');let renewal=d.renew,nextStream=d.stream,streamTime=Date.now(),renewing=false,recovering=false;\n    async function renew(){if(renewing)return;renewing=true;try{const response=await fetch(renewal,{credentials:'same-origin',cache:'no-store'}),fresh=await response.json();if(!response.ok)throw Error(fresh.message||'Vuelve a abrir la ficha.');renewal=fresh.renew;nextStream=fresh.stream||nextStream;for(const a of $('actions').querySelectorAll('a')){if(a.textContent==='Descargar archivo'&&fresh.download)a.href=fresh.download;else if(a.textContent.startsWith('Abrir en '))a.href=fresh.original;}return true;}catch(e){$('status').textContent=e.message;return false;}finally{renewing=false;}}\n    function reconnect(){if(recovering||nextStream===el.src)return;recovering=true;const position=el.currentTime,paused=el.paused;el.src=nextStream;streamTime=Date.now();el.addEventListener('loadedmetadata',()=>{el.currentTime=position;recovering=false;if(!paused)el.play().catch(()=>{});},{once:true});}\n    el.addEventListener('seeking',()=>{if(Date.now()-streamTime>7*60*1000)reconnect();});\n    el.addEventListener('error',async()=>{if(await renew()){reconnect();}else $('status').textContent='El navegador no pudo reproducir este formato. Puedes descargar el archivo.';});\n    const interval=setInterval(()=>{if(document.contains(el))void renew();else clearInterval(interval);},6*60*1000);\n   }\n   if(d.kind==='image')el.alt=d.title||d.name;if(d.kind==='pdf')el.title='Documento PDF';$('stage').replaceChildren(el);\n  }else if(d.state==='ready')empty('Archivo listo para descargar',d.name||'Contenido digital');\n  else if(d.state==='folder')empty('Carpeta compartida','Abre la carpeta para elegir el archivo que deseas consultar.');\n  else empty('Contenido en '+d.providerName,'Abre la fuente para consultar el archivo con sus permisos de acceso.');\n  if(d.download)action('Descargar archivo',d.download);action('Abrir en '+d.providerName,d.original,!!d.download);\n  $('stage').setAttribute('aria-busy','false');\n }catch(e){$('title').textContent='Acceso al contenido';$('meta').textContent='UNIVERSHZRW';empty('Vuelve a la ficha del recurso',e.message);action('Ir a UNIVERSHZRW','https://univershzrw.com/');$('stage').setAttribute('aria-busy','false');}}\n start();})();\n";

// connectors/generated/contribution.txt
var contribution_default = `(()=>{var p=Object.freeze([{id:"univershzrw",name:"UNIVERSHZRW",mode:"direct",description:"Archivos y reproductor propios"},{id:"mediafire",name:"MediaFire",mode:"resolve",description:"Resoluci\\xF3n de archivos p\\xFAblicos y descarga"},{id:"drive",name:"Google Drive",mode:"preview",description:"Vista previa oficial; conserva permisos y clave del recurso"},{id:"onedrive",name:"OneDrive / SharePoint",mode:"account",description:"Enlace compartido; reproducci\\xF3n directa requiere Microsoft Graph"},{id:"mega",name:"MEGA",mode:"account",description:"Enlace cifrado; conserva la clave y abre el proveedor"},{id:"terabox",name:"TeraBox",mode:"account",description:"Enlace compartido; reproducci\\xF3n directa requiere conexi\\xF3n autorizada"},{id:"dropbox",name:"Dropbox",mode:"direct",description:"Archivo compartido con representaci\\xF3n directa"},{id:"youtube",name:"YouTube",mode:"preview",description:"Reproductor oficial para videos con inserci\\xF3n permitida"},{id:"vimeo",name:"Vimeo",mode:"preview",description:"Reproductor oficial; conserva la clave de videos privados"},{id:"direct",name:"Archivo directo autorizado",mode:"direct",description:"Multimedia de los servidores autorizados"}]),g=["terabox.com","terabox.app","teraboxapp.com","1024tera.com","1024terabox.com","mirrobox.com","teraboxlink.com","teraboxshare.com"],h=(r,a)=>r===a||r.endsWith("."+a);function x(r){if(typeof r!="string"||r.length>1500||/[\\s\\\\\\u0000-\\u001f\\u007f]/u.test(r))throw Error("Usa una URL HTTPS v\\xE1lida, sin espacios.");let a;try{a=new URL(r)}catch{throw Error("Pega el enlace completo del archivo.")}if(a.protocol!=="https:"||a.username||a.password||a.port||a.hostname.endsWith(".")||a.hostname.includes("%")||!a.hostname.includes(".")||/^\\[|^\\d+\\.\\d+\\.\\d+\\.\\d+$/.test(a.hostname))throw Error("El destino del enlace no est\\xE1 autorizado.");return a}function v(r,a="auto"){let o=x(r),i=o.hostname,t,c=!1,s=null;if(["univershzrw.com","www.univershzrw.com"].includes(i))t="univershzrw";else if(["mediafire.com","www.mediafire.com"].includes(i))t="mediafire";else if(["drive.google.com","docs.google.com"].includes(i))t="drive";else if(["onedrive.live.com","1drv.ms"].includes(i)||h(i,"sharepoint.com"))t="onedrive";else if(["mega.nz","www.mega.nz","mega.io"].includes(i))t="mega";else if(g.some(e=>h(i,e)))t="terabox";else if(["dropbox.com","www.dropbox.com","dl.dropboxusercontent.com"].includes(i))t="dropbox";else if(["youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtube-nocookie.com"].includes(i))t="youtube";else if(["vimeo.com","www.vimeo.com","player.vimeo.com"].includes(i))t="vimeo";else if(i==="interactive-examples.mdn.mozilla.net"||i==="kgqkszlennwhlyngktcc.supabase.co"||i==="kgqkszlennwhlyngktcc.storage.supabase.co")t="direct";else throw Error("Selecciona un proveedor compatible o sube el archivo a UNIVERSHZRW.");if(a!=="auto"&&t!==a)throw Error("El enlace corresponde a "+p.find(e=>e.id===t).name+". Revisa la plataforma seleccionada.");for(let e of[...o.searchParams.keys()])/^utm_|^fbclid$|^gclid$/i.test(e)&&o.searchParams.delete(e);if(t==="mediafire"&&(c=/^\\/folder\\//.test(o.pathname),!c&&!/^\\/(?:file|file_premium|download)\\/[a-z0-9]+(?:\\/|$)/i.test(o.pathname)&&![...o.searchParams.keys()].some(e=>/^[a-z0-9]{10,}$/.test(e))))throw Error("Usa el enlace compartido de un archivo de MediaFire.");if(t==="drive"){c=/\\/folders\\//.test(o.pathname);let e=o.pathname.match(/\\/(?:file|document|spreadsheets|presentation)\\/d\\/([a-zA-Z0-9_-]+)/)?.[1]||o.searchParams.get("id");if(!c&&e&&/^[a-zA-Z0-9_-]{10,}$/.test(e)){let n=i==="docs.google.com"&&/^\\/(document|spreadsheets|presentation)\\//.test(o.pathname),l=n?"https://docs.google.com/"+o.pathname.split("/")[1]+"/d/":"https://drive.google.com/file/d/",f=new URL(l+e+(n?"/preview":"/view")),u=o.searchParams.get("resourcekey");u&&f.searchParams.set("resourcekey",u),o.href=f.href,s=new URL(l+e+"/preview"),u&&s.searchParams.set("resourcekey",u),s=s.href}}if(t==="onedrive"&&(c=/\\/:f:\\//.test(o.pathname)),t==="mega"&&(c=/^\\/folder\\/|^#F!/.test(o.pathname+o.hash)),t==="dropbox"&&(c=/^\\/scl\\/fo\\//.test(o.pathname)),t==="youtube"){let e=i==="youtu.be"?o.pathname.slice(1):o.searchParams.get("v")||o.pathname.match(/\\/(?:shorts|embed)\\/([^/]+)/)?.[1];if(!/^[\\w-]{11}$/.test(e||""))throw Error("Usa el enlace de un video de YouTube.");o.href="https://www.youtube.com/watch?v="+e,s="https://www.youtube-nocookie.com/embed/"+e}if(t==="vimeo"){let e=o.pathname.match(/(?:video\\/)?(\\d{5,})(?:\\/([\\w]+))?/);if(!e)throw Error("Usa el enlace de un video de Vimeo.");let n=new URL("https://player.vimeo.com/video/"+e[1]),l=o.searchParams.get("h")||e[2];l&&n.searchParams.set("h",l),s=n.href}let m=p.find(e=>e.id===t),d=y(o.pathname.split("/").filter(Boolean).at(-1)||m.name);return{provider:t,providerName:m.name,url:o.href,folder:c,embed:s,mode:c?"folder":m.mode,name:d,description:c?"Carpeta compartida: selecciona un archivo individual para reproducir.":m.description}}function y(r){try{return decodeURIComponent(r).slice(0,200)}catch{return r.slice(0,200)}}var w=new WeakSet;function E(r){if(w.has(r))return;w.add(r);let a="auto",o=document.createElement("div");o.className="uhz-provider-field";let i=document.createElement("label"),t=document.createElement("select"),c=document.createElement("p");i.textContent="Plataforma del archivo",i.style.display="block",i.style.marginBottom="8px",t.setAttribute("aria-label","Plataforma del archivo");let s=document.createElement("option");s.value="auto",s.textContent="Detectar autom\\xE1ticamente",t.append(s);for(let e of p){let n=document.createElement("option");n.value=e.id,n.textContent=e.name,t.append(n)}c.setAttribute("role","status"),c.style.cssText="font-size:12px;line-height:1.6;margin:8px 0 12px;color:inherit;opacity:.85",o.style.cssText="margin:12px 0;max-width:100%",t.style.cssText="width:100%;max-width:100%;min-height:44px;box-sizing:border-box",i.append(t),o.append(i,c),(r.closest("label")||r).before(o);function d(e=!1){if(r.setCustomValidity(""),!r.value.trim())return c.textContent="Pega el enlace compartido del archivo.",!0;try{let n=v(r.value.trim(),a);return c.textContent=n.providerName+" \\xB7 "+n.description,e&&(r.value=n.url),!0}catch(n){return c.textContent=n.message,r.setCustomValidity(n.message),!1}}t.addEventListener("change",()=>{a=t.value,d()}),r.addEventListener("input",()=>d()),r.addEventListener("blur",()=>d(!0)),r.form?.addEventListener("submit",e=>{d(!0)||(e.preventDefault(),e.stopImmediatePropagation(),r.reportValidity())},{capture:!0}),d()}function b(){for(let r of document.querySelectorAll('input[name="source_url"],#ucURL,#convertSource'))E(r)}b();new MutationObserver(b).observe(document.documentElement,{subtree:!0,childList:!0});})();
`;

// connectors/media-service.mjs
var MEDIA_PATH = "/backend/media/";
var publicPath = (req) => new URL(req.url).origin + "/_uhz/portal" + MEDIA_PATH;
var secret = (env) => env.ADMIN_GUARDIAN_TOKEN;
var security = { "cache-control": "private, no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "x-robots-tag": "noindex,nofollow", "cross-origin-resource-policy": "same-origin" };
var json = (body, status = 200, cookies = []) => {
  const h = new Headers({ ...security, "content-type": "application/json; charset=utf-8" });
  for (const c of cookies) h.append("set-cookie", c);
  return new Response(JSON.stringify(body), { status, headers: h });
};
async function mediaLinks(data, { request, env, user }) {
  if (data?.ok !== true || !Array.isArray(data.sources) || !secret(env)) return data;
  const sources = [];
  for (const src of data.sources.slice(0, 6)) {
    try {
      const info = describeURL(src.url);
      const ticket = await seal({ aud: "source", url: info.url, user: user?.id || null, origin: new URL(request.url).origin }, secret(env));
      sources.push({ ...src, url: publicPath(request) + "watch?t=" + encodeURIComponent(ticket), label: info.mode === "account" ? "Consultar en UNIVERSHZRW \xB7 " + info.providerName : "Abrir en UNIVERSHZRW \xB7 " + info.providerName, provider: info.provider, kind: src.kind });
    } catch {
      sources.push(src);
    }
  }
  return { ...data, sources };
}
async function mediaHandler(request, env, { sessionFor: sessionFor2, ownerUser: ownerUser2, trustedWrite: trustedWrite2, limited: limited2, jsonBody: jsonBody2, fetcher = fetch }) {
  const u = new URL(request.url), action = u.pathname.slice(MEDIA_PATH.length), base = publicPath(request);
  try {
    if (action === "providers" && request.method === "GET") return json({ providers: PROVIDERS });
    if (action === "contribution.js" && ["GET", "HEAD"].includes(request.method)) return new Response(request.method === "HEAD" ? null : contribution_default, { headers: { ...security, "content-type": "application/javascript; charset=utf-8", "cache-control": "public,max-age=300" } });
    if (action === "player.js" && ["GET", "HEAD"].includes(request.method)) return new Response(request.method === "HEAD" ? null : player_default2, { headers: { ...security, "content-type": "application/javascript; charset=utf-8", "cache-control": "public,max-age=300" } });
    if (action === "inspect" && request.method === "POST") {
      if (!trustedWrite2(request)) return json({ message: "Origen no permitido." }, 403);
      const s = await sessionFor2(request);
      if (!s.u) return json({ message: "Inicia sesi\xF3n." }, 401);
      if (!ownerUser2(s.u) || s.u.uhz_status?.must_change_password) return json({ message: "Se requiere la cuenta propietaria." }, 403);
      await limited2(env.API_LIMIT, "media-inspect:" + s.u.id);
      const b = await jsonBody2(request, 5e3), info2 = describeURL(b.url, b.provider || "auto");
      const resolved = await resolveSource(info2.url, { fetcher }), ticket = await seal({ aud: "source", url: info2.url, user: s.u.id, origin: u.origin }, secret(env));
      const { direct, url, embed, ...safe } = resolved;
      return json({ ...safe, normalized: info2.url, watch: base + "watch?t=" + encodeURIComponent(ticket) }, 200, s.cookies);
    }
    if (!["GET", "HEAD"].includes(request.method)) return json({ message: "M\xE9todo no permitido." }, 405);
    if (!["watch", "info", "stream", "download", "original"].includes(action)) return json({ message: "Ruta no encontrada." }, 404);
    const cap = await unseal(u.searchParams.get("t") || "", secret(env), ["stream", "download"].includes(action) ? "stream" : "source");
    if (cap.origin !== u.origin) return json({ message: "El enlace no pertenece a este sitio." }, 403);
    let cookies = [];
    if (cap.user) {
      const s = await sessionFor2(request);
      cookies = s.cookies;
      if (!s.u || s.u.id !== cap.user || s.u.uhz_status?.must_change_password) return json({ message: "Inicia sesi\xF3n con la cuenta que abri\xF3 este contenido." }, 401);
    }
    await limited2(env.API_LIMIT, "media:" + action + ":" + (cap.user || request.headers.get("cf-connecting-ip") || "unknown"));
    const info = describeURL(cap.url);
    if (action === "original") {
      const h2 = new Headers({ ...security, location: info.url });
      for (const c of cookies) h2.append("set-cookie", c);
      return new Response(null, { status: 302, headers: h2 });
    }
    if (action === "watch") {
      const nonce = crypto.randomUUID().replaceAll("-", "");
      const h2 = new Headers({ ...security, "content-type": "text/html; charset=utf-8", "x-frame-options": "DENY", "content-security-policy": `default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'nonce-${nonce}'; img-src 'self' https://univershzrw.com; media-src 'self'; frame-src 'self' https://drive.google.com https://docs.google.com https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'` });
      for (const c of cookies) h2.append("set-cookie", c);
      return new Response(request.method === "HEAD" ? null : player_default.replace("<style>", '<style nonce="' + nonce + '">'), { headers: h2 });
    }
    if (action === "info") {
      const resolved = await resolveSource(info.url, { fetcher }), { direct, url, ...safe } = resolved;
      let links = {};
      if (resolved.state === "ready" && direct) {
        const ticket = await seal({ aud: "stream", url: info.url, direct, provider: info.provider, user: cap.user, origin: cap.origin, name: resolved.name, type: resolved.type }, secret(env));
        links = { stream: base + "stream?t=" + encodeURIComponent(ticket), download: base + "download?t=" + encodeURIComponent(ticket) };
      }
      const renewed = await seal({ aud: "source", url: info.url, user: cap.user, origin: cap.origin }, secret(env));
      return json({ ...safe, ...links, renew: base + "info?t=" + encodeURIComponent(renewed), original: base + "original?t=" + encodeURIComponent(renewed) }, 200, cookies);
    }
    if (cap.provider !== info.provider || !canFetch(secureURL(cap.direct).hostname, info.provider)) return json({ message: "Destino no autorizado." }, 403);
    const range = request.headers.get("range");
    if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return json({ message: "Rango de archivo no v\xE1lido." }, 416);
    const { response } = await providerFetch(cap.direct, info.provider, { method: request.method, headers: { ...range ? { Range: range } : {}, ...request.headers.has("if-range") ? { "If-Range": request.headers.get("if-range") } : {} }, fetcher });
    const type = response.headers.get("content-type") || "application/octet-stream";
    if (/text\/html|application\/(?:xhtml|json)/i.test(type)) {
      await response.body?.cancel();
      return json({ message: "El proveedor requiere abrir de nuevo el archivo." }, 409);
    }
    const h = new Headers({ ...security, "content-type": type, "x-frame-options": "SAMEORIGIN", "content-security-policy": "default-src 'none'; sandbox; frame-ancestors 'self'" });
    for (const name of ["content-length", "content-range", "accept-ranges", "etag", "last-modified"]) if (response.headers.has(name)) h.set(name, response.headers.get(name));
    h.set("content-disposition", (action === "download" || !["video", "audio", "image", "application/pdf"].some((p) => type.startsWith(p)) ? "attachment" : "inline") + "; filename*=UTF-8''" + encodeURIComponent(cap.name || "Archivo").replace(/'/g, "%27"));
    for (const c of cookies) h.append("set-cookie", c);
    return new Response(response.body, { status: response.status, headers: h });
  } catch (e) {
    return json({ message: e.status ? e.message : "No se pudo consultar el enlace. Revisa el acceso y vuelve a intentar." }, e.status || 400);
  }
}

// connectors/generated/community-entry.mjs
var ownerIdentityUser = (u) => !!u && String(u.email || "").toLowerCase() === "univershzrw@gmail.com" && u.uhz_status?.role === "superadmin";
var ownerUser = (u) => ownerIdentityUser(u) && !u.uhz_status?.must_change_password;
var HTML = '<!DOCTYPE html><html class="uhz-account-app uhz-signed-out" lang="es" data-uhz-theme="colorful"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="robots" content="noindex,nofollow,noarchive"><title>Mi cuenta | UNIVERSHZRW</title><meta name="description" content="Comunidad privada de UNIVERSHZRW. Preguntas, respuestas y aportaciones para miembros registrados."><link rel="icon" href="https://univershzrw.com/favicon.ico"><link rel="stylesheet" href="/style.css?v=plans-separated-20261102-1"><script src="/app.js?v=plans-separated-20261102-1" defer></script><link rel="stylesheet" href="/upgrade.css?v=participation-social-20261102-2"><script src="/upgrade.js?v=remove-duplicate-home-20261102-1" defer></script><link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMDAgMTAwJz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2JnJyB4MT0nMCUnIHkxPScwJScgeDI9JzEwMCUnIHkyPScxMDAlJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMDgyYTQyJy8+PHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjMGYxNzIxJy8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9J3UnIHgxPScwJScgeTE9JzAlJyB4Mj0nMTAwJScgeTI9JzEwMCUnPjxzdG9wIG9mZnNldD0nMCUnIHN0b3AtY29sb3I9JyM4YmM0ZTgnLz48c3RvcCBvZmZzZXQ9JzEwMCUnIHN0b3AtY29sb3I9JyM1YjhmYjMnLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgcng9JzI0JyBmaWxsPSd1cmwoI2JnKScvPjxlbGxpcHNlIGN4PSc1MCcgY3k9JzUwJyByeD0nMzgnIHJ5PScxNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMTE0ZDczJyBzdHJva2Utd2lkdGg9JzQnIHRyYW5zZm9ybT0ncm90YXRlKC0zNSA1MCA1MCknLz48ZWxsaXBzZSBjeD0nNTAnIGN5PSc1MCcgcng9JzM4JyByeT0nMTQnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzJiODFiMycgc3Ryb2tlLXdpZHRoPScyJyB0cmFuc2Zvcm09J3JvdGF0ZSgzNSA1MCA1MCknLz48cGF0aCBkPSdNMzIsMjggVjU4IEExOCwxOCAwIDAsMCA2OCw1OCBWMjgnIGZpbGw9J25vbmUnIHN0cm9rZT0ndXJsKCN1KScgc3Ryb2tlLXdpZHRoPSc4JyBzdHJva2UtbGluZWNhcD0ncm91bmQnLz48Y2lyY2xlIGN4PSc1MCcgY3k9JzYyJyByPSc2JyBmaWxsPScjMzhiZGY4Jy8+PC9zdmc+"><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script><link rel="stylesheet" href="https://univershzrw.com/_uhz/typography.css?v=participation-social-20261102-2"><link rel="stylesheet" href="https://univershzrw.com/_uhz/shared-header.css?v=participation-social-20261102-2"><script defer src="https://univershzrw.com/_uhz/shared-header.js?v=participation-social-20261102-2"></script></head><body><header class="uhz-page-header"><a class="uhz-page-brand" href="/" aria-label="UNIVERSHZRW, volver al inicio"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMDAgMTAwJz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2JnJyB4MT0nMCUnIHkxPScwJScgeDI9JzEwMCUnIHkyPScxMDAlJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMDgyYTQyJy8+PHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjMGYxNzIxJy8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9J3UnIHgxPScwJScgeTE9JzAlJyB4Mj0nMTAwJScgeTI9JzEwMCUnPjxzdG9wIG9mZnNldD0nMCUnIHN0b3AtY29sb3I9JyM4YmM0ZTgnLz48c3RvcCBvZmZzZXQ9JzEwMCUnIHN0b3AtY29sb3I9JyM1YjhmYjMnLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgcng9JzI0JyBmaWxsPSd1cmwoI2JnKScvPjxlbGxpcHNlIGN4PSc1MCcgY3k9JzUwJyByeD0nMzgnIHJ5PScxNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMTE0ZDczJyBzdHJva2Utd2lkdGg9JzQnIHRyYW5zZm9ybT0ncm90YXRlKC0zNSA1MCA1MCknLz48ZWxsaXBzZSBjeD0nNTAnIGN5PSc1MCcgcng9JzM4JyByeT0nMTQnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzJiODFiMycgc3Ryb2tlLXdpZHRoPScyJyB0cmFuc2Zvcm09J3JvdGF0ZSgzNSA1MCA1MCknLz48cGF0aCBkPSdNMzIsMjggVjU4IEExOCwxOCAwIDAsMCA2OCw1OCBWMjgnIGZpbGw9J25vbmUnIHN0cm9rZT0ndXJsKCN1KScgc3Ryb2tlLXdpZHRoPSc4JyBzdHJva2UtbGluZWNhcD0ncm91bmQnLz48Y2lyY2xlIGN4PSc1MCcgY3k9JzYyJyByPSc2JyBmaWxsPScjMzhiZGY4Jy8+PC9zdmc+" width="43" height="43" alt=""><span><strong>UNIVERSHZRW</strong><small>Donde Todo Es Posible</small></span></a><div class="uhz-page-links"><nav class="uhz-page-auth-nav" aria-label="Acceso a tu cuenta"><a href="/iniciar-sesion">Iniciar sesi\xF3n</a><a href="/registrarse">Crear cuenta</a></nav><a class="uhz-page-home" href="/"><span aria-hidden="true">\u2190</span> Buscador</a></div></header><noscript><p class="uhz-page-noscript">Activa JavaScript para acceder a tu cuenta de UNIVERSHZRW.</p></noscript><div id="uhzAccountLoading" role="status"><span></span>Cargando tu cuenta UNIVERSHZRW\u2026</div>\n<header class="top"><div class="shell"><a href="/" class="brand" aria-label="UNIVERSHZRW Comunidad">UNIVERSHZRW<small>DONDE TODO ES POSIBLE \xB7 COMUNIDAD</small></a><nav class="nav" aria-label="Navegaci\xF3n"><label class="uhz-account-theme-label">Apariencia <select id="uhzAccountThemePicker" class="uhz-account-theme-picker" aria-label="Modo visual de UNIVERSHZRW"><option value="colorful">Colorido</option><option value="classic">Cl\xE1sico</option><option value="dark">Oscuro</option></select></label><a href="https://univershzrw.com/" target="_blank" rel="noopener noreferrer">Sitio principal</a><button data-panel="community" class="member-btn hide">Comunichat</button><button data-panel="contribute" class="member-btn hide">Aportar</button><button data-panel="rights" class="member-btn hide">Reportar derechos</button><button data-panel="shipping" class="member-btn hide">Env\xEDos</button><button data-panel="plus" class="member-btn hide">Premium</button><button data-panel="home" class="member-btn hide">Mi cuenta</button><button data-panel="works" class="member-btn hide">Aportaciones</button><button data-panel="marketplace" class="member-btn hide">Exclusivos</button><button data-panel="coins" class="member-btn hide">Coins</button><button data-panel="feedback" class="member-btn hide">Opiniones</button><button data-panel="favorites" class="member-btn hide">Favoritos</button><button data-panel="moderation" class="member-btn moderator-only hide">Moderaci\xF3n</button><button id="exit" class="member-btn hide">Salir</button></nav></div></header>\n<main class="shell"><div class="uhz-embed-nav" id="uhzEmbedNav"><div class="eyebrow">UNIVERSHZRW \xB7 DONDE TODO ES POSIBLE</div><div class="uhz-embed-title">Comunichat UNIVERSHZRW</div><p class="small">Participa, pregunta y comparte con tu cuenta verificada.</p><div class="uhz-embed-tabs"><button data-panel="community" class="member-btn hide">Comunichat</button><button data-panel="create" class="member-btn hide">Publicar</button><button data-panel="contribute" class="member-btn hide">Aportaciones</button><button data-panel="favorites" class="member-btn hide">Favoritos</button><button data-panel="notifications" class="member-btn hide">Avisos</button><button data-panel="home" class="member-btn hide">Mi cuenta</button><button data-panel="works" class="member-btn hide">Aportaciones</button><button data-panel="marketplace" class="member-btn hide">Exclusivos</button><button data-panel="coins" class="member-btn hide">Coins</button><button data-panel="feedback" class="member-btn hide">Opiniones</button><button data-panel="shipping" class="member-btn hide">Env\xEDos</button><button data-panel="plus" class="member-btn hide">Premium</button><button id="uhzEmbedLogout" class="member-btn hide">Salir</button></div></div>\n<section id="welcome" class="hero"><div><div class="eyebrow">UNIVERSHZRW Comunidad</div><h1>El conocimiento crece <span class="highlight">cuando lo compartimos.</span></h1><p>Aprende, pregunta, responde, aporta y re\xFAne tus recursos favoritos. Un espacio privado para cuentas verificadas, conectado con el ecosistema UNIVERSHZRW.</p><div class="actions"><button class="button" id="goJoin">Crear mi cuenta gratuita</button><a class="button outline" href="https://univershzrw.com/" target="_blank" rel="noopener">Explorar UNIVERSHZRW</a></div><p class="small">Los anuncios, la tienda, los enlaces de salida y las funciones del sitio principal permanecen sin cambios.</p></div><div class="hero-visual" aria-hidden="true"><strong>U</strong><small>COMUNIDAD \u2022 CONOCIMIENTO</small></div></section>\n<section id="intro" class="grid"><div class="feature"><span class="symbol">01</span><h3>Preguntas y respuestas</h3><p>Conversa con miembros verificados. Los textos se almacenan cifrados en la base de datos y no son p\xFAblicos.</p></div><div class="feature"><span class="symbol">02</span><h3>Comparte aportaciones</h3><p>Env\xEDa recursos con un formulario sencillo. La publicaci\xF3n requiere revisi\xF3n y respeto de derechos.</p></div><div class="feature"><span class="symbol">03</span><h3>Tu espacio personal</h3><p>Administra favoritos, avisos y solicitudes. Mant\xE9n tu cuenta bajo control y accede a nuevos beneficios.</p></div></section>\n<section class="auth-panel card" id="authArea" aria-labelledby="authHeading">\n<h2 id="authHeading" tabindex="-1">Iniciar sesi\xF3n</h2><p id="authDescription">Accede con tu cuenta de UNIVERSHZRW.</p>\n<div id="authLogin">\n<form method="post" id="loginForm"><div class="field"><label for="loginEmail">Correo electr\xF3nico</label><input id="loginEmail" name="email" type="email" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false" required maxlength="254"></div><div class="field"><label for="loginPassword">Contrase\xF1a</label><div class="uhz-password-field"><input id="loginPassword" name="password" type="password" autocomplete="current-password" maxlength="128" required><button type="button" class="uhz-password-toggle" data-password="loginPassword" aria-label="Mostrar contrase\xF1a" aria-pressed="false">Mostrar</button></div></div><div id="loginFeedback" class="uhz-auth-feedback hide" role="status" aria-live="polite" tabindex="-1"></div><button class="button" type="submit">Iniciar sesi\xF3n</button></form>\n<button type="button" class="uhz-auth-recover-link" id="showRecover">\xBFOlvidaste tu contrase\xF1a?</button><div class="uhz-auth-divider"><span>\xBFA\xFAn no tienes cuenta?</span></div><button type="button" class="button outline uhz-register-action" id="showRegister">Crear cuenta nueva</button>\n</div>\n<div id="authRegister" class="hide"><form method="post" id="registerForm"><div class="field"><label for="registerName">Nombre visible</label><input id="registerName" name="name" minlength="2" maxlength="48" required autocomplete="nickname"></div><div class="field"><label for="registerEmail">Correo electr\xF3nico</label><input id="registerEmail" name="email" type="email" maxlength="254" required autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false"></div><div class="field"><label for="registerPassword">Contrase\xF1a</label><div class="uhz-password-field"><input id="registerPassword" name="password" type="password" minlength="12" maxlength="128" required autocomplete="new-password" aria-describedby="registerPasswordHelp"><button type="button" class="uhz-password-toggle" data-password="registerPassword" aria-label="Mostrar contrase\xF1a" aria-pressed="false">Mostrar</button></div><span id="registerPasswordHelp" class="small">Usa al menos 12 caracteres, evita claves comunes y no repitas una contrase\xF1a de otro servicio.</span></div><div class="field"><label for="registerConfirm">Confirmar contrase\xF1a</label><input id="registerConfirm" name="password_confirmation" type="password" minlength="12" maxlength="128" required autocomplete="new-password"></div><div class="field uhz-turnstile-box"><label>Verificaci\xF3n de seguridad gratuita</label><div class="cf-turnstile" data-sitekey="0x4AAAAAAFu1h1qVBF3_1SaV" data-action="signup" data-theme="light" data-appearance="interaction-only"></div><p class="small">Confirma que la solicitud no es automatizada antes de crear tu cuenta.</p></div><div class="uhz-honey-field" aria-hidden="true"><label for="registerWebsite">P\xE1gina personal (dejar vac\xEDo)</label><input id="registerWebsite" name="website" type="text" tabindex="-1" autocomplete="off"></div><div id="registerFeedback" class="uhz-auth-feedback hide" role="status" aria-live="polite" tabindex="-1"></div><button class="button" type="submit">Crear cuenta</button><p class="small uhz-register-note">Verifica tu correo para activar tu cuenta y participar.</p></form><button type="button" class="uhz-auth-back" id="backLogin1">Ya tengo cuenta \xB7 Iniciar sesi\xF3n</button></div>\n<div id="authRecover" class="hide"><form method="post" id="recoverForm"><div class="field"><label for="recoverEmail">Correo de tu cuenta</label><input id="recoverEmail" name="email" type="email" maxlength="254" required autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="tu@correo.com"></div><div id="recoverFeedback" class="uhz-auth-feedback hide" role="status" aria-live="polite" tabindex="-1"></div><button class="button" type="submit">Enviar enlace de recuperaci\xF3n</button></form><p class="small uhz-recover-help">Abre el enlace del correo para elegir una contrase\xF1a nueva. Revisa tambi\xE9n la carpeta de spam.</p><button type="button" class="uhz-auth-back" id="backLogin2">Volver a iniciar sesi\xF3n</button></div>\n<div id="authReset" class="hide"><form method="post" id="resetForm"><div class="field"><label for="newPassword">Nueva contrase\xF1a</label><div class="uhz-password-field"><input id="newPassword" name="password" type="password" required minlength="10" maxlength="128" autocomplete="new-password"><button type="button" class="uhz-password-toggle" data-password="newPassword" aria-label="Mostrar contrase\xF1a" aria-pressed="false">Mostrar</button></div></div><div class="field"><label for="newPasswordConfirm">Confirmar nueva contrase\xF1a</label><input id="newPasswordConfirm" name="password_confirmation" type="password" required minlength="10" maxlength="128" autocomplete="new-password"></div><div id="resetFeedback" class="uhz-auth-feedback hide" role="status" aria-live="polite" tabindex="-1"></div><button class="button" type="submit">Guardar nueva contrase\xF1a</button></form></div>\n<div id="authConfirm" class="hide"><p id="callbackMessage" class="uhz-callback-message"></p><div id="callbackFeedback" class="uhz-auth-feedback hide" role="status" aria-live="polite" tabindex="-1"></div><form method="post" id="callbackForm"><button id="verifyCallback" class="button" type="submit">Continuar de forma segura</button></form><button id="callbackRecover" type="button" class="uhz-auth-back">Solicitar otro enlace</button></div>\n</section>\n\n<section id="privateArea" class="hide">\n <div class="hero" data-uhz-style="uhz-inline-0"><div><div class="eyebrow">Mi UNIVERSHZRW</div><h1>Un espacio para <span class="highlight">colaborar.</span></h1><p id="welcomeMember">Bienvenido a UNIVERSHZRW Comunidad.</p><div class="actions"><button class="button" data-panel="create">Hacer una pregunta</button><button class="button outline" data-panel="contribute">Enviar aporte</button><button class="button ghost" data-panel="notifications">Mis avisos</button></div></div><div class="hero-visual" aria-hidden="true"><strong>U</strong><small>MIEMBROS VERIFICADOS</small></div></div>\n <section class="section app-panel" id="panel-community"><header class="uhz-cc-head"><div><span class="uhz-cc-eyebrow">UNIVERSHZRW \xB7 COMUNIDAD PRIVADA</span><h1>Comunichat</h1><p>Publicaciones, preguntas y chat de miembros en un solo espacio. Todo con tu cuenta verificada.</p></div><nav class="uhz-cc-shortcuts" aria-label="Accesos dentro de Comunichat"><a href="#uhz-cc-forum">Conversaciones</a><a href="#panel-chat">Mensajes</a><a href="/comunidad">Publicaciones abiertas \u2197</a></nav></header><div class="uhz-cc-layout"><div class="uhz-cc-forum" id="uhz-cc-forum"><div class="panel-heading"><div><h2>Conversaciones</h2><p>Solo accesibles con una cuenta verificada. No aparecen en buscadores p\xFAblicos.</p></div><button class="button outline" id="reloadThreads">Actualizar</button></div><div class="chips" id="categories"></div><div class="field"><label for="topicSearch">Buscar entre las publicaciones cargadas</label><input id="topicSearch" type="search" placeholder="T\xEDtulo o descripci\xF3n"></div><div class="layout2"><div><div id="threads"></div><button class="button ghost" id="loadMore">Ver m\xE1s publicaciones</button></div></div></div><section id="panel-chat" class="uhz-cc-chat" aria-label="Chat de Comunichat">\n<div class="panel-heading"><div><h2>Mensajes de miembros</h2><p>Ayuda mutua y respuestas entre usuarios con sesi\xF3n activa y verificada. No compartas informaci\xF3n sensible.</p></div><button class="button outline" id="chatRefresh">Actualizar</button></div>\n<div class="card"><div id="chatFeed" class="chatfeed" aria-live="polite"></div>\n<form id="chatForm"><div class="field"><label for="chatText">Escribe tu mensaje</label><textarea id="chatText" maxlength="700" minlength="2" rows="3" required placeholder="Comparte una idea, duda u opini\xF3n con respeto."></textarea></div><button class="button" type="submit">Enviar mensaje</button><p class="small">No compartas datos privados. Texto cifrado y visible solo para miembros autorizados.</p></form></div></section></div></section>\n<section class="section app-panel hide" id="panel-create"><h2>Nueva pregunta</h2><p>Solo los miembros registrados podr\xE1n leerla. El contenido se cifra antes de almacenarse mediante funciones protegidas.</p><div class="card"><form id="threadForm"><div class="field"><label for="threadTitle">\xBFQu\xE9 deseas preguntar?</label><input id="threadTitle" required maxlength="160" minlength="8" placeholder="Escribe un t\xEDtulo claro"></div><div class="field"><label for="threadCategory">Categor\xEDa</label><select id="threadCategory"><option value="general">General</option><option value="ayuda">Ayuda</option><option value="tecnologia">Tecnolog\xEDa</option><option value="educacion">Educaci\xF3n</option><option value="investigacion">Investigaci\xF3n</option><option value="creacion">Creaci\xF3n</option></select></div><div class="field"><label for="threadBody">Describe tu pregunta o idea</label><textarea id="threadBody" required minlength="10" maxlength="10000" rows="7"></textarea></div><div class="field"><label for="threadYoutube">Video de YouTube (opcional)</label><input id="threadYoutube" type="url" placeholder="https://www.youtube.com/watch?v=..."></div><button class="button" type="submit">Publicar en la comunidad</button></form></div></section>\n <section class="section app-panel hide" id="panel-thread"><button class="button ghost" data-panel="community">\u2190 Volver a preguntas</button><div class="card"><span class="pill" id="detailCategory">Comunidad</span><h2 id="detailTitle"></h2><p class="small" id="detailMeta"></p><div class="content" id="detailBody"></div><div class="actions"><button class="button outline" id="saveFavorite">Guardar favorito</button><button class="button ghost" id="reportThread">Reportar contenido</button></div><div id="videoSpot"></div></div><div class="card"><h3>Respuestas</h3><div id="replies"></div><form id="replyForm"><div class="field"><label for="replyBody">Tu respuesta</label><textarea id="replyBody" minlength="2" maxlength="8000" required rows="4"></textarea></div><button class="button" type="submit">Responder</button></form></div></section>\n <section class="section app-panel hide" id="panel-contribute"><h2>Mis aportaciones y publicaciones</h2><p>Consulta tus env\xEDos y el cat\xE1logo real de publicaciones de UNIVERSHZRW. Tambi\xE9n puedes enviar un nuevo aporte para revisi\xF3n.</p><section class="uhz-pub-section"><div class="uhz-pub-head"><h3>Publicaciones de UNIVERSHZRW</h3><button id="uhzPubReload" type="button" class="button ghost">Actualizar cat\xE1logo</button></div><label class="uhz-pub-label">Buscar recurso<input id="uhzPubSearch" type="search" placeholder="T\xEDtulo o categor\xEDa"></label><div id="uhzPubList" class="uhz-pub-grid">Cargando publicaciones\u2026</div></section><div class="card"><form id="contributeForm"><div class="field"><label for="contribTitle">T\xEDtulo del aporte</label><input id="contribTitle" maxlength="160" minlength="8" required placeholder="Nombre del recurso"></div><div class="form-grid"><div class="field"><label for="contribCategory">Categor\xEDa</label><select id="contribCategory"><option value="educacion">Educaci\xF3n</option><option value="tecnologia">Tecnolog\xEDa</option><option value="investigacion">Investigaci\xF3n</option><option value="otros">Otro</option></select></div><div class="field"><label for="contribType">Tipo</label><select id="contribType"><option value="documento">Documento</option><option value="investigacion">Investigaci\xF3n</option><option value="tutorial">Tutorial</option><option value="otro">Otro</option></select></div></div><div class="field"><label for="contribLink">Enlace HTTPS autorizado</label><input id="contribLink" type="url" required placeholder="https://..."></div><div class="field"><label for="contribSummary">\xBFDe qu\xE9 trata?</label><textarea id="contribSummary" minlength="20" maxlength="1800" required rows="4"></textarea></div><div class="field"><label for="contribLicense">Autorizaci\xF3n de uso</label><select id="contribLicense"><option value="propio">Soy titular del contenido</option><option value="abierta">Tiene licencia abierta aplicable</option><option value="permiso">Cuento con permiso verificable</option></select></div><label class="small"><input id="contribRights" type="checkbox" required data-uhz-style="uhz-inline-1"> Confirmo que tengo derechos o autorizaci\xF3n para compartir este material.</label><div class="actions"><button class="button" type="submit">Enviar a revisi\xF3n</button></div></form></div><div class="card"><h3>Mis aportaciones</h3><div id="myContributions"></div><button class="button ghost" id="reloadMyContrib">Actualizar estado</button></div></section>\n <section class="section app-panel hide" id="panel-shipping"><h2>Consulta de env\xEDo</h2><p>Solicita una cotizaci\xF3n por c\xF3digo postal para los productos f\xEDsicos del cat\xE1logo actual.</p><div class="card"><div class="notice">No mostraremos precios de paqueter\xEDa inventados. La tarifa base del producto es informativa; el costo definitivo requiere validaci\xF3n de un transportista.</div><form id="shippingForm"><div class="field"><label for="shipProduct">Producto disponible</label><select id="shipProduct" required><option value="">Cargando cat\xE1logo...</option></select></div><div class="form-grid"><div class="field"><label for="postalCode">C\xF3digo postal (M\xE9xico)</label><input id="postalCode" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" placeholder="99000" required></div><div class="field"><label for="shipQuantity">Cantidad</label><input id="shipQuantity" type="number" min="1" max="10" value="1" required></div></div><button class="button" type="submit">Solicitar cotizaci\xF3n</button></form><div id="shippingResult"></div></div><div class="card"><h3>Tienda UNIVERSHZRW</h3><p>Los anuncios, la tienda y su proceso actual de compra contin\xFAan en el sitio principal, sin modificaciones.</p><a class="button outline" href="https://univershzrw.com/" rel="noopener noreferrer" target="_blank">Ir a la tienda</a></div></section>\n <section class="section app-panel hide" id="panel-plus"><h2>Premium</h2><p>$49 MXN cada 30 d\xEDas. M\xE1s capacidad para organizar y aportar.</p><a class="button" href="/planes">Ver planes y beneficios</a><button id="joinPlus" hidden>Consultar Premium</button><span id="plusStatus" hidden></span></section>\n <section class="section app-panel hide uhz-dashboard-panel" id="panel-home"><h2>Mi cuenta</h2><section class="uhz-account-modules uhz-tool-hub" aria-label="Todas las herramientas"><header class="uhz-account-modules-head"><span class="eyebrow">MI CUENTA \xB7 UNIVERSHZRW</span><h3>Herramientas y accesos</h3><p>Organizamos cada servicio por categor\xEDa. Las etiquetas indican c\xF3mo acceder: gratis, con sesi\xF3n, pagando Coins, mediante una compra o con un plan verificado.</p></header><div class="uhz-tool-hub-groups"><section class="uhz-tool-group"><div class="uhz-tool-group-heading"><div><h4>Cuenta y movimientos</h4><p>Tus datos, historial, saldos, favoritos y avisos.</p></div><span class="uhz-tool-group-count">6 herramientas</span></div><div class="uhz-account-module-grid"><a class="uhz-account-module" href="/perfil"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></span><span class="uhz-account-module-label"><strong>Perfil y avatar</strong><small>Administra tus datos e imagen</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Inicia sesi\xF3n para editar tu perfil</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mis-contenidos"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5h8c1.5 0 2.5.7 3 1.5V20c-.5-.8-1.5-1.5-3-1.5H4z"/><path d="M15 6c.5-.9 1.5-1.5 3-1.5h2V18.5h-2c-1.5 0-2.5.5-3 1.5"/></svg></span><span class="uhz-account-module-label"><strong>Mis contenidos</strong><small>Consulta tus desbloqueos y lecturas</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Con sesi\xF3n \xB7 desbloqueos por Coins</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/coins"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg></span><span class="uhz-account-module-label"><strong>Mis Coins</strong><small>Revisa tu saldo y movimientos</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Saldo e historial con sesi\xF3n</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/economia"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="17" height="14" rx="3"/><path d="M3.5 10h17M16 14h2"/></svg></span><span class="uhz-account-module-label"><strong>Econom\xEDa y recompensas</strong><small>Misiones, tienda y beneficios</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Coins y compras bajo condiciones</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mi-cuenta?section=favorites"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg></span><span class="uhz-account-module-label"><strong>Favoritos</strong><small>Tu biblioteca personal</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Con sesi\xF3n verificada</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mi-cuenta?section=notifications"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4"/></svg></span><span class="uhz-account-module-label"><strong>Mis avisos</strong><small>Notificaciones de tu cuenta</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Con sesi\xF3n verificada</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a></div></section><section class="uhz-tool-group"><div class="uhz-tool-group-heading"><div><h4>Comunidad y aportaciones</h4><p>Participa, pide contenido y comparte recursos.</p></div><span class="uhz-tool-group-count">7 herramientas</span></div><div class="uhz-account-module-grid"><a class="uhz-account-module" href="/mi-cuenta?section=comunichat"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v12H9l-5 4z"/><path d="M8 10h8M8 13h5"/></svg></span><span class="uhz-account-module-label"><strong>Comunichat</strong><small>Conversaciones y mensajes en un solo lugar</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Requiere sesi\xF3n verificada</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mejoras"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m13 3 2 2-3 3-2-2-7 7v4h4l7-7-2-2 3-3 2 2"/><path d="M20 14v6H9"/></svg></span><span class="uhz-account-module-label"><strong>Mejoras y revisiones</strong><small>Solicita o consulta cambios</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Publicaci\xF3n tras revisi\xF3n</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mi-cuenta?section=contribute"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg></span><span class="uhz-account-module-label"><strong>Mis aportaciones</strong><small>Recursos que has compartido</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Con sesi\xF3n verificada</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mi-cuenta?section=feedback"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3 6 7 .8-5 4.8 1.4 7L12 17.2l-6.4 3.4 1.4-7-5-4.8L9 8z"/></svg></span><span class="uhz-account-module-label"><strong>Enviar mi opini\xF3n</strong><small>Comentarios y propuestas</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Con sesi\xF3n verificada</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/comunidad#uhzPublicRequests"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h10l4 4v12H5z M15 4v4h4 M12 11v6 M9 14h6"/></svg></span><span class="uhz-account-module-label"><strong>Peticiones</strong><small>Solicita contenido sin iniciar sesi\xF3n</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Sin iniciar sesi\xF3n</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/Aportar_contenido"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V3 M7 8l5-5 5 5 M4 16v5h16v-5"/></svg></span><span class="uhz-account-module-label"><strong>Publicar recursos</strong><small>Comparte contenido y gana reconocimiento</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Aportaci\xF3n sujeta a revisi\xF3n</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mi-cuenta?section=marketplace"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z"/></svg></span><span class="uhz-account-module-label"><strong>Cat\xE1logo de creadores</strong><small>Explora contenido exclusivo</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-variable">Explorar gratis</span><span class="uhz-tool-condition">Los recursos pueden costar Coins</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a></div></section><section class="uhz-tool-group"><div class="uhz-tool-group-heading"><div><h4>Compras, material y privacidad</h4><p>Tienda, pedidos, materiales exclusivos y seguridad.</p></div><span class="uhz-tool-group-count">4 herramientas</span></div><div class="uhz-account-module-grid"><a class="uhz-account-module" href="/tienda_online"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16l-1 14H5L4 7z M8 8V6a4 4 0 0 1 8 0v2"/></svg></span><span class="uhz-account-module-label"><strong>Tienda online</strong><small>Productos y recursos digitales</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-variable">Explorar gratis</span><span class="uhz-tool-condition">Compras de productos aparte</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mi-cuenta?section=shipping"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4v11l-9 4-9-4z M3 7l9 5 9-5 M12 12v10"/></svg></span><span class="uhz-account-module-label"><strong>Pedidos y entregas</strong><small>Gestiona compras y env\xEDos</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-variable">Con compra</span><span class="uhz-tool-condition">Consulta un pedido registrado</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/mi-cuenta?section=marketplace"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></span><span class="uhz-account-module-label"><strong>Material exclusivo</strong><small>Cat\xE1logo para miembros</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-variable">Seg\xFAn recurso</span><span class="uhz-tool-condition">Coins o acceso autorizado</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><a class="uhz-account-module" href="/seguridad"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z M8 12l3 3 5-5"/></svg></span><span class="uhz-account-module-label"><strong>Seguridad y privacidad</strong><small>Protege tus datos y tu perfil</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-free">Gratis</span><span class="uhz-tool-condition">Con sesi\xF3n para editar datos</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a></div></section><section class="uhz-tool-group"><div class="uhz-tool-group-heading"><div><h4>Membres\xEDas y permisos</h4><p>Precios, beneficios y accesos que requieren autorizaci\xF3n.</p></div><span class="uhz-tool-group-count">2 herramientas</span></div><div class="uhz-account-module-grid"><a class="uhz-account-module" href="/planes"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l4 6-11 12L1 10z M1 10h22 M12 22l-5-12 5-6 5 6z"/></svg></span><span class="uhz-account-module-label"><strong>Planes y ventajas</strong><small>Conoce todas las modalidades</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-variable">Consultar gratis</span><span class="uhz-tool-condition">Gratis $0 / Premium $49 (30 d\xEDas)</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></a><div class="uhz-account-module uhz-restricted" aria-disabled="true" title="Exclusivo de superadministradores"><span class="uhz-module-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3h4l.7 2.5 2 1.1 2.5-.8 2 3.4-1.8 1.8v2.2l1.8 1.8-2 3.4-2.5-.8-2 1.1L14 21h-4l-.7-2.3-2-1.1-2.5.8-2-3.4 1.8-1.8v-2.2L2.8 9l2-3.4 2.5.8 2-1.1z"/><circle cx="12" cy="12" r="3"/></svg></span><span class="uhz-account-module-label"><strong>Administraci\xF3n</strong><small>Bloqueado \xB7 solo superadministradores</small></span><span class="uhz-tool-access"><span class="uhz-tool-tag is-locked">Restringido</span><span class="uhz-tool-condition">Solo superadministraci\xF3n</span></span><span class="uhz-account-module-arrow" aria-hidden="true">\u2197</span></div></div></section></div></section></section><section class="section app-panel hide uhz-profile-panel" id="panel-profile"><div class="uhz-profile-page-title"><a class="uhz-edit-profile-back" href="/mi-cuenta">\u2190 Volver a todas mis herramientas</a><h2>Editar mi perfil</h2><p>Actualiza tu informaci\xF3n p\xFAblica, tus datos de contacto, entregas, constancias y privacidad.</p></div><div class="profile-business"><span class="eyebrow">MI UNIVERSHZRW</span><h3 id="profileTitleUpgrade">Mi perfil</h3><p>Un perfil claro, profesional y con tus aportaciones verificadas.</p></div><div class="profile-stats"><div class="feature"><strong id="profileCoinsCount">\u2014</strong><span>Coins</span></div><div class="feature"><strong id="profileContributionsCount">\u2014</strong><span>Aportes</span></div><div class="feature"><strong id="profileApprovedCount">\u2014</strong><span>Aprobados</span></div></div><div class="layout2"><div class="card"><h3>Datos visibles</h3><form id="profileForm"><div class="field"><label for="profileName">Nombre en la comunidad</label><input id="profileName" minlength="2" maxlength="48" required></div><div class="field"><label for="profileAbout">Descripci\xF3n opcional</label><textarea id="profileAbout" maxlength="600" rows="3"></textarea></div><div class="field"><label for="avatarUpload">Foto de perfil</label><input id="avatarUpload" type="file" accept="image/jpeg,image/png,image/webp"><p class="small">Imagen comprimida a WebP; m\xE1ximo 512 KB. Hasta 3 fotos por cuenta.</p><img id="avatarPreview" alt="Tu imagen de perfil" class="avatar-box hide"></div><button class="button" type="submit">Guardar perfil</button></form></div><div class="card"><h3>Seguridad y privacidad</h3><p class="small">El correo no se muestra p\xFAblicamente. Tu contrase\xF1a no se comparte con la comunidad.</p><p id="memberEmail" class="small"></p><p class="small">Los mensajes de preguntas y respuestas se almacenan cifrados. Solo miembros verificados pueden solicitar su lectura.</p><button class="button ghost" id="profileRecovery">Recuperar o cambiar contrase\xF1a</button></div></div>\n<section class="uhz-private-editor card" id="uhzPrivateEditor" aria-labelledby="uhzPrivateEditorTitle">\n <div class="uhz-private-editor-head">\n  <div><span class="eyebrow">INFORMACI\xD3N DE TU CUENTA</span><h3 id="uhzPrivateEditorTitle">Datos personales y compras</h3>\n  <p>Completa \xFAnicamente los datos que necesites. Esta informaci\xF3n es privada y no aparece en tu perfil p\xFAblico.</p></div>\n  <span class="uhz-private-badge"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg> Datos protegidos</span>\n </div>\n <div class="uhz-private-loading" id="uhzPrivateLoading">La informaci\xF3n privada se consulta solo al iniciar sesi\xF3n.</div>\n <form id="uhzPrivateForm" class="uhz-private-form" autocomplete="on">\n <section class="uhz-profile-group">\n  <div class="uhz-profile-group-title"><span class="uhz-profile-step">01</span><div><h4>Contacto personal</h4><p>Para avisos de compras, soporte y comunicaci\xF3n contigo.</p></div></div>\n  <div class="uhz-private-fields">\n   <div class="field"><label for="uhxp_full_name">Nombre completo</label><input id="uhxp_full_name" name="name" data-private-field="full_name" maxlength="120" autocomplete="name" placeholder="Nombre y apellidos"></div>\n   <div class="field"><label for="uhxp_preferred_name">Nombre preferido</label><input id="uhxp_preferred_name" data-private-field="preferred_name" maxlength="65" placeholder="C\xF3mo prefieres que te llamemos"></div>\n   <div class="field"><label for="uhxp_phone">Tel\xE9fono m\xF3vil</label><input id="uhxp_phone" data-private-field="phone" type="tel" maxlength="18" autocomplete="tel" inputmode="tel" placeholder="N\xFAmero con lada"></div>\n   <div class="field"><label for="uhxp_alternate_phone">Tel\xE9fono alternativo</label><input id="uhxp_alternate_phone" data-private-field="alternate_phone" type="tel" maxlength="18" placeholder="Opcional"></div>\n   <div class="field"><label for="uhxp_contact_email">Correo de contacto para compras</label><input id="uhxp_contact_email" data-private-field="contact_email" type="email" maxlength="254" autocomplete="email" placeholder="correo@ejemplo.com"></div>\n   <div class="field"><label for="uhxp_login_email">Correo de inicio de sesi\xF3n</label><input id="uhxp_login_email" type="email" disabled autocomplete="off"><small>Tu correo de acceso se administra por separado y requiere verificaci\xF3n.</small></div>\n  </div>\n </section>\n <section class="uhz-profile-group">\n  <div class="uhz-profile-group-title"><span class="uhz-profile-step">02</span><div><h4>Direcci\xF3n de entregas y compras</h4><p>Una direcci\xF3n de env\xEDo que podr\xE1s actualizar antes de realizar un pedido.</p></div></div>\n  <div class="uhz-private-fields">\n   <div class="field"><label for="uhxp_shipping_recipient">Nombre de quien recibe</label><input id="uhxp_shipping_recipient" data-private-field="shipping_recipient" maxlength="120" autocomplete="shipping name"></div>\n   <div class="field"><label for="uhxp_shipping_phone">Tel\xE9fono para entrega</label><input id="uhxp_shipping_phone" data-private-field="shipping_phone" type="tel" maxlength="18" autocomplete="shipping tel"></div>\n   <div class="field uhz-wide"><label for="uhxp_shipping_street">Calle o avenida</label><input id="uhxp_shipping_street" data-private-field="shipping_street" maxlength="120" autocomplete="shipping address-line1"></div>\n   <div class="field"><label for="uhxp_shipping_ext">N\xFAmero exterior</label><input id="uhxp_shipping_ext" data-private-field="shipping_ext" maxlength="20"></div>\n   <div class="field"><label for="uhxp_shipping_int">N\xFAmero interior (opcional)</label><input id="uhxp_shipping_int" data-private-field="shipping_int" maxlength="20" autocomplete="shipping address-line2"></div>\n   <div class="field"><label for="uhxp_shipping_neighborhood">Colonia</label><input id="uhxp_shipping_neighborhood" data-private-field="shipping_neighborhood" maxlength="90"></div>\n   <div class="field"><label for="uhxp_shipping_city">Municipio o ciudad</label><input id="uhxp_shipping_city" data-private-field="shipping_city" maxlength="90" autocomplete="shipping address-level2"></div>\n   <div class="field"><label for="uhxp_shipping_state">Estado</label><input id="uhxp_shipping_state" data-private-field="shipping_state" maxlength="90" autocomplete="shipping address-level1"></div>\n   <div class="field"><label for="uhxp_shipping_postal">C\xF3digo postal</label><input id="uhxp_shipping_postal" data-private-field="shipping_postal" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" autocomplete="shipping postal-code" placeholder="5 d\xEDgitos"></div>\n   <div class="field"><label for="uhxp_shipping_country">Pa\xEDs</label><input id="uhxp_shipping_country" data-private-field="shipping_country" maxlength="40" autocomplete="shipping country-name" placeholder="M\xE9xico"></div>\n   <div class="field uhz-wide"><label for="uhxp_shipping_notes">Referencias para la entrega (opcional)</label><textarea id="uhxp_shipping_notes" data-private-field="shipping_notes" maxlength="300" rows="2" placeholder="Indicaciones para encontrar el domicilio"></textarea></div>\n  </div>\n </section>\n <section class="uhz-profile-group">\n  <div class="uhz-profile-group-title"><span class="uhz-profile-step">03</span><div><h4>Informaci\xF3n para constancias DC-3</h4><p>Opcional. Estos datos se utilizan \xFAnicamente cuando solicites un documento que los necesite.</p></div></div>\n  <div class="uhz-private-fields">\n   <div class="field uhz-wide"><label for="uhxp_dc3_full_name">Nombre legal para constancias</label><input id="uhxp_dc3_full_name" data-private-field="dc3_full_name" maxlength="120" placeholder="Como aparece en tus documentos"></div>\n   <div class="field"><label for="uhxp_dc3_position">Puesto u ocupaci\xF3n</label><input id="uhxp_dc3_position" data-private-field="dc3_position" maxlength="95"></div>\n   <div class="field"><label for="uhxp_dc3_company">Empresa o centro de trabajo</label><input id="uhxp_dc3_company" data-private-field="dc3_company" maxlength="160"></div>\n   <div class="field"><label for="uhxp_dc3_curp">CURP <span class="uhz-private-optional">confidencial</span></label><div class="uhz-private-secret"><input id="uhxp_dc3_curp" data-private-sensitive="dc3_curp" type="password" maxlength="18" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="18 caracteres"><button type="button" data-reveal="uhxp_dc3_curp" aria-label="Mostrar u ocultar lo que est\xE1s escribiendo">Mostrar</button></div><small id="uhxp_mask_dc3_curp">No registrada</small><label class="uhz-private-clear"><input type="checkbox" data-clear-private="dc3_curp"> Eliminar CURP guardada</label></div>\n   <div class="field"><label for="uhxp_dc3_rfc">RFC personal <span class="uhz-private-optional">confidencial</span></label><div class="uhz-private-secret"><input id="uhxp_dc3_rfc" data-private-sensitive="dc3_rfc" type="password" maxlength="13" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="12 o 13 caracteres"><button type="button" data-reveal="uhxp_dc3_rfc" aria-label="Mostrar u ocultar lo que est\xE1s escribiendo">Mostrar</button></div><small id="uhxp_mask_dc3_rfc">No registrado</small><label class="uhz-private-clear"><input type="checkbox" data-clear-private="dc3_rfc"> Eliminar RFC guardado</label></div>\n   <div class="field"><label for="uhxp_dc3_company_rfc">RFC de empresa (si aplica)</label><div class="uhz-private-secret"><input id="uhxp_dc3_company_rfc" data-private-sensitive="dc3_company_rfc" type="password" maxlength="13" autocomplete="off" autocapitalize="characters" spellcheck="false"><button type="button" data-reveal="uhxp_dc3_company_rfc">Mostrar</button></div><small id="uhxp_mask_dc3_company_rfc">No registrado</small><label class="uhz-private-clear"><input type="checkbox" data-clear-private="dc3_company_rfc"> Eliminar RFC guardado</label></div>\n  </div>\n  <p class="uhz-private-safety">Los identificadores se guardan cifrados. Al volver a abrir esta p\xE1gina solo ver\xE1s asteriscos y los \xFAltimos cuatro caracteres; nunca se env\xEDan completos a la ficha p\xFAblica. Dejar un campo sensible vac\xEDo mantiene el valor anterior.</p>\n </section>\n <div class="uhz-private-save"><span id="uhxpStatus" role="status" aria-live="polite">Los cambios no se guardan hasta que pulses \xABGuardar datos privados\xBB.</span><button id="uhxpSave" type="submit" class="button">Guardar datos privados</button></div>\n </form>\n</section><div class="card"><h3>Preferencias de comunicaci\xF3n</h3><p class="small">Recibir promociones es opcional. Puedes retirar tu consentimiento en cualquier momento. No se enviar\xE1n campa\xF1as hasta configurar el servicio de correo.</p><div class="field"><label><input type="checkbox" id="marketingOpt" data-uhz-style="uhz-inline-1"> Quiero recibir noticias y promociones de UNIVERSHZRW.</label></div><div class="field"><label><input type="checkbox" id="productOpt" data-uhz-style="uhz-inline-1"> Quiero recibir avisos sobre productos y novedades.</label></div><button class="button outline" id="saveEmailPrefs">Guardar preferencias</button></div></section>\n <section class="section app-panel hide" id="panel-favorites"><h2>Mis favoritos</h2><p>Solo t\xFA puedes consultar tus listas guardadas.</p><div id="favoriteItems"></div><button class="button ghost" id="reloadFavorites">Actualizar favoritos</button></section><section class="section app-panel hide" id="panel-notifications"><h2>Mis avisos</h2><p>Notificaciones de tus aportaciones, respuestas y novedades registradas para tu cuenta.</p><div id="userNotifications"></div><button class="button ghost" id="reloadNotices">Actualizar</button></section>\n <section class="section app-panel hide" id="panel-moderation"><h2>Moderaci\xF3n de la comunidad</h2><p>Acceso exclusivo de administradores verificados. Los reportes requieren revisi\xF3n humana.</p><div id="moderationItems"></div><hr class="hr"><h3>Actividad y reportes de la comunidad</h3><div id="moderationInbox"></div><button class="button ghost" id="reloadInbox">Actualizar bandeja</button><button class="button ghost" id="reloadModeration">Actualizar reportes</button></section>\n<section class="section app-panel hide" id="panel-works">\n<div class="panel-heading"><div><h2>Aportaciones publicadas</h2><p>Valoraciones, comentarios y reportes de recursos autorizados.</p></div><button class="button outline" id="worksRefresh">Actualizar</button></div><h3>Recursos actuales de UNIVERSHZRW</h3><div id="resourceFeed"></div><h3>Aportaciones de miembros</h3><div id="workFeed"></div>\n<p class="notice">Los contadores de descargas solo reflejan descargas verificadas. Robot contin\xFAa controlando la salida hacia enlaces externos.</p></section>\n<section class="section app-panel hide" id="panel-marketplace"><section class="uhz-pub-section"><div class="uhz-pub-head"><div><h3>Cat\xE1logo real de creadores</h3><p>Recursos publicados, organizados por categor\xEDa y etiquetas.</p></div><button id="uhzCreatorReload" type="button" class="button ghost">Actualizar</button></div><div class="uhz-pub-tools"><label>Buscar por t\xEDtulo o creador<input id="uhzCreatorSearch" type="search" placeholder="Buscar contenido"></label><label>Filtrar por etiqueta<input id="uhzCreatorTag" type="search" placeholder="Educaci\xF3n, tecnolog\xEDa\u2026"></label></div><div id="uhzCreatorList" class="uhz-pub-grid">Abre este apartado para consultar los recursos publicados.</div></section>\n<h2>Contenido exclusivo de creadores</h2><p>Prop\xF3n vender recursos originales. Todos los materiales pasan por revisi\xF3n y los cobros permanecen desactivados hasta implementar pagos y entregas seguros.</p>\n<div class="card"><h3>Proponer material exclusivo</h3><form id="exclusiveForm">\n<div class="field"><label for="sellerTitle">T\xEDtulo</label><input id="sellerTitle" minlength="8" maxlength="140" required></div>\n<div class="form-grid"><div class="field"><label for="sellerCategory">Categor\xEDa</label><select id="sellerCategory"><option value="educacion">Educaci\xF3n</option><option value="tecnologia">Tecnolog\xEDa</option><option value="investigacion">Investigaci\xF3n</option><option value="creacion">Creaci\xF3n</option><option value="herramientas">Herramientas</option><option value="otro">Otro</option></select></div><div class="field"><label for="sellerPrice">Precio propuesto (MXN)</label><input id="sellerPrice" type="number" min="25" max="10000" step=".01" required></div></div>\n<div class="field"><label for="sellerDescription">\xBFQu\xE9 hace especial a tu material?</label><textarea id="sellerDescription" minlength="25" maxlength="2000" rows="4" required></textarea></div>\n<div class="field"><label for="sellerYoutube">Avance en YouTube (opcional)</label><input id="sellerYoutube" type="url" placeholder="https://youtube.com/watch?v=..."></div>\n<label class="small"><input id="sellerRights" type="checkbox" required data-uhz-style="uhz-inline-1"> Declaro poseer los derechos comerciales necesarios.</label>\n<div class="actions"><button class="button" type="submit">Enviar a revisi\xF3n</button></div></form></div>\n<div class="grid two"><div class="card"><h3>Mis propuestas</h3><div id="myExclusiveFeed"></div></div><div class="card"><h3>Cat\xE1logo exclusivo</h3><div id="publicExclusiveFeed"></div></div></div></section>\n<section class="section app-panel hide" id="panel-coins">\n<h2>UNIVERSHZRW Coins</h2><p>Recompensas por aportaciones aprobadas y publicadas. Los Coins no son dinero ni tienen conversi\xF3n a pesos.</p>\n<div class="coins-wallet"><div><span class="eyebrow">MI BALANCE</span><div id="coinsBalance" class="coins-number">\u2014</div><span>Coins de fidelidad</span></div><strong>U</strong></div>\n<div class="card"><h3>C\xF3mo ganar</h3><p>Recibes <strong>10 Coins por una aportaci\xF3n leg\xEDtima aprobada y publicada</strong>. Los env\xEDos pendientes, duplicados o rechazados no generan puntos. Los canjes a\xFAn no est\xE1n habilitados.</p></div><h3>Historial de Coins</h3><div id="coinsHistory"></div><h3>Premios</h3><div id="coinsRewards"></div></section>\n<section class="section app-panel hide" id="panel-feedback">\n<h2>Tu opini\xF3n sobre UNIVERSHZRW</h2><p>Haz llegar ideas, opiniones e incidencias de forma privada.</p><div class="card"><form id="feedbackForm"><div class="field"><label for="feedbackKind">Asunto</label><select id="feedbackKind"><option value="opinion">Opini\xF3n</option><option value="idea">Nueva idea</option><option value="sugerencia">Sugerencia</option><option value="problema">Informar un problema</option></select></div><div class="field"><label for="feedbackText">Tu mensaje</label><textarea id="feedbackText" minlength="10" maxlength="2000" rows="5" required></textarea></div><button class="button" type="submit">Enviar opini\xF3n</button></form></div></section>\n<section class="section app-panel hide" id="panel-rights">\n <h2>Reporte de derechos y contenido</h2>\n <p>Formulario reservado a cuentas verificadas. Las reclamaciones requieren informaci\xF3n suficiente y declaraci\xF3n de buena fe. Para titulares de derechos sin cuenta contin\xFAa disponible <a href="mailto:univershzrw@gmail.com?subject=Reclamacion%20de%20derechos%20UNIVERSHZRW">univershzrw@gmail.com</a>.</p>\n <div class="card"><form id="verifiedRightsForm">\n <div class="field"><label for="rightsLegalName">Nombre legal del titular o representante</label><input id="rightsLegalName" type="text" maxlength="250" minlength="3" autocomplete="name" required></div>\n <div class="field"><label for="rightsContactEmail">Correo verificado de contacto</label><input id="rightsContactEmail" type="email" readonly aria-describedby="rightsEmailHelp" required><small id="rightsEmailHelp" class="muted">Se utiliza el correo de tu cuenta.</small></div>\n <div class="field"><label for="rightsPageUrl">URL exacta de UNIVERSHZRW a revisar</label><input id="rightsPageUrl" type="url" placeholder="https://univershzrw.com/..." required pattern="https://.*"></div>\n <div class="field"><label for="rightsMaterialTitle">Nombre del material (opcional)</label><input id="rightsMaterialTitle" maxlength="300" type="text"></div>\n <div class="field"><label for="rightsDescription">Explica qu\xE9 derecho consideras afectado</label><textarea id="rightsDescription" maxlength="5000" minlength="30" rows="6" placeholder="Indica qu\xE9 contenido debe revisarse, por qu\xE9 tienes legitimaci\xF3n y c\xF3mo podemos verificarlo." required></textarea></div>\n <div class="field"><label for="rightsRequestedAction">\xBFQu\xE9 solicitas?</label><select id="rightsRequestedAction"><option value="Solicito revisar y, si procede, retirar el contenido identificado.">Revisi\xF3n o retiro del contenido</option><option value="Solicito revisar y corregir datos incorrectos.">Corregir la informaci\xF3n</option><option value="Solicito verificar la titularidad o licencia del contenido.">Verificar derechos o licencias</option></select></div>\n <div class="field"><label for="rightsEvidence">Prueba documental PDF (opcional, m\xE1ximo 5 MB)</label><input id="rightsEvidence" type="file" accept="application/pdf"></div>\n <div class="field"><label for="rightsSignature">Firma electr\xF3nica simple (tu nombre completo)</label><input id="rightsSignature" type="text" minlength="3" maxlength="250" required></div>\n <label><input id="rightsHonesty" type="checkbox" data-uhz-style="uhz-inline-1" required> Declaro de buena fe que la informaci\xF3n es ver\xEDdica y cuento con legitimaci\xF3n para formular esta solicitud.</label>\n <div class="actions"><button class="button" type="submit" id="submitVerifiedRights">Enviar reporte para revisi\xF3n</button></div>\n </form></div>\n</section><section class="section app-panel hide" id="panel-help"><h2>Ayuda y recuperaci\xF3n</h2><p>El correo verificado ser\xE1 el m\xE9todo principal de recuperaci\xF3n de cuenta. WhatsApp ser\xE1 solo para ayuda; nunca para pedir contrase\xF1as.</p><div class="grid two"><div class="feature"><h3>Correo de ayuda</h3><a href="mailto:univershzrw@gmail.com">univershzrw@gmail.com</a></div><div class="feature"><h3>WhatsApp de soporte</h3><a href="https://wa.me/524931431385" target="_blank" rel="noopener">Abrir WhatsApp</a></div></div><p class="small">La recuperaci\xF3n mediante Telegram requerir\xE1 vincular previamente una cuenta verificada y una confirmaci\xF3n segura. A\xFAn no est\xE1 habilitada.</p></section>\n</section>\n</main><footer class="footer"><div class="shell"><div><strong>UNIVERSHZRW</strong> <small>\xB7 DONDE TODO ES POSIBLE</small><p class="small">Comunidad privada. Los anuncios, tienda, enlaces externos y p\xE1gina Robot originales permanecen en univershzrw.com.</p></div><div><a href="https://univershzrw.com/" target="_blank" rel="noopener">Sitio principal</a> \xB7 <a href="mailto:univershzrw@gmail.com">Contacto</a></div></div></footer><div id="toast" class="float-status hide" role="status" aria-live="polite"></div></body></html>';
var CSS = '\n:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;--bg:#080f1e;--panel:#101c30;--panel2:#15233a;--line:#29405b;--ink:#eaf3fa;--muted:#a1b2c9;--accent:#6dd5e6;--gold:#f3cc89;--success:#78d6b3}\n*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 15% -10%,#133457 0%,transparent 35%),radial-gradient(ellipse at 90% 0%,#1d2443 0%,transparent 32%),var(--bg);color:var(--ink);min-height:100vh}button,input,textarea,select{font:inherit}button{cursor:pointer}a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.shell{max-width:1180px;margin:0 auto;padding:0 22px}.top{border-bottom:1px solid var(--line);background:#081220e5;position:sticky;top:0;z-index:10;backdrop-filter:blur(15px)}.top .shell{display:flex;align-items:center;justify-content:space-between;gap:15px;min-height:76px;flex-wrap:wrap;padding-block:10px}.brand{display:flex;flex-direction:column;letter-spacing:2px;color:var(--ink);font-weight:900;font-size:21px;line-height:1.1}.brand small{color:var(--gold);font-size:10px;font-weight:600;letter-spacing:3px;margin-top:6px}.nav{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.nav button,.nav a{border:1px solid transparent;background:none;color:var(--muted);font-size:12px;padding:10px 11px;border-radius:10px}.nav button:hover,.nav button.active,.nav a:hover{color:var(--ink);background:#1a3047;text-decoration:none}.pill{border:1px solid #37738a;background:#123045;color:var(--accent);padding:6px 11px;border-radius:100px;font-size:12px;font-weight:650}.hero{padding:55px 0 27px;display:grid;grid-template-columns:1.3fr .7fr;gap:28px;align-items:center}.eyebrow{font-size:12px;letter-spacing:3px;color:var(--gold);text-transform:uppercase;font-weight:700}h1{font-size:clamp(33px,4.7vw,64px);line-height:1.06;letter-spacing:-2px;margin:14px 0 17px}h2{font-size:26px;letter-spacing:-.6px;margin:0 0 14px}h3{font-size:17px;margin:0 0 8px}p{line-height:1.65;color:var(--muted)}.hero p{font-size:17px;max-width:650px}.highlight{color:var(--accent)}.hero-visual{min-height:250px;border:1px solid #30516b;border-radius:26px;background:linear-gradient(135deg,#172d4b,#11182f 70%);position:relative;overflow:hidden;display:flex;justify-content:center;align-items:center;box-shadow:0 25px 70px #0006}.hero-visual:after{content:"";position:absolute;width:240px;height:240px;border:1px solid #56bed466;border-radius:50%;box-shadow:0 0 0 30px #61d6e509,0 0 0 60px #61d6e504}.hero-visual strong{font-size:70px;color:var(--accent);z-index:1;text-shadow:0 0 55px #4dd9e866}.hero-visual small{position:absolute;bottom:30px;font-size:12px;letter-spacing:3px;color:var(--gold);z-index:1}.card{background:linear-gradient(135deg,#132238,#0d1829);border:1px solid var(--line);border-radius:20px;padding:25px;margin:17px 0;box-shadow:0 10px 40px #0002}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.feature{padding:22px;background:#111e32;border:1px solid #29405b;border-radius:17px}.feature .symbol{display:inline-block;color:var(--accent);border:1px solid #36738a;border-radius:10px;padding:7px 11px;margin-bottom:15px}.button{border:1px solid #4a9fac;border-radius:12px;padding:12px 17px;color:#082032;background:var(--accent);font-size:14px;font-weight:800;transition:transform .15s}.button:hover{transform:translateY(-1px);filter:brightness(1.1)}.button.outline{background:transparent;color:var(--accent);border-color:#478398}.button.ghost{background:#182d44;color:var(--ink);border-color:#314962}.button:disabled{opacity:.45;cursor:not-allowed;transform:none}.actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:23px}.muted{color:var(--muted)}.small{font-size:12px}.subtle{font-size:12px;color:#a5b7ca}.notice{border:1px solid #80662d;background:#342a15;color:#f6db9b;padding:12px 15px;border-radius:12px;margin:12px 0;font-size:13px}.success{border:1px solid #3b786e;background:#183a37;color:#b9f1e4}.field{display:flex;flex-direction:column;gap:7px;margin:14px 0}.field label{font-size:13px;font-weight:750;color:#d3e5f2}input,textarea,select{width:100%;padding:12px 13px;border:1px solid #3d5571;border-radius:10px;background:#0b1628;color:var(--ink);outline:none}textarea{resize:vertical;min-height:110px}input::placeholder,textarea::placeholder{color:#7c90ab}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.auth-panel{max-width:580px;margin:20px auto 40px}.hide{display:none!important}.section{padding:20px 0 40px}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:15px}.post{border:1px solid #2d455e;background:#112137;padding:20px;border-radius:17px;margin:12px 0;transition:border-color .2s}.post:hover{border-color:#68b4c7}.post h3{margin:7px 0}.post button{background:none;border:none;color:var(--accent);padding:0;font-weight:700}.post .meta{display:flex;gap:9px;flex-wrap:wrap;align-items:center;color:#b3c5d8;font-size:12px}.chips{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.chip{background:#172b45;border:1px solid #31516d;color:#cad8e5;padding:7px 11px;border-radius:100px;font-size:12px;cursor:pointer}.chip.selected{background:#20536a;color:#eaffff;border-color:var(--accent)}.answer{border-left:3px solid #406a83;background:#121f32;padding:14px;margin:13px 0;border-radius:0 12px 12px 0;white-space:pre-wrap}.accepted{border-color:var(--success)}.content{white-space:pre-wrap;overflow-wrap:anywhere;color:#d9e5f2;line-height:1.7}.token{color:var(--gold);font-size:12px}.footer{border-top:1px solid var(--line);padding:25px 0 40px;margin-top:45px}.footer .shell{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.footer small{color:#8299b2}.layout2{display:grid;grid-template-columns:1.35fr .65fr;gap:20px}.stat{font-size:26px;font-weight:800;color:var(--accent)}.float-status{position:fixed;bottom:24px;right:24px;max-width:min(500px,calc(100vw - 35px));z-index:40;background:#132c37;border:1px solid #478594;padding:15px 18px;border-radius:14px;color:#d9f6f4;box-shadow:0 15px 50px #0008;white-space:pre-wrap}.float-status.error{background:#412329;border-color:#a35060;color:#ffe8eb}.locked{border:1px dashed #47718a;border-radius:13px;padding:17px;background:#142135}.dimmed{opacity:.74}code{font-family:ui-monospace,monospace;background:#20334b;padding:3px 6px;border-radius:6px}.hr{border:0;border-top:1px solid var(--line);margin:22px 0} .mobile-only{display:none}\n@media(max-width:870px){.hero,.layout2{grid-template-columns:1fr}.grid{grid-template-columns:1fr 1fr}.hero-visual{min-height:180px}.hero-visual strong{font-size:48px}}\n@media(max-width:600px){.grid,.grid.two,.form-grid{grid-template-columns:1fr}.shell{padding:0 15px}.top .shell{gap:7px}.brand{font-size:18px}.nav{gap:3px}.nav button,.nav a{padding:8px 6px;font-size:11px}.hero{padding:33px 0 10px}.hero-visual{display:none}.card{padding:17px}.panel-heading{align-items:flex-start}}\n\n.avatar-box{width:105px;height:105px;object-fit:cover;border:2px solid var(--accent);border-radius:50%;margin-top:12px}\n\n\n/* UNIVERSHZRW modal: visualizaci\xF3n dentro del sitio principal; no afecta p\xE1gina independiente */\nhtml.embedded{color-scheme:light;--bg:#fff;--panel:#fff;--panel2:#f7fafc;--line:#dce5ef;--ink:#092e4f;--muted:#496480;--accent:#08698c;--gold:#b87a29;background:#fff}\nhtml.embedded body{background:#fff;color:#092e4f;min-height:100vh}\nhtml.embedded .top,html.embedded .footer,html.embedded #welcome,html.embedded #intro,html.embedded #privateArea>.hero{display:none!important}\nhtml.embedded main.shell{max-width:1140px;padding:0 29px 50px}\nhtml.embedded #authArea{max-width:800px;margin:6px auto 20px;border:0;box-shadow:none;background:white}\nhtml.embedded #authArea>h2,html.embedded .app-panel h2{font-size:clamp(23px,3vw,31px);font-weight:850;color:#052b4e;letter-spacing:-.5px}\nhtml.embedded h3{color:#0c3255}\nhtml.embedded p,html.embedded .small,html.embedded .muted{color:#566d82}\nhtml.embedded .card,html.embedded .feature,html.embedded .post{background:#fff;border:1px solid #d9e5ef;box-shadow:0 1px 9px #0a26460a}\nhtml.embedded .field label{color:#0b365c;font-weight:780}\nhtml.embedded input,html.embedded select,html.embedded textarea{color:#092c4b;background:#fff;border:1px solid #d3dfeb}\nhtml.embedded input::placeholder,html.embedded textarea::placeholder{color:#69849d}\nhtml.embedded .button{background:#0a3557;color:white;border-color:#0a3557}\nhtml.embedded .button.outline,html.embedded .button.ghost{color:#0a3557;background:#f4f8fc;border:1px solid #bad1e1}\nhtml.embedded .notice{background:#fff8ec;border-color:#e2c17d;color:#765015}\nhtml.embedded .chip{background:#f5f9fc;border:1px solid #bfd1e2;color:#274d6b}\nhtml.embedded .chip.selected{background:#0a3557;color:white}\nhtml.embedded .pill{background:#eef8ff;border-color:#aacedd;color:#095778}\nhtml.embedded .answer{background:#f5f9fc;color:#183959}\nhtml.embedded .content{color:#1b3853}\nhtml.embedded .float-status{background:#0b3554;color:white}\nhtml.embedded .float-status.error{background:#772e34;color:#fff}\nhtml.embedded .uhz-embed-nav{display:block;position:sticky;top:0;z-index:7;background:#fff;padding:25px 0 16px;border-bottom:1px solid #dce6f0;margin:0 0 22px}\nhtml.embedded .uhz-embed-nav .eyebrow{color:#b78a45;font-size:11px}\nhtml.embedded .uhz-embed-title{font-size:29px;line-height:1.15;color:#052a4a;font-weight:900;letter-spacing:-.8px;margin:8px 0 3px}\nhtml.embedded .uhz-embed-nav .uhz-embed-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}\nhtml.embedded .uhz-embed-tabs button{font-weight:700;background:#f5f8fc;color:#164263;border:1px solid #cddce9;border-radius:12px;padding:10px 14px}\nhtml.embedded .uhz-embed-tabs button:hover,html.embedded .uhz-embed-tabs button.active{background:#0b3d61;color:#fff}\nhtml.embedded .section{padding-top:8px}\nhtml.embedded .post button{color:#0d5677}\nhtml.embedded .feature .symbol{color:#094b72;border-color:#c2d8e8}\nhtml.embedded .grid{grid-template-columns:repeat(3,minmax(0,1fr))}\nhtml.embedded .grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}\nhtml.embedded .layout2{grid-template-columns:1.35fr .65fr}\nhtml.embedded .uhz-embed-nav:not(.uhz-embed-active) .uhz-embed-tabs{display:none}\n@media(max-width:800px){html.embedded main.shell{padding:0 17px 30px}html.embedded .layout2{grid-template-columns:1fr}html.embedded .grid,html.embedded .grid.two{grid-template-columns:1fr 1fr}html.embedded .uhz-embed-nav{padding-top:16px}html.embedded .uhz-embed-title{font-size:25px}}\n@media(max-width:520px){html.embedded .grid,html.embedded .grid.two{grid-template-columns:1fr}html.embedded .uhz-embed-tabs button{padding:8px 10px;font-size:12px}html.embedded #authArea{padding:5px}}\n\nhtml.embedded{--accent:#1578ca;--ink:#163956;--muted:#60778f;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}\nhtml.embedded main.shell{padding:0 28px 28px;max-width:1100px}\nhtml.embedded .uhz-embed-nav{padding:24px 0 18px;margin-bottom:18px;background:#fff}\nhtml.embedded .uhz-embed-nav:not(.uhz-embed-active){display:none}\nhtml.embedded #authArea{padding-top:26px}\nhtml.embedded .uhz-embed-nav .eyebrow{color:#5f819e;letter-spacing:1.5px;font-size:10px}\nhtml.embedded .uhz-embed-title{font-weight:750;font-size:27px;letter-spacing:-.6px;margin-top:8px}\nhtml.embedded .uhz-embed-nav p{font-size:13px;margin:8px 0 0;line-height:1.6}\nhtml.embedded #authArea{padding:10px 0 16px;margin-top:10px}\nhtml.embedded #authArea>h2{font-size:25px;font-weight:750;letter-spacing:-.6px;margin-bottom:8px}\nhtml.embedded #authArea>p{font-size:13px;margin:0 0 24px}\nhtml.embedded .field{margin:17px 0;gap:8px}\nhtml.embedded input,html.embedded select,html.embedded textarea{border-radius:9px;padding:12px 13px;border-color:#cedde9;font-size:14px;min-height:44px}\nhtml.embedded input:focus,html.embedded textarea:focus,html.embedded select:focus{border-color:#167bc9;outline:3px solid #e1f0fc;outline-offset:1px}\nhtml.embedded .field label{font-size:12px;font-weight:650;color:#31536f}\nhtml.embedded .button{border-radius:9px;background:#1479cf;border-color:#1479cf;font-weight:650;padding:12px 16px;font-size:13px;min-height:42px}\nhtml.embedded .button:hover{transform:none;filter:brightness(1.04)}\nhtml.embedded #authArea form>button[type=submit]{width:100%;margin-top:7px}\nhtml.embedded #authArea .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:15px}\nhtml.embedded #authArea .button.ghost,html.embedded #authArea .button.outline{font-size:12px;background:#f5f9fd;border-color:#dde8f2;color:#2a638f}\nhtml.embedded #authArea>div>button{margin-top:12px}\nhtml.embedded .uhz-embed-nav .uhz-embed-tabs{flex-wrap:nowrap;overflow-x:auto;gap:6px;padding:3px 3px 9px;scrollbar-width:thin}\nhtml.embedded .uhz-embed-tabs button{flex:none;font-size:12px;border-radius:8px;padding:9px 12px;white-space:nowrap;font-weight:650}\nhtml.embedded .uhz-embed-tabs button.active{background:#1479cf;border-color:#1479cf}\nhtml.embedded .profile-business{border-radius:14px;background:linear-gradient(115deg,#edf6ff,#f7fbff);padding:24px;border-color:#d0e4f4}\nhtml.embedded .profile-business .eyebrow{color:#477491}\nhtml.embedded .profile-business h3{font-size:24px;margin-top:8px}\nhtml.embedded .profile-stats .feature{border-radius:12px;background:#f7faff}\nhtml.embedded .profile-stats strong{color:#1479cf}\nhtml.embedded .coins-wallet{border-radius:14px;background:linear-gradient(110deg,#123b64,#1479a4);border-color:#285c85}\nhtml.embedded .coins-wallet .eyebrow{color:#d4eafe}\nhtml.embedded .coins-wallet p{color:#dfedf8}\nhtml.embedded .card{border-radius:14px;box-shadow:none}\n.uhz-ledger-table{width:100%;border-collapse:collapse;font-size:12px;line-height:1.5}\n.uhz-ledger-table th,.uhz-ledger-table td{text-align:left;padding:12px 8px;border-bottom:1px solid #dbe6f0;vertical-align:top;overflow-wrap:anywhere}\n.uhz-ledger-table td:nth-child(2){white-space:nowrap;font-weight:700;color:#1479cf}\n.uhz-ledger-table caption{text-align:left;padding:12px 0;color:#60778f;font-size:12px}\n.uhz-session-confirm{padding:16px;border:1px solid #c5dcec;border-radius:10px;background:#f5faff;line-height:1.6}\n@media(max-width:600px){html.embedded main.shell{padding:0 18px 24px}html.embedded .uhz-embed-title{font-size:24px}html.embedded .uhz-embed-nav{padding-top:20px}html.embedded .profile-stats{grid-template-columns:repeat(3,minmax(0,1fr))}html.embedded .profile-stats .feature{padding:14px 6px}html.embedded .profile-stats strong{font-size:24px}html.embedded #authArea .actions{grid-template-columns:1fr}html.embedded .coins-wallet strong{font-size:44px}}\n\n[data-uhz-style="uhz-inline-0"]{padding-bottom:5px}\n[data-uhz-style="uhz-inline-1"]{width:auto}\n[data-uhz-style="uhz-inline-2"]{margin-left:12px}\n.uhz-profile-identity{display:flex;gap:26px;align-items:center;min-height:148px}.uhz-profile-identity>div:last-child{min-width:0}.uhz-account-role{display:inline-block;border:1px solid #b9d6ed;background:#e9f4ff;color:#155f96;padding:6px 10px;border-radius:20px;font-size:11px;font-weight:750;margin-top:7px}\n.uhz-quantum-avatar{--orb:#4dc8ef;position:relative;isolation:isolate;flex:none;width:112px;height:112px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 28% 20%,#226e9b,#102943 65%);color:#e8faff;border:1px solid #5aadd1;margin:12px}\n.uhz-quantum-avatar .uhz-avatar-glyph{font:750 44px/1 system-ui;text-shadow:0 0 18px #60d3f6;z-index:1}.uhz-quantum-avatar #avatarPreview{position:absolute;inset:3px;width:calc(100% - 6px);height:calc(100% - 6px);object-fit:cover;border-radius:50%;max-width:none;margin:0;border:0;z-index:2}.uhz-quantum-avatar[data-preset=nebula]{--orb:#b68dff;background:radial-gradient(circle at 25% 15%,#9150ae,#242044 70%)}.uhz-quantum-avatar[data-preset=photon]{--orb:#ffd383;background:radial-gradient(circle at 25% 15%,#a57732,#253443 70%)}.uhz-quantum-avatar[data-preset=cosmos]{--orb:#71d5c4;background:radial-gradient(circle at 25% 15%,#268b88,#132d40 70%)}\n.uhz-quantum-orbit{position:absolute;inset:-9px;border:1px solid color-mix(in srgb,var(--orb) 55%,transparent);border-radius:50%;pointer-events:none;z-index:3;animation:uhzQuantumOrbit 12s linear infinite}.uhz-quantum-orbit.orbit-1{inset:-15px 9px;animation-duration:9s;animation-direction:reverse;rotate:50deg}.uhz-quantum-orbit.orbit-2{inset:9px -15px;animation-duration:16s;rotate:-35deg}.uhz-quantum-orbit i{display:block;position:absolute;width:6px;height:6px;border-radius:50%;background:var(--orb);box-shadow:0 0 9px var(--orb);left:calc(50% - 3px);top:-3px}.uhz-quantum-orbit i+i{top:auto;bottom:-3px;width:4px;height:4px}\n@keyframes uhzQuantumOrbit{to{transform:rotate(360deg)}}\n.uhz-avatar-picker{border:0;padding:0;margin:0 0 20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.uhz-avatar-picker legend{font-size:13px;font-weight:700;margin-bottom:10px}.uhz-avatar-choice{display:flex;align-items:center;gap:8px;min-height:48px;border:1px solid #d4e0ed;border-radius:11px;background:#f7fbff;color:#234965;font-size:12px;padding:8px;text-align:left}.uhz-avatar-choice[aria-pressed=true]{border-color:#1479cf;background:#e7f3ff;outline:1px solid #1479cf}.uhz-mini-avatar{display:grid;place-items:center;width:28px;height:28px;flex:none;background:#163a57;color:#c6f2ff;border-radius:50%;font-size:17px}\n.uhz-admin-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.uhz-admin-toolbar{display:flex;gap:8px;margin-bottom:16px}.uhz-admin-toolbar input{min-width:0;flex:1}.uhz-member-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.uhz-member-card{min-width:0;padding:18px;border:1px solid #dae5ef;border-radius:15px;background:#fff}.uhz-member-card h3{margin:0 0 5px}.uhz-member-email{overflow-wrap:anywhere;font-size:13px;margin:6px 0}.uhz-member-card .actions{margin-top:14px;gap:7px}.uhz-member-card .button{font-size:12px;padding:9px 12px;min-height:44px}.uhz-protected-label{font-size:11px;font-weight:700;color:#47718e}.uhz-admin-event{padding:12px 0;border-bottom:1px solid #e0e9f1}.uhz-user-action-dialog{width:min(480px,calc(100vw - 24px));padding:24px;border:1px solid #ccdfed;border-radius:18px;background:white;color:#163956;box-sizing:border-box;max-height:calc(100dvh - 24px);overflow:auto}.uhz-user-action-dialog::backdrop{background:#061b36aa}.uhz-legacy-admin-frame{border:1px solid #d5e1ed;border-radius:12px;width:100%;height:calc(100dvh - 180px);min-height:440px;display:block}\n@media(max-width:600px){.uhz-profile-identity{gap:18px;align-items:center;flex-wrap:wrap}.uhz-quantum-avatar{width:90px;height:90px;margin:12px}.uhz-profile-identity h3{font-size:23px!important}.uhz-avatar-picker{grid-template-columns:repeat(2,minmax(0,1fr))}.uhz-member-list{grid-template-columns:minmax(0,1fr)}.uhz-admin-toolbar{display:grid;grid-template-columns:1fr 1fr}.uhz-admin-toolbar input{grid-column:1/-1}.uhz-user-action-dialog{padding:20px}.uhz-user-action-dialog textarea{font-size:16px}.uhz-legacy-admin-frame{min-height:580px}}\n@media(prefers-reduced-motion:reduce){.uhz-quantum-orbit{animation:none!important}}\n\n.uhz-honey-field{position:absolute!important;left:-9999px!important;top:auto!important;width:1px!important;height:1px!important;overflow:hidden!important}.uhz-turnstile-box{padding:15px;border:1px solid rgba(73,125,155,.27);border-radius:11px;background:#f5f9fc;color:#234b60;margin:15px 0}.uhz-turnstile-box label{color:#244d61!important;font-weight:750}.uhz-turnstile-box .cf-turnstile{min-height:66px;padding:9px 0}.uhz-turnstile-box .small{color:#597789!important;font-size:11px;margin:0}\n/* Reusable account navigation; preserves the original authenticated panels. */\n.uhz-account-modules{margin:17px 0 28px;padding:24px;border-radius:18px;border:1px solid var(--line,#d9d9d9);background:var(--panel,#fff)}\n.uhz-account-modules-head h3{font-size:clamp(19px,2.4vw,27px);line-height:1.25;margin:5px 0 7px}\n.uhz-account-modules-head p{font-size:13px;color:var(--muted,#696969);margin:0 0 20px}\n.uhz-account-module-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}\n.uhz-account-module{display:flex;align-items:center;gap:12px;padding:16px 13px;border:1px solid var(--line,#d0d0d0);border-radius:12px;background:var(--panel2,#f8f8f8);color:var(--ink,#222);text-decoration:none;min-height:88px;transition:border-color .18s,transform .18s,background .18s}\n.uhz-account-module:hover{transform:translateY(-2px);border-color:var(--accent,#5297d4);text-decoration:none}\n.uhz-module-index{font:800 12px/1 Inter,system-ui,sans-serif;border:1px solid currentColor;border-radius:8px;padding:9px 7px;opacity:.7}\n.uhz-account-module-label{display:grid;gap:6px;min-width:0;flex:1}.uhz-account-module-label strong{font-size:13px}.uhz-account-module-label small{font-size:11px;line-height:1.5;color:var(--muted,#666)}\n.uhz-account-module-arrow{font-size:20px;opacity:.75}\n.uhz-community-bridge{display:flex;align-items:center;flex-wrap:wrap;gap:9px;padding:15px;margin:0 0 18px;border:1px solid var(--line,#ddd);border-radius:13px;background:var(--panel,#fafafa)}\n.uhz-community-bridge-heading{font-weight:800;font-size:12px;margin-right:8px}\n.uhz-community-bridge :is(a,button){border:1px solid var(--line,#ccc);background:var(--panel2,#fafafa);color:var(--ink,#222);border-radius:9px;padding:10px 13px;min-height:40px;font-size:12px;font-weight:750;cursor:pointer;text-decoration:none}\n.uhz-community-bridge :is(a,button):hover{border-color:var(--accent,#3694d4)}\n.uhz-account-theme-label{display:inline-flex;align-items:center;gap:6px;color:var(--ink,#eee);font-size:11px;font-weight:650}\n.uhz-account-theme-picker{background:var(--panel2,#f1f1f1);color:var(--ink,#222);border:1px solid var(--line,#ccc);padding:8px;min-height:35px;border-radius:9px;font-size:12px}\nhtml[data-uhz-theme="colorful"].uhz-account-app{color-scheme:dark}\nhtml[data-uhz-theme="classic"].uhz-account-app{--bg:#f7f7f7;--panel:#fff;--panel2:#f0f0f0;--line:#d7d7d7;--ink:#252525;--muted:#646464;--accent:#343434;--gold:#555;--success:#555;color-scheme:light}\nhtml[data-uhz-theme="dark"].uhz-account-app{--bg:#111;--panel:#1d1d1d;--panel2:#292929;--line:#414141;--ink:#eee;--muted:#bdbdbd;--accent:#f0f0f0;--gold:#ddd;--success:#ddd;color-scheme:dark}\nhtml[data-uhz-theme="classic"].uhz-account-app :is(.top,body){background:#fafafa;color:#222}\nhtml[data-uhz-theme="dark"].uhz-account-app :is(.top,body){background:#121212;color:#eee}\n@media(max-width:550px){.uhz-account-modules{padding:15px}.uhz-account-module-grid{grid-template-columns:1fr}.uhz-community-bridge{align-items:stretch}.uhz-community-bridge-heading{width:100%}}\n\n\n/* UNIVERSHZRW account \xB7 unified white-tool system (colorful theme only). */\nhtml.uhz-account-app[data-uhz-theme="colorful"]{color-scheme:light;--bg:#fff;--panel:#fff;--panel2:#fff;--line:#dbe5ed;--ink:#183e5f;--muted:#65798b;--accent:#187ac2;--gold:#476d89;--success:#178363}\nhtml.uhz-account-app[data-uhz-theme="colorful"] body{background:#fff!important;color:#183e5f!important;background-image:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.top,.footer){background:#fff!important;color:#183e5f!important;border-color:#e1e8ee!important;backdrop-filter:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.hero-visual,.card,.feature,.post,.locked,.uhz-account-modules,.uhz-community-bridge,.profile-business,.coins-wallet,.uhz-member-card){background:#fff!important;background-image:none!important;color:#183e5f!important;border:1px solid #d9e3ec!important;box-shadow:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.card,.feature,.post,.locked,.uhz-account-modules,.uhz-community-bridge,.profile-business,.coins-wallet){border-radius:15px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.hero-visual strong,.coins-wallet strong,.profile-stats strong){color:#174e76!important;text-shadow:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.coins-wallet p,.coins-wallet .eyebrow,.profile-business .eyebrow,.post .meta,.content,.subtle,.small,.muted,.card p,.feature p){color:#617588!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(h1,h2,h3,h4,.brand,.uhz-embed-title){color:#183e5f!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .nav :is(button,a){background:transparent!important;color:#244d6e!important;border-color:transparent!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .nav :is(button.active,button:hover,a:hover){background:#f3f6f9!important;color:#0d4d7d!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.field label,.eyebrow){color:#59758b!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(input:not(.uhzg-theme-picker),select:not(.uhzg-theme-picker),textarea){background:#fff!important;color:#203d55!important;border:1px solid #cbd9e5!important;box-shadow:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(input,textarea)::placeholder{color:#778c9d!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.answer,.uhz-session-confirm,.uhz-turnstile-box){background:#fff!important;color:#274d69!important;border-color:#d9e3ec!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.notice,.success){background:#fff!important;border-color:#d5e1e8!important;color:#315a74!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.chip,.pill,.button.ghost,.button.outline,.uhz-embed-tabs button,.uhz-admin-tabs button,.uhz-community-bridge a,.uhz-community-bridge button){background:#fff!important;color:#234965!important;border:1px solid #d7e2ec!important;box-shadow:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.chip.selected,.uhz-embed-tabs button.active,.uhz-admin-tabs button.active){background:#fff!important;color:#125e9c!important;border:2px solid #2585cf!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .button:not(.ghost):not(.outline){background:#184c72!important;color:white!important;border-color:#184c72!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-modules{margin:15px 0 26px!important;padding:18px 0!important;border:none!important;background:#fff!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-modules-head h3{font-weight:700!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module{min-height:72px!important;padding:12px!important;display:flex!important;align-items:center!important;gap:12px!important;background:#fff!important;background-image:none!important;border:1px solid #d5e2ed!important;border-radius:16px!important;box-shadow:none!important;color:#183e5f!important;transform:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module:hover{border-color:#6eafdf!important;background:#fff!important;box-shadow:0 2px 7px rgba(24,74,108,.06)!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module:focus-visible{outline:2px solid #2787d2!important;outline-offset:2px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-module-index{display:grid!important;place-items:center!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;flex:none!important;padding:0!important;border:0!important;border-radius:50%!important;background:#153f60!important;color:#e4f6ff!important;opacity:1!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-module-index svg{display:block;width:21px;height:21px;stroke:currentColor}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module-label{gap:3px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module-label strong{font-size:14px!important;font-weight:600!important;color:#183e5f!important;line-height:1.35!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module-label small{font-size:11px!important;line-height:1.45!important;color:#687f91!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module-arrow{display:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-avatar-picker{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-avatar-choice{background:#fff!important;color:#193e5d!important;border:1px solid #d5e2ed!important;border-radius:16px!important;min-height:72px!important;padding:11px 12px!important;gap:12px!important;box-shadow:none!important;font-size:14px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-avatar-choice:hover{border-color:#7eb9e3!important;background:#fff!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-avatar-choice[aria-pressed="true"]{border:2px solid #2585cf!important;background:#fff!important;outline:none!important;padding:10px 11px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-mini-avatar{width:42px!important;height:42px!important;min-width:42px!important;background:#153f60!important;color:#e4f6ff!important;border-radius:50%!important;font-size:21px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.grid .feature,.profile-stats .feature){background:#fff!important;border-color:#d5e2ed!important;box-shadow:none!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.feature .symbol){display:inline-grid!important;place-items:center!important;min-width:42px!important;min-height:42px!important;border-radius:50%!important;padding:6px!important;background:#153f60!important;color:#e4f6ff!important;border:0!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.uhz-embed-tabs button,.uhz-admin-tabs button){border-radius:13px!important;min-height:45px!important;padding:10px 14px!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] :is(.uhz-account-theme-picker){background:#fff!important;border-color:#d5e2ed!important;color:#244763!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhz-community-bridge{padding:12px!important;gap:10px!important}\n@media(max-width:900px){html.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}\n@media(max-width:600px){html.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module-grid{grid-template-columns:1fr!important}html.uhz-account-app[data-uhz-theme="colorful"] .uhz-avatar-picker{grid-template-columns:repeat(2,minmax(0,1fr))!important}html.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module{min-height:68px!important}}\n@media(prefers-reduced-motion:reduce){html.uhz-account-app[data-uhz-theme="colorful"] .uhz-account-module{transition:none!important}}\n\n/* Keep canonical masthead independent from app input styling and authenticated internal header. */\nhtml.uhz-account-app.uhzg-active body>.uhz-page-header,html.uhz-account-app.uhzg-active body>header.uhz-page-header,html.uhz-account-app.uhz-signed-in.uhz-unified-account.uhzg-active body>.uhz-page-header.uhz-unified-header{display:none!important;min-height:0!important;height:0!important;max-height:0!important;padding:0!important;margin:0!important;border:0!important;visibility:hidden!important;overflow:hidden!important}\nhtml.uhz-account-app[data-uhz-theme="colorful"] .uhzg-header select.uhzg-theme-picker,html.uhz-account-app[data-uhz-theme="classic"] .uhzg-header select.uhzg-theme-picker,html.uhz-account-app[data-uhz-theme="dark"] .uhzg-header select.uhzg-theme-picker{appearance:none!important;width:auto!important;min-width:0!important;height:36px!important;min-height:36px!important;max-width:115px!important;padding:6px 23px 6px 5px!important;background-color:transparent!important;border:0!important;border-radius:6px!important;box-shadow:none!important;color:#c7dae9!important}\n\n\n/* Account-only secure profile editor */\n.uhz-private-editor{margin:22px 0!important;padding:26px!important;border:1px solid #d8e3ec!important;border-radius:17px!important;background:#fff!important;box-shadow:none!important;color:#193f5e!important}\n.uhz-private-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:8px}\n.uhz-private-editor h3{font-size:22px!important;line-height:1.25;margin:5px 0 8px;color:#183e5b!important}.uhz-private-editor-head p{margin:0;color:#647e91;font-size:13px;line-height:1.7}\n.uhz-private-badge{display:inline-flex;gap:6px;align-items:center;white-space:nowrap;border:1px solid #d5e5ef;border-radius:99px;padding:8px 12px;background:#f8fbfd;color:#315d78;font-size:11px;font-weight:700}\n.uhz-private-loading{font-size:12px;color:#617e92;padding:8px 0}.uhz-private-loading[hidden]{display:none}\n.uhz-profile-group{padding:22px 0;border-top:1px solid #e5edf2}.uhz-profile-group:first-child{border-top:0}\n.uhz-profile-group-title{display:flex;align-items:center;gap:12px;margin-bottom:15px}.uhz-profile-step{display:grid;place-items:center;border-radius:50%;height:35px;width:35px;min-width:35px;background:#163e5b;color:#fff;font-size:12px;font-weight:700}\n.uhz-private-editor h4{font-size:16px;color:#173b59;margin:0 0 4px;font-weight:750}.uhz-profile-group-title p{color:#668094;font-size:12px;margin:0;line-height:1.55}\n.uhz-private-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:17px;row-gap:2px}.uhz-private-fields .uhz-wide{grid-column:1/-1}\n.uhz-private-fields .field{margin:8px 0 13px!important;min-width:0}.uhz-private-fields .field label{font-size:12px!important;font-weight:700;color:#345c75!important;margin-bottom:5px;display:block}\n.uhz-private-fields .field input:not([type=checkbox]),.uhz-private-fields .field textarea{background:#fff!important;border:1px solid #d1dfea!important;box-shadow:none!important;border-radius:10px!important;color:#193f5e!important;min-height:44px!important;width:100%!important;padding:11px 12px!important;font-size:13px!important}\n.uhz-private-fields .field input:focus-visible,.uhz-private-fields .field textarea:focus-visible{border-color:#2a85c5!important;outline:2px solid #bde1fa!important;outline-offset:1px}\n.uhz-private-fields .field input[disabled]{background:#f4f7fa!important;color:#6b8293!important;cursor:not-allowed}\n.uhz-private-fields .field small{display:block;margin-top:5px;line-height:1.55;color:#678397;font-size:11px}\n.uhz-private-fields .field textarea{resize:vertical}.uhz-private-optional{font-size:10px;color:#7a92a3;font-weight:500}\n.uhz-private-secret{display:flex;align-items:center;position:relative}.uhz-private-secret input{padding-right:79px!important}.uhz-private-secret button{position:absolute;right:5px;min-height:35px;border:0;background:transparent!important;color:#285e80!important;padding:6px 10px;border-radius:7px;cursor:pointer;font-size:11px;font-weight:700}\n.uhz-private-secret button:hover{background:#edf5fa!important}.uhz-private-clear{display:flex!important;align-items:center;gap:7px;font-size:11px!important;color:#617d91!important;font-weight:500!important;margin-top:8px!important}.uhz-private-clear input{accent-color:#235d86;width:auto!important}\n.uhz-private-safety{padding:12px 14px;background:#f7fafc;color:#5b788d;font-size:12px;line-height:1.65;border:1px solid #e1eaf0;border-radius:11px}\n.uhz-private-save{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding-top:20px;border-top:1px solid #e2ebf0}.uhz-private-save span{color:#637e90;font-size:12px;max-width:600px}.uhz-private-save span[data-error=true]{color:#ae3434}\n.uhz-private-save .button{border-radius:10px!important;background:#164b72!important;color:#fff!important;min-height:42px;padding:11px 20px;font-size:13px;font-weight:700}\nhtml.uhz-profile-edit-route .uhz-account-modules{display:none!important}\nhtml.uhz-profile-edit-route #panel-profile>h2{display:none!important}\n.uhz-edit-profile-back{display:none;font-size:13px;color:#215e8a;margin:12px 0 18px}\nhtml.uhz-profile-edit-route .uhz-edit-profile-back{display:inline-flex;align-items:center;gap:6px}\n@media(max-width:700px){.uhz-private-editor{padding:16px!important}.uhz-private-fields{grid-template-columns:1fr}.uhz-private-editor-head{flex-direction:column}.uhz-private-badge{align-self:flex-start}.uhz-private-editor h3{font-size:19px!important}.uhz-private-save .button{width:100%}}\n\n\n/* Respect all three independent appearance modes inside the private editor. */\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-editor{background:#1b1b1b!important;color:#eee!important;border-color:#404040!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-editor :is(h3,h4){color:#f1f1f1!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-editor :is(p,small,.uhz-private-save span){color:#bbb!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-profile-group,html.uhz-account-app[data-uhz-theme="dark"] .uhz-private-save{border-color:#414141}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-fields .field label{color:#ddd!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-fields .field input:not([type=checkbox]),html.uhz-account-app[data-uhz-theme="dark"] .uhz-private-fields .field textarea{background:#242424!important;border-color:#494949!important;color:#f4f4f4!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-fields input[disabled]{background:#292929!important;color:#aaa!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-safety,html.uhz-account-app[data-uhz-theme="dark"] .uhz-private-badge{background:#252525!important;color:#ddd!important;border-color:#424242!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-secret button{color:#eee!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-private-save .button{background:#ececec!important;color:#181818!important;border-color:#ececec!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] .uhz-profile-step{background:#e9e9e9!important;color:#171717!important}\nhtml.uhz-account-app[data-uhz-theme="classic"] .uhz-private-save .button{background:#252525!important;color:#fff!important;border-color:#252525!important}\nhtml.uhz-account-app[data-uhz-theme="classic"] .uhz-profile-step{background:#303030!important;color:#fff!important}\nhtml.uhz-account-app[data-uhz-theme="classic"] .uhz-private-editor h3,html.uhz-account-app[data-uhz-theme="classic"] .uhz-private-editor h4{color:#222!important}\n\n/* Dedicated page modes: account dashboard vs personal profile. */\n.uhz-profile-page-title{margin:0 0 20px}.uhz-profile-page-title h2{margin:6px 0 7px!important;font-weight:750}.uhz-profile-page-title p{color:#668093;font-size:13px;line-height:1.7;max-width:790px;margin:0 0 17px}\n.uhz-profile-page-title .uhz-edit-profile-back{display:inline-flex!important;align-items:center;gap:6px;margin:0 0 16px;color:#215e8a;text-decoration:none;font-weight:650;font-size:12px}\nhtml.uhz-account-hub-route #privateArea>.hero,html.uhz-profile-edit-route #privateArea>.hero{display:none!important}\nhtml.uhz-account-hub-route #panel-profile{display:none!important}\nhtml.uhz-profile-edit-route #panel-home{display:none!important}\nhtml.uhz-profile-edit-route #panel-profile .profile-stats{display:none!important}\nhtml.uhz-account-hub-route #panel-home>.uhz-account-modules{border:0!important}\nhtml.uhz-account-hub-route #panel-home>h2{font-size:clamp(23px,3vw,34px)!important;margin:5px 0 20px}\nhtml.uhz-profile-edit-route #panel-profile>h2{display:none!important}\nhtml.uhz-account-hub-route #panel-home:not(.hide),html.uhz-profile-edit-route #panel-profile:not(.hide){display:block!important}\n@media(max-width:600px){.uhz-profile-page-title{margin-bottom:13px}.uhz-profile-page-title p{font-size:12px}}\n\n/* Account navigation is a public directory of tools, not personal records. Always show it on /mi-cuenta. */\nhtml.uhz-account-hub-route #privateArea{display:block!important;visibility:visible!important;opacity:1!important}\nhtml.uhz-account-hub-route #privateArea > :not(#panel-home){display:none!important}\nhtml.uhz-account-hub-route #panel-home,html.uhz-account-hub-route #panel-home.hide{display:block!important;visibility:visible!important;opacity:1!important}\nhtml.uhz-account-hub-route #panel-home .uhz-account-modules{display:block!important;visibility:visible!important}\n\n.uhz-restricted{cursor:not-allowed!important;opacity:.58;background:#f6f8fa!important}.uhz-restricted .uhz-account-module-arrow{display:none!important}\n.uhz-plan-area{padding:27px 0 0;grid-column:1/-1}.uhz-plan-area h3{font-size:22px;margin:7px 0;color:#193c59}.uhz-plan-area>div>p{font-size:12px;color:#6f8190;margin:0 0 19px}.uhz-plan-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.uhz-plan-card{padding:22px;border:1px solid #d7e0e8;border-radius:17px;background:white;display:grid;gap:8px;align-content:start}.uhz-plan-card.silver{background:linear-gradient(135deg,#fff,#f6f8fa);border-color:#b3c5d1}.uhz-plan-card.gold{background:linear-gradient(135deg,#fffef9,#fff);border-color:#d6b978}.uhz-plan-letter{border-radius:50%;height:44px;width:44px;display:grid;place-items:center;font-weight:900;font-size:20px;color:#334759;background:linear-gradient(140deg,#dfe9f1,#acbcc8)}.uhz-plan-card.gold .uhz-plan-letter{background:linear-gradient(135deg,#ffe8aa,#cb9e37);color:#674819}.uhz-plan-card h4{font-size:17px;color:#22435e;margin:3px 0}.uhz-plan-card h4 small{font-size:12px;margin-left:5px;color:#81919d}.uhz-plan-card p{color:#698293;font-size:12px;line-height:1.7;margin:0}.uhz-plan-locked{color:#758492;border:1px solid #cfd9e1;border-radius:8px;padding:7px 10px;font-size:11px;justify-self:start}.uhz-plan-card a{font-weight:700;font-size:12px;color:#145d8c;text-decoration:none;margin-top:6px}.uhz-plan-card a:hover{text-decoration:underline}\n.uhz-pub-section{border:1px solid #dae5ee;border-radius:15px;background:white;padding:24px;margin:18px 0 23px}.uhz-pub-head{display:flex;justify-content:space-between;align-items:center;gap:16px}.uhz-pub-head h3{font-size:19px;margin:0 0 8px;color:#193e5a}.uhz-pub-head p{font-size:12px;line-height:1.6;color:#6a8497}.uhz-pub-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px;font-size:12px;color:#728699}.uhz-pub-entry{border:1px solid #d8e4ed;border-radius:12px;padding:15px;background:white}.uhz-pub-entry h4{font-size:14px;color:#174768;margin:0 0 7px;overflow-wrap:anywhere}.uhz-pub-entry p{font-size:11px;color:#708497;margin:5px 0 10px}.uhz-pub-entry a{color:#1b638a;font-size:12px;text-decoration:none;font-weight:750}.uhz-pub-entry a:hover{text-decoration:underline}.uhz-pub-label,.uhz-pub-tools label{display:block;font-size:12px;font-weight:750;color:#436982}.uhz-pub-label input,.uhz-pub-tools input{width:100%;margin-top:8px;padding:10px;background:#fff!important;border:1px solid #cedce6!important;border-radius:8px!important;color:#21445c!important;min-height:42px}.uhz-pub-tools{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px}\nhtml[data-uhz-theme="dark"] .uhz-restricted{background:#242424!important}html[data-uhz-theme="dark"] .uhz-pub-section,html[data-uhz-theme="dark"] .uhz-pub-entry,html[data-uhz-theme="dark"] .uhz-plan-card{background:#1f1f1f!important;border-color:#454545!important;color:#eee!important}html[data-uhz-theme="dark"] .uhz-pub-entry h4,html[data-uhz-theme="dark"] .uhz-pub-head h3,html[data-uhz-theme="dark"] .uhz-plan-card h4{color:#f1f1f1!important}\n@media(max-width:730px){.uhz-plan-grid,.uhz-pub-grid,.uhz-pub-tools{grid-template-columns:1fr}.uhz-pub-head{align-items:flex-start;flex-direction:column}}\n\n.uhz-organizer-form{display:grid;grid-template-columns:1fr 1fr;gap:8px;border-top:1px solid #dce5ec;margin-top:12px;padding-top:12px}.uhz-organizer-form input{width:100%;min-width:0;background:#fff!important;border:1px solid #cbdde9!important;border-radius:8px;padding:8px;font-size:11px;color:#214b65!important}.uhz-organizer-form button{grid-column:1/-1;border:1px solid #c3d5e2;background:#eff6fa;color:#1a608b;border-radius:8px;padding:9px;font-size:11px;font-weight:750;cursor:pointer}.uhz-organizer-form small{grid-column:1/-1;font-size:10px;color:#678295}html[data-uhz-theme=dark] .uhz-organizer-form input{background:#272727!important;color:#eee!important;border-color:#555!important}\n\n/* UNIVERSHZRW account memberships: white-first, silver and gold accents */\n.uhz-member-center{margin:26px 0 30px;max-width:100%;color:#183a55}.uhz-member-title{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:13px}.uhz-member-title h3{font:750 clamp(22px,2.5vw,30px)/1.15 Inter,"Segoe UI",system-ui,sans-serif;letter-spacing:-.035em;margin:8px 0;color:#153b57}.uhz-member-title p{color:#6d8495;font-size:13px;margin:0}.uhz-current-plan{white-space:nowrap;background:#f4f7f9;color:#31526a;border:1px solid #cedbe5;border-radius:100px;font-size:11px;font-weight:800;padding:8px 13px}.uhz-current-plan.is-classic{background:#e7ecef;color:#4e606d;border-color:#bcc9d2}.uhz-current-plan.is-gold{background:#fcf3d9;color:#8c6122;border-color:#d9bc75}.uhz-membership-message{font-size:12px;color:#617f92;min-height:20px;margin:9px 0 19px}.uhz-member-plan-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.uhz-plan-box{background:#fff;border:1px solid #dce5ec;border-radius:17px;padding:23px;display:flex;flex-direction:column;align-items:flex-start;gap:9px;min-width:0}.uhz-plan-box.free{border-color:#d3e2ec}.uhz-plan-box.classic{border-color:#c0cdd7}.uhz-plan-box.gold{border-color:#d9bf83}.uhz-plan-head{display:flex;align-items:center;gap:12px}.uhz-plan-symbol{display:grid;place-items:center;height:46px;width:46px;border-radius:50%;background:#174666;color:#fff;font-weight:850;font-size:20px}.uhz-plan-box.classic .uhz-plan-symbol{background:linear-gradient(140deg,#edf1f3,#adbfc9);color:#344c5b}.uhz-plan-box.gold .uhz-plan-symbol{background:linear-gradient(140deg,#ffeec2,#cc9e40);color:#5d451d}.uhz-plan-box h4{font-size:19px;font-weight:800;line-height:1.2;color:#1d415b;margin:3px 0 0}.uhz-plan-price{font-size:30px;color:#1b3f5b;letter-spacing:-.05em;line-height:1.2}.uhz-plan-price small{font-size:11px;letter-spacing:0;color:#708596;font-weight:550}.uhz-plan-box>p{font-size:12px;color:#708497;line-height:1.7;margin:0}.uhz-plan-box ul{padding-left:18px;margin:5px 0 15px;font-size:12px;line-height:1.8;color:#435f75}.uhz-plan-box li{margin:4px 0}.uhz-plan-box button{min-height:40px;padding:10px 17px;border:1px solid #bccbd5;border-radius:9px;background:#f2f7fa;color:#254d6a;font-weight:800;font-size:12px;cursor:pointer;margin-top:auto}.uhz-plan-box.classic button{background:#e6ecef;color:#304757}.uhz-plan-box.gold button{background:#f2dfaa;border-color:#d7b972;color:#765417}.uhz-plan-box button:hover{filter:brightness(.97)}.uhz-plan-box button:disabled{opacity:.7;cursor:not-allowed}.uhz-plan-state{font-size:10px;color:#71869a;margin-top:7px}.uhz-plan-box.is-active{box-shadow:0 0 0 2px rgba(30,102,145,.12)}.uhz-plan-box.gold.is-active{box-shadow:0 0 0 2px rgba(185,137,54,.22)}\n.uhz-gold-creator{background:#fff;border:1px solid #e0e5e8;border-radius:17px;padding:25px;margin:18px 0}.uhz-gold-main{display:flex;align-items:flex-start;gap:17px}.uhz-gold-icon{height:47px;width:47px;flex:0 0 47px;display:grid;place-items:center;border:1px solid #dec98d;border-radius:13px;color:#947026;background:#fdf6df;font-size:28px}.uhz-gold-main h4{font-size:18px;color:#203e56;margin:6px 0}.uhz-gold-main p{margin:0;color:#697f90;font-size:12px;line-height:1.8}.uhz-gold-example{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin:22px 0 14px;padding:18px;border:1px solid #e4e9ec;border-radius:13px}.uhz-gold-example>div{flex:1;min-width:140px;display:flex;flex-direction:column;gap:5px}.uhz-gold-example small{color:#718696;font-size:11px}.uhz-gold-example strong{color:#1d455f;font-size:24px;font-weight:800}.uhz-gold-example>span{font-size:20px;color:#a8b6c0}.uhz-gold-disclaimer{font-size:11px;line-height:1.75;color:#708391;margin:0}.uhz-member-benefits{margin-top:26px}.uhz-member-benefits h4{font-size:19px;color:#1d415b;margin:0 0 13px}.uhz-benefit-scroll{border:1px solid #dbe6ed;border-radius:14px;overflow-x:auto;background:#fff}.uhz-benefit-scroll table{border-collapse:collapse;width:100%;min-width:590px;line-height:1.5}.uhz-benefit-scroll th,.uhz-benefit-scroll td{padding:13px 15px;border-bottom:1px solid #e7edf2;font-size:12px;text-align:center;color:#385773}.uhz-benefit-scroll th:first-child,.uhz-benefit-scroll td:first-child{text-align:left;font-weight:650}.uhz-benefit-scroll th{font-size:11px;background:#f7f9fb;color:#56718a}.uhz-benefit-scroll tbody tr:last-child td{border-bottom:0}\nhtml[data-uhz-theme=classic] .uhz-plan-box,html[data-uhz-theme=classic] .uhz-gold-creator{background:#fff}html[data-uhz-theme=dark] .uhz-member-center{color:#eee}html[data-uhz-theme=dark] .uhz-plan-box,html[data-uhz-theme=dark] .uhz-gold-creator,html[data-uhz-theme=dark] .uhz-benefit-scroll{background:#1d1d1d!important;border-color:#454545!important}html[data-uhz-theme=dark] .uhz-member-title h3,html[data-uhz-theme=dark] .uhz-plan-box h4,html[data-uhz-theme=dark] .uhz-plan-price,html[data-uhz-theme=dark] .uhz-member-benefits h4,html[data-uhz-theme=dark] .uhz-gold-main h4,html[data-uhz-theme=dark] .uhz-gold-example strong{color:#f1f1f1!important}html[data-uhz-theme=dark] .uhz-gold-example{border-color:#444!important;background:#242424!important}html[data-uhz-theme=dark] .uhz-benefit-scroll th{background:#282828!important;color:#ccc!important}html[data-uhz-theme=dark] .uhz-benefit-scroll td{color:#ddd;border-color:#454545!important}html[data-uhz-theme=dark] .uhz-plan-box ul{color:#ccc!important}html[data-uhz-theme=dark] .uhz-plan-box button{background:#393939!important;color:#eee!important;border-color:#777!important}\n@media(max-width:920px){.uhz-member-plan-grid{grid-template-columns:1fr 1fr}.uhz-member-plan-grid .gold{grid-column:1/-1}}@media(max-width:620px){.uhz-member-title{align-items:flex-start;flex-direction:column}.uhz-member-plan-grid{grid-template-columns:1fr}.uhz-member-plan-grid .gold{grid-column:auto}.uhz-plan-box{padding:19px}.uhz-gold-example{align-items:flex-start;flex-direction:column;gap:10px}.uhz-gold-example>div{min-width:0}.uhz-gold-example>span{transform:rotate(90deg)}}\n\n.uhz-pro-toolbox{margin:26px 0 31px}.uhz-pro-toolbox-head h3{font-size:22px;margin:7px 0;color:#1e415b}.uhz-pro-toolbox-head p{font-size:12px;line-height:1.6;color:#69849a;margin:0 0 17px}.uhz-pro-tools-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.uhz-pro-tool{background:#fff;display:flex;align-items:center;gap:12px;min-width:0;border:1px solid #d9e5eb;border-radius:14px;padding:15px 13px;color:#1f4562;text-align:left;font:inherit}.uhz-pro-tool[data-tier-route]{cursor:pointer}.uhz-pro-tool[data-tier-route]:hover{border-color:#aabfce}.uhz-pro-tool.is-soon{opacity:.8;cursor:not-allowed}.uhz-pro-round{width:39px;height:39px;display:grid;place-items:center;flex:0 0 39px;border-radius:50%;font-size:18px;font-weight:900}.uhz-pro-round.classic{background:linear-gradient(140deg,#ebf0f2,#bccbd4);color:#345061}.uhz-pro-round.gold{background:linear-gradient(140deg,#ffefb9,#d8af57);color:#634815}.uhz-pro-tool>span:nth-child(2){flex:1;min-width:0}.uhz-pro-tool strong{display:block;font-size:12px;line-height:1.3}.uhz-pro-tool small{display:block;font-size:10px;color:#71869a;line-height:1.5;margin-top:4px}.uhz-pro-lock{display:inline-block;flex:0 0 auto;background:#f6f7f8;border:1px solid #dce3e8;color:#697b88;border-radius:7px;padding:4px 6px;font-size:9px;font-weight:750}.uhz-pro-tool.is-unlocked .uhz-pro-lock{background:#ecf6ef;color:#3b714a;border-color:#cbdfd1}html[data-uhz-theme=dark] .uhz-pro-tool{background:#202020;border-color:#4a4a4a;color:#eee}html[data-uhz-theme=dark] .uhz-pro-toolbox-head h3{color:#eee}@media(max-width:1100px){.uhz-pro-tools-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.uhz-pro-tools-grid{grid-template-columns:1fr}.uhz-pro-tool{padding:12px}}\n\n/* Account tools v20261102: repaired nested markup, clear category layout */\nhtml.uhz-account-app #panel-home .uhz-tool-hub{display:block!important;border:0!important;background:transparent!important;margin:12px 0 30px!important;padding:0!important;box-shadow:none!important;max-width:none!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub>.uhz-account-modules-head{display:block;padding:0 0 19px;margin:0 0 22px;border-bottom:1px solid #dfe7ed}\nhtml.uhz-account-app #panel-home .uhz-tool-hub>.uhz-account-modules-head h3{font-size:clamp(22px,2.5vw,29px)!important;letter-spacing:-.035em;font-weight:800!important;line-height:1.2;color:#193f5b;margin:8px 0!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub>.uhz-account-modules-head p{font-size:13px!important;color:#6c8395!important;line-height:1.7!important;max-width:850px;margin:0!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub-groups{display:flex!important;flex-direction:column!important;gap:29px!important}\nhtml.uhz-account-app #panel-home .uhz-tool-group{min-width:0;width:100%}\nhtml.uhz-account-app #panel-home .uhz-tool-group-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:13px}\nhtml.uhz-account-app #panel-home .uhz-tool-group-heading h4{font-size:17px;font-weight:800;line-height:1.3;color:#20425e;margin:0 0 4px}\nhtml.uhz-account-app #panel-home .uhz-tool-group-heading p{font-size:12px;line-height:1.55;color:#73899a;margin:0}\nhtml.uhz-account-app #panel-home .uhz-tool-group-count{font-size:11px;white-space:nowrap;color:#7c90a0}\nhtml.uhz-account-app #panel-home .uhz-tool-group .uhz-account-module-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%!important;gap:14px!important;align-items:stretch!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-account-module{position:relative!important;display:grid!important;grid-template-columns:44px minmax(0,1fr)!important;grid-template-rows:auto 1fr!important;align-items:start!important;align-content:center!important;gap:6px 12px!important;min-height:118px!important;min-width:0!important;width:100%!important;max-width:none!important;padding:15px!important;margin:0!important;background:#fff!important;background-image:none!important;color:#1b4561!important;border:1px solid #d8e5ec!important;border-radius:15px!important;box-shadow:none!important;text-decoration:none!important;transform:none!important;opacity:1!important;overflow:visible!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub a.uhz-account-module:hover{background:#fff!important;border-color:#84b2cf!important;box-shadow:0 3px 12px #1b4a6810!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-module-index{grid-column:1!important;grid-row:1/3!important;align-self:start!important;display:grid!important;place-items:center!important;min-height:42px!important;min-width:42px!important;width:42px!important;height:42px!important;padding:0!important;margin:0!important;border-radius:50%!important;background:#19496a!important;color:#fff!important;box-shadow:none!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-account-module-label{grid-column:2!important;grid-row:1!important;display:flex!important;flex-direction:column!important;min-width:0!important;gap:4px!important;align-self:start!important;white-space:normal!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-account-module-label strong{font-size:14px!important;line-height:1.3!important;font-weight:750!important;color:#173c59!important;overflow-wrap:anywhere}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-account-module-label small{font-size:11px!important;line-height:1.5!important;color:#73899b!important;overflow-wrap:anywhere}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-tool-access{grid-column:2!important;grid-row:2!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;align-self:end!important;gap:5px 7px!important;padding-top:6px!important;min-width:0!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-tool-tag{display:inline-flex!important;align-items:center!important;padding:4px 7px!important;line-height:1.25!important;border-radius:7px!important;border:1px solid #d0e0e9!important;background:#f1f7fa!important;color:#215877!important;font-size:10px!important;font-weight:750!important;white-space:nowrap!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-tool-tag.is-variable{background:#f5f6f7!important;color:#506676!important;border-color:#d9e0e5!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-tool-tag.is-locked{background:#f4f4f4!important;border-color:#dadada!important;color:#777!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-tool-condition{color:#758b9d!important;font-size:10px!important;line-height:1.45!important;overflow-wrap:anywhere!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-account-module-arrow{display:none!important}\nhtml.uhz-account-app #panel-home .uhz-tool-hub .uhz-account-module.uhz-restricted{background:#fafafa!important;border-style:dashed!important;opacity:.75!important;cursor:not-allowed!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-tool-hub .uhz-account-module{background:#212121!important;border-color:#444!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-tool-hub a.uhz-account-module:hover{background:#292929!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-tool-hub .uhz-account-module-label strong,html.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-tool-group-heading h4,html.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-account-modules-head h3{color:#eee!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-tool-hub .uhz-module-index{background:#3a3a3a!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-tool-hub .uhz-tool-tag{background:#303030!important;color:#ddd!important;border-color:#555!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-tool-hub .uhz-account-module.uhz-restricted{background:#242424!important}\n@media(max-width:1150px){html.uhz-account-app #panel-home .uhz-tool-group .uhz-account-module-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}\n@media(max-width:650px){html.uhz-account-app #panel-home .uhz-tool-group .uhz-account-module-grid{grid-template-columns:1fr!important}html.uhz-account-app #panel-home .uhz-tool-group-heading{flex-direction:column;align-items:flex-start;gap:4px}html.uhz-account-app #panel-home .uhz-tool-hub .uhz-account-module{min-height:104px!important;padding:14px!important}}\n\n\n/* Unified premium cards matched to standard account tool cards */\nhtml.uhz-account-app #panel-home .uhz-pro-toolbox{padding:24px 0 0;margin:18px 0 29px;border-top:1px solid #dfe7ed}\nhtml.uhz-account-app #panel-home .uhz-pro-toolbox-head{display:block;margin-bottom:15px}\nhtml.uhz-account-app #panel-home .uhz-pro-toolbox-head h3{font-size:22px;letter-spacing:-.03em;color:#173f5b;margin:7px 0 8px}\nhtml.uhz-account-app #panel-home .uhz-pro-toolbox-head p{font-size:12px;line-height:1.7;color:#71899b;max-width:910px;margin:0}\nhtml.uhz-account-app #panel-home .uhz-pro-tools-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important;width:100%}\nhtml.uhz-account-app #panel-home .uhz-pro-tool{display:grid!important;grid-template-columns:43px minmax(0,1fr)!important;grid-template-rows:auto auto!important;gap:5px 12px!important;align-content:center!important;align-items:start!important;min-height:118px!important;max-width:none!important;min-width:0!important;padding:15px!important;background:#fff!important;border:1px solid #d8e5ec!important;border-radius:15px!important;text-align:left!important;box-shadow:none!important;color:#173e59!important;opacity:1!important}\nhtml.uhz-account-app #panel-home .uhz-pro-tool[data-tier-route]:hover{background:#fff!important;border-color:#8fb7d0!important}\nhtml.uhz-account-app #panel-home .uhz-pro-round{width:42px!important;height:42px!important;min-width:42px!important;grid-column:1;grid-row:1/3;align-self:start;display:grid;place-items:center;border-radius:50%;font-size:19px;font-weight:850}\nhtml.uhz-account-app #panel-home .uhz-pro-round.classic{background:linear-gradient(140deg,#ebf1f5,#b8c7d2);color:#344d5d}\nhtml.uhz-account-app #panel-home .uhz-pro-round.gold{background:linear-gradient(140deg,#faebbd,#d4a84c);color:#614916}\nhtml.uhz-account-app #panel-home .uhz-pro-body{grid-column:2;grid-row:1;display:flex!important;flex-direction:column;gap:4px;min-width:0}\nhtml.uhz-account-app #panel-home .uhz-pro-body strong{display:block;font-size:14px!important;line-height:1.3;color:#193f5b!important;font-weight:750!important;overflow-wrap:anywhere}\nhtml.uhz-account-app #panel-home .uhz-pro-body small{display:block;color:#70879a!important;font-size:11px!important;line-height:1.45!important}\nhtml.uhz-account-app #panel-home .uhz-pro-how{font-size:10px!important;line-height:1.4;color:#73879a;display:block}\nhtml.uhz-account-app #panel-home .uhz-pro-lock{grid-column:2;grid-row:2;align-self:end;justify-self:start!important;background:#f3f5f6!important;border:1px solid #d6e0e5!important;border-radius:7px!important;color:#4e6677!important;display:inline-flex!important;padding:4px 8px!important;font-size:10px!important;font-weight:750}\nhtml.uhz-account-app #panel-home .uhz-pro-tool.is-unlocked .uhz-pro-lock{color:#266e44!important;background:#eaf7ee!important;border-color:#bfddcb!important}\nhtml.uhz-account-app #panel-home .uhz-pro-tool.is-soon{cursor:not-allowed!important}\nhtml.uhz-account-app #panel-home .uhz-pro-tool.is-soon .uhz-pro-lock{color:#767676!important}\nhtml.uhz-account-app #panel-home .uhz-pro-disclosure{margin:12px 0 0;font-size:11px;color:#70879a;line-height:1.65}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-pro-tool{background:#212121!important;border-color:#464646!important;color:#eee!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-pro-body strong,html.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-pro-toolbox-head h3{color:#eee!important}\nhtml.uhz-account-app[data-uhz-theme="dark"] #panel-home .uhz-pro-lock{background:#333!important;border-color:#555!important;color:#eee!important}\n@media(max-width:1150px){html.uhz-account-app #panel-home .uhz-pro-tools-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}\n@media(max-width:650px){html.uhz-account-app #panel-home .uhz-pro-tools-grid{grid-template-columns:1fr!important}html.uhz-account-app #panel-home .uhz-pro-tool{min-height:105px!important}}\n';
var CLIENT_JS = `
"use strict";
(function(){
const root=document.documentElement,picker=document.getElementById("uhzAccountThemePicker");
function normalized(v){return v==="classic"||v==="dark"?v:"colorful";}
function apply(v,save){const mode=normalized(v);root.dataset.uhzTheme=mode;root.dataset.theme=mode==="dark"?"dark":"light";root.style.colorScheme=mode==="dark"?"dark":"light";document.body.classList.toggle("dark-mode",mode==="dark");if(picker)picker.value=mode;if(save)try{localStorage.setItem("uhz_header_theme",mode)}catch{}window.dispatchEvent(new CustomEvent("uhz:theme-change",{detail:{theme:mode}}));}
let original="colorful";try{original=localStorage.getItem("uhz_header_theme")}catch{}apply(original,false);
if(picker)picker.addEventListener("change",()=>apply(picker.value,true));
window.addEventListener("storage",e=>{if(e.key==="uhz_header_theme")apply(e.newValue,false)});
window.addEventListener("uhz:theme-change",e=>{const value=normalized(e.detail?.theme);if(picker)picker.value=value});
})();

// This state belongs to the browser document, never to a Worker request.
const UHZ_PAGE_ROUTES={"/iniciar-sesion": {"auth": "login", "section": "home", "title": "Iniciar sesi\xF3n"}, "/registrarse": {"auth": "register", "section": "home", "title": "Crear cuenta"}, "/recuperar-contrasena": {"auth": "recover", "section": "home", "title": "Recuperar tu cuenta"}, "/nueva-contrasena": {"auth": "reset", "section": "home", "title": "Nueva contrase\xF1a"}, "/verificar-cuenta": {"auth": "confirm", "section": "home", "title": "Verifica tu acceso"}, "/mi-cuenta": {"auth": "login", "section": "home", "title": "Mi cuenta"}, "/comunidad": {"auth": "login", "section": "community", "title": "Comunidad"}, "/perfil": {"auth": "login", "section": "profile", "title": "Mi perfil"}, "/coins": {"auth": "login", "section": "coins", "title": "Mis Coins"}, "/usuarios": {"auth": "login", "section": "users", "title": "Administraci\xF3n"}};
const UHZ_ACCOUNT_ALIASES={"inicio": "/mi-cuenta", "coins": "/coins", "acceso": "/iniciar-sesion", "registro": "/registrarse", "recuperar": "/recuperar-contrasena", "comunidad": "/comunidad", "perfil": "/perfil", "usuarios": "/usuarios", "administracion": "/usuarios"};
const UHZ_PAGE_SECTIONS=new Set(['home','community','contribute','rights','works','chat','comunichat','profile','feedback','coins','favorites','users','create','notifications','moderation','marketplace','shipping','plus','thread']);
const UHZ_IS_PAGE=window.parent===window;
// Apply the route's visual state before any account data or network call.
const uhzEntryPath=location.pathname.replace(/\\/+$/,'');
if(uhzEntryPath==='/mi-cuenta'&&(!new URLSearchParams(location.search).has('section')||['home','profile'].includes(new URLSearchParams(location.search).get('section'))))document.documentElement.classList.add('uhz-account-hub-route');
if(uhzEntryPath==='/perfil')document.documentElement.classList.add('uhz-profile-edit-route');
if(UHZ_IS_PAGE)document.documentElement.classList.add('uhz-standalone-account');
else if(new URLSearchParams(location.search).get('embed')==='1')document.documentElement.classList.add('embedded');
function uhzInitialPageRoute(){
 const query=new URLSearchParams(location.search),path=location.pathname.replace(/\\/$/,'');
 const route=UHZ_PAGE_ROUTES[path]||UHZ_PAGE_ROUTES[UHZ_ACCOUNT_ALIASES[query.get('cuenta')]]||{auth:query.get('auth')||'login',section:'home'};
 const section=query.get('section');const mapped=['community','chat','comunichat'].includes(section)?'community':section;return {...route,section:UHZ_PAGE_SECTIONS.has(mapped)?mapped:route.section};
}
const UHZ_INITIAL_ROUTE=uhzInitialPageRoute();
  // Read only supported auth-return fields, then remove them before other UI work.
  function takeAuthReturn() {
    const url = new URL(location.href), hash = new URLSearchParams(url.hash.slice(1)), payload = new URLSearchParams();
    const tokenHash = hash.get('token_hash') || url.searchParams.get('token_hash');
    const refreshToken = hash.get('refresh_token');
    const queryAuthError = UHZ_IS_PAGE || ['acceso', 'registro', 'recuperar'].includes(url.searchParams.get('cuenta'));
    const error = hash.get('error') || (queryAuthError ? url.searchParams.get('error') : null);
    const code = hash.get('error_code') || (queryAuthError ? url.searchParams.get('error_code') : null);
    if (!tokenHash && !refreshToken && !error && !code && !hash.has('access_token')) return null;
    if (tokenHash && /^[A-Za-z0-9_-]{16,256}$/.test(tokenHash)) payload.set('token_hash', tokenHash);
    else if (refreshToken && /^[A-Za-z0-9_-]{8,256}$/.test(refreshToken)) payload.set('refresh_token', refreshToken);
    else if (!error && !code) payload.set('error_code', 'invalid_link');
    const type = hash.get('type') || url.searchParams.get('type') || (UHZ_INITIAL_ROUTE.auth === 'recover' || UHZ_INITIAL_ROUTE.auth === 'reset' ? 'recovery' : 'signup');
    if (['recovery', 'signup', 'email'].includes(type)) payload.set('type', type);
    else { payload.delete('token_hash'); payload.delete('refresh_token'); payload.set('error_code', 'invalid_link'); }
    if (error) payload.set('error', 'access_denied');
    if (code) payload.set('error_code', String(code).slice(0,80));
    for (const key of ['token_hash','token','access_token','refresh_token','expires_at','expires_in','token_type','type','error','error_code','error_description']) url.searchParams.delete(key);
    url.hash = ''; history.replaceState(null, '', url.pathname + url.search);
    return '#' + payload.toString();
  }

let UHZ_PAGE_RETURN=UHZ_IS_PAGE?takeAuthReturn():null;
function uhzRequestedSection(){
 const url=new URL(location.href),section=url.searchParams.get('section'),pathname=url.pathname.replace(/\\/+$/,'');
 if(pathname==='/perfil')return 'profile';
 if(pathname==='/mi-cuenta'&&(!section||section==='home'||section==='profile'))return 'home';
 return ['community','chat','comunichat'].includes(section)?'community':UHZ_PAGE_SECTIONS.has(section)?section:UHZ_PAGE_ROUTES[pathname]?.section||UHZ_INITIAL_ROUTE.section||'home';
}
function uhzSectionUrl(section){
 return ({home:'/mi-cuenta',community:'/mi-cuenta?section=comunichat',profile:'/perfil',coins:'/coins',users:'/usuarios'})[section]||'/mi-cuenta?section='+encodeURIComponent(UHZ_PAGE_SECTIONS.has(section)?section:'home');
}
function uhzAuthUrl(part,section='home'){
 const path=({authLogin:'/iniciar-sesion',authRegister:'/registrarse',authRecover:'/recuperar-contrasena',authReset:'/nueva-contrasena',authConfirm:'/verificar-cuenta'})[part]||'/iniciar-sesion';
 return path+(UHZ_PAGE_SECTIONS.has(section)&&section!=='home'?'?section='+encodeURIComponent(section):'');
}
function uhzUpdatePageLinks(section){
 for(const [id,part]of [['showRegister','authRegister'],['showRecover','authRecover'],['backLogin1','authLogin'],['backLogin2','authLogin'],['callbackRecover','authRecover']]){
  const link=document.getElementById(id);if(link?.tagName==='A')link.setAttribute('href',uhzAuthUrl(part,section));
 }
 document.querySelectorAll('.uhz-page-auth-nav a').forEach(link=>{
  if(link.getAttribute('href')===location.pathname)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
}
function uhzSyncAuthPage(part){
 if(!UHZ_IS_PAGE)return;
 // Keep account and profile at their canonical URLs, including when sessions refresh.
 if(['/mi-cuenta','/perfil','/coins'].includes(location.pathname.replace(/\\/+$/,'')))return;
 const section=uhzRequestedSection();history.replaceState(null,'',uhzAuthUrl(part,section));uhzUpdatePageLinks(section);
 const label={authLogin:'Iniciar sesi\xF3n',authRegister:'Crear cuenta',authRecover:'Recuperar tu cuenta',authReset:'Nueva contrase\xF1a',authConfirm:'Verifica tu acceso'}[part]||'Mi cuenta';
 document.title=label+' | UNIVERSHZRW';
}

const ROOT="/_uhz/portal/backend",PUB="sb_publishable_9_e9NT4HdGejxqZ4mJ2yCw_5HoLAYQr";
const UHZ_AUTH_RETURN="https://univershzrw.com/_uhz/portal/?embed=1";
const SESSION_KEY="uhz_community_session_v1";
const state={session:null,user:null,profile:null,threads:[],offset:0,category:"todas",thread:null,authMode:"authLogin",recoveryActive:false,callbackPending:false};
const $=id=>document.getElementById(id);
const fmt=d=>new Date(d).toLocaleDateString("es-MX",{year:"numeric",month:"short",day:"numeric"});
const safe=s=>String(s==null?"":s);
function notify(text,error=false){const e=$("toast");e.textContent=safe(text);e.classList.toggle("error",error);e.classList.remove("hide");clearTimeout(notify.t);notify.t=setTimeout(()=>e.classList.add("hide"),6500)}
function errText(e){return safe(e&&e.message?e.message:e)}
function saveSession(s){state.session={access_token:"cookie",refresh_token:"cookie",expires_at:Date.now()+3600000};sessionStorage.removeItem(SESSION_KEY)}
function forget(){state.session=null;state.user=null;state.profile=null;state.recoveryActive=false;state.callbackPending=false;sessionStorage.removeItem(SESSION_KEY)}
async function auth(path,method,body,token){
 const headers={"apikey":PUB,"content-type":"application/json"};
 if(token)headers.authorization="Bearer "+token;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await fetch(ROOT+"/auth/v1/"+path,{method,headers,credentials:"same-origin",cache:"no-store",body:body?JSON.stringify(body):undefined,signal:controller.signal});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.msg||data.error_description||data.message||data.error||"No se pudo completar la solicitud. Vuelve a intentarlo.");
  return data;
 }catch(error){
  if(error.name==='AbortError')throw Error('La conexi\xF3n tard\xF3 demasiado. Comprueba tu internet y vuelve a intentarlo.');
  if(error instanceof TypeError)throw Error('No se pudo conectar. Comprueba tu internet y vuelve a intentarlo.');
  throw error;
 }finally{clearTimeout(timeout)}
}
async function token(){return state.session?"cookie":null;}

async function restful(path,opts={},publicRequest=false){
 const key=publicRequest?null:await token();
 if(!publicRequest&&!key)throw Error("Debes iniciar sesi\xF3n");
 const headers={"apikey":PUB,...(key?{authorization:"Bearer "+key}:{}),...(opts.body?{"content-type":"application/json"}:{}),...(opts.headers||{})};
 const response=await fetch(ROOT+"/rest/v1/"+path,{method:opts.method||"GET",headers,body:opts.body?JSON.stringify(opts.body):undefined});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.message||data.details||data.error||"No se pudo consultar Supabase")}
 if(response.status===204||response.headers.get("content-length")==="0")return null;
 return response.json().catch(()=>null);
}
const rpc=(name,params={})=>restful("rpc/"+name,{method:"POST",body:params});
async function currentUser(){const key=await token();if(!key)throw Error("No tienes una sesi\xF3n");state.user=await auth("user","GET",null,key);return state.user}
async function ensureProfile(){
 const u=state.user;if(!u)return;if(u.must_change_password){state.profile={display_name:'UNIVERSHZRW',avatar_preset:'quantum'};return;}
 const rows=await restful("community_profiles?user_id=eq."+encodeURIComponent(u.id)+"&select=user_id,display_name,about,avatar_key,avatar_preset");
 if(rows&&rows[0]){state.profile=rows[0];return}
 const display=safe(u.user_metadata&&u.user_metadata.display_name||u.email&&u.email.split("@")[0]||"Miembro").slice(0,48);
 const payload={user_id:u.id,display_name:display.length<2?"Miembro":display};
 await restful("community_profiles",{method:"POST",body:payload,headers:{Prefer:"return=minimal"}});
 state.profile=payload;
}
function authFeedback(id,text,error=false){
 const box=$(id);if(!box)return;
 box.textContent=safe(text);box.classList.toggle('hide',!text);box.classList.toggle('error',error);
 box.setAttribute('role',error?'alert':'status');if(error&&text)box.focus();
}
async function authSubmit(form,feedback,pending,task){
 if(form.dataset.busy==='true')return;
 const button=form.querySelector('button[type="submit"]'),label=button?.textContent;
 form.dataset.busy='true';form.setAttribute('aria-busy','true');
 if(button){button.disabled=true;button.textContent=pending}authFeedback(feedback,'');
 try{await task()}catch(error){authFeedback(feedback,errText(error),true)}
 finally{delete form.dataset.busy;form.removeAttribute('aria-busy');if(button){button.disabled=false;button.textContent=label}}
}
function authPart(part,focus=false,sync=true){
 const titles={authLogin:'Iniciar sesi\xF3n',authRegister:'Crear cuenta',authRecover:'Recuperar tu cuenta',authReset:'Nueva contrase\xF1a',authConfirm:'Verifica tu acceso'};
 if(!titles[part])part='authLogin';state.authMode=part;
 $('authHeading').textContent=titles[part];
 ['authLogin','authRegister','authRecover','authReset','authConfirm'].forEach(id=>$(id).classList.toggle('hide',id!==part));
 if(focus)$('authHeading').focus();
 if(sync)uhzSyncAuthPage(part);
}
async function prepareAccountProfile(){
 try{await ensureProfile()}catch{
  state.profile={display_name:safe(state.user?.user_metadata?.display_name||state.user?.email?.split('@')[0]||'Miembro'),avatar_preset:'quantum'};
  notify('Tu sesi\xF3n est\xE1 activa. El perfil no pudo cargarse; puedes volver a intentarlo desde Mi perfil.',true);
 }
}
async function acceptAuthSession(data,recovery=false){
 if(!data?.access_token)throw Error('No se pudo confirmar la sesi\xF3n. Vuelve a intentarlo.');
 saveSession(data);state.user=data.user||await currentUser();
 if(!state.user?.email_confirmed_at){forget();throw Error('Verifica tu correo antes de iniciar sesi\xF3n.')}
 state.callbackPending=false;state.recoveryActive=recovery;
 if(recovery){setAuthReturnMode('reset');authPart('authReset');showApp();return}
 await prepareAccountProfile();showApp();
}
function setAuthReturnMode(mode){
 if(UHZ_IS_PAGE){uhzSyncAuthPage(({reset:'authReset',login:'authLogin',recover:'authRecover'})[mode]||'authLogin');return;}
 const query=new URLSearchParams(location.search);for(const key of ['token_hash','type','error','error_code','error_description'])query.delete(key);
 query.set('embed','1');query.set('auth',mode);history.replaceState(null,'',location.pathname+'?'+query.toString());
}
function showApp(){
 if(state.user?.must_change_password||state.recoveryActive){
  ["welcome","intro","privateArea"].forEach(id=>$(id).classList.add("hide"));$("authArea").classList.remove("hide");
  document.querySelectorAll(".member-btn").forEach(x=>x.classList.add("hide"));$("uhzEmbedNav")?.classList.remove("uhz-embed-active");
  authPart("authReset");
  $('authHeading').textContent=state.recoveryActive?'Nueva contrase\xF1a':'Configura tu contrase\xF1a definitiva';
  $('authDescription').textContent=state.recoveryActive?'Elige una contrase\xF1a de al menos 10 caracteres y conf\xEDrmala.':'Elige una contrase\xF1a nueva de al menos 10 caracteres para completar tu acceso.';
  return;
 }

 const active=!!state.user?.email_confirmed_at;const embedNav=document.getElementById("uhzEmbedNav");if(embedNav)embedNav.classList.toggle("uhz-embed-active",active);
 ["welcome","intro","authArea"].forEach(id=>$(id).classList.toggle("hide",active));
 $("privateArea").classList.toggle("hide",!active);
 document.querySelectorAll(".member-btn").forEach(el=>el.classList.toggle("hide",!active));
 if(active){$("welcomeMember").textContent="Bienvenido, "+safe(state.profile?.display_name||"Miembro")+"."; $("memberEmail").textContent="Correo de acceso: "+safe(state.user.email);$("profileName").value=safe(state.profile?.display_name||"");$("profileAbout").value=safe(state.profile?.about||"");document.querySelectorAll(".moderator-only").forEach(x=>x.classList.add("hide"));panel(uhzRequestedSection());void loadAdminState()}
}
function panel(id){
 if(id==='chat'||id==='comunichat')id='community';
 // The dashboard has no private content and can render while profile data loads.
 const route=location.pathname.replace(/\\/+$/,'');if(route==='/mi-cuenta')document.documentElement.classList.toggle('uhz-account-hub-route',id==='home');
 // Account home and edit-profile are distinct authenticated views.
 if(location.hostname!=='admin.univershzrw.com'&&['users','moderation'].includes(id)){location.assign('https://admin.univershzrw.com/'+(id==='moderation'?'?modulo=moderacion':''));return;}
 if(!state.user){if(id==='home'&&route==='/mi-cuenta'){document.querySelectorAll('.app-panel').forEach(e=>e.classList.add('hide'));document.getElementById('panel-home')?.classList.remove('hide');}window.scrollTo({top:0,behavior:"smooth"});return}
 document.querySelectorAll(".app-panel").forEach(e=>e.classList.add("hide"));
 const target=$("panel-"+id);if(!target)return;
 target.classList.remove("hide");
 document.querySelectorAll("[data-panel]").forEach(e=>e.classList.toggle("active",e.dataset.panel===id));
 window.scrollTo({top:0,behavior:"smooth"});
 if(id==="community")loadThreads(true);
 if(id==="contribute")loadContributions();
 if(id==="shipping")loadProducts();
 if(id==="notifications")loadNotices();if(id==="favorites")loadMyFavorites();if(id==="moderation")loadModeratorReports();if(id==="profile"){loadMyAvatar();loadPreferences();}
}
function el(tag,text,cls){const x=document.createElement(tag);if(text!==undefined&&text!==null)x.textContent=safe(text);if(cls)x.className=cls;return x}
function clear(id){$(id).replaceChildren()}
function renderCategories(){
 const target=$("categories");target.replaceChildren();
 const all=[["todas","Todas"],["general","General"],["ayuda","Ayuda"],["tecnologia","Tecnolog\xEDa"],["educacion","Educaci\xF3n"],["investigacion","Investigaci\xF3n"],["creacion","Creaci\xF3n"]];
 for(const [key,name] of all){const c=el("button",name,"chip"+(state.category===key?" selected":""));c.onclick=()=>{state.category=key;renderCategories();renderThreads()};target.append(c)}
}
function renderThreads(){
 const root=$("threads");root.replaceChildren();
 const search=$("topicSearch").value.trim().toLowerCase();
 const rows=state.threads.filter(t=>(state.category==="todas"||t.category===state.category)&&(!search||(safe(t.title)+" "+safe(t.preview)).toLowerCase().includes(search)));
 if(!rows.length){root.append(el("div","No hay publicaciones que coincidan. Puedes hacer la primera pregunta.","card muted"));return}
 for(const t of rows){
  const wrap=el("article",null,"post");
  wrap.append(el("div",safe(t.category).toUpperCase()+" \xB7 "+fmt(t.created_at),"meta"));
  const b=el("button",t.title);b.className="post-title";b.style.fontSize="18px";b.style.textAlign="left";b.onclick=()=>openThread(t.id);
  wrap.append(el("h3"));wrap.lastChild.append(b);
  wrap.append(el("p",t.preview));
  wrap.append(el("div","Por "+safe(t.author_name)+" \xB7 "+t.reply_count+" respuesta(s)","meta"));
  root.append(wrap);
 }
}
async function loadThreads(reset){
 try{
 if(reset){state.offset=0;state.threads=[];$("threads").replaceChildren(el("p","Cargando publicaciones...","muted"))}
 const data=await rpc("community_list_threads",{p_limit:15,p_offset:state.offset});
 state.threads=state.threads.concat(Array.isArray(data)?data:[]);
 state.offset=state.threads.length;
 renderCategories();renderThreads();
 $("loadMore").disabled=!Array.isArray(data)||data.length<15;
 }catch(e){notify("No se pudo cargar la comunidad: "+errText(e),true);$("threads").replaceChildren(el("p","No disponible temporalmente.","muted"))}
}
async function openThread(id){
 try{
 state.thread=await rpc("community_get_thread",{p_id:id});
 if(!state.thread)throw Error("Publicaci\xF3n no encontrada");
 $("detailTitle").textContent=state.thread.title;
 $("detailBody").textContent=state.thread.body;
 $("detailCategory").textContent=safe(state.thread.category).toUpperCase();
 $("detailMeta").textContent="Por "+state.thread.author_name+" \xB7 "+fmt(state.thread.created_at);
 $("videoSpot").replaceChildren();
 const video=state.thread.youtube_url||"";
 let vid="";
 try{const url=new URL(video);if(url.hostname==="youtu.be")vid=url.pathname.replace("/","");else if(["youtube.com","www.youtube.com"].includes(url.hostname))vid=url.searchParams.get("v")||""}catch{}
 if(/^[A-Za-z0-9_-]{11}$/.test(vid)){const frame=document.createElement("iframe");frame.src="https://www.youtube-nocookie.com/embed/"+vid;frame.width="100%";frame.height="315";frame.title="Video relacionado";frame.loading="lazy";frame.referrerPolicy="no-referrer";frame.allow="encrypted-media; picture-in-picture";frame.style.marginTop="20px";frame.style.border="0";frame.style.borderRadius="12px";$("videoSpot").append(frame)}
 panel("thread");await loadReplies();
 }catch(e){notify(errText(e),true)}
}
async function loadReplies(){
 try{
 const data=await rpc("community_list_replies",{p_thread_id:state.thread.id});
 const root=$("replies");root.replaceChildren();
 if(!data||!data.length){root.append(el("p","Todav\xEDa no hay respuestas.","muted"));return}
 for(const r of data){
  const wrap=el("div",null,"answer"+(r.is_accepted?" accepted":""));
  wrap.append(el("strong",r.author_name+(r.is_accepted?" \xB7 Respuesta aceptada":"")));
  wrap.append(el("div",r.body,"content"));
  wrap.append(el("div",fmt(r.created_at),"small muted"));
  if(state.thread.author_id===state.user.id&&!r.is_accepted){const btn=el("button","\u2713 Marcar como soluci\xF3n","button ghost");btn.onclick=async()=>{try{await rpc("community_accept_reply",{p_thread_id:state.thread.id,p_reply_id:r.id});notify("Respuesta aceptada");await loadReplies()}catch(e){notify(errText(e),true)}};wrap.append(btn)}
  root.append(wrap);
 }
 }catch(e){notify(errText(e),true)}
}
async function loadContributions(){
 try{const list=await rpc("community_my_contributions");clear("myContributions");if(!list||!list.length){$("myContributions").append(el("p","Todav\xEDa no has enviado aportaciones.","muted"));return}for(const a of list){const c=el("div",null,"post");c.append(el("strong",a.title));c.append(el("p","Estado: "+a.management_status+" \xB7 "+fmt(a.received_at),"small"));$("myContributions").append(c)}}catch(e){notify(errText(e),true)}
}
async function loadProducts(){
 try{const items=await restful("products?select=id,name,price,currency,shipping_cost,requires_shipping&publish=eq.true&status=eq.ACTIVO&requires_shipping=eq.true&order=name.asc",{},true);const select=$("shipProduct");select.replaceChildren();select.append(new Option("Selecciona un producto",""));for(const p of items||[]){select.append(new Option(p.name+" \xB7 "+Number(p.price).toLocaleString("es-MX",{style:"currency",currency:p.currency||"MXN"}),p.id))}if(!items||!items.length)select.append(new Option("Sin productos f\xEDsicos publicados",""))}catch(e){notify("Cat\xE1logo de env\xEDos no disponible: "+errText(e),true)}
}
async function loadNotices(){
 try{const u=state.user;const list=await rpc("uhz_notifications");const root=$("userNotifications");root.replaceChildren();if(!list.length)root.append(el("p","Sin notificaciones nuevas.","muted"));for(const n of list){const c=el("article",null,"post");c.append(el("strong",n.body));c.append(el("p",fmt(n.created_at),"small"));root.append(c)}}catch(e){notify(errText(e),true)}
}
async function postGuest(path,body){return auth(path,"POST",body)}
async function authenticate(){
 const data=await postGuest("token?grant_type=password",{email:$("loginEmail").value.trim(),password:$("loginPassword").value});
 await acceptAuthSession(data);$("loginPassword").value="";notify("Sesi\xF3n iniciada correctamente");
}
function bind(){
 document.querySelectorAll("[data-panel]").forEach(b=>b.addEventListener("click",()=>panel(b.dataset.panel)));const embedExit=document.getElementById("uhzEmbedLogout");if(embedExit)embedExit.addEventListener("click",()=>document.getElementById("exit").click());
 $("goJoin").onclick=()=>{authPart("authRegister");$("authArea").scrollIntoView({behavior:"smooth"})};
 $('showRegister').onclick=()=>{if($('loginEmail').value)$('registerEmail').value=$('loginEmail').value;authPart('authRegister',true)};
 $('showRecover').onclick=()=>{if($('loginEmail').value)$('recoverEmail').value=$('loginEmail').value;authPart('authRecover',true)};
 $('backLogin1').onclick=$('backLogin2').onclick=()=>authPart('authLogin',true);
 $('callbackRecover').onclick=()=>{state.callbackPending=false;authPart('authRecover',true)};
 document.querySelectorAll('[data-password]').forEach(button=>button.onclick=()=>{const input=$(button.dataset.password),visible=input.type==='password';input.type=visible?'text':'password';button.textContent=visible?'Ocultar':'Mostrar';button.setAttribute('aria-label',visible?'Ocultar contrase\xF1a':'Mostrar contrase\xF1a');button.setAttribute('aria-pressed',String(visible))});
 $('registerConfirm').oninput=()=>$('registerConfirm').setCustomValidity('');
 $('newPasswordConfirm').oninput=()=>$('newPasswordConfirm').setCustomValidity('');
 $('loginForm').onsubmit=e=>{e.preventDefault();return authSubmit(e.currentTarget,'loginFeedback','Entrando\u2026',authenticate)};
 $('registerForm').onsubmit=e=>{e.preventDefault();return authSubmit(e.currentTarget,'registerFeedback','Creando cuenta\u2026',async()=>{
  const password=$('registerPassword').value;
  if(password!==$('registerConfirm').value)throw Error('Las contrase\xF1as no coinciden. Revisa la confirmaci\xF3n.');
  if(password.length<12)throw Error('Utiliza una contrase\xF1a de al menos 12 caracteres.');
  if(($('registerWebsite')?.value||'').trim())throw Error('No pudimos verificar la solicitud.');
  const captchaToken=document.querySelector('input[name="cf-turnstile-response"]')?.value||'';
  if(!captchaToken)throw Error('Completa la verificaci\xF3n de seguridad gratuita para continuar.');
  try{await postGuest('signup?email_redirect_to='+encodeURIComponent(UHZ_AUTH_RETURN),{email:$('registerEmail').value.trim(),password,turnstileToken:captchaToken,website:$('registerWebsite')?.value||'',data:{display_name:$('registerName').value.trim()}})}finally{if(window.turnstile)try{window.turnstile.reset()}catch{}}
  $('loginEmail').value=$('registerEmail').value.trim();$('registerPassword').value=$('registerConfirm').value='';
  authFeedback('registerFeedback','Solicitud recibida. Revisa tu correo para verificar la cuenta. Si ya tienes una cuenta, inicia sesi\xF3n.');
 })};
 $('recoverForm').onsubmit=e=>{e.preventDefault();return authSubmit(e.currentTarget,'recoverFeedback','Enviando enlace\u2026',async()=>{
  await postGuest('recover?redirect_to='+encodeURIComponent(UHZ_AUTH_RETURN),{email:$('recoverEmail').value.trim()});
  authFeedback('recoverFeedback','Si existe una cuenta con ese correo, recibir\xE1s un enlace para recuperar el acceso. Revisa tu bandeja de entrada y spam.');
 })};
 $('resetForm').onsubmit=e=>{e.preventDefault();return authSubmit(e.currentTarget,'resetFeedback','Guardando contrase\xF1a\u2026',async()=>{
  if($('newPassword').value!==$('newPasswordConfirm').value)throw Error('Las contrase\xF1as no coinciden. Revisa la confirmaci\xF3n.');
  await auth('user','PUT',{password:$('newPassword').value},await token());
  $('resetForm').reset();setAuthReturnMode('login');forget();showApp();authPart('authLogin',true);
  authFeedback('loginFeedback','Contrase\xF1a actualizada. Inicia sesi\xF3n con tu nueva contrase\xF1a.');
 })};
 $("exit").onclick=async()=>{try{const t=await token();await auth("logout","POST",null,t)}catch{}forget();showApp();authPart("authLogin");notify("Sesi\xF3n cerrada")};
 $("reloadThreads").onclick=()=>loadThreads(true);
 $("loadMore").onclick=()=>loadThreads(false);
 $("topicSearch").oninput=renderThreads;
 $("threadForm").onsubmit=async e=>{e.preventDefault();try{const id=await rpc("community_create_thread",{p_title:$("threadTitle").value.trim(),p_body:$("threadBody").value.trim(),p_category:$("threadCategory").value,p_youtube_url:$("threadYoutube").value.trim()||null});$("threadForm").reset();notify("Tu pregunta fue publicada correctamente.");panel((()=>{const s=new URLSearchParams(location.search).get("section");return ["community","contribute","rights","works","chat","profile","feedback"].includes(s)?s:"community"})())}catch(err){notify(errText(err),true)}};
 $("replyForm").onsubmit=async e=>{e.preventDefault();try{await rpc("community_create_reply",{p_thread_id:state.thread.id,p_body:$("replyBody").value.trim()});$("replyForm").reset();notify("Respuesta enviada.");await loadReplies()}catch(err){notify(errText(err),true)}};
 $("saveFavorite").onclick=async()=>{try{await restful("community_favorites",{method:"POST",body:{user_id:state.user.id,thread_id:state.thread.id},headers:{"Prefer":"return=minimal"}});notify("Guardado en favoritos")}catch(err){notify(errText(err),true)}};
 $("reportThread").onclick=async()=>{const reason=prompt("Describe el motivo del reporte (10 a 500 caracteres)");if(!reason)return;try{await rpc("community_report",{p_thread_id:state.thread.id,p_reply_id:null,p_reason:reason});notify("El reporte fue recibido para revisi\xF3n.")}catch(err){notify(errText(err),true)}};
 $("contributeForm").onsubmit=async e=>{e.preventDefault();if(!$("contribRights").checked){notify("Confirma tus derechos sobre el aporte",true);return}try{const t=await token();const payload={title:$("contribTitle").value.trim(),category:$("contribCategory").value,content_type:$("contribType").value,license:$("contribLicense").value,source_url:$("contribLink").value.trim(),summary:$("contribSummary").value.trim(),authorship_declaration:true};const resp=await fetch(ROOT+"/functions/v1/uhz-community-contribute",{method:"POST",headers:{"apikey":PUB,"authorization":"Bearer "+t,"content-type":"application/json"},body:JSON.stringify(payload)});const data=await resp.json().catch(()=>({}));if(!resp.ok||!data.ok)throw Error(data.error||"No se pudo enviar el aporte");notify("Aporte recibido. Folio "+String(data.id).slice(0,8)+". Pendiente de revisi\xF3n.");$("contributeForm").reset();loadContributions()}catch(err){notify(errText(err),true)}};
 $("reloadMyContrib").onclick=loadContributions;
 $("shippingForm").onsubmit=async e=>{e.preventDefault();try{const postal=$("postalCode").value.trim();if(!/^[0-9]{5}$/.test(postal))throw Error("Introduce un c\xF3digo postal de cinco d\xEDgitos");const data=await rpc("community_request_shipping_quote",{p_product_id:$("shipProduct").value,p_postal_code:postal,p_quantity:Number($("shipQuantity").value)});$("shippingResult").replaceChildren();const note=el("div",null,"notice success");note.append(el("strong","Solicitud de env\xEDo recibida"));note.append(el("p","Folio "+safe(data.id).slice(0,8)+" \xB7 C\xF3digo postal "+postal));note.append(el("p",(Number(data.shipping_base)>0?"Tarifa base configurada: "+Number(data.shipping_base).toLocaleString("es-MX",{style:"currency",currency:"MXN"})+". ":"Tarifa base a\xFAn sin definir: NO significa env\xEDo gratis. ")+data.note));$("shippingResult").append(note);notify("Cotizaci\xF3n solicitada correctamente")}catch(err){notify(errText(err),true)}};
 $("joinPlus").onclick=async()=>{try{await restful("community_plus_interest",{method:"POST",body:{user_id:state.user.id},headers:{"Prefer":"return=minimal"}});$("plusStatus").textContent="Inter\xE9s registrado. Sin cobro.";notify("Te avisaremos cuando Premium est\xE9 disponible. No se realiz\xF3 ning\xFAn cargo.")}catch(err){if(errText(err).toLowerCase().includes("duplicate")){$("plusStatus").textContent="Ya est\xE1s en la lista.";return}notify(errText(err),true)}};
 $("profileForm").onsubmit=async e=>{e.preventDefault();try{const payload={display_name:$("profileName").value.trim(),about:$("profileAbout").value.trim()};await restful("community_profiles?user_id=eq."+encodeURIComponent(state.user.id),{method:"PATCH",body:payload,headers:{"Prefer":"return=minimal"}});state.profile={...state.profile,...payload};$("welcomeMember").textContent="Bienvenido, "+payload.display_name+".";notify("Perfil actualizado")}catch(err){notify(errText(err),true)}};
 $("reloadNotices").onclick=loadNotices; $("reloadFavorites").onclick=loadMyFavorites; $("reloadModeration").onclick=loadModeratorReports; $("saveEmailPrefs").onclick=async()=>{try{await rpc("community_set_email_preferences",{p_marketing:$("marketingOpt").checked,p_product_updates:$("productOpt").checked});notify("Preferencias de correo actualizadas correctamente")}catch(e){notify(errText(e),true)}}; $("avatarUpload").onchange=async(e)=>{try{await uploadMyAvatar(e.target.files?.[0])}catch(err){notify(errText(err),true)}};
 $("profileRecovery").onclick=()=>{notify("Puedes solicitar el enlace de recuperaci\xF3n desde la pantalla de acceso. Cierra sesi\xF3n para comenzar.")};
}

let uhzAvatarObjectUrl=null;
async function loadMyAvatar(){
 const picture=$("avatarPreview");
 if(!picture)return;
 picture.classList.add("hide");
 const key=state.profile&&state.profile.avatar_key;
 if(!key)return;
 try{
  const tokenValue=await token();
  const url="/_uhz/portal/media/"+key.split("/").map(encodeURIComponent).join("/");
  const response=await fetch(url,{headers:{authorization:"Bearer "+tokenValue},cache:"no-store"});
  if(!response.ok)throw Error("No disponible");
  if(uhzAvatarObjectUrl)URL.revokeObjectURL(uhzAvatarObjectUrl);
  uhzAvatarObjectUrl=URL.createObjectURL(await response.blob());
  picture.src=uhzAvatarObjectUrl;picture.classList.remove("hide");
 }catch(e){console.error("avatar preview unavailable")}
}
async function uploadMyAvatar(file){
 if(!file||!file.type.startsWith("image/"))throw Error("Selecciona una imagen v\xE1lida");
 if(file.size>6000000)throw Error("La imagen original supera 6 MB");
 const bitmap=await createImageBitmap(file);
 const side=Math.min(512,Math.max(bitmap.width,bitmap.height));
 const scale=side/Math.max(bitmap.width,bitmap.height);
 const canvas=document.createElement("canvas");
 canvas.width=Math.max(1,Math.round(bitmap.width*scale));
 canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 canvas.getContext("2d",{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);
 bitmap.close();
 const convert=q=>new Promise(res=>canvas.toBlob(res,"image/webp",q));
 let blob=await convert(.79);
 if(blob&&blob.size>512000)blob=await convert(.55);
 if(!blob||blob.size>512000)throw Error("La imagen sigue siendo demasiado grande");
 const access=await token();
 const response=await fetch("/_uhz/portal/api/upload",{method:"POST",headers:{authorization:"Bearer "+access,"content-type":"image/webp"},body:blob});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.ok)throw Error(data.error||"No se pudo subir la imagen");
 await restful("community_profiles?user_id=eq."+encodeURIComponent(state.user.id),{method:"PATCH",body:{avatar_key:data.key},headers:{"Prefer":"return=minimal"}});
 state.profile.avatar_key=data.key;
 await loadMyAvatar();
 notify("Imagen de perfil actualizada.");
}


async function loadPreferences(){
 try{const rows=await restful("community_email_preferences?user_id=eq."+encodeURIComponent(state.user.id)+"&select=marketing_opt_in,product_updates_opt_in");
 $("marketingOpt").checked=!!rows?.[0]?.marketing_opt_in;
 $("productOpt").checked=!!rows?.[0]?.product_updates_opt_in;
 }catch(e){notify("No fue posible consultar preferencias",true)}
}


async function loadMyFavorites(){
 try{
 const list=await rpc("community_my_favorites");
 const target=$("favoriteItems");target.replaceChildren();
 if(!Array.isArray(list)||!list.length){target.append(el("p","Todav\xEDa no has guardado preguntas.","muted"));return}
 for(const f of list){const card=el("article",null,"post");const title=el("button",f.title);title.style.fontSize="17px";title.onclick=()=>openThread(f.id);card.append(title,el("p",safe(f.category)+" \xB7 "+safe(f.author_name),"small"));target.append(card)}
 }catch(e){notify(errText(e),true)}
}
async function loadAdminState(){
 try{const isAdmin=await rpc("uhz_community_is_admin");document.querySelectorAll(".moderator-only").forEach(x=>x.classList.toggle("hide",isAdmin!==true))}
 catch{document.querySelectorAll(".moderator-only").forEach(x=>x.classList.add("hide"))}
}
async function loadModeratorReports(){
 try{
 const reports=await rpc("uhz_community_admin_reports",{p_limit:30});
 const root=$("moderationItems");root.replaceChildren();
 if(!reports||!reports.length){root.append(el("p","No hay reportes pendientes.","muted"));return}
 for(const r of reports){
  const card=el("article",null,"post");
  card.append(el("strong","Reporte comunitario \xB7 "+fmt(r.created_at)),el("div",r.reason,"content"));
  const actions=el("div",null,"actions");
  for(const [action,label] of [["hide","Ocultar contenido"],["dismiss","Descartar reporte"]]){
   const btn=el("button",label,"button "+(action==="hide"?"":"ghost"));
   btn.onclick=async()=>{
    if(!confirm("\xBFConfirmas la revisi\xF3n de este reporte?"))return;
    try{await rpc("uhz_community_review_report",{p_report_id:r.id,p_action:action});notify("Reporte procesado");await loadModeratorReports()}
    catch(e){notify(errText(e),true)}
   };actions.append(btn);
  }
  card.append(actions);root.append(card);
 }
 }catch(e){notify("No fue posible consultar los reportes: "+errText(e),true)}
}

async function start(){
 bind();
 const query=new URLSearchParams(location.search),hash=new URLSearchParams((UHZ_PAGE_RETURN||location.hash).slice(1));
 if(UHZ_IS_PAGE)UHZ_PAGE_RETURN=null;
 const mode=query.get('auth')||UHZ_INITIAL_ROUTE.auth,type=query.get('type')||hash.get('type'),tokenHash=query.get('token_hash')||hash.get('token_hash'),refreshToken=hash.get('refresh_token');
 authPart(mode==='register'?'authRegister':mode==='recover'?'authRecover':mode==='reset'?'authReset':mode==='confirm'?'authConfirm':'authLogin',false,false);
 if(hash.get('error')||hash.get('error_code')||query.get('error')||query.get('error_code')){
  if(UHZ_IS_PAGE)uhzSyncAuthPage('authRecover');else history.replaceState(null,'',location.pathname+'?embed=1&auth=recover');
  authPart('authRecover');authFeedback('recoverFeedback','El enlace no es v\xE1lido o ya caduc\xF3. Escribe tu correo para solicitar uno nuevo.',true);
  document.documentElement.classList.add('uhz-ui-ready');return;
 }
 if(tokenHash||refreshToken){
  if(!UHZ_IS_PAGE)history.replaceState(null,'',location.pathname+'?embed=1');state.callbackPending=true;authPart('authConfirm');
  $('callbackMessage').textContent=type==='recovery'?'Confirma que solicitaste recuperar tu cuenta. Despu\xE9s podr\xE1s elegir una contrase\xF1a nueva.':'Confirma tu correo para activar tu cuenta de UNIVERSHZRW.';
  document.documentElement.classList.add('uhz-ui-ready');
  $('callbackForm').onsubmit=e=>{e.preventDefault();return authSubmit(e.currentTarget,'callbackFeedback','Verificando\u2026',async()=>{
   const data=await auth(tokenHash?'verify':'session','POST',tokenHash?{token_hash:tokenHash,type:type||'signup'}:{refresh_token:refreshToken});
   await acceptAuthSession(data,type==='recovery');
   if(type!=='recovery')notify('Correo verificado. Bienvenido a UNIVERSHZRW.');
  })};return;
 }
 if(mode==='confirm'){authPart('authRecover');authFeedback('recoverFeedback','Abre el enlace completo de tu correo o solicita uno nuevo para continuar.',true);document.documentElement.classList.add('uhz-ui-ready');return;}
 try{saveSession({});await currentUser()}catch{forget();if(mode==='reset'){authPart('authRecover');authFeedback('recoverFeedback','Vuelve a abrir el enlace del correo o solicita uno nuevo para cambiar tu contrase\xF1a.',true)}showApp();return}
 if(mode==='reset'){state.recoveryActive=true;authPart('authReset');showApp();return}
 await prepareAccountProfile();showApp();
}
start();


(function(){
 const root=document.documentElement;
 const path=location.pathname.replace(/\\/+$/,'')||'/mi-cuenta';if(path==='/perfil')root.classList.add('uhz-profile-edit-route');else if(path==='/mi-cuenta')root.classList.add('uhz-account-hub-route');if(path==='/perfil')document.title='Editar mi perfil | UNIVERSHZRW';else if(path==='/mi-cuenta')document.title='Mi cuenta | UNIVERSHZRW';
 if(path!=='/perfil')return; // Do not request or expose private fields on the /mi-cuenta dashboard.
 const form=document.getElementById('uhzPrivateForm'),area=document.getElementById('privateArea');
 if(!form||!area)return;
 const $=(id)=>document.getElementById(id),endpoint='/_uhz/portal/api/private-profile';
 const sensitive=['dc3_curp','dc3_rfc','dc3_company_rfc'];
 let ready=false, loading=false;
 function setStatus(msg,error){const el=$('uhxpStatus');el.textContent=msg;el.dataset.error=error?'true':'false'}
 function showFields(data){for(const el of form.querySelectorAll('[data-private-field]'))el.value=data.fields?.[el.dataset.privateField]||'';const mail=$('uhxp_login_email');mail.value=data.email||'';for(const key of sensitive){const e=$('uhxp_mask_'+key);e.textContent=data.fields?.[key+'_saved']?'Guardado: '+(data.fields[key+'_masked']||'********'):'No registrado';const input=form.querySelector('[data-private-sensitive="'+key+'"]');input.value='';input.type='password';input.placeholder=data.fields?.[key+'_saved']?'Para cambiar, escribe el dato nuevo':'Ingresa el dato si lo necesitas';form.querySelector('[data-clear-private="'+key+'"]').checked=false} $('uhzPrivateLoading').hidden=true;ready=true}
 async function request(method,payload){const response=await fetch(endpoint,{method,credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:payload?JSON.stringify(payload):undefined});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw Error(data.message||'No se pudo acceder al perfil privado');return data}
 async function load(){if(loading||ready||area.classList.contains('hide'))return;loading=true;try{showFields(await request('GET'));setStatus('Tu informaci\xF3n privada est\xE1 protegida y lista para editar.',false)}catch(e){setStatus(e.message||'No fue posible cargar tus datos.',true)}finally{loading=false}}
 const observer=new MutationObserver(load);observer.observe(area,{attributes:true,attributeFilter:['class']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else void load();
 form.addEventListener('submit',async e=>{e.preventDefault();if(!ready){setStatus('Primero debemos cargar tu sesi\xF3n privada.',true);return}if(!form.reportValidity())return;const button=$('uhxpSave');button.disabled=true;button.textContent='Guardando\u2026';setStatus('Protegiendo y guardando tus datos\u2026',false);let fields={};for(const el of form.querySelectorAll('[data-private-field]'))fields[el.dataset.privateField]=el.value.trim();for(const el of form.querySelectorAll('[data-private-sensitive]'))if(el.value.trim())fields[el.dataset.privateSensitive]=el.value.trim().toUpperCase();let payload={fields};for(const key of sensitive)if(form.querySelector('[data-clear-private="'+key+'"]').checked)payload['clear_'+key]=true;try{const result=await request('PUT',payload);showFields(result);setStatus('Informaci\xF3n guardada y cifrada. Los datos sensibles permanecen ocultos.',false)}catch(error){setStatus(error.message||'Error al guardar.',true)}finally{button.disabled=false;button.textContent='Guardar datos privados'}});
 for(const el of form.querySelectorAll('[data-reveal]'))el.addEventListener('click',()=>{const input=$(el.dataset.reveal);input.type=input.type==='password'?'text':'password';el.textContent=input.type==='password'?'Mostrar':'Ocultar'});
 window.addEventListener('pageshow',()=>{if(ready)return;void load()});
})();


(()=>{'use strict';
const endpoint='/_uhz/portal/backend/rest/v1/rpc/uhz_eco_catalog';
const $=id=>document.getElementById(id);
let catalog=[],loading=null,organizeAllowed=false;const savedTags=new Map();const organizerEndpoint='/api/public-social/organize';async function loadTags(){try{const r=await fetch(organizerEndpoint,{credentials:'same-origin',cache:'no-store'});if(!r.ok)return;const d=await r.json();if(d.ok){organizeAllowed=true;savedTags.clear();for(const x of d.items||[])savedTags.set(String(x.resource_id),x)}}catch{}}
async function fetchPublished(){const sources=[[endpoint,{}],['/_uhz/portal/backend/rest/v1/rpc/uhz_catalog_api',{p_action:'catalog',p_payload:{}}]];let received=0,combined=[];await Promise.all(sources.map(async([url,payload])=>{try{const res=await fetch(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const data=await res.json();if(res.ok&&Array.isArray(data.items)){received++;combined.push(...data.items.filter(x=>x&&typeof x==='object'&&x.available!==false))}}catch{}}));if(!received)throw Error('El cat\xE1logo no est\xE1 disponible actualmente.');const seen=new Set();catalog=combined.filter(x=>{const id=String(x.id||x.slug||x.title||x.name||'');if(!id||seen.has(id))return false;seen.add(id);return true});await loadTags();return catalog}
function line(text,tag){const n=document.createElement(tag||'p');n.textContent=text;return n}
function createCard(item){const card=document.createElement('article');card.className='uhz-pub-entry';const title=line(String(item.title||item.name||'Recurso sin t\xEDtulo'),'h4');const category=String(item.category||item.type||'Publicaci\xF3n');const author=String(item.author_name||item.creator_name||item.author||'');card.append(title,line([category,author].filter(Boolean).join(' \xB7 ')));const detail=String(item.description||item.summary||'');if(detail)card.append(line(detail.slice(0,170)));const link=document.createElement('a');link.textContent='Ver recurso \u2192';link.href=item.id?'/?_uhz_ficha='+encodeURIComponent(String(item.id)):'/?buscar='+encodeURIComponent(String(item.title||item.name||''));card.append(link);const id=String(item.id||item.slug||'');if(id&&/^[A-Za-z0-9_-]{1,100}$/.test(id)){if(organizeAllowed){const form=document.createElement('form');form.className='uhz-organizer-form';const tag=document.createElement('input'),folder=document.createElement('input'),save=document.createElement('button'),status=line('','small');tag.placeholder='Mi etiqueta';tag.maxLength=40;tag.value=savedTags.get(id)?.tag||'';tag.setAttribute('aria-label','Etiqueta personal');folder.placeholder='Mi carpeta';folder.maxLength=40;folder.value=savedTags.get(id)?.folder||'General';folder.setAttribute('aria-label','Carpeta personal');save.type='submit';save.textContent='Guardar organizaci\xF3n';form.append(tag,folder,save,status);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;status.textContent='Guardando\u2026';try{const res=await fetch(organizerEndpoint,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({resource:id,tag:tag.value,folder:folder.value})});const d=await res.json();if(!res.ok)throw Error(d.message||'No se pudo guardar');savedTags.set(id,{tag:tag.value,folder:folder.value});status.textContent=d.message||'Guardado'}catch(err){status.textContent=err.message}finally{save.disabled=false}};card.append(form)}else{const note=line('Inicia sesi\xF3n para guardar etiquetas y carpetas personales.','small');card.append(note)}}return card}
function paint(id,search,tag){const target=$(id);if(!target)return;const q=String($(search)?.value||'').trim().toLocaleLowerCase('es');const label=String($(tag)?.value||'').trim().toLocaleLowerCase('es');const list=catalog.filter(x=>{const personal=savedTags.get(String(x.id||x.slug||''));const full=[x.title,x.name,x.category,x.type,x.author_name,x.creator_name,x.author,x.tags,x.description,personal?.tag,personal?.folder].filter(Boolean).join(' ').toLocaleLowerCase('es');return(!q||full.includes(q))&&(!label||full.includes(label))});target.replaceChildren();if(!list.length){target.append(line(catalog.length?'No hay recursos que coincidan con tu b\xFAsqueda.':'No se encontraron publicaciones disponibles.'));return}const fragment=document.createDocumentFragment();for(const entry of list.slice(0,96))fragment.append(createCard(entry));target.append(fragment)}
async function show(){if(loading)return loading;for(const id of ['uhzCreatorList','uhzPubList']){const el=$(id);if(el)el.textContent='Consultando publicaciones reales\u2026'}loading=fetchPublished().then(()=>{paint('uhzPubList','uhzPubSearch');paint('uhzCreatorList','uhzCreatorSearch','uhzCreatorTag')}).catch(e=>{for(const id of ['uhzCreatorList','uhzPubList'])if($(id))$(id).textContent=e.message||'No se pudo cargar el cat\xE1logo.'}).finally(()=>loading=null);return loading}
for(const id of ['uhzCreatorReload','uhzPubReload'])$(id)?.addEventListener('click',show);
for(const [input,target,other] of [['uhzPubSearch','uhzPubList',null],['uhzCreatorSearch','uhzCreatorList','uhzCreatorTag'],['uhzCreatorTag','uhzCreatorList','uhzCreatorSearch']])$(input)?.addEventListener('input',()=>paint(target,input,other));
const observe=()=>{for(const section of ['panel-contribute','panel-marketplace']){const el=$(section);if(!el)continue;const obs=new MutationObserver(()=>{if(!el.classList.contains('hide')&&!catalog.length)void show()});obs.observe(el,{attributes:true,attributeFilter:['class']});if(!el.classList.contains('hide'))void show()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
`;
var standard = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY", "X-Robots-Tag": "noindex, nofollow, noarchive", "Cross-Origin-Resource-Policy": "same-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=()" };
var csp = "default-src 'none'; script-src 'self' https://univershzrw.com https://challenges.cloudflare.com; style-src 'self' https://univershzrw.com 'unsafe-inline'; connect-src 'self' https://univershzrw.com https://challenges.cloudflare.com; img-src 'self' data: blob: https://univershzrw.com https://challenges.cloudflare.com; frame-src 'self' https://www.youtube-nocookie.com https://challenges.cloudflare.com; font-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'";
var exportedApp = { async fetch(req, env) {
  const u = new URL(req.url);
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: standard });
  const path = u.pathname;
  let body, ct, cache = "no-store";
  if (path === "/robots.txt") {
    body = "User-agent: *\nDisallow: /\n";
    ct = "text/plain; charset=utf-8";
  } else if (path === "/health") {
    body = JSON.stringify({ service: "UNIVERSHZRW Comunidad", status: "deployed", registration: "Supabase Auth", forum: "encrypted server-side", ads_and_robot: "site principal intacto", r2_uploads: "not enabled", payments: "not enabled" });
    ct = "application/json; charset=utf-8";
  } else if (path === "/style.css") {
    body = CSS;
    ct = "text/css; charset=utf-8";
    cache = "public,max-age=300";
  } else if (path === "/app.js") {
    body = `"use strict";
// Retain only two fixed destinations before the existing auth UI canonicalizes its URL.
const UHZ_INFT_RETURN=new URLSearchParams(location.search).get('inft')==='1';
const UHZ_CAMPAIGN_INTENT=Object.freeze({
 returnToCatalog:new URLSearchParams(location.search).get('campana')==='1',
 administration:new URLSearchParams(location.search).get('gestion')==='campanas'
});
` + CLIENT_JS + '\n;{const prior=showApp;showApp=function(){prior.apply(this,arguments);if(UHZ_INFT_RETURN&&state.user?.email_confirmed_at&&!state.user.must_change_password&&!state.recoveryActive)location.replace("/criptomoneda/panel");};}\n';
    ct = "application/javascript; charset=utf-8";
    cache = "public,max-age=300";
  } else if (path === "/" || path === "/index.html") {
    body = HTML.replaceAll("security-reg-20261101-1", "security-reg-20261101-1");
    ct = "text/html; charset=utf-8";
  } else if (path === "/favicon.ico") return Response.redirect("https://univershzrw.com/favicon.ico", 302);
  else return new Response("No encontrado", { status: 404, headers: standard });
  const h = new Headers(standard);
  h.set("Content-Type", ct);
  h.set("Cache-Control", cache);
  h.set("Content-Security-Policy", csp);
  return new Response(req.method === "HEAD" ? null : body, { status: 200, headers: h });
} };
var API_ORIGIN = "https://kgqkszlennwhlyngktcc.supabase.co";
var API_PUBLIC_KEY = "sb_publishable_9_e9NT4HdGejxqZ4mJ2yCw_5HoLAYQr";
var mediaHeaders = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "no-store" };
function mediaJson(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...mediaHeaders } });
}
async function validateUser(req) {
  const bearer = req.headers.get("authorization") || "";
  if (!bearer.startsWith("Bearer ")) return null;
  const r = await fetch(API_ORIGIN + "/auth/v1/user", { headers: { "apikey": API_PUBLIC_KEY, "authorization": bearer }, signal: AbortSignal.timeout(8e3) }).catch(() => null);
  if (!r?.ok) return null;
  const u = await r.json().catch(() => null);
  return u?.id && u?.email_confirmed_at ? u : null;
}
async function imageUpload(req, env) {
  if (!env.COMMUNITY_IMAGES) return mediaJson({ error: "images_not_configured" }, 503);
  const user = await validateUser(req);
  if (!user) return mediaJson({ error: "account_required" }, 401);
  if ((req.headers.get("content-type") || "").split(";")[0] !== "image/webp") return mediaJson({ error: "webp_required" }, 415);
  const len = Number(req.headers.get("content-length") || "0");
  if (len > 512e3) return mediaJson({ error: "image_too_large" }, 413);
  const data = await boundedBody(req, 512e3);
  if (data.length < 100 || data.length > 512e3) return mediaJson({ error: "image_size_invalid" }, 413);
  const magic = Array.from(data.slice(0, 4), (b) => String.fromCharCode(b)).join("");
  const webp = Array.from(data.slice(8, 12), (b) => String.fromCharCode(b)).join("");
  if (magic !== "RIFF" || webp !== "WEBP") return mediaJson({ error: "invalid_webp_file" }, 415);
  const name = user.id + "/" + crypto.randomUUID() + ".webp";
  const jwt = req.headers.get("authorization");
  const rpc = async (action, body) => {
    const r = await fetch(API_ORIGIN + "/rest/v1/rpc/" + action, { method: "POST", headers: { "content-type": "application/json", "apikey": API_PUBLIC_KEY, "authorization": jwt }, body: JSON.stringify(body), signal: AbortSignal.timeout(8e3) });
    return r;
  };
  const reserve = await rpc("community_reserve_media", { p_object_key: name, p_bytes: data.length, p_kind: "avatar" }).catch(() => null);
  if (!reserve?.ok) return mediaJson({ error: "image_quota_or_permission_rejected" }, 429);
  try {
    await env.COMMUNITY_IMAGES.put(name, data, { httpMetadata: { contentType: "image/webp" } });
    const confirmed = await rpc("community_media_confirm", { p_object_key: name }).catch(() => null);
    if (!confirmed?.ok || await confirmed.json() !== true) return mediaJson({ error: "image_confirmation_unavailable" }, 503);
    return mediaJson({ ok: true, key: name });
  } catch (e) {
    console.error("Community image R2 storage failed", String(e).slice(0, 100));
    return mediaJson({ error: "image_storage_unavailable" }, 503);
  }
}
async function imageRead(req, env, pathname) {
  if (!env.COMMUNITY_IMAGES) return mediaJson({ error: "images_not_configured" }, 503);
  const user = await validateUser(req);
  if (!user) return mediaJson({ error: "account_required" }, 401);
  const key2 = decodeURIComponent(pathname.substring("/media/".length));
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(key2)) return mediaJson({ error: "invalid_media_path" }, 400);
  if (!key2.startsWith(user.id + "/")) return mediaJson({ error: "not_found" }, 404);
  const registered = await supabaseFetch("/rest/v1/community_media?select=id&state=eq.approved&owner_id=eq." + encodeURIComponent(user.id) + "&object_key=eq." + encodeURIComponent(key2), { headers: { Authorization: req.headers.get("authorization") } });
  if (!registered.ok || !(await registered.json()).length) return mediaJson({ error: "not_found" }, 404);
  const obj = await env.COMMUNITY_IMAGES.get(key2);
  if (!obj) return mediaJson({ error: "not_found" }, 404);
  return new Response(obj.body, { status: 200, headers: { "content-type": "image/webp", "Cache-Control": "private,max-age=600", "Vary": "Authorization", ...mediaHeaders } });
}
var ADDON_JS = `
"use strict";
let uhzChatInterval=null;
const make=(tag,content,klass)=>{const node=document.createElement(tag);if(content!==null&&content!==undefined)node.textContent=String(content);if(klass)node.className=klass;return node};
function chatStop(){if(uhzChatInterval!==null){clearInterval(uhzChatInterval);uhzChatInterval=null}}
async function chatLoad(){
 try{
 const rows=await rpc("community_recent_chat",{p_limit:40}),root=document.getElementById("chatFeed");root.replaceChildren();
 if(!rows?.length){root.append(make("p","Todav\xEDa no hay mensajes. \xA1S\xE9 el primero!","muted"));return}
 for(const m of rows){const box=make("article",null,"chatbubble"+(m.author_id===state.user?.id?" own":""));box.append(make("strong",m.author_name+" \xB7 "+new Date(m.created_at).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})));box.append(make("div",m.body,"chatbody"));root.append(box)}
 root.scrollTop=root.scrollHeight;
 }catch(e){notify("No se pudo actualizar el chat: "+errText(e),true)}
}
async function contributionsLoad(){
 try{
 const items=await rpc("community_contribution_feed",{p_limit:35}),root=document.getElementById("workFeed");root.replaceChildren();
 if(!items.length){root.append(make("div","Todav\xEDa no existen aportaciones aprobadas y publicadas. Los aportes recibidos esperan revisi\xF3n.","card muted"));return}
 for(const row of items){
 const item=make("article",null,"post");item.append(make("h3",row.title),make("p",row.summary||""),make("p","Por "+row.contributor_name+" \xB7 "+fmt(row.received_at),"small muted"));
 const metrics=make("div",null,"mini-metrics");
 for(const [key,label] of [["likes","Me gusta"],["dislikes","No me gusta"],["link_reports","Enlaces reportados"],["downloads_verified","Descargas verificadas"]]){const t=make("div",null,"mini-metric");t.append(make("strong",row[key]),make("span",label));metrics.append(t)}
 item.append(metrics);
 const buttons=make("div",null,"actions");
 for(const [number,label] of [[1,"Me gusta"],[-1,"No me gusta"]]){
 const b=make("button",label,"button ghost");
 b.onclick=async()=>{try{await rpc("community_vote_contribution",{p_contribution_id:row.id,p_vote:number});notify("Valoraci\xF3n guardada");contributionsLoad()}catch(e){notify(errText(e),true)}};
 buttons.append(b)}
 const down=make("button","Reportar enlace ca\xEDdo","button outline");
 down.onclick=async()=>{try{await rpc("community_report_contribution",{p_contribution_id:row.id,p_reason:"enlace_caido",p_comment:"No abre el enlace reportado."});notify("Se envi\xF3 el reporte a revisi\xF3n");contributionsLoad()}catch(e){notify(errText(e),true)}};
 const report=make("button","Reportar contenido","button ghost");
 report.onclick=async()=>{const reason=window.prompt("Describe el problema (contenido incorrecto, derechos, etc.):");if(!reason)return;try{await rpc("community_report_contribution",{p_contribution_id:row.id,p_reason:"otro",p_comment:reason.slice(0,600)});notify("Reporte enviado")}catch(e){notify(errText(e),true)}};
 buttons.append(down,report);item.append(buttons);root.append(item)
 }
 }catch(e){notify("No se pudieron consultar los aportes: "+errText(e),true)}
}
async function exclusivesLoad(){
 try{
 const [mine,publicList]=await Promise.all([rpc("community_my_exclusives"),rpc("community_exclusives_catalog")]);
 const a=document.getElementById("myExclusiveFeed"),b=document.getElementById("publicExclusiveFeed");a.replaceChildren();b.replaceChildren();
 if(!mine.length)a.append(make("p","No tienes solicitudes de venta.","muted"));
 for(const item of mine){const entry=make("article",null,"post");entry.append(make("strong",item.title),make("p","$"+Number(item.price_mxn).toFixed(2)+" MXN \xB7 "+item.status,"small"));a.append(entry)}
 if(!publicList.length)b.append(make("p","A\xFAn no hay materiales disponibles. Los cobros est\xE1n desactivados.","muted"));
 for(const item of publicList){const entry=make("article",null,"post");entry.append(make("strong",item.title),make("p",item.description),make("p","Precio propuesto: $"+Number(item.price_mxn).toFixed(2)+" MXN","small"));b.append(entry)}
 }catch(e){notify(errText(e),true)}
}
async function coinsLoad(){
 try{
 const [wallet,rewards]=await Promise.all([rpc("community_my_coins"),restful("community_rewards?select=title,description,cost_coins,availability&order=cost_coins.asc")]);
 document.getElementById("coinsBalance").textContent=Number(wallet.balance||0).toLocaleString("es-MX");
 const root=document.getElementById("coinsRewards");root.replaceChildren();
 for(const item of rewards||[]){const card=make("article",null,"post");card.append(make("strong",item.title),make("p",item.description),make("p",item.cost_coins+" Coins \xB7 "+(item.availability==="available"?"Disponible":"Pr\xF3ximamente"),"small"));root.append(card)}
 }catch(e){notify(errText(e),true)}
}
async function profileStatsLoad(){
 try{const [wallet,contributions]=await Promise.all([rpc("community_my_coins"),rpc("community_my_contributions")]);
 document.getElementById("profileCoinsCount").textContent=Number(wallet.balance||0).toLocaleString("es-MX");
 document.getElementById("profileContributionsCount").textContent=contributions.length;
 document.getElementById("profileApprovedCount").textContent=contributions.filter(x=>/aprobad|publicad/i.test(x.management_status||"")).length;
 document.getElementById("profileTitleUpgrade").textContent=state.profile?.display_name||"Miembro";
 }catch(e){notify("No se pudieron cargar algunas estad\xEDsticas",true)}
}
const uhzPriorPanel=panel;
panel=function(name){chatStop();uhzPriorPanel(name);
 if(name==="community"||name==="chat"||name==="comunichat"){chatLoad();uhzChatInterval=setInterval(()=>{if(!document.hidden&&state.user)chatLoad()},30000)}
 if(name==="works")contributionsLoad();
 if(name==="marketplace")exclusivesLoad();
 if(name==="coins")coinsLoad();
 if(name==="profile")profileStatsLoad();
};
document.getElementById("chatRefresh").onclick=chatLoad;
document.getElementById("worksRefresh").onclick=contributionsLoad;
document.getElementById("chatForm").onsubmit=async e=>{e.preventDefault();try{await rpc("community_send_chat",{p_body:document.getElementById("chatText").value.trim()});document.getElementById("chatText").value="";await chatLoad();notify("Mensaje enviado")}catch(err){notify(errText(err),true)}};
document.getElementById("exclusiveForm").onsubmit=async e=>{e.preventDefault();try{
 if(!document.getElementById("sellerRights").checked)throw Error("Debes confirmar los derechos comerciales.");
 const id=await rpc("community_submit_exclusive",{p_title:document.getElementById("sellerTitle").value.trim(),p_description:document.getElementById("sellerDescription").value.trim(),p_category:document.getElementById("sellerCategory").value,p_price_mxn:Number(document.getElementById("sellerPrice").value),p_preview_youtube_url:document.getElementById("sellerYoutube").value.trim()||null,p_rights_confirmed:true});
 document.getElementById("exclusiveForm").reset();notify("Solicitud exclusiva registrada: "+String(id).slice(0,8)+". Pendiente de revisi\xF3n.");exclusivesLoad()
 }catch(err){notify(errText(err),true)}};
document.getElementById("feedbackForm").onsubmit=async e=>{e.preventDefault();try{await rpc("community_send_feedback",{p_kind:document.getElementById("feedbackKind").value,p_body:document.getElementById("feedbackText").value.trim()});document.getElementById("feedbackForm").reset();notify("Gracias. Tu opini\xF3n se envi\xF3 al equipo.")}catch(err){notify(errText(err),true)}};


async function resourceRatingsLoad(){
 const root=document.getElementById("resourceFeed");
 if(!root)return;
 try{
  const rows=await rpc("community_list_resources",{p_limit:30});
  root.replaceChildren();
  if(!rows.length){root.append(make("p","Sin recursos p\xFAblicos registrados.","muted"));return}
  for(const r of rows){
   const card=make("article",null,"post");
   card.append(make("span",r.content_type+" \xB7 "+r.category,"pill"),make("h3",r.title),make("p",r.summary||""));
   const counts=make("div",null,"mini-metrics");
   for(const [key,label] of [["likes","Me gusta"],["dislikes","No me gusta"],["down_reports","Alertas de enlace"]]){
    const tile=make("div",null,"mini-metric");tile.append(make("strong",r[key]||0),make("span",label));counts.append(tile);
   }
   const tile=make("div",null,"mini-metric");tile.append(make("strong","\u2014"),make("span","Descargas no verificadas"));counts.append(tile);card.append(counts);
   const controls=make("div",null,"actions");
   for(const [v,label] of [[1,"Me gusta"],[-1,"No me gusta"]]){
    const button=make("button",label,"button ghost");
    button.onclick=async()=>{try{await rpc("community_vote_resource",{p_resource_id:r.id,p_vote:v});notify("Tu valoraci\xF3n se registr\xF3");resourceRatingsLoad()}catch(e){notify(errText(e),true)}};
    controls.append(button);
   }
   const dead=make("button","Avisar enlace ca\xEDdo","button outline");
   dead.onclick=async()=>{try{await rpc("community_report_resource",{p_resource_id:r.id,p_reason:"enlace_caido",p_comment:"El recurso no parece disponible"});notify("Reporte registrado para revisi\xF3n");resourceRatingsLoad()}catch(e){notify(errText(e),true)}};
   const report=make("button","Reportar problema","button ghost");
   report.onclick=async()=>{const reason=window.prompt("Describe el problema relacionado con este recurso:");if(!reason)return;try{await rpc("community_report_resource",{p_resource_id:r.id,p_reason:"otro",p_comment:reason.slice(0,600)});notify("Gracias por tu reporte")}catch(e){notify(errText(e),true)}};
   controls.append(dead,report);card.append(controls);root.append(card)
  }
 }catch(e){notify("No se pudieron mostrar recursos: "+errText(e),true)}
}
const loadContributionsOriginal=contributionsLoad;
contributionsLoad=async function(){await Promise.all([loadContributionsOriginal(),resourceRatingsLoad()])};
document.getElementById("worksRefresh").onclick=contributionsLoad;


async function adminInboxLoad(){
 const container=document.getElementById("moderationInbox");
 if(!container)return;
 try{
  const inbox=await rpc("community_admin_inbox");container.replaceChildren();
  const groups=[
    ["resource_reports","Recursos reportados","resource_report"],
    ["contribution_reports","Aportaciones reportadas","contribution_report"],
    ["exclusives","Contenido exclusivo por revisar","exclusive"],
    ["feedback","Opiniones y sugerencias","feedback"]
  ];
  for(const [field,title,type] of groups){
   const heading=make("h3",title);container.append(heading);
   const list=inbox[field]||[];
   if(!list.length){container.append(make("p","Sin elementos pendientes.","small muted"));continue}
   for(const item of list){
    const card=make("article",null,"post");
    card.append(make("strong",item.title||item.resource_title||item.contribution_title||item.kind||"Revisi\xF3n pendiente"));
    card.append(make("p",item.comment||item.description||item.message||item.reason||"","small"));
    if(type==="exclusive")card.append(make("p","Precio propuesto: $"+Number(item.price_mxn||0).toFixed(2)+" MXN. Aprobaci\xF3n editorial no activa ventas.","small"));
    const choices=type==="exclusive"?[["approved","Aprobar ficha"],["rejected","Rechazar"]]:type==="feedback"?[["resolved","Atendido"]]:[["resolved","Resuelto"],["dismissed","Descartar"]];
    const actions=make("div",null,"actions");
    for(const [action,label] of choices){
     const button=make("button",label,"button ghost");
     button.onclick=async()=>{
      if(!window.confirm("\xBFConfirmas esta acci\xF3n administrativa?"))return;
      try{await rpc("community_admin_handle_item",{p_kind:type,p_id:item.id,p_action:action});notify("Revisi\xF3n registrada");adminInboxLoad()}
      catch(e){notify(errText(e),true)}
     };
     actions.append(button)
    }
    card.append(actions);container.append(card);
   }
  }
 }catch(e){notify("No se pudo cargar la bandeja administrativa: "+errText(e),true)}
}
const _previousPanelAdminUpgrade=panel;
panel=function(name){_previousPanelAdminUpgrade(name);if(name==="moderation")adminInboxLoad()};
document.getElementById("reloadInbox").onclick=adminInboxLoad;


async function rightsEvidenceBase64(file){
 if(!file)return null;
 if(file.type!=="application/pdf"||file.size>5*1024*1024)throw Error("La evidencia debe ser un PDF de hasta 5 MB.");
 return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error("No se pudo leer el PDF"));reader.readAsDataURL(file)});
}
const rightsPanelPrevious=panel;
panel=function(view){rightsPanelPrevious(view);if(view==="rights"&&state.user){
 document.getElementById("rightsContactEmail").value=state.user.email||"";
 if(!document.getElementById("rightsLegalName").value)document.getElementById("rightsLegalName").value=state.profile?.display_name||"";
 }};
document.getElementById("verifiedRightsForm").onsubmit=async event=>{
 event.preventDefault();
 const button=document.getElementById("submitVerifiedRights");
 button.disabled=true;
 try{
  if(!state.user?.email_confirmed_at)throw Error("Antes debes verificar tu correo de acceso.");
  const file=document.getElementById("rightsEvidence").files?.[0];
  const body={
   action:"rights_report",
   nombreLegal:document.getElementById("rightsLegalName").value.trim(),
   correo:state.user.email,
   urlUnivershzrw:document.getElementById("rightsPageUrl").value.trim(),
   tituloMaterial:document.getElementById("rightsMaterialTitle").value.trim(),
   descripcion:document.getElementById("rightsDescription").value.trim(),
   solicitud:document.getElementById("rightsRequestedAction").value,
   firma:document.getElementById("rightsSignature").value.trim(),
   declaracionBuenaFe:true,
   clientRequestId:crypto.randomUUID()
  };
  if(file){body.pdfBase64=await rightsEvidenceBase64(file);body.pdfNombre=file.name;}
  const jwt=await token();
  if(!jwt)throw Error("Vuelve a iniciar sesi\xF3n para enviar tu reclamaci\xF3n.");
  const response=await fetch(ROOT+"/functions/v1/uhz-api",{
   method:"POST",headers:{"content-type":"application/json","apikey":PUB,"authorization":"Bearer "+jwt},
   body:JSON.stringify(body)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.ok!==true)throw Error(data.error||"No se recibi\xF3 tu reporte.");
  document.getElementById("verifiedRightsForm").reset();
  document.getElementById("rightsContactEmail").value=state.user.email||"";
  notify("Reporte recibido. Folio: "+(data.reportId||"Pendiente")+".");
 }catch(error){notify(errText(error),true)}
 finally{button.disabled=false}
};

// Notify the containing account window; data operations remain server-authorized.
function publishAccountState(){if(window.parent!==window)window.parent.postMessage({type:'uhz:session'},location.origin)}
const showVerifiedApp=showApp;
showApp=function(){showVerifiedApp();publishAccountState()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&window.parent!==window&&!document.querySelector('dialog[open]')){e.preventDefault();window.parent.postMessage({type:'uhz:close'},location.origin)}});
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===window.parent&&e.data?.type==='uhz:pause')chatStop()});
// Default email templates can also be verified without navigating away.
const verifyButton=el('button','Ya recib\xED mi correo','button ghost');verifyButton.type='button';
const verification=el('form');verification.id='verifyEmailForm';verification.className='hide';
const verificationLabel=el('label','Enlace de verificaci\xF3n o recuperaci\xF3n recibido por correo');verificationLabel.htmlFor='verifyEmailLink';
const verificationField=el('input');verificationField.id='verifyEmailLink';verificationField.type='url';verificationField.required=true;verificationField.autocomplete='off';verificationField.maxLength=4096;
const verificationFieldWrap=el('div',null,'field');verificationFieldWrap.append(verificationLabel,verificationField);
const verifySubmit=el('button','Verificar en UNIVERSHZRW','button');verifySubmit.type='submit';
verification.append(el('p','Puedes copiar el enlace del correo y pegarlo aqu\xED para continuar dentro de UNIVERSHZRW.','small'),verificationFieldWrap,verifySubmit);
document.getElementById('authArea').append(verifyButton,verification);
verifyButton.onclick=()=>{verification.classList.toggle('hide');if(!verification.classList.contains('hide'))verificationField.focus()};
const verificationFeedback=el('div',null,'uhz-auth-feedback hide');verificationFeedback.id='verifyFeedback';verificationFeedback.setAttribute('role','status');verificationFeedback.setAttribute('aria-live','polite');verificationFeedback.tabIndex=-1;verification.prepend(verificationFeedback);
verification.onsubmit=e=>{e.preventDefault();return authSubmit(e.currentTarget,'verifyFeedback','Verificando\u2026',async()=>{
 const url=new URL(verificationField.value.trim());
 if(!['univershzrw.com','kgqkszlennwhlyngktcc.supabase.co'].includes(url.hostname)||url.protocol!=='https:')throw Error('Usa \xFAnicamente el enlace del correo de UNIVERSHZRW.');
 const type=url.searchParams.get('type'),hash=url.searchParams.get('token_hash')||url.searchParams.get('token');
 if(!hash||!['signup','email','recovery'].includes(type))throw Error('El enlace no es v\xE1lido. Solicita uno nuevo.');
 const data=await auth('verify','POST',{token_hash:hash,type});
 await acceptAuthSession(data,type==='recovery');verificationField.value='';
 if(type!=='recovery')notify('Correo verificado. Bienvenido a UNIVERSHZRW.');
})};
document.addEventListener('submit',e=>{
 const form=e.target;if(!(form instanceof HTMLFormElement)||form.closest('#authArea'))return;
 const buttons=[...form.querySelectorAll('button[type=submit]')];
 for(const b of buttons)b.disabled=true;
 const release=()=>buttons.forEach(b=>b.disabled=false);
 // A pending request never locks out the form indefinitely.
 setTimeout(release,12000);
},true);
const coinsWithBalance=coinsLoad;
coinsLoad=async function(){
 await coinsWithBalance();const target=document.getElementById('coinsHistory');if(!target)return;
 target.replaceChildren();
 try{
  const rows=await rpc('community_coin_history');
  if(!rows?.length){target.append(make('p','Todav\xEDa no hay movimientos de Coins.','muted'));return}
  const table=document.createElement('table');table.className='uhz-ledger-table';
  const caption=document.createElement('caption');caption.textContent='\xDAltimos '+rows.length+' movimientos reales de tu cuenta.';table.append(caption);
  const head=document.createElement('thead'),tr=document.createElement('tr');for(const label of ['Fecha','Coins','Motivo']){const th=make('th',label);th.scope='col';tr.append(th)}head.append(tr);table.append(head);
  const body=document.createElement('tbody');for(const row of rows){const r=document.createElement('tr');r.append(make('td',fmt(row.created_at)),make('td',(Number(row.coins_delta)>0?'+':'')+row.coins_delta),make('td',row.note));body.append(r)}table.append(body);target.append(table);
 }catch{target.append(make('p','No se pudo consultar el historial. Vuelve a intentarlo.','muted'))}
};
// Release submit controls after completion, including validation failures.
for(const form of document.forms){const handler=form.onsubmit;if(typeof handler!=='function')continue;form.onsubmit=async function(event){try{return await handler.call(this,event)}finally{for(const b of this.querySelectorAll('button[type=submit]'))b.disabled=false}}}

// Enterprise profile and member management use the existing cookie gateway.
const uhzPresetNames={quantum:'Cu\xE1ntico',orbital:'Orbital',nebula:'Nebulosa',photon:'Fot\xF3n',cosmos:'Cosmos',initials:'Iniciales'};
const uhzPresetGlyphs={quantum:'U',orbital:'\u25CE',nebula:'\u2726',photon:'\u25C8',cosmos:'\u263E',initials:''};
function quantumAvatar(){
 const root=el('div',null,'uhz-quantum-avatar');root.setAttribute('aria-label','Tu avatar con part\xEDculas cu\xE1nticas');
 const face=el('span','U','uhz-avatar-glyph');root.append(face);
 for(let i=0;i<3;i++){const orbit=el('span',null,'uhz-quantum-orbit orbit-'+i);orbit.setAttribute('aria-hidden','true');for(let j=0;j<2;j++)orbit.append(el('i'));root.append(orbit)}
 return root;
}
const profileCard=document.querySelector('.profile-business');
const avatarFrame=quantumAvatar();avatarFrame.id='uhzQuantumAvatar';
const oldImage=$('avatarPreview');if(oldImage)avatarFrame.append(oldImage);
const avatarHeader=el('div',null,'uhz-profile-identity');
const identityCopy=el('div');while(profileCard?.firstChild)identityCopy.append(profileCard.firstChild);
const roleBadge=el('span',null,'uhz-account-role');roleBadge.id='uhzAccountRole';identityCopy.append(roleBadge);
avatarHeader.append(avatarFrame,identityCopy);profileCard?.append(avatarHeader);
const presets=el('fieldset',null,'uhz-avatar-picker');const legend=el('legend','Elige tu avatar');presets.append(legend);
for(const [key,label] of Object.entries(uhzPresetNames)){
 const choice=el('button',null,'uhz-avatar-choice');choice.type='button';choice.dataset.avatarPreset=key;choice.setAttribute('aria-pressed','false');
 choice.append(el('span',uhzPresetGlyphs[key]||'WG','uhz-mini-avatar'),el('span',label));
 choice.onclick=async()=>{choice.disabled=true;try{await restful('community_profiles?user_id=eq.'+encodeURIComponent(state.user.id),{method:'PATCH',body:{avatar_preset:key,avatar_key:null},headers:{Prefer:'return=minimal'}});state.profile={...state.profile,avatar_preset:key,avatar_key:null};await loadMyAvatar();updateEnterpriseIdentity();notify('Avatar guardado.')}catch(e){notify(errText(e),true)}finally{choice.disabled=false}};
 presets.append(choice);
}
$('profileForm')?.prepend(presets);
function updateEnterpriseIdentity(){
 const preset=state.profile?.avatar_preset||'quantum';avatarFrame.dataset.preset=preset;
 const initials=String(state.profile?.display_name||'U').trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 avatarFrame.querySelector('.uhz-avatar-glyph').textContent=preset==='initials'?initials:uhzPresetGlyphs[preset]||'U';
 for(const b of presets.querySelectorAll('button')){b.setAttribute('aria-pressed',String(b.dataset.avatarPreset===preset&&!state.profile?.avatar_key));if(b.dataset.avatarPreset==='initials')b.querySelector('.uhz-mini-avatar').textContent=initials;}
 roleBadge.textContent=state.user?.role==='superadmin'?'Superadministrador':'Miembro verificado';
 const superuser=state.user?.role==='superadmin'&&!state.user?.must_change_password;
 document.querySelectorAll('.uhz-superadmin-only').forEach(b=>b.classList.toggle('hide',!superuser));
}
const originalAvatarLoad=loadMyAvatar;
loadMyAvatar=async function(){await originalAvatarLoad();updateEnterpriseIdentity()};
const originalEnterpriseShow=showApp;
showApp=function(){originalEnterpriseShow();updateEnterpriseIdentity()};

const adminPanel=el('section',null,'section app-panel hide');adminPanel.id='panel-users';
adminPanel.append(el('span','UNIVERSHZRW \xB7 ADMINISTRACI\xD3N','eyebrow'),el('h2','Gesti\xF3n de usuarios'),el('p','Administra accesos y avisos. Los bloqueos cierran las sesiones; las bajas conservan los registros.','muted'));
const adminTabs=el('div',null,'uhz-admin-tabs');
const membersView=el('div'),legacyView=el('div',null,'hide');
const membersTab=el('button','Usuarios','button'),legacyTab=el('button','Administraci\xF3n general','button ghost');membersTab.type=legacyTab.type='button';
adminTabs.append(membersTab,legacyTab);adminPanel.append(adminTabs,membersView,legacyView);
let legacyAdminFrame;
membersTab.onclick=()=>{membersView.classList.remove('hide');legacyView.classList.add('hide');membersTab.setAttribute('aria-pressed','true');legacyTab.setAttribute('aria-pressed','false')};
legacyTab.onclick=()=>{membersView.classList.add('hide');legacyView.classList.remove('hide');legacyTab.setAttribute('aria-pressed','true');membersTab.setAttribute('aria-pressed','false');if(!legacyAdminFrame){legacyAdminFrame=document.createElement('iframe');legacyAdminFrame.title='Administraci\xF3n general UNIVERSHZRW';legacyAdminFrame.src='/_uhz/admin/';legacyAdminFrame.className='uhz-legacy-admin-frame';legacyView.append(legacyAdminFrame)}};
const toolbar=el('form',null,'uhz-admin-toolbar');const searchMembers=el('input');searchMembers.type='search';searchMembers.placeholder='Buscar nombre o correo';searchMembers.maxLength=100;searchMembers.setAttribute('aria-label','Buscar usuarios');const searchButton=el('button','Buscar','button');searchButton.type='submit';const refreshMembers=el('button','Actualizar','button ghost');refreshMembers.type='button';toolbar.append(searchMembers,searchButton,refreshMembers);
const totalMembers=el('p',null,'small');const memberList=el('div',null,'uhz-member-list');memberList.setAttribute('aria-live','polite');
const pager=el('div',null,'actions'),prevMembers=el('button','Anterior','button ghost'),nextMembers=el('button','Siguiente','button ghost');prevMembers.type=nextMembers.type='button';pager.append(prevMembers,nextMembers);
const createDetails=document.createElement('details');createDetails.className='card';createDetails.append(el('summary','Agregar usuario'));
const createForm=el('form');const fields={};
for(const [key,label,type,max] of [['display_name','Nombre visible','text',48],['email','Correo electr\xF3nico','email',254],['password','Contrase\xF1a temporal','password',128]]){
 const wrap=el('div',null,'field'),input=el('input');input.id='uhzCreate_'+key;input.type=type;input.required=true;input.maxLength=max;input.autocomplete=key==='password'?'new-password':'off';if(key==='password')input.minLength=10;const lab=el('label',label);lab.htmlFor=input.id;wrap.append(lab,input);createForm.append(wrap);fields[key]=input;
}
createForm.append(el('p','La cuenta se crea sin confirmar el correo. El usuario deber\xE1 verificarlo y cambiar la contrase\xF1a temporal.','small'));
const createSubmit=el('button','Crear cuenta','button');createSubmit.type='submit';createForm.append(createSubmit);createDetails.append(createForm);
const eventsDetails=document.createElement('details');eventsDetails.className='card';eventsDetails.append(el('summary','Bit\xE1cora de usuarios'));const eventsRoot=el('div');eventsDetails.append(eventsRoot);
membersView.append(toolbar,totalMembers,memberList,pager,createDetails,eventsDetails);$('privateArea')?.append(adminPanel);
for(const target of document.querySelectorAll('.uhz-embed-tabs,.top .nav')){
 const b=el('button','Administraci\xF3n','member-btn uhz-superadmin-only hide');b.type='button';b.dataset.panel='users';b.onclick=()=>panel('users');target.append(b);
}
let memberOffset=0;
async function loadMembers(){
 if(state.user?.role!=='superadmin'||state.user?.must_change_password){memberList.replaceChildren(el('p','Esta secci\xF3n requiere un superadministrador con contrase\xF1a definitiva.','notice'));return}
 searchButton.disabled=refreshMembers.disabled=true;
 try{
  const data=await rpc('uhz_admin_members',{p_query:searchMembers.value.trim(),p_offset:memberOffset});
  totalMembers.textContent=Number(data.total||0).toLocaleString('es-MX')+' cuentas registradas \xB7 p\xE1gina '+(Math.floor(memberOffset/30)+1);memberList.replaceChildren();
  for(const u of data.items||[]){
   const card=el('article',null,'uhz-member-card');card.append(el('h3',u.display_name),el('p',u.email,'uhz-member-email'),el('p',(u.role==='superadmin'?'Superadministrador':'Miembro')+' \xB7 '+({active:'Activo',blocked:'Bloqueado',removed:'Baja reversible'}[u.state]||u.state)+' \xB7 '+(u.email_confirmed_at?'Correo verificado':'Correo pendiente'),'small'));
   if(u.reason)card.append(el('p',u.reason,'small'));
   const row=el('div',null,'actions');
   if(!u.is_protected){for(const [action,label] of (u.state==='active'?[['block','Bloquear'],['remove','Dar de baja']]:[['restore','Restaurar acceso']])){const b=el('button',label,'button ghost');b.type='button';b.onclick=()=>memberAction(u,action);row.append(b)}}else row.append(el('span','Cuenta principal protegida','uhz-protected-label'));
   const alert=el('button','Enviar aviso','button outline');alert.type='button';alert.onclick=()=>memberAction(u,'alert');row.append(alert);card.append(row);memberList.append(card);
  }
  if(!data.items?.length)memberList.append(el('p','No hay cuentas que coincidan.','muted'));
  prevMembers.disabled=memberOffset===0;nextMembers.disabled=(data.items?.length||0)<30;
 }catch(e){memberList.replaceChildren(el('p',errText(e),'notice'))}finally{searchButton.disabled=refreshMembers.disabled=false}
}
const actionDialog=document.createElement('dialog');actionDialog.className='uhz-user-action-dialog';actionDialog.setAttribute('aria-labelledby','uhzActionTitle');document.body.append(actionDialog);
async function memberAction(user,action){
 actionDialog.replaceChildren();const title=el('h3',action==='alert'?'Enviar aviso al usuario':action==='restore'?'Restaurar acceso':action==='block'?'Bloquear usuario':'Dar de baja al usuario');title.id='uhzActionTitle';actionDialog.append(title,el('p',user.email,'small'));
 const form=el('form');const message=el('textarea');message.id='uhzActionMessage';message.maxLength=action==='alert'?300:500;message.minLength=action==='restore'?0:5;message.required=action!=='restore';message.rows=4;
 const lab=el('label',action==='alert'?'Aviso que recibir\xE1 dentro de su cuenta':'Motivo de la acci\xF3n');lab.htmlFor=message.id;const field=el('div',null,'field');field.append(lab,message);form.append(field);
 if(action==='remove')form.append(el('p','Se cerrar\xE1n sus sesiones y se retirar\xE1 el acceso. Sus registros y aportes se conservar\xE1n.','small'));
 if(action==='alert')form.append(el('p','Se entregar\xE1 en Avisos. Este env\xEDo no utiliza correo ni WhatsApp.','small'));
 const buttons=el('div',null,'actions'),send=el('button',action==='alert'?'Enviar aviso':'Confirmar','button'),cancel=el('button','Cancelar','button ghost');send.type='submit';cancel.type='button';cancel.onclick=()=>actionDialog.close();buttons.append(send,cancel);form.append(buttons);actionDialog.append(form);
 form.onsubmit=async e=>{e.preventDefault();send.disabled=true;try{const response=await fetch(ROOT+'/functions/v1/uhz-member-admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'manage_user',user_id:user.id,operation:action,message:message.value.trim()})});const data=await response.json();if(!response.ok)throw Error(data.message||'No fue posible realizar la acci\xF3n.');actionDialog.close();notify(data.message);await loadMembers();if(eventsDetails.open)loadMemberEvents()}catch(err){notify(errText(err),true)}finally{send.disabled=false}};
 actionDialog.showModal();message.focus();
}
async function loadMemberEvents(){try{const list=await rpc('uhz_admin_events');eventsRoot.replaceChildren();for(const event of list){const item=el('article',null,'uhz-admin-event');item.append(el('strong',({block:'Bloqueo',restore:'Restauraci\xF3n',remove:'Baja reversible',alert:'Aviso',create_account:'Cuenta creada',change_temporary_password:'Contrase\xF1a actualizada'})[event.action]||event.action),el('p',(event.email||'Cuenta')+' \xB7 '+new Date(event.created_at).toLocaleString('es-MX'),'small'));eventsRoot.append(item)}if(!list.length)eventsRoot.append(el('p','Sin acciones registradas.','muted'))}catch(e){eventsRoot.replaceChildren(el('p',errText(e),'notice'))}}
eventsDetails.addEventListener('toggle',()=>{if(eventsDetails.open)loadMemberEvents()});
toolbar.onsubmit=e=>{e.preventDefault();memberOffset=0;loadMembers()};refreshMembers.onclick=loadMembers;prevMembers.onclick=()=>{memberOffset=Math.max(0,memberOffset-30);loadMembers()};nextMembers.onclick=()=>{memberOffset+=30;loadMembers()};
createForm.onsubmit=async e=>{e.preventDefault();createSubmit.disabled=true;try{
 const response=await fetch(ROOT+'/functions/v1/uhz-member-admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_user',display_name:fields.display_name.value.trim(),email:fields.email.value.trim(),password:fields.password.value})});const data=await response.json();fields.password.value='';if(!response.ok)throw Error(data.message||'No se pudo crear la cuenta.');notify(data.message);createForm.reset();memberOffset=0;await loadMembers();
}catch(e){notify(errText(e),true)}finally{createSubmit.disabled=false}};
const previousEnterprisePanel=panel;
panel=function(id){previousEnterprisePanel(id);if(id==='users')loadMembers();if(id==='profile')updateEnterpriseIdentity()};
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===legacyAdminFrame?.contentWindow&&e.data?.type==='uhz:admin-users'){membersTab.click();loadMembers()}});
const previousNotices=loadNotices;
loadNotices=async function(){await previousNotices();const mark=el('button','Marcar avisos como le\xEDdos','button ghost');mark.type='button';mark.onclick=async()=>{try{const list=await restful('community_notifications?select=id,seen_at&order=created_at.desc&limit=30');await rpc('uhz_notifications_read',{p_ids:list.filter(x=>!x.seen_at).map(x=>x.id)});notify('Avisos marcados como le\xEDdos.');mark.disabled=true}catch(e){notify(errText(e),true)}};$('userNotifications')?.append(mark)};

// Unified account experience. All data goes through the existing HttpOnly gateway.
document.documentElement.classList.add('uhz-account-app');
const uhzAccountLogo="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMDAgMTAwJz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2JnJyB4MT0nMCUnIHkxPScwJScgeDI9JzEwMCUnIHkyPScxMDAlJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMDgyYTQyJy8+PHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjMGYxNzIxJy8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9J3UnIHgxPScwJScgeTE9JzAlJyB4Mj0nMTAwJScgeTI9JzEwMCUnPjxzdG9wIG9mZnNldD0nMCUnIHN0b3AtY29sb3I9JyM4YmM0ZTgnLz48c3RvcCBvZmZzZXQ9JzEwMCUnIHN0b3AtY29sb3I9JyM1YjhmYjMnLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgcng9JzI0JyBmaWxsPSd1cmwoI2JnKScvPjxlbGxpcHNlIGN4PSc1MCcgY3k9JzUwJyByeD0nMzgnIHJ5PScxNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMTE0ZDczJyBzdHJva2Utd2lkdGg9JzQnIHRyYW5zZm9ybT0ncm90YXRlKC0zNSA1MCA1MCknLz48ZWxsaXBzZSBjeD0nNTAnIGN5PSc1MCcgcng9JzM4JyByeT0nMTQnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzJiODFiMycgc3Ryb2tlLXdpZHRoPScyJyB0cmFuc2Zvcm09J3JvdGF0ZSgzNSA1MCA1MCknLz48cGF0aCBkPSdNMzIsMjggVjU4IEExOCwxOCAwIDAsMCA2OCw1OCBWMjgnIGZpbGw9J25vbmUnIHN0cm9rZT0ndXJsKCN1KScgc3Ryb2tlLXdpZHRoPSc4JyBzdHJva2UtbGluZWNhcD0ncm91bmQnLz48Y2lyY2xlIGN4PSc1MCcgY3k9JzYyJyByPSc2JyBmaWxsPScjMzhiZGY4Jy8+PC9zdmc+";
const uhzLabelMap={home:'Mi UNIVERSHZRW',contribute:'Aportar contenido',community:'Comunichat',coins:'Mis Coins',notifications:'Mis avisos',profile:'Mi perfil',users:'Administraci\xF3n',create:'Nueva pregunta',favorites:'Favoritos',chat:'Comunichat',works:'Aportaciones publicadas',marketplace:'Material exclusivo',feedback:'Tu opini\xF3n',shipping:'Env\xEDos',plus:'Premium',rights:'Reportar derechos',moderation:'Moderaci\xF3n',thread:'Conversaci\xF3n'};
const uhzIcons={home:'\u2302',contribute:'\uFF0B',community:'\u2637',coins:'\u25C8',profile:'\u25CE',notifications:'\u25C9',users:'\u25A6'};
function uhzAccountButton(label,section,cls=''){const b=el('button',null,cls);b.type='button';b.append(el('span',uhzIcons[section]||'\u203A','uhz-nav-symbol'),el('span',label));b.dataset.accountPanel=section;b.onclick=()=>panel(section);return b}
function uhzLogoImage(cls=''){const i=document.createElement('img');i.src=uhzAccountLogo;i.alt='UNIVERSHZRW';i.className=cls;return i}
// Retain the original forms and their listeners, and give them one branded shell.
const uhzAuth=$('authArea');
const uhzAuthIntro=el('aside',null,'uhz-auth-brand');
uhzAuthIntro.append(uhzLogoImage('uhz-auth-logo'),el('span','DONDE TODO ES POSIBLE','uhz-auth-motto'),el('h2','Tu espacio para compartir y crecer.'),el('p','Conecta con la comunidad, publica tus aportes y construye tu perfil en UNIVERSHZRW.'));
const uhzAuthBenefits=el('div',null,'uhz-auth-benefits');for(const text of ['Comunichat para miembros verificados','Aportes con revisi\xF3n y seguimiento','Coins por contenido aprobado y publicado']){const p=el('p');p.append(el('span','\u2713'),document.createTextNode(text));uhzAuthBenefits.append(p)}uhzAuthIntro.append(uhzAuthBenefits);
const uhzAuthForm=el('div',null,'uhz-auth-form');while(uhzAuth.firstChild)uhzAuthForm.append(uhzAuth.firstChild);uhzAuth.append(uhzAuthIntro,uhzAuthForm);
const uhzAuthFoot=el('p','Tu cuenta conecta tu perfil, tus aportaciones y tus Coins.','uhz-auth-foot');uhzAuthForm.append(uhzAuthFoot);
const uhzOldAuthPart=authPart;
authPart=function(part,focus=false){
 uhzOldAuthPart(part,focus);part=state.authMode;uhzAuth.dataset.mode=part;
 const copy={authLogin:['Iniciar sesi\xF3n','Accede con tu cuenta de UNIVERSHZRW.'],authRegister:['Crear cuenta','\xDAnete a UNIVERSHZRW con tu correo electr\xF3nico.'],authRecover:['Recuperar tu cuenta','Escribe el correo que usaste para registrarte.'],authReset:['Nueva contrase\xF1a','Elige una contrase\xF1a de al menos 10 caracteres y conf\xEDrmala.'],authConfirm:['Verifica tu acceso','Contin\xFAa para confirmar el enlace que recibiste.']}[part];
 $('authHeading').textContent=copy[0];$('authDescription').textContent=copy[1];
};
const uhzLinkHelp=el('details',null,'uhz-auth-link-help');const uhzLinkHelpTitle=el('summary','\xBFNecesitas ayuda con el enlace del correo?');uhzLinkHelp.append(uhzLinkHelpTitle,verification);verification.classList.remove('hide');verifyButton.remove();uhzAuthFoot.before(uhzLinkHelp);
document.querySelector('label[for=avatarUpload]').textContent='Foto de perfil';
$('loginEmail').placeholder='tu@correo.com';$('loginPassword').placeholder='Tu contrase\xF1a';$('registerName').placeholder='\xBFC\xF3mo quieres que te vean?';$('registerEmail').placeholder='tu@correo.com';$('registerPassword').placeholder='Crea una contrase\xF1a segura';
const uhzMemberTop=el('header',null,'uhz-member-top');const uhzMemberTitle=el('strong','Mi UNIVERSHZRW');const uhzMoreButton=el('button','\u2022\u2022\u2022','uhz-more-account');uhzMoreButton.type='button';uhzMoreButton.setAttribute('aria-label','M\xE1s opciones de mi cuenta');uhzMemberTop.append(uhzMemberTitle,uhzMoreButton);$('privateArea').before(uhzMemberTop);
const uhzSide=$('uhzEmbedNav');const uhzNewSide=el('div',null,'uhz-account-sidebar');uhzNewSide.append(uhzLogoImage('uhz-sidebar-logo'),el('span','MI UNIVERSHZRW','uhz-sidebar-caption'));
for(const id of ['home','contribute','community','coins','notifications','profile','users']){const b=uhzAccountButton(uhzLabelMap[id],id,'uhz-sidebar-link');if(id==='users')b.classList.add('uhz-superadmin-only');uhzNewSide.append(b)}
const uhzSideMore=el('button','M\xE1s opciones','uhz-sidebar-link uhz-side-more');uhzSideMore.type='button';uhzNewSide.append(uhzSideMore);const uhzSideExit=el('button','Cerrar sesi\xF3n','uhz-sidebar-link uhz-side-exit');uhzSideExit.type='button';uhzSideExit.onclick=()=>$('exit').click();uhzNewSide.append(uhzSideExit);uhzSide.append(uhzNewSide);
const uhzBottom=el('nav',null,'uhz-account-bottom');uhzBottom.setAttribute('aria-label','Mi cuenta');for(const [id,label] of [['home','Inicio'],['contribute','Aportar'],['community','Comunichat'],['coins','Coins'],['profile','Cuenta']])uhzBottom.append(uhzAccountButton(label,id));document.body.append(uhzBottom);
const uhzMoreDialog=document.createElement('dialog');uhzMoreDialog.className='uhz-more-dialog';uhzMoreDialog.setAttribute('aria-label','M\xE1s opciones de mi cuenta');const uhzMoreHead=el('div',null,'uhz-more-head'),uhzMoreClose=el('button','\xD7');uhzMoreClose.type='button';uhzMoreClose.setAttribute('aria-label','Cerrar opciones');uhzMoreClose.onclick=()=>uhzMoreDialog.close();uhzMoreHead.append(el('h2','Mi UNIVERSHZRW'),uhzMoreClose);uhzMoreDialog.append(uhzMoreHead);
for(const id of ['notifications','users','favorites','works','marketplace','feedback','rights','moderation','shipping','plus']){const b=uhzAccountButton(uhzLabelMap[id],id,'uhz-more-link');if(id==='users')b.classList.add('uhz-superadmin-only');if(id==='moderation')b.classList.add('moderator-only');b.onclick=()=>{uhzMoreDialog.close();panel(id)};uhzMoreDialog.append(b)}const uhzMoreExit=el('button','Cerrar sesi\xF3n','uhz-more-link');uhzMoreExit.onclick=()=>{uhzMoreDialog.close();$('exit').click()};uhzMoreDialog.append(uhzMoreExit);document.body.append(uhzMoreDialog);uhzSideMore.onclick=uhzMoreButton.onclick=()=>{uhzMoreDialog.showModal();uhzMoreClose.focus()};
// The start screen shows live member data, rather than a row of every feature.
const uhzHome=el('section',null,'section app-panel hide');uhzHome.id='panel-home';
const uhzHomeIdentity=el('div',null,'uhz-home-identity'),uhzHomeAvatar=quantumAvatar(),uhzHomeWelcome=el('div');uhzHomeWelcome.append(el('span','BIENVENIDO A TU ESPACIO','eyebrow'),el('h1','UNIVERSHZRW'));const uhzHomeRole=el('span',null,'uhz-account-role');uhzHomeWelcome.append(uhzHomeRole);uhzHomeIdentity.append(uhzHomeAvatar,uhzHomeWelcome);uhzHome.append(uhzHomeIdentity);
const uhzHomeStats=el('div',null,'uhz-home-stats');for(const [key,label] of [['balance','Mis Coins'],['pending','En revisi\xF3n'],['published','Publicados']]){const t=el('div');t.append(el('strong','\u2014'),el('span',label));t.dataset.stat=key;uhzHomeStats.append(t)}uhzHome.append(uhzHomeStats);
const uhzEarnCard=el('article',null,'uhz-earn-card');uhzEarnCard.append(el('span','TUS APORTES TIENEN RECONOCIMIENTO','eyebrow'),el('h2','Comparte conocimiento. Gana Coins.'),el('p','Recibe 10 Coins por cada aporte leg\xEDtimo, aprobado y publicado. Sigue su revisi\xF3n y consulta cada movimiento.'));const uhzEarnActions=el('div',null,'actions');uhzEarnActions.append(uhzAccountButton('Enviar una aportaci\xF3n','contribute','button'),uhzAccountButton('C\xF3mo ganar Coins','coins','button outline'));uhzEarnCard.append(uhzEarnActions,el('span','Puntos internos \xB7 Sin valor monetario \xB7 Canjes desactivados','uhz-earn-disclosure'));uhzHome.append(uhzEarnCard);
const uhzQuickLinks=el('div',null,'uhz-quick-links');for(const [id,title,copy] of [['community','Tu comunidad','Pregunta, responde y comparte ideas.'],['profile','Tu perfil','Elige un avatar y completa tu presentaci\xF3n.'],['notifications','Tus avisos','Consulta novedades sobre tu cuenta.']]){const b=uhzAccountButton(title,id);b.append(el('small',copy));uhzQuickLinks.append(b)}uhzHome.append(uhzQuickLinks);
const uhzHomeRecent=el('div',null,'uhz-recent');uhzHomeRecent.append(el('h2','Mis aportaciones recientes'));const uhzRecentFeed=el('div');uhzHomeRecent.append(uhzRecentFeed);uhzHome.append(uhzHomeRecent);/* The account dashboard is the canonical #panel-home already present in the HTML. Do not inject the legacy contributions home. */
// Coins has an explicit earning route and the same real journal as the wallet.
const uhzCoinPanel=$('panel-coins');uhzCoinPanel.querySelector('.coins-wallet + .card')?.classList.add('hide');const uhzCoinGuide=el('div',null,'uhz-coin-guide');uhzCoinGuide.append(el('h3','As\xED ganas 10 Coins'));const uhzSteps=el('ol');for(const text of ['Env\xEDa material propio o con autorizaci\xF3n.','El administrador revisa los derechos y la calidad.','Al aprobarse y publicarse, recibes 10 Coins.'])uhzSteps.append(el('li',text));uhzCoinGuide.append(uhzSteps,uhzAccountButton('Enviar una aportaci\xF3n','contribute','button'),el('p','Los aportes pendientes, rechazados o con un enlace ya recompensado no generan Coins. Si se retira una publicaci\xF3n, se revierte su recompensa.','small'));uhzCoinPanel.querySelector('.coins-wallet').after(uhzCoinGuide);const uhzAdminReview=el('button','Abrir revisi\xF3n administrativa','button outline uhz-superadmin-only hide');uhzAdminReview.type='button';uhzAdminReview.onclick=()=>{panel('users');legacyTab.click()};uhzCoinGuide.append(uhzAdminReview);const uhzCoinProgress=el('div',null,'uhz-coin-progress');uhzCoinProgress.append(el('h3','El estado de tus aportes'));const uhzCoinFeed=el('div');uhzCoinProgress.append(uhzCoinFeed);uhzCoinGuide.after(uhzCoinProgress);
function uhzRenderProgress(root,items,limit=50){root.replaceChildren();if(!items.length){const empty=el('div',null,'uhz-empty-contributions');empty.append(el('p','Tu primera aportaci\xF3n empieza aqu\xED.'),el('span','Comparte un recurso \xFAtil y autorizado. Podr\xE1s seguir su revisi\xF3n desde esta cuenta.','small'),uhzAccountButton('Crear mi primer aporte','contribute','button outline'));root.append(empty);return}for(const item of items.slice(0,limit)){const row=el('article',null,'uhz-contribution-status');const text=el('div');text.append(el('strong',item.title),el('span',item.duplicate_source?'Enlace ya recompensado':Number(item.coins)>0?'Aprobado y publicado':item.management_status||'En revisi\xF3n','small'));const badge=el('span',Number(item.coins)>0?'+'+Number(item.coins)+' Coins':'Sin Coins a\xFAn','uhz-status-badge');if(Number(item.coins)>0)badge.classList.add('earned');row.append(text,badge);root.append(row)}}
async function uhzAccountData(){const [wallet,progress]=await Promise.all([rpc('community_my_coins'),rpc('community_coin_progress')]);const items=progress.items||[];return {wallet,progress,items}}
function uhzHomeSetIdentity(){const name=state.profile?.display_name||'Miembro';uhzHomeWelcome.querySelector('h1').textContent=name;uhzHomeRole.textContent=state.user?.role==='superadmin'?'Superadministrador':'Miembro verificado';uhzHomeAvatar.dataset.preset=state.profile?.avatar_preset||'quantum';uhzHomeAvatar.querySelector('.uhz-avatar-glyph').textContent=state.profile?.avatar_preset==='initials'?name.trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase():uhzPresetGlyphs[state.profile?.avatar_preset||'quantum']||'U';uhzHomeAvatar.querySelector('img')?.remove();const current=$('avatarPreview');if(current&&!current.classList.contains('hide')&&current.getAttribute('src')){const photo=current.cloneNode();photo.removeAttribute('id');photo.className='uhz-home-photo';uhzHomeAvatar.append(photo)}}
async function uhzHomeLoad(){uhzHomeSetIdentity();try{const {wallet,progress,items}=await uhzAccountData();const values={balance:wallet.balance,pending:progress.pending_count??items.filter(x=>!/aprobad|publicad|rechazad|approved|published|rejected/i.test(x.management_status||'')).length,published:progress.published_count??items.filter(x=>x.published_on_web&&Number(x.coins)>0).length};for(const [key,value]of Object.entries(values))uhzHomeStats.querySelector('[data-stat='+key+'] strong').textContent=Number(value||0).toLocaleString('es-MX');uhzRenderProgress(uhzRecentFeed,items,3)}catch(e){uhzRecentFeed.replaceChildren(el('p','No se pudieron cargar tus datos. Vuelve a Inicio para reintentar.','notice'))}void loadMyAvatar().then(uhzHomeSetIdentity)}
const uhzPreviousCoins=coinsLoad;
coinsLoad=async function(){await uhzPreviousCoins();const rewards=$('coinsRewards');if(!rewards.children.length)rewards.append(el('p','Canjes desactivados. Los Coins se conservan en tu saldo interno; no son dinero ni una promesa de pago.','small'));try{const data=await rpc('community_coin_progress');uhzRenderProgress(uhzCoinFeed,data.items||[])}catch(e){uhzCoinFeed.replaceChildren(el('p',errText(e),'notice'))}};
const uhzPreviousAccountPanel=panel;
panel=function(id){uhzPreviousAccountPanel(id);document.documentElement.dataset.accountPanel=id;uhzMemberTitle.textContent=uhzLabelMap[id]||'Mi UNIVERSHZRW';document.querySelectorAll('button[data-account-panel]').forEach(b=>{const active=b.dataset.accountPanel===id;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});/* The canonical 15-card account dashboard does not trigger contribution-progress loading. */document.querySelectorAll('.uhz-superadmin-only').forEach(b=>b.classList.toggle('hide',state.user?.role!=='superadmin'||!!state.user?.must_change_password))};
const uhzPreviousAccountShow=showApp;
showApp=function(){uhzPreviousAccountShow();document.documentElement.classList.add('uhz-ui-ready');const member=!!state.user?.email_confirmed_at&&!state.user?.must_change_password&&!state.recoveryActive&&!state.callbackPending;document.documentElement.classList.toggle('uhz-signed-in',member);document.documentElement.classList.toggle('uhz-signed-out',!member);if(!member)authPart(state.user?.must_change_password||state.recoveryActive?'authReset':state.authMode)};
authPart(state.authMode);
document.documentElement.classList.add('uhz-signed-out');

if(new URLSearchParams(location.search).has("token_hash")||new URLSearchParams(location.hash.slice(1)).has("refresh_token"))document.documentElement.classList.add("uhz-ui-ready");
// Session checks can finish before the deferred account shell has been built.
if(state.user)showApp();

window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===legacyAdminFrame?.contentWindow&&e.data?.type==='uhz:admin-logout'){forget();showApp();publishAccountState()}});

// Top-level account documents use normal links and normal page scrolling.
if(UHZ_IS_PAGE){
 for(const [id,part]of [['showRegister','authRegister'],['showRecover','authRecover'],['backLogin1','authLogin'],['backLogin2','authLogin'],['callbackRecover','authRecover']]){
  const old=document.getElementById(id);if(!old)continue;
  const link=document.createElement('a');link.id=old.id;link.className=old.className;link.textContent=old.textContent;
  link.href=uhzAuthUrl(part,uhzRequestedSection());old.replaceWith(link);
 }
 const previousPagePanel=panel;
 panel=function(id){
  if(id==='chat'||id==='comunichat')id='community';
  previousPagePanel(id);
  if(state.user?.email_confirmed_at&&!state.recoveryActive&&!state.callbackPending&&!state.user.must_change_password&&document.getElementById('panel-'+id)&&UHZ_PAGE_SECTIONS.has(id)){
   history.replaceState(null,'',uhzSectionUrl(id));document.title=(uhzLabelMap[id]||'Mi cuenta')+' | UNIVERSHZRW';
  }
 };
 if(state.user)showApp();else uhzSyncAuthPage(state.authMode);
 window.addEventListener('pagehide',()=>{if(state.user)document.documentElement.classList.remove('uhz-ui-ready')});
 window.addEventListener('pageshow',async event=>{
  if(!event.persisted||state.callbackPending)return;
  const resetting=state.recoveryActive;
  try{saveSession({});await currentUser();await prepareAccountProfile();showApp()}
  catch{forget();showApp();authPart(resetting?'authRecover':'authLogin');if(resetting)authFeedback('recoverFeedback','Solicita un enlace nuevo para continuar con la recuperaci\xF3n.',true)}
 });
}

// Rights intake uses a native document, with the existing account gateway.
{
 const link=(label,href,cls)=>{const a=document.createElement('a');a.href=href;a.textContent=label;a.className=cls+' uhz-license-entry';return a;};
 uhzSideMore.before(link('Licencias y autor\xEDa','/licencias','uhz-sidebar-link'));
 uhzMoreExit.before(link('Licencias y autor\xEDa','/licencias','uhz-more-link'));
 const shortcut=link('Licencias y autor\xEDa','/licencias/expedientes','');const desc=document.createElement('small');desc.textContent='Prepara pruebas y consulta la revisi\xF3n de tus derechos.';shortcut.append(desc);uhzQuickLinks.append(shortcut);
 $('panel-users')?.prepend(link('Revisar expedientes de derechos','/licencias/expedientes?revision=1','button outline uhz-superadmin-only hide'));
}

// One creator workspace; the account keeps its original verified identity controls.
{
 const link=(label,href,cls)=>{const a=document.createElement('a');a.href=href;a.textContent=label;a.className=cls+' uhz-license-entry';return a;};
 uhzSideMore.before(link('Centro de creadores','/creadores','uhz-sidebar-link'));
 uhzMoreExit.before(link('Centro de creadores','/creadores','uhz-more-link'));
 const shortcut=link('Preparar y consultar mi aportaci\xF3n','/creadores','');const desc=document.createElement('small');desc.textContent='Archivo, derechos, folio y propuesta en un solo espacio.';shortcut.append(desc);uhzQuickLinks.prepend(shortcut);
 $('panel-users')?.prepend(link('Revisar folios y propuestas','/creadores?seccion=folios&revision=1','button outline uhz-superadmin-only hide'));
 document.querySelectorAll('a.uhz-license-entry').forEach(a=>{if(a.getAttribute('href')?.startsWith('/licencias'))a.href='/creadores?seccion=licencias';});
 const balance=link('','/creadores?seccion=saldo','uhz-top-balances'),c=document.createElement('span'),g=document.createElement('span'),cv=document.createElement('strong'),gv=document.createElement('strong');cv.textContent='\u2014';gv.textContent='\u2014';c.append(document.createTextNode('Coins '),cv);g.append(document.createTextNode('Gold '),gv);balance.append(c,g);uhzMemberTitle.after(balance);
 let lastUser=null,lastAt=0;
 async function refreshWallet(){const id=state.user?.id;if(!id||state.user.must_change_password)return;if(id===lastUser&&Date.now()-lastAt<30000)return;lastUser=id;lastAt=Date.now();cv.textContent='\u2014';gv.textContent='\u2014';try{const data=await rpc('community_creator_dashboard',{p_admin:false});if(state.user?.id!==id)return;cv.textContent=Number(data.coins.balance).toLocaleString('es-MX');gv.textContent=Number(data.gold.units_balance||0).toLocaleString('es-MX');}catch{lastAt=0;}}
 const campaignReturn=typeof UHZ_CAMPAIGN_INTENT!=='undefined'&&UHZ_CAMPAIGN_INTENT.returnToCatalog;
 const authUrlBefore=uhzAuthUrl;uhzAuthUrl=function(part,section='home'){const url=authUrlBefore(part,section);return campaignReturn?url+(url.includes('?')?'&':'?')+'campana=1':url;};
 const before=panel;panel=function(id){if(state.user?.email_confirmed_at&&!state.user.must_change_password&&!state.recoveryActive&&['contribute','community','coins'].includes(id)){location.assign(id==='community'?'/comunidad':id==='coins'?'/creadores?seccion=saldo':'/creadores');return;}before(id);if(id==='home'||id==='profile')void refreshWallet();};
 const beforeShow=showApp;showApp=function(){beforeShow();if(campaignReturn&&state.user?.email_confirmed_at&&!state.user.must_change_password&&!state.recoveryActive){location.replace('/creadores?seccion=campanas');return;}if(state.user&&!state.user.must_change_password)void refreshWallet();else{lastUser=null;lastAt=0;cv.textContent='\u2014';gv.textContent='\u2014';}};
}

// Campaign management lives only in the existing verified administration panel.
{
 const tab=el('button','Campa\xF1as','button ghost uhz-superadmin-only hide');tab.type='button';tab.id='uhzCampaignAdminTab';
 const root=el('div',null,'hide uhz-campaign-admin');root.id='uhzCampaignAdmin';adminTabs.append(tab);adminPanel.append(root);
 root.innerHTML='<div class="uhz-campaign-heading"><div><p class="eyebrow">ACTIVIDADES PARA GANAR GOLD</p><h2>Campa\xF1as</h2><p class="muted">Define la actividad y su recompensa, publ\xEDcala y revisa cada comprobaci\xF3n. Solo las campa\xF1as publicadas con cupos aparecen en la web.</p></div><div class="uhz-campaign-actions"><a href="/creadores?seccion=campanas" class="button ghost" target="_blank" rel="noopener">Ver cat\xE1logo</a><button type="button" id="uhzNewCampaign" class="button">Nueva campa\xF1a</button></div></div><p id="uhzCampaignFeedback" class="notice hide" role="status"></p><div class="uhz-campaign-toolbar"><label>Mostrar<select id="uhzCampaignFilter"><option value="all">Todos los estados</option><option value="draft">Borradores</option><option value="published">Publicadas</option><option value="paused">Pausadas</option><option value="closed">Cerradas</option><option value="archived">Archivadas</option></select></label><button type="button" id="uhzCampaignRefresh" class="button ghost">Actualizar</button></div><div id="uhzCampaignRows"></div><p class="muted small">Se muestran las 100 campa\xF1as m\xE1s recientes. Archivar conserva los registros.</p><section id="uhzCampaignEditor" class="uhz-campaign-box hide" tabindex="-1"><div class="uhz-campaign-heading"><h3 id="uhzCampaignEditTitle">Nueva campa\xF1a</h3><button type="button" id="uhzCampaignEditorClose" class="button ghost">Cerrar</button></div><form id="uhzCampaignForm"><label>Nombre de la actividad<input name="title" minlength="8" maxlength="120" required></label><label>Resumen para la web<textarea name="summary" minlength="30" maxlength="500" rows="2" required></textarea></label><div class="uhz-campaign-fields"><label>Tipo de actividad<select name="kind" required><option value="contribution">Aportar contenido voluntario</option><option value="creation">Crear material original</option><option value="follow">Seguir una web</option><option value="activity">Otra actividad verificable</option></select></label><label>P\xE1gina de la actividad<select name="target" id="uhzCampaignTarget"><option value="">Sin enlace adicional</option><option value="/">Buscador UNIVERSHZRW</option><option value="/comunidad">Comunidad</option><option value="/creadores">Aportar contenido</option><option value="/#publicaciones">Biblioteca</option></select></label></div><p class="muted small">Las p\xE1ginas externas se eligen entre los recursos ya autorizados y conservan su salida habitual con verificaci\xF3n. No se a\xF1ade ning\xFAn servicio.</p><label>Qu\xE9 debe hacer el participante<textarea name="instructions" minlength="40" maxlength="4000" rows="4" required></textarea></label><label>C\xF3mo comprobar\xE1s que lo complet\xF3<textarea name="proof_instructions" minlength="20" maxlength="1500" rows="3" required></textarea></label><div class="uhz-campaign-fields"><label>Gold por aprobaci\xF3n<input type="number" name="reward_gold" min="1" max="10000" step="1" required></label><label>Cupos totales<input type="number" name="capacity" min="1" max="1000" step="1" required></label><label>Inicio<input type="datetime-local" name="starts_at" required></label><label>Cierre<input type="datetime-local" name="ends_at" required></label></div><p id="uhzCampaignBudget" class="muted">Indica la recompensa y los cupos para calcular el m\xE1ximo de Gold internos.</p><p class="muted small">Fechas en el horario de tu dispositivo. Al publicar se conservan las condiciones para todos los participantes. No se activa conversi\xF3n a dinero, retiros ni compra de derechos.</p><button type="submit" class="button">Guardar borrador</button></form><div id="uhzCampaignSelected"></div><form id="uhzCampaignStateForm" class="hide"><h3>Publicaci\xF3n y disponibilidad</h3><div class="uhz-campaign-fields"><label>Acci\xF3n<select id="uhzCampaignState" required></select></label><label>Motivo<textarea id="uhzCampaignStateReason" minlength="20" maxlength="1500" rows="2" required></textarea></label></div><p class="muted small">Publicar ofrece los Gold internos configurados por cada aprobaci\xF3n, hasta los cupos indicados. Pausar o cerrar detiene nuevas participaciones; las ya iniciadas se conservan para revisi\xF3n.</p><label class="uhz-campaign-check"><input id="uhzCampaignStateConfirm" type="checkbox" required> Revis\xE9 las condiciones, los requisitos y el l\xEDmite de Gold de esta campa\xF1a.</label><button type="submit" class="button">Aplicar acci\xF3n</button></form></section><section class="uhz-campaign-box"><div class="uhz-campaign-heading"><div><h3>Revisar participaciones</h3><p class="muted small" id="uhzCampaignClaimsScope">Las 50 participaciones m\xE1s recientes.</p></div></div><form id="uhzCampaignFindForm" class="uhz-campaign-find"><label>Buscar una participaci\xF3n por folio<input id="uhzCampaignFind" placeholder="UHZ-G-\u2026" pattern="UHZ-G-[A-Fa-f0-9]{32}" maxlength="38" required></label><button type="submit" class="button ghost">Consultar</button></form><div id="uhzCampaignClaims"></div><section id="uhzCampaignReview" class="uhz-campaign-review hide" tabindex="-1"><h3 id="uhzCampaignReviewTitle"></h3><div id="uhzCampaignEvidence"></div><form id="uhzCampaignReviewForm"><label>Decisi\xF3n<select id="uhzCampaignDecision" required></select></label><label>Raz\xF3n que ver\xE1 el participante<textarea id="uhzCampaignReviewReason" minlength="30" maxlength="1500" rows="3" required></textarea></label><label class="uhz-campaign-check"><input id="uhzCampaignVerified" type="checkbox"> Contrast\xE9 la evidencia y los requisitos. Abrir un enlace o subir un archivo por s\xED solo no acredita Gold.</label><p class="muted small">Las aportaciones voluntarias deben estar aprobadas y publicadas. No puedes aprobar tu propia participaci\xF3n ni premiar dos veces un mismo archivo.</p><button type="submit" class="button">Guardar revisi\xF3n</button></form></section></section>';
 const labels={draft:'Borrador',published:'Publicada',paused:'Pausada',closed:'Cerrada',archived:'Archivada'},states={started:'Elegida',expired:'Reserva vencida',submitted:'Por revisar',needs_information:'Aclaraci\xF3n pendiente',approved:'Aprobada',rejected:'No aprobada',withdrawn:'Retirada',revoked:'Revertida'};
 const kinds={contribution:'Aportar contenido',creation:'Crear material',follow:'Seguir una web',activity:'Otra actividad'};
 let requested=typeof UHZ_CAMPAIGN_INTENT!=='undefined'&&UHZ_CAMPAIGN_INTENT.administration;
 const panelHeading=adminPanel.querySelector('h2'),panelIntro=adminPanel.querySelector('p.muted'),originalHeading=panelHeading.textContent,originalIntro=panelIntro.textContent;
 let data=null,selected=null,review=null,requestId=crypto.randomUUID(),loading=false,scope=null;
 const f=$('uhzCampaignForm'),val=n=>f.elements.namedItem(n),dt=v=>new Date(v).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}),nfmt=v=>Number(v).toLocaleString('es-MX');
 function message(text,error=false){const e=$('uhzCampaignFeedback');e.textContent=text;e.classList.toggle('hide',!text);e.classList.toggle('error',error);e.setAttribute('role',error?'alert':'status');}
 function lock(form,v){form.querySelectorAll('button').forEach(x=>x.disabled=v);}
 function show(){panelHeading.textContent='Administraci\xF3n';panelIntro.textContent='Campa\xF1as, requisitos y recompensas internas.';history.replaceState(null,'','/usuarios?gestion=campanas');membersView.classList.add('hide');legacyView.classList.add('hide');root.classList.remove('hide');membersTab.setAttribute('aria-pressed','false');legacyTab.setAttribute('aria-pressed','false');tab.setAttribute('aria-pressed','true');if(state.user?.role==='superadmin'&&!state.user.must_change_password)void load();else message('Esta secci\xF3n requiere permisos de superadministrador.',true);}
 tab.onclick=show;
 for(const b of [membersTab,legacyTab]){const before=b.onclick;b.onclick=e=>{panelHeading.textContent=originalHeading;panelIntro.textContent=originalIntro;history.replaceState(null,'','/usuarios');root.classList.add('hide');tab.setAttribute('aria-pressed','false');before?.call(b,e);};}
 async function load(id=scope){if(loading)return;loading=true;try{const d=await rpc('community_campaign_admin',{p_id:id});if(state.user?.role!=='superadmin'){data=null;return;}data=d;scope=id;render();message('');}catch(e){message(e.message||'No se pudo consultar la administraci\xF3n de campa\xF1as.',true);}finally{loading=false;}}
 function render(){const rows=$('uhzCampaignRows');rows.replaceChildren();const filtered=data.items.filter(x=>$('uhzCampaignFilter').value==='all'||x.state===$('uhzCampaignFilter').value);if(!filtered.length)rows.append(el('p','No hay campa\xF1as en este estado. Crea un borrador para empezar.','muted'));for(const c of filtered){const row=el('article',null,'uhz-campaign-row'),d=el('div'),b=el('button',c.state==='draft'?'Editar borrador':'Gestionar','button ghost');b.type='button';d.append(el('strong',c.title),el('small',(labels[c.state]||c.state)+' \xB7 '+nfmt(c.reward_gold)+' Gold por aprobaci\xF3n \xB7 '+c.remaining+'/'+c.capacity+' cupos disponibles'),el('small',c.approved+' aprobaciones \xB7 '+c.pending+' en revisi\xF3n'));b.onclick=()=>select(c);row.append(d,b);rows.append(row);}
  const target=$('uhzCampaignTarget'),old=target.value;target.querySelectorAll('option[data-resource]').forEach(x=>x.remove());for(const r of data.resources){const o=el('option','Web autorizada \xB7 '+r.name);o.value='resource:'+r.legacy_id;o.dataset.resource='1';target.append(o);}target.value=old;
  const list=$('uhzCampaignClaims');list.replaceChildren();$('uhzCampaignClaimsScope').textContent=scope?'Las 50 participaciones m\xE1s recientes de la campa\xF1a seleccionada.':'Las 50 participaciones m\xE1s recientes de todas las campa\xF1as.';if(!data.claims.length)list.append(el('p','No hay participaciones para revisar.','muted'));for(const x of data.claims){const row=el('article',null,'uhz-campaign-row'),d=el('div'),b=el('button','Ver comprobaci\xF3n','button ghost');b.type='button';d.append(el('strong',x.campaign.title),el('small',(states[x.state]||x.state)+' \xB7 '+(x.author_name||'Miembro')+' \xB7 '+x.folio));b.onclick=()=>selectReview(x);row.append(d,b);list.append(row);}}
 function budget(){const reward=Number(val('reward_gold').value),capacity=Number(val('capacity').value);$('uhzCampaignBudget').textContent=reward>0&&capacity>0?'M\xE1ximo de la campa\xF1a: '+nfmt(reward*capacity)+' Gold internos ('+nfmt(reward)+' \xD7 '+nfmt(capacity)+' cupos).':'Indica la recompensa y los cupos para calcular el m\xE1ximo de Gold internos.';}
 for(const n of ['reward_gold','capacity'])val(n).addEventListener('input',budget);
 function localDate(v){const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 function select(c){selected=c;requestId=c?.id||crypto.randomUUID();f.reset();$('uhzCampaignEditor').classList.remove('hide');$('uhzCampaignEditTitle').textContent=c?c.title:'Nueva campa\xF1a';f.classList.toggle('hide',!!c&&c.state!=='draft');$('uhzCampaignSelected').replaceChildren();if(c){for(const n of ['title','summary','instructions','proof_instructions','kind','reward_gold','capacity'])val(n).value=c[n];if(![...val('target').options].some(x=>x.value===c.target)){const o=el('option','Destino anterior (revisar autorizaci\xF3n)');o.value=c.target;val('target').append(o);}val('target').value=c.target;val('starts_at').value=localDate(c.starts_at);val('ends_at').value=localDate(c.ends_at);if(c.state!=='draft'){$('uhzCampaignSelected').append(el('p',(kinds[c.kind]||'Actividad')+' \xB7 '+nfmt(c.reward_gold)+' Gold \xB7 '+c.capacity+' cupos \xB7 M\xE1ximo '+nfmt(c.total_gold||c.reward_gold*c.capacity)+' Gold internos'),el('p',c.summary),el('h4','Requisitos'),el('p',c.instructions),el('h4','Comprobaci\xF3n'),el('p',c.proof_instructions),el('p','Del '+dt(c.starts_at)+' al '+dt(c.ends_at)+'. Las condiciones publicadas se conservan.'));}if(scope!==c.id){scope=c.id;void load(c.id);}}else val('starts_at').value=localDate(Date.now());budget();const transitions={draft:[['published','Publicar campa\xF1a'],['archived','Archivar borrador']],published:[['paused','Pausar nuevas participaciones'],['closed','Cerrar campa\xF1a']],paused:[['published','Reanudar campa\xF1a'],['closed','Cerrar campa\xF1a']],closed:[['archived','Archivar conservando historial']],archived:[]},options=c?transitions[c.state]||[]:[];$('uhzCampaignState').replaceChildren();for(const [value,label] of options){const o=el('option',label);o.value=value;$('uhzCampaignState').append(o);}$('uhzCampaignStateForm').classList.toggle('hide',!options.length);$('uhzCampaignStateReason').value='';$('uhzCampaignStateConfirm').checked=false;message('');$('uhzCampaignEditor').focus();}
 function selectReview(x){review=x;const box=$('uhzCampaignReview');box.classList.remove('hide');$('uhzCampaignReviewTitle').textContent=x.campaign.title;const evidence=$('uhzCampaignEvidence');evidence.replaceChildren(el('p',(x.author_name||'Miembro')+' \xB7 '+x.folio,'muted'),el('p',(states[x.state]||x.state)+' \xB7 '+x.campaign.reward_gold+' Gold por aprobaci\xF3n'),el('h4','Requisitos de la campa\xF1a'),el('p',x.campaign.instructions),el('h4','Comprobaci\xF3n solicitada'),el('p',x.campaign.proof_instructions),el('h4','Comprobaci\xF3n recibida'),el('p',x.proof||'Todav\xEDa no hay comprobaci\xF3n.'));if(x.creator_folio){const a=el('a','Revisar archivo y derechos \xB7 '+x.creator_folio);a.href='/creadores?seccion=folios&revision=1&folio='+encodeURIComponent(x.creator_folio);a.target='_blank';a.rel='noopener';evidence.append(a);}if(x.review)evidence.append(el('h4','\xDAltimo motivo'),el('p',x.review));const options=x.state==='submitted'?[['approved','Aprobar y acreditar Gold'],['needs_information','Pedir aclaraci\xF3n'],['rejected','No aprobar']]:x.state==='needs_information'?[['rejected','No aprobar']]:x.state==='approved'?[['revoked','Revertir recompensa por incumplimiento']]:[];$('uhzCampaignDecision').replaceChildren();for(const [value,label] of options){const o=el('option',label);o.value=value;$('uhzCampaignDecision').append(o);}$('uhzCampaignReviewForm').classList.toggle('hide',!options.length||x.is_owner);if(x.is_owner)evidence.append(el('p','No puedes revisar tu propia participaci\xF3n.','muted'));$('uhzCampaignReviewReason').value='';$('uhzCampaignVerified').checked=false;box.focus();}
 $('uhzNewCampaign').onclick=()=>select(null);$('uhzCampaignEditorClose').onclick=()=>$('uhzCampaignEditor').classList.add('hide');$('uhzCampaignFilter').onchange=()=>data&&render();$('uhzCampaignRefresh').onclick=()=>{scope=null;void load(null);};
 f.addEventListener('submit',async e=>{e.preventDefault();if(!f.reportValidity())return;lock(f,true);try{const input={};for(const n of ['title','summary','instructions','proof_instructions','kind','target'])input[n]=val(n).value.trim();for(const n of ['reward_gold','capacity'])input[n]=Number(val(n).value);for(const n of ['starts_at','ends_at'])input[n]=new Date(val(n).value).toISOString();const result=await rpc('community_campaign_save',{p_id:requestId,p_input:input,p_revision:selected?.revision||0});await load(result.id);const fresh=data?.items.find(x=>x.id===result.id)||{...result,...input};select(fresh);message('Borrador guardado. Todav\xEDa no aparece en el cat\xE1logo.');}catch(err){message(err.message||'No se pudo guardar el borrador.',true);}finally{lock(f,false);}});
 $('uhzCampaignStateForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;if(!selected||!form.reportValidity())return;lock(form,true);try{const result=await rpc('community_campaign_state',{p_id:selected.id,p_state:$('uhzCampaignState').value,p_reason:$('uhzCampaignStateReason').value.trim(),p_revision:selected.revision});await load(result.id);select(data.items.find(x=>x.id===result.id));message('Estado actualizado: '+labels[result.state]+'.');}catch(err){message(err.message||'No se pudo cambiar la disponibilidad.',true);}finally{lock(form,false);}});
 $('uhzCampaignFindForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;lock(form,true);try{selectReview(await rpc('community_campaign_get',{p_folio:$('uhzCampaignFind').value.trim().toUpperCase()}));message('');}catch(err){message(err.message,true);}finally{lock(form,false);}});
 $('uhzCampaignReviewForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;if(!review||!form.reportValidity())return;lock(form,true);try{const result=await rpc('community_campaign_review',{p_folio:review.folio,p_decision:$('uhzCampaignDecision').value,p_reason:$('uhzCampaignReviewReason').value.trim(),p_revision:review.revision,p_verified:$('uhzCampaignVerified').checked});await load();selectReview(result);message('Revisi\xF3n guardada: '+states[result.state]+'.');}catch(err){message(err.message,true);}finally{lock(form,false);}});
 const before=panel;panel=function(id){before(id);if(id==='users'&&(requested||new URLSearchParams(location.search).get('gestion')==='campanas')){requested=false;show();}};
}

// Desktop account shell: reuse the existing navigation, balances and account menu.
// Authentication, private data access and form submission handlers remain unchanged.
{
 const root=document.documentElement,header=document.querySelector('.uhz-page-header'),nav=$('uhzEmbedNav'),sidebar=nav?.querySelector('.uhz-account-sidebar'),balances=document.querySelector('.uhz-top-balances'),home=header?.querySelector('.uhz-page-home');
 const desktop=matchMedia('(min-width:1024px)');
 if(header&&sidebar&&balances&&home){
  const moved=[nav,balances,uhzMoreButton,home].map(element=>({element,parent:element.parentNode,marker:document.createComment('account-layout-position')}));
  const homeButton=sidebar.querySelector('[data-account-panel="home"]'),contribute=sidebar.querySelector('[data-account-panel="contribute"]'),guide=sidebar.querySelector('a[href="/creadores?seccion=licencias"]');
  const labels=[homeButton,contribute].filter(Boolean).map(element=>({element:element.lastElementChild,text:element.lastElementChild.textContent}));
  if(guide)labels.push({element:guide,text:guide.textContent});
  const chat=uhzAccountButton('Chat','chat','uhz-sidebar-link uhz-desktop-account-entry');chat.hidden=true;
  const campaigns=el('a','Campa\xF1as','uhz-sidebar-link uhz-desktop-account-entry');campaigns.href='/creadores?seccion=campanas';campaigns.hidden=true;
  sidebar.insertBefore(chat,guide||uhzSideMore);sidebar.insertBefore(campaigns,guide||uhzSideMore);
  const accountEntries=[];
  for(const [id,label] of [['profile','Mi perfil'],['coins','Coins y Gold']]){
   const b=uhzAccountButton(label,id,'uhz-more-link uhz-desktop-account-entry');b.hidden=true;b.onclick=()=>{uhzMoreDialog.close();panel(id);};accountEntries.push(b);
  }
  uhzMoreDialog.querySelector('.uhz-more-head').after(...accountEntries);
  const avatar=quantumAvatar();avatar.classList.add('uhz-header-avatar');avatar.setAttribute('aria-hidden','true');avatar.removeAttribute('aria-label');
  const photo=el('img',null,'uhz-header-photo');photo.alt='';photo.hidden=true;avatar.append(photo);
  let placed=false;
  function syncAvatar(){
   const preset=avatarFrame.dataset.preset||'quantum';avatar.dataset.preset=preset;
   avatar.querySelector('.uhz-avatar-glyph').textContent=avatarFrame.querySelector('.uhz-avatar-glyph').textContent;
   const source=$('avatarPreview'),visible=source&&!source.hidden&&!source.classList.contains('hide')&&!!source.getAttribute('src');
   photo.hidden=!visible;if(visible)photo.src=source.currentSrc||source.src;else photo.removeAttribute('src');
  }
  function restore(){
   if(!placed)return;
   if(uhzMoreDialog.open)uhzMoreDialog.close();
   for(const item of [...moved].reverse()){item.marker.replaceWith(item.element);}
   for(const item of labels)item.element.textContent=item.text;
   header.classList.remove('uhz-unified-header');root.classList.remove('uhz-unified-account');
   uhzMoreButton.replaceChildren(document.createTextNode('\u2022\u2022\u2022'));uhzMoreButton.removeAttribute('aria-haspopup');uhzMoreButton.removeAttribute('aria-expanded');uhzMoreButton.removeAttribute('title');
   for(const item of [chat,campaigns,...accountEntries])item.hidden=true;
   placed=false;
  }
  function layout(){
   if(!desktop.matches||!root.classList.contains('uhz-signed-in')){restore();return;}
   if(!placed){
    for(const item of moved)item.element.before(item.marker);
    header.classList.add('uhz-unified-header');root.classList.add('uhz-unified-account');
    header.append(nav,balances,uhzMoreButton);sidebar.append(home);
    for(const item of [chat,campaigns,...accountEntries])item.hidden=false;
    if(homeButton)homeButton.lastElementChild.textContent='Inicio';if(contribute)contribute.lastElementChild.textContent='Aportar';if(guide)guide.textContent='Gu\xEDa y licencias';
    uhzMoreButton.replaceChildren(avatar);uhzMoreButton.setAttribute('aria-haspopup','dialog');uhzMoreButton.setAttribute('aria-expanded',String(uhzMoreDialog.open));uhzMoreButton.title='Mi cuenta';
    balances.setAttribute('aria-label','Consultar mis saldos de Coins y Gold');
    placed=true;
   }
   syncAvatar();
   const active=root.dataset.accountPanel;chat.classList.toggle('active',active==='chat');if(active==='chat')chat.setAttribute('aria-current','page');else chat.removeAttribute('aria-current');
  }
  uhzMoreButton.addEventListener('click',()=>{if(placed)uhzMoreButton.setAttribute('aria-expanded',String(uhzMoreDialog.open));});
  uhzMoreDialog.addEventListener('close',()=>{if(placed)uhzMoreButton.setAttribute('aria-expanded','false');});
  desktop.addEventListener('change',layout);
  const beforeShow=showApp;showApp=function(){beforeShow();layout();};
  const beforeIdentity=updateEnterpriseIdentity;updateEnterpriseIdentity=function(){beforeIdentity();if(placed)syncAvatar();};
  layout();
 }
}

// Member-room interactions. No new SDK, public chat, presence counters or external assets.
{
 const panelNode=$('panel-chat'),feed=$('chatFeed'),form=$('chatForm'),input=$('chatText'),card=feed?.parentElement;
 if(panelNode&&feed&&form&&card){
  const svgPaths={send:['M22 2 9 15','M22 2 14 22 9 15 2 10 22 2'],smile:['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20','M8 14s1.5 3 4 3 4-3 4-3','M8 8h.01','M16 8h.01'],reply:['M9 10 4 15l5 5','M4 15h10a6 6 0 0 0 0-12h-2'],more:['M5 12h.01','M12 12h.01','M19 12h.01'],close:['M6 6l12 12','M18 6 6 18'],copy:['M9 9h12v12H9z','M15 9V3H3v12h6'],back:['M15 5 8 12l7 7'],down:['M6 9l6 6 6-6'],message:['M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5'],refresh:['M20 7v5h-5','M4 17v-5h5','M6.1 7a7 7 0 0 1 11.5-2L20 8','M4 16l2.4 3A7 7 0 0 0 18 17']};
  function icon(name){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.7');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');s.setAttribute('aria-hidden','true');for(const d of svgPaths[name]||[]){const p=document.createElementNS(s.namespaceURI,'path');p.setAttribute('d',d);s.append(p);}return s;}
  function button(label,name,cls=''){const b=el('button',null,cls);b.type='button';b.title=label;b.setAttribute('aria-label',label);b.append(icon(name));return b;}
  const reactions=[['\u2764\uFE0F','Me encanta'],['\u{1F44D}','Me gusta'],['\u{1F602}','Me divierte'],['\u{1F62E}','Me sorprende'],['\u{1F622}','Me entristece'],['\u{1F621}','Me enoja'],['\u{1F525}','Genial'],['\u{1F44F}','Aplausos']];
  const emojiGroups=[
   ['Caritas','\u{1F600}',[['\u{1F600}','sonrisa feliz'],['\u{1F603}','alegr\xEDa feliz'],['\u{1F604}','risa sonrisa'],['\u{1F601}','contento sonrisa'],['\u{1F606}','risas'],['\u{1F605}','risa nervios'],['\u{1F602}','risa l\xE1grimas'],['\u{1F923}','carcajada'],['\u{1F60A}','sonrisa amable'],['\u{1F970}','amor cari\xF1o'],['\u{1F60D}','enamorado amor'],['\u{1F618}','beso'],['\u{1F60E}','genial gafas'],['\u{1F913}','estudiar inteligente'],['\u{1F914}','pensar duda'],['\u{1FAE1}','saludo respeto'],['\u{1F917}','abrazo'],['\u{1F929}','estrellas emoci\xF3n'],['\u{1F973}','fiesta celebrar'],['\u{1F634}','dormir sue\xF1o'],['\u{1F622}','triste l\xE1grima'],['\u{1F62D}','llorar tristeza'],['\u{1F62E}','sorpresa'],['\u{1F631}','asombro miedo'],['\u{1F621}','enojo'],['\u{1F92F}','mente explosi\xF3n'],['\u{1F607}','\xE1ngel'],['\u{1F916}','robot tecnolog\xEDa'],['\u{1F440}','ojos mirar'],['\u{1F4AC}','conversaci\xF3n mensaje']]],
   ['Gestos','\u{1F44D}',[['\u{1F44D}','bien me gusta'],['\u{1F44E}','no me gusta'],['\u{1F44F}','aplausos'],['\u{1F64C}','celebrar manos'],['\u{1F91D}','acuerdo saludo'],['\u{1F64F}','gracias por favor'],['\u{1F44B}','hola adi\xF3s'],['\u{1F91A}','mano alto'],['\u{1F44C}','perfecto'],['\u270C\uFE0F','paz victoria'],['\u{1F91E}','suerte'],['\u{1F4AA}','fuerza'],['\u{1FAF6}','coraz\xF3n manos'],['\u270D\uFE0F','escribir'],['\u{1F44A}','pu\xF1o amistad'],['\u{1F919}','llamada saludo']]],
   ['Corazones','\u2764\uFE0F',[['\u2764\uFE0F','amor coraz\xF3n rojo'],['\u{1F499}','coraz\xF3n azul'],['\u{1F49C}','coraz\xF3n morado'],['\u{1F49A}','coraz\xF3n verde'],['\u{1F9E1}','coraz\xF3n naranja'],['\u{1F49B}','coraz\xF3n amarillo'],['\u{1F5A4}','coraz\xF3n negro'],['\u{1F90D}','coraz\xF3n blanco'],['\u{1F90E}','coraz\xF3n caf\xE9'],['\u{1FA77}','coraz\xF3n rosa'],['\u{1F494}','coraz\xF3n roto'],['\u{1F495}','corazones cari\xF1o'],['\u{1F4AF}','cien excelente'],['\u2728','brillos estrellas'],['\u{1F525}','fuego genial'],['\u{1F389}','celebraci\xF3n fiesta']]],
   ['Ideas','\u{1F4A1}',[['\u{1F4A1}','idea luz'],['\u{1F680}','cohete proyecto'],['\u{1F30C}','universo espacio'],['\u269B\uFE0F','cu\xE1ntico \xE1tomo'],['\u{1F31F}','estrella'],['\u{1F4DA}','libros estudio'],['\u{1F4D6}','leer libro'],['\u{1F4DD}','nota escribir'],['\u{1F4BB}','computadora tecnolog\xEDa'],['\u{1F4F1}','tel\xE9fono m\xF3vil'],['\u{1F3A8}','arte dise\xF1o'],['\u{1F3B5}','m\xFAsica'],['\u{1F3AE}','juego'],['\u26BD','f\xFAtbol deporte'],['\u{1F30E}','mundo tierra'],['\u2600\uFE0F','sol d\xEDa'],['\u{1F319}','luna noche'],['\u2615','caf\xE9'],['\u{1F355}','pizza'],['\u{1F382}','cumplea\xF1os pastel'],['\u{1F3C6}','trofeo logro'],['\u2705','listo aprobado'],['\u2753','pregunta duda'],['\u{1F4CC}','importante marcador']]]
  ];
  const room={items:new Map(),root:null,rootCard:null,cursor:null,hasMore:false,history:false,loaded:false,loading:false,seq:0,reply:null,pending:null,sending:false,user:state.user?.id||null,blocked:false,latestStamp:null,reactionBusy:new Set()};
  const messageTime=v=>new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit'}).format(new Date(v));
  const dayText=v=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric'}).format(new Date(v));
  const sort=(a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id);
  const safeName=m=>m.is_owner?'T\xFA':m.author_name||'Miembro';
  panelNode.classList.add('uhz-social-chat');card.classList.add('uhz-messenger');feed.setAttribute('role','log');feed.setAttribute('aria-label','Mensajes de la sala');feed.setAttribute('aria-relevant','additions text');feed.setAttribute('aria-live','off');
  const feedback=el('div',null,'uhz-chat-feedback');feedback.hidden=true;feedback.setAttribute('role','status');panelNode.querySelector('.panel-heading').after(feedback);
  function tell(text,error=false){feedback.textContent=text;feedback.hidden=!text;feedback.classList.toggle('error',error);feedback.setAttribute('role',error?'alert':'status');}
  const live=el('div',null,'uhz-chat-sr');live.setAttribute('role','status');live.setAttribute('aria-live','polite');panelNode.append(live);
  const context=el('div',null,'uhz-chat-context');context.hidden=true;const back=button('Volver a la sala','back'),contextCopy=el('div');contextCopy.append(el('strong','Respuestas'),el('small','Una conversaci\xF3n dentro de la sala'));context.append(back,contextCopy);card.prepend(context);
  const latest=button('Ir a mensajes recientes','down','uhz-chat-latest');latest.append(el('span','Mensajes recientes'));latest.hidden=true;card.append(latest);
  const oldHelp=form.querySelector('.small'),label=form.querySelector('label'),send=form.querySelector('button[type=submit]');
  label.className='uhz-chat-sr';input.minLength=1;input.maxLength=1400;input.rows=1;input.placeholder='Escribe un mensaje\u2026';input.setAttribute('aria-describedby','uhzChatCount uhzChatHint');
  send.replaceChildren(icon('send'));send.setAttribute('aria-label','Enviar mensaje');send.title='Enviar mensaje';send.classList.add('uhz-chat-send');
  const emojiButton=button('Elegir emoji','smile','uhz-chat-emoji-toggle'),inputRow=el('div',null,'uhz-chat-input-row');emojiButton.setAttribute('aria-haspopup','dialog');emojiButton.setAttribute('aria-expanded','false');inputRow.append(emojiButton,label,input,send);
  const replyBar=el('div',null,'uhz-chat-replying');replyBar.hidden=true;const replyCopy=el('div'),cancelReply=button('Cancelar respuesta','close');replyBar.append(icon('reply'),replyCopy,cancelReply);
  const footer=el('div',null,'uhz-chat-compose-foot'),hint=el('small','Solo miembros verificados \xB7 No compartas datos privados.');hint.id='uhzChatHint';const counter=el('small','0 / 700');counter.id='uhzChatCount';footer.append(hint,counter);form.replaceChildren(replyBar,inputRow,footer);
  const refresh=$('chatRefresh');refresh.replaceChildren(icon('refresh'),el('span','Actualizar'));refresh.setAttribute('aria-label','Actualizar mensajes');
  const popup=el('div',null,'uhz-chat-picker');popup.id='uhzChatPicker';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');document.body.append(popup);
  let pickerMode=null,pickerMessage=null,pickerTrigger=null,emojiCategory=0,selection=[0,0],longPress=null;
  async function chatRpc(name,args={}){
   const control=new AbortController(),timer=setTimeout(()=>control.abort(),20000);
   try{const r=await fetch(ROOT+'/rest/v1/rpc/'+name,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(args),signal:control.signal});const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(d.message||'No se pudo completar la acci\xF3n.'),{status:r.status});return d;}
   catch(e){if(e.name==='AbortError')throw Object.assign(Error('No se confirm\xF3 la conexi\xF3n. Reintenta la operaci\xF3n.'),{uncertain:true});if(e instanceof TypeError)throw Object.assign(Error('No se pudo conectar. Comprueba tu conexi\xF3n.'),{uncertain:true});throw e;}finally{clearTimeout(timer);}
  }
  function resizeInput(){input.style.height='auto';input.style.height=Math.min(116,Math.max(42,input.scrollHeight))+'px';const length=Array.from(input.value).length;counter.textContent=length+' / 700';counter.classList.toggle('over',length>700);input.setCustomValidity(length>700?'El mensaje admite hasta 700 caracteres.':'');send.disabled=room.sending||room.blocked||(!room.pending&&length===0);}
  function chooseReply(m){if(room.pending||room.blocked)return;tell('');room.reply=m;replyCopy.replaceChildren(el('strong',m.is_owner?'Responder a tu mensaje':'Responder a '+safeName(m)),el('span',m.body.slice(0,130)));replyBar.hidden=false;input.focus();}
  function clearReply(){room.reply=null;replyBar.hidden=true;replyCopy.replaceChildren();}
  cancelReply.onclick=()=>{if(room.pending)return;clearReply();input.focus();};
  function closePicker(focus=false){popup.hidden=true;emojiButton.setAttribute('aria-expanded','false');if(pickerTrigger)pickerTrigger.setAttribute('aria-expanded','false');const target=pickerTrigger;pickerMode=null;pickerMessage=null;pickerTrigger=null;if(focus&&target?.isConnected)target.focus();}
  function placePicker(trigger){const r=trigger.getBoundingClientRect(),view=window.visualViewport,viewWidth=view?.width||innerWidth,viewHeight=view?.height||innerHeight,left=view?.offsetLeft||0,top=view?.offsetTop||0,width=Math.min(352,viewWidth-24);popup.style.width=width+'px';popup.style.maxHeight=Math.min(405,viewHeight-24)+'px';popup.style.left=Math.max(left+12,Math.min(left+viewWidth-width-12,r.right-width))+'px';const height=popup.getBoundingClientRect().height;popup.style.top=Math.max(top+12,Math.min(top+viewHeight-height-12,r.top-height-10))+'px';}
  function openPicker(mode,trigger,m=null){closePicker();pickerMode=mode;pickerMessage=m;pickerTrigger=trigger;trigger.setAttribute('aria-expanded','true');popup.replaceChildren();popup.setAttribute('aria-label',mode==='emoji'?'Elegir emojis':mode==='reaction'?'Reaccionar al mensaje':'Acciones del mensaje');popup.hidden=false;
   const head=el('div',null,'uhz-picker-head'),close=button('Cerrar selector','close');head.append(el('strong',mode==='emoji'?'Emojis':mode==='reaction'?'Tu reacci\xF3n':'Mensaje'),close);close.onclick=()=>closePicker(true);popup.append(head);
   if(mode==='reaction'){const tray=el('div',null,'uhz-reaction-choices');for(const [emoji,name] of reactions){const b=el('button',emoji);b.type='button';b.title=name;b.setAttribute('aria-label',name);const mine=m.reactions?.some(r=>r.emoji===emoji&&r.mine);b.setAttribute('aria-pressed',String(!!mine));b.onclick=()=>{closePicker(true);void react(m,mine?null:emoji);};tray.append(b);}popup.append(tray,el('p','Una reacci\xF3n por persona. Toca la elegida para quitarla.','uhz-picker-note'));}
   else if(mode==='actions'){
    for(const [name,key,action] of [['Responder','reply',()=>chooseReply(m)],['Reaccionar','smile',()=>openPicker('reaction',trigger,m)],['Copiar mensaje','copy',async()=>{try{await navigator.clipboard.writeText(m.body);tell('Mensaje copiado.');}catch{tell('No se pudo copiar. Puedes seleccionar el texto del mensaje.',true);}}]]){const b=button(name,key,'uhz-message-menu-option');b.append(el('span',name));b.onclick=()=>{closePicker(true);void action();};popup.append(b);}
   }else{
    const search=el('input');search.type='search';search.placeholder='Buscar emoji\u2026';search.setAttribute('aria-label','Buscar emoji');const categories=el('div',null,'uhz-emoji-categories'),grid=el('div',null,'uhz-emoji-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label','Emojis disponibles');
    const norm=v=>v.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
    const draw=()=>{grid.replaceChildren();const q=norm(search.value.trim()),items=q?emojiGroups.flatMap(g=>g[2]).filter(([emoji,name])=>norm(name).includes(q)||emoji.includes(q)):emojiGroups[emojiCategory][2];if(!items.length)grid.append(el('p','No hay coincidencias. Prueba otra palabra.','uhz-picker-note'));for(const [emoji,name] of items){const b=el('button',emoji);b.type='button';b.title=name;b.setAttribute('aria-label',name);b.onclick=()=>{const start=selection[0],end=selection[1],next=input.value.slice(0,start)+emoji+input.value.slice(end);if(Array.from(next).length>700){tell('El mensaje admite hasta 700 caracteres.',true);return;}input.setRangeText(emoji,start,end,'end');closePicker();input.focus();resizeInput();};grid.append(b);}for(const b of categories.children)b.setAttribute('aria-pressed',String(Number(b.dataset.category)===emojiCategory&&!q));if(pickerTrigger)placePicker(pickerTrigger);};
    emojiGroups.forEach(([name,emoji],i)=>{const b=el('button',emoji);b.type='button';b.title=name;b.dataset.category=String(i);b.setAttribute('aria-label',name);b.onclick=()=>{emojiCategory=i;search.value='';draw();};categories.append(b);});search.oninput=draw;popup.append(search,categories,grid);draw();
   }
   placePicker(trigger);requestAnimationFrame(()=>{if(!popup.hidden&&pickerTrigger===trigger)placePicker(trigger);});if(mode==='emoji')popup.querySelector('input').focus();else popup.querySelector('.uhz-reaction-choices button,.uhz-message-menu-option')?.focus();
  }
  emojiButton.onclick=()=>{if(room.pending||room.blocked)return;if(pickerMode==='emoji'){closePicker(true);return;}selection=[input.selectionStart,input.selectionEnd];openPicker('emoji',emojiButton);};
  document.addEventListener('pointerdown',e=>{if(!popup.hidden&&!popup.contains(e.target)&&!pickerTrigger?.contains(e.target))closePicker();});
  popup.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closePicker(true);return;}const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];if(!keys.includes(e.key)||e.target.tagName==='INPUT')return;const buttons=[...popup.querySelectorAll('.uhz-emoji-grid button,.uhz-reaction-choices button')],i=buttons.indexOf(e.target);if(i<0)return;e.preventDefault();const step=pickerMode==='reaction'?4:Math.max(1,getComputedStyle(e.target.parentElement).gridTemplateColumns.split(' ').length),next=e.key==='Home'?0:e.key==='End'?buttons.length-1:i+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-step,ArrowDown:step}[e.key]||0);buttons[(next+buttons.length)%buttons.length]?.focus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!popup.hidden){e.preventDefault();closePicker(true);}});
  const reposition=()=>requestAnimationFrame(()=>{if(!popup.hidden&&pickerTrigger?.isConnected)placePicker(pickerTrigger);});window.addEventListener('resize',reposition);window.visualViewport?.addEventListener('resize',reposition);
  feed.addEventListener('scroll',()=>{if(!popup.hidden)closePicker();if(feed.scrollHeight-feed.scrollTop-feed.clientHeight<70&&!room.history)latest.hidden=true;});
  function reactionBar(m,root){root.replaceChildren();for(const r of m.reactions||[]){const b=el('button',null,'uhz-message-reaction'+(r.mine?' selected':''));b.type='button';b.setAttribute('aria-pressed',String(!!r.mine));b.setAttribute('aria-label',r.emoji+' \xB7 '+r.count+(r.mine?' \xB7 Tu reacci\xF3n':''));b.title=r.emoji+' \xB7 '+r.count+(r.mine?' \xB7 Toca para quitar tu reacci\xF3n':'');b.append(el('span',r.emoji),el('small',r.count));b.onclick=()=>void react(m,r.mine?null:r.emoji);root.append(b);}}
  async function react(m,emoji){if(room.blocked||room.reactionBusy.has(m.id))return;room.reactionBusy.add(m.id);const owner=state.user?.id,row=document.getElementById('uhz-msg-'+m.id);row?.setAttribute('aria-busy','true');try{const rows=await chatRpc('community_chat_react',{p_id:m.id,p_emoji:emoji});if(state.user?.id!==owner)return;const current=room.items.get(m.id)||(room.rootCard?.id===m.id?room.rootCard:m);current.reactions=rows;m.reactions=rows;const bar=document.getElementById('uhz-msg-'+m.id)?.querySelector('.uhz-message-reactions');if(bar)reactionBar(current,bar);live.textContent=emoji?'Reacci\xF3n guardada.':'Reacci\xF3n retirada.';}catch(e){tell(e.message,true);}finally{room.reactionBusy.delete(m.id);row?.removeAttribute('aria-busy');}}
  function avatar(m){const a=el('span',null,'uhz-chat-avatar');a.setAttribute('aria-hidden','true');a.textContent=(m.author_name||'M').trim().split(/\\s+/).slice(0,2).map(s=>Array.from(s)[0]).join('').toUpperCase();return a;}
  function message(m,isRoot=false){const row=el('article',null,'uhz-message'+(m.is_owner?' own':'')+(m.reply_to?' is-reply':'')+(isRoot?' thread-root':''));row.id='uhz-msg-'+m.id;row.dataset.message=m.id;const column=el('div',null,'uhz-message-column'),meta=el('div',null,'uhz-message-meta'),time=el('time',messageTime(m.created_at));time.dateTime=m.created_at;time.title=dayText(m.created_at)+' \xB7 '+messageTime(m.created_at);meta.append(el('strong',safeName(m)),time);const bubble=el('div',null,'uhz-message-bubble');
   if(m.reply_to){const quote=el('button',null,'uhz-message-quote');quote.type='button';quote.append(icon('reply'),el('strong',m.reply_to.available?m.reply_to.author_name:'Mensaje no disponible'),el('span',m.reply_to.available?m.reply_to.preview:'El mensaje original dej\xF3 de estar disponible.'));quote.disabled=!m.reply_to.available;quote.title='Ver conversaci\xF3n';quote.onclick=()=>void openThread(m.thread_root_id);bubble.append(quote);}
   bubble.append(el('div',m.body,'uhz-message-body'));const actions=el('div',null,'uhz-message-actions'),reply=button(m.is_owner?'Responder a tu mensaje':'Responder a '+safeName(m),'reply'),reaction=button(m.is_owner?'Reaccionar a tu mensaje':'Reaccionar al mensaje de '+safeName(m),'smile'),more=button(m.is_owner?'M\xE1s acciones de tu mensaje':'M\xE1s acciones del mensaje de '+safeName(m),'more');reaction.setAttribute('aria-haspopup','dialog');more.setAttribute('aria-haspopup','dialog');reply.onclick=()=>chooseReply(m);reaction.onclick=()=>openPicker('reaction',reaction,m);more.onclick=()=>openPicker('actions',more,m);actions.append(reply,reaction,more);bubble.addEventListener('dblclick',e=>{if(!e.target.closest('button')&&!window.getSelection()?.toString())void react(m,'\u2764\uFE0F');});
   let origin=null;const cancelHold=()=>{clearTimeout(longPress);origin=null;};bubble.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||e.target.closest('button'))return;origin=[e.clientX,e.clientY];longPress=setTimeout(()=>{origin=null;openPicker('actions',more,m);},550);});bubble.addEventListener('pointermove',e=>{if(origin&&Math.hypot(e.clientX-origin[0],e.clientY-origin[1])>12)cancelHold();});for(const event of ['pointerup','pointercancel','pointerleave'])bubble.addEventListener(event,cancelHold);
   const bar=el('div',null,'uhz-message-reactions');reactionBar(m,bar);column.append(meta,bubble,bar);
   if(!m.reply_to&&m.reply_count>0&&!isRoot){const threads=el('button',m.reply_count+(m.reply_count===1?' respuesta':' respuestas'),'uhz-message-thread-link');threads.type='button';threads.onclick=()=>void openThread(m.id);column.append(threads);}
   row.append(avatar(m),column,actions);return row;
  }
  function render({bottom=false,older=false}={}){const nearBottom=feed.scrollHeight-feed.scrollTop-feed.clientHeight<70,oldHeight=feed.scrollHeight,oldTop=feed.scrollTop,focused=document.activeElement?.closest('[data-message]'),focusedId=focused?.dataset.message,focusName=focused?document.activeElement.getAttribute('aria-label'):null;feed.replaceChildren();context.hidden=!room.root;const rows=[...room.items.values()].sort(sort);
   if(room.hasMore){const olderButton=el('button','Cargar mensajes anteriores','uhz-chat-older');olderButton.type='button';olderButton.onclick=()=>void load({older:true});feed.append(olderButton);}
   if(room.rootCard)feed.append(message(room.rootCard,true));
   if(!rows.length&&!room.rootCard){const empty=el('div',null,'uhz-chat-empty');empty.append(icon('message'),el('strong','Tu comunidad, en una conversaci\xF3n'),el('p','Comparte una idea, responde una pregunta o env\xEDa tu primer emoji.'));feed.append(empty);}
   else if(!rows.length&&room.rootCard)feed.append(el('p','Todav\xEDa no hay respuestas.','uhz-chat-empty-replies'));
   let day='';for(const m of rows){const d=dayText(m.created_at);if(d!==day){feed.append(el('div',d,'uhz-chat-day'));day=d;}feed.append(message(m));}
   if(bottom||(!older&&nearBottom&&!room.history)){feed.scrollTop=feed.scrollHeight;latest.hidden=true;}else if(older){feed.scrollTop=Math.max(0,feed.scrollHeight-oldHeight+oldTop);}else{feed.scrollTop=oldTop;latest.hidden=!(room.history||!nearBottom);}
   if(room.history){latest.hidden=false;latest.querySelector('span').textContent='Volver a mensajes recientes';}
   if(focusedId&&focusName){const r=document.getElementById('uhz-msg-'+focusedId);[...r?.querySelectorAll('button')||[]].find(b=>b.getAttribute('aria-label')===focusName)?.focus({preventScroll:true});}
  }
  function applyUpdates(data){for(const id of data.unavailable||[]){room.items.delete(id);if(room.reply?.id===id){clearReply();tell('El mensaje al que respond\xEDas dej\xF3 de estar disponible.');}}for(const update of data.updates||[]){const m=room.items.get(update.id)||(room.rootCard?.id===update.id?room.rootCard:null);if(m){m.reactions=update.reactions;m.reply_count=update.reply_count;if(m.reply_to&&update.parent_available===false)m.reply_to={id:m.reply_to.id,available:false};}}}
  async function load({reset=false,older=false,auto=false,bottom=false}={}){if(!state.user?.email_confirmed_at||state.user.must_change_password||state.recoveryActive||state.callbackPending||room.loading)return;if(auto&&!popup.hidden)return;room.loading=true;refresh.disabled=true;feed.setAttribute('aria-busy','true');const seq=++room.seq,owner=state.user.id;try{const data=await chatRpc('community_chat_feed',{p_root:room.root,p_before:older?room.cursor?.before||null:null,p_before_id:older?room.cursor?.before_id||null:null,p_known:[...new Set([...(room.rootCard?[room.rootCard.id]:[]),...room.items.keys()])].slice(-120)});if(seq!==room.seq||state.user?.id!==owner)return;
    const initialLoad=!room.loaded,nearBottom=feed.scrollHeight-feed.scrollTop-feed.clientHeight<70;if(reset){room.items.clear();room.history=false;}if(!room.history||older||reset){for(const m of data.items)room.items.set(m.id,m);}applyUpdates(data);room.rootCard=data.root;if(reset||older||initialLoad)room.hasMore=data.has_more;
    if(older||room.items.size>(room.root?119:120)){room.history=older||!nearBottom;const ordered=[...room.items.values()].sort(sort);while(ordered.length>(room.root?119:120)){const remove=room.history?ordered.pop():ordered.shift();room.items.delete(remove.id);if(!room.history)room.hasMore=true;}}const earliest=[...room.items.values()].sort(sort)[0];room.cursor=earliest?{before:earliest.created_at,before_id:earliest.id}:null;input.placeholder=room.root?'Escribe una respuesta\u2026':'Escribe un mensaje\u2026';
    const wasLoaded=room.loaded,latestMessage=data.items.at(-1),newMessage=latestMessage&&room.latestStamp&&sort(latestMessage,room.latestStamp)>0;if(!older&&latestMessage)room.latestStamp=latestMessage;room.loaded=true;room.blocked=false;input.disabled=!!room.pending;emojiButton.disabled=!!room.pending;resizeInput();render({bottom:bottom||!wasLoaded||reset,older});if(wasLoaded&&newMessage&&!older&&!reset){live.textContent='Hay mensajes nuevos en la sala.';}
    if(room.pending){const accepted=data.items.find(m=>m.is_owner&&m.request_id===room.pending.id);if(accepted)completeSend();}
   }catch(e){if(seq!==room.seq)return;if(room.root&&e.status===403){room.root=null;room.rootCard=null;room.items.clear();room.loaded=false;setTimeout(()=>void load({reset:true}),0);tell('La conversaci\xF3n dej\xF3 de estar disponible. Volviendo a la sala.');}else{tell(e.message,true);if(e.status===401||e.status===403){room.blocked=true;room.items.clear();room.rootCard=null;feed.replaceChildren(el('p','Inicia sesi\xF3n con una cuenta verificada para acceder a los mensajes.','uhz-chat-empty-replies'));input.disabled=true;emojiButton.disabled=true;resizeInput();}}}finally{if(seq===room.seq){room.loading=false;refresh.disabled=false;feed.removeAttribute('aria-busy');}}}
  async function openThread(id){if(room.loading)return;closePicker();room.root=id;room.items.clear();room.rootCard=null;room.loaded=false;room.history=false;await load({reset:true});feed.focus();}
  back.onclick=()=>{if(room.loading)return;room.root=null;room.rootCard=null;room.loaded=false;void load({reset:true});};latest.onclick=()=>void load({reset:true,bottom:true});refresh.onclick=()=>void load({reset:true,bottom:true});
  function completeSend(){form.removeAttribute('aria-busy');input.value='';room.pending=null;room.sending=false;input.disabled=false;emojiButton.disabled=false;send.classList.remove('retry');send.replaceChildren(icon('send'));send.setAttribute('aria-label','Enviar mensaje');send.title='Enviar mensaje';clearReply();resizeInput();live.textContent='Mensaje enviado.';}
  form.onsubmit=async e=>{e.preventDefault();if(room.sending||room.blocked)return;const body=input.value.trim();if(!room.pending&&(!body||Array.from(body).length>700)){resizeInput();return;}if(!room.pending)room.pending={id:crypto.randomUUID(),body,reply:room.reply?.id||room.root||null};const pending=room.pending;room.sending=true;form.setAttribute('aria-busy','true');input.disabled=true;emojiButton.disabled=true;send.disabled=true;tell('');closePicker();try{const accepted=await chatRpc('community_chat_send',{p_body:pending.body,p_reply_to:pending.reply,p_request_id:pending.id});if(typeof accepted!=='string'||!/^[0-9a-f-]{36}$/i.test(accepted))throw Object.assign(Error('No se confirm\xF3 el env\xEDo.'),{uncertain:true});if(room.pending?.id!==pending.id)return;completeSend();room.history=false;room.loaded=false;await load({reset:true,bottom:true});input.focus();}
   catch(error){if(room.pending?.id!==pending.id)return;room.sending=false;form.removeAttribute('aria-busy');if(error.uncertain||error.status>=500){tell('No confirmamos el env\xEDo. Pulsa Reintentar para comprobarlo sin duplicarlo.',true);send.classList.add('retry');send.replaceChildren(icon('refresh'));send.setAttribute('aria-label','Reintentar env\xEDo');send.title='Reintentar env\xEDo';send.disabled=false;}else{room.pending=null;input.disabled=false;emojiButton.disabled=false;tell(error.message,true);resizeInput();}}finally{if(!room.sending)send.disabled=room.blocked||(!room.pending&&!input.value.trim());}};
  input.addEventListener('input',resizeInput);input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&matchMedia('(hover:hover) and (pointer:fine)').matches){e.preventDefault();form.requestSubmit();}});
  const oldPanel=panel;panel=function(id){if(id!=='chat')closePicker();oldPanel(id);};
  const oldShow=showApp;showApp=function(){const id=state.user?.email_confirmed_at&&!state.user.must_change_password&&!state.recoveryActive&&!state.callbackPending?state.user.id:null;if(room.user!==id){room.user=id;room.seq++;room.loading=false;room.items.clear();room.root=null;room.rootCard=null;room.reply=null;room.pending=null;room.loaded=false;room.blocked=false;input.value='';closePicker();clearReply();resizeInput();feed.removeAttribute('aria-busy');refresh.disabled=false;feed.replaceChildren();}oldShow();};
  chatLoad=async function(){await load({auto:true});};resizeInput();feed.tabIndex=-1;if(state.user?.email_confirmed_at&&document.documentElement.dataset.accountPanel==='chat')void load();
 }
}
`;
var ADDON_CSS = `
.chatfeed{display:flex;flex-direction:column;gap:12px;max-height:420px;min-height:160px;overflow:auto;padding:12px 3px 18px}
.chatbubble{border-radius:14px;background:#19324a;border:1px solid #38607b;padding:13px 16px;max-width:88%;align-self:flex-start;overflow-wrap:anywhere}
.chatbubble.own{align-self:flex-end;background:#1c5364}
.chatbubble strong{display:block;font-size:12px;color:var(--accent);margin-bottom:6px}
.chatbody{font-size:14px;white-space:pre-wrap;line-height:1.55}
.mini-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}
.mini-metric{padding:12px;border:1px solid var(--line);border-radius:13px;display:flex;flex-direction:column;gap:6px}
.mini-metric strong{font-size:24px;color:var(--accent)}
.mini-metric span{font-size:11px;color:var(--muted)}
.coins-wallet{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:25px;margin:20px 0;border:1px solid #459fbd;border-radius:20px;background:linear-gradient(120deg,#103755,#14647c);color:white}
.coins-wallet .eyebrow{color:#d6f3f8}
.coins-wallet strong{font-size:65px;color:#b9f8ff}
.coins-number{font-size:48px;font-weight:900}
.profile-business{padding:22px;border:1px solid #477b9b;border-radius:20px;background:linear-gradient(115deg,#173f59,#114666);margin:16px 0}
.profile-business h3{color:#fff}
.profile-business p{color:#cce5f3}
.profile-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.profile-stats .feature{text-align:center}
.profile-stats strong{display:block;font-size:30px;color:var(--accent)}
.profile-stats span{font-size:12px;color:var(--muted)}
html.embedded .chatbubble{background:#edf7ff;color:#153854;border-color:#c9e1ef}
html.embedded .chatbubble.own{background:#d8effb}
html.embedded .mini-metric{background:#f5f9fc}
html.embedded .mini-metric strong{color:#0a567b}
html.embedded .profile-business{background:linear-gradient(120deg,#e7f3fd,#f5faff);border-color:#bddbe9}
html.embedded .profile-business h3{color:#063254}
html.embedded .profile-business p{color:#3d617d}
@media(max-width:620px){.mini-metrics{grid-template-columns:repeat(2,1fr)}.profile-stats{grid-template-columns:1fr 1fr}.coins-wallet{padding:17px}}

/* Account-only styles; do not affect the public page, ads or Robot. */
html.uhz-account-app{--uhz-navy:#0b1423;--uhz-blue:#1479cf;--uhz-text:#173650;--uhz-soft:#f3f7fb;--uhz-line:#dce6ef;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color-scheme:light}
html.uhz-account-app body{margin:0;background:#f3f7fb;color:var(--uhz-text);min-width:0}
html.uhz-account-app main.shell{max-width:none!important;width:100%!important;margin:0!important;padding:0!important;min-height:100dvh}
html.uhz-account-app .hide{display:none!important}
html.uhz-account-app .top,html.uhz-account-app #welcome,html.uhz-account-app #intro,html.uhz-account-app #privateArea>.hero,html.uhz-account-app footer{display:none!important}
html.uhz-account-app .field{margin:16px 0;gap:7px}
html.uhz-account-app .field label{font-size:13px!important;font-weight:650;color:#284b65}
html.uhz-account-app input:not([type=checkbox]):not([type=radio]),html.uhz-account-app select,html.uhz-account-app textarea{box-sizing:border-box;border:1px solid #cddbe7;border-radius:10px;background:#fff;color:#173650;font-family:inherit!important;font-size:15px;line-height:1.5;font-weight:400;padding:12px 14px;min-height:48px;max-width:100%;box-shadow:none}
html.uhz-account-app input:focus,html.uhz-account-app textarea:focus,html.uhz-account-app select:focus{outline:3px solid #d6edff;outline-offset:1px;border-color:#1479cf}
html.uhz-account-app button{font-family:inherit;cursor:pointer;touch-action:manipulation}
html.uhz-account-app button:focus-visible,html.uhz-account-app a:focus-visible{outline:3px solid #50b9f1;outline-offset:3px}
html.uhz-account-app .button{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid #1479cf;border-radius:10px;background:#1479cf;color:#fff;font-size:14px!important;font-weight:650;line-height:1.4;padding:12px 17px;min-height:46px;box-shadow:none;white-space:normal}
html.uhz-account-app .button.outline,html.uhz-account-app .button.ghost{background:#fff;color:#1867a3;border-color:#cedeea}
html.uhz-account-app .button:hover{transform:none;filter:brightness(.97)}
html.uhz-account-app h2{font-size:24px;letter-spacing:-.55px;line-height:1.25}
html.uhz-account-app h3{font-size:17px;line-height:1.4}
html.uhz-account-app p{line-height:1.65}
html.uhz-account-app .small{font-size:12px;line-height:1.6;color:#5c7286}
html.uhz-account-app .eyebrow{font-size:10px;letter-spacing:1.5px;font-weight:700;color:#53738b}
html.uhz-account-app #authArea{display:grid;grid-template-columns:42% 58%;width:100%;max-width:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#fff;min-height:calc(100dvh - 0px);box-shadow:none!important;overflow:hidden}
html.uhz-account-app .uhz-auth-brand{padding:48px 34px;background:radial-gradient(ellipse at 10% 0%,#184c70 0%,#0c1d31 48%,#0b1423 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
html.uhz-account-app .uhz-auth-logo{width:88px;height:88px;object-fit:contain;margin-bottom:20px}
html.uhz-account-app .uhz-auth-motto{font-size:9px;font-weight:700;letter-spacing:1.8px;color:#80c5ed}
html.uhz-account-app .uhz-auth-brand h2{font-size:31px;color:#fff;line-height:1.2;margin:16px 0}
html.uhz-account-app .uhz-auth-brand>p{font-size:13px;color:#b7cce0;margin:0}
html.uhz-account-app .uhz-auth-benefits{margin-top:27px;border-top:1px solid #ffffff24;padding-top:16px}
html.uhz-account-app .uhz-auth-benefits p{font-size:11px;line-height:1.6;color:#d7e7f5;display:flex;gap:10px;margin:12px 0}
html.uhz-account-app .uhz-auth-benefits p span{color:#71cbf6}
html.uhz-account-app .uhz-auth-form{padding:40px 42px;align-self:center;min-width:0}
html.uhz-account-app .uhz-auth-tabs{display:grid;grid-template-columns:1fr 1fr;padding:4px;border:1px solid #e1eaf2;border-radius:12px;background:#f3f7fa;margin-bottom:29px;gap:4px}
html.uhz-account-app .uhz-auth-tabs[hidden]{display:none}
html.uhz-account-app .uhz-auth-tabs button{border:0;background:transparent;color:#61758a;border-radius:8px;min-height:41px;font-size:12px;font-weight:650;padding:8px}
html.uhz-account-app .uhz-auth-tabs button[aria-pressed=true]{background:#fff;color:#1479cf;box-shadow:0 2px 7px #193b5b10}
html.uhz-account-app .uhz-auth-form>h2{font-size:27px;margin:0 0 8px;color:#12334e;line-height:1.2}
html.uhz-account-app .uhz-auth-form>p{font-size:13px;color:#60788b;margin:0 0 22px}
html.uhz-account-app #authArea form>button[type=submit]{width:100%;margin-top:6px}
html.uhz-account-app #authArea #authLogin>.actions{display:flex!important;justify-content:center;margin-top:18px!important}
html.uhz-account-app #showRegister{display:none!important}
html.uhz-account-app #authArea #showRecover,html.uhz-account-app #authArea #backLogin1,html.uhz-account-app #authArea #backLogin2{width:auto!important;min-height:40px!important;padding:7px!important;font-size:12px!important;border:0!important;background:transparent!important;color:#1769a8!important}
html.uhz-account-app .uhz-auth-form>.uhz-auth-foot{font-size:10px!important;color:#7990a3!important;line-height:1.6;border-top:1px solid #e5edf3;margin:25px 0 0;padding-top:17px}
html.uhz-account-app .uhz-member-top,html.uhz-account-app .uhz-account-bottom,html.uhz-account-app #uhzEmbedNav{display:none!important}
html.uhz-account-app.uhz-signed-in #uhzEmbedNav{display:block!important;position:fixed;inset:0 auto 0 0;width:200px;box-sizing:border-box;margin:0!important;padding:26px 15px!important;background:#0b1423!important;border:0!important;overflow:auto;z-index:20}
html.uhz-account-app #uhzEmbedNav>*:not(.uhz-account-sidebar){display:none!important}
html.uhz-account-app .uhz-account-sidebar{display:flex;flex-direction:column;gap:4px;min-height:calc(100dvh - 55px)}
html.uhz-account-app .uhz-sidebar-logo{width:48px;height:48px;margin:0 8px 14px}
html.uhz-account-app .uhz-sidebar-caption{font-size:9px;letter-spacing:1.4px;color:#7eabc8;padding:0 10px;margin-bottom:22px;font-weight:700}
html.uhz-account-app .uhz-sidebar-link{display:flex;align-items:center;gap:10px;min-height:46px;padding:11px 12px;background:transparent;border:1px solid transparent;border-radius:10px;color:#aec4d8;font-size:12px;text-align:left;line-height:1.4}
html.uhz-account-app .uhz-sidebar-link.active{color:#fff;background:#1479cf;border-color:#3196df}
html.uhz-account-app .uhz-sidebar-link:hover{background:#17354e;color:#fff}
html.uhz-account-app .uhz-nav-symbol{font-size:19px;line-height:1;min-width:20px;font-weight:500}
html.uhz-account-app .uhz-side-more{border-top:1px solid #284154;margin-top:18px;border-radius:0}
html.uhz-account-app .uhz-side-exit{margin-top:auto;color:#91acc3}
html.uhz-account-app.uhz-signed-in .uhz-member-top{display:flex!important;align-items:center;justify-content:space-between;height:62px;background:#fff;border-bottom:1px solid #dde7ef;padding:0 30px;margin-left:200px;box-sizing:border-box}
html.uhz-account-app .uhz-member-top strong{font-size:13px;letter-spacing:.1px}
html.uhz-account-app .uhz-more-account{border:1px solid #d9e5ee;background:#f7fafd;color:#3c6988;width:40px;height:36px;border-radius:9px;font-size:17px;letter-spacing:2px}
html.uhz-account-app.uhz-signed-in #privateArea{margin-left:200px;padding:28px 30px 40px;min-width:0}
html.uhz-account-app .app-panel{margin:0!important;padding:0!important;border:0!important;background:transparent!important;max-width:100%;min-width:0}
html.uhz-account-app .app-panel>h2{margin:0 0 8px;font-size:27px}
html.uhz-account-app .app-panel>p{font-size:13px;color:#60758b;margin-bottom:22px}
html.uhz-account-app .card,html.uhz-account-app .post{background:#fff;border:1px solid #dfe8f0;border-radius:14px;box-shadow:none;padding:20px;min-width:0}
html.uhz-account-app .profile-stats{display:none!important}
html.uhz-account-app .profile-business{background:#fff;border:1px solid #dfe8f0;padding:18px;border-radius:14px;margin:20px 0}
html.uhz-account-app .uhz-profile-identity{min-height:120px;flex-wrap:nowrap}
html.uhz-account-app .profile-business .eyebrow,html.uhz-account-app .profile-business .uhz-profile-identity p{display:none}
html.uhz-account-app .profile-business h3{font-size:25px!important;margin:0 0 6px;overflow-wrap:anywhere}
html.uhz-account-app .uhz-home-identity{display:flex;align-items:center;gap:25px;margin-bottom:26px;min-width:0}
html.uhz-account-app .uhz-home-identity>div:last-child{min-width:0}
html.uhz-account-app .uhz-home-identity h1{font-size:30px;letter-spacing:-.8px;line-height:1.2;margin:10px 0;overflow-wrap:anywhere}
html.uhz-account-app .uhz-home-identity .uhz-quantum-avatar{width:88px;height:88px;margin:12px}
html.uhz-account-app .uhz-home-photo{position:absolute;inset:3px;width:calc(100% - 6px);height:calc(100% - 6px);object-fit:cover;border-radius:50%;z-index:2}
html.uhz-account-app .uhz-home-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:22px}
html.uhz-account-app .uhz-home-stats>div{display:flex;flex-direction:column;padding:17px 20px;background:#fff;border:1px solid #dce6ef;border-radius:13px;gap:5px}
html.uhz-account-app .uhz-home-stats strong{font-size:28px;color:#176eaf;line-height:1.2}
html.uhz-account-app .uhz-home-stats span{font-size:11px;color:#62798f}
html.uhz-account-app .uhz-earn-card{background:linear-gradient(110deg,#0b2239,#14507a);color:#fff;border:1px solid #225d86;border-radius:17px;padding:27px;margin:0 0 22px}
html.uhz-account-app .uhz-earn-card .eyebrow{color:#92cce9;font-size:9px}
html.uhz-account-app .uhz-earn-card h2{font-size:24px;color:#fff;max-width:440px;margin:12px 0}
html.uhz-account-app .uhz-earn-card>p{font-size:13px;color:#c3daed;max-width:490px;margin:0 0 18px}
html.uhz-account-app .uhz-earn-card .button.outline{background:transparent;color:#d9efff;border-color:#5d92b4}
html.uhz-account-app .uhz-earn-card .actions{display:flex;gap:9px;flex-wrap:wrap}
html.uhz-account-app .uhz-earn-disclosure{display:block;font-size:10px;color:#a2bfd5;margin-top:17px;line-height:1.6}
html.uhz-account-app .uhz-quick-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:27px}
html.uhz-account-app .uhz-quick-links>button{background:#fff;border:1px solid #dce6ef;border-radius:13px;text-align:left;padding:17px;display:grid;grid-template-columns:22px 1fr;gap:9px;color:#1a4667;font-size:12px;font-weight:650;line-height:1.5}
html.uhz-account-app .uhz-quick-links small{grid-column:1/-1;color:#788d9f;font-size:11px;font-weight:400;line-height:1.5}
html.uhz-account-app .uhz-recent h2{font-size:18px;margin-bottom:14px}
html.uhz-account-app .uhz-contribution-status{display:flex;justify-content:space-between;gap:12px;padding:16px 0;border-bottom:1px solid #dde7ef;align-items:center}
html.uhz-account-app .uhz-contribution-status>div{display:grid;gap:6px;min-width:0}
html.uhz-account-app .uhz-contribution-status strong{font-size:13px;line-height:1.5;overflow-wrap:anywhere}
html.uhz-account-app .uhz-contribution-status .small{font-size:10px}
html.uhz-account-app .uhz-status-badge{font-size:10px;color:#617b90;background:#e9eff5;border-radius:20px;padding:6px 9px;white-space:nowrap}
html.uhz-account-app .uhz-status-badge.earned{background:#dff4ed;color:#177054}
html.uhz-account-app .uhz-empty-contributions{border:1px dashed #c6d7e4;border-radius:13px;padding:21px;background:#f9fcff}
html.uhz-account-app .uhz-empty-contributions p{font-weight:650;font-size:14px;margin:0 0 7px}
html.uhz-account-app .uhz-empty-contributions .small{display:block;margin-bottom:16px}
html.uhz-account-app .uhz-coin-guide,html.uhz-account-app .uhz-coin-progress{background:#fff;border:1px solid #dbe6ef;border-radius:14px;padding:22px;margin:18px 0}
html.uhz-account-app .uhz-coin-guide h3{margin:0 0 16px}
html.uhz-account-app .uhz-coin-guide ol{counter-reset:steps;list-style:none;padding:0;display:grid;gap:15px;margin:0 0 24px}
html.uhz-account-app .uhz-coin-guide li{counter-increment:steps;display:flex;gap:13px;align-items:center;font-size:13px;line-height:1.6}
html.uhz-account-app .uhz-coin-guide li:before{content:counter(steps);flex:none;width:28px;height:28px;display:grid;place-items:center;border:1px solid #c5dff2;background:#eaf5ff;border-radius:50%;color:#1479cf;font-size:11px;font-weight:700}
html.uhz-account-app #panel-coins .coins-wallet{border-radius:15px;padding:26px;background:linear-gradient(110deg,#102c46,#145680);color:#fff}
html.uhz-account-app #coinsHistory{overflow-x:auto}
html.uhz-account-app .uhz-ledger-table{min-width:280px;font-size:12px}
html.uhz-account-app .uhz-more-dialog{width:min(400px,calc(100vw - 24px));max-height:calc(100dvh - 30px);box-sizing:border-box;border:1px solid #cddde9;border-radius:20px;padding:18px;background:#fff;color:#163956;overflow:auto}
html.uhz-account-app .uhz-more-dialog::backdrop{background:#071727bb}
html.uhz-account-app .uhz-more-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
html.uhz-account-app .uhz-more-head h2{font-size:20px;margin:5px}
html.uhz-account-app .uhz-more-head>button{background:#edf4fa;border:1px solid #d7e4ee;border-radius:9px;width:40px;height:40px;font-size:24px;color:#315875}
html.uhz-account-app .uhz-more-link{display:flex;gap:10px;align-items:center;width:100%;border:0;border-bottom:1px solid #e8eff5;background:#fff;text-align:left;padding:13px 10px;min-height:46px;color:#264e6a;font-size:13px}
html.uhz-account-app .float-status{z-index:90;max-width:calc(100vw - 28px)}
@media(max-width:700px){
 html.uhz-account-app #authArea{grid-template-columns:1fr!important;min-height:100dvh}
 html.uhz-account-app .uhz-auth-brand{padding:24px 24px 26px;display:grid;grid-template-columns:52px 1fr;gap:0 15px;align-content:start;justify-content:initial}
 html.uhz-account-app .uhz-auth-logo{grid-row:1/3;width:52px;height:52px;margin:0}
 html.uhz-account-app .uhz-auth-motto{font-size:8px;align-self:end;letter-spacing:1px}
 html.uhz-account-app .uhz-auth-brand h2{font-size:18px;line-height:1.35;margin:6px 0 0;max-width:260px;letter-spacing:-.2px}
 html.uhz-account-app .uhz-auth-brand>p,html.uhz-account-app .uhz-auth-benefits{display:none}
 html.uhz-account-app .uhz-auth-form{align-self:start;padding:26px 24px 30px}
 html.uhz-account-app .uhz-auth-tabs{margin-bottom:24px}
 html.uhz-account-app .uhz-auth-form>h2{font-size:26px}
 html.uhz-account-app #authArea .uhz-auth-form>p{margin-bottom:20px}
 html.uhz-account-app input:not([type=checkbox]):not([type=radio]),html.uhz-account-app select,html.uhz-account-app textarea{font-size:16px!important}
 html.uhz-account-app.uhz-signed-in #uhzEmbedNav{display:none!important}
 html.uhz-account-app.uhz-signed-in .uhz-member-top{margin-left:0;padding:0 20px;height:56px;position:sticky;top:0;z-index:25}
 html.uhz-account-app.uhz-signed-in #privateArea{margin-left:0;padding:24px 20px calc(95px + env(safe-area-inset-bottom,0px))}
 html.uhz-account-app.uhz-signed-in .uhz-account-bottom{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));position:fixed;inset:auto 0 0;z-index:40;padding:7px 7px calc(7px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #d6e3ed;box-shadow:0 -4px 20px #14374b08}
 html.uhz-account-app .uhz-account-bottom button{min-width:0;min-height:50px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;border:0;border-radius:10px;background:transparent;color:#7b90a3;font-size:9px;font-weight:600;padding:6px 1px}
 html.uhz-account-app .uhz-account-bottom button.active{background:#eaf5ff;color:#1479cf}
 html.uhz-account-app .uhz-account-bottom .uhz-nav-symbol{font-size:23px}
 html.uhz-account-app .uhz-home-identity{gap:12px;margin-bottom:23px}
 html.uhz-account-app .uhz-home-identity .uhz-quantum-avatar{width:68px;height:68px;margin:10px}
 html.uhz-account-app .uhz-home-identity .uhz-avatar-glyph{font-size:31px}
 html.uhz-account-app .uhz-home-identity .eyebrow{font-size:8px;letter-spacing:1px}
 html.uhz-account-app .uhz-home-identity h1{font-size:23px;letter-spacing:-.5px;margin:6px 0}
 html.uhz-account-app .uhz-account-role{font-size:9px;padding:4px 8px;margin-top:2px}
 html.uhz-account-app .uhz-home-stats{gap:8px;margin-bottom:20px}
 html.uhz-account-app .uhz-home-stats>div{padding:14px 10px;gap:5px}
 html.uhz-account-app .uhz-home-stats strong{font-size:24px}
 html.uhz-account-app .uhz-home-stats span{font-size:10px}
 html.uhz-account-app .uhz-earn-card{padding:22px 20px}
 html.uhz-account-app .uhz-earn-card h2{font-size:23px}
 html.uhz-account-app .uhz-earn-card .eyebrow{font-size:8px;letter-spacing:1px}
 html.uhz-account-app .uhz-earn-card>p{font-size:12px}
 html.uhz-account-app .uhz-earn-card .actions{display:grid;grid-template-columns:1fr}
 html.uhz-account-app .uhz-earn-card .button{min-height:46px!important;font-size:12px!important}
 html.uhz-account-app .uhz-earn-disclosure{font-size:9px}
 html.uhz-account-app .uhz-quick-links{grid-template-columns:1fr;gap:9px;margin-bottom:25px}
 html.uhz-account-app .uhz-quick-links>button{grid-template-columns:25px 1fr;padding:14px 16px;gap:3px 10px;font-size:13px}
 html.uhz-account-app .uhz-quick-links .uhz-nav-symbol{grid-row:1/3;align-self:center}
 html.uhz-account-app .uhz-quick-links small{grid-column:2;font-size:10px}
 html.uhz-account-app .app-panel>h2{font-size:25px}
 html.uhz-account-app .card,html.uhz-account-app .post{padding:18px}
 html.uhz-account-app .layout2,html.uhz-account-app .grid.two{grid-template-columns:minmax(0,1fr)}
 html.uhz-account-app .uhz-profile-identity{gap:15px}
 html.uhz-account-app .profile-business h3{font-size:21px!important}
 html.uhz-account-app .uhz-profile-identity .uhz-quantum-avatar{width:67px;height:67px;margin:8px}
 html.uhz-account-app .uhz-avatar-picker{grid-template-columns:repeat(2,minmax(0,1fr))}
 html.uhz-account-app .uhz-coin-guide,html.uhz-account-app .uhz-coin-progress{padding:20px}
 html.uhz-account-app .uhz-coin-guide li{font-size:12px}
 html.uhz-account-app .float-status{inset:auto 12px 84px!important}
}
@media(prefers-reduced-motion:reduce){html.uhz-account-app *{scroll-behavior:auto!important}}

html.uhz-account-app input,html.uhz-account-app select,html.uhz-account-app textarea,html.uhz-account-app button{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif!important}

html.uhz-account-app #authArea #uhzVerifyEmailLink{border:0;background:transparent;color:#56758c;font-size:11px!important;padding:4px 0!important;min-height:36px;box-shadow:none}html.uhz-account-app .uhz-coin-guide>.uhz-superadmin-only{margin-top:12px}

html.uhz-account-app:not(.uhz-ui-ready) main.shell{visibility:hidden}html.uhz-account-app #uhzAccountLoading{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;color:#446780;font:500 13px/1.5 system-ui;background:#f3f7fb}html.uhz-account-app #uhzAccountLoading span{width:34px;height:34px;border:2px solid #d3e6f5;border-top-color:#1479cf;border-radius:50%;animation:uhzQuantumOrbit 1s linear infinite}html.uhz-account-app.uhz-ui-ready #uhzAccountLoading{display:none}
/* Override the previous mobile shell padding so the app uses the full screen. */
html.uhz-account-app.uhz-mobile-portal.embedded main.shell{padding:0!important;margin:0!important;width:100%!important}
html.uhz-account-app.uhz-mobile-portal.embedded #authArea{padding:0!important;margin:0!important}
@media(max-width:700px){html.uhz-account-app #authArea{grid-template-rows:max-content 1fr}}

@media(max-width:700px){html.uhz-account-app .uhz-more-account{width:44px;height:44px}}

/* Auth modules only. Public content, member panels, ads and Robot are unchanged. */
html.uhz-account-app #authArea{grid-template-columns:minmax(240px,.82fr) minmax(0,1.18fr);min-height:100dvh;align-items:stretch;overflow:visible}
html.uhz-account-app .uhz-auth-brand{padding:38px 32px;justify-content:center}
html.uhz-account-app .uhz-auth-logo{width:70px;height:70px;margin-bottom:18px}
html.uhz-account-app .uhz-auth-brand h2{font-size:29px;line-height:1.25;letter-spacing:-.65px;max-width:290px}
html.uhz-account-app .uhz-auth-benefits{margin-top:23px}
html.uhz-account-app .uhz-auth-form{width:100%;max-width:500px;margin:0 auto;padding:32px 38px;box-sizing:border-box;align-self:center}
html.uhz-account-app .uhz-auth-form>h2{font-size:28px;line-height:1.25;letter-spacing:-.6px;margin:0 0 8px}
html.uhz-account-app .uhz-auth-form>h2:focus{outline:none}
html.uhz-account-app .uhz-auth-form>p{font-size:14px;line-height:1.6;margin:0 0 22px}
html.uhz-account-app #authArea .field{margin:0 0 17px;display:flex;flex-direction:column;gap:7px}
html.uhz-account-app #authArea input{width:100%;min-width:0;min-height:50px;font-size:16px}
html.uhz-account-app .uhz-password-field{position:relative;width:100%}
html.uhz-account-app .uhz-password-field input{padding-right:83px}
html.uhz-account-app .uhz-password-toggle{position:absolute;right:4px;top:4px;bottom:4px;min-width:70px;min-height:42px;padding:6px 8px;border:0;border-radius:7px;background:transparent;color:#246a9e;font-size:12px;font-weight:600}
html.uhz-account-app #authArea .button{min-height:48px;font-size:15px!important;border-radius:11px}
html.uhz-account-app #authArea button:disabled{cursor:wait;opacity:.65}
html.uhz-account-app #authArea #showRecover,html.uhz-account-app #authArea .uhz-auth-back{display:block;width:100%!important;border:0!important;background:transparent!important;color:#126db3!important;min-height:44px!important;font-size:14px!important;line-height:1.5;padding:12px 4px!important;text-align:center;border-radius:8px;margin:4px 0 0}
html.uhz-account-app .uhz-auth-divider{display:flex;align-items:center;gap:12px;color:#6b8093;font-size:12px;margin:13px 0 18px}
html.uhz-account-app .uhz-auth-divider::before,html.uhz-account-app .uhz-auth-divider::after{content:'';height:1px;flex:1;background:#e0e8ef}
html.uhz-account-app #authArea #showRegister{display:flex!important;width:100%;border-color:#bdd7ec;background:#eff7fe;color:#1267a6;margin:0}
html.uhz-account-app #authArea .uhz-auth-feedback{border:1px solid #b9ddcc;border-radius:10px;background:#edf8f2;color:#1d6547;font-size:13px;line-height:1.65;padding:12px 14px;margin:0 0 15px;overflow-wrap:anywhere}
html.uhz-account-app #authArea .uhz-auth-feedback.error{background:#fff2f2;border-color:#efc2c2;color:#913c3c}
html.uhz-account-app #authArea .uhz-auth-feedback:focus{outline:2px solid #99bcd8;outline-offset:2px}
html.uhz-account-app .uhz-register-note{margin:13px 0 0;text-align:center}
html.uhz-account-app .uhz-recover-help{margin:17px 0 4px}
html.uhz-account-app .uhz-auth-form>.uhz-auth-foot{margin-top:22px;padding-top:15px;font-size:11px!important;color:#657c90!important}
html.uhz-account-app .uhz-auth-link-help{margin-top:14px;padding-top:12px;border-top:1px solid #e5edf3;font-size:12px;color:#56738a}
html.uhz-account-app .uhz-auth-link-help>summary{cursor:pointer;padding:10px 0;min-height:24px;line-height:1.6}
html.uhz-account-app .uhz-auth-link-help #uhzVerifyEmailLink{display:none!important}
html.uhz-account-app .uhz-auth-link-help .small{font-size:12px!important}
html.uhz-account-app .uhz-auth-form #verifyEmailForm{margin-top:6px}
html.uhz-account-app #verifyEmailForm button{width:100%}
html.uhz-account-app #authArea[data-mode=authReset] .uhz-auth-link-help,html.uhz-account-app #authArea[data-mode=authConfirm] .uhz-auth-link-help{display:none}
html.uhz-account-app #authArea[data-mode=authLogin] .uhz-auth-link-help,html.uhz-account-app #authArea[data-mode=authRegister] .uhz-auth-link-help{display:none}
@media(min-width:701px) and (max-height:680px){
 html.uhz-account-app #authArea[data-mode=authLogin] .uhz-auth-form{padding:23px 34px}
 html.uhz-account-app #authArea[data-mode=authLogin] .uhz-auth-form>h2{font-size:26px;margin-bottom:6px}
 html.uhz-account-app #authArea[data-mode=authLogin] .uhz-auth-form>p{font-size:13px;margin-bottom:16px}
 html.uhz-account-app #authArea[data-mode=authLogin] .field{margin-bottom:13px;gap:6px}
 html.uhz-account-app #authArea[data-mode=authLogin] .field label{font-size:12px!important}
 html.uhz-account-app #authArea[data-mode=authLogin] input{min-height:48px;padding-top:10px;padding-bottom:10px}
 html.uhz-account-app #authArea[data-mode=authLogin] .uhz-auth-divider{margin:10px 0 14px}
 html.uhz-account-app #authArea[data-mode=authLogin] .uhz-auth-foot{border:0;margin-top:15px;padding-top:0}
 html.uhz-account-app #authArea[data-mode=authLogin] .uhz-auth-brand{padding:28px;justify-content:flex-start}
 html.uhz-account-app #authArea[data-mode=authLogin] .uhz-auth-brand h2{font-size:27px}
}
@media(max-width:700px){
 html.uhz-account-app #authArea{grid-template-columns:minmax(0,1fr)!important;min-height:100dvh;align-content:start}
 html.uhz-account-app .uhz-auth-brand{display:grid;grid-template-columns:48px minmax(0,1fr);gap:0 13px;padding:21px 23px;align-items:center;justify-content:initial}
 html.uhz-account-app .uhz-auth-logo{grid-row:1/3;width:48px;height:48px;margin:0}
 html.uhz-account-app .uhz-auth-motto{font-size:8px;letter-spacing:1.1px;line-height:1.4}
 html.uhz-account-app .uhz-auth-brand h2{font-size:19px;line-height:1.3;letter-spacing:.1px;margin:4px 0 0;max-width:none}
 html.uhz-account-app .uhz-auth-form{align-self:start;max-width:480px;padding:27px 23px 28px}
 html.uhz-account-app .uhz-auth-form>h2{font-size:27px}
 html.uhz-account-app .uhz-auth-form>p{margin-bottom:23px}
 html.uhz-account-app .uhz-auth-brand>p,html.uhz-account-app .uhz-auth-benefits{display:none}
}
html.uhz-account-app.uhz-mobile-portal.uhz-signed-out.embedded main.shell{padding:0!important}
html.uhz-account-app.uhz-mobile-portal.uhz-signed-out.embedded #authArea{padding:0!important;margin:0!important;border-radius:0!important}
@media(max-width:350px){html.uhz-account-app .uhz-auth-form{padding:23px 18px}html.uhz-account-app .uhz-auth-brand{padding:18px}}

/* Native account pages. The public homepage and legacy embedded view keep their styles. */
.uhz-page-header,.uhz-page-noscript{display:none}
html.uhz-standalone-account{--uhz-page-header-height:76px;scroll-padding-top:88px}
html.uhz-standalone-account body{min-height:100dvh;background:#f2f6fb}
html.uhz-standalone-account:not(.uhzg-active) .uhz-page-header{display:flex;min-height:var(--uhz-page-header-height);box-sizing:border-box;align-items:center;justify-content:space-between;gap:24px;padding:14px max(24px,calc((100vw - 1200px)/2));background:#0b1423;color:#fff;border-bottom:1px solid #203b55}
html.uhz-standalone-account .uhz-page-brand{display:flex;align-items:center;gap:13px;color:#fff;text-decoration:none;min-width:0}
html.uhz-standalone-account .uhz-page-brand img{width:43px;height:43px;flex:none}
html.uhz-standalone-account .uhz-page-brand strong{display:block;font-size:20px;line-height:1.25;letter-spacing:.4px}
html.uhz-standalone-account .uhz-page-brand small{display:block;font-size:10px;letter-spacing:.8px;line-height:1.5;color:#a8c4dc;margin-top:3px}
html.uhz-standalone-account .uhz-page-links{display:flex;align-items:center;gap:22px}
html.uhz-standalone-account .uhz-page-auth-nav{display:flex;align-items:center;gap:20px}
html.uhz-standalone-account .uhz-page-links a{font-size:13px;font-weight:600;text-decoration:none;color:#d5e9f8;line-height:1.4;min-height:44px;display:inline-flex;align-items:center}
html.uhz-standalone-account .uhz-page-auth-nav a[aria-current=page]{color:#fff;text-decoration:underline;text-underline-offset:6px}
html.uhz-standalone-account .uhz-page-links .uhz-page-home{border:1px solid #47647f;border-radius:9px;padding:0 15px;gap:8px;color:#fff;background:#152c43;white-space:nowrap}
html.uhz-standalone-account .uhz-page-links a:hover{color:#8fd5ff}
html.uhz-standalone-account main.shell{min-height:calc(100dvh - var(--uhz-page-header-height))}
html.uhz-standalone-account #authArea{max-width:1080px!important;width:calc(100% - 64px)!important;margin:44px auto!important;border:1px solid #d6e2ed!important;border-radius:22px!important;overflow:hidden;min-height:560px;box-shadow:0 16px 48px #193b5b0a!important;grid-template-columns:minmax(280px,.85fr) minmax(0,1.15fr)}
html.uhz-standalone-account .uhz-auth-brand{padding:48px 42px}
html.uhz-standalone-account .uhz-auth-form{max-width:500px;padding:40px 42px}
html.uhz-standalone-account #authArea a.uhz-auth-recover-link,html.uhz-standalone-account #authArea a.uhz-auth-back{text-decoration:none;box-sizing:border-box;display:block;text-align:center}
html.uhz-standalone-account #showRegister{text-decoration:none;box-sizing:border-box}
html.uhz-standalone-account #callbackRecover{display:block;text-align:center;text-decoration:none;min-height:44px;padding:12px 4px;color:#126db3}
html.uhz-standalone-account.uhz-signed-in .uhz-page-auth-nav{display:none}
html.uhz-standalone-account.uhz-signed-in #uhzEmbedNav{top:var(--uhz-page-header-height);min-height:0}
html.uhz-standalone-account.uhz-signed-in .uhz-member-top{position:sticky;top:0;z-index:25}
html.uhz-standalone-account .uhz-page-noscript{display:block;max-width:900px;margin:24px auto;padding:20px;color:#173650}
@media(max-width:900px){html.uhz-standalone-account .uhz-page-header{padding-left:24px;padding-right:24px}html.uhz-standalone-account .uhz-page-links{gap:14px}html.uhz-standalone-account #authArea{width:calc(100% - 40px)!important;margin:28px auto!important;grid-template-columns:minmax(240px,.8fr) minmax(0,1.2fr)}html.uhz-standalone-account .uhz-auth-brand{padding:32px 26px}html.uhz-standalone-account .uhz-auth-form{padding:32px 28px}}
@media(max-width:700px){
 html.uhz-standalone-account{--uhz-page-header-height:72px;scroll-padding-top:16px}
 html.uhz-standalone-account .uhz-page-header{padding:12px 18px;gap:12px}
 html.uhz-standalone-account .uhz-page-brand{gap:9px}
 html.uhz-standalone-account .uhz-page-brand img{width:36px;height:36px}
 html.uhz-standalone-account .uhz-page-brand strong{font-size:15px;letter-spacing:.1px}
 html.uhz-standalone-account .uhz-page-brand small{font-size:8px;letter-spacing:.2px;margin-top:2px}
 html.uhz-standalone-account .uhz-page-auth-nav{display:none}
 html.uhz-standalone-account .uhz-page-links .uhz-page-home{font-size:12px;min-height:44px;padding:0 11px}
 html.uhz-standalone-account #authArea{display:block;width:calc(100% - 28px)!important;max-width:480px!important;margin:24px auto!important;min-height:0;grid-template-columns:minmax(0,1fr)!important;border-radius:17px!important}
 html.uhz-standalone-account #authArea .uhz-auth-brand{display:none}
 html.uhz-standalone-account #authArea .uhz-auth-form{padding:29px 23px 26px;max-width:none}
 html.uhz-standalone-account #authArea .uhz-auth-form>h2{font-size:28px;margin-bottom:9px}
 html.uhz-standalone-account #authArea .field{margin-bottom:18px}
 html.uhz-standalone-account #authArea input{min-height:50px}
 html.uhz-standalone-account .uhz-account-bottom{padding-bottom:calc(7px + env(safe-area-inset-bottom,0px))}
}
@media(max-width:350px){html.uhz-standalone-account .uhz-page-header{padding:12px}html.uhz-standalone-account .uhz-page-brand strong{font-size:14px}html.uhz-standalone-account .uhz-page-brand small{font-size:7px}html.uhz-standalone-account .uhz-page-links .uhz-page-home{padding:0 9px}html.uhz-standalone-account #authArea .uhz-auth-form{padding:25px 18px}}

.uhz-license-entry{text-decoration:none;display:flex;align-items:center;justify-content:flex-start;gap:8px}.uhz-license-entry small{display:block;font-size:12px;font-weight:400}.uhz-quick-links>.uhz-license-entry{flex-direction:column;align-items:flex-start;padding:20px;border:1px solid #dbe7f0;border-radius:16px;background:#fff;color:#173b55;font-weight:700}.uhz-more-link.uhz-license-entry{min-height:44px;color:#173b55}.uhz-sidebar-link.uhz-license-entry{color:inherit}

.uhz-creator-wallet{display:flex;flex-wrap:wrap;align-items:center;gap:22px;border:1px solid #d7e6f1;background:#f5faff;padding:19px 21px;border-radius:14px;margin:20px 0;color:#315c7b;text-decoration:none}.uhz-creator-wallet span{font-size:12px}.uhz-creator-wallet strong{font-size:21px;margin-left:8px;color:#1478b8}.uhz-creator-wallet span:nth-child(2) strong{color:#9c6b17}.uhz-creator-wallet small{font-size:11px;margin-left:auto}.uhz-creator-wallet:hover{text-decoration:none;background:#edf6fd}@media(max-width:600px){.uhz-creator-wallet{padding:16px;gap:18px}.uhz-creator-wallet small{flex-basis:100%;margin-left:0}}

/* Requested top navigation: existing account actions retain their authorization. */
html.uhz-account-app.uhz-signed-in #uhzEmbedNav{position:relative!important;inset:auto!important;width:auto!important;max-width:1190px!important;height:auto!important;min-height:0!important;padding:10px 20px!important;margin:0 auto!important;border:0!important;border-bottom:1px solid #dce6ef!important;border-radius:0!important;background:#0b1b2c!important;overflow:visible!important}
html.uhz-account-app.uhz-signed-in .uhz-account-sidebar{flex-direction:row!important;flex-wrap:wrap!important;align-items:center!important;gap:5px!important;min-height:0!important;padding:0!important}
html.uhz-account-app.uhz-signed-in .uhz-sidebar-logo,html.uhz-account-app.uhz-signed-in .uhz-sidebar-caption{display:none!important}
html.uhz-account-app.uhz-signed-in .uhz-sidebar-link{font-size:11px!important;min-height:38px!important;padding:9px 12px!important;margin:0!important;flex:0 0 auto!important;white-space:nowrap!important}
html.uhz-account-app.uhz-signed-in .uhz-side-exit{margin-left:auto!important}
html.uhz-account-app.uhz-signed-in #privateArea{margin-left:0!important;width:100%!important;max-width:1190px!important;padding:24px 28px!important;margin-right:auto!important;margin-left:auto!important}
html.uhz-account-app.uhz-signed-in .uhz-member-top{margin-left:auto!important;margin-right:auto!important;width:100%!important;max-width:1190px!important;padding-left:25px!important;padding-right:25px!important;position:relative!important;top:auto!important;height:auto!important;min-height:62px!important}
html.uhz-account-app.uhz-signed-in .uhz-account-bottom{display:none!important}
.uhz-top-balances{display:flex;gap:14px;align-items:center;margin-left:auto;font-size:11px;color:#20465f}.uhz-top-balances strong{margin-left:5px;color:#1174b6;font-size:16px}.uhz-top-balances>span:nth-child(2) strong{color:#976510}
@media(max-width:700px){html.uhz-account-app.uhz-signed-in #uhzEmbedNav{display:block!important;padding:6px 12px!important;overflow:auto!important}html.uhz-account-app.uhz-signed-in .uhz-account-sidebar{flex-wrap:nowrap!important;min-width:max-content!important}html.uhz-account-app.uhz-signed-in .uhz-sidebar-link{font-size:10px!important;padding:9px 10px!important}html.uhz-account-app.uhz-signed-in .uhz-member-top{display:flex!important;flex-wrap:wrap;gap:10px;padding:12px 16px!important}html.uhz-account-app.uhz-signed-in #privateArea{padding:22px 16px 30px!important}.uhz-top-balances{gap:12px;font-size:10px}.uhz-top-balances strong{font-size:15px}html.uhz-account-app.uhz-signed-in .uhz-member-title{font-size:15px!important}}

.uhz-campaign-admin{padding-top:24px}.uhz-campaign-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:20px}.uhz-campaign-heading h2,.uhz-campaign-heading h3{margin-top:0}.uhz-campaign-heading .muted{max-width:670px}.uhz-campaign-actions{display:flex;gap:8px;flex-shrink:0}.uhz-campaign-toolbar{display:flex;align-items:end;gap:14px;margin-bottom:20px}.uhz-campaign-toolbar label{min-width:220px}.uhz-campaign-row{display:flex;align-items:center;justify-content:space-between;gap:24px;border-top:1px solid #dbe7f0;padding:18px 2px}.uhz-campaign-row strong{display:block;overflow-wrap:anywhere}.uhz-campaign-row small{display:block;color:#637a8e;margin-top:6px}.uhz-campaign-row .button{flex-shrink:0}.uhz-campaign-box{border:1px solid #d3e3ee;border-radius:14px;padding:25px;margin-top:28px;background:#fff;scroll-margin-top:28px}.uhz-campaign-box h3{font-size:22px}.uhz-campaign-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}.uhz-campaign-admin textarea{min-height:80px;resize:vertical}.uhz-campaign-admin p{overflow-wrap:anywhere;white-space:pre-wrap}.uhz-campaign-admin input,.uhz-campaign-admin textarea,.uhz-campaign-admin select{max-width:100%;min-width:0}.uhz-campaign-check{display:flex!important;align-items:flex-start;gap:9px;line-height:1.6;margin:16px 0!important;font-weight:400!important}.uhz-campaign-check input{width:18px!important;height:18px;min-width:18px;margin-top:4px}.uhz-campaign-find{display:flex;align-items:end;gap:12px;margin:20px 0}.uhz-campaign-find label{flex:1;margin:0}.uhz-campaign-review{border-top:2px solid #247fb5;margin-top:20px;padding-top:22px;scroll-margin-top:30px}.uhz-campaign-review p,.uhz-campaign-box #uhzCampaignSelected p{line-height:1.7}.uhz-campaign-admin .small{font-size:12px}@media(max-width:760px){.uhz-campaign-heading,.uhz-campaign-row{flex-direction:column;gap:12px}.uhz-campaign-fields{grid-template-columns:1fr}.uhz-campaign-box{padding:18px}.uhz-campaign-actions{flex-wrap:wrap}.uhz-campaign-toolbar,.uhz-campaign-find{flex-direction:column;align-items:stretch}.uhz-campaign-toolbar label{min-width:0}}

/* This desktop treatment shares the creator workspace's existing brand and palette. */
.uhz-desktop-account-entry[hidden],.uhz-header-photo[hidden]{display:none!important}
@media(min-width:1024px){
 html.uhz-account-app.uhz-signed-in.uhz-unified-account{--uhz-page-header-height:96px}
 html.uhz-account-app.uhz-signed-in.uhz-unified-account:not(.uhzg-active) .uhz-page-header.uhz-unified-header{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;column-gap:23px;min-height:96px;padding:0 30px;background:#0b1423;border-bottom:1px solid #20384c}
 html.uhz-unified-account .uhz-page-brand{gap:12px}
 html.uhz-unified-account .uhz-page-brand img{width:42px;height:42px}
 html.uhz-unified-account .uhz-page-brand strong{font-size:20px;letter-spacing:.3px;white-space:nowrap}
 html.uhz-unified-account .uhz-page-brand small{font-size:10px;letter-spacing:.5px;margin-top:3px;color:#a6c4dc}
 html.uhz-unified-account .uhz-page-links{display:none!important}
 html.uhz-account-app.uhz-signed-in.uhz-unified-account #uhzEmbedNav{grid-column:2;grid-row:1;max-width:none!important;width:100%!important;margin:0!important;padding:10px 0!important;background:transparent!important;border:0!important;overflow:visible!important;z-index:auto}
 html.uhz-account-app.uhz-signed-in.uhz-unified-account .uhz-account-sidebar{justify-content:flex-end!important;gap:17px!important;flex-wrap:wrap!important;align-items:center!important;min-width:0!important}
 html.uhz-account-app.uhz-unified-account .uhz-unified-header .uhz-sidebar-link,html.uhz-account-app.uhz-unified-account .uhz-unified-header .uhz-page-home{display:inline-flex;align-items:center;flex:0 0 auto;min-height:40px!important;margin:0!important;padding:10px 0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#b9d2e5!important;font-size:12px!important;font-weight:600;line-height:1.5;text-decoration:none;white-space:nowrap}
 html.uhz-unified-account .uhz-unified-header .uhz-sidebar-link.active,html.uhz-unified-account .uhz-unified-header .uhz-sidebar-link:hover,html.uhz-unified-account .uhz-unified-header .uhz-page-home:hover{color:#fff!important}
 html.uhz-unified-account .uhz-unified-header .uhz-sidebar-link.active{text-decoration:underline;text-decoration-color:#66bceb;text-underline-offset:9px;text-decoration-thickness:2px}
 html.uhz-unified-account .uhz-unified-header .uhz-nav-symbol{display:none}
 html.uhz-unified-account .uhz-unified-header [data-account-panel="coins"],html.uhz-unified-account .uhz-unified-header [data-account-panel="notifications"],html.uhz-unified-account .uhz-unified-header [data-account-panel="profile"],html.uhz-unified-account .uhz-unified-header [data-account-panel="users"],html.uhz-unified-account .uhz-unified-header .uhz-side-more,html.uhz-unified-account .uhz-unified-header .uhz-side-exit,html.uhz-unified-account .uhz-unified-header a[href="/creadores"]{display:none!important}
 html.uhz-account-app.uhz-signed-in.uhz-unified-account .uhz-member-top{display:none!important}
 html.uhz-unified-account .uhz-top-balances{grid-column:3;grid-row:1;display:flex;align-items:center;gap:8px;margin:0;color:#d5e4f0;font-size:11px;text-decoration:none}
 html.uhz-unified-account .uhz-top-balances>span{display:flex;align-items:center;gap:6px;min-height:40px;padding:7px 11px;border:1px solid #2a4258;border-radius:10px;white-space:nowrap}
 html.uhz-unified-account .uhz-top-balances strong{font-size:16px;color:#fff;margin:0}
 html.uhz-unified-account .uhz-top-balances>span:nth-child(2){color:#e9c486}
 html.uhz-unified-account .uhz-top-balances>span:nth-child(2) strong{color:#f3ce84}
 html.uhz-unified-account .uhz-top-balances:hover>span{background:#143149}
 html.uhz-account-app.uhz-unified-account .uhz-more-account{grid-column:4;grid-row:1;position:relative;display:grid;place-items:center;width:44px;height:44px;border:1px solid #375c77;border-radius:50%;padding:0;background:#102b40;color:#d4efff;letter-spacing:normal;overflow:visible}
 html.uhz-account-app.uhz-unified-account .uhz-more-account:hover{background:#173e59;border-color:#6cb3da}
 html.uhz-account-app.uhz-unified-account .uhz-header-avatar{width:38px;height:38px;margin:0;box-shadow:none;border:0;background:radial-gradient(circle at 45% 40%,#174e70,#0a2235);pointer-events:none}
 html.uhz-account-app.uhz-unified-account .uhz-header-avatar .uhz-avatar-glyph{font-size:18px;color:#bcecff}
 html.uhz-unified-account .uhz-header-photo{position:absolute;inset:3px;z-index:2;width:calc(100% - 6px);height:calc(100% - 6px);object-fit:cover;border-radius:50%}
 html.uhz-unified-account .uhz-unified-header :is(a,button):focus-visible{outline:2px solid #86c9f3;outline-offset:5px}
 html.uhz-account-app.uhz-signed-in.uhz-unified-account main.shell{max-width:1190px!important;width:100%!important;padding:0!important;margin:0 auto!important}
 html.uhz-account-app.uhz-signed-in.uhz-unified-account #privateArea{padding:35px!important;max-width:none!important}
 html.uhz-unified-account .uhz-more-dialog[open]{position:fixed;inset:104px 26px auto auto;margin:0;width:440px;max-width:calc(100vw - 52px);max-height:calc(100dvh - 128px);overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:17px;border:1px solid #d2e2ee;border-radius:15px;background:#fff;box-shadow:0 18px 50px #0d2b4933}
 html.uhz-unified-account .uhz-more-head{grid-column:1/-1;padding:0 5px 12px;margin-bottom:5px;border-bottom:1px solid #e1ebf2}
 html.uhz-unified-account .uhz-more-head h2{font-size:16px;color:#183e59}
 html.uhz-unified-account .uhz-more-link{min-height:43px;border:0;border-radius:8px;padding:10px;color:#365a74;font-size:12px;line-height:1.5;background:transparent;text-align:left;text-decoration:none}
 html.uhz-unified-account .uhz-more-link:hover{background:#eef6fc;color:#126fa8}
 html.uhz-unified-account .uhz-more-link .uhz-nav-symbol{color:#3b88b6;font-size:16px;min-width:18px}
 html.uhz-unified-account .uhz-more-dialog::backdrop{background:#081d3326}
 html.uhz-unified-account #panel-chat .panel-heading{align-items:center;gap:20px;margin:0 0 22px}
 html.uhz-unified-account #panel-chat .panel-heading h2{color:#183b54;font-size:31px;font-weight:750;line-height:1.2;letter-spacing:-.6px;margin:0 0 9px}
 html.uhz-unified-account #panel-chat .panel-heading p{color:#526c82;font-size:14px;line-height:1.6;margin:0}
 html.uhz-unified-account #panel-chat>.card{display:grid;grid-template-rows:minmax(130px,1fr) auto;height:clamp(360px,calc(100dvh - 265px),620px);padding:0;margin:0;border:1px solid #d9e5ef;border-radius:16px;background:#fff;box-shadow:0 8px 28px #10364e06;overflow:hidden}
 html.uhz-unified-account #chatFeed{min-height:0;max-height:none;padding:22px 24px;gap:14px;background:#f8fbfd;scrollbar-width:thin;scrollbar-color:#b8ccdd transparent}
 html.uhz-unified-account #chatFeed>p.muted:only-child{display:flex;align-items:center;justify-content:center;min-height:100%;margin:0;text-align:center;color:#627b90;font-size:14px;line-height:1.7}
 html.uhz-unified-account #chatFeed .chatbubble{max-width:78%;border:1px solid #d4e3ed;border-radius:13px;background:#fff;color:#24465e;box-shadow:0 2px 8px #12385405}
 html.uhz-unified-account #chatFeed .chatbubble.own{background:#e6f3fc;border-color:#c3deef}
 html.uhz-unified-account #chatFeed .chatbubble strong{color:#176c9d;font-size:11px;font-weight:650}
 html.uhz-unified-account #chatFeed .chatbody{color:#24465e;font-size:14px;line-height:1.65}
 html.uhz-unified-account #chatForm{border-top:1px solid #e0eaf2;padding:18px 22px 17px;background:#fff;display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:16px;align-items:end}
 html.uhz-unified-account #chatForm .field{grid-column:1/-1;margin:0 0 12px;gap:8px}
 html.uhz-unified-account #chatForm label{color:#294e68;font-size:12px;font-weight:650}
 html.uhz-unified-account #chatForm textarea{height:76px;min-height:76px;max-height:150px;border:1px solid #d2e1ec;border-radius:10px;padding:12px 14px;background:#fbfdff;color:#24465e;font-size:14px;line-height:1.6}
 html.uhz-unified-account #chatForm textarea::placeholder{color:#738ba0}
 html.uhz-unified-account #chatForm>.button{grid-column:2;grid-row:2;min-height:42px;background:#147abe;border:1px solid #1371b3;border-radius:10px;color:#fff;font-size:12px;font-weight:650;padding:11px 18px}
 html.uhz-unified-account #chatForm>.small{grid-column:1;grid-row:2;margin:0;max-width:570px;color:#627b90;font-size:11px;line-height:1.6;align-self:center}
 html.uhz-unified-account #chatRefresh{min-height:40px;border:1px solid #d2e2ed;border-radius:10px;background:#fff;color:#176da4;font-size:12px;font-weight:650;padding:10px 16px}
}
@media(min-width:1024px) and (max-width:1399px){
 html.uhz-account-app.uhz-signed-in.uhz-unified-account .uhz-page-header.uhz-unified-header{column-gap:16px;padding:0 24px}
 html.uhz-unified-account .uhz-page-brand strong{font-size:17px}
 html.uhz-unified-account .uhz-page-brand img{width:37px;height:37px}
 html.uhz-unified-account .uhz-page-brand small{font-size:8px}
 html.uhz-account-app.uhz-signed-in.uhz-unified-account .uhz-account-sidebar{gap:12px!important}
 html.uhz-account-app.uhz-unified-account .uhz-unified-header .uhz-sidebar-link,html.uhz-account-app.uhz-unified-account .uhz-unified-header .uhz-page-home{font-size:11px!important}
 html.uhz-unified-account .uhz-top-balances>span{padding:7px 8px;font-size:10px;min-height:38px}
 html.uhz-unified-account .uhz-top-balances strong{font-size:14px}
}
@media(prefers-reduced-motion:reduce){html.uhz-unified-account .uhz-header-avatar *{animation:none!important}}

/* Social interactions stay inside the existing verified member chat. */
.uhz-chat-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.uhz-social-chat [hidden],.uhz-chat-picker[hidden]{display:none!important}
html.uhz-account-app .uhz-social-chat .uhz-messenger{position:relative;display:grid!important;grid-template-rows:auto minmax(140px,1fr) auto!important;gap:0;height:clamp(360px,calc(100dvh - 255px),680px)!important;min-height:360px;padding:0!important;margin:0!important;background:#fff!important;border:1px solid #d7e4ee!important;border-radius:19px!important;overflow:hidden;box-shadow:0 8px 28px #10364e06!important}
.uhz-social-chat svg,.uhz-chat-picker svg{width:20px;height:20px;flex:none;vertical-align:middle}
html.uhz-account-app .uhz-social-chat #chatRefresh{display:inline-flex;align-items:center;gap:8px;font-size:12px}
html.uhz-account-app .uhz-social-chat #chatRefresh svg{width:17px;height:17px}
html.uhz-account-app .uhz-social-chat #chatFeed{grid-row:2;min-height:0!important;max-height:none!important;overflow-y:auto;overflow-x:hidden;padding:22px 24px!important;display:flex;flex-direction:column;gap:15px!important;background:#fafcfe!important;scrollbar-width:thin;scrollbar-color:#bdcede transparent;overscroll-behavior:contain}
.uhz-chat-context{grid-row:1;display:flex;align-items:center;gap:10px;padding:11px 20px;border-bottom:1px solid #e4edf4;background:#fff;min-height:58px}
.uhz-chat-context>div{display:grid;gap:3px}.uhz-chat-context strong{color:#214961;font-size:13px}.uhz-chat-context small{color:#6b8295;font-size:11px}.uhz-chat-context button{border:0;border-radius:50%;background:#f0f6fb;color:#1d76ae;width:34px;height:34px;padding:7px}
.uhz-chat-feedback{font-size:12px;line-height:1.6;color:#315d7b;background:#edf6fd;border:1px solid #d1e4f2;border-radius:10px;padding:10px 14px;margin:0 0 15px}.uhz-chat-feedback.error{background:#fff4f2;border-color:#ecd1ca;color:#92483d}
.uhz-chat-empty{margin:auto;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;max-width:390px;padding:20px;color:#385d78}.uhz-chat-empty>svg{width:44px;height:44px;color:#4e90bf;stroke-width:1.2;background:#edf5fb;border:1px solid #dfebf4;box-sizing:content-box;padding:17px;border-radius:25px}.uhz-chat-empty strong{font-size:16px;font-weight:650;margin-top:4px}.uhz-chat-empty p{font-size:12px!important;color:#688296!important;margin:0;line-height:1.7!important}.uhz-chat-empty-replies{color:#718798!important;text-align:center;font-size:12px!important;margin:auto!important;padding:25px}
.uhz-chat-day{align-self:center;font-size:10px;color:#8395a4;margin:3px 0 0;padding:3px 9px;letter-spacing:.15px}
.uhz-message{display:flex;align-items:flex-end;gap:9px;position:relative;max-width:88%;align-self:flex-start;min-width:0}
.uhz-chat-avatar{flex:none;display:grid;place-items:center;width:30px;height:30px;border:1px solid #d9e7f2;border-radius:50%;color:#347ca9;background:linear-gradient(140deg,#e5f1fb,#f2f7fc);font-size:10px;font-weight:700;margin-bottom:4px}
.uhz-message-column{display:flex;flex-direction:column;min-width:0;gap:5px}.uhz-message-meta{display:flex;align-items:center;gap:10px;font-size:10px;color:#899ba9;padding:0 5px}.uhz-message-meta strong{font-size:10px;font-weight:650;color:#527389}.uhz-message-meta time{font-size:9px;white-space:nowrap}
.uhz-message-bubble{border-radius:17px 17px 17px 5px;padding:11px 15px;border:1px solid #e2eaf2;background:#fff;color:#294a60;min-width:42px;box-shadow:0 2px 6px #16365003}
.uhz-message-body{font-size:14px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal}
.uhz-message.own{align-self:flex-end;flex-direction:row-reverse}.uhz-message.own .uhz-message-meta{justify-content:flex-end}.uhz-message.own .uhz-chat-avatar{display:none}.uhz-message.own .uhz-message-bubble{border:0;background:linear-gradient(115deg,#167dc4,#596dd6);color:#fff;border-radius:17px 17px 5px 17px}.uhz-message.own .uhz-message-column{align-items:flex-end}
.uhz-message-actions{display:flex;gap:1px;align-self:center;opacity:0;transition:opacity .15s;flex:none}.uhz-message:hover .uhz-message-actions,.uhz-message:focus-within .uhz-message-actions{opacity:1}.uhz-message-actions>button{width:29px;height:32px;display:grid;place-items:center;padding:5px;border:0;background:transparent;border-radius:50%;color:#7392a8}.uhz-message-actions>button:hover{background:#e8f2fa;color:#236f9e}.uhz-message-actions svg{width:16px;height:16px}.uhz-message[aria-busy=true]{opacity:.7}.uhz-message button:disabled{cursor:wait}
.uhz-message-reactions{display:flex;flex-wrap:wrap;gap:4px;min-width:0;padding:0 3px}.uhz-message-reaction{display:flex;align-items:center;gap:5px;padding:3px 8px;min-height:26px;border:1px solid #dce7f0;border-radius:16px;color:#668198;background:#fff;font-size:13px;line-height:1.4;box-shadow:0 1px 2px #16365004}.uhz-message-reaction small{font-size:10px;color:inherit}.uhz-message-reaction.selected{border-color:#91c0e2;background:#e5f2fc;color:#226c9d}.uhz-message-thread-link{border:0;background:transparent;padding:2px 5px;font:inherit;font-size:11px;font-weight:600;color:#2d7aad;align-self:flex-start}.uhz-message.own .uhz-message-thread-link{align-self:flex-end}
.uhz-message-quote{display:grid;grid-template-columns:16px minmax(0,1fr);gap:2px 6px;text-align:left;width:100%;padding:7px 9px;margin:0 0 7px;border:0;border-left:2px solid #69a4cc;border-radius:4px 8px 8px 4px;background:#edf5fb;color:#397491;max-width:390px;cursor:pointer}.uhz-message-quote svg{grid-row:1/3;width:14px;height:14px;margin-top:2px}.uhz-message-quote strong{font-size:10px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.uhz-message-quote span{font-size:11px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}.uhz-message-quote:disabled{opacity:.75;cursor:default}.uhz-message.own .uhz-message-quote{color:#edf6ff;background:#ffffff1c;border-left-color:#b5e0ff}
.uhz-message.thread-root{max-width:100%;padding-bottom:16px;border-bottom:1px solid #e1ebf3;align-self:stretch;margin-bottom:2px}.uhz-message.thread-root .uhz-message-column{max-width:85%}.uhz-chat-older{border:1px solid #d5e4ef;background:white;color:#4b7c9d;align-self:center;border-radius:18px;font-size:11px;padding:7px 13px;margin-bottom:2px}
html.uhz-account-app .uhz-social-chat #chatForm{grid-row:3;display:block!important;position:relative;border-top:1px solid #e0e9f1;padding:13px 17px 10px!important;background:#fff;margin:0!important}
.uhz-chat-input-row{display:flex;align-items:flex-end;gap:7px;border:1px solid #d6e4ef;background:#fbfdff;border-radius:24px;padding:4px 5px 4px 6px;min-height:52px;min-width:0}
html.uhz-account-app .uhz-social-chat #chatText{flex:1;min-width:0;width:auto;max-width:none;padding:11px 4px!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;color:#25465e;font-size:14px!important;line-height:1.5;min-height:42px!important;max-height:116px!important;height:42px;resize:none;overflow-y:auto}
html.uhz-account-app .uhz-social-chat #chatText:focus-visible{outline:none}.uhz-chat-input-row:focus-within{border-color:#87b9dc;box-shadow:0 0 0 3px #1d83c112}
html.uhz-account-app .uhz-social-chat .uhz-chat-emoji-toggle{flex:none;width:38px;height:42px;min-height:0;padding:8px!important;background:transparent!important;border:0!important;border-radius:50%;color:#5e83a0;display:grid;place-items:center}
html.uhz-account-app .uhz-social-chat #chatForm .uhz-chat-send{flex:none;display:grid;place-items:center;width:42px;height:42px;min-height:0!important;padding:10px!important;border-radius:50%!important;border:0!important;background:linear-gradient(130deg,#1588cc,#4b71d4)!important;color:#fff!important;box-shadow:0 2px 7px #236cba18}.uhz-chat-send svg{width:20px;height:20px;margin-left:-1px}.uhz-chat-send:disabled{opacity:.4;cursor:default}
.uhz-chat-compose-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:7px 7px 0}.uhz-chat-compose-foot small{color:#7c91a2;font-size:10px;line-height:1.5}.uhz-chat-compose-foot .over{color:#b84940}
.uhz-chat-replying{display:flex;align-items:center;gap:10px;padding:0 7px 10px;color:#3378a6}.uhz-chat-replying>svg{width:17px;height:17px;flex:none}.uhz-chat-replying>div{display:grid;gap:3px;min-width:0;flex:1;border-left:2px solid #6dadda;padding-left:10px}.uhz-chat-replying strong{font-size:11px;font-weight:650}.uhz-chat-replying span{display:block;font-size:11px;color:#7790a3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.5}.uhz-chat-replying>button{display:grid;place-items:center;flex:none;width:29px;height:29px;background:#f3f7fb;color:#69859a;border:0;border-radius:50%;padding:6px}.uhz-chat-replying>button svg{width:15px;height:15px}
.uhz-chat-latest{position:absolute;z-index:3;right:24px;bottom:112px;display:flex;align-items:center;gap:6px;border:1px solid #cbdfea;border-radius:20px;background:#fff;color:#2674a4;box-shadow:0 5px 18px #16365015;font-size:11px;padding:8px 12px}.uhz-chat-latest svg{width:15px;height:15px}
.uhz-chat-picker{position:fixed;z-index:100;max-width:calc(100vw - 24px);max-height:min(405px,calc(100dvh - 24px));overflow:auto;box-sizing:border-box;padding:12px;background:#fff;color:#264b64;border:1px solid #d7e5f0;border-radius:17px;box-shadow:0 14px 45px #0d304827;font-family:Inter,ui-sans-serif,system-ui,sans-serif;scrollbar-width:thin;scrollbar-color:#bdd0df transparent}
.uhz-picker-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px;padding-left:3px}.uhz-picker-head strong{font-size:12px;font-weight:650}.uhz-picker-head>button{display:grid;place-items:center;width:27px;height:27px;padding:5px;border:0;background:#f3f7fb;border-radius:50%;color:#7290a5}.uhz-picker-head svg{width:15px;height:15px}
.uhz-chat-picker>input{width:100%;box-sizing:border-box;min-height:38px;border:1px solid #d8e5ee!important;border-radius:10px!important;background:#f7fafe!important;color:#294d67!important;padding:8px 11px!important;font-size:12px!important;margin-bottom:9px;font-family:inherit}.uhz-chat-picker>input::placeholder{color:#8195a4}
.uhz-emoji-categories{display:flex;gap:5px;border-bottom:1px solid #e3edf4;margin-bottom:8px;padding-bottom:7px}.uhz-emoji-categories button{display:grid;place-items:center;width:39px;height:34px;border:0;border-radius:9px;background:transparent;font-size:20px}.uhz-emoji-categories button[aria-pressed=true]{background:#eaf4fc}
.uhz-emoji-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:2px}.uhz-emoji-grid button{font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;display:grid;place-items:center;border:0;background:transparent;border-radius:10px;font-size:23px;padding:4px 0;min-height:36px;cursor:pointer}.uhz-emoji-grid button:hover{background:#eaf4fc}.uhz-emoji-grid .uhz-picker-note{grid-column:1/-1}
.uhz-reaction-choices{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.uhz-reaction-choices button{font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;font-size:26px;line-height:1;display:grid;place-items:center;min-height:47px;background:#f6fafe;border:1px solid transparent;border-radius:13px;cursor:pointer}.uhz-reaction-choices button:hover,.uhz-reaction-choices button[aria-pressed=true]{background:#e6f3fc;border-color:#a9cfe9}.uhz-picker-note{color:#7b91a2;font-size:10px;line-height:1.6;margin:9px 3px 0}
.uhz-message-menu-option{display:flex;align-items:center;gap:12px;width:100%;padding:11px 9px;font-size:12px;background:#fff;border:0;border-radius:9px;color:#315d78;text-align:left}.uhz-message-menu-option:hover{background:#edf6fd}.uhz-message-menu-option svg{width:18px;height:18px;color:#4c88b0}
.uhz-social-chat button:focus-visible,.uhz-chat-picker button:focus-visible{outline:2px solid #79b9e2;outline-offset:3px}
@media(hover:none),(pointer:coarse){.uhz-message-actions{opacity:1;gap:0}.uhz-message-actions>button{width:32px;height:40px}.uhz-emoji-grid button{min-height:40px}.uhz-message-reaction{min-height:30px;padding:4px 9px}.uhz-chat-context button{min-height:40px;min-width:40px}}
@media(max-width:760px){html.uhz-account-app .uhz-social-chat .uhz-messenger{height:clamp(380px,calc(100dvh - 300px),600px)!important;border-radius:15px!important}html.uhz-account-app .uhz-social-chat #chatFeed{padding:17px 12px!important;gap:13px!important}.uhz-message{max-width:100%;gap:6px}.uhz-chat-avatar{width:26px;height:26px;font-size:9px}.uhz-message-column{max-width:calc(100vw - 151px)}.uhz-message.own .uhz-message-column{max-width:calc(100vw - 120px)}.uhz-message-actions{flex-direction:column;opacity:1;align-self:flex-end;gap:0}.uhz-message-actions>button{width:28px;height:28px;padding:6px}.uhz-message-actions svg{width:15px;height:15px}.uhz-message-bubble{padding:10px 12px;border-radius:15px 15px 15px 4px}.uhz-message-body{font-size:13px}.uhz-message.own .uhz-message-bubble{border-radius:15px 15px 4px 15px}.uhz-message-meta{gap:6px;flex-wrap:wrap}.uhz-message-meta strong{font-size:9px}.uhz-message-meta time{font-size:8px}.uhz-chat-empty{padding:15px 8px;gap:10px}.uhz-chat-empty strong{font-size:14px}.uhz-chat-empty p{font-size:11px!important}.uhz-chat-context{padding:9px 12px}.uhz-message.thread-root .uhz-message-column{max-width:calc(100vw - 145px)}html.uhz-account-app .uhz-social-chat #chatForm{padding:10px 10px 8px!important}html.uhz-account-app .uhz-social-chat #chatText{font-size:16px!important;padding:9px 3px!important;min-height:42px!important}.uhz-chat-input-row{gap:3px;padding-left:3px}html.uhz-account-app .uhz-social-chat .uhz-chat-emoji-toggle{width:32px;padding:6px!important}html.uhz-account-app .uhz-social-chat #chatForm .uhz-chat-send{width:39px;height:39px}.uhz-chat-compose-foot{margin:6px 5px 0;gap:5px}.uhz-chat-compose-foot small{font-size:8px}.uhz-chat-latest{right:14px;bottom:105px}.uhz-chat-picker{border-radius:15px}.uhz-emoji-grid{gap:1px}.uhz-emoji-grid button{font-size:23px}.uhz-social-chat .panel-heading h2{font-size:25px!important}.uhz-social-chat .panel-heading p{font-size:12px!important}.uhz-social-chat #chatRefresh{min-height:38px!important;padding:9px!important}.uhz-social-chat #chatRefresh span{display:none}.uhz-message-quote{max-width:100%;padding:6px 7px}}
@media(prefers-reduced-motion:reduce){.uhz-message-actions{transition:none}.uhz-social-chat *{scroll-behavior:auto!important}}

@media(max-width:760px){.uhz-message-actions>button:not(:last-child){display:none}.uhz-message-actions>button:last-child{width:44px;min-width:44px;height:44px}.uhz-emoji-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.uhz-emoji-grid button{min-height:44px}.uhz-chat-picker{max-height:min(405px,calc(100dvh - 24px))}}

@media(max-width:760px){.uhz-chat-picker>input{font-size:16px!important;min-height:42px}}
@media(max-width:760px),(hover:none),(pointer:coarse){html.uhz-account-app .uhz-social-chat .uhz-chat-emoji-toggle,html.uhz-account-app .uhz-social-chat #chatForm .uhz-chat-send{width:44px;height:44px;min-width:44px}.uhz-chat-context button,.uhz-chat-replying>button,.uhz-picker-head>button,.uhz-emoji-categories button{width:44px;height:44px;min-width:44px}.uhz-message-menu-option{min-height:44px}}

/* The public sitewide header takes full ownership when loaded. */
html.uhzg-active body > header.uhz-page-header,html.uhzg-active.uhz-account-app.uhz-standalone-account.uhz-signed-in.uhz-unified-account body > header.uhz-page-header.uhz-unified-header{display:none!important;height:0!important;min-height:0!important;max-height:0!important;visibility:hidden!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}

/* Comunichat: una sola vista con publicaciones y chat real. */
#panel-community .uhz-cc-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap;margin:0 0 20px;padding:20px 22px;background:var(--panel,#fff);border:1px solid var(--line,#d8e4eb);border-radius:16px}#panel-community .uhz-cc-eyebrow{font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--accent,#287d9e)}#panel-community .uhz-cc-head h1{margin:6px 0;font-size:clamp(24px,2.4vw,32px)}#panel-community .uhz-cc-head p{max-width:480px;margin:0;font-size:13px;line-height:1.6}#panel-community .uhz-cc-shortcuts{display:flex;gap:8px;flex-wrap:wrap}#panel-community .uhz-cc-shortcuts a{padding:8px 12px;border-radius:9px;border:1px solid var(--line,#d8e4eb);text-decoration:none;font-size:12px;font-weight:700}#panel-community .uhz-cc-layout{display:grid;grid-template-columns:minmax(0,1.13fr) minmax(290px,.87fr);gap:17px;align-items:start}#panel-community .uhz-cc-forum,#panel-community .uhz-cc-chat{min-width:0;border:1px solid var(--line,#d8e4eb);border-radius:16px;padding:17px;background:var(--panel,#fff)}#panel-community .uhz-cc-forum .layout2{display:block}#panel-community .uhz-cc-forum .layout2>div{min-width:0}#panel-community #panel-chat{display:block!important;position:static!important;transform:none!important;width:auto!important;max-width:100%;margin:0!important}#panel-community #panel-chat .card{margin:10px 0 0}#panel-community #chatFeed{min-height:260px;max-height:560px;overflow-y:auto}#panel-community .panel-heading{gap:12px}#panel-community .panel-heading h2{font-size:18px}@media(max-width:1020px){#panel-community .uhz-cc-layout{grid-template-columns:minmax(0,1fr)}#panel-community .uhz-cc-chat{scroll-margin-top:90px}}@media(max-width:640px){#panel-community .uhz-cc-head{padding:15px}#panel-community .uhz-cc-forum,#panel-community .uhz-cc-chat{padding:13px}#panel-community .uhz-cc-shortcuts a{font-size:11px;padding:7px 9px}}
`;
var COOKIE_ACCESS = "__Host-uhz-access";
var COOKIE_REFRESH = "__Host-uhz-refresh";
var OFFICIAL_ORIGIN = "https://univershzrw.com";
var ADMIN_ORIGIN = "https://admin.univershzrw.com";
function isAdminHost(req) {
  return new URL(req.url).origin === ADMIN_ORIGIN;
}
function trustedWrite(req) {
  return [OFFICIAL_ORIGIN, ADMIN_ORIGIN].includes(new URL(req.url).origin) && req.headers.get("origin") === new URL(req.url).origin;
}
var ADMIN_ONLY_RPC = /* @__PURE__ */ new Set(["community_creator_review", "community_creator_campaign_save", "community_creator_quote", "community_campaign_save", "community_campaign_state", "community_campaign_review", "community_campaign_admin", "community_license_review", "uhz_admin_members", "uhz_admin_member_action", "uhz_admin_events", "community_admin_handle_item", "community_admin_inbox", "community_hide_chat_admin", "uhz_community_admin_reports", "uhz_community_review_report", "uhz_eco_admin_save_content", "uhz_admin_publisher_save", "uhz_admin_publisher_list", "uhz_admin_catalog_overview"]);
var AUTH_RETURN = OFFICIAL_ORIGIN + "/_uhz/portal/?embed=1";
var RPC_NAMES = /* @__PURE__ */ new Set(["uhz_resource_collaboration", "uhz_catalog_api", "community_creator_submit", "community_creator_get", "community_creator_dashboard", "community_creator_review", "community_creator_withdraw", "community_creator_correct", "community_creator_campaign_save", "community_creator_quote", "community_creator_quote_response", "community_public_ask", "community_public_reply", "community_creator_convert", "community_campaign_mine", "community_campaign_get", "community_campaign_join", "community_campaign_submit", "community_campaign_withdraw", "community_campaign_save", "community_campaign_state", "community_campaign_review", "community_campaign_admin", "community_chat_feed", "community_chat_send", "community_chat_react", "community_license_submit", "community_license_list", "community_license_get", "community_license_review", "community_license_withdraw", "community_license_resubmit", "community_coin_progress", "community_coin_history", "uhz_account_status", "uhz_admin_members", "uhz_admin_member_action", "uhz_admin_events", "uhz_notifications", "uhz_notifications_read", "community_accept_reply", "community_admin_handle_item", "community_admin_inbox", "community_contribution_feed", "community_create_reply", "community_create_thread", "community_exclusives_catalog", "community_get_thread", "community_hide_chat_admin", "community_list_replies", "community_list_resources", "community_list_threads", "community_my_coins", "community_my_contributions", "community_my_exclusives", "community_my_favorites", "community_recent_chat", "community_record_link_intent", "community_report", "community_report_contribution", "community_report_resource", "community_request_shipping_quote", "community_send_chat", "community_send_feedback", "community_set_email_preferences", "community_submit_exclusive", "community_vote_contribution", "community_vote_resource", "uhz_community_admin_reports", "uhz_community_is_admin", "uhz_community_review_report", "uhz_eco_admin_save_content", "uhz_eco_catalog", "uhz_eco_claim", "uhz_eco_coin_pack_request", "uhz_eco_custom_pack_request", "uhz_eco_gold_exchange_request", "uhz_eco_me", "uhz_eco_missions", "uhz_eco_public_free", "uhz_eco_unlock", "uhz_admin_publisher_save", "uhz_admin_publisher_list", "uhz_admin_catalog_overview"]);
var TABLE_METHODS = {
  community_profiles: ["GET", "POST", "PATCH"],
  community_favorites: ["GET", "POST", "DELETE"],
  community_notifications: ["GET"],
  community_plus_interest: ["GET", "POST"],
  community_email_preferences: ["GET"],
  community_rewards: ["GET"],
  community_coin_ledger: ["GET"],
  products: ["GET"]
};
function cookieValues(req) {
  const values = {};
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const name = part.slice(0, i).trim();
    if (name !== COOKIE_ACCESS && name !== COOKIE_REFRESH) continue;
    try {
      values[name] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
    }
  }
  return values;
}
function sessionCookies(session) {
  const maxAge = Math.min(3600, Number(session?.expires_in) || 3600);
  return [
    `${COOKIE_ACCESS}=${encodeURIComponent(session?.access_token || "")}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${session ? maxAge : 0}`,
    `${COOKIE_REFRESH}=${encodeURIComponent(session?.refresh_token || "")}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${session ? 604800 : 0}`
  ];
}
function apiResponse(data, status = 200, cookies = []) {
  const h = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Cross-Origin-Resource-Policy": "same-origin" });
  for (const cookie of cookies) h.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers: h });
}
async function boundedBody(req, maxBytes = 65536) {
  if (Number(req.headers.get("content-length") || 0) > maxBytes) throw Object.assign(Error("El archivo o formulario supera el tama\xF1o permitido."), { status: 413 });
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw Object.assign(Error("El archivo o formulario supera el tama\xF1o permitido."), { status: 413 });
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const part of parts) {
    body.set(part, offset);
    offset += part.byteLength;
  }
  return body;
}
async function jsonBody(req, maxBytes = 65536) {
  const bytes = await boundedBody(req, maxBytes);
  if (!bytes.length) return {};
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || Array.isArray(value) || typeof value !== "object") throw Error();
    return value;
  } catch {
    throw Object.assign(Error("El formulario no tiene un formato v\xE1lido."), { status: 400 });
  }
}
async function supabaseFetch(path, options = {}) {
  return fetch(API_ORIGIN + path, { ...options, headers: { apikey: API_PUBLIC_KEY, ...options.headers }, signal: AbortSignal.timeout(["/functions/v1/uhz-inft-wallet", "/functions/v1/uhz-admin-control"].includes(path) ? 45e3 : 1e4) });
}
async function checkedUser(access) {
  if (!access) return null;
  const r = await supabaseFetch("/auth/v1/user", { headers: { Authorization: "Bearer " + access } });
  if (!r.ok) return null;
  const u = await r.json();
  if (!u?.id || !u?.email_confirmed_at || u.is_anonymous) return null;
  const checked = await supabaseFetch("/rest/v1/rpc/uhz_account_status", { method: "POST", headers: { Authorization: "Bearer " + access, "Content-Type": "application/json" }, body: "{}" });
  if (!checked.ok) return null;
  const status = await checked.json();
  if (!["member", "superadmin"].includes(status?.role) || typeof status.must_change_password !== "boolean") return null;
  u.uhz_status = status;
  return u;
}
async function sessionFor(req) {
  const c = cookieValues(req);
  let access = c[COOKIE_ACCESS];
  let u = await checkedUser(access);
  let cookies = [];
  if (!u && c[COOKIE_REFRESH]) {
    const r = await supabaseFetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: c[COOKIE_REFRESH] }) });
    if (r.ok) {
      const s = await r.json();
      access = s.access_token;
      u = await checkedUser(access);
      if (u) cookies = sessionCookies(s);
    }
  }
  return { access, u, cookies };
}
function safeUser(u) {
  return { id: u.id, email: u.email, email_confirmed_at: u.email_confirmed_at, role: u.uhz_status?.role || "member", must_change_password: !!u.uhz_status?.must_change_password, user_metadata: { display_name: String(u.user_metadata?.display_name || "").slice(0, 48) } };
}
async function limited(binding, key2) {
  if (!binding) throw Object.assign(Error("El control de acceso no est\xE1 disponible temporalmente."), { status: 503 });
  const result = await binding.limit({ key: key2 });
  if (!result.success) throw Object.assign(Error("Demasiados intentos. Espera un minuto y vuelve a intentarlo."), { status: 429 });
}
async function backend(req, env) {
  if (new URL(req.url).pathname.startsWith(MEDIA_PATH)) return mediaHandler(req, env, { sessionFor, ownerUser, trustedWrite, limited, jsonBody });
  try {
    const url = new URL(req.url), path = url.pathname.slice("/backend".length), method = req.method;
    if (/^\/rest\/v1\/rpc\/community_chat_(feed|send|react)$/.test(path) && method !== "POST") return apiResponse({ message: "Usa el env\xEDo protegido del chat." }, 405);
    if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(method)) return apiResponse({ message: "M\xE9todo no permitido." }, 405);
    if (method !== "GET" && !trustedWrite(req)) return apiResponse({ message: "Origen no permitido." }, 403);
    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    await limited(env.API_LIMIT, "ip:" + ip);
    if (path.startsWith("/auth/v1/")) {
      const action = path.slice("/auth/v1/".length);
      if (isAdminHost(req) && action === "signup") return apiResponse({ message: "El registro de usuarios se realiza en univershzrw.com." }, 403);
      if (!["user", "signup", "recover", "token", "logout", "session", "verify"].includes(action)) return apiResponse({ message: "Ruta no permitida." }, 404);
      if (action === "user" && method === "GET") {
        const s2 = await sessionFor(req);
        if (isAdminHost(req) && s2.u && !ownerIdentityUser(s2.u)) return apiResponse({ message: "Acceso exclusivo de superadministradores." }, 403);
        return s2.u ? apiResponse(safeUser(s2.u), 200, s2.cookies) : apiResponse({ message: "Inicia sesi\xF3n con una cuenta verificada." }, 401);
      }
      if (action === "logout" && method === "POST") {
        const c = cookieValues(req);
        let revoked = true, access = c[COOKIE_ACCESS];
        if (c[COOKIE_REFRESH]) {
          const s2 = await sessionFor(req);
          access = s2.u ? s2.access : void 0;
        }
        if (access) {
          const r2 = await supabaseFetch("/auth/v1/logout?scope=local", { method: "POST", headers: { Authorization: "Bearer " + access } });
          revoked = r2.ok || r2.status === 401;
        }
        return apiResponse({ ok: revoked }, revoked ? 200 : 503, sessionCookies(null));
      }
      await limited(env.AUTH_LIMIT, "auth:" + ip);
      const body2 = await jsonBody(req);
      if (isAdminHost(req) && ["token", "recover"].includes(action) && body2.email && String(body2.email).trim().toLowerCase() !== "univershzrw@gmail.com") return apiResponse({ message: "Usa la cuenta propietaria de UNIVERSHZRW." }, 403);
      if (["signup", "recover"].includes(action) && method === "POST") {
        const email = String(body2.email || "").trim();
        if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return apiResponse({ message: "Escribe un correo electr\xF3nico v\xE1lido." }, 400);
        let data = { email };
        if (action === "signup") {
          await limited(env.REGISTER_LIMIT, "signup:" + ip);
          if (String(body2.website || "").trim()) return apiResponse({ message: "No se pudo verificar la solicitud." }, 400);
          const token = String(body2.turnstileToken || "");
          if (token.length < 20 || token.length > 2048) return apiResponse({ message: "Completa la verificaci\xF3n antibots antes de registrarte." }, 400);
          if (!env.TURNSTILE_SECRET) return apiResponse({ message: "La verificaci\xF3n de seguridad no est\xE1 configurada." }, 503);
          let verification;
          try {
            const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }), signal: AbortSignal.timeout(8e3) });
            verification = result.ok ? await result.json() : null;
          } catch {
            return apiResponse({ message: "No pudimos confirmar la verificaci\xF3n. Int\xE9ntalo de nuevo." }, 503);
          }
          if (!verification?.success || verification.hostname !== "univershzrw.com" || verification.action !== "signup") return apiResponse({ message: "Verificaci\xF3n no aprobada. Actualiza el desaf\xEDo y vuelve a intentar." }, 403);
          const password = String(body2.password || ""), display = String(body2.data?.display_name || "").trim();
          if (password.length < 12 || password.length > 128 || display.length < 2 || display.length > 48) return apiResponse({ message: "Revisa el nombre y usa una contrase\xF1a de 12 a 128 caracteres." }, 400);
          if ((/* @__PURE__ */ new Set(["123456789012", "password1234", "qwerty123456", "contrase\xF1a123", "univershzrw123"])).has(password.toLowerCase()) || /^(.)\1{11,}$/.test(password) || password.toLowerCase().includes(email.split("@")[0].toLowerCase()) && email.split("@")[0].length >= 5) return apiResponse({ message: "Elige una contrase\xF1a menos predecible y diferente a tus datos personales." }, 400);
          data = { email, password, data: { display_name: display } };
        }
        const r2 = await supabaseFetch("/auth/v1/" + action + "?redirect_to=" + encodeURIComponent(AUTH_RETURN), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!r2.ok) {
          const error = await r2.json().catch(() => ({}));
          return apiResponse({ message: r2.status === 429 ? "Espera unos minutos antes de solicitar otro correo." : error.code === "email_address_invalid" ? "El correo no es v\xE1lido." : "El servicio de correo no pudo completar la solicitud. Int\xE9ntalo m\xE1s tarde." }, r2.status === 429 ? 429 : 503);
        }
        return apiResponse({ ok: true, message: action === "recover" ? "Si existe la cuenta, recibir\xE1s instrucciones." : "Revisa tu correo para confirmar la cuenta." });
      }
      if (method === "POST" && (action === "token" && url.searchParams.get("grant_type") === "password" || action === "session" || action === "verify")) {
        let upstream, payload;
        if (action === "token") {
          upstream = "/auth/v1/token?grant_type=password";
          payload = { email: String(body2.email || "").trim(), password: String(body2.password || "") };
          if (payload.email.length > 254 || payload.password.length > 128) return apiResponse({ message: "Datos no v\xE1lidos." }, 400);
        } else if (action === "session") {
          upstream = "/auth/v1/token?grant_type=refresh_token";
          payload = { refresh_token: String(body2.refresh_token || "") };
          if (!/^[A-Za-z0-9_-]{8,256}$/.test(payload.refresh_token)) return apiResponse({ message: "Enlace no v\xE1lido." }, 400);
        } else {
          upstream = "/auth/v1/verify";
          if (!["signup", "email", "recovery"].includes(body2.type)) return apiResponse({ message: "Verificaci\xF3n no v\xE1lida." }, 400);
          payload = { type: body2.type, ...body2.token_hash ? { token_hash: String(body2.token_hash).slice(0, 256) } : { email: String(body2.email || "").slice(0, 254), token: String(body2.token || "").slice(0, 12) } };
        }
        const r2 = await supabaseFetch(upstream, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!r2.ok) {
          const error = await r2.json().catch(() => ({}));
          if (r2.status === 429) return apiResponse({ message: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo." }, 429);
          if (r2.status >= 500) return apiResponse({ message: "El servicio de acceso no est\xE1 disponible temporalmente. Vuelve a intentarlo." }, 503);
          return apiResponse({ message: action === "token" ? error.code === "email_not_confirmed" ? "Verifica tu correo antes de iniciar sesi\xF3n." : "Revisa tu correo y contrase\xF1a. Si no la recuerdas, recupera tu cuenta." : "El enlace ya caduc\xF3 o fue utilizado. Solicita uno nuevo." }, 401);
        }
        const session = await r2.json();
        const u = await checkedUser(session.access_token);
        if (!u) return apiResponse({ message: "Verifica tu correo antes de participar." }, 403);
        if (isAdminHost(req) && !ownerIdentityUser(u)) {
          await supabaseFetch("/auth/v1/logout?scope=local", { method: "POST", headers: { Authorization: "Bearer " + session.access_token } }).catch(() => null);
          return apiResponse({ message: "Esta cuenta no tiene permisos de superadministrador." }, 403);
        }
        return apiResponse({ access_token: "cookie", refresh_token: "cookie", expires_in: session.expires_in || 3600, user: safeUser(u) }, 200, sessionCookies(session));
      }
      if (action === "user" && method === "PUT") {
        const s2 = await sessionFor(req);
        if (!s2.u) return apiResponse({ message: "Vuelve a iniciar sesi\xF3n." }, 401);
        const password = String(body2.password || "");
        if (password.length < 10 || password.length > 128) return apiResponse({ message: "La contrase\xF1a debe tener entre 10 y 128 caracteres." }, 400);
        const r2 = await supabaseFetch("/functions/v1/uhz-member-admin", { method: "POST", headers: { Authorization: "Bearer " + s2.access, "Content-Type": "application/json" }, body: JSON.stringify({ action: "change_password", password }) });
        if (!r2.ok) return apiResponse({ message: "No se pudo actualizar la contrase\xF1a. Revisa los requisitos o solicita un enlace nuevo." }, 400, s2.cookies);
        await supabaseFetch("/auth/v1/logout?scope=local", { method: "POST", headers: { Authorization: "Bearer " + s2.access } }).catch(() => null);
        return apiResponse({ ok: true }, 200, sessionCookies(null));
      }
      return apiResponse({ message: "M\xE9todo no permitido." }, 405);
    }
    const rpcName = path.startsWith("/rest/v1/rpc/") ? path.slice("/rest/v1/rpc/".length) : "";
    if (rpcName === "uhz_catalog_api" && method === "POST") {
      const b = await jsonBody(req, 24e3);
      const session = await sessionFor(req);
      if (["admin_events"].includes(b.p_action) && (!isAdminHost(req) || !ownerUser(session.u))) return apiResponse({ message: "Solo administraci\xF3n" }, 403);
      if (b.p_action !== "catalog" && b.p_action !== "detail") await limited(env.WRITE_LIMIT || env.API_LIMIT, "catalog:" + (session.u?.id || ip));
      const upstream = await supabaseFetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...session.u ? { Authorization: "Bearer " + session.access } : {} }, body: JSON.stringify(b) });
      const data = await upstream.json();
      const wrapped = upstream.ok ? await mediaLinks(data, { request: req, env, user: session.u }) : data;
      const out = new Response(JSON.stringify(wrapped), { status: upstream.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
      for (const cookie of session.cookies) out.headers.append("Set-Cookie", cookie);
      return out;
    }
    if (!isAdminHost(req) && rpcName === "uhz_community_is_admin") return apiResponse(false);
    if (!isAdminHost(req) && ADMIN_ONLY_RPC.has(rpcName)) return apiResponse({ message: "Usa admin.univershzrw.com para administrar." }, 403);
    let permitted = false;
    if (path.startsWith("/rest/v1/rpc/")) permitted = method === "POST" && RPC_NAMES.has(path.slice("/rest/v1/rpc/".length));
    else if (path.startsWith("/rest/v1/")) permitted = !!TABLE_METHODS[path.slice("/rest/v1/".length)]?.includes(method);
    else if (path === "/functions/v1/uhz-community-contribute" || path === "/functions/v1/uhz-api" || path === "/functions/v1/uhz-member-admin" || path === "/functions/v1/uhz-inft-wallet" || path === "/functions/v1/uhz-admin-control") permitted = method === "POST";
    if (path === "/functions/v1/uhz-admin-control" && !isAdminHost(req)) return apiResponse({ message: "Usa el centro de administraci\xF3n." }, 403);
    if (!permitted) return apiResponse({ message: "Ruta no permitida." }, 404);
    if (method === "POST" && ["uhz_eco_catalog", "uhz_eco_public_free"].includes(rpcName)) {
      const publicBody = await jsonBody(req, 2e3);
      if (rpcName === "uhz_eco_public_free" && !/^[0-9a-f-]{36}$/i.test(String(publicBody?.p_content_id || ""))) return apiResponse({ message: "Contenido invalido." }, 400);
      const upstream = await supabaseFetch(path + url.search, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(rpcName === "uhz_eco_catalog" ? {} : { p_content_id: String(publicBody.p_content_id) }) });
      return new Response(upstream.body, { status: upstream.status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" } });
    }
    const s = await sessionFor(req);
    if (!s.u) return apiResponse({ message: "Inicia sesi\xF3n con una cuenta verificada." }, 401);
    if (isAdminHost(req) && !ownerUser(s.u)) return apiResponse({ message: "Acceso exclusivo de superadministradores." }, 403);
    if (s.u.uhz_status?.must_change_password) return apiResponse({ message: "Cambia primero tu contrase\xF1a temporal." }, 403);
    await limited(env.API_LIMIT, "member:" + s.u.id);
    if (method !== "GET") await limited(env.WRITE_LIMIT || env.API_LIMIT, "write:" + s.u.id);
    let body = method === "GET" ? null : await jsonBody(req, path === "/functions/v1/uhz-api" ? 75e5 : 65536);
    if (!isAdminHost(req) && (body?.p_admin === true || path === "/functions/v1/uhz-inft-wallet" && String(body?.action || "").startsWith("admin_") || path === "/functions/v1/uhz-member-admin" && body?.action !== "change_password")) return apiResponse({ message: "Usa admin.univershzrw.com para administrar." }, 403);
    if (path === "/functions/v1/uhz-api" && body.action !== "rights_report") return apiResponse({ message: "Acci\xF3n no permitida." }, 403);
    if (body && "user_id" in body && body.user_id !== s.u.id && !(isAdminHost(req) && s.u.uhz_status?.role === "superadmin" && path === "/functions/v1/uhz-member-admin")) return apiResponse({ message: "No puedes modificar otra cuenta." }, 403);
    if (path === "/rest/v1/community_profiles") {
      if (method === "GET" || method === "PATCH") url.searchParams.set("user_id", "eq." + s.u.id);
      if (method === "PATCH" && Object.keys(body).some((k) => !["display_name", "about", "avatar_key", "avatar_preset"].includes(k))) return apiResponse({ message: "Campo de perfil no permitido." }, 403);
      if (body?.avatar_key && (!String(body.avatar_key).startsWith(s.u.id + "/") || !/^[-0-9a-f]{36}\/[-0-9a-f]{36}\.webp$/.test(body.avatar_key))) return apiResponse({ message: "La imagen no pertenece a tu cuenta." }, 403);
    }
    const headers = { Authorization: "Bearer " + s.access, "Content-Type": "application/json" };
    const prefer = req.headers.get("prefer");
    if (["return=minimal", "return=representation"].includes(prefer)) headers.Prefer = prefer;
    const r = await supabaseFetch(path + url.search, { method, headers, body: body ? JSON.stringify(body) : void 0 });
    const outHeaders = new Headers({ "Content-Type": r.headers.get("content-type") || "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
    for (const c of s.cookies) outHeaders.append("Set-Cookie", c);
    return new Response(r.body, { status: r.status, headers: outHeaders });
  } catch (e) {
    return apiResponse({ message: e.status ? e.message : "El servicio no est\xE1 disponible temporalmente." }, e.status || 503);
  }
}
async function protectedMedia(req, env, path) {
  try {
    if (req.method !== "GET" && !trustedWrite(req)) return apiResponse({ message: "Origen no permitido." }, 403);
    await limited(env.API_LIMIT, "media:" + (req.headers.get("cf-connecting-ip") || "unknown"));
    const session = await sessionFor(req);
    if (!session.u) return apiResponse({ message: "Inicia sesi\xF3n con una cuenta verificada." }, 401);
    if (req.method !== "GET") await limited(env.WRITE_LIMIT || env.API_LIMIT, "write:" + session.u.id);
    const headers = new Headers(req.headers);
    headers.set("Authorization", "Bearer " + session.access);
    const authorized = new Request(req, { headers });
    const response = path === "/api/upload" ? await imageUpload(authorized, env) : await imageRead(authorized, env, path);
    const out = new Response(response.body, response);
    for (const cookie of session.cookies) out.headers.append("Set-Cookie", cookie);
    return out;
  } catch (e) {
    return apiResponse({ message: e.status ? e.message : "No se pudo completar la operaci\xF3n." }, e.status || 503);
  }
}
async function creatorMedia(req, env) {
  try {
    if (!["GET", "POST"].includes(req.method)) return apiResponse({ message: "M\xE9todo no permitido." }, 405);
    if (req.method === "POST" && !trustedWrite(req)) return apiResponse({ message: "Origen no permitido." }, 403);
    await limited(env.API_LIMIT, "creator-ip:" + (req.headers.get("cf-connecting-ip") || "unknown"));
    const s = await sessionFor(req);
    if (!s.u) return apiResponse({ message: "Inicia sesi\xF3n con correo verificado." }, 401);
    if (s.u.uhz_status.must_change_password) return apiResponse({ message: "Cambia primero tu contrase\xF1a temporal." }, 403);
    await limited(env.WRITE_LIMIT || env.API_LIMIT, "creator-member:" + s.u.id);
    if (!env.CREATOR_RELAY) return apiResponse({ message: "El servicio de archivos no est\xE1 disponible." }, 503);
    const headers = new Headers(req.headers);
    headers.set("Authorization", "Bearer " + s.access);
    headers.delete("cookie");
    const out = await env.CREATOR_RELAY.fetch(new Request(req, { headers }));
    const response = new Response(out.body, out);
    for (const cookie of s.cookies) response.headers.append("Set-Cookie", cookie);
    return response;
  } catch (e) {
    return apiResponse({ message: e.status ? e.message : "No se pudo completar la operaci\xF3n." }, e.status || 503);
  }
}
async function publicCommunity(req, env) {
  try {
    if (req.method !== "GET") return apiResponse({ message: "Solo lectura p\xFAblica. Inicia sesi\xF3n para participar." }, 405);
    await limited(env.API_LIMIT, "public-community:" + (req.headers.get("cf-connecting-ip") || "unknown"));
    const url = new URL(req.url), id = url.searchParams.get("thread");
    if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return apiResponse({ message: "Pregunta no disponible." }, 400);
    if (!env.CREATOR_RELAY) return apiResponse({ message: "La comunidad no est\xE1 disponible temporalmente." }, 503);
    return env.CREATOR_RELAY.fetch(new Request("https://univershzrw.com/internal/public-community" + (id ? "?thread=" + encodeURIComponent(id) : "")));
  } catch (e) {
    return apiResponse({ message: e.status ? e.message : "La comunidad no est\xE1 disponible temporalmente." }, e.status || 503);
  }
}
async function publicCampaigns(req, env) {
  try {
    if (req.method !== "GET") return apiResponse({ message: "Cat\xE1logo de solo lectura. Inicia sesi\xF3n para elegir una actividad." }, 405);
    await limited(env.API_LIMIT, "public-campaigns:" + (req.headers.get("cf-connecting-ip") || "unknown"));
    if (!env.CREATOR_RELAY) return apiResponse({ message: "Las campa\xF1as no est\xE1n disponibles temporalmente." }, 503);
    return env.CREATOR_RELAY.fetch(new Request("https://univershzrw.com/internal/public-campaigns"));
  } catch (e) {
    return apiResponse({ message: e.status ? e.message : "Las campa\xF1as no est\xE1n disponibles temporalmente." }, e.status || 503);
  }
}
var GUARDIAN_ADMIN_JS = "\n;(()=>{'use strict';\ndocument.addEventListener('DOMContentLoaded',()=>{\n const admin=document.getElementById('panel-users');if(!admin)return;\n const tabs=admin.querySelector('.uhz-admin-tabs');if(!tabs)return;\n const oldTabs=[...tabs.querySelectorAll('button')];\n const tab=document.createElement('button');tab.type='button';tab.className='button ghost';tab.textContent='Control de enlaces';tab.style.display='none';tabs.append(tab);\n const panel=document.createElement('section');panel.className='hide uhz-guardian-control';\n panel.style.cssText='margin-top:18px;padding:16px;border:1px solid #cbd9e5;border-radius:16px;background:#f6f9fd;color:#173751;max-width:100%;box-sizing:border-box';\n const style=document.createElement('style');style.textContent='.uhz-guardian-control *{box-sizing:border-box}.uhz-guardian-control .gbar{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:14px 0}.uhz-guardian-control .gbar input{flex:1;min-width:200px;padding:11px 13px;border:1px solid #b9ccdd;border-radius:10px;background:white;color:#163650;font-size:14px}.uhz-guardian-control .gfilter{border:1px solid #c4d5e2;background:white;color:#295173;padding:8px 11px;border-radius:20px;cursor:pointer;font:inherit;font-size:12px}.uhz-guardian-control .gfilter[aria-pressed=true]{background:#134f79;color:white;border-color:#134f79}.uhz-guardian-control .gtable{overflow-x:auto;width:100%;border:1px solid #d5e0e9;border-radius:12px;background:white}.uhz-guardian-control table{border-collapse:collapse;min-width:840px;width:100%;font-size:13px}.uhz-guardian-control th{background:#eaf1f7;color:#224964;text-align:left;padding:11px 10px;position:sticky;top:0}.uhz-guardian-control td{padding:12px 10px;border-top:1px solid #e2eaf1;vertical-align:top}.uhz-guardian-control .gtitle{font-weight:700;display:block;color:#173650}.uhz-guardian-control .gsmall{display:block;font-size:11px;color:#61768a;margin-top:3px;overflow-wrap:anywhere}.uhz-guardian-control .gurl{display:block;max-width:360px;overflow-wrap:anywhere;word-break:break-all;text-decoration:none;color:#125d9b;line-height:1.45}.uhz-guardian-control .gaction{display:inline-block;border:1px solid #c4d4e1;border-radius:8px;padding:6px 9px;margin:4px 5px 0 0;background:white;color:#18547d;font:inherit;font-size:12px;cursor:pointer}.uhz-guardian-control .gstate{display:inline-block;padding:5px 9px;font-weight:700;font-size:11px;border-radius:20px;white-space:nowrap}.uhz-guardian-control .gstate.good{background:#def5e7;color:#16613e}.uhz-guardian-control .gstate.bad{background:#fde4e4;color:#a32128}.uhz-guardian-control .gstate.warn{background:#fff0d3;color:#7b510a}.uhz-guardian-control .gstate.neutral{background:#e9eef4;color:#435e72}.uhz-guardian-control .gedit{display:none;gap:9px;flex-wrap:wrap;align-items:center;padding:14px;margin:13px 0;background:#e6eff8;border-radius:10px}.uhz-guardian-control .gerror{color:#8a2632}.uhz-guardian-control .ginfo{font-size:12px;color:#59738a;line-height:1.5}.uhz-guardian-control h3{margin:0 0 5px;font-size:20px;color:#153954}@media(max-width:750px){.uhz-guardian-control{padding:10px!important}.uhz-guardian-control h3{font-size:18px}.uhz-guardian-control .gurl{max-width:240px}}';\n document.head.append(style);\n const h=document.createElement('h3');h.textContent='Enlaces y fuentes \xB7 UNIVERSHZRW Guardian';\n const intro=document.createElement('p');intro.className='ginfo';intro.textContent='Identifica cada contenido por su t\xEDtulo y URL. Un enlace sin comprobar no se considera activo ni ca\xEDdo.';\n const toolbar=document.createElement('div');toolbar.className='gbar';\n const search=document.createElement('input');search.type='search';search.placeholder='Buscar por t\xEDtulo, URL o c\xF3digo';search.setAttribute('aria-label','Buscar archivos y URLs');\n const refresh=document.createElement('button');refresh.type='button';refresh.className='gaction';refresh.textContent='Actualizar';toolbar.append(search,refresh);\n const filters=document.createElement('div');filters.className='gbar';\n const definitions=[['all','Todos'],['active','Activos'],['not_working','Sin jalar'],['down','Ca\xEDdos'],['unused','Sin usar'],['review','Por revisar'],['no_url','Sin URL']];\n const buttons=new Map();for(const [key,title] of definitions){const b=document.createElement('button');b.type='button';b.className='gfilter';b.dataset.key=key;b.setAttribute('aria-pressed',key==='all'?'true':'false');b.textContent=title;b.onclick=()=>{filter=key;for(const [k,btn] of buttons)btn.setAttribute('aria-pressed',k===key?'true':'false');render()};filters.append(b);buttons.set(key,b)}\n const summary=document.createElement('p');summary.className='ginfo';summary.setAttribute('role','status');\n const holder=document.createElement('div');holder.className='gtable';const table=document.createElement('table');holder.append(table);\n const foot=document.createElement('p');foot.className='ginfo';foot.textContent='\xABSin usar\xBB significa que la descarga no est\xE1 habilitada para el p\xFAblico (por publicaci\xF3n, permisos o revisi\xF3n de derechos). \xABActivo\xBB significa enlace verificado; no debe confundirse con el estado de publicaci\xF3n.';\n const editor=document.createElement('div');editor.className='gedit';\n const editTitle=document.createElement('strong');const urlInput=document.createElement('input');urlInput.type='url';urlInput.placeholder='Nueva URL HTTPS de TeraBox';urlInput.style.cssText='flex:1;min-width:230px;padding:10px;border:1px solid #bfd0dd;border-radius:8px';\n const save=document.createElement('button');save.type='button';save.className='gaction';save.textContent='Guardar nueva fuente';const cancel=document.createElement('button');cancel.type='button';cancel.className='gaction';cancel.textContent='Cancelar';editor.append(editTitle,urlInput,save,cancel);\n panel.append(h,intro,toolbar,filters,summary,holder,foot,editor);admin.append(panel);\n let rows=[],filter='all',selected=null,loading=false;\n const labels={available:['Activo','good'],unavailable:['Ca\xEDdo','bad'],suspect:['Sin jalar / revisar','warn'],blocked:['Acceso bloqueado','warn'],unknown:['No verificable','neutral'],pending:['Por comprobar','neutral'],unmonitored:['Sin vigilancia','neutral'],no_url:['Sin URL','bad']};\n const addCell=(tr)=>{const td=document.createElement('td');tr.append(td);return td};\n const span=(root,value,cls)=>{const s=document.createElement('span');s.className=cls;s.textContent=value;root.append(s);return s};\n const request=async(action,data)=>{const r=await fetch('/_uhz/admin-api/guardian/'+action,{method:data?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const x=await r.json().catch(()=>({}));if(!r.ok||x.ok!==true)throw Error(x.message||x.error||'No se pudo consultar el servicio');return x};\n const match=(x,k)=>k==='all'||k==='active'&&x.health==='available'||k==='not_working'&&x.health==='suspect'||k==='down'&&x.health==='unavailable'||k==='unused'&&x.publication==='unused'||k==='review'&&['pending','unknown','blocked','unmonitored'].includes(x.health)||k==='no_url'&&x.health==='no_url';\n function render(){\n  for(const [key,button] of buttons){const text=definitions.find(x=>x[0]===key)?.[1]||key;button.textContent=text+' \xB7 '+rows.filter(x=>match(x,key)).length;}\n  const term=search.value.trim().toLocaleLowerCase('es-MX');\n  const filtered=rows.filter(x=>match(x,filter)&&(!term||[x.title,x.url,x.code,x.original_label].some(v=>String(v||'').toLocaleLowerCase('es-MX').includes(term))));\n  const priority={unavailable:0,suspect:1,blocked:2,unknown:3,no_url:4,pending:5,unmonitored:6,available:7};\n  filtered.sort((a,b)=>(priority[a.health]??8)-(priority[b.health]??8)||String(a.title).localeCompare(String(b.title),'es'));\n  summary.textContent=filtered.length+' de '+rows.length+' registros \xB7 '+rows.filter(x=>x.health==='available').length+' activos verificados \xB7 '+rows.filter(x=>x.health==='unavailable').length+' ca\xEDdos confirmados';\n  table.replaceChildren();\n  const thead=document.createElement('thead'),tr=document.createElement('tr');for(const text of ['T\xEDtulo / contenido','URL original','Funcionamiento','Uso en la web','\xDAltima comprobaci\xF3n','Acciones']){const th=document.createElement('th');th.textContent=text;tr.append(th)}thead.append(tr);table.append(thead);\n  const body=document.createElement('tbody');if(!filtered.length){const tr=document.createElement('tr'),td=addCell(tr);td.colSpan=6;td.textContent='No hay registros con este filtro.';body.append(tr)}\n  for(const x of filtered){\n   const tr=document.createElement('tr');\n   const name=addCell(tr);span(name,String(x.title||'Sin t\xEDtulo'),'gtitle');if(x.code)span(name,'C\xF3digo: '+x.code,'gsmall');\n   const link=addCell(tr);\n   if(x.url){try{const u=new URL(x.url);if(u.protocol==='https:'){const anchor=document.createElement('a');anchor.href=u.href;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.className='gurl';anchor.textContent=x.url;anchor.title='Abrir fuente original';link.append(anchor)}}catch{span(link,x.url,'gurl')}const copy=document.createElement('button');copy.type='button';copy.className='gaction';copy.textContent='Copiar URL';copy.onclick=async()=>{try{await navigator.clipboard.writeText(x.url);copy.textContent='Copiado';setTimeout(()=>copy.textContent='Copiar URL',1600)}catch{const range=document.createElement('textarea');range.value=x.url;document.body.append(range);range.select();document.execCommand('copy');range.remove()}};link.append(copy)}else span(link,'No se proporcion\xF3 URL','gsmall');\n   const state=addCell(tr);const current=labels[x.health]||['Sin confirmar','neutral'];span(state,current[0],'gstate '+current[1]);if(x.last_error)span(state,String(x.last_error).slice(0,170),'gsmall');\n   const usage=addCell(tr);span(usage,x.publication==='in_use'?'En uso':'Sin usar','gstate '+(x.publication==='in_use'?'good':'neutral'));if(x.publication_reason)span(usage,x.publication_reason,'gsmall');\n   const updated=addCell(tr);span(updated,x.last_checked_at?new Date(x.last_checked_at).toLocaleString('es-MX'):'A\xFAn no comprobado','gsmall');\n   const ops=addCell(tr);if(x.guardian_id){const edit=document.createElement('button');edit.type='button';edit.className='gaction';edit.textContent='Sustituir fuente';edit.onclick=()=>{selected=x;editTitle.textContent=x.title+' \u2014 nueva fuente:';urlInput.value='';editor.style.display='flex';urlInput.focus()};ops.append(edit)}else span(ops,'Sin monitor asignado','gsmall');\n   body.append(tr);\n  }\n  table.append(body);\n }\n async function load(){\n  if(loading)return;loading=true;refresh.disabled=true;summary.textContent='Cargando registros del cat\xE1logo\u2026';\n  try{const data=await request('dashboard');rows=data.rows||[];render()}catch(e){summary.textContent='No se pudo cargar la tabla. Verifica tu sesi\xF3n de superadministrador. '+e.message;table.replaceChildren()}finally{loading=false;refresh.disabled=false}\n }\n async function verifyGuardianAccess(){try{await request('dashboard');tab.style.display=''}catch{tab.style.display='none';panel.classList.add('hide')}}\n void verifyGuardianAccess();\n document.addEventListener('click',event=>{const e=event.target;if(e instanceof Element&&e.closest('[data-panel=users]'))void verifyGuardianAccess()});\n tab.onclick=()=>{for(const child of admin.children){if(child!==panel&&child!==tabs&&child.tagName==='DIV')child.classList.add('hide')}panel.classList.remove('hide');void load()};\n oldTabs.forEach(b=>b.addEventListener('click',()=>panel.classList.add('hide')));\n search.oninput=()=>render();refresh.onclick=()=>void load();\n cancel.onclick=()=>{selected=null;editor.style.display='none'};\n save.onclick=async()=>{if(!selected)return;let next;try{next=new URL(urlInput.value.trim());if(next.protocol!=='https:')throw Error('HTTPS requerido')}catch{summary.textContent='Debes introducir una URL HTTPS v\xE1lida.';return}\n  save.disabled=true;summary.textContent='Guardando nueva URL\u2026';try{await request('replace',{id:selected.guardian_id,url:next.href});selected=null;editor.style.display='none';await load();summary.textContent='Fuente actualizada y pendiente de nueva verificaci\xF3n.'}catch(e){summary.textContent='No se pudo guardar la nueva fuente: '+e.message}finally{save.disabled=false}};\n});\n})();";
var CHATBOT_ADMIN_JS = `;(function chatbotAdminClient(){
  "use strict";
  document.addEventListener("DOMContentLoaded",()=>{
    const admin=document.getElementById("panel-users"),tabs=admin?.querySelector(".uhz-admin-tabs");
    if(!tabs||document.getElementById("uhzChatKnowledgeAdmin"))return;
    const tab=document.createElement("button");tab.type="button";tab.className="button ghost";tab.textContent="Chatbot \xB7 Conocimiento";tabs.append(tab);
    const panel=document.createElement("section");panel.id="uhzChatKnowledgeAdmin";panel.className="hide uhz-cadmin";tabs.after(panel);
    panel.innerHTML='<div class="uch-head"><div><small>UNIVERSHZRW \xB7 ADMINISTRACI\xD3N</small><h3>Centro de conocimiento</h3><p>Resuelve dudas reales, revisa el historial y ampl\xEDa la biblioteca de respuestas verificadas.</p></div><button type="button" data-a="refresh">Actualizar</button></div><div class="uch-stats"><div><b id="uch-pcount">\u2014</b><span>Preguntas en esta p\xE1gina</span></div><div><b id="uch-kcount">\u2014</b><span>Respuestas en esta p\xE1gina</span></div><div><b>0</b><span>Consumo de IA por respuesta fija</span></div></div><nav class="uch-nav"><button type="button" data-v="q" class="on">Preguntas pendientes</button><button type="button" data-v="k">Conocimiento y respuestas</button></nav><div id="uch-questions"><div class="uch-toolbar"><input id="uch-search" aria-label="Buscar preguntas" placeholder="Buscar folio o texto..." type="search"><select id="uch-status" aria-label="Estado"><option value="open">Pendientes y en revisi\xF3n</option><option value="PENDIENTE">Pendientes</option><option value="EN_REVISION">En revisi\xF3n</option><option value="RESUELTA">Resueltas</option><option value="DESCARTADA">Descartadas</option><option value="all">Todas</option></select><button type="button" data-a="qsearch">Buscar</button></div><div class="uch-layout"><div><div id="uch-qlist" class="uch-list"></div><div class="uch-pager"><button type="button" data-a="qprev">Anterior</button><span id="uch-qpage">P\xE1gina 1</span><button type="button" data-a="qnext">Siguiente</button></div></div><div id="uch-qeditor" class="uch-editor"><p>Selecciona una pregunta para resolverla.</p></div></div></div><div id="uch-knowledge" class="hide"><div class="uch-toolbar"><input id="uch-ksearch" type="search" placeholder="Buscar respuesta o categor\xEDa..." aria-label="Buscar conocimiento"><button type="button" data-a="ksearch">Buscar</button><button type="button" data-a="knew" class="main">Crear respuesta</button></div><div class="uch-layout"><div><div id="uch-klist" class="uch-list"></div><div class="uch-pager"><button type="button" data-a="kprev">Anterior</button><span id="uch-kpage">P\xE1gina 1</span><button type="button" data-a="knext">Siguiente</button></div></div><div id="uch-keditor" class="uch-editor"><p>Selecciona una respuesta para editarla o crea una nueva.</p></div></div></div><div id="uch-note" role="status" aria-live="polite"></div><p class="uch-foot">Solo superadministraci\xF3n. Las respuestas nuevas pueden tardar hasta dos minutos en actualizarse en el chatbot.</p>';
    /* El dise\xF1o se carga en upgrade.css para respetar style-src 'self' */

    const $=s=>panel.querySelector(s),base="/_uhz/portal/admin-backend/rest/v1/";
    let mode="q",qPage=0,kPage=0,questions=[],knowledge=[],currentQ=null,currentK=null,loaded=false,busy=false;
    const take=50;
    const mk=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!=null)el.textContent=String(value);return el};
    const tell=(value,error=false)=>{const el=$("#uch-note");el.textContent=value||"";el.classList.toggle("uch-error",error)};
    const pretty=s=>{try{return new Date(s).toLocaleString("es-MX",{dateStyle:"short",timeStyle:"short"})}catch{return "\u2014"}};
    async function api(path,options={}){
      const r=await fetch(base+path,{credentials:"same-origin",cache:"no-store",...options,headers:{accept:"application/json",...(options.body?{"content-type":"application/json"}:{}),...(options.headers||{})}});
      const d=await r.json().catch(()=>null);
      if(!r.ok)throw Error(d?.message||d?.error||(r.status===401?"Inicia sesi\xF3n como administrador.":r.status===403?"Acceso exclusivo de superadministraci\xF3n.":"Error "+r.status));
      return d;
    }
    function field(root,name,title,value,multiline=false){
      const box=mk("div","uch-field"),label=mk("label",null,title),input=document.createElement(multiline?"textarea":"input");
      input.dataset.key=name;input.value=value==null?"":String(value);input.id="uch-field-"+name;label.htmlFor=input.id;
      if(multiline&&name.includes("answer"))input.classList.add("uch-answer");
      box.append(label,input);root.append(box);return input;
    }
    function lock(flag){busy=flag;for(const b of panel.querySelectorAll("button"))b.disabled=flag}
    function chooseQuestion(item){
      currentQ=item;
      const edit=$("#uch-qeditor");edit.replaceChildren();
      edit.append(mk("small",null,item.folio),mk("h4",null,"Responder a la pregunta"),mk("div","uch-question",item.question),mk("p",null,"Estado: "+item.status+" \xB7 "+pretty(item.received_at)));
      if(item.status==="RESUELTA"||item.status==="DESCARTADA"){
        if(item.admin_answer)edit.append(mk("p","uch-question",item.admin_answer));
        if(item.status==="DESCARTADA"){const b=mk("button",null,"Reabrir pregunta");b.onclick=()=>review("reopen");edit.append(b)}
        else edit.append(mk("p",null,"Para actualizar la respuesta publicada, abre la pesta\xF1a Conocimiento."));
        return;
      }
      field(edit,"category","Categor\xEDa (INGRESOS, CUENTAS, AYUDA\u2026)", "GENERAL").maxLength=45;
      field(edit,"answer","Respuesta aprobada",item.admin_answer||"",true).maxLength=2500;
      field(edit,"variants","Preguntas equivalentes (una por l\xEDnea)",item.question,true).maxLength=2250;
      edit.append(mk("p",null,"Verifica los hechos antes de ense\xF1ar la respuesta al chatbot. La pregunta original se incluye autom\xE1ticamente."));
      const actions=mk("div","uch-actions"),resolve=mk("button","main","Responder y aprender"),reviewBtn=mk("button",null,"En revisi\xF3n"),discard=mk("button","red","Descartar");
      resolve.onclick=()=>review("resolve");reviewBtn.onclick=()=>review("review");discard.onclick=()=>review("discard");
      actions.append(resolve);if(item.status==="PENDIENTE")actions.append(reviewBtn);actions.append(discard);edit.append(actions);
    }
    async function review(action){
      if(!currentQ||busy)return;
      const data={p_folio:currentQ.folio,p_action:action};
      if(action==="resolve"){
        data.p_answer=$("#uch-qeditor [data-key=answer]")?.value.trim()||"";
        data.p_category=($("#uch-qeditor [data-key=category]")?.value.trim()||"GENERAL").toUpperCase().replace(/[^A-Z0-9_]/g,"_");
        data.p_questions=($("#uch-qeditor [data-key=variants]")?.value||"").split(/\\n/).map(x=>x.trim()).filter(Boolean).slice(0,14);
        if(data.p_answer.length<35||data.p_answer.length>2500){tell("Escribe una respuesta de 35 a 2500 caracteres.",true);return}
        if(!confirm("\xBFPublicar la respuesta y cerrar esta pregunta?"))return;
      }else if(!confirm(action==="discard"?"\xBFDescartar esta pregunta sin ense\xF1ar nada al chatbot?":action==="reopen"?"\xBFReabrir esta pregunta?":"\xBFMarcar la pregunta en revisi\xF3n?"))return;
      lock(true);tell("Guardando\u2026");
      try{
        const out=await api("rpc/uhz_admin_chatbot_review",{method:"POST",body:JSON.stringify(data)});
        if(!out?.ok)throw Error("La operaci\xF3n no se confirm\xF3.");
        tell(action==="resolve"?"Respuesta publicada y folio resuelto correctamente.":"Estado actualizado.");
        currentQ=null;$("#uch-qeditor").replaceChildren(mk("p",null,"Selecciona otra pregunta."));
        await fetchQuestions();
      }catch(err){tell("Error: "+err.message,true)}finally{lock(false)}
    }
    function renderQuestions(){
      const list=$("#uch-qlist");list.replaceChildren();
      if(!questions.length)list.append(mk("p",null,"No hay preguntas en esta b\xFAsqueda."));
      for(const item of questions){
        const btn=mk("button","uch-item");btn.setAttribute("aria-pressed",String(currentQ?.folio===item.folio));
        btn.append(mk("strong",null,item.question),mk("span",null,item.folio+" \xB7 "+pretty(item.received_at)+" \xB7 "+item.status));
        btn.onclick=()=>{chooseQuestion(item);for(const x of list.children)x.setAttribute("aria-pressed",String(x===btn))};list.append(btn);
      }
      $("#uch-pcount").textContent=String(questions.length);
      $("#uch-qpage").textContent="P\xE1gina "+(qPage+1);
      $('[data-a="qprev"]').disabled=qPage===0;
      $('[data-a="qnext"]').disabled=questions.length<take;
    }
    async function fetchQuestions(){
      try{
        const qs=new URLSearchParams({select:"folio,question,status,received_at,admin_answer,reviewed_at",order:"received_at.desc",limit:String(take),offset:String(qPage*take)});
        const status=$("#uch-status").value;
        if(status==="open")qs.set("status","in.(PENDIENTE,EN_REVISION)");else if(status!=="all")qs.set("status","eq."+status);
        const query=$("#uch-search").value.trim().replace(/[,*().]/g," ").slice(0,100);
        if(query)qs.set("or","(folio.ilike.*"+query+"*,question.ilike.*"+query+"*)");
        questions=await api("chatbot_questions?"+qs.toString());
        renderQuestions();tell("Bandeja actualizada.");
      }catch(err){tell("No se pudo consultar la bandeja: "+err.message,true)}
    }
    function chooseKnowledge(item){
      currentK=item;const root=$("#uch-keditor");root.replaceChildren();
      root.append(mk("small",null,item?.legacy_id||"NUEVA RESPUESTA"),mk("h4",null,item?"Editar conocimiento":"Nueva respuesta predeterminada"));
      field(root,"kcategory","Categor\xEDa",item?.category||"GENERAL").maxLength=45;
      field(root,"kanswer","Respuesta verificada",item?.answer||"",true).maxLength=2500;
      field(root,"kvariants","Preguntas equivalentes (una por l\xEDnea)",(item?.key_questions||[]).join("\\n"),true).maxLength=2450;
      field(root,"kpriority","Prioridad",item?.priority??90).type="number";
      const line=mk("div","uch-field"),label=mk("label",null,"Activar y publicar"),check=document.createElement("input");
      check.type="checkbox";check.id="uch-published";check.checked=item?(!!item.publish&&item.status==="ACTIVO"):true;label.prepend(check);line.append(label);root.append(line);
      const btn=mk("button","main",item?"Guardar respuesta":"Crear y publicar");btn.onclick=saveKnowledge;root.append(btn);
    }
    async function saveKnowledge(){
      if(busy)return;
      const root=$("#uch-keditor"),get=s=>root.querySelector('[data-key="'+s+'"]')?.value||"";
      const category=(get("kcategory").trim()||"GENERAL").toUpperCase().replace(/[^A-Z0-9_]/g,"_"),answer=get("kanswer").trim(),variants=get("kvariants").split(/\\n/).map(x=>x.trim()).filter(x=>x.length>=4&&x.length<=180).slice(0,15);
      if(!/^[A-Z0-9_]{3,45}$/.test(category)||answer.length<35||answer.length>2500||!variants.length){tell("Completa categor\xEDa, respuesta de 35-2500 caracteres y preguntas equivalentes.",true);return}
      if(!confirm(currentK?"\xBFGuardar la edici\xF3n de esta respuesta?":"\xBFCrear y publicar esta respuesta?"))return;
      const active=$("#uch-published").checked,body={category,answer,key_questions:variants,publish:active,status:active?"ACTIVO":"INACTIVO",priority:Math.min(999,Math.max(0,Number(get("kpriority"))||0)),updated_at:new Date().toISOString()};
      if(!currentK){body.legacy_id="UHZFAQ-ADMIN-"+new Date().toISOString().replace(/\\D/g,"").slice(0,14)+"-"+crypto.randomUUID().slice(0,6).toUpperCase();body.action="";body.action_text="";body.keywords=[]}
      lock(true);try{
        const url=currentK?"chatbot_knowledge?legacy_id="+encodeURIComponent("eq."+currentK.legacy_id):"chatbot_knowledge";
        await api(url,{method:currentK?"PATCH":"POST",headers:{"prefer":"return=representation"},body:JSON.stringify(body)});
        currentK=null;tell("Conocimiento guardado.");await fetchKnowledge();
      }catch(err){tell("Error guardando: "+err.message,true)}finally{lock(false)}
    }
    function renderKnowledge(){
      const list=$("#uch-klist");list.replaceChildren();
      if(!knowledge.length)list.append(mk("p",null,"No se encontraron respuestas."));
      for(const item of knowledge){
        const b=mk("button","uch-item");b.append(mk("strong",null,(item.key_questions||[])[0]||item.category),mk("span",null,item.category+" \xB7 "+item.legacy_id+" \xB7 "+(item.publish&&item.status==="ACTIVO"?"Activa":"Inactiva")));
        b.onclick=()=>chooseKnowledge(item);list.append(b);
      }
      $("#uch-kcount").textContent=String(knowledge.length);$("#uch-kpage").textContent="P\xE1gina "+(kPage+1);
      $('[data-a="kprev"]').disabled=kPage===0;$('[data-a="knext"]').disabled=knowledge.length<take;
    }
    async function fetchKnowledge(){
      try{
        const qs=new URLSearchParams({select:"legacy_id,category,key_questions,answer,publish,status,priority",order:"updated_at.desc",limit:String(take),offset:String(kPage*take)});
        const query=$("#uch-ksearch").value.trim().replace(/[,*().]/g," ").slice(0,100);
        if(query)qs.set("or","(category.ilike.*"+query+"*,answer.ilike.*"+query+"*,legacy_id.ilike.*"+query+"*)");
        knowledge=await api("chatbot_knowledge?"+qs.toString());renderKnowledge();if(mode==="k")tell("Conocimiento actualizado.");
      }catch(err){if(mode==="k")tell("Error consultando conocimiento: "+err.message,true)}
    }
    function showMode(m){
      mode=m;$("#uch-questions").classList.toggle("hide",m!=="q");$("#uch-knowledge").classList.toggle("hide",m!=="k");
      for(const b of panel.querySelectorAll("[data-v]"))b.classList.toggle("on",b.dataset.v===m);
      if(m==="q")void fetchQuestions();else void fetchKnowledge();
    }
    tab.onclick=()=>{
      for(const b of tabs.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b===tab));
      for(const el of [...admin.children])if(el!==tabs&&el!==panel&&el.tagName!=="SPAN"&&el.tagName!=="H2"&&el.tagName!=="P")el.classList.add("hide");
      panel.classList.remove("hide");history.replaceState(null,"","/usuarios?gestion=chatbot");showMode(mode);if(!loaded){loaded=true;void fetchKnowledge();}
    };
    tabs.addEventListener("click",e=>{const b=e.target.closest("button");if(b&&b!==tab){panel.classList.add("hide");tab.setAttribute("aria-pressed","false")}});
    panel.addEventListener("click",e=>{
      const b=e.target.closest("button");if(!b)return;const act=b.dataset.a;
      if(b.dataset.v){showMode(b.dataset.v);return}
      if(act==="refresh"){void fetchQuestions();void fetchKnowledge()}
      if(act==="qsearch"){qPage=0;void fetchQuestions()}
      if(act==="qprev"){qPage=Math.max(0,qPage-1);void fetchQuestions()}
      if(act==="qnext"){qPage++;void fetchQuestions()}
      if(act==="ksearch"){kPage=0;void fetchKnowledge()}
      if(act==="kprev"){kPage=Math.max(0,kPage-1);void fetchKnowledge()}
      if(act==="knext"){kPage++;void fetchKnowledge()}
      if(act==="knew")chooseKnowledge(null);
    });
    $("#uch-status").addEventListener("change",()=>{qPage=0;void fetchQuestions()});
    $("#uch-search").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();qPage=0;void fetchQuestions()}});
    $("#uch-ksearch").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();kPage=0;void fetchKnowledge()}});
    if(new URLSearchParams(location.search).get("gestion")==="chatbot")tab.click();
  });
})();`;
var CHATBOT_ADMIN_CSS = "\n#uhzChatKnowledgeAdmin{box-sizing:border-box;color:#15394f;background:#f7fafc;border:1px solid #d0e0eb;border-radius:17px;padding:clamp(14px,2vw,25px);margin-top:15px;font-family:inherit}#uhzChatKnowledgeAdmin *{box-sizing:border-box}\n#uhzChatKnowledgeAdmin h3{font-size:22px;margin:4px 0 6px;color:#113e56}#uhzChatKnowledgeAdmin h4{font-size:16px;margin:8px 0}\n#uhzChatKnowledgeAdmin p{font-size:13px;line-height:1.5;color:#496579}#uhzChatKnowledgeAdmin small{font-size:10px;letter-spacing:.12em;font-weight:850;color:#5c7a91}\n#uhzChatKnowledgeAdmin .uch-head{display:flex;justify-content:space-between;gap:14px;align-items:start}\n#uhzChatKnowledgeAdmin button{font:inherit;font-size:12px;font-weight:750;cursor:pointer;background:#fff;border:1px solid #b9cedc;border-radius:10px;padding:9px 12px;color:#18516b}\n#uhzChatKnowledgeAdmin button:hover{background:#ecf5fa;border-color:#3982a0}#uhzChatKnowledgeAdmin button.main,#uhzChatKnowledgeAdmin .uch-nav .on{background:#14576f;color:#fff;border-color:#14576f}\n#uhzChatKnowledgeAdmin button.red{border-color:#f0c9d0;color:#a42b38}#uhzChatKnowledgeAdmin button:disabled{opacity:.5;cursor:wait}\n#uhzChatKnowledgeAdmin input,#uhzChatKnowledgeAdmin select,#uhzChatKnowledgeAdmin textarea{border:1px solid #bed0dc;border-radius:9px;padding:10px 11px;font:inherit;font-size:13px;background:white;color:#1c3a4b;min-width:0;max-width:100%}\n#uhzChatKnowledgeAdmin textarea{width:100%;min-height:110px;resize:vertical;line-height:1.5}#uhzChatKnowledgeAdmin .uch-answer{min-height:190px}\n#uhzChatKnowledgeAdmin .uch-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:17px 0}\n#uhzChatKnowledgeAdmin .uch-stats>div{display:grid;gap:5px;background:#fff;border:1px solid #e0eaf0;border-radius:12px;padding:13px;min-width:0}\n#uhzChatKnowledgeAdmin .uch-stats b{font-size:23px;color:#14576f}#uhzChatKnowledgeAdmin .uch-stats span{font-size:11px;color:#61788d}\n#uhzChatKnowledgeAdmin .uch-nav{display:flex;flex-wrap:wrap;gap:8px;border-bottom:1px solid #d4e3ec;padding-bottom:12px;margin-bottom:14px}\n#uhzChatKnowledgeAdmin .uch-toolbar{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:13px}#uhzChatKnowledgeAdmin .uch-toolbar input{flex:1;min-width:170px}\n#uhzChatKnowledgeAdmin .uch-layout{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(0,1.2fr);gap:14px}\n#uhzChatKnowledgeAdmin .uch-list{display:grid;align-content:start;gap:7px;max-height:610px;overflow-y:auto;padding:2px}\n#uhzChatKnowledgeAdmin .uch-item{display:block;text-align:left;background:#fff;border:1px solid #d1dfe8;border-radius:11px;padding:12px;width:100%;min-width:0}\n#uhzChatKnowledgeAdmin .uch-item[aria-pressed=true]{border-color:#287c99;background:#eef7fa;box-shadow:inset 3px 0 #267b98}\n#uhzChatKnowledgeAdmin .uch-item strong{display:block;line-height:1.4;font-size:13px;overflow-wrap:anywhere}\n#uhzChatKnowledgeAdmin .uch-item span{display:block;color:#668096;font-weight:400;font-size:10px;margin-top:5px;overflow-wrap:anywhere}\n#uhzChatKnowledgeAdmin .uch-editor{background:#fff;border:1px solid #d7e4ec;border-radius:13px;padding:17px;min-height:310px;min-width:0}\n#uhzChatKnowledgeAdmin .uch-question{background:#eef7fa;border-left:3px solid #2895af;padding:12px;border-radius:0 9px 9px 0;overflow-wrap:anywhere;font-size:14px}\n#uhzChatKnowledgeAdmin .uch-field{display:grid;gap:6px;margin:12px 0}#uhzChatKnowledgeAdmin label{font-size:12px;font-weight:750;color:#305a73}\n#uhzChatKnowledgeAdmin .uch-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}\n#uhzChatKnowledgeAdmin .uch-pager{display:flex;align-items:center;justify-content:space-between;margin:12px 0;gap:8px;font-size:11px;color:#698296}\n#uhzChatKnowledgeAdmin #uch-note{min-height:18px;color:#196648;margin:12px 0;font-size:12px}#uhzChatKnowledgeAdmin #uch-note.uch-error{color:#ae303c}\n#uhzChatKnowledgeAdmin .uch-foot{font-size:11px;color:#688196}\n@media(max-width:860px){#uhzChatKnowledgeAdmin .uch-layout{grid-template-columns:1fr}#uhzChatKnowledgeAdmin .uch-list{max-height:280px}}\n@media(max-width:560px){#uhzChatKnowledgeAdmin .uch-head{flex-direction:column}#uhzChatKnowledgeAdmin .uch-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#uhzChatKnowledgeAdmin .uch-toolbar select{width:100%}}\n";
var GUARDIAN_CSS = "#panel-users,#panel-users .uhz-guardian-control{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}\n#panel-users .uhz-guardian-control{overflow:hidden!important;width:100%!important;padding:18px!important;border-radius:16px!important;background:#f5f9fd!important;border:1px solid #d2e0ec!important}\n#panel-users .uhz-guardian-control .gbar{display:flex!important;gap:9px!important;flex-wrap:wrap!important;margin:12px 0!important;align-items:center!important}\n#panel-users .uhz-guardian-control .gbar input{flex:1 1 270px!important;min-width:0!important;max-width:100%!important;padding:11px!important;border:1px solid #c8d8e7!important;border-radius:10px!important;background:#fff!important;color:#173d5c!important}\n#panel-users .uhz-guardian-control .gfilter,#panel-users .uhz-guardian-control .gaction{display:inline-block!important;padding:9px 12px!important;border-radius:10px!important;border:1px solid #bed3e4!important;background:#fff!important;color:#175785!important;font-size:12px!important;font-weight:700!important;cursor:pointer!important;max-width:100%!important;white-space:normal!important}\n#panel-users .uhz-guardian-control .gfilter{border-radius:40px!important}\n#panel-users .uhz-guardian-control .gfilter[aria-pressed=true]{color:#fff!important;background:#176ca9!important;border-color:#176ca9!important}\n#panel-users .uhz-guardian-control .gtable{width:100%!important;max-width:100%!important;min-width:0!important;overflow:visible!important;border:0!important;background:transparent!important}\n#panel-users .uhz-guardian-control .gtable table{display:block!important;min-width:0!important;width:100%!important;border:0!important}\n#panel-users .uhz-guardian-control .gtable thead{display:none!important}\n#panel-users .uhz-guardian-control .gtable tbody{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}\n#panel-users .uhz-guardian-control .gtable tbody tr{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:10px 13px!important;width:100%!important;min-width:0!important;padding:15px!important;background:#fff!important;border:1px solid #d9e5ef!important;border-radius:14px!important;box-shadow:0 3px 12px #1232!important}\n#panel-users .uhz-guardian-control .gtable tbody td{display:block!important;min-width:0!important;width:auto!important;max-width:100%!important;padding:0!important;border:0!important;white-space:normal!important;overflow-wrap:anywhere!important}\n#panel-users .uhz-guardian-control .gtable tbody td:nth-child(1),#panel-users .uhz-guardian-control .gtable tbody td:nth-child(2),#panel-users .uhz-guardian-control .gtable tbody td:nth-child(6){grid-column:1/-1!important}\n#panel-users .uhz-guardian-control .gtable tbody td:nth-child(2){background:#f2f7fc!important;padding:9px!important;border-radius:9px!important}\n#panel-users .uhz-guardian-control .gtable tbody td:before{display:block!important;color:#738ba0!important;font-size:10px!important;font-weight:800!important;margin:0 0 5px!important}\n#panel-users .uhz-guardian-control .gtable tbody td:nth-child(2):before{content:'URL ORIGINAL'!important}\n#panel-users .uhz-guardian-control .gtable tbody td:nth-child(3):before{content:'ESTADO DEL ENLACE'!important}\n#panel-users .uhz-guardian-control .gtable tbody td:nth-child(4):before{content:'USO EN LA WEB'!important}\n#panel-users .uhz-guardian-control .gtable tbody td:nth-child(5):before{content:'\xDALTIMA REVISI\xD3N'!important}\n#panel-users .uhz-guardian-control .gtitle{display:block!important;font-weight:800!important;font-size:15px!important;color:#143b5c!important}\n#panel-users .uhz-guardian-control .gsmall{display:block!important;margin-top:5px!important;font-size:11px!important;color:#67839a!important;overflow-wrap:anywhere!important}\n#panel-users .uhz-guardian-control .gurl{display:block!important;max-width:100%!important;word-break:break-all!important;overflow-wrap:anywhere!important;font-size:12px!important;line-height:1.45!important;color:#116b9c!important;margin-bottom:9px!important}\n#panel-users .uhz-guardian-control .gstate{display:inline-block!important;border-radius:50px!important;font-size:11px!important;font-weight:700!important;padding:6px 9px!important;white-space:normal!important}\n#panel-users .uhz-guardian-control .gstate.good{background:#e0f6e8!important;color:#166643!important}\n#panel-users .uhz-guardian-control .gstate.bad{background:#fde1e4!important;color:#932333!important}\n#panel-users .uhz-guardian-control .gstate.warn{background:#fff0d1!important;color:#855c16!important}\n#panel-users .uhz-guardian-control .gstate.neutral{background:#e7eff6!important;color:#456882!important}\n@media(max-width:1050px){#panel-users .uhz-guardian-control .gtable tbody{grid-template-columns:1fr!important}}\n@media(max-width:570px){#panel-users .uhz-guardian-control{padding:11px!important}#panel-users .uhz-guardian-control .gtable tbody tr{grid-template-columns:1fr!important}#panel-users .uhz-guardian-control .gtable tbody td{grid-column:1/-1!important}}\n";
var staticApp = exportedApp;
var UHZ_CATALOG_COMMUNITY_BASE = { async fetch(req, env) {
  const address = new URL(req.url), p = address.pathname;
  if (!["univershzrw.com", "admin.univershzrw.com"].includes(address.hostname)) return Response.redirect("https://univershzrw.com/?cuenta=comunidad", 302);
  if (p === "/sitemap.xml" || p === "/robots.txt") {
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
    const body = p === "/sitemap.xml" ? '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://univershzrw.com/</loc></url><url><loc>https://univershzrw.com/Archivos/Pulsaciones%20por%20Movimiento%20Cu%C3%A1ntico.pdf</loc></url><url><loc>https://univershzrw.com/Archivos/Pulsaciones%20por%20Movimiento%20Cu%C3%A1ntico</loc></url><url><loc>https://univershzrw.com/Archivos/novela-pmc.html</loc></url></urlset>' : "User-agent: *\nAllow: /\nDisallow: /_uhz/admin/\nDisallow: /_uhz/admin-api/\nDisallow: /_uhz/portal/\nSitemap: https://univershzrw.com/sitemap.xml\n";
    return new Response(req.method === "HEAD" ? null : body, { headers: { "Content-Type": p === "/sitemap.xml" ? "application/xml;charset=utf-8" : "text/plain;charset=utf-8", "Cache-Control": "public,max-age=3600", "X-Content-Type-Options": "nosniff" } });
  }
  if (p.startsWith("/admin-backend/")) return adminBackend(req, env);
  if (p.startsWith("/backend/")) return backend(req, env);
  if (p === "/api/public-community") return publicCommunity(req, env);
  if (p === "/api/public-campaigns") return publicCampaigns(req, env);
  if (p.startsWith("/api/creator/")) return creatorMedia(req, env);
  if (p === "/upgrade.js" && req.method === "GET") return new Response(ADDON_JS + GUARDIAN_ADMIN_JS + CHATBOT_ADMIN_JS, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public,max-age=180", "x-content-type-options": "nosniff" } });
  if (p === "/upgrade.css" && req.method === "GET") return new Response(ADDON_CSS + GUARDIAN_CSS + CHATBOT_ADMIN_CSS + (isAdminHost(req) ? "" : "\n.uhz-superadmin-only,.moderator-only,[data-panel=users],[data-panel=moderation],[data-account-panel=users],[data-account-panel=moderation],#panel-users,#panel-moderation{display:none!important}\n"), { headers: { "content-type": "text/css; charset=utf-8", "cache-control": "public,max-age=180", "x-content-type-options": "nosniff" } });
  if (p === "/api/upload" && req.method === "POST") return protectedMedia(req, env, p);
  if (p.startsWith("/media/") && req.method === "GET") return protectedMedia(req, env, p);
  const page = await staticApp.fetch(req, env);
  if ((p === "/" || p === "/index.html") && new URL(req.url).searchParams.get("embed") === "1") {
    const headers = new Headers(page.headers);
    headers.delete("X-Frame-Options");
    headers.set("Content-Security-Policy", (headers.get("Content-Security-Policy") || "").replace("frame-ancestors 'none'", "frame-ancestors https://univershzrw.com"));
    return new Response(page.body, { status: page.status, statusText: page.statusText, headers });
  }
  return page;
} };
var ADMIN_TABLES = /* @__PURE__ */ new Set(["content_resources", "downloads", "contributions", "rights_reports", "ads", "ad_requests", "ad_plans", "ad_config", "products", "shop_config", "shop_orders", "shop_order_items", "chatbot_knowledge", "chatbot_questions", "chatbot_blocked_words", "integration_status", "payment_audit", "audit_log", "site_config"]);
var ADMIN_RPCS = /* @__PURE__ */ new Set(["uhz_admin_payment_center", "uhz_admin_review_spei", "uhz_admin_chatbot_review"]);
var ADMIN_FUNCTIONS = /* @__PURE__ */ new Set(["uhz-api", "payments", "mp-webhook", "shop", "transaction-email"]);
async function adminBackend(req, env) {
  if (!isAdminHost(req)) return apiResponse({ message: "Administraci\xF3n disponible en admin.univershzrw.com." }, 403);
  try {
    const url = new URL(req.url), path = url.pathname.slice("/admin-backend".length), method = req.method;
    if (path.startsWith("/auth/v1/")) {
      const target = new URL(req.url);
      target.pathname = "/backend" + path;
      return backend(new Request(target, req), env);
    }
    if (!["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE"].includes(method)) return apiResponse({ message: "M\xE9todo no permitido." }, 405);
    if (!["GET", "HEAD"].includes(method) && !trustedWrite(req)) return apiResponse({ message: "Origen no permitido." }, 403);
    await limited(env.API_LIMIT, "admin:" + (req.headers.get("cf-connecting-ip") || "unknown"));
    const authorization = req.headers.get("Authorization");
    let s;
    if (path.startsWith("/guardian/") && authorization) {
      const match = /^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(authorization);
      const access = match?.[1];
      s = { access, u: access ? await checkedUser(access) : null, cookies: [] };
    } else {
      s = await sessionFor(req);
    }
    if (!s.u) return apiResponse({ message: "Inicia sesi\xF3n." }, 401);
    if (!ownerUser(s.u) || s.u.uhz_status?.must_change_password) return apiResponse({ message: "Se requiere superadministrador y contrase\xF1a definitiva." }, 403);
    if (!["GET", "HEAD"].includes(method)) await limited(env.WRITE_LIMIT || env.API_LIMIT, "admin-write:" + s.u.id);
    if (path === "/guardian/pending" || path === "/guardian/replace" || path === "/guardian/dashboard") {
      if (!env.CREATOR_RELAY || !env.ADMIN_GUARDIAN_TOKEN) return apiResponse({ message: "Guardian no disponible." }, 503);
      if ((path === "/guardian/pending" || path === "/guardian/dashboard") && method !== "GET" || path === "/guardian/replace" && method !== "POST") return apiResponse({ message: "M\xE9todo no permitido." }, 405);
      let payload = { action: path === "/guardian/dashboard" ? "dashboard" : "pending" };
      if (path === "/guardian/replace") {
        try {
          const bytes = await boundedBody(req, 4200);
          const x = JSON.parse(new TextDecoder().decode(bytes));
          payload = { action: "replace", id: x.id, url: x.url };
        } catch {
          return apiResponse({ message: "Solicitud inv\xE1lida." }, 400);
        }
      }
      try {
        const result = await env.CREATOR_RELAY.fetch(new Request("https://guardian-internal/admin-guardian", { method: "POST", headers: { "content-type": "application/json", "x-guardian-admin": env.ADMIN_GUARDIAN_TOKEN }, body: JSON.stringify(payload) }));
        const replyHeaders = new Headers({ "content-type": "application/json", "cache-control": "private, no-store", "x-content-type-options": "nosniff" });
        for (const freshCookie of s.cookies) replyHeaders.append("Set-Cookie", freshCookie);
        return new Response(result.body, { status: result.status, headers: replyHeaders });
      } catch {
        return apiResponse({ message: "Guardian temporalmente no disponible." }, 503);
      }
    }
    let allowed = false;
    if (path.startsWith("/rest/v1/rpc/")) allowed = method === "POST" && ADMIN_RPCS.has(path.slice("/rest/v1/rpc/".length));
    else if (path.startsWith("/rest/v1/")) allowed = ADMIN_TABLES.has(path.slice("/rest/v1/".length));
    else if (path.startsWith("/functions/v1/")) allowed = ["GET", "POST"].includes(method) && ADMIN_FUNCTIONS.has(path.slice("/functions/v1/".length));
    else if (path.startsWith("/storage/v1/")) allowed = ["GET", "POST", "PUT"].includes(method) && /^\/storage\/v1\/object\/(?:sign\/)?(?:uhz-private|uhz-public)\//.test(path);
    if (!allowed) return apiResponse({ message: "Ruta no permitida." }, 404);
    const body = ["GET", "HEAD"].includes(method) ? void 0 : await boundedBody(req, 65e5);
    const headers = { Authorization: "Bearer " + s.access };
    for (const name of ["content-type", "accept", "prefer", "range", "x-upsert", "cache-control", "content-profile", "accept-profile"]) {
      const value = req.headers.get(name);
      if (value) {
        if (["content-profile", "accept-profile"].includes(name) && value !== "public") return apiResponse({ message: "Esquema no permitido." }, 403);
        headers[name] = value;
      }
    }
    const upstream = await supabaseFetch(path + url.search, { method, headers, body });
    const out = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    for (const name of ["content-type", "content-range", "range-unit", "location"]) {
      const value = upstream.headers.get(name);
      if (value) out.set(name, value);
    }
    for (const c of s.cookies) out.append("Set-Cookie", c);
    return new Response(upstream.body, { status: upstream.status, headers: out });
  } catch (e) {
    return apiResponse({ message: e.status ? e.message : "No fue posible completar la operaci\xF3n administrativa." }, e.status || 503);
  }
}
async function catalogMedia(req, env) {
  try {
    const u = new URL(req.url), key2 = u.pathname.split("/").pop();
    const rpc = async (action, payload, access) => {
      const r = await supabaseFetch("/rest/v1/rpc/uhz_catalog_media", { method: "POST", headers: { "Content-Type": "application/json", ...access ? { Authorization: "Bearer " + access } : {} }, body: JSON.stringify({ p_action: action, p_payload: payload }) });
      const d = await r.json();
      if (!r.ok) throw Error(d.message || "No se pudo registrar la imagen.");
      return d;
    };
    if (req.method === "GET" && /^[0-9a-f-]{36}\.webp$/.test(key2)) {
      const check = await rpc("public_read", { key: key2 });
      let owner = null;
      if (!check.ok) {
        const s = await sessionFor(req);
        if (!ownerUser(s.u)) return apiResponse({ message: "Imagen no disponible" }, 404);
        owner = s;
      }
      let obj;
      if (env.COMMUNITY_IMAGES) obj = await env.COMMUNITY_IMAGES.get("catalog/" + key2);
      if (!obj) {
        const stored = await supabaseFetch("/storage/v1/object/public/uhz-public/catalog/" + key2, { method: "GET" });
        if (stored.ok) obj = { body: stored.body };
      }
      if (!obj) return apiResponse({ message: "Imagen no disponible" }, 404);
      const h = new Headers({ "Content-Type": "image/webp", "Cache-Control": owner ? "private,no-store" : "public,max-age=300", "X-Content-Type-Options": "nosniff", "Vary": "Cookie" });
      for (const c of owner?.cookies || []) h.append("Set-Cookie", c);
      return new Response(obj.body, { headers: h });
    }
    if (req.method !== "POST" || !trustedWrite(req) || !isAdminHost(req)) return apiResponse({ message: "Solo administraci\xF3n" }, 403);
    const session = await sessionFor(req);
    if (!ownerUser(session.u)) return apiResponse({ message: "Inicia sesi\xF3n con la cuenta propietaria." }, 401);
    await limited(env.WRITE_LIMIT || env.API_LIMIT, "catalog-media:" + session.u.id);
    if (key2 === "cleanup") {
      const input = await jsonBody(req, 12e3), d = await rpc("cleanup", input, session.access);
      let deleted = 0;
      for (const k of d.keys || []) {
        if (!/^[0-9a-f-]{36}\.webp$/.test(k)) continue;
        if (env.COMMUNITY_IMAGES) await env.COMMUNITY_IMAGES.delete("catalog/" + k);
        const r = await supabaseFetch("/storage/v1/object/uhz-public", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access }, body: JSON.stringify({ prefixes: ["catalog/" + k] }) });
        if (!r.ok && r.status !== 404) continue;
        await rpc("deleted", { key: k }, session.access);
        deleted++;
      }
      return apiResponse({ ok: true, deleted }, 200, session.cookies);
    }
    if (req.headers.get("content-type") !== "image/webp") return apiResponse({ message: "Usa WebP" }, 415);
    const data = await boundedBody(req, 307200), view = new DataView(data.buffer, data.byteOffset, data.byteLength), text = (o, n) => String.fromCharCode(...data.slice(o, o + n));
    if (data.length < 30 || text(0, 4) !== "RIFF" || text(8, 4) !== "WEBP" || view.getUint32(4, true) + 8 !== data.length) return apiResponse({ message: "WebP inv\xE1lido" }, 415);
    let width = 0, height = 0;
    for (let o = 12; o + 8 < data.length; ) {
      const type = text(o, 4), len = view.getUint32(o + 4, true), p = o + 8;
      if (p + len > data.length) break;
      if (type === "VP8 " && len >= 10 && text(p + 3, 3) === "\x9D*") {
        width = view.getUint16(p + 6, true) & 16383;
        height = view.getUint16(p + 8, true) & 16383;
        break;
      }
      if (type === "VP8L" && len >= 5 && data[p] === 47) {
        const b = view.getUint32(p + 1, true);
        width = (b & 16383) + 1;
        height = (b >>> 14 & 16383) + 1;
        break;
      }
      if (type === "VP8X" && len >= 10) {
        if (data[p] & 2) return apiResponse({ message: "No se permiten im\xE1genes animadas" }, 415);
        width = 1 + data[p + 4] + 256 * data[p + 5] + 65536 * data[p + 6];
        height = 1 + data[p + 7] + 256 * data[p + 8] + 65536 * data[p + 9];
      }
      o = p + len + len % 2;
    }
    if (!width || !height || width > 1600 || height > 1600) return apiResponse({ message: "Dimensiones m\xE1ximas: 1600 \xD7 1600" }, 400);
    const name = crypto.randomUUID() + ".webp";
    await rpc("reserve", { key: name, bytes: data.length, width, height }, session.access);
    const uploaded = await supabaseFetch("/storage/v1/object/uhz-public/catalog/" + name, { method: "POST", headers: { Authorization: "Bearer " + session.access, "Content-Type": "image/webp", "x-upsert": "false" }, body: data });
    if (!uploaded.ok) throw Error("El almacenamiento no confirm\xF3 la imagen.");
    const confirmed = await rpc("confirm", { key: name }, session.access);
    if (!confirmed.ok) throw Error("No se pudo confirmar la imagen.");
    return apiResponse({ ok: true, url: "https://univershzrw.com/_uhz/catalog-images/" + name, bytes: data.length, width, height }, 200, session.cookies);
  } catch (e) {
    return apiResponse({ message: e.status ? e.message : "No se pudo guardar la imagen. Revisa la cuota y vuelve a intentar." }, e.status || 503);
  }
}
var UHXP_FIELDS = { full_name: 120, preferred_name: 65, contact_email: 254, phone: 18, alternate_phone: 18, shipping_recipient: 120, shipping_phone: 18, shipping_street: 120, shipping_ext: 20, shipping_int: 20, shipping_neighborhood: 90, shipping_city: 90, shipping_state: 90, shipping_postal: 7, shipping_country: 40, shipping_notes: 300, dc3_full_name: 120, dc3_position: 95, dc3_company: 160, dc3_company_rfc: 13, dc3_curp: 18, dc3_rfc: 13 };
var UHXP_SECRETS = ["dc3_curp", "dc3_rfc", "dc3_company_rfc"];
function uhxpB64(a) {
  let s = "";
  for (const x of a) s += String.fromCharCode(x);
  return btoa(s);
}
function uhxpUn64(s) {
  return Uint8Array.from(atob(s), (x) => x.charCodeAt(0));
}
async function uhxpKey(env) {
  if (!env.UHZ_PROFILE_ENCRYPTION_KEY) throw Object.assign(Error("El cifrado todav\xEDa no est\xE1 disponible."), { status: 503 });
  let bytes = uhxpUn64(env.UHZ_PROFILE_ENCRYPTION_KEY);
  if (bytes.length !== 32) throw Error("Clave inv\xE1lida");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function uhxpRead(env, u) {
  let saved = u.user_metadata?.uhz_private_v1;
  if (!saved) return {};
  if (saved.v !== 1 || !saved.iv || !saved.ct) throw Error("Formato de datos protegido no v\xE1lido");
  try {
    let value = await crypto.subtle.decrypt({ name: "AES-GCM", iv: uhxpUn64(saved.iv), additionalData: new TextEncoder().encode(u.id) }, await uhxpKey(env), uhxpUn64(saved.ct));
    let data = JSON.parse(new TextDecoder().decode(value));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw Error();
    return data;
  } catch {
    throw Object.assign(Error("No se pudo descifrar tu perfil. No se modificaron tus datos."), { status: 503 });
  }
}
async function uhxpWrite(env, u, data) {
  let iv = crypto.getRandomValues(new Uint8Array(12)), plain = new TextEncoder().encode(JSON.stringify(data)), ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(u.id) }, await uhxpKey(env), plain);
  return { v: 1, iv: uhxpB64(iv), ct: uhxpB64(new Uint8Array(ct)) };
}
function uhxpView(data) {
  let result = {};
  for (const k of Object.keys(UHXP_FIELDS)) {
    let v = typeof data[k] === "string" ? data[k] : "";
    if (UHXP_SECRETS.includes(k)) {
      result[k + "_saved"] = !!v;
      result[k + "_masked"] = v ? "*".repeat(Math.max(4, v.length - 4)) + v.slice(-4) : "";
    } else result[k] = v;
  }
  return result;
}
async function uhxpAPI(req, env) {
  try {
    const method = req.method;
    if (method !== "GET" && method !== "PUT") return apiResponse({ message: "M\xE9todo no permitido." }, 405);
    const u = new URL(req.url);
    if (!["univershzrw.com", "admin.univershzrw.com"].includes(u.hostname)) return apiResponse({ message: "Origen no permitido." }, 403);
    if (method === "PUT" && (!trustedWrite(req) || (req.headers.get("content-type") || "").split(";")[0] !== "application/json")) return apiResponse({ message: "Solicitud no autorizada." }, 403);
    const session = await sessionFor(req);
    if (!session.u || session.u.uhz_status?.must_change_password) return apiResponse({ message: "Inicia sesi\xF3n para gestionar tu perfil." }, 401, session.cookies);
    await limited(env.API_LIMIT, "profile:" + session.u.id);
    const stored = await uhxpRead(env, session.u);
    if (method === "GET") return apiResponse({ ok: true, email: session.u.email, fields: uhxpView(stored) }, 200, session.cookies);
    const data = await jsonBody(req, 12500);
    if (!data.fields || Array.isArray(data.fields) || typeof data.fields !== "object") return apiResponse({ message: "Formulario inv\xE1lido." }, 400, session.cookies);
    let next = { ...stored };
    for (const [k, max] of Object.entries(UHXP_FIELDS)) {
      if (!Object.hasOwn(data.fields, k)) continue;
      const value2 = data.fields[k];
      if (typeof value2 !== "string") return apiResponse({ message: "Tipo de dato inv\xE1lido." }, 400, session.cookies);
      let v = value2.trim().normalize("NFC");
      if (v.length > max) return apiResponse({ message: "Un campo excede su longitud permitida." }, 400, session.cookies);
      if (UHXP_SECRETS.includes(k) && !v) continue;
      next[k] = UHXP_SECRETS.includes(k) ? v.toUpperCase() : v;
    }
    for (const k of UHXP_SECRETS) if (data["clear_" + k] === true) next[k] = "";
    if (next.dc3_curp && !/^[A-Z0-9]{18}$/.test(next.dc3_curp)) return apiResponse({ message: "La CURP debe tener 18 caracteres alfanum\xE9ricos." }, 400, session.cookies);
    for (const k of ["dc3_rfc", "dc3_company_rfc"]) if (next[k] && !/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(next[k])) return apiResponse({ message: "Revisa el RFC." }, 400, session.cookies);
    if (next.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.contact_email)) return apiResponse({ message: "Revisa el correo electr\xF3nico de contacto." }, 400, session.cookies);
    if (next.shipping_postal && !/^[0-9]{5}$/.test(next.shipping_postal)) return apiResponse({ message: "El c\xF3digo postal debe tener 5 d\xEDgitos." }, 400, session.cookies);
    for (const k of ["phone", "alternate_phone", "shipping_phone"]) if (next[k] && !/^[+0-9() .-]{7,18}$/.test(next[k])) return apiResponse({ message: "Revisa el tel\xE9fono." }, 400, session.cookies);
    if (!next.shipping_country) next.shipping_country = "M\xE9xico";
    const value = await uhxpWrite(env, session.u, next);
    const upstream = await supabaseFetch("/auth/v1/user", { method: "PUT", headers: { Authorization: "Bearer " + session.access, "Content-Type": "application/json" }, body: JSON.stringify({ data: { ...session.u.user_metadata, uhz_private_v1: value } }) });
    if (!upstream.ok) return apiResponse({ message: "El servicio de identidad no pudo guardar tus datos." }, upstream.status === 429 ? 429 : 503, session.cookies);
    return apiResponse({ ok: true, email: session.u.email, fields: uhxpView(next), message: "Datos guardados y cifrados correctamente." }, 200, session.cookies);
  } catch (e) {
    return apiResponse({ message: e.status ? e.message : "No fue posible consultar o guardar tus datos privados." }, e.status || 503);
  }
}
var community_entry_default = { ...UHZ_CATALOG_COMMUNITY_BASE, async fetch(req, env, ctx) {
  const p = new URL(req.url).pathname;
  if (p === "/api/private-profile" || p === "/_uhz/portal/api/private-profile") return uhxpAPI(req, env);
  if (p.startsWith("/api/catalog-media/")) return catalogMedia(req, env);
  return UHZ_CATALOG_COMMUNITY_BASE.fetch(req, env, ctx);
} };
export {
  community_entry_default as default
};
