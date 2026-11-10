# UNIVERSHZRW · Planes Premium y Estudio de Creadores

## Estado de entrega — 9 de noviembre de 2026

El plan `premium` existente mantiene **$49 MXN por 30 días**, los límites vigentes de 100 carpetas y 100 aportaciones por periodo y la elegibilidad actual para recompensas sujetas a verificación. El plan `free` mantiene $0, 3 carpetas y 3 aportaciones. La actualización **no crea cargos ni activa suscripciones**.

### Ventajas Premium implementadas

1. **Edición de imágenes por lotes**: admite hasta 20 JPG/PNG/WebP (10 MB/archivo, 80 MB en total), cuatro tamaños de redes sociales o tamaño proporcional, opciones cover/contain, marca de agua opcional, calidad y entrega conjunta ZIP.
2. **Campañas de QR**: genera hasta 50 enlaces públicos HTTPS en PNG, con CSV que relaciona cada archivo con su URL, todo en un ZIP. Emplea QRCode.js MIT ya instalado en las herramientas gratuitas.
3. **Auditoría editorial masiva**: hasta 200 fichas delimitadas por punto y coma, alerta por campos faltantes, extensión, palabras clave y títulos duplicados; reportes CSV. La puntuación es heurística, no predice ranking.
4. **Preferencias reutilizables de imagen**: guarda solo formato, tamaños, marca y calidad en almacenamiento del navegador. Los archivos, los enlaces y los contenidos no se guardan.
5. **Capacidad de publicación**: hasta 100 carpetas y aportaciones cada 30 días, según los límites ya existentes de la base de datos.

Se preservan las **cinco herramientas gratuitas individuales**: inspector de enlaces, QR individual, compresión de imagen individual, revisión SEO individual y metadatos HTML.

### Integración y permisos

- `/planes`: explicación nueva, comparación de casos reales y link al Estudio. El precio público se valida con `/economia/centro/api` (Supabase) para que la página no muestre un costo no verificado.
- `/estudio`: presentación del Estudio, módulos protegidos, instrucciones de acceso.
- `/estudio/api/entitlement`: verifica `uhz_economy_my_dashboard` y, para cuenta superadministradora, `uhz_account_status`, mediante el proxy autenticado existente. Si falla la verificación, no concede acceso.
- `/estudio/app.js`: devuelve el código funcional solo si la cuenta tiene Premium vigente o el rol de superadministración confirmado. Los ficheros nunca pasan por el backend.
- `/herramientas`: acceso al Estudio sin restringir funciones gratuitas.
- `/economia/centro`: tarjeta Premium ampliada con funciones concretas y acceso directo.
- Menú de inicio y navegación compartida: nueva entrada «Estudio de Creadores Premium». Se mantuvo `ORIGINAL_SITE` en Workers que lo usan.

### Seguridad

Este cambio no añade procesamiento de tarjetas, webhooks, pagos, acreditaciones de Coins ni movimientos INFYNITY. No cambia la configuración de precios ni tablas financieras. La puerta de acceso integrada depende de un RPC con sesión autenticada y del plan real; el código fuente de GitHub es público y, por tanto, un usuario técnicamente avanzado podría reutilizar su código fuera de la plataforma. La exclusividad comercial que se vende es el acceso integrado y el flujo de trabajo, no propiedad exclusiva de algoritmos del navegador.

### Componentes abiertos investigados para fases futuras (NO disponibles en la suscripción actual)

- [pdf-lib](https://github.com/Hopding/pdf-lib) (MIT): unión, separación y organización de documentos PDF en el navegador.
- [Tesseract.js](https://github.com/naptha/tesseract.js): OCR local de imágenes; requiere descargar modelos al dispositivo y evaluar rendimiento.
- [Excalidraw](https://github.com/excalidraw/excalidraw) (MIT): diagramas y pizarras editables para creadores.
- [Reframe](https://github.com/reframe-oss/reframe): recorte y exportación de video desde el navegador; evaluar licencia, compatibilidad y memoria.

No se promete que estas funciones futuras estén disponibles hoy ni se cobra por ellas. Antes de agregarlas debe revisarse licencia exacta, seguridad, UX y costo de CPU/memoria.

### Verificaciones

- El Estudio y la nueva página de Planes se publicaron en Cloudflare; `/estudio` cargó correctamente como visitante, y la pantalla de acceso cerrado está visible.
- El generador ZIP pasó una comprobación estructural con dos archivos (cabeceras locales, directorio central, número de entradas).
- Se verificó la sintaxis de JavaScript de los módulos.
- Queda pendiente la **prueba real con una sesión Premium** en un navegador para confirmar el tránsito completo por el proxy de autenticación y las interacciones de ZIP/QR/SEO en todos los dispositivos.
- Cloudflare Browser Rendering alcanzó la cuota HTTP 429 al intentar la inspección adicional de `/planes`.

### Recomendación de monetización

Mantener Gratis útil y Premium orientado a productividad repetida. No inventar descuentos de Coins, acceso a material externo ni monetización garantizada. Mostrar claramente el carácter no automático de las solicitudes de suscripción hasta que la pasarela de pagos esté verificada.