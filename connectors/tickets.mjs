const encoder=new TextEncoder(),decoder=new TextDecoder();
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function unb64(s){if(!/^[A-Za-z0-9_-]+$/.test(s)||s.length>12000)throw Error('invalid_ticket');return Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}
async function key(secret){if(!secret||secret.length<24)throw Error('media_not_configured');const digest=await crypto.subtle.digest('SHA-256',encoder.encode('univershzrw-media-capability-v1\0'+secret));return crypto.subtle.importKey('raw',digest,'AES-GCM',false,['encrypt','decrypt']);}
export async function seal(payload,secret,now=Date.now()){
 const iv=crypto.getRandomValues(new Uint8Array(12)),bytes=encoder.encode(JSON.stringify({...payload,v:1,iat:now,exp:now+15*60*1000})),encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode('uhz-media-v1')},await key(secret),bytes));
 return b64(iv)+'.'+b64(encrypted);
}
export async function unseal(ticket,secret,audience,now=Date.now()){
 try{const parts=ticket.split('.');if(parts.length!==2)throw Error();const iv=unb64(parts[0]);if(iv.length!==12)throw Error();const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode('uhz-media-v1')},await key(secret),unb64(parts[1]));const data=JSON.parse(decoder.decode(raw));if(data.v!==1||data.aud!==audience||data.exp<=now||data.iat>now+30000||data.exp-data.iat>900000)throw Error();return data;}catch{throw Object.assign(Error('El enlace caducó. Abre de nuevo el contenido desde su ficha.'),{status:410});}
}
