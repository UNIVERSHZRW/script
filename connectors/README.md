# Conectores de contenido UNIVERSHZRW

Publicado el 8 de noviembre de 2026 (UTC). Administración: https://admin.univershzrw.com/#contenido/conectores

El registro de proveedores se comparte entre el publicador nativo, las aportaciones y el servidor. Los enlaces del catálogo se transforman **después** de que `uhz_catalog_api` confirme el acceso. La verificación del Robot, la revisión de derechos, Premium, los precios y el cargo de Coins permanecen en el RPC existente.

| Proveedor | Integración publicada |
| --- | --- |
| UNIVERSHZRW / archivos autorizados | Reproductor propio para video, audio, imágenes y PDF; descarga con lectura parcial. |
| MediaFire | Resolución propia de la página pública y del botón oficial de descarga. Comprueba MIME, tamaño y Range. Un CAPTCHA, bloqueo o enlace eliminado no se presenta como reproducción disponible. |
| Google Drive / Docs | Normalización y vista previa oficial. Conserva `resourcekey`. No solicita permisos nuevos ni elude restricciones de descarga. |
| Dropbox | Representación del enlace compartido mediante `raw=1`, conservando `rlkey`. |
| YouTube / Vimeo | Reproductor oficial sujeto a permisos de inserción. Conserva la clave `h` de Vimeo. |
| TeraBox | Reconocimiento, selección, almacenamiento de la URL y apertura en el proveedor. **No se ha implementado reproducción nativa ni conexión de cuenta para TeraBox.** |
| OneDrive / SharePoint | Reconocimiento y apertura del enlace. La integración de OAuth/Graph para transmisión nativa queda pendiente. |
| MEGA | Conserva el fragmento de la clave y abre el enlace compartido. La descarga descifrada y reproducción mediante SDK quedan pendientes. |

## Diseño y seguridad

- Sin dependencia de FAK LABS ni copia de su código privado. FAK se utilizó como referencia de producto.
- Adaptadores deterministas en `providers.mjs`; resolución de archivos públicos en `resolver.mjs`.
- Capacidades AES-GCM con 15 minutos de vigencia, origen y usuario vinculados. Derivación de clave separada por contexto a partir del secreto del servidor ya existente; nunca se entrega al navegador.
- Inspección reservada al propietario verificado. Las solicitudes de reproducción verifican la sesión cuando el acceso pertenece a un usuario. La información del reproductor renueva la capacidad durante sesiones largas.
- Enlaces originales y claves de archivos dentro de la capacidad cifrada, fuera del catálogo público. El usuario autorizado puede elegir abrir la fuente; esto no pretende ser DRM.
- No es un proxy abierto: destinos y redirecciones limitados por proveedor, sin cookies ni credenciales enviadas a proveedores externos. Límites de tamaño para respuestas de texto y Range de un solo intervalo.
- Los archivos se transmiten como flujo, sin descargarlos completos a la memoria del Worker. MIME HTML/JSON no se presenta como archivo multimedia.
- CSP restrictiva, consulta privada sin caché, consultas redactadas en observabilidad existente. El administrador mantiene `frame-src none`; las vistas previas de proveedor están en el visor, fuera del documento de administración.

## Uso

1. En Contenido → Biblioteca editorial → Crear contenido → Archivos y portada, selecciona plataforma o detección automática y pega el enlace. Puedes comprobarlo y abrir el visor antes de guardar.
2. Completa los datos y la revisión de derechos; guardar/publicar utiliza el mismo registro editorial existente. No publica nada por comprobar una URL.
3. Las aportaciones públicas tienen el mismo selector. El proceso de folio, duplicados, revisión y recompensas conserva sus controles anteriores.
4. Los accesos del catálogo aprobado entregan el visor propio después del resultado del RPC, no antes de verificar permisos o Coins.

No se promete reproducción directa de todo enlace compartido: algunos proveedores exigen una cuenta autorizada, API o SDK y sus límites siguen aplicando.

## Construcción y comprobación

Desde la raíz del repositorio:

```sh
npm ci --prefix admin
npm run build --prefix admin
node connectors/build.mjs
npm test --prefix admin
node --test connectors/test.mjs connectors/ui.test.mjs
```

`build.mjs` exige coincidencias únicas para los cambios sobre los Workers originales. Los despliegues sustituyen solo el contenido, preservan configuración y comprueban el hash del código vigente antes de publicar. La migración `provider-domains.sql` amplía el validador privado de proveedores, sin modificar roles, RLS, precios, saldos ni registros de contenido.

Los 39 controles automatizados abarcan el administrador nativo, permisos, almacenamiento, registro de proveedores, redirecciones, vigencia y cifrado, integración real del Worker, contenido parcial, Postgres aislado, formularios y visor. La comprobación de producción se documenta en `validation.json`. No se realizaron compras, cargos de Coins ni publicaciones de prueba.

## Herramientas de FAK que conviene desarrollar después

| Prioridad | Herramientas | Beneficio para UNIVERSHZRW |
| --- | --- | --- |
| Alta | Compresor, redimensionador y convertidor de imágenes | Portadas y miniaturas más ligeras antes de subir; menos uso de almacenamiento y datos móviles. |
| Alta | Detector de enlaces rotos y metadatos de archivos | Complementar Guardian y revisar fuentes antes de publicar. No convertir un bloqueo del proveedor en un archivo eliminado. |
| Media | Unir/dividir PDF y convertir imágenes a PDF | Preparación de libros, cursos y documentos con procesamiento local. |
| Media | OCR local | Extraer texto para búsqueda, accesibilidad y fichas de contenidos. |
| Media | QR de fichas y verificación SHA-256 | Compartir recursos y comprobar integridad; SHA-256 de subidas ya existe. |

Estas herramientas son recomendaciones; no se han añadido a producción en esta entrega. Las bibliotecas que se elijan deben tener licencia compatible. El perfil oficial de FAK indica que la mayor parte de sus productos son privados, y su herramienta TeraBox anuncia límites de uso.
