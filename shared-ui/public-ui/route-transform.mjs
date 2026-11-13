export { applyPublicUI };
const UI_MARKUP = {"head":"<header id=\"uhz-ui-desktop\" aria-label=\"Encabezado de UNIVERSHZRW\"><div class=\"uhz-ui-desktop-inner\"><a class=\"uhz-ui-brand\" href=\"/\" aria-label=\"UNIVERSHZRW · Inicio\"><img src=\"/_uhz/univershzrw-favicon.svg\" width=\"43\" height=\"43\" alt=\"\"><span><strong translate=\"no\">UNIVERSHZRW</strong><small>DONDE TODO ES POSIBLE</small></span></a><nav class=\"uhz-ui-primary\" aria-label=\"Menú principal\"><a href=\"/Aportar_contenido/random\">Aportar</a><a href=\"/tienda_online\">Tienda</a><a href=\"/comunichat\">Comunichat</a><a href=\"/planes\">Planes</a><details class=\"uhz-ui-disclosure uhz-ui-tools-menu\"><summary><span>Herramientas</span><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m6 9 6 6 6-6\"/></svg></summary><div class=\"uhz-ui-menu\"><a href=\"/herramientas\">Herramientas gratuitas</a><a href=\"/herramientas#enlaces\">Inspeccionar enlace</a><a href=\"/herramientas#qr\">Generar QR</a><a href=\"/herramientas#imagenes\">Optimizar imágenes</a><a href=\"/herramientas#seo\">Revisión editorial y SEO</a><a href=\"/herramientas#meta\">Metadatos HTML</a><a href=\"/herramientas/acortador\">Acortador de enlaces</a><a href=\"/estudio\">Estudio Premium</a></div></details><details class=\"uhz-ui-disclosure uhz-ui-desktop-more\"><summary><span>Más</span><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m6 9 6 6 6-6\"/></svg></summary><div class=\"uhz-ui-menu\" ><div class=\"uhz-ui-menu-group\"><strong>Explorar</strong><div class=\"uhz-ui-menu-links\"><a href=\"/planes\">Planes</a><a href=\"/biblioteca\">Biblioteca</a><a href=\"/creadores\">Creadores</a><a href=\"/peticiones\">Peticiones</a><a href=\"/criptomoneda/guia\">Guía de INFYNITY</a><a href=\"/criptomoneda/transparencia\">Transparencia INFYNITY</a></div></div><div class=\"uhz-ui-menu-group\"><strong>Ayuda</strong><div class=\"uhz-ui-menu-links\"><a href=\"/donar\">Donar</a><a href=\"/reportar-contenido\">Reportar contenido</a><a href=\"/centro-de-ayuda\">Centro de ayuda</a><a href=\"/seguridad\">Seguridad y privacidad</a><a href=\"/terminos-y-condiciones\">Términos y condiciones</a><a href=\"/politica-de-privacidad\">Política de privacidad</a><a href=\"/contacto\">Contacto</a></div></div><div class=\"uhz-ui-options\"><fieldset><legend>Apariencia</legend><button type=\"button\" data-uhz-theme-choice=\"colorful\" aria-pressed=\"true\">Normal</button><button type=\"button\" data-uhz-theme-choice=\"dark\" aria-pressed=\"false\">Oscuro</button></fieldset><fieldset><legend>Idioma</legend><button type=\"button\" data-uhz-lang-choice=\"es\" aria-pressed=\"true\" lang=\"es\" translate=\"no\">Español</button><button type=\"button\" data-uhz-lang-choice=\"en\" aria-pressed=\"false\" lang=\"en\" translate=\"no\">English</button></fieldset></div><div class=\"uhz-ui-contact\"><a href=\"mailto:univershzrw@gmail.com\">Correo</a><a href=\"https://wa.me/524931431385\" rel=\"noopener noreferrer\">WhatsApp</a></div></div></details></nav><div class=\"uhz-ui-user\"><div class=\"uhz-ui-wallet\" data-uhz-member hidden><a href=\"/coins\"><small>Coins</small><strong data-uhz-balance=\"coins\">—</strong></a><a href=\"/criptomoneda/panel\"><small>INFT</small><strong data-uhz-balance=\"inft\">—</strong></a><a href=\"/planes\"><small>Plan</small><strong data-uhz-balance=\"plan\">—</strong></a></div><a href=\"/mi-cuenta?section=notifications\" data-uhz-notices class=\"uhz-ui-bell\" aria-label=\"Avisos\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9ZM10 21h4\"/></svg><span class=\"uhz-ui-count\" data-uhz-notice-count hidden></span></a><a class=\"uhz-ui-account\" data-uhz-account href=\"/iniciar-sesion\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0\"/></svg><span>Entrar</span></a></div></div></header>","dock":"<nav id=\"uhz-ui-mobile\" aria-label=\"Navegación de la aplicación\"><a href=\"/peticiones\" class=\"uhz-ui-tab\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5\"/></svg><span>Petición</span></a><a href=\"/comunichat\" class=\"uhz-ui-tab\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.8-3.4A8.5 8.5 0 1 1 21 11.5ZM8 12h8\"/></svg><span>Comunichat</span></a><a href=\"/tienda_online\" class=\"uhz-ui-tab\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 8h18l-1 13H4L3 8Zm5 0V6a4 4 0 0 1 8 0v2\"/></svg><span>Tienda</span></a><a href=\"/criptomoneda\" class=\"uhz-ui-tab\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 12c-2.5-3.5-3.5-5-6-5a5 5 0 0 0 0 10c2.5 0 3.5-1.5 6-5Zm0 0c2.5 3.5 3.5 5 6 5a5 5 0 0 0 0-10c-2.5 0-3.5 1.5-6 5Z\"/></svg><span>INFYNITY</span></a><a href=\"/mi-cuenta?section=notifications\" data-uhz-notices class=\"uhz-ui-tab\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9ZM10 21h4\"/></svg><span class=\"uhz-ui-count\" data-uhz-notice-count hidden></span><span>Avisos</span></a><details class=\"uhz-ui-disclosure uhz-ui-mobile-more\"><summary><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 6h16M4 12h16M4 18h16\"/></svg><span>Más</span></summary><div class=\"uhz-ui-menu\" id=\"uhz-ui-app-menu\"><div class=\"uhz-ui-menu-head\"><a class=\"uhz-ui-brand\" href=\"/\" aria-label=\"UNIVERSHZRW · Inicio\"><img src=\"/_uhz/univershzrw-favicon.svg\" width=\"43\" height=\"43\" alt=\"\"><span><strong translate=\"no\">UNIVERSHZRW</strong><small>DONDE TODO ES POSIBLE</small></span></a><a class=\"uhz-ui-account\" data-uhz-account href=\"/iniciar-sesion\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0\"/></svg><span>Entrar</span></a></div><div class=\"uhz-ui-wallet\" data-uhz-member hidden><a href=\"/coins\"><small>Coins</small><strong data-uhz-balance=\"coins\">—</strong></a><a href=\"/criptomoneda/panel\"><small>INFT</small><strong data-uhz-balance=\"inft\">—</strong></a><a href=\"/planes\"><small>Plan</small><strong data-uhz-balance=\"plan\">—</strong></a></div><div class=\"uhz-ui-menu-group\"><strong>Principal</strong><div class=\"uhz-ui-menu-links\"><a href=\"/\">Inicio</a><a href=\"/Aportar_contenido/random\">Aportar contenido</a><a href=\"/perfil\">Perfil</a><a href=\"/mis-contenidos\">Mis contenidos</a></div></div><div class=\"uhz-ui-menu-group\"><strong>Herramientas</strong><div class=\"uhz-ui-menu-links\"><a href=\"/herramientas\">Herramientas gratuitas</a><a href=\"/herramientas#enlaces\">Inspeccionar enlace</a><a href=\"/herramientas#qr\">Generar QR</a><a href=\"/herramientas#imagenes\">Optimizar imágenes</a><a href=\"/herramientas#seo\">Revisión editorial y SEO</a><a href=\"/herramientas#meta\">Metadatos HTML</a><a href=\"/herramientas/acortador\">Acortador de enlaces</a><a href=\"/estudio\">Estudio Premium</a></div></div><div class=\"uhz-ui-menu-group\"><strong>Explorar</strong><div class=\"uhz-ui-menu-links\"><a href=\"/planes\">Planes</a><a href=\"/biblioteca\">Biblioteca</a><a href=\"/creadores\">Creadores</a><a href=\"/peticiones\">Peticiones</a><a href=\"/criptomoneda/guia\">Guía de INFYNITY</a><a href=\"/criptomoneda/transparencia\">Transparencia INFYNITY</a></div></div><div class=\"uhz-ui-menu-group\"><strong>Ayuda</strong><div class=\"uhz-ui-menu-links\"><a href=\"/donar\">Donar</a><a href=\"/reportar-contenido\">Reportar contenido</a><a href=\"/centro-de-ayuda\">Centro de ayuda</a><a href=\"/seguridad\">Seguridad y privacidad</a><a href=\"/terminos-y-condiciones\">Términos y condiciones</a><a href=\"/politica-de-privacidad\">Política de privacidad</a><a href=\"/contacto\">Contacto</a></div></div><div class=\"uhz-ui-options\"><fieldset><legend>Apariencia</legend><button type=\"button\" data-uhz-theme-choice=\"colorful\" aria-pressed=\"true\">Normal</button><button type=\"button\" data-uhz-theme-choice=\"dark\" aria-pressed=\"false\">Oscuro</button></fieldset><fieldset><legend>Idioma</legend><button type=\"button\" data-uhz-lang-choice=\"es\" aria-pressed=\"true\" lang=\"es\" translate=\"no\">Español</button><button type=\"button\" data-uhz-lang-choice=\"en\" aria-pressed=\"false\" lang=\"en\" translate=\"no\">English</button></fieldset></div><div class=\"uhz-ui-contact\"><a href=\"mailto:univershzrw@gmail.com\">Correo</a><a href=\"https://wa.me/524931431385\" rel=\"noopener noreferrer\">WhatsApp</a></div></div></details></nav>","footer":"<footer id=\"uhz-ui-footer\" class=\"uhz-pro-footer\" aria-label=\"Pie de página de UNIVERSHZRW\"><div class=\"footer-inner\"><div class=\"uhz-footer-grid\"><section class=\"uhz-footer-brand\" aria-label=\"Información de UNIVERSHZRW\"><div class=\"uhz-footer-logo-row\"><div class=\"uhz-footer-logo-mark\" aria-hidden=\"true\"><span class=\"uhz-lock-mini\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" focusable=\"false\"><path d=\"M17 9V7a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1Zm-8 0V7a3 3 0 0 1 6 0v2H9Zm3 8.75a1.75 1.75 0 0 1-.75-3.33V13h1.5v1.42A1.75 1.75 0 0 1 12 17.75Z\"></path></svg></span></div><div><span class=\"uhz-footer-brand-name\">UNIVERSHZRW</span><span class=\"uhz-footer-tagline\">DONDE TODO ES POSIBLE</span></div></div><p class=\"uhz-footer-description\">Plataforma comunitaria de conocimiento, referencias, publicaciones propias, enlaces externos y publicidad responsable.</p><p class=\"uhz-footer-copy-small\">© 2015–2026 UNIVERSHZRW.<br>Todos los derechos reservados.</p></section><nav class=\"uhz-footer-column\" aria-label=\"Plataforma\"><h3>Plataforma</h3><a href=\"/acerca-de-univershzrw\">Acerca de nosotros</a><a href=\"/terminos-y-condiciones\">Términos y condiciones</a><a href=\"/politica-de-privacidad\">Política de privacidad</a><a href=\"/derechos-de-autor\">Derechos de autor</a><a href=\"/documentacion-legal\">Documentación legal</a></nav><nav class=\"uhz-footer-column\" aria-label=\"Recursos\"><h3>Recursos</h3><a href=\"/#inputBusqueda\">Explorar</a><a href=\"/#publicaciones\">Publicaciones</a><a href=\"/enlaces-externos\">Enlaces externos</a><a href=\"/software-y-licencias\">Software y licencias</a><a href=\"/publicidad\">Publicidad</a></nav><nav class=\"uhz-footer-column\" aria-label=\"Ayuda\"><h3>Ayuda</h3><a href=\"/centro-de-ayuda\">Centro de ayuda</a><a href=\"/preguntas-frecuentes\">Preguntas frecuentes</a><a href=\"/contacto\">Contacto</a><a href=\"/preferencias-de-cookies\">Preferencias de cookies</a><a href=\"/reportar-contenido\">Reportar contenido</a></nav><section class=\"uhz-footer-social\" aria-label=\"Redes sociales y opciones para compartir\"><h3>Comparte UNIVERSHZRW</h3><div class=\"uhz-footer-social-grid\"><button class=\"uhz-share-btn facebook\" type=\"button\" aria-label=\"Compartir en Facebook\"><span class=\"uhz-share-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\"><path d=\"M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.67 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.24 0-1.62.77-1.62 1.56v1.89h2.76l-.44 2.91h-2.32V22c4.77-.76 8.43-4.92 8.43-9.94z\"></path></svg></span></button><button class=\"uhz-share-btn instagram\" type=\"button\" aria-label=\"Compartir en Instagram\"><span class=\"uhz-share-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\"><path d=\"M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8zm4.2 3.3A4.7 4.7 0 1 1 12 16.7a4.7 4.7 0 0 1 0-9.4zm0 2A2.7 2.7 0 1 0 12 14.7a2.7 2.7 0 0 0 0-5.4zm5-2.25a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z\"></path></svg></span></button><button class=\"uhz-share-btn whatsapp\" type=\"button\" aria-label=\"Compartir por WhatsApp\"><span class=\"uhz-share-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\"><path d=\"M20.52 3.48A11.85 11.85 0 0 0 12.1 0C5.54 0 .22 5.32.22 11.88c0 2.09.55 4.14 1.6 5.94L.1 24l6.33-1.66a11.86 11.86 0 0 0 5.67 1.44h.01c6.55 0 11.88-5.32 11.88-11.88 0-3.17-1.24-6.15-3.47-8.42zM12.1 21.76h-.01a9.84 9.84 0 0 1-5.02-1.37l-.36-.21-3.76.99 1-3.66-.24-.38a9.86 9.86 0 1 1 8.39 4.63z\"></path></svg></span></button><button class=\"uhz-share-btn x\" type=\"button\" aria-label=\"Compartir en X\"><span class=\"uhz-share-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\"><path d=\"M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.37l7.24-8.28L3 2h6.4l4.42 5.85L18.9 2zm-1.09 17.84h1.72L8.46 4.05H6.61l11.2 15.79z\"></path></svg></span></button><button class=\"uhz-share-btn copy\" type=\"button\" aria-label=\"Copiar enlace\"><span class=\"uhz-share-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\"><path d=\"M16 1H5a2 2 0 0 0-2 2v13h2V3h11V1zm3 4H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H9V7h10v14z\"></path></svg></span></button></div><p class=\"uhz-footer-social-note\">Conocimiento para compartir.<br>Responsabilidad para transformar.</p><a class=\"uhz-footer-verification\" href=\"/seguridad\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 2 4 5v7c0 5 3 8 8 10 5-2 8-5 8-10V5zM9 12l2 2 4-4\"/></svg><span>Verificación del sitio</span></a><span class=\"uhz-ui-share-status\" role=\"status\"></span></section></div><div class=\"uhz-footer-bottom\"><div class=\"uhz-footer-security\" aria-label=\"Características de seguridad\"><span>▣ Conexión segura</span><span>◉ Privacidad configurable</span><span>⌁ No instalamos nada</span><span>◇ Uso responsable de datos</span></div><span class=\"uhz-footer-language\">◎ Español · México</span></div><div class=\"footer-guide\"><strong>Publicidad responsable:</strong> los espacios patrocinados deben ser claros, verificables, legales y compatibles con la comunidad.</div></div></footer>"};
/* Shared public HTML integration. Keeps module and API responses on their existing handlers. */
const UI_ROOT="/_uhz/shared-header.js?asset=";
const excludedPath=/^\/(?:admin(?:\/|$)|usuarios(?:\/|$)|archivos(?:\/|$)|control-sd(?:\/|$)|robot(?:\.html)?(?:\/|$)|api(?:\/|$)|_uhz(?:\/|$)|redirect(?:\/|$)|go(?:\/|$)|herramientas\/moderacion(?:\/|$))/i;
const portalPath=/^\/(?:mi-cuenta|perfil|iniciar-sesion|registrarse|recuperar-contrasena|coins|notificaciones)(?:\/|$)/i;
const oldStyle=new Set(['/_uhz/shared-header.css','/_uhz/site-footer.css']);
const oldHeader='body>header.uhz-page-header,body>header.uhz-original-header,body>header.uhz-ed-header,body>header.uhz-license-original,body>header.bar,body>header.studio-header,body>header.site-head,#uhz-native-head,#uhz-native-tabs';
const oldFooter='footer.uhz-pro-footer,footer.uhz-tools-footer,footer.uhz-global-footer,footer.uhz-ed-footer,footer.inft-footer,footer.site-foot,#uhz-global-site-footer,body>footer.footer';
function applyPublicUI(request, response) {
  const url=new URL(request.url);
  if(request.method!=='GET'||!response.ok||response.status===206||!response.body||
     !/^text\/html\b/i.test(response.headers.get('content-type')||'')||
     /attachment/i.test(response.headers.get('content-disposition')||'')||
     response.headers.get('x-uhz-ui')==='1'||!['univershzrw.com','www.univershzrw.com'].includes(url.hostname)||
     excludedPath.test(url.pathname)||url.searchParams.get('embed')==='1'||url.searchParams.get('_uhz_robot')==='1'||
     request.headers.get('sec-fetch-dest')==='iframe')return response;
  const isHome=url.pathname==='/'||url.pathname.toLowerCase()==='/index.html';
  const isPortal=portalPath.test(url.pathname);
  const isArticle=/^\/recurso\//i.test(url.pathname);
  const isEnglish=url.searchParams.get('lang')==='en';
  const seenScripts=new Set();
  const seenStyles=new Set();
  let hasViewport=false;
  let hasCharset=false;
  const footerLinks=isArticle?
    '<div class="uhz-ui-footer-local"><a href="/creadores?seccion=licencias">Guía de aportación y derechos</a></div>':
    /^\/criptomoneda(?:\/|$)/i.test(url.pathname)?
      '<div class="uhz-ui-footer-local"><a href="/criptomoneda/guia">Guía de INFYNITY</a><a href="/criptomoneda/transparencia">Transparencia INFYNITY</a></div>':'';
  const footer=UI_MARKUP.footer.replace('</footer>',footerLinks+'</footer>');
  const cleanUrl=(raw)=>{
    if(!raw)return null;
    try {
      const item=new URL(raw,url);
      return item.hostname==='univershzrw.com'||item.hostname==='www.univershzrw.com'?item:null;
    } catch { return null; }
  };
  const rewriter=new HTMLRewriter()
    .on('html',{element(e){
      e.setAttribute('data-uhz-ui','1');
      if(isPortal)e.setAttribute('data-uhz-portal','1');
      if(isHome)e.setAttribute('data-uhz-home','1');
      const theme=e.getAttribute('data-uhz-theme');
      if(!theme||theme==='classic')e.setAttribute('data-uhz-theme','colorful');
    }})
    .on('head',{element(e){
      e.onEndTag(end=>{
        if(!hasCharset)end.before('<script src="'+UI_ROOT+'ui-boot-2"></script>',{html:true});
        if(!hasViewport)end.before('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',{html:true});
        end.before('<link rel="stylesheet" href="'+UI_ROOT+'ui-css-4">'+
          (isArticle?'<link rel="stylesheet" href="'+UI_ROOT+'article-flow-css&amp;v=20261112-access-redesign-v3">':'')+
          (isArticle?'<script defer src="'+UI_ROOT+'article-ui-3"></script>':'')+
          (isEnglish?'<script defer src="'+UI_ROOT+'ui-en-4"></script>':'')+
          '<script defer src="'+UI_ROOT+'ui-js-4"></script>',{html:true});
      });
    }})
    .on('meta[charset]',{element(e){
      if(hasCharset)return;
      hasCharset=true;
      e.after('<script src="'+UI_ROOT+'ui-boot-2"></script>',{html:true});
    }})
    .on('meta[name="viewport"]',{element(e){
      hasViewport=true;
      const original=e.getAttribute('content')||'width=device-width,initial-scale=1';
      if(!/viewport-fit/i.test(original))e.setAttribute('content',original+',viewport-fit=cover');
    }})
    .on('script[src]',{element(e){
      const raw=e.getAttribute('src');
      const item=cleanUrl(raw);
      if(!item)return;
      const path=item.pathname, asset=item.searchParams.get('asset');
      if(path=== '/_uhz/shared-header.js'&&(!asset||['footer-v4','footer-classic-v1','brand-theme-runtime-v1'].includes(asset))||
         /^\/_uhz\/(?:language\.js|site-footer\.js|build\/site-footer-[\w-]+\.js)$/.test(path)||
         /^\/(?:herramientas|mis-contenidos)\/theme-bootstrap\.js$/.test(path)||
         path==='/_uhz/uhz-home-app.css'&&item.searchParams.has('script')&&!isHome) {
        e.remove();
        return;
      }
      const key=item.pathname+item.search;
      if(seenScripts.has(key)){e.remove();return;}
      seenScripts.add(key);
    }})
    .on('link[rel="stylesheet"]',{element(e){
      const item=cleanUrl(e.getAttribute('href'));
      if(!item)return;
      const path=item.pathname,asset=item.searchParams.get('asset');
      if(oldStyle.has(path)||path==='/_uhz/shared-header.js'&&['app-shell','shell-v2','brand-theme-v1'].includes(asset)||
         path==='/_uhz/uhz-home-app.css'&&!isHome&&item.searchParams.has('script')===false&&item.searchParams.has('featurecss')===false) {
        e.remove();
        return;
      }
      const key=path==='/_uhz/typography.css'?path:path+item.search;
      if(seenStyles.has(key)){e.remove();return;}
      seenStyles.add(key);
    }})
    .on('#uhzEmbedNav',{element(e){if(isPortal)e.removeAttribute('hidden');}})
    .on('body>header.top',{element(e){
      if(!isPortal)e.remove();
      else e.setAttribute('data-uhz-legacy-account-header','1');
    }})
    .on(oldHeader,{element(e){
      if(isPortal&&(e.getAttribute('class')||'').split(/\s+/).includes('uhz-page-header')) {
        e.setAttribute('data-uhz-legacy-account-header','1');
      } else e.remove();
    }})
    .on(oldFooter,{element(e){e.remove();}})
    .on('body',{element(e){
      const logout='<button type="button" class="uhz-ui-logout" data-uhz-logout data-uhz-member hidden>Salir</button>';
      const head=isPortal?UI_MARKUP.head.replace('</fieldset></div><div class="uhz-ui-contact">','</fieldset></div>'+logout+'<div class="uhz-ui-contact">'):UI_MARKUP.head;
      const dock=isPortal?UI_MARKUP.dock.replace('</fieldset></div><div class="uhz-ui-contact">','</fieldset></div>'+logout+'<div class="uhz-ui-contact">'):UI_MARKUP.dock;
      e.prepend(head+(isPortal?'<div class="uhz-account-navigation"></div>':''),{html:true});
      e.append(footer+dock,{html:true});
    }});
  const transformed=rewriter.transform(response);
  const headers=new Headers(transformed.headers);
  for(const name of ['content-length','etag','last-modified','content-md5','digest','content-digest'])headers.delete(name);
  headers.set('x-uhz-ui','1');
  return new Response(transformed.body,{status:transformed.status,statusText:transformed.statusText,headers});
}

