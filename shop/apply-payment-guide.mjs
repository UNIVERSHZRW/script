/**
 * Apply the UNIVERSHZRW checkout presentation and HTTPS redirect hardening
 * to the existing univershzrw-tienda Cloudflare module source.
 * This does not create payments or activate checkout.
 *
 * Usage during a controlled build:
 *  import {applyPaymentGuide} from './apply-payment-guide.mjs';
 *  const updated=applyPaymentGuide(currentWorkerSource, paymentGuideJS, paymentGuideCSS);
 */
export function applyPaymentGuide(current,guideJS,guideCSS){
 let worker=current;
 const getVar=(key)=>{
  const marker='const '+key+'=',a=worker.indexOf(marker),b=worker.indexOf(';\n',a);
  if(a<0||b<a)throw Error('Could not find '+key);
  return JSON.parse(worker.slice(a+marker.length,b));
 };
 const setVar=(key,oldValue,newValue)=>{
  const from='const '+key+'='+JSON.stringify(oldValue)+';';
  const to='const '+key+'='+JSON.stringify(newValue)+';';
  if(worker.split(from).length!==2)throw Error('Could not safely update '+key);
  worker=worker.replace(from,to);
 };
 if(worker.includes('const PAY_GUIDE_JS='))return worker;
 const previousHTML=getVar('HTML'),previousAPP=getVar('APP');
 if(!previousHTML.includes('</head>'))throw Error('Missing store head.');
 const html=previousHTML.replace('</head>','<link rel="stylesheet" href="/tienda_online/payment-guide.css?v=20261109-paysafe2"><script defer src="/tienda_online/payment-guide.js?v=20261109-paysafe2"></script></head>');
 let app=previousAPP;
 const at=app.indexOf('if(res.initPoint&&');
 const until=app.indexOf("throw new Error('No se obtuvo el enlace",at);
 if(at<0||until-at>300||until<at)throw Error('Checkout redirect changed upstream.');
 const oldRedirect=app.slice(at,until);
 if(!oldRedirect.includes('location.assign(res.initPoint)'))throw Error('Unexpected redirect.');
 app=app.replace(oldRedirect,'const hosted=safeHostedMercadoPagoCheckout(res.initPoint);if(hosted){location.assign(hosted);return}');
 if(app.split('function feedback(').length!==2)throw Error('Missing feedback marker.');
 const safe="function safeHostedMercadoPagoCheckout(raw){try{const u=new URL(String(raw||''));const h=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port)return null;if(!['mercadopago.com','mercadopago.com.mx'].some(d=>h===d||h.endsWith('.'+d)))return null;if(!u.pathname.startsWith('/checkout/')&&!u.pathname.startsWith('/sandbox/checkout/'))return null;return u.href;}catch{return null}}\n";
 app=app.replace('function feedback(',safe+'function feedback(');
 const oldQuery='if(![...u.keys()].some(k=>/status|payment|collection|preference/i.test(k)))return;';
 if(app.split(oldQuery).length!==2)throw Error('Return URL status marker changed.');
 app=app.replace(oldQuery,'if(![...u.keys()].some(k=>/compra|folio|status|payment|collection|preference/i.test(k)))return;');
 setVar('HTML',previousHTML,html);setVar('APP',previousAPP,app);
 const marker='export default {async fetch(request){';
 if(worker.split(marker).length!==2)throw Error('Missing worker entry point.');
 worker=worker.replace(marker,'const PAY_GUIDE_JS='+JSON.stringify(guideJS)+';\nconst PAY_GUIDE_CSS='+JSON.stringify(guideCSS)+';\n'+marker);
 const route="if(path==='/tienda_online/payment-guide.js'||path==='/tienda_online/payment-guide.css'){if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});const js=path.endsWith('.js');return new Response(request.method==='HEAD'?null:js?PAY_GUIDE_JS:PAY_GUIDE_CSS,{headers:{'content-type':js?'application/javascript; charset=utf-8':'text/css; charset=utf-8','cache-control':'public,max-age=300','x-content-type-options':'nosniff'}});}\n";
 if(worker.split("if(path==='/tienda_online/cp'){").length!==2)throw Error('Could not add guide routes.');
 worker=worker.replace("if(path==='/tienda_online/cp'){",route+"if(path==='/tienda_online/cp'){");
 return worker;
}
