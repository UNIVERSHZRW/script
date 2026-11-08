# Administración nativa · versión 3

Publicada en https://admin.univershzrw.com/ el 7 de noviembre de 2026 (hora de México).

La aplicación anterior incrustaba administradores distintos en marcos. Esta versión los sustituye por una sola aplicación React: una barra lateral, tablas uniformes, formularios en paneles laterales y navegación en memoria mediante fragmentos de URL. No carga documentos HTML para cambiar de herramienta. La política de contenido prohíbe marcos y el panel también rechaza ser incrustado.

## Herramientas integradas

- Visión general con indicadores obtenidos del servidor y decisiones pendientes.
- Biblioteca editorial: crear, editar, guardar borradores y publicar fichas; portada, archivos, galería, licencia y acceso con Coins.
- Recursos, descargas y control Guardian de enlaces.
- Biblioteca de archivos públicos y privados, selección desde los editores y cola de subidas conservada durante la navegación.
- Productos con imágenes, precios, inventario, entrega, publicación y promociones; pedidos, configuración y conciliación de pagos.
- INFYNITY: solicitudes, expedientes, comprobantes, revisión, tesorería, cotizaciones, configuración y trazabilidad.
- Usuarios y acceso protegido del propietario; avisos internos, aportaciones, expedientes de derechos, reportes, moderación y campañas.
- Anuncios, solicitudes comerciales, planes y configuración de publicidad.
- Preguntas del asistente, revisión de respuestas, conocimiento y reglas.
- Configuración del sitio, integraciones, actividad, bitácora, importación controlada y acceso propietario.

Los registros generales utilizan paginación del servidor, filtros y exportación CSV. Los expedientes y bibliotecas mantienen los límites de consulta de sus APIs existentes. Las campañas conservan la unidad que registra su backend; la interfaz no convierte sus recompensas a otra unidad de forma silenciosa.

## Datos y permisos

La interfaz utiliza directamente las mismas APIs y funciones autorizadas que UNIVERSHZRW.COM. El servidor conserva los controles de correo verificado, identidad propietaria, sesión activa y permisos. La única cuenta propietaria es univershzrw@gmail.com; 4931431385 es el contacto administrativo.

Las cookies siguen siendo HttpOnly y Secure. El cliente no recibe claves de servicio ni JWT. Las firmas de carga son específicas de un archivo. Las subidas reutilizan el servicio existente con progreso, pausa, reanudación, deduplicación, verificación de integridad y límites de almacenamiento. No se cambiaron saldos, solicitudes, precios financieros, contratos ni cuentas receptoras durante esta entrega.

## Publicación

El dominio personalizado apunta directamente al Worker univershzrw-admin, conservando COMMUNITY_APP → univershzrw-comunidad, su fecha de compatibilidad y la configuración de registros y trazas con ocultación de parámetros de URL.

Se retiraron las dos rutas antiguas del dominio administrativo:
- admin.univershzrw.com/* → univershzrw-admin-guardian-ui
- admin.univershzrw.com/inft* → univershzrw-inft-panel

Las rutas antiguas de herramientas ahora redirigen a la aplicación nativa. Las rutas financieras del sitio público siguen usando su Worker existente. La aplicación administrativa no necesita el wrapper anterior.

## Respaldo reproducible de la publicación

Este directorio se recuperó directamente del Worker desplegado después de que el entorno de desarrollo fallara al reiniciarse. Contiene el código exacto servido al navegador y el runtime completo:

- worker.mjs: instantánea íntegra desplegada, lista para republicar.
- app.js: aplicación React de producción, con las licencias de sus dependencias.
- app.css e index.html: presentación y documento único.
- admin-uploads.js: cliente TUS compilado.
- runtime-prefix.mjs: runtime de rutas, políticas, activos y conexión a las APIs.
- build.mjs: genera un Worker con versiones nuevas de los activos, sin dependencias externas.
- release.json: versión y configuración de la publicación.
- validation.json: alcance real de la verificación realizada.

Para reconstruir el contenedor desde estos activos:

```sh
node admin/native-release/build.mjs
```

El resultado se escribe en admin/native-release/dist/worker.mjs. Para recuperar exactamente la publicación original, utilizar worker.mjs directamente. Al subir contenido al Worker existente, conservar su binding COMMUNITY_APP y su configuración de observabilidad; no restaurar las rutas de las antiguas interfaces.

Las fuentes JSX modulares y su entorno de desarrollo no pudieron recuperarse del espacio que falló. Este respaldo conserva íntegros el cliente ejecutable, el estilo y el runtime publicado; no representa una recuperación de esos archivos JSX. La consola anterior en ../console es una versión archivada y no debe volver a desplegarse como interfaz principal.

## Verificación

Antes de la publicación pasaron 23 pruebas automatizadas: permisos y sesión, almacenamiento e integridad, aislamiento público/privado, redirecciones, transporte de las APIs y recorridos de la interfaz nativa con respuestas controladas. Las pruebas de interfaz recorrieron las secciones sin crear marcos ni solicitar páginas antiguas, editaron un producto a través del adaptador de datos y seleccionaron archivos dentro del mismo documento.

La página de acceso publicada se verificó en navegador. Los recorridos autenticados se probaron en un DOM aislado con respuestas de API controladas; no se sustituyeron ni fabricaron sesiones del propietario para probarlos en producción.
