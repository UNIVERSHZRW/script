# Tienda UNIVERSHZRW: pagos protegidos y medios disponibles

## Estado real al 9 de noviembre de 2026

La tienda sigue en modo catálogo: TIENDA_MODULO_ACTIVO = false. Los métodos Mercado Pago y SPEI figuran configurados en la tabla de integraciones, pero eso no certifica una transacción real completada. Esta actualización no abre ventas ni cambia claves, saldos o precios.

## Cambios entregados

- Interfaz del carrito con dos vías: Mercado Pago Checkout Pro (tarjeta de débito/crédito, OXXO, SPEI y saldo de Mercado Pago cuando el proveedor los ofrezca) o SPEI directo con conciliación posterior.
- Bloque de métodos de pago dentro de la tienda; mensajes de transparencia, costos y métodos condicionados a disponibilidad. Copia de CLABE y referencia en el comprobante SPEI.
- Lista estricta de dominios HTTPS autorizados para redirigir a Checkout Pro; no almacenar tarjetas ni CVV en UNIVERSHZRW.
- Regreso al carrito/tienda al completar Checkout Pro, conservando la revisión del estado desde el servidor. Ningún parámetro de retorno equivale a pago aprobado.
- Validación de método elegido según el pedido, moneda de la transacción, firma del webhook e idempotencia para aprobaciones repetidas.
- Los fallos de verificación de webhook devuelven error para que Mercado Pago pueda reintentarlos; no se descuenta stock dos veces por una notificación repetida.

## Archivos y despliegues

- shop/payment-guide.js y shop/payment-guide.css: presentación de pagos y acciones para facilitar transferencias.
- shop/apply-payment-guide.mjs: parche reproducible del Worker univershzrw-tienda. No necesita instalar Medusa completo.
- shop/edge-payments/index.ts: versión 4 desplegada en Supabase.
- shop/edge-mp-webhook/index.ts: versión 9 desplegada en Supabase.
- shop/payment-guide.test.mjs: pruebas de estructura, sintaxis, redirección y controles de pago.

## Flujo del comprador

1. El usuario selecciona artículos, cantidades, envío y medio de pago en la tienda.
2. El backend recalcula precios, stock, licencias y envío, genera folio y registra el pedido.
3. Si elige Mercado Pago, se crea una preferencia por pedido y se abre el checkout oficial del proveedor.
4. El proveedor permite elegir entre sus métodos disponibles para esa cuenta y operación.
5. Si elige SPEI directo, recibe CLABE y referencia; puede adjuntar comprobante, pero se mantiene EN REVISION hasta verificación.
6. El webhook autentica la notificación y consulta el resultado a la API de Mercado Pago. Se valida la moneda, el importe mediante la función SQL protegida, el pedido y el método.
7. El comprador consulta el estado verdadero del pedido; solo un cobro conciliado habilita preparación o entrega autorizada.

## Seguridad y alcance

La tienda no solicita números completos de tarjetas, NIP, CVV o contraseñas bancarias. Los secretos siguen en Supabase Edge Functions. El procedimiento SQL que confirma pagos no permite ejecución directa a roles anon ni authenticated (verificado).

Los archivos de terceros permanecen en sus proveedores: UNIVERSHZRW no los aloja ni retransmite. Coins, Premium e INFYNITY son flujos separados y este parche no activa ni acredita saldos.

## Checklist obligatorio antes de cobrar de verdad

1. Verificar cuenta vendedora de Mercado Pago, identidad, banco receptor, credenciales productivas, webhooks y firmas, sin revelar secretos.
2. Probar pagos de prueba aprobados y rechazados, OXXO/SPEI pendiente y vencido, devoluciones y contracargos; comprobar la conciliación con el pedido.
3. Revisar envíos reales, inventario, condiciones de devolución, protección de datos, comprobantes y facturación cuando corresponda.
4. Confirmar que los métodos de cobro disponibles realmente aparezcan en la cuenta de Mercado Pago. La documentación del proveedor no garantiza disponibilidad para todos los compradores.
5. Solo después de pasar esas pruebas y recibir aprobación comercial activar TIENDA_MODULO_ACTIVO. Esta actualización no lo modifica.

## Verificación actual

Se comprobó la sintaxis completa del cliente de tienda y se probaron destinos auténticos y falsos para la redirección. Supabase confirmó funciones payments v4 y mp-webhook v9. Quedan pendientes pruebas end-to-end con sandbox y revisión visual en distintos navegadores.