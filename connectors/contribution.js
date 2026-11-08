import{PROVIDERS,describeURL}from'./providers.mjs';
// Adds controls to existing contribution flows without replacing their submission or moderation.
const wired=new WeakSet();
function attach(input){
 if(wired.has(input))return;wired.add(input);let selected='auto';
 const wrap=document.createElement('div');wrap.className='uhz-provider-field';
 const label=document.createElement('label'),select=document.createElement('select'),status=document.createElement('p');
 label.textContent='Plataforma del archivo';label.style.display='block';label.style.marginBottom='8px';
 select.setAttribute('aria-label','Plataforma del archivo');const auto=document.createElement('option');auto.value='auto';auto.textContent='Detectar automáticamente';select.append(auto);
 for(const p of PROVIDERS){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.append(o);}
 status.setAttribute('role','status');status.style.cssText='font-size:12px;line-height:1.6;margin:8px 0 12px;color:inherit;opacity:.85';
 wrap.style.cssText='margin:12px 0;max-width:100%';select.style.cssText='width:100%;max-width:100%;min-height:44px;box-sizing:border-box';label.append(select);wrap.append(label,status);
 const parent=input.closest('label');(parent||input).before(wrap);
 function check(normalize=false){input.setCustomValidity('');if(!input.value.trim()){status.textContent='Pega el enlace compartido del archivo.';return true;}
  try{const d=describeURL(input.value.trim(),selected);status.textContent=d.providerName+' · '+d.description;if(normalize)input.value=d.url;return true;}catch(e){status.textContent=e.message;input.setCustomValidity(e.message);return false;}}
 select.addEventListener('change',()=>{selected=select.value;check();});input.addEventListener('input',()=>check());input.addEventListener('blur',()=>check(true));
 input.form?.addEventListener('submit',e=>{if(!check(true)){e.preventDefault();e.stopImmediatePropagation();input.reportValidity();}},{capture:true});
 check();
}
function scan(){for(const input of document.querySelectorAll('input[name="source_url"],#ucURL,#convertSource'))attach(input);}
scan();new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true});
