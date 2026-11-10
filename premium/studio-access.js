(()=>{'use strict';
const status=document.getElementById('access'),workspace=document.getElementById('workspace'),upgrade=document.getElementById('upgrade'),refresh=document.getElementById('refresh-access');
async function check(){
 status.classList.remove('good','locked');status.querySelector('strong').textContent='Verificando membresía…';status.querySelector('small').textContent='Consultando los permisos reales de tu cuenta.';
 workspace.hidden=true;upgrade.hidden=true;
 try{
  const r=await fetch('/estudio/api/entitlement',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
  const j=await r.json();
  if(j.access===true){status.classList.add('good');status.querySelector('strong').textContent='Acceso autorizado al Estudio Premium';status.querySelector('small').textContent='Tus herramientas procesan archivos en el dispositivo.';const s=document.createElement('script');s.src='/estudio/app.js?v=20261109-1';s.onerror=()=>{status.querySelector('small').textContent='No se pudo cargar el editor. Actualiza la página.';};document.body.append(s);return;}
  if(j.reason==='login'){status.querySelector('strong').textContent='Inicia sesión para activar las herramientas';}
  else if(j.reason==='unavailable'){status.querySelector('strong').textContent='No pudimos verificar tu membresía';}
  else{status.querySelector('strong').textContent='Acceso con Premium activo';}
  status.classList.add('locked');status.querySelector('small').textContent='Consulta las funciones disponibles y revisa tu plan desde Mi Cuenta.';upgrade.hidden=false;
 }catch{status.classList.add('locked');status.querySelector('strong').textContent='Verificación temporalmente no disponible';status.querySelector('small').textContent='La plataforma no pudo comprobar el estado de tu cuenta. Prueba de nuevo.';upgrade.hidden=false;}
}
refresh?.addEventListener('click',check);check();
})();