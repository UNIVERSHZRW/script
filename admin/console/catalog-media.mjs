async function catalogMedia(req,env){
 try{
  const u=new URL(req.url),key=u.pathname.split('/').pop();
  const rpc=async(action,payload,access)=>{const r=await supabaseFetch('/rest/v1/rpc/uhz_catalog_media',{method:'POST',headers:{'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{})},body:JSON.stringify({p_action:action,p_payload:payload})});const d=await r.json();if(!r.ok)throw Error(d.message||'No se pudo registrar la imagen.');return d;};
  if(req.method==='GET'&&/^[0-9a-f-]{36}\.webp$/.test(key)){
   const check=await rpc('public_read',{key});let owner=null;
   if(!check.ok){const s=await sessionFor(req);if(!ownerUser(s.u))return apiResponse({message:'Imagen no disponible'},404);owner=s;}
   let obj;if(env.COMMUNITY_IMAGES)obj=await env.COMMUNITY_IMAGES.get('catalog/'+key);
   if(!obj){const stored=await supabaseFetch('/storage/v1/object/public/uhz-public/catalog/'+key,{method:'GET'});if(stored.ok)obj={body:stored.body};}
   if(!obj)return apiResponse({message:'Imagen no disponible'},404);
   const h=new Headers({'Content-Type':'image/webp','Cache-Control':owner?'private,no-store':'public,max-age=300','X-Content-Type-Options':'nosniff','Vary':'Cookie'});for(const c of owner?.cookies||[])h.append('Set-Cookie',c);
   return new Response(obj.body,{headers:h});
  }
  if(req.method!=='POST'||!trustedWrite(req)||!isAdminHost(req))return apiResponse({message:'Solo administración'},403);
  const session=await sessionFor(req);if(!ownerUser(session.u))return apiResponse({message:'Inicia sesión con la cuenta propietaria.'},401);
  await limited(env.WRITE_LIMIT||env.API_LIMIT,'catalog-media:'+session.u.id);
  if(key==='cleanup'){
   const input=await jsonBody(req,12000),d=await rpc('cleanup',input,session.access);let deleted=0;
   for(const k of d.keys||[]){if(!/^[0-9a-f-]{36}\.webp$/.test(k))continue;if(env.COMMUNITY_IMAGES)await env.COMMUNITY_IMAGES.delete('catalog/'+k);
    const r=await supabaseFetch('/storage/v1/object/uhz-public',{method:'DELETE',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access},body:JSON.stringify({prefixes:['catalog/'+k]})});
    if(!r.ok&&r.status!==404)continue;await rpc('deleted',{key:k},session.access);deleted++;
   }return apiResponse({ok:true,deleted},200,session.cookies);
  }
  if(req.headers.get('content-type')!=='image/webp')return apiResponse({message:'Usa WebP'},415);
  const data=await boundedBody(req,307200),view=new DataView(data.buffer,data.byteOffset,data.byteLength),text=(o,n)=>String.fromCharCode(...data.slice(o,o+n));
  if(data.length<30||text(0,4)!=='RIFF'||text(8,4)!=='WEBP'||view.getUint32(4,true)+8!==data.length)return apiResponse({message:'WebP inválido'},415);
  let width=0,height=0;
  for(let o=12;o+8<data.length;){const type=text(o,4),len=view.getUint32(o+4,true),p=o+8;if(p+len>data.length)break;
   if(type==='VP8 '&&len>=10&&text(p+3,3)==='\x9d\x01\x2a'){width=view.getUint16(p+6,true)&16383;height=view.getUint16(p+8,true)&16383;break;}
   if(type==='VP8L'&&len>=5&&data[p]===47){const b=view.getUint32(p+1,true);width=(b&16383)+1;height=((b>>>14)&16383)+1;break;}
   if(type==='VP8X'&&len>=10){if(data[p]&2)return apiResponse({message:'No se permiten imágenes animadas'},415);width=1+data[p+4]+256*data[p+5]+65536*data[p+6];height=1+data[p+7]+256*data[p+8]+65536*data[p+9];}o=p+len+(len%2);
  }
  if(!width||!height||width>1600||height>1600)return apiResponse({message:'Dimensiones máximas: 1600 × 1600'},400);
  const name=crypto.randomUUID()+'.webp';await rpc('reserve',{key:name,bytes:data.length,width,height},session.access);
  const uploaded=await supabaseFetch('/storage/v1/object/uhz-public/catalog/'+name,{method:'POST',headers:{Authorization:'Bearer '+session.access,'Content-Type':'image/webp','x-upsert':'false'},body:data});
  if(!uploaded.ok)throw Error('El almacenamiento no confirmó la imagen.');
  const confirmed=await rpc('confirm',{key:name},session.access);if(!confirmed.ok)throw Error('No se pudo confirmar la imagen.');
  return apiResponse({ok:true,url:'https://univershzrw.com/_uhz/catalog-images/'+name,bytes:data.length,width,height},200,session.cookies);
 }catch(e){return apiResponse({message:e.status?e.message:'No se pudo guardar la imagen. Revisa la cuota y vuelve a intentar.'},e.status||503);}
}
