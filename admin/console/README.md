# Administración unificada de UNIVERSHZRW

Publicada en https://admin.univershzrw.com/ el 7 de noviembre de 2026.

La portada anterior dispersaba el trabajo entre administradores independientes. La consola reúne 28 módulos, una biblioteca compartida de archivos y un resumen obtenido de la base de datos del sitio. Publicar, catálogo, aportaciones, licencias, Guardian, productos, pedidos, pagos, INFYNITY, usuarios, moderación, campañas, publicidad, chatbot y configuración conservan sus operaciones existentes dentro del mismo espacio de trabajo.

## Acceso y contacto

El único propietario habilitado es `univershzrw@gmail.com`. La autorización comprueba simultáneamente correo verificado, identidad en `auth.users`, registro administrativo habilitado, metadatos protegidos y sesión vigente. Tener una etiqueta de superadministrador en otra cuenta no concede acceso. Los cambios de contraseña pendientes bloquean las operaciones administrativas.

`+52 493 143 1385` es el contacto administrativo. Este cambio no añade un factor SMS ni declara verificado el teléfono de Auth. Las sesiones siguen en cookies HttpOnly, Secure y SameSite; los JWT no se entregan al código de la consola.

## Subidas

- Cola de hasta 20 archivos por selección, dos transferencias iniciales simultáneas, progreso, pausa y recuperación al seleccionar de nuevo el original.
- TUS de 6 MiB por bloque con `tus-js-client@4.3.1`, almacenamiento directo en el proyecto existente y autorización firmada para una ruta única. Las firmas no se guardan en el historial de reanudación.
- Imágenes JPG/PNG/WebP se pueden convertir a WebP, hasta 1920 px, si reduce su peso; GIF se conserva. Límite de decodificación de 40 megapíxeles.
- Archivos públicos: JPG, PNG, WebP, GIF, PDF y MP4, hasta 20 MiB. Privados: JPG, PNG, WebP y PDF, hasta 10 MiB. Se respetan los límites existentes de los buckets.
- SHA-256, tamaño y firma del formato comprobados por el servidor antes de marcar un archivo como listo. Duplicados completos del mismo bucket reutilizan su registro.
- Presupuesto conservador de 1 GB, bloqueo al 90 %, uso real más reservas en curso y bloqueo transaccional compartido con las portadas del catálogo. No se cambia el plan contratado.
- Archivar es reversible y conserva enlaces públicos que ya puedan estar vinculados a fichas. Los documentos privados solo se abren con enlaces temporales de 120 segundos.
- “Usar en módulo” prepara la URL en la ficha de contenido, producto o anuncio. El propietario revisa y guarda la ficha; seleccionar un archivo no publica automáticamente su contenido.
- La biblioteca muestra los 200 registros más recientes del filtro activo. Los archivos grandes y formatos externos continúan admitiendo enlaces HTTPS en sus módulos existentes.

El editor de productos usa el mismo servicio de subidas. Las portadas y galerías optimizadas del publicador mantienen su protocolo WebP y ahora escriben en Supabase Storage: se eliminó la dependencia operativa de un binding `COMMUNITY_IMAGES` que no estaba configurado. Se conserva lectura de imágenes antiguas si ese binding vuelve a existir. Los borradores pueden previsualizarse con la sesión administrativa; la ruta pública exige publicación.

## Conexión con el sitio

Los módulos guardan en las tablas y funciones que ya usa UNIVERSHZRW.COM. La consola registra revisiones para cambios de contenido, descargas, productos, anuncios, planes, configuración de sitio/tienda y conocimiento del asistente. Actualiza indicadores al guardar, recuperar foco o cada 60 segundos. Los contadores representan registros reales, no estadísticas simuladas. La bitácora existente conserva los detalles de cada operación.

Se corrigieron las escrituras antiguas que dependían de `WRITE_LIMIT`, un binding inexistente: utilizan `API_LIMIT`, que sí está activo. Las finanzas solo habilitan incrustación desde su mismo origen administrativo; el panel de clientes mantiene la prohibición de incrustación. No se modifican saldos, cotizaciones, solicitudes ni liquidaciones financieras.

## Archivos y despliegue

- `schema.sql` y `catalog-quota.sql`: migración `unified_owner_admin_uploads_and_site_sync`.
- `index.ts` y `core.mjs`: función Edge `uhz-admin-control`, con verificación JWT habilitada y clave de servicio solo del entorno.
- `shell.*`, `uploads-client.js`, `child-bridge.js`, `child.css`: interfaz y puente entre módulos.
- `catalog-media.mjs`: almacenamiento del publicador.
- `original/`: fuentes previas necesarias para reproducir las modificaciones incrementales.
- `build.mjs`: compilación y sustituciones verificadas sobre esas fuentes, sin reescribir el sitio principal.
- `dist/`: los cuatro Workers desplegados y el cliente TUS compilado.
- `public-files-worker.mjs`: Worker `univershzrw-admin-files`, rutas específicas `univershzrw.com/_uhz/admin-files/*` y `www.univershzrw.com/_uhz/admin-files/*`.

El nuevo Worker solo sirve registros marcados públicos y completos; no enumera archivos ni accede a documentos privados. Admite rangos MP4 y entrega PDF como descarga, con MIME fijo, `nosniff`, CSP y caché corta. El Worker principal del sitio público conserva su implementación.

Las actualizaciones de Workers existentes se realizaron por `/content`, conservando bindings y secretos. Los cuatro servicios y el nuevo servidor de archivos tienen registros y trazas con muestreo bajo y ocultación de query strings. No se incluyen claves privadas en este repositorio.

Para reproducir:

```sh
npm ci
npm run build
npm test
```

Desplegar la migración una sola vez, la función Edge, el servidor de archivos y sus dos rutas, después comunidad, finanzas, wrapper y consola principal. Antes de sustituir un Worker existente, comparar su fuente actual con la base original y adaptar los cambios concurrentes. Conservar todos sus bindings y configuración.

## Verificación

16 pruebas automatizadas aprobadas: identidad exclusiva, rechazo de roles ajenos, sesiones revocadas, separación público/privado, idempotencia, tamaño e integridad, recuperación, deduplicación, cuotas concurrentes compartidas con el catálogo, revisiones, política de origen, CSP de subidas y aislamiento del panel financiero. La migración también se ejecuta en una base PGlite aislada durante las pruebas.

En producción se comprobó la consulta de resumen con la identidad propietaria existente y que los roles público/miembro no pueden ejecutar el control administrativo. La portada publicada se verificó por HTTP y la interfaz de acceso se revisó en el navegador. Las pruebas aisladas validan recursos, respuestas sin sesión y políticas del panel financiero. Las consultas automatizadas con Python recibieron el código 1010 del filtro del sitio; no se redujeron sus protecciones para realizar la revisión. La sesión del navegador local dejó de estar disponible durante el trabajo, por lo que la subida de un archivo real desde una sesión del propietario y la revisión visual del escritorio autenticado quedan pendientes; no se generaron credenciales ni sesiones para simular esa comprobación.

El auditor de base señala intencionadamente RLS sin políticas en las tablas privadas (acceso por funciones autorizadas), y funciones SECURITY DEFINER de lectura pública (por ejemplo, consulta de un archivo explícitamente público por UUID). Estas no deben abrirse con políticas generales para silenciar avisos. Los avisos anteriores de `pg_net` en esquema público y protección contra contraseñas filtradas pertenecen a la configuración previa del proyecto; no se migró esa extensión ni se contrató un plan de pago para modificarlos.
