"use strict";
const root="/criptomoneda/terminal/api/"; const $=id=>document.getElementById(id); let current=null; let working=false;
const names={faucet:"Saldo inicial",send:"Envío",buy:"Compra simulada",sell:"Venta simulada",physical:"Canje demo"};
function money(n){return (Number(n||0)/1000).toLocaleString("es-MX",{minimumFractionDigits:3,maximumFractionDigits:3})}
function stamp(s){try{return new Date(s).toLocaleString("es-MX",{dateStyle:"short",timeStyle:"short"})}catch{return "—"}}
function toast(msg,bad){const t=$("toast");t.textContent=msg;t.style.borderColor=bad?"#e7a39c":"#dec180";t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,5000)}
async function api(action,data){const opts={credentials:"same-origin",cache:"no-store",headers:{accept:"application/json"}};if(data!==undefined){opts.method="POST";opts.headers["content-type"]="application/json";opts.body=JSON.stringify(Object.assign({},data,{nonce:crypto.randomUUID()}))}const r=await fetch(root+action,opts);const x=await r.json().catch(()=>({ok:false,error:"El servidor devolvió una respuesta inesperada."}));if(!r.ok||!x.ok)throw Error(x.error||x.message||"No se pudo completar la operación.");return x}
function elem(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e}
function setDisabled(auth){document.querySelectorAll("#swapForm button[type=submit],#sendForm button[type=submit],#redeemForm button[type=submit]").forEach(b=>b.disabled=!auth);$("copy").disabled=!auth;const f=$("faucet");f.disabled=!auth||!!current?.claimed}
function renderHistory(rows){const body=$("explorerRows");body.replaceChildren();if(!rows||!rows.length){const tr=elem("tr");const td=elem("td","No existen movimientos todavía. Prueba la asignación de saldo.","empty");td.colSpan=5;tr.append(td);body.append(tr);return}for(const x of rows){const tr=elem("tr"),from=x.from_address||"Sistema de pruebas",to=x.to_address||"—";let val=money(x.inft_milli)+" INFT";const cells=[names[x.kind]||x.kind,from+" → "+to,val,stamp(x.created_at),(x.id||"").slice(0,18)+"…"];cells.forEach((v,i)=>{const td=elem("td",v,i===0?"kind":i===4?"txid":"");tr.append(td)});body.append(tr)}}
function renderState(s){current=s.wallet||null;const ok=!!s.authenticated;$("sessionState").textContent=ok?"Cuenta verificada":"Sin sesión";$("loginAlert").hidden=ok;$("accountPanel").hidden=!ok;if(ok){$("accountName").textContent=s.user?.display_name||"Cuenta verificada";$("accountEmail").textContent=s.user?.email||"";}$("inftBalance").textContent=ok?money(s.wallet.inft_milli):"—";$("coinsBalance").textContent=ok?Number(s.wallet.test_coins).toLocaleString("es-MX"):"—";$("address").textContent=ok?s.wallet.address:"Inicia sesión";$("faucetStatus").textContent=!ok?"Requiere inicio de sesión.":s.claimed?"Asignación inicial ya utilizada.":"Disponible: 100 INFT-TEST y 1,000 Coins-TEST.";current=ok?Object.assign({},s.wallet,{claimed:s.claimed}):null;setDisabled(ok)}
async function refresh(){try{const results=await Promise.all([api("state"),api("explorer"),api("parameters")]);renderState(results[0]);renderHistory(results[1].events);renderParameters(results[2]);$("connection").textContent="Servicio de pruebas conectado"}catch(e){$("connection").textContent="Servicio no disponible";toast(e.message,true)}}
async function execute(action,data,done){if(working)return;working=true;document.querySelectorAll("form button[type=submit],#faucet").forEach(x=>x.disabled=true);try{const result=await api(action,data);toast(result.message||"Operación de prueba registrada.");if(done)done();await refresh()}catch(e){toast(e.message,true);await refresh().catch(()=>{})}finally{working=false}}
$("copy").addEventListener("click",async()=>{if(!current)return;try{await navigator.clipboard.writeText(current.address);toast("Dirección de prueba copiada.")}catch{toast("Copia manualmente la dirección.",true)}});
$("copyCode").addEventListener("click",async()=>{try{await navigator.clipboard.writeText("INFT-DEMO-2026");toast("Código de demostración copiado.")}catch{toast("Copia manualmente el código.",true)}});
$("faucet").addEventListener("click",()=>execute("faucet",{}));
$("swapCoins").addEventListener("input",quote);$("direction").addEventListener("change",quote);
function quote(){const n=Number($("swapCoins").value);$("swapQuote").textContent=Number.isFinite(n)&&n>=0?money(n*100)+" INFT-TEST":"—"}
$("swapForm").addEventListener("submit",e=>{e.preventDefault();const coins=Number($("swapCoins").value),direction=$("direction").value;if(!Number.isInteger(coins)||coins<10||coins>1000||coins%10){toast("Elige múltiplos de 10 Coins-TEST entre 10 y 1,000.",true);return}execute("swap",{direction,coins})});
$("sendForm").addEventListener("submit",e=>{e.preventDefault();const recipient=$("recipient").value.trim().toUpperCase(),amount=$("sendAmount").value.trim();if(!/^INFT-[A-F0-9]{12}$/.test(recipient)){toast("La dirección INFT del destinatario no tiene el formato correcto.",true);return}if(!confirm("¿Confirmas enviar "+amount+" INFT-TEST a "+recipient+"? Esto solo mueve saldo de prueba."))return;execute("send",{recipient,amount},()=>{$("sendAmount").value="";$("recipient").value=""})});
$("redeemForm").addEventListener("submit",e=>{e.preventDefault();execute("physical",{code:$("redeemCode").value.trim()},()=>{$("redeemCode").value=""})});
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
$("logoutButton").addEventListener("click",async()=>{
 try{await api("logout",{});window.location.reload()}catch(e){toast(e.message||"No se pudo cerrar la sesión.",true)}
});
window.addEventListener("focus",()=>{if(!document.hidden)refresh().catch(()=>{})});

/* Reorganiza solo la cabecera de INFINITO en móvil, sin alterar el menú global en otras páginas */
(function(){
 function setup(){
  const header=document.getElementById("uhz-global-header");
  if(!header||header.classList.contains("inft-compact-header"))return;
  const nav=header.querySelector(".uhzg-main");if(!nav)return;
  header.classList.add("inft-compact-header");
  const account=document.createElement("a");account.className="inft-mobile-login";
  account.href="/iniciar-sesion";account.textContent="Entrar";
  const menu=document.createElement("button");menu.type="button";menu.className="inft-mobile-menu";
  menu.textContent="Menú";menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-controls","uhz-infinito-menu");
  nav.id="uhz-infinito-menu";
  header.insertBefore(account,nav);header.insertBefore(menu,nav);
  menu.addEventListener("click",()=>{const on=header.classList.toggle("inft-menu-open");menu.setAttribute("aria-expanded",String(on));menu.textContent=on?"Cerrar":"Menú"});
  nav.addEventListener("click",e=>{if(e.target.closest("a")){header.classList.remove("inft-menu-open");menu.setAttribute("aria-expanded","false");menu.textContent="Menú"}});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){header.classList.remove("inft-menu-open");menu.setAttribute("aria-expanded","false");menu.textContent="Menú"}});
  const observe=()=>{
   const signed=!!current;
   account.href=signed?"/mi-cuenta":"/iniciar-sesion";
   account.textContent=signed?"Mi cuenta":"Entrar";
  };
  window.addEventListener("focus",observe);observe();
  const sessionEl=document.getElementById("sessionState");if(sessionEl)new MutationObserver(observe).observe(sessionEl,{childList:true,characterData:true,subtree:true});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
