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
Los pies de página anteriores se conservan en el DOM para no romper acciones y avisos; visualmente se muestra un único pie corporativo v4 y los enlaces adicionales se trasladan a una sección contextual accesible. Las notas internas de módulos y el panel administrativo se respetan.

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

## Revisión v4 · unificación completa del pie público (12 nov 2026)

### Referencias abiertas

- U.S. Web Design System, componente **Big Footer**, guía de accesibilidad, agrupación de enlaces y accordions móviles: https://designsystem.digital.gov/components/footer/
- Ejemplos de pie de página Bootstrap 5.3 y contenedores responsive: https://getbootstrap.com/docs/5.3/examples/#snippets
- Landmarks semánticos de W3C: https://www.w3.org/WAI/WCAG21/Techniques/html/H101

El pie es código original del proyecto sin paquetes ajenos en tiempo de ejecución.

### Publicado

- **Un único pie** `#uhz-global-site-footer` en las páginas que utilizan el encabezado compartido: marca UNIVERSHZRW, Exploración, Participación, Ayuda y contacto e Información legal.
- En móviles, cuatro bloques `<details>` nativos y accesibles para abrir/cerrar navegación; en escritorio, columnas desplegadas.
- Enlaces visibles a términos, privacidad, derechos, reportes, cookies, documentación legal, licencias y otras páginas vigentes.
- Acciones de compartir, volver arriba y verificación. La verificación aprovecha el control original cuando está disponible, sin cambiar su integración.
- Los footers anteriores `.uhz-pro-footer`, `.uhz-tools-footer`, `.inft-footer`, `.uhz-global-footer` y `.footer` siguen en el DOM, pero se ocultan solo después de que el nuevo pie se haya montado correctamente. Los enlaces singulares se muestran en un apartado contextual.
- **Catálogo público de creadores** `/creador/*`: script de pie independiente `shared-ui/footer-only-v4.js` servido por `/_uhz/shared-header.js?asset=footer-v4`; el Worker `univershzrw-creator-catalog` añade este script y el CSS. Conserva intactos encabezado propio, catálogo y bindings SUPABASE_URL/SUPABASE_PUBLISHABLE.
- `/_uhz/shared-header.js?asset=shell-v2` distribuye los estilos comunes y el Worker original mantiene su binding `ORIGINAL_SITE`.
- Las notas internas de Economía y del panel INFT siguen visibles cuando forman parte del contenido de una herramienta, sin sustituir el pie de página corporativo.
- Excluidos intencionalmente los visores, iframes, robot, respuestas de redirección/API, aplicaciones especializadas `/control-sd` y administración; no introducir scripts adicionales en esas interfaces sin evaluar su CSP y compatibilidad.

### Validación

- GitHub Actions: comprobaciones de sintaxis JavaScript y existencia de enlaces, componentes y puntos de integración.
- Navegador Cloudflare: Inicio (escritorio), Herramientas (móvil), INFYNITY y catálogo `/creador/univershzrw` (móvil), todos con **un pie corporativo**, enlaces legales y componentes esperados.
- Verificados los bindings Cloudflare originales del Worker de menú y del catálogo.
- No se han hecho pruebas autenticadas en todos los módulos ni auditoría de accesibilidad completa con lector de pantalla; se recomienda revisión final en dispositivos reales.

**Regresión móvil corregida:** los enlaces de `<details>` cerrados se ocultan expresamente con el selector `.uhz-v4-col-toggle:not([open]) > .uhz-v4-nav`. En navegador a 390 px se comprobaron: pie visible (`display:block`), pie anterior oculto (`display:none`), anchura del pie 390 px, cero rectángulos de enlaces al estar cerrado y un rectángulo al expandirlo. Estudio Premium también confirmó pie único. CI de GitHub aprobado.

## Paletas oficiales v1 · Normal y Oscuro (12 nov 2026)

Dos diseños solicitados como referencia visual, implementados con CSS custom properties originales y la API nativa `color-scheme`, sin importar Bootstrap, Tailwind ni hojas de estilo de terceros.

- **Normal:** Pale Mint `#CFE8E1` + Midnight Navy `#002941`; fondo de lectura `#EFF8F5`, tarjetas blancas con texto navy, cabecera/pie navy y menta.
- **Oscuro:** Charcoal Black `#1C1C1C` + Bone White `#EDE6D8`; tarjetas `#292929`, bordes `#645D53`, cabecera/pie carbón con texto hueso.
- Reutiliza `uhz_header_theme` y el atributo `data-uhz-theme` existentes, conservando el cambio de idioma, sesión, Coins, INFT y Plan. Los valores almacenados son `colorful` y `dark` por compatibilidad, mientras la interfaz muestra **Normal** y **Oscuro**.
- Archivos: `shared-ui/brand-themes.css`, `shared-ui/theme-runtime.js`, `shared-ui/shell-v2.js`, `shared-ui/footer-only-v4.js`.
- Assets Cloudflare: `/_uhz/shared-header.js?asset=brand-theme-v1` (CSS), `?asset=brand-theme-runtime-v1` (JS). La capa JS de colores se limita a superficies de lectura, encabezado, pie, menús y tarjetas sin medios: corrige estilos heredados que bloquean el modo oscuro con reglas de mayor prioridad.
- El catálogo independiente `/creador/*` hereda la preferencia guardada; no reemplaza sus fichas o su encabezado.
- No se cambian datos, precios, pagos, conexiones, formularios, ni permisos. No se inyecta en admin, robot, iframes, reproductores o la aplicación Control SD que utiliza un CSP independiente.
- Comprobado con Cloudflare Browser Rendering: la página Planes cambia de menta/navy a carbón/hueso en fondo, encabezado, tarjetas y pie; el catálogo público también cambia en ambos modos; Inicio carga la paleta normal con encabezado y footer únicos.
- CI GitHub Actions: pruebas de sintaxis y tokens pasaron. Queda pendiente probar manualmente todas las rutas, navegadores y aplicaciones independientes de UNIVERSHZRW antes de declarar cobertura absoluta.

Referencias: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme y https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark.

## Restauración del pie original (última revisión, 12 nov 2026)

Esta sección prevalece sobre las versiones anteriores de pie v4. Se recuperó el pie exacto que el propietario mostró en su captura:
- Se utiliza la plantilla original footer.uhz-pro-footer, con emblema de candado, UNIVERSHZRW, lema DONDE TODO ES POSIBLE, Plataforma, Recursos, Ayuda y Comparte UNIVERSHZRW.
- Se conservan los cinco iconos sociales, la verificación del sitio, los enlaces legales, los distintivos de seguridad y el aviso Publicidad responsable.
- Si el footer clásico existe se reutiliza sin reescribir el resto de la página; el footer v4 se elimina.
- En otras páginas se importa únicamente el footer original desde /donar, con alternativa /, excluyendo scripts, iframes y formularios. El CSS es el original /_uhz/site-footer.css.
- Los botones sociales importados tienen controladores explícitos. En páginas con encabezado independiente la verificación se enlaza a /seguridad con el mismo escudo.
- Se desactiva la clase uhz-v4-footer-active y se habilita uhz-classic-footer-active; se ocultan únicamente los pies duplicados.
- No se modifican encabezado, sesión, balances, INFYNITY, pagos ni los dos temas de color.
- Código: shared-ui/footer-classic-restore.js, servido por /_uhz/shared-header.js?asset=footer-classic-v1. Los archivos shell-v2.js y footer-only-v4.js ahora solo cargan ese complemento, no generan el antiguo v4.
- Browser Rendering: Inicio y Planes con un solo footer clásico, cinco botones sociales y cero footer v4. También comprobado el catálogo de creadores con la plantilla importada.
- Las versiones anteriores del Worker de Cloudflare siguen disponibles para revertir; la conexión ORIGINAL_SITE se preservó.
- PR en borrador para evitar que una futura fusión sobrescriba scripts de producción.
