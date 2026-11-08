// Shared, deterministic provider registry. No network, credentials or FAK dependency.
export const PROVIDERS=Object.freeze([
 {id:'univershzrw',name:'UNIVERSHZRW',mode:'direct',description:'Archivos y reproductor propios'},
 {id:'mediafire',name:'MediaFire',mode:'resolve',description:'Resolución de archivos públicos y descarga'},
 {id:'drive',name:'Google Drive',mode:'preview',description:'Vista previa oficial; conserva permisos y clave del recurso'},
 {id:'onedrive',name:'OneDrive / SharePoint',mode:'account',description:'Enlace compartido; reproducción directa requiere Microsoft Graph'},
 {id:'mega',name:'MEGA',mode:'account',description:'Enlace cifrado; conserva la clave y abre el proveedor'},
 {id:'terabox',name:'TeraBox',mode:'account',description:'Enlace compartido; reproducción directa requiere conexión autorizada'},
 {id:'dropbox',name:'Dropbox',mode:'direct',description:'Archivo compartido con representación directa'},
 {id:'youtube',name:'YouTube',mode:'preview',description:'Reproductor oficial para videos con inserción permitida'},
 {id:'vimeo',name:'Vimeo',mode:'preview',description:'Reproductor oficial; conserva la clave de videos privados'},
 {id:'direct',name:'Archivo directo autorizado',mode:'direct',description:'Multimedia de los servidores autorizados'}
]);
const TERA=['terabox.com','terabox.app','teraboxapp.com','1024tera.com','1024terabox.com','mirrobox.com','teraboxlink.com','teraboxshare.com'];
export const matches=(host,base)=>host===base||host.endsWith('.'+base);
export function secureURL(value){
 if(typeof value!=='string'||value.length>1500||/[\s\\\u0000-\u001f\u007f]/u.test(value))throw Error('Usa una URL HTTPS válida, sin espacios.');
 let u;try{u=new URL(value);}catch{throw Error('Pega el enlace completo del archivo.');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname.endsWith('.')||u.hostname.includes('%')||!u.hostname.includes('.')||/^\[|^\d+\.\d+\.\d+\.\d+$/.test(u.hostname))throw Error('El destino del enlace no está autorizado.');return u;
}
export function describeURL(value,expected='auto'){
 const u=secureURL(value),h=u.hostname;let id,folder=false,embed=null;
 if(['univershzrw.com','www.univershzrw.com'].includes(h))id='univershzrw';
 else if(['mediafire.com','www.mediafire.com'].includes(h))id='mediafire';
 else if(['drive.google.com','docs.google.com'].includes(h))id='drive';
 else if(['onedrive.live.com','1drv.ms'].includes(h)||matches(h,'sharepoint.com'))id='onedrive';
 else if(['mega.nz','www.mega.nz','mega.io'].includes(h))id='mega';
 else if(TERA.some(b=>matches(h,b)))id='terabox';
 else if(['dropbox.com','www.dropbox.com','dl.dropboxusercontent.com'].includes(h))id='dropbox';
 else if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(h))id='youtube';
 else if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(h))id='vimeo';
 else if(h==='interactive-examples.mdn.mozilla.net'||h==='kgqkszlennwhlyngktcc.supabase.co'||h==='kgqkszlennwhlyngktcc.storage.supabase.co')id='direct';
 else throw Error('Selecciona un proveedor compatible o sube el archivo a UNIVERSHZRW.');
 if(expected!=='auto'&&id!==expected)throw Error('El enlace corresponde a '+PROVIDERS.find(p=>p.id===id).name+'. Revisa la plataforma seleccionada.');
 for(const key of [...u.searchParams.keys()])if(/^utm_|^fbclid$|^gclid$/i.test(key))u.searchParams.delete(key);
 if(id==='mediafire'){folder=/^\/folder\//.test(u.pathname);if(!folder&&!/^\/(?:file|file_premium|download)\/[a-z0-9]+(?:\/|$)/i.test(u.pathname)&&![...u.searchParams.keys()].some(x=>/^[a-z0-9]{10,}$/.test(x)))throw Error('Usa el enlace compartido de un archivo de MediaFire.');}
 if(id==='drive'){
  folder=/\/folders\//.test(u.pathname);let file=u.pathname.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/)?.[1]||u.searchParams.get('id');
  if(!folder&&file&&/^[a-zA-Z0-9_-]{10,}$/.test(file)){
   const docs=h==='docs.google.com'&&/^\/(document|spreadsheets|presentation)\//.test(u.pathname),base=docs?'https://docs.google.com/'+u.pathname.split('/')[1]+'/d/':'https://drive.google.com/file/d/';
   const n=new URL(base+file+(docs?'/preview':'/view'));const rk=u.searchParams.get('resourcekey');if(rk)n.searchParams.set('resourcekey',rk);u.href=n.href;
   embed=new URL(base+file+'/preview');if(rk)embed.searchParams.set('resourcekey',rk);embed=embed.href;
  }
 }
 if(id==='onedrive')folder=/\/:f:\//.test(u.pathname);
 if(id==='mega')folder=/^\/folder\/|^#F!/.test(u.pathname+u.hash);
 if(id==='dropbox')folder=/^\/scl\/fo\//.test(u.pathname);
 if(id==='youtube'){const video=h==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/\/(?:shorts|embed)\/([^/]+)/)?.[1];if(!/^[\w-]{11}$/.test(video||''))throw Error('Usa el enlace de un video de YouTube.');u.href='https://www.youtube.com/watch?v='+video;embed='https://www.youtube-nocookie.com/embed/'+video;}
 if(id==='vimeo'){const video=u.pathname.match(/(?:video\/)?(\d{5,})(?:\/([\w]+))?/) ;if(!video)throw Error('Usa el enlace de un video de Vimeo.');const v=new URL('https://player.vimeo.com/video/'+video[1]);const key=u.searchParams.get('h')||video[2];if(key)v.searchParams.set('h',key);embed=v.href;}
 const provider=PROVIDERS.find(p=>p.id===id),name=decodeName(u.pathname.split('/').filter(Boolean).at(-1)||provider.name);
 return {provider:id,providerName:provider.name,url:u.href,folder,embed,mode:folder?'folder':provider.mode,name,description:folder?'Carpeta compartida: selecciona un archivo individual para reproducir.':provider.description};
}
function decodeName(x){try{return decodeURIComponent(x).slice(0,200);}catch{return x.slice(0,200);}}
export function mediaKind(type='',name=''){
 type=type.split(';')[0].toLowerCase();if(type.startsWith('video/'))return 'video';if(type.startsWith('audio/'))return 'audio';if(['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(type))return 'image';if(type==='application/pdf')return 'pdf';
 if(!type||type==='application/octet-stream'){if(/\.(mp4|webm|m4v|mov)$/i.test(name))return 'video';if(/\.(mp3|m4a|wav|ogg|flac)$/i.test(name))return 'audio';if(/\.(png|jpe?g|webp|avif|gif)$/i.test(name))return 'image';if(/\.pdf$/i.test(name))return 'pdf';}return 'file';
}
export function canFetch(h,provider){
 if(provider==='mediafire')return h==='www.mediafire.com'||h==='mediafire.com'||/^download[0-9]+\.mediafire\.com$/.test(h);
 if(provider==='dropbox')return ['dropbox.com','www.dropbox.com','dl.dropboxusercontent.com'].includes(h)||matches(h,'dropboxusercontent.com');
 if(provider==='univershzrw'||provider==='direct')return ['univershzrw.com','www.univershzrw.com','interactive-examples.mdn.mozilla.net','kgqkszlennwhlyngktcc.supabase.co','kgqkszlennwhlyngktcc.storage.supabase.co'].includes(h);
 return false;
}
