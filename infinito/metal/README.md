# INFINITO · Panel de evolución y moneda física de laboratorio

**Publicado:** https://univershzrw.com/criptomoneda

## Alcance real
- INFT no está desplegado en blockchain ni tiene precio de mercado. La emisión real verificada sigue en **0** y la compraventa real deshabilitada.
- `INFT-TEST` y `Coins-TEST` son saldos internos de prueba sin valor monetario, separados de los Coins/Gold de producción.
- No presentar el índice de actividad del laboratorio como cotización ni rentabilidad financiera.

## Índice y gráficas
- Worker `univershzrw-infinito-mercado`, ruta `/criptomoneda/mercado/index?period=day|week|month`, D1 `univershzrw-infinito-testnet`.
- Cada 5 minutos el cron toma una medición; la interfaz consulta cada 30 s.
- Base 100; el índice se calcula de compras menos ventas acumuladas verificadas en `history`. No hay cambios aleatorios.
- Los periodos 24 h / 7 d / 30 d solo muestran comparaciones cuando existe un punto histórico de esas fechas. La ausencia se muestra como *Sin historial previo*.

## Moneda física
- Visor CSS 3D: dos caras con acabado metálico ilustrativo, rotación táctil/con teclado y controles.
- Reverso muestra serie digital. Se pueden descargar vectores de ambas caras, sin raster:
  - https://univershzrw.com/criptomoneda/troquel/anverso.svg
  - https://univershzrw.com/criptomoneda/troquel/reverso.svg
- Referencia para fabricante: diámetro 38 mm, espesor propuesto 2.5 mm, canto estriado, aleación no preciosa con acabado dorado.
- Los SVG son **bocetos vectoriales**: antes de grabar se requiere convertir fuentes a curvas, revisar tolerancias y contratar un taller de acuñación.

## Certificados de prueba
- Endpoint: `/criptomoneda/mercado/reserve` (POST, sesión verificada). Aparta 1 INFT-TEST y genera una serie aleatoria `UHZ-INFT-[20 hex]`; código privado aleatorio de 128 bits visible **una única vez**, se almacena solo SHA-256.
- `/mine`: listado exclusivo por usuario; `/verify`: comprueba serie + código sin exponer al dueño; `/public?serie=`: datos públicos limitados; `/cancel`: desbloquea el 1 INFT-TEST, exactamente una vez.
- Las restricciones y los saldos se manejan con triggers atómicos de D1, límite de 10 certificados activos por cuenta y 1,000 totales de laboratorio.
- La cifra de piezas metálicas **realmente producidas y verificadas permanece en cero**. El certificado no confirma envío o acuñación, ni es título de propiedad sobre metal.
- La autenticación es la misma de UNIVERSHZRW mediante service binding `AUTH_APP`; los códigos privados no deben mostrarse a terceros.

## Archivos
`infinito/lab/` conserva la terminal HTML/CSS/JS/Worker. `infinito/metal/market-worker.mjs` implementa el índice y las reservas. `infinito/metal/schema.sql` documenta las tablas de D1.

## Pruebas de base de datos
- Aprobadas: crear reserva de 1 INFT-TEST; deducción de saldo; rechazo de nonce repetido; bloqueo con saldo 0; cancelación y devolución única; impedir reactivar certificado cancelado.
- Las cuentas sintéticas y certificados usados en pruebas se eliminaron. No se crearon tokens reales.
- El servicio de capturas del navegador tuvo un límite 429 durante la verificación visual final. No se verificó envío de órdenes desde una sesión autenticada ni la fabricación de metal.

## Antes de lanzar INFT real
Contrato on-chain desplegado en red escogida y verificado, auditoría, tesorería, mecanismo de custodia/bloqueo de 1 INFT real por pieza, costos de fabricación/entrega y logística, antifalsificación física, condiciones de canje, impuestos y revisión regulatoria mexicana. Las acciones reales seguirán apagadas hasta contar con esos requisitos.
