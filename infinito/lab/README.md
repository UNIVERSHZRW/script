# INFINITO LAB · Terminal de pruebas UNIVERSHZRW

**Desplegada en:** https://univershzrw.com/criptomoneda/terminal

Esta es una **simulación contable persistente**, no una blockchain ni token negociable. No toca balances de producción ni tiene cobros, retiros o claves privadas.

## Infraestructura
- Worker Cloudflare: `univershzrw-infinito-terminal` con rutas `/criptomoneda/terminal*` en dominios apex y www.
- Base D1: `univershzrw-infinito-testnet` (e0122c45-54ed-487b-aa24-0d3ab5cf33aa).
- Autenticación mediante service binding `AUTH_APP` a `univershzrw-comunidad`, sesión por cookies, correo confirmado.
- D1 binding: `INFINITO_DB`.

## Funciones de prueba
1. Al abrir con una cuenta validada se crea automáticamente una dirección `INFT-XXXXXXXXXXXX`.
2. Asignación inicial una sola vez por usuario: **100 INFT-TEST y 1000 Coins-TEST**.
3. Transferencia a dirección registrada, valida saldo positivo y límites, operación atómica mediante trigger SQL.
4. Intercambio fijo **10 Coins-TEST = 1 INFT-TEST**; compras/ventas simuladas, nunca saldos reales.
5. Canje público de demostración `INFT-DEMO-2026`: una vez por cuenta, entrega 5 INFT-TEST; no simula propiedad de metal verdadero.
6. Explorador de hasta 50 movimientos con identificadores de registro no blockchain.

## Seguridad
- Sesión validada servidor-servidor mediante `AUTH_APP`, nunca aceptar `user_id` del navegador.
- POST JSON con comprobación de Origin; no CORS público; respuestas sin caché.
- Saldo no puede ser negativo (restricciones y guardias SQL); transferencias atómicas, saldo y bitácora en un solo trigger.
- Idempotencia de transferencias y swaps por nonce por usuario, único.
- Asignaciones y códigos de laboratorio irrepetibles.
- Límite de 100 movimientos diarios para envíos/intercambios.
- No existe clave privada, wallet Web3 o conexión bancaria en este simulador.

## Estructura
- `worker.mjs`: Worker desplegado, incluye copia integrada de HTML/CSS/JS para servir sin dependencias externas.
- `index.html`, `style.css`, `app.js`: código fuente de la interfaz.
- `schema.sql`: estructura y triggers de la base de pruebas.

## Pruebas ejecutadas
Dos cuentas sintéticas: asignación de saldo, envío de 20 INFT, compra de 5 INFT por 50 Coins, canje 5 INFT; verificadas las cantidades resultantes (85/950 y 25/0). Se comprobaron los rechazos de sobregiro, autoenvío y doble canje sin cambio de saldos. Se borraron las cuentas sintéticas al finalizar. **No se ha verificado un inicio de sesión real en navegador ni se han emitido activos on-chain.**

## Paso a producción real
Separar el contrato ERC-20 / la bóveda de un ledger de pruebas. Antes de habilitar la venta/canje/depósito de valor real: desplegar contratos en red de pruebas pública, auditar, publicar cadena y direcciones, implementar infraestructura de llaves y canje físico, revisar obligaciones regulatorias mexicanas, condiciones y riesgos. **No presentar INFT-TEST como una criptomoneda de valor real.**

## Integración con UNIVERSHZRW — actualización
- La URL principal `/criptomoneda` abre directamente la terminal completa; las rutas de guía y transparencia siguen disponibles.
- Encabezado, menú y temas de UNIVERSHZRW desde recursos compartidos, sin segundo encabezado independiente.
- Login y logout visibles dentro de INFINITO mediante service binding `AUTH_APP`; el servicio de identidad de UNIVERSHZRW emite las cookies protegidas. No se crea una base separada de usuarios.
- Página de parámetros: suministro propuesto, emisión real pendiente, cartera de prueba, saldo total demo, cuentas, operaciones y volumen reciente, con datos de Cloudflare D1 en `/criptomoneda/terminal/api/parameters`.
- Las cantidades MXN se muestran como no disponibles mientras no haya mercado real. El laboratorio conserva exclusivamente saldos `INFT-TEST` y `Coins-TEST`.
- La variante `www` redirige al dominio oficial para que la autenticación funcione en un solo origen.
- Operaciones de prueba registradas en D1 mediante restricciones SQL; se comprobó en navegador sin sesión que aparecen login, encabezado y métricas en cero.
- **No se ha probado el acceso con credenciales reales del usuario ni el envío entre dos cuentas reales.**

## Correcciones de presentación y accesibilidad
- Se restauró el logotipo U de UNIVERSHZRW habilitando las imágenes SVG embebidas dentro de la política CSP de la terminal.
- La cabecera de teléfono usa el logotipo compartido, acceso a cuenta y el botón **Menú** desplegable. Verificada visualmente con pantalla de 390 px.
- También quedaron integradas las rutas de guía y pieza física con el encabezado compartido.
- INFINITO tiene enlaces de acceso desde los módulos de Economía y desde la tienda de Coins, sin tocar las operaciones financieras vigentes.
- Verificada en navegador la ruta `/criptomoneda`, la autenticación sin sesión, los parámetros del laboratorio y la presentación de escritorio y teléfono. No se ha autenticado con cuentas reales ni se ha lanzado el token en una blockchain.
