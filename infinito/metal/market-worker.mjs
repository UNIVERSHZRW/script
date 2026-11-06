const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
function respond(x,status=200){return new Response(JSON.stringify(x),{status,headers:HEADERS})}
function fail(msg,status=400){throw Object.assign(Error(msg),{status})}
function hex(arr){return Array.from(arr).map(x=>x.toString(16).padStart(2,"0")).join("")}
function validSerial(x){const s=String(x||"").trim().toUpperCase();return /^UHZ-INFT-[A-F0-9]{20}$/.test(s)?s:null}
async function proofHash(code){return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(code))))}
async function body(req){if((req.headers.get("content-type")||"").split(";")[0]!=="application/json")fail("Formato JSON requerido.",415);if(Number(req.headers.get("content-length")||0)>1800)fail("Solicitud demasiado larga.",413);const t=await req.text();if(t.length>1800)fail("Solicitud demasiado larga.",413);try{const x=JSON.parse(t);if(!x||typeof x!=="object"||Array.isArray(x))fail("Formato incorrecto.");return x}catch{fail("JSON inválido.")}}
async function user(req,env){if(!env.AUTH_APP)fail("Sistema de cuentas no disponible.",503);const cookie=req.headers.get("cookie")||"";if(!cookie)return null;const r=await env.AUTH_APP.fetch(new Request("https://univershzrw.com/backend/auth/v1/user",{headers:{cookie},method:"GET"}));if(!r.ok)return null;const d=await r.json().catch(()=>null);if(!d?.id||!d.email_confirmed_at||d.must_change_password)return null;return d}
async function sample(db){
 const m=await db.prepare("SELECT COALESCE(SUM(CASE WHEN kind='buy' THEN inft_milli ELSE 0 END),0) buy, COALESCE(SUM(CASE WHEN kind='sell' THEN inft_milli ELSE 0 END),0) sell FROM history").first();
 const slot=Math.floor(Date.now()/300000),index_bps=Math.max(1000,Math.min(30000,10000+Math.round((Number(m.buy||0)-Number(m.sell||0))/100)));
 const w=await db.prepare("SELECT COUNT(*) n FROM wallets").first();
 await db.prepare("INSERT OR IGNORE INTO inft_market_snapshots(slot,index_bps,buys_milli,sells_milli,inft_users) VALUES(?,?,?,?,?)").bind(slot,index_bps,Number(m.buy||0),Number(m.sell||0),Number(w.n||0)).run();
 return {slot,index_bps,buys_milli:m.buy,sells_milli:m.sell};
}
async function market(db,period){
 const options={day:[288,1],week:[2016,6],month:[8640,24]},[back,stride]=options[period]||options.day;
 const current=await sample(db);
 const t=await db.prepare("SELECT s.slot,s.captured_at,s.index_bps FROM inft_market_snapshots s JOIN (SELECT MAX(slot) slot FROM inft_market_snapshots WHERE slot>=? GROUP BY CAST(slot/? AS INTEGER)) b ON b.slot=s.slot ORDER BY s.slot ASC LIMIT 750").bind(current.slot-back,stride).all();
 const comparisons={};for(const [key,slots] of Object.entries({day:288,week:2016,month:8640})){const old=await db.prepare("SELECT index_bps FROM inft_market_snapshots WHERE slot<=? ORDER BY slot DESC LIMIT 1").bind(current.slot-slots).first();comparisons[key]=old?{percentage:Math.round((current.index_bps/old.index_bps-1)*10000)/100}:null}
 return respond({ok:true,label:"Índice de actividad INFT-TEST",currency:"PUNTOS",market_price_mxn:null,live_trading:false,real_issued_units:0,current,series:t.results||[],comparisons,period,updated_at:new Date().toISOString(),refresh_seconds:30,method:"Base 100. Se mueve por compras y ventas verificadas de prueba; no es precio, rendimiento de inversión ni cotización.",history_policy:"No se inventa historial de fechas anteriores."});
}
async function stats(db){
 const c=await db.prepare("SELECT COUNT(*) registered,COALESCE(SUM(CASE WHEN status='reserved' THEN 1 ELSE 0 END),0) reserved,COALESCE(SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END),0) cancelled FROM inft_physical_certificates").first();
 return respond({ok:true,edition:"UHZ INFINITO LAB 2026",edition_limit_demo:1000,registered:Number(c.registered||0),reserved:Number(c.reserved||0),cancelled:Number(c.cancelled||0),physically_manufactured_verified:0,real_token_minted:0,value_per_demo_certificate_milli:1000});
}
function vectorSvg(face,serial){
 const front=face==="anverso",value=String(serial||"UHZ-INFT-PROTOTIPO").replace(/[^A-Z0-9-]/g,"").slice(0,34);
 const t=(y,size,str,w=700)=>'<text x="190" y="'+y+'" font-size="'+size+'" font-weight="'+w+'" text-anchor="middle">'+str+'</text>';
 let ticks="";for(let i=0;i<80;i++){const a=i*Math.PI/40;ticks+='<line x1="'+(190+173*Math.cos(a)).toFixed(2)+'" y1="'+(190+173*Math.sin(a)).toFixed(2)+'" x2="'+(190+181*Math.cos(a)).toFixed(2)+'" y2="'+(190+181*Math.sin(a)).toFixed(2)+'"/>'}
 const words=front?t(97,23,"UNIVERSHZRW",800)+t(223,155,"∞",800)+t(283,27,"INFINITO",800)+t(310,17,"1 INFT")+t(344,11,"DONDE TODO ES POSIBLE"):t(94,20,"SELLO ∞ UNIVERSHZRW",800)+t(152,19,"EDICIÓN DE PRUEBA")+t(208,32,"1 INFT-TEST",800)+t(246,13,"SIN VALOR MONETARIO REAL")+t(277,11,value)+t(311,11,"univershzrw.com/criptomoneda");
 return '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="38mm" height="38mm" viewBox="0 0 380 380"><title>Troquel de referencia INFINITO '+face+'</title><g fill="none" stroke="#000"><circle cx="190" cy="190" r="188" stroke-width="1"/><circle cx="190" cy="190" r="182" stroke-width="3"/><circle cx="190" cy="190" r="165" stroke-width="1.3"/><circle cx="190" cy="190" r="157" stroke-width=".6"/>'+ticks+'</g><g fill="#000" font-family="Arial,Helvetica,sans-serif">'+words+'</g></svg>';
}
export default {
 async scheduled(event,env){if(env.INFINITO_DB)await sample(env.INFINITO_DB)},
 async fetch(req,env){
  const url=new URL(req.url),path=url.pathname.replace(/\/$/,"");
  if(url.hostname==="www.univershzrw.com"&&["GET","HEAD"].includes(req.method))return Response.redirect("https://univershzrw.com"+url.pathname+url.search,308);
  if(path.startsWith("/criptomoneda/troquel/")){
   const side=path.endsWith("/anverso.svg")?"anverso":path.endsWith("/reverso.svg")?"reverso":null;
   if(!side||!["GET","HEAD"].includes(req.method))return respond({ok:false,error:"Recurso no encontrado."},404);
   const s=validSerial(url.searchParams.get("serie"))||"UHZ-INFT-PROTOTIPO";
   return new Response(req.method==="HEAD"?null:vectorSvg(side,s),{headers:{"content-type":"image/svg+xml; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","content-disposition":"attachment; filename=infinito-"+side+".svg"}});
  }
  if(!path.startsWith("/criptomoneda/mercado/"))return respond({ok:false,error:"Ruta inexistente."},404);
  if(!env.INFINITO_DB)return respond({ok:false,error:"Base de laboratorio no disponible."},503);
  const action=path.slice("/criptomoneda/mercado/".length),db=env.INFINITO_DB;
  try{
   if(req.method==="GET"&&action==="index")return market(db,["day","week","month"].includes(url.searchParams.get("period"))?url.searchParams.get("period"):"day");
   if(req.method==="GET"&&action==="stats")return stats(db);
   if(req.method==="GET"&&action==="public"){
    const serial=validSerial(url.searchParams.get("serie"));if(!serial)fail("Serie incorrecta.");
    const row=await db.prepare("SELECT serial,status,value_milli,created_at FROM inft_physical_certificates WHERE serial=?").bind(serial).first();
    return respond({ok:true,found:!!row,certificate:row||null,physically_minted:false,is_demo:true});
   }
   if(req.method==="POST"&&req.headers.get("origin")!==url.origin)fail("Origen no autorizado.",403);
   if(req.method==="POST"&&action==="verify"){
    const d=await body(req),s=validSerial(d.serial),p=String(d.proof||"").trim().toLowerCase();
    if(!s||!/^[a-f0-9]{32}$/.test(p))fail("Serie y código privado inválidos.");
    const row=await db.prepare("SELECT serial,status,value_milli FROM inft_physical_certificates WHERE serial=? AND proof_hash=?").bind(s,await proofHash(p)).first();
    return respond({ok:true,valid_demo:!!row&&row.status==="reserved",certificate:row||null,real_physical_metal:false,message:row&&row.status==="reserved"?"Certificado digital válido en laboratorio, sin metal confirmado.":"Código inválido o reserva cancelada."});
   }
   if(!["GET","POST"].includes(req.method))return respond({ok:false,error:"Método no permitido."},405);
   const u=await user(req,env);if(!u)return respond({ok:false,error:"Inicia sesión con tu cuenta UNIVERSHZRW."},401);
   if(req.method==="GET"&&action==="mine"){
    const a=await db.prepare("SELECT serial,status,value_milli,created_at FROM inft_physical_certificates WHERE user_id=? ORDER BY created_at DESC LIMIT 30").bind(u.id).all();
    return respond({ok:true,items:a.results||[]});
   }
   if(req.method!=="POST")return respond({ok:false,error:"Operación no permitida."},405);
   const d=await body(req);
   if(action==="reserve"){
    if(!/^[a-f0-9-]{36}$/i.test(String(d.nonce||"")))fail("Identificador de solicitud inválido.");
    const serial="UHZ-INFT-"+hex(crypto.getRandomValues(new Uint8Array(10))).toUpperCase(),secret=hex(crypto.getRandomValues(new Uint8Array(16)));
    try{await db.prepare("INSERT INTO inft_physical_certificates(serial,user_id,proof_hash,value_milli,status,nonce) VALUES(?,?,?,1000,'reserved',?)").bind(serial,u.id,await proofHash(secret),d.nonce).run()}
    catch(e){const m=String(e?.message||"");
     if(m.includes("insufficient_inft"))fail("Debes tener al menos 1 INFT-TEST disponible.",409);
     if(m.includes("user_certificate_limit"))fail("Máximo 10 reservas de prueba por cuenta.",409);
     if(m.includes("edition_certificate_limit"))fail("Cupo de 1,000 certificados de prueba agotado.",409);
     if(m.includes("UNIQUE"))fail("Solicitud repetida, no se duplicó el descuento.",409);
     fail("No se pudo registrar esta reserva.",503);
    }
    return respond({ok:true,serial,proof:secret,value_milli:1000,manufactured_real:false,message:"Reservado 1 certificado digital de prueba por 1 INFT-TEST. El código privado solo se muestra una vez."});
   }
   if(action==="cancel"){
    const s=validSerial(d.serial);if(!s)fail("Serie inválida.");
    const q=await db.prepare("UPDATE inft_physical_certificates SET status='cancelled',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE serial=? AND user_id=? AND status='reserved'").bind(s,u.id).run();
    if(!q.meta?.changes)fail("No se encontró una reserva activa a tu nombre.",404);
    return respond({ok:true,serial:s,message:"Reserva de prueba cancelada. Se devolvió 1 INFT-TEST."});
   }
   return respond({ok:false,error:"Función no encontrada."},404);
  }catch(e){return respond({ok:false,error:e?.status?String(e.message):"Servicio de pruebas temporalmente indisponible."},e?.status||503)}
 }
};