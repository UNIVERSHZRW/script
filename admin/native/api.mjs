export const OWNER='univershzrw@gmail.com';
const backend='/_uhz/portal/backend',admin='/_uhz/admin-api';
export async function request(path,{method='GET',data,headers={},signal}={}){
 const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{...(data===undefined?{}:{'content-type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data),signal});
 const text=await response.text();let body;try{body=text?JSON.parse(text):null;}catch{body=null;}
 if(!response.ok)throw Object.assign(Error(body?.message||body?.error||'No se pudo completar la solicitud. Vuelve a intentar.'),{status:response.status,code:body?.code});
 return {data:body,total:parseCount(response.headers.get('content-range'))};
}
export function parseCount(range){if(!range)return null;const n=range.split('/')[1];return /^\d+$/.test(n||'')?Number(n):null;}
export const auth=(action,data)=>request(backend+'/auth/v1/'+action,{method:data===undefined?'GET':'POST',data}).then(x=>x.data);
export const rpc=(name,data={},administrative=false)=>request((administrative?admin:backend)+'/rest/v1/rpc/'+name,{method:'POST',data}).then(x=>x.data);
export const fn=(name,data)=>request(backend+'/functions/v1/'+name,{method:'POST',data}).then(x=>x.data);
export const control=(action,payload={})=>fn('uhz-admin-control',{action,payload});
export const finance=(action,payload={})=>fn('uhz-inft-wallet',{action,payload});
export const guardian=(action,data)=>request(admin+'/guardian/'+action,{method:data?'POST':'GET',data}).then(x=>x.data);
export function safeSearch(value){return String(value).replace(/[^\p{L}\p{N}\s@_-]/gu,' ').trim().slice(0,100);}
export function listQuery({order='updated_at',ascending=false,page=0,size=30,search='',searchColumns=[],filter}={}){
 const q=new URLSearchParams({select:'*',order:order+'.'+(ascending?'asc':'desc')+'.nullslast',offset:String(page*size),limit:String(size)});
 const term=safeSearch(search);if(term&&searchColumns.length)q.set('or','('+searchColumns.map(c=>c+'.ilike.*'+term+'*').join(',')+')');
 if(filter?.field&&filter.value)q.set(filter.field,'eq.'+filter.value);return q.toString();
}
export const list=(table,options={})=>request(admin+'/rest/v1/'+table+'?'+listQuery(options),{headers:{Prefer:'count=exact'},signal:options.signal});
export function recordKey(table,row){const key=['site_config','shop_config','ad_config'].includes(table)?'key':table==='integration_status'?'integration':row.id!=null?'id':row.folio!=null?'folio':row.legacy_id!=null?'legacy_id':null;if(!key||row[key]==null)throw Error('Este registro no tiene una referencia de edición.');return {key,value:row[key]};}
export const save=async(table,record,data)=>{const q=record?new URLSearchParams({[recordKey(table,record).key]:'eq.'+recordKey(table,record).value}):null;const r=await request(admin+'/rest/v1/'+table+(q?'?'+q:''),{method:record?'PATCH':'POST',data,headers:{Prefer:'return=representation'}});if(!Array.isArray(r.data)||!r.data.length)throw Error('El servidor no confirmó el guardado. Actualiza el registro.');return r.data[0];};
export async function importBatch(table,rows,onConflict){const q=new URLSearchParams();if(onConflict)q.set('on_conflict',onConflict);return request(admin+'/rest/v1/'+table+'?'+q,{method:'POST',data:rows,headers:{Prefer:'resolution=merge-duplicates,return=representation'}});}
export function safeURL(value,{download=false}={}){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;if(download&&!['kgqkszlennwhlyngktcc.supabase.co','kgqkszlennwhlyngktcc.storage.supabase.co','admin.univershzrw.com'].includes(u.hostname))return null;return u.href;}catch{return null;}}
export function openDownload(value){const url=safeURL(value,{download:true});if(!url)throw Error('El enlace de descarga no está autorizado.');const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.click();}
export function csvCell(value){let text=typeof value==='object'&&value!==null?JSON.stringify(value):String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function exportCSV(rows,columns,name){const text='\uFEFF'+[columns.map(c=>csvCell(c[1])).join(','),...rows.map(r=>columns.map(c=>csvCell(r[c[0]])).join(','))].join('\r\n');const u=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
