# Herramientas del navegador — UNIVERSHZRW

Worker independiente (sin dependencias de FAK LABS ni conexión a servicios de archivos). Ruta propuesta: \`/herramientas*\`. Los scripts/CSS se sirven desde el Worker, pero **ningún archivo del usuario se envía al servidor**.

## Herramientas funcionales
- Inspector local de estructura de enlaces: MEGA, Google Drive y proveedores externos, sin comprobar disponibilidad ni eludir cuotas.
- QR de fichas públicas de UNIVERSHZRW mediante qrcodejs, licencia MIT. El código se genera en el navegador.
- Optimizador/conversor local de imágenes JPG/PNG/WebP mediante Canvas.
- Lista de revisión editorial SEO.
- Extractor local de metadatos desde HTML pegado. No rastrea URLs externas.

## Seguridad
Solo responde GET/HEAD, \`connect-src 'none'\`, sin fetch ni FormData ni endpoints de subida. No lee cookies ni recopila analíticas. Guardian sigue siendo la fuente de los estados reales de enlaces. Se puede retirar la ruta sin afectar el buscador ni los conectores existentes.

## Despliegue
Worker nuevo \`univershzrw-herramientas\` con el archivo \`browser-tools-worker.mjs\` como módulo. Crear rutas exactas \`univershzrw.com/herramientas*\` y \`www.univershzrw.com/herramientas*\`. Revisar visibilidad con navegador.
