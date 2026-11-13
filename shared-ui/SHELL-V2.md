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

## Revisión v3 · navegación única y estado autenticado
La cabecera activa se ha corregido para disponer en una sola fila de Aportar, Tienda, Comunichat, Planes, Herramientas y Más. Se quitan de primera línea Correo, WhatsApp, apariencia e idioma; se conservan dentro de Más. En pantallas intermedias los accesos menos prioritarios pasan al menú.

La consulta segura `public.uhz_header_account_summary()` exige una sesión activa verificada, entrega Coins, membresía y el saldo INFT del registro interno; no incluye balances de billeteras externas. Los visitantes ven Entrar en lugar de cifras simuladas. Los INFT siguen sin compras ni conversiones activadas. El menú móvil muestra secciones compactas y, con sesión, los tres saldos.

Se corrigió en producción el orden de parámetros de `make('a','Free · ₡—','uhzg-wallet')` para evitar la etiqueta literal `uhzg-wallet`.

El Worker original y su binding de servicio fueron preservados, desplegando solo el complemento. Pruebas de sintaxis y estructura en GitHub Actions y visualización DOM en navegador Cloudflare (Planes en escritorio y Herramientas en móvil) aprobadas. La prueba de saldos de usuario requiere una sesión real y se mantiene pendiente.
