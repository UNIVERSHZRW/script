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
