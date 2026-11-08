# Administración nativa UNIVERSHZRW

Código fuente recuperado y actualizado de la aplicación única de administración. El propietario verificado es univershzrw@gmail.com. Los grupos y pestañas se resuelven en el mismo documento React, sin iframes ni páginas administrativas anidadas.

Desde este directorio: `npm ci`, `npm run build`, `npm test`. Desde la raíz del repositorio: `node connectors/build.mjs` y `node --test connectors/test.mjs connectors/ui.test.mjs`.

Los módulos de `native/` comparten formularios, tablas, navegación y acceso por API. Contenido incluye el publicador, revisión de fuentes, comprobación de enlaces y conectores. Las imágenes, archivos privados, derechos, comercio, comunidad e INFYNITY utilizan sus servicios existentes con comprobaciones del servidor.

La descripción y los límites de cada integración están en `../connectors/README.md`. Los Workers compilados de `dist/` se publican preservando configuración y secretos. `native-release/` contiene la instantánea del administrador desplegado; `console/` conserva la versión antigua archivada y no es la fuente del panel actual.
