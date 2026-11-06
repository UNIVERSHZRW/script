"use strict";
const root="/criptomoneda/terminal/api/"; const $=id=>document.getElementById(id); let current=null; let working=false;
const names={faucet:"Saldo inicial",send:"Envío",buy:"Compra simulada",sell:"Venta simulada",physical:"Canje demo"};
function money(n){return (Number(n||0)/1000).toLocaleString("es-MX",{minimumFractionDigits:3,maximumFractionDigits:3})}
function stamp(s){try{return new Date(s).toLocaleString("es-MX",{dateStyle:"short",timeStyle:"short"})}catch{return "—"}}
function toast(msg,bad){const t=$("toast");t.textContent=msg;t.style.borderColor=bad?"#e7a39c":"#dec180";t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,5000)}
async function api(action,data){const opts={credentials:"same-origin",cache:"no-store",headers:{accept:"application/json"}};if(data!==undefined){opts.method="POST";opts.headers["content-type"]="application/json";opts.body=JSON.stringify(Object.assign({},data,{nonce:crypto.randomUUID()}))}const r=await fetch(root+action,opts);const x=await r.json().catch(()=>({ok:false,error:"El servidor devolvió una respuesta inesperada."}));if(!r.ok||!x.ok)throw Error(x.error||x.message||"No se pudo completar la operación.");return x}
function elem(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e}
function setDisabled(auth){document.querySelectorAll("#swapForm button[type=submit],#sendForm button[type=submit]").forEach(b=>b.disabled=!auth);$("copy").disabled=!auth;const f=$("faucet");f.disabled=!auth||!!current?.claimed}
function renderHistory(rows){const body=$("explorerRows");body.replaceChildren();if(!rows||!rows.length){const tr=elem("tr");const td=elem("td","No existen movimientos todavía. Prueba la asignación de saldo.","empty");td.colSpan=5;tr.append(td);body.append(tr);return}for(const x of rows){const tr=elem("tr"),from=x.from_address||"Sistema de pruebas",to=x.to_address||"—";let val=money(x.inft_milli)+" INFT";const cells=[names[x.kind]||x.kind,from+" → "+to,val,stamp(x.created_at),(x.id||"").slice(0,18)+"…"];cells.forEach((v,i)=>{const td=elem("td",v,i===0?"kind":i===4?"txid":"");tr.append(td)});body.append(tr)}}
function renderState(s){current=s.wallet||null;const ok=!!s.authenticated;$("sessionState").textContent=ok?"Cuenta verificada":"Sin sesión";$("loginAlert").hidden=ok;$("inftBalance").textContent=ok?money(s.wallet.inft_milli):"—";$("coinsBalance").textContent=ok?Number(s.wallet.test_coins).toLocaleString("es-MX"):"—";$("address").textContent=ok?s.wallet.address:"Inicia sesión";$("faucetStatus").textContent=!ok?"Requiere inicio de sesión.":s.claimed?"Asignación inicial ya utilizada.":"Disponible: 100 INFT-TEST y 1,000 Coins-TEST.";current=ok?Object.assign({},s.wallet,{claimed:s.claimed}):null;setDisabled(ok);document.getElementById('inftReserveCertificate').disabled=!ok||s.wallet.inft_milli<1000;}
async function refresh(){try{const results=await Promise.all([api("state"),api("explorer"),api("parameters")]);renderState(results[0]);void refreshCertificates();renderHistory(results[1].events);renderParameters(results[2]);$("connection").textContent="Servicio de pruebas conectado"}catch(e){$("connection").textContent="Servicio no disponible";toast(e.message,true)}}
async function execute(action,data,done){if(working)return;working=true;document.querySelectorAll("form button[type=submit],#faucet").forEach(x=>x.disabled=true);try{const result=await api(action,data);toast(result.message||"Operación de prueba registrada.");if(done)done();await refresh()}catch(e){toast(e.message,true);await refresh().catch(()=>{})}finally{working=false}}
$("copy").addEventListener("click",async()=>{if(!current)return;try{await navigator.clipboard.writeText(current.address);toast("Dirección de prueba copiada.")}catch{toast("Copia manualmente la dirección.",true)}});
$("copyCode").addEventListener("click",async()=>{try{await navigator.clipboard.writeText("INFT-DEMO-2026");toast("Código de demostración copiado.")}catch{toast("Copia manualmente el código.",true)}});
$("faucet").addEventListener("click",()=>execute("faucet",{}));
$("swapCoins").addEventListener("input",quote);$("direction").addEventListener("change",quote);
function quote(){const n=Number($("swapCoins").value);$("swapQuote").textContent=Number.isFinite(n)&&n>=0?money(n*100)+" INFT-TEST":"—"}
$("swapForm").addEventListener("submit",e=>{e.preventDefault();const coins=Number($("swapCoins").value),direction=$("direction").value;if(!Number.isInteger(coins)||coins<10||coins>1000||coins%10){toast("Elige múltiplos de 10 Coins-TEST entre 10 y 1,000.",true);return}execute("swap",{direction,coins})});
$("sendForm").addEventListener("submit",e=>{e.preventDefault();const recipient=$("recipient").value.trim().toUpperCase(),amount=$("sendAmount").value.trim();if(!/^INFT-[A-F0-9]{12}$/.test(recipient)){toast("La dirección INFT del destinatario no tiene el formato correcto.",true);return}if(!confirm("¿Confirmas enviar "+amount+" INFT-TEST a "+recipient+"? Esto solo mueve saldo de prueba."))return;execute("send",{recipient,amount},()=>{$("sendAmount").value="";$("recipient").value=""})});
$("refresh").addEventListener("click",refresh);quote();refresh();
function renderParameters(d){
 const m=d.metrics||{};
 $("labCirculation").textContent=Number(m.circulating_milli||0).toLocaleString("es-MX",{maximumFractionDigits:0})==="NaN"?"—":money(m.circulating_milli)+" INFT-TEST";
 $("labWallets").textContent=Number(m.wallets||0).toLocaleString("es-MX");
 $("labOperations").textContent=Number(m.operations||0).toLocaleString("es-MX");
 $("labVolume").textContent=money(m.sent_milli_24h)+" INFT-TEST";
}
$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const btn=$("loginSubmit");btn.disabled=true;btn.textContent="Verificando acceso…";
 try{
  const email=$("loginEmail").value.trim(),password=$("loginPassword").value;
  const v=await api("login",{email,password});
  if(!v.ok)throw Error(v.error||"No se pudo iniciar sesión.");
  $("loginPassword").value="";
  window.location.reload();
 }catch(e){toast(e.message||"No se pudo iniciar sesión.",true)}
 finally{btn.disabled=false;btn.textContent="Iniciar sesión en UNIVERSHZRW"}
});
window.addEventListener("focus",()=>{if(!document.hidden)refresh().catch(()=>{})});

/* INFINITO · análisis observado de operaciones de prueba */
const INFT_API="/criptomoneda/mercado/";
let marketPeriod="day",issuedProof="",issuedSerial="",coinRotationY=0,coinRotationX=-10,spinTimer=null;
async function marketCall(path,payload){
 const opts={credentials:"same-origin",cache:"no-store",headers:{"accept":"application/json"}};
 if(payload!==undefined){opts.method="POST";opts.headers["content-type"]="application/json";opts.body=JSON.stringify(payload)}
 const r=await fetch(INFT_API+path,opts),j=await r.json().catch(()=>({error:"Respuesta no válida."}));
 if(!r.ok||!j.ok)throw Error(j.error||"No se completó la operación.");
 return j;
}
const fmtIndex=n=>(Number(n)/100).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
function renderChange(id,change){const e=$(id);if(!change){e.textContent="Sin historial previo";e.className="";return}const n=Number(change.percentage);e.textContent=(n>0?"+":"")+n.toFixed(2)+" %";e.className="inft-diff "+(n>0?"up":n<0?"down":"")}
function svgNode(tag,attr,content){const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attr||{}))e.setAttribute(k,String(v));if(content!==undefined)e.textContent=content;return e}
function plotIndex(series,current){
 const svg=$("inftChart");svg.replaceChildren();
 const list=(series||[]).map(s=>({time:Number(s.slot),value:Number(s.index_bps)/100}));
 if(!list.length||list[list.length-1].time!==Number(current.slot))list.push({time:Number(current.slot),value:Number(current.index_bps)/100});
 else list[list.length-1].value=Number(current.index_bps)/100;
 let lo=Math.min(...list.map(x=>x.value)),hi=Math.max(...list.map(x=>x.value));
 if(hi===lo){lo-=.4;hi+=.4}else{const pad=(hi-lo)*.18;lo-=pad;hi+=pad}
 const start=list[0],end=list[list.length-1],x=v=>48+(v-start.time)/Math.max(1,end.time-start.time)*690,y=v=>238-(v-lo)/(hi-lo)*197;
 for(let i=0;i<=4;i++){let pos=41+i*49.25;svg.append(svgNode("line",{x1:48,y1:pos,x2:740,y2:pos,stroke:"currentColor","stroke-opacity":".12"}));svg.append(svgNode("text",{x:39,y:pos+4,"text-anchor":"end",fill:"currentColor",opacity:".65","font-size":11},(hi-(hi-lo)*i/4).toFixed(1)))}
 let color=end.value>=start.value?"#219b81":"#c05c64";
 if(list.length>1){
  const path=list.map((v,i)=>(i?"L":"M")+x(v.time).toFixed(2)+","+y(v.value).toFixed(2)).join(" ");
  svg.append(svgNode("path",{d:path+" L"+x(end.time)+",238 L"+x(start.time)+",238 Z",fill:color,"fill-opacity":".07"}));
  svg.append(svgNode("path",{d:path,stroke:color,"stroke-width":3,fill:"none","stroke-linecap":"round","stroke-linejoin":"round"}));
 }
 svg.append(svgNode("circle",{cx:x(end.time),cy:y(end.value),r:6,fill:color,stroke:"#fff","stroke-width":2}));
 const date=v=>new Date(v*300000).toLocaleString("es-MX",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
 svg.append(svgNode("text",{x:48,y:271,fill:"currentColor","font-size":11,opacity:".7"},date(start.time)));
 svg.append(svgNode("text",{x:740,y:271,"text-anchor":"end",fill:"currentColor","font-size":11,opacity:".7"},date(end.time)));
 $("inftChartNote").textContent=list.length<2?"Primera medición. No hay datos suficientes para trazar cambios anteriores.":list.length+" mediciones observadas, no generadas artificialmente. Se registran cada cinco minutos.";
}
async function refreshInftMarket(){
 try{
  const d=await marketCall("index?period="+marketPeriod);
  $("inftIndexValue").textContent=fmtIndex(d.current.index_bps);
  $("inftDemandBuy").textContent=money(d.current.buys_milli)+" INFT-TEST";
  $("inftDemandSell").textContent=money(d.current.sells_milli)+" INFT-TEST";
  $("inftMarketUpdated").textContent="Actualizado "+new Date(d.updated_at).toLocaleTimeString("es-MX")+" · Índice no monetario";
  $("inftMarketConnection").textContent="En vivo · 30 s";
  renderChange("inftDiffDay",d.comparisons.day);renderChange("inftDiffWeek",d.comparisons.week);renderChange("inftDiffMonth",d.comparisons.month);
  const last=d.series?.at(-1)?.index_bps??d.current.index_bps;
  const delta=(Number(d.current.index_bps)-Number(last))/100,t=$("inftIndexDelta");
  t.textContent=(delta>0?"+":"")+delta.toFixed(2)+" desde el último registro";
  t.className="inft-market-change "+(delta>0?"up":delta<0?"down":"");
  plotIndex(d.series,d.current);
 }catch(e){$("inftMarketConnection").textContent="Sin conexión";$("inftChartNote").textContent=e.message}
}
async function refreshMintStats(){
 try{const s=await marketCall("stats");$("inftPhysicalReserved").textContent=Number(s.reserved).toLocaleString("es-MX");$("inftPhysicalMinted").textContent=Number(s.physically_manufactured_verified)}catch{$("inftPhysicalReserved").textContent="—"}
}
async function refreshCertificates(){
 const el=$("inftMyCertificates");el.replaceChildren();
 if(!current){el.textContent="Inicia sesión para consultar tus reservas.";return}
 try{
  const d=await marketCall("mine");
  if(!d.items.length){el.textContent="Aún no tienes reservas digitales.";return}
  for(const item of d.items){
   const row=elem("div",null,"inft-cert-row"),left=elem("div"),id=elem("code",item.serial),state=elem("small",item.status==="reserved"?"1 INFT-TEST apartado":"Cancelada; saldo recuperado");
   left.append(id,state);row.append(left);
   const link=elem("a","SVG");link.href="/criptomoneda/troquel/reverso.svg?serie="+encodeURIComponent(item.serial);link.style.color="var(--gold)";link.title="Descargar reverso con serie";row.append(link);
   if(item.status==="reserved"){
    const cancel=elem("button","Cancelar");cancel.type="button";
    cancel.addEventListener("click",async()=>{if(!confirm("Cancelar "+item.serial+" y devolver 1 INFT-TEST a la cartera?"))return;cancel.disabled=true;try{const r=await marketCall("cancel",{serial:item.serial});toast(r.message);await Promise.all([refresh(),refreshCertificates(),refreshMintStats()])}catch(e){toast(e.message,true);cancel.disabled=false}});
    row.append(cancel);
   }
   el.append(row);
  }
 }catch(e){el.textContent=e.message}
}
$("inftReserveCertificate").addEventListener("click",async()=>{
 if(!current||current.inft_milli<1000){toast("Necesitas 1 INFT-TEST para reservar.",true);return}
 if(!confirm("Reservar una pieza de PRUEBA con 1 INFT-TEST? No se fabricará ni enviará metal."))return;
 const btn=$("inftReserveCertificate");btn.disabled=true;
 try{
  const d=await marketCall("reserve",{nonce:crypto.randomUUID()});issuedSerial=d.serial;issuedProof=d.proof;
  $("inftNewSerial").textContent=d.serial;$("inftNewSecret").textContent=d.proof;
  $("inftCoinSerial").textContent=d.serial;$("inftCoinSerial").setAttribute("font-size","9");
  $("inftReceipt").hidden=false;toast(d.message);
  await Promise.all([refresh(),refreshCertificates(),refreshMintStats()]);
  $("inftReceipt").scrollIntoView({behavior:"smooth",block:"nearest"});
 }catch(e){toast(e.message,true)}finally{btn.disabled=!current||current.inft_milli<1000}
});
$("inftCopyCertificate").addEventListener("click",async()=>{try{await navigator.clipboard.writeText("INFINITO · PRUEBA\nSerie: "+issuedSerial+"\nCódigo privado: "+issuedProof+"\nValor: 1 INFT-TEST\nhttps://univershzrw.com/criptomoneda#canjes");toast("Serie y código copiados. Consérvalos de forma privada.")}catch{toast("Copia los datos manualmente.",true)}});
$("inftVerifyForm").addEventListener("submit",async e=>{
 e.preventDefault();const result=$("inftVerifyResult");result.textContent="Validando registro…";result.className="inft-verify-result";
 try{const r=await marketCall("verify",{serial:$("inftVerifySerial").value.trim(),proof:$("inftVerifyCode").value.trim()});result.textContent=r.message;result.className="inft-verify-result "+(r.valid_demo?"success":"fail")}catch(err){result.textContent=err.message;result.className="inft-verify-result fail"}
});
let dragging=false,lastX=0,lastY=0;
const stage=$("inftCoinStage"),coin=$("inftCoin3d");
function renderCoin(){coin.style.transform="rotateX("+coinRotationX+"deg) rotateY("+coinRotationY+"deg)"}
stage.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;dragging=true;lastX=e.clientX;lastY=e.clientY;stage.setPointerCapture?.(e.pointerId);coin.style.transition="none"});
stage.addEventListener("pointermove",e=>{if(!dragging)return;coinRotationY+=(e.clientX-lastX)*.8;coinRotationX=Math.max(-50,Math.min(50,coinRotationX-(e.clientY-lastY)*.45));lastX=e.clientX;lastY=e.clientY;renderCoin()});
const done=()=>{dragging=false;coin.style.transition=""};stage.addEventListener("pointerup",done);stage.addEventListener("pointercancel",done);
stage.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){coinRotationY+=e.key==="ArrowRight"?25:-25;renderCoin();e.preventDefault()}});
$("inftRotateLeft").addEventListener("click",()=>{coinRotationY-=70;renderCoin()});
$("inftRotateRight").addEventListener("click",()=>{coinRotationY+=70;renderCoin()});
$("inftAutoRotate").addEventListener("click",()=>{
 if(spinTimer){clearInterval(spinTimer);spinTimer=null;$("inftAutoRotate").textContent="Rotación automática";return}
 $("inftAutoRotate").textContent="Detener rotación";spinTimer=setInterval(()=>{if(!document.hidden&&!dragging){coinRotationY+=2;renderCoin()}},55);
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&spinTimer){clearInterval(spinTimer);spinTimer=null;$("inftAutoRotate").textContent="Rotación automática"}});
renderCoin();
document.querySelectorAll("[data-inft-period]").forEach(b=>b.addEventListener("click",()=>{marketPeriod=b.dataset.inftPeriod;document.querySelectorAll("[data-inft-period]").forEach(x=>x.classList.toggle("is-active",x===b));void refreshInftMarket()}));
const qp=new URLSearchParams(location.search).get("serie");if(qp&&/^UHZ-INFT-[A-F0-9]{20}$/i.test(qp))$("inftVerifySerial").value=qp.toUpperCase();
void refreshInftMarket();void refreshMintStats();
setInterval(()=>{if(!document.hidden){void refreshInftMarket();void refreshMintStats()}},30000);
