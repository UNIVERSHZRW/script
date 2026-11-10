/* UNIVERSHZRW — métodos de pago en la tienda. No crea cargos ni recibe datos de tarjeta. */
(()=>{'use strict';
if(window.__UHZ_PAYMENT_GUIDE_2026__)return;window.__UHZ_PAYMENT_GUIDE_2026__=true;
const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
function enhanceCheckout(){
 const container=document.querySelector('#shop-checkout .methods');if(!container||container.dataset.uhzGuide)return;
 container.dataset.uhzGuide='1';
 const modes={
 'MERCADO_PAGO':{title:'Mercado Pago · Checkout protegido',description:'Tarjeta de débito o crédito, OXXO, SPEI y saldo de Mercado Pago: las opciones exactas dependen de las condiciones del proveedor y aparecerán al pagar.'},
 'SPEI_DIRECT':{title:'SPEI directo · Transferencia bancaria',description:'Se genera una referencia para tu pedido. Necesita comprobación bancaria o revisión administrativa; una captura de transferencia no significa pago aprobado.'}
 };
 const radios=[...container.querySelectorAll('input[name="payment"]')];
 for(const input of radios){
  const detail=modes[input.value],label=input.closest('label');
  if(!detail||!label)continue;
  label.classList.add('uhz-payment-method');
  [...label.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());
  const copy=create('span','uhz-payment-method-copy');
  copy.append(create('strong',null,detail.title),create('small',null,detail.description));label.append(copy);
 }
 if(radios.length&&!radios.some(x=>x.checked))radios[0].checked=true;
 const note=create('p','uhz-payment-caution','El total se verifica en el servidor. UNIVERSHZRW no solicita números de tarjeta ni claves bancarias. Si pagas en efectivo o transferencia, el pedido quedará pendiente hasta confirmación.');
 container.after(note);
}
function overview(){
 if(location.pathname.toLowerCase().includes('/carrito')||document.getElementById('uhz-payment-overview'))return;
 const root=document.getElementById('shop-view'),top=root?.querySelector('.shop-topbar');
 if(!root||!top)return;
 const section=create('section','uhz-payment-overview');section.id='uhz-payment-overview';
 section.append(create('h2',null,'Formas de pago y protección'));
 section.append(create('p','uhz-payment-intro','La disponibilidad se muestra al finalizar la compra. Mientras la tienda permanezca en modo catálogo, no se procesarán cobros.'));
 const methods=create('div','uhz-payment-grid');
 const entries=[
  ['Tarjetas','Crédito y débito, procesadas en Mercado Pago cuando están disponibles.'],
  ['OXXO y efectivo','Alternativa en efectivo dentro de Mercado Pago. Puede permanecer pendiente hasta confirmación.'],
  ['SPEI y saldo','Transferencia o saldo de Mercado Pago, según las opciones habilitadas por el proveedor.'],
  ['SPEI directo','Transferencia con referencia, pendiente de verificación antes de entregar el pedido.']
 ];
 for(const [title,description] of entries){const item=create('div','uhz-payment-option');item.append(create('strong',null,title),create('p',null,description));methods.append(item);}
 section.append(methods);
 section.append(create('p','uhz-payment-caution','No compartas el CVV, NIP, contraseñas o códigos de seguridad con ninguna persona. El estado real de pago se confirma únicamente desde el proveedor.'));
 top.after(section);
}
function attach(){
 try{enhanceCheckout();overview()}catch(e){console.warn('Payment method guide',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;attach()})}).observe(document.documentElement,{childList:true,subtree:true});
})();
