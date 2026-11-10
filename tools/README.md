# Herramientas del navegador — UNIVERSHZRW

Worker independiente (sin dependencias de FAK LABS ni conexión a servicios de archivos). Ruta publicada: `/herramientas*` en `univershzrw.com` y `www.univershzrw.com`. Los scripts/CSS se sirven desde el Worker, pero **ningún archivo del usuario se envía al servidor**.

## Herramientas funcionales
- Inspector local de estructura de enlaces: MEGA, Google Drive y proveedores externos, sin comprobar disponibilidad ni eludir cuotas.
- QR de fichas públicas de UNIVERSHZRW mediante qrcodejs, licencia MIT. El código se genera en el navegador.
- Optimizador/conversor local de imágenes JPG/PNG/WebP mediante Canvas.
- Lista de revisión editorial SEO.
- Extractor local de metadatos desde HTML pegado. No rastrea URLs externas.

## Seguridad
Solo responde GET/HEAD, \`connect-src 'none'\`, sin fetch ni FormData ni endpoints de subida. No lee cookies ni recopila analíticas. Guardian sigue siendo la fuente de los estados reales de enlaces. Se puede retirar la ruta sin afectar el buscador ni los conectores existentes.

## Despliegue (8 nov. 2026)
Publicado y comprobado mediante Cloudflare Browser Rendering. El acceso «Herramientas» se añadió al menú de inicio del Worker `univershzrw-home-compact` preservando su binding `ORIGINAL_SITE`; el Worker nuevo no toca sus rutas antiguas.

Worker nuevo \`univershzrw-herramientas\` con el archivo \`browser-tools-worker.mjs\` como módulo. Crear rutas exactas \`univershzrw.com/herramientas*\` y \`www.univershzrw.com/herramientas*\`. Revisar visibilidad con navegador.

## Verificación y alcance
- Confirmada la respuesta HTML de `/herramientas` y sus cinco pestañas a través de navegador remoto.
- Comprobadas rutas en Cloudflare, menú de inicio y preservación de la configuración del Worker original.
- La interacción de QR, imágenes y formularios queda pendiente de una prueba manual final desde distintos dispositivos.
- Inspector: validación estructural y transformación de URLs, **no verifica disponibilidad real**; Guardian continúa como verificador del administrador.

## Organización y cobros (9 nov. 2026)

- Las 5 herramientas actuales son **gratuitas**; no cobran Coins ni requieren Premium. No se registra cargo desde el frontend.
- Menú principal y navegación móvil: un enlace general «Herramientas gratis» y entradas individuales Enlaces, QR, Imágenes, SEO y Metadatos.
- `Aportar_contenido`: accesos contextuales para revisar enlaces, preparar imágenes y revisar fichas; abren en pestaña nueva y no transmiten datos de los formularios.
- Fichas públicas `/recurso/`: enlace «Compartir ficha con QR», que precarga únicamente su URL pública.
- Administración: accesos fuente en `admin/native/content.jsx` y `admin/native/connectors.jsx`; **su publicación requiere compilar y desplegar el administrador**, no basta con fusionar los archivos de GitHub.
- Premium actual en Supabase: Gratis y Premium (49 MXN/30 días), sin relación todavía con estas herramientas. Funciones futuras de procesamiento por lotes o cálculos costosos exigirían controles y autorización de servidor antes de cobrar Coins.
- Menús compartidos Cloudflare: `univershzrw-comunichat-nav`, `univershzrw-home-compact`; mantener el binding de servicio `ORIGINAL_SITE -> univershzrw` al actualizar.
