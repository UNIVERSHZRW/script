# Donaciones de Coins por publicación | UNIVERSHZRW | 10 noviembre 2026

## Funcionalidad desplegada
- En fichas de resultados y en artículos aparece «♡ Apoyar con Coins». Ofrece 1, 5, 10 o 25 Coins y cantidad manual de 1 a 100.
- La cuenta UNIVERSHZRW existente está vinculada como destinataria verificada. Para cada artículo, la base de datos resuelve el autor vinculado por creator_user_id. Si no hay creador verificado, únicamente se permite donar a UNIVERSHZRW.
- El envío requiere iniciar sesión, elegir destinatario y confirmar. Función SQL uhz_coin_send_tip: resta Coins al donante y los acredita al receptor en una misma transacción, registra la operación con idempotencia y limita a 200 Coins diarios.
- El historial personal se consulta mediante uhz_coin_tip_my_history y aparece en /planes#uhz-my-tips.
- Administración vincula al creador real con uhz_coin_admin_assign_creator cuando existe prueba de autoría; queda auditado en private.uhz_coin_creator_assignments.
- Premium en catálogo requiere que el autor haya marcado details.premium_included=true; no hay autocobro por contenido propio.

## Planes
- Free: $0; 3 aportaciones, 3 carpetas; puede donar y recibir Coins.
- Premium: $49 MXN cada 30 días; 100 aportaciones y 100 carpetas; Estudio de Creadores y contenido que sus autores autoricen expresamente para Premium. Puede donar y recibir.
- Los paquetes de Coins mantienen sus precios actuales y bonos (50+5, 150+23, 500+100). No se activaron pagos reales.
- Coins donados son puntos internos. No generan automáticamente pagos monetarios, retiros ni conversión INFYNITY.

## Componentes de producción
- univershzrw-coins-tips-assets: JS y CSS publicados en /herramientas/coins-tip.js y /herramientas/coins-tip.css.
- univershzrw-home-compact: la ruta univershzrw.com/* sirve el buscador con el botón en resultados con parámetros de búsqueda.
- univershzrw-comunichat-nav: el JavaScript compartido carga la función de donaciones en las fichas /recurso/.
- univershzrw-article-inline-tools: contiene inyección de respaldo en artículos.
- univershzrw-planes: incluye comparación Free/Premium e historial.
- univershzrw-comunidad: expone uhz_coin_tip_options (público, entrada validada) y uhz_coin_send_tip / uhz_coin_tip_my_history (autenticados). Vinculación de autor restringida a administración.

## Versiones y seguridad CRÍTICA
- Comunidad actual: 6252f6f9-ae4c-419b-9deb-5ced6d129591, anterior ae93cf3c-2632-4c04-828c-75e984a17984. Los 7 bindings se preservaron con herencia estricta, incluidos SECRET_TEXT y límites de acceso.
- Principal univershzrw estable: b24e20b1-97b0-4098-96bc-5c8f5dadf04a, contiene ASSETS y el buscador. NO reemplazar con PUT simple sin bundle de archivos. El despliegue temporal 248 quitó ASSETS y provocó 503. SE REVERTIÓ y quedó el principal estable. Las versiones 248 y 249 carecen de assets y NO se deben desplegar.
- El botón se monta a través de Workers secundarios sin modificar la versión principal.
- Validación del navegador: homepage con búsqueda carga, ficha de artículo carga y botón visible en ambos.
- Validación API: consulta de destinatario devuelve 200; transferencias e historial sin iniciar sesión devuelven 401, no 404.
- En la migración: 12 publicaciones visibles, ninguna con creador_user_id; 0 propinas. No se asignaron autores ficticios.
- No se hizo transacción con un donante autenticado. La prueba end-to-end de dos cuentas requiere sesión real y saldo de prueba.

## Próximas verificaciones
1. Con dos cuentas de pruebas: donar 1 Coin, verificar movimiento doble, historial e idempotencia.
2. Revisar derechos y vincular autores reales en administración.
3. No activar retiros, cripto, ingresos monetarios ni conversión hasta verificación contable y legal.
