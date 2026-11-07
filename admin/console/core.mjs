export const OWNER_EMAIL='univershzrw@gmail.com';
export const MIME_EXT={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','application/pdf':'pdf','video/mp4':'mp4'};
export function fileType(b){
 if(b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';
 if(b[0]===137&&String.fromCharCode(...b.slice(1,4))==='PNG'&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10)return 'image/png';
 const t=(a,z)=>String.fromCharCode(...b.slice(a,z));
 if(t(0,4)==='RIFF'&&t(8,12)==='WEBP')return 'image/webp';
 if(['GIF87a','GIF89a'].includes(t(0,6)))return 'image/gif';
 if(t(0,5)==='%PDF-')return 'application/pdf';
 if(t(4,8)==='ftyp')return 'video/mp4';return '';
}
export function normalizeUpload(p){
 const mime=String(p.mime||'');if(!MIME_EXT[mime])throw Error('Usa JPG, PNG, WebP, GIF, PDF o MP4.');
 const name=String(p.name||'').normalize('NFC').replace(/[\x00-\x1f\x7f/\\]/g,'').trim();
 if(!name||name.length>180||!Number.isSafeInteger(p.size)||p.size<=0||p.size>20971520)throw Error('Revisa el nombre y el tamaño del archivo.');
 if(!['uhz-public','uhz-private'].includes(p.bucket)||!['content','product','ad','document'].includes(p.purpose)||!/^[0-9a-f]{64}$/.test(p.sha256||''))throw Error('Datos de subida inválidos.');
 return {name,mime,size:p.size,bucket:p.bucket,purpose:p.purpose,sha256:p.sha256,request_key:p.request_key,ext:MIME_EXT[mime]};
}
export const publicAssetURL=f=>f.bucket==='uhz-public'?'https://univershzrw.com/_uhz/admin-files/'+f.id:null;
