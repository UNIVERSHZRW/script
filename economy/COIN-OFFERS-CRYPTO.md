# UNIVERSHZRW · Paquetes de Coins y pasarela de criptomonedas

## Cambios publicados el 9 de noviembre de 2026

- Ruta `/planes` en el Worker existente `univershzrw-planes`.
- Paquetes:
  - 50 Coins base, $50 MXN, +5 promocionales (**10 %**), total 55.
  - 150 Coins base, $150 MXN, +23 promocionales (**aproximadamente 15 %**, redondeado al Coin entero más cercano), total 173.
  - 500 Coins base, $500 MXN, +100 promocionales (**20 %**), total 600.
- Las cantidades personalizadas fuera de esos tres paquetes no incluyen bono.
- Cards de paquete seleccionables. Cálculo del importe y el bono actualizado al cambiar de paquete o introducir un número.
- Retirado el botón «Registrar solicitud sin cobro». El formulario antiguo no realiza nuevas solicitudes desde este botón.
- Favicon `/_uhz/univershzrw-favicon.svg` incorporado.
- Pie de página **completo y original**, extraído del Worker principal `univershzrw`, con recursos existentes `/_uhz/site-footer.css` y `/_uhz/site-footer.js`.
- Se mantiene el acceso a funciones gratuitas y la membresía de Planes.

## Persistencia en Supabase

La función `public.uhz_eco_custom_pack_request` ahora conserva el bonus de 5 / 23 / 100 para solicitudes **nuevas** de 50 / 150 / 500 Coins, de forma que no se anuncian porcentajes diferentes de los registrados.

No se ha modificado ningún saldo ni recalculado solicitudes antiguas. La función sigue devolviendo `paid:false`, `credited:0`. Registrar una solicitud no cobra ni acredita.

La tabla actual distingue `base_coins` y `bonus_coins` por solicitud, **pero el saldo total de Coins no tiene una segregación completa en monederos canjeables/no canjeables**. Antes de dar bonos al saldo debe garantizarse que los promocionales no puedan convertirse a INFT, retirarse o emplearse para operaciones con salida de fondos.

## Cobro real por criptomonedas: bloqueo deliberado

El botón «Pagar con criptomonedas» está presentado, pero **deshabilitado**: `GET /planes/crypto/status` devuelve `ready:false` y no genera instrucciones de depósito. No se puede afirmar que el cobro real está habilitado.

La plataforma no ha conectado una cuenta de un procesador de criptomonedas, una billetera receptora oficial, una autorización comercial para vender créditos canjeables o un flujo de acreditación atómica con reversos.

### Pasarela a integrar

NOWPayments admite facturas para comercios y precios en MXN, con API de facturación e IPN firmadas. Documentación oficial:
- https://nowpayments.io/api
- https://nowpayments.zendesk.com/hc/en-us/articles/21345824322717-API-and-endpoint-description
- https://nowpayments.zendesk.com/hc/en-us/articles/21395546303389-IPN-and-how-to-setup
- https://nowpayments.io/supported-coins

**No enlazar la API key ni el secreto IPN en archivos públicos de GitHub, scripts del navegador ni mensajes del chat.** Registrar las credenciales mediante Supabase Edge Function Secrets o Cloudflare Worker Secrets y usar acceso exclusivo de servidor.

### Pasos mínimos para habilitar cobros auténticos

1. Abrir y verificar una cuenta comercial de NOWPayments, registrar billetera receptora y obtener aceptación expresa para la venta de créditos internos con posible conexión a activos virtuales.
2. Configurar en secretos el API Key y el IPN Secret de ese comercio, y validar el ambiente elegido.
3. Crear orden de Coins ligada a usuario y folio únicos; verificar en el servidor precio, moneda y bonus vigente.
4. Crear factura alojada por el proveedor, y mostrar URL únicamente del dominio oficial HTTPS.
5. Validar la firma de cada webhook; además, verificar identificador, monto, moneda, número de confirmaciones y estado consultando la API del proveedor. No fiarse de mensajes del comprador, capturas ni páginas de retorno.
6. En una transacción atómica, acreditar Coins base y bonus *por separado*, con origen e idempotencia. Si falta una de estas garantías, mantener el cobro bloqueado.
7. Gestionar errores y pagos parciales; implementar conciliación, reembolsos y controles sobre fondos y reservas.
8. Comprobar obligaciones fiscales, mercantiles y de prevención de lavado de dinero en México antes de habilitar operaciones que permitan conversión Coins ↔ INFT.

## Verificación del despliegue

- Cloudflare confirmó publicación exitosa, favicon, pie de página completo y etiquetas promocionales.
- La vista renderizada de `https://univershzrw.com/planes` mostró los bonos, pie de página y favicon sin errores de carga.
- El JavaScript incrustado pasó comprobación de sintaxis y la página contiene un único cierre de documento.
- En Supabase se verificaron las tres ramas de los bonos en el procedimiento de solicitudes.
- Los cobros cripto permanecen desactivados. **No se recibió dinero, no se acreditaron Coins y no se expusieron direcciones ni secretos.**
