# UNIVERSHZRW · Shell unificado v2

Un encabezado responsive, navegación accesible y pie de página compartido.

## Código abierto de referencia
- Bootstrap 5.3 Navbar y Offcanvas (MIT): diseño conceptual, sin importar todo Bootstrap a producción.
- W3C WAI-ARIA APG Disclosure Navigation: semántica de botones y paneles, acceso por teclado y Escape.
- JavaScript y CSS originales del proyecto, con licencia MIT heredada del repositorio.

## Aplicación
Se integra con el Worker univershzrw-comunichat-nav que ya atiende la ruta /_uhz/shared-header.js.
El CSS se solicita por /_uhz/shared-header.js?asset=shell-v2 y el JavaScript extiende el encabezado compartido.
Conserva el buscador, CAPTCHA, sesión, notificaciones, selector de tema e idioma.
En escritorio crea Herramientas desplegable y enlaza Planes, Biblioteca, Estudio, INFYNITY, Coins y Ayuda.
En móvil convierte el menú actual en panel lateral y añade los enlaces faltantes.
El pie legal existente se conserva; cuando una página carece de pie corporativo se genera el pie unificado.

## Protecciones
No se aplica a vistas embed/robot, Archivos ni control-sd. El panel admin es independiente.
No modificar el código de la página con una copia obsoleta del Worker: el código Cloudflare vigente contiene módulos adicionales y debe reconciliarse antes de unificar GitHub.
Para publicar sin afectar las conexiones, usar el endpoint content de Cloudflare (mantener bindings) y verificar rutas, controles y funcionalidades.

## Verificar
Home, Aportar, tienda, Planes, Herramientas, Peticiones, INFYNITY, Cuenta, Seguridad; escritorio, 320/390px, menú, teclado/Escape, tema oscuro, idioma, enlaces legales y pie de página.