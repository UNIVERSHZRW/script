# Integración directa de herramientas — 9 de noviembre de 2026

**Principio:** UNIVERSHZRW gestiona información y referencias externas. Estas herramientas ejecutan tareas en el navegador; no descargan, alojan, cachean, transmiten ni sirven como proxy de archivos de MEGA, Google Drive u otros proveedores.

## Ubicaciones publicadas

| Área | Componente embebido | Implementación |
| --- | --- | --- |
| \`/Aportar_contenido/random\`, \`/coins\`, \`/infynity\` | Inspector de URL; optimizador de imagen; revisión SEO | El Worker \`univershzrw-aportes\` entrega el HTML con \`/herramientas/inline.css\` y \`/herramientas/inline.js\`. Monta justo después del encabezado del formulario. |
| \`/recurso/*\` en dominio y www | Generador QR local en la propia ficha | Worker \`univershzrw-article-inline-tools\`, rutas exactas que delegan la página al servicio \`univershzrw\` y agregan solo los assets del módulo a HTML. |
| \`/?_uhz_ficha=UUID\` | Generador QR local dentro del diálogo editorial | Worker \`univershzrw-home-compact\` añade los assets solo si el parámetro es UUID. |
| \`https://admin.univershzrw.com/#contenido/editorial\` | Herramientas SEO, imágenes y HTML en panel y editor; inspector en el campo del enlace | Worker \`univershzrw-admin\` extiende el HTML y sirve assets del mismo origen para obedecer CSP. Backend \`COMMUNITY_APP\` intacto. |
| \`https://admin.univershzrw.com/#contenido/conectores\` | Inspector local dentro del módulo | Misma extensión; no sustituye el verificador existente. |

Para la navegación general se conserva \`/herramientas\` como catálogo opcional. Los accesos antiguos de preparación de aportaciones y de QR en fichas se eliminan de la interfaz cuando se monta el componente local; no es necesario salir a otra URL.

## Archivos

- \`tools/embedded-tools.js\` — lógica de interfaz y validaciones, sin \`fetch()\` ni cargas.
- \`tools/embedded-tools.css\` — estilos adaptables y modos claro/oscuro.
- \`tools/qrcode-vendor.js\` — biblioteca QR licenciada bajo MIT.
- \`tools/article-inline-worker.mjs\` — montaje en artículos (solo HTML).
- \`tools/browser-tools-worker.mjs\` — rutas \`/herramientas/inline.js\`, \`/inline.css\`, además de las herramientas independientes.
- \`admin/native-release/worker.mjs\` — extensión de producción; las versiones futuras del administrador incorporan assets desde \`admin/build-native.mjs\` y \`admin/native-release/build.mjs\`.
- \`connectors/build.mjs\` — inserta los assets de herramientas cuando se regenera el Worker de aportaciones.
- \`shared-ui/home-mobile-worker.mjs\` — conserva el QR para la ficha modal en futuras reconstrucciones.

## Modelo de cobro y límites

**Gratis**: los cinco recursos locales; ninguno descuenta Coins ni exige Premium. No se han alterado tablas de saldos, RLS, pagos ni precios. Premium/Coins solo podrían aplicarse a operaciones futuras con costo real, previa autorización segura del servidor.

**Inspector de URL**: normaliza el enlace y muestra un destino de vista previa del proveedor cuando su formato lo permite. NO realiza solicitudes externas, NO determina si el archivo existe, NO evita restricciones, NO desencadena descargas. Guardian sigue siendo la autoridad para estados de enlace.

**Optimización de imagen**: selecciona un archivo del dispositivo y crea un Blob local, descargable; no existe \`FormData\`, \`fetch\` ni carga a la plataforma.

**QR**: genera el código para el URL público del artículo sin incluir tokens, claves ni fragmentos de acceso. Conecta la biblioteca QR desde el mismo origen.

**SEO/HTML**: son revisiones orientativas y procesamiento local de texto pegado; no sustituyen revisión de derechos ni ejecutan HTML suministrado.

## Verificación y mantenimiento

- Syntax check del JavaScript en una sandbox JS: aprobado.
- Pruebas deterministas de URL de Google Drive y MEGA: aprobadas; se conserva la clave MEGA y se eliminan parámetros de rastreo de Drive.
- Compilación/publicación de Workers de Cloudflare: aprobada.
- \`admin.univershzrw.com\`: el service binding \`COMMUNITY_APP → univershzrw-comunidad\` se conserva.
- \`univershzrw-home-compact\` y \`univershzrw-article-inline-tools\`: binding \`ORIGINAL_SITE → univershzrw\` se conserva.
- Prueba visual interactiva de todas las rutas en navegadores reales: pendiente (Cloudflare Browser Rendering devolvió cuota HTTP 429 en verificaciones de esta sesión). No se debe afirmar que se verificó cada interacción por separado.

Se puede revertir el montaje integrado eliminando los scripts de los HTML de aportaciones / admin, quitando las rutas de \`univershzrw-article-inline-tools\` y restaurando los Workers previos, sin migraciones de Supabase.
