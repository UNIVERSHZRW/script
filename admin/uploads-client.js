import {Upload} from 'tus-js-client';
import {fileType} from './core.mjs';
const endpoint='/_uhz/portal/backend/functions/v1/uhz-admin-control';
const origin='https://kgqkszlennwhlyngktcc.storage.supabase.co';
export async function request(action,payload={}){const r=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({action,payload})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(d.message||'No se pudo completar la operación.'),{status:r.status});return d;}
const supported=new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','application/pdf']);
export async function optimize(file,enabled=true){
 if(!enabled||!['image/jpeg','image/png','image/webp'].includes(file.type))return file;
 let image;try{image=await createImageBitmap(file);}catch{throw Error('No se pudo abrir la imagen. Revisa su formato.');}
 if(!image.width||!image.height||image.width*image.height>40000000){image.close?.();throw Error('La imagen supera 40 megapíxeles. Reduce sus dimensiones.');}
 const scale=Math.min(1,1920/image.width,1920/image.height),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
 const context=canvas.getContext('2d');if(!context){image.close?.();return file;}context.drawImage(image,0,0,canvas.width,canvas.height);image.close?.();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.83));canvas.width=canvas.height=1;
 if(!blob||blob.type!=='image/webp'||blob.size>=file.size)return file;
 return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp',lastModified:file.lastModified});
}
export class ManagedUpload{
 constructor(file,options={}){this.file=file;this.options=options;this.state='waiting';this.percent=0;this.key=crypto.randomUUID();this.listeners=new Set();this.done=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject});this.done.catch(()=>{});}
 emit(state,extra={}){this.state=state;Object.assign(this,extra);this.options.onChange?.(this);for(const fn of this.listeners)fn(this);}
 async start(){
  if(['uploading','preparing','complete','cancelled'].includes(this.state))return;
  if(this.tus){return this.resume();}
  this.emit('preparing');
  try{
   if(!supported.has(this.file.type)){const mime=fileType(new Uint8Array(await this.file.slice(0,32).arrayBuffer()));if(!supported.has(mime))throw Error('Formato admitido: JPG, PNG, WebP, GIF, PDF o MP4.');this.file=new File([this.file],this.file.name,{type:mime,lastModified:this.file.lastModified});}if(this.file.size>20971520||this.file.size===0)throw Error('El archivo debe pesar entre 1 byte y 20 MB.');
   this.optimized=await optimize(this.file,this.options.optimize!==false);
   if(this.state==='cancelled')return;
   const buffer=await this.optimized.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',buffer);this.sha256=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
   const grant=await request('upload_reserve',{request_key:this.key,name:this.optimized.name||this.options.name||'archivo.webp',mime:this.optimized.type,size:this.optimized.size,sha256:this.sha256,bucket:this.options.bucket||'uhz-public',purpose:this.options.purpose||'content'});
   this.record=grant.file;this.savedBytes=this.file.size-this.optimized.size;
   if(this.state==='cancelled'){if(!grant.duplicate)await request('cancel',{id:this.record.id});return;}
   if(grant.duplicate){this.percent=100;this.emit('complete',{record:grant.file,duplicate:true});this.resolve(grant.file);return;}
   this.grant=grant.upload;this.tus=new Upload(this.optimized,{
    endpoint:this.grant.endpoint,chunkSize:6291456,retryDelays:[0,2000,5000,10000,20000],uploadDataDuringCreation:true,
    removeFingerprintOnSuccess:true,headers:{'x-signature':this.grant.signature,'x-upsert':'false'},
    metadata:{bucketName:this.record.bucket,objectName:this.record.object_path,contentType:this.optimized.type,cacheControl:'3600'},
    fingerprint:async()=>['uhz-admin-v1',this.record.bucket,this.sha256].join('-'),
    onBeforeRequest:async req=>{const u=new URL(req.getURL());if(![origin,'https://kgqkszlennwhlyngktcc.supabase.co'].includes(u.origin)||!u.pathname.startsWith('/storage/v1/upload/resumable'))throw Error('Destino de subida no autorizado.');if(Date.parse(this.grant.expires_at)<=Date.now()+60000){const next=await request('upload_renew',{id:this.record.id});this.grant=next.upload;}req.setHeader('x-signature',this.grant.signature);},
    onProgress:(done,total)=>{if(this.state==='paused'||this.state==='cancelled')return;this.percent=total?Math.min(99,Math.floor(done/total*100)):0;this.emit('uploading',{uploadedBytes:done});},
    onSuccess:async()=>{this.emit('verifying');try{const result=await request('upload_complete',{id:this.record.id});this.percent=100;this.emit('complete',{record:result.file});this.resolve(result.file);}catch(e){this.emit('error',{error:e.message});this.reject(e);}},
    onError:e=>{if(['paused','cancelled'].includes(this.state))return;this.emit('error',{error:e.message||'La subida se interrumpió. Puedes reanudarla.'});this.reject(e);}
   });
   const previous=await this.tus.findPreviousUploads();const selected=previous.find(x=>x.metadata?.objectName===this.record.object_path);if(selected)this.tus.resumeFromPreviousUpload(selected);
   this.emit('uploading');this.tus.start();
  }catch(e){if(this.state!=='cancelled'){this.emit('error',{error:e.message});this.reject(e);}}
 }
 async pause(){if(!this.tus||this.state!=='uploading')return;this.emit('paused');await this.tus.abort(false);}
 async resume(){if(!this.tus){this.state='waiting';return this.start();}if(!['paused','error'].includes(this.state))return;try{const d=await request('upload_renew',{id:this.record.id});this.grant=d.upload;this.emit('uploading');this.tus.start();}catch(e){this.emit('error',{error:e.message});}}
 async cancel(){if(['complete','cancelled','verifying'].includes(this.state))return;this.emit('cancelled');if(this.tus)await this.tus.abort(false);if(this.record)await request('cancel',{id:this.record.id});this.reject(Error('Subida cancelada.'));}
}
export async function upload(file,options={}){const named=file.name?file:new File([file],options.name||'archivo.webp',{type:file.type});const task=new ManagedUpload(named,options);task.start();return task.done;}
export function installStorage(client){
 if(client.__uhzUploadsInstalled)return;client.__uhzUploadsInstalled=true;const from=client.storage.from.bind(client.storage),aliases=new Map();
 client.storage.from=function(bucket){const storage=from(bucket);if(bucket!=='uhz-public')return storage;
  storage.upload=async(path,file,options={})=>{try{const result=await upload(file,{bucket,purpose:String(path).startsWith('shop/')?'product':'ad',onChange:t=>{const el=document.getElementById('productEditorState');if(el&&['preparing','uploading','verifying'].includes(t.state))el.textContent=t.state==='preparing'?'Optimizando la imagen…':t.state==='verifying'?'Comprobando el archivo…':'Subiendo imagen · '+t.percent+' %';}});aliases.set(path,result);return {data:{path:result.object_path,fullPath:bucket+'/'+result.object_path},error:null};}catch(e){return {data:null,error:{message:e.message}}}};
  storage.getPublicUrl=path=>({data:{publicUrl:aliases.get(path)?.url||'https://univershzrw.com/_uhz/public-media/uhz-public/'+String(path).split('/').map(encodeURIComponent).join('/')}});return storage;
 };
}
window.UHZUploads={request,ManagedUpload,upload,optimize,installStorage};
