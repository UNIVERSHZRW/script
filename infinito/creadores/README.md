# Integración INFINITO en Creadores · saldo

## Estado publicado

**Página:** https://univershzrw.com/creadores?seccion=saldo

La sección se llama **Coins e INFINITO**. Conserva el saldo de Coins y permite conectar una cartera EIP-1193 para consultar INFT cuando exista contrato oficial en Polygon PoS. Los Gold previamente ganados y su historial se conservan en paneles plegados; **no han sido convertidos, descontados ni borrados**.

## Arquitectura

- El HTML de Creadores vive en el Worker existente `univershzrw`, variable de plantilla `Be`; solo se modificó dicha plantilla.
- El Worker secundario `univershzrw-inft-creadores` entrega los recursos desde `/creadores/_inft*` sin interceptar el resto de la página.
- Rutas estáticas: `/creadores/_inft/style.css`, `/creadores/_inft/app.js`.
- Endpoint de estado: `GET /creadores/_inft/status`, obtiene el estado del contrato de `univershzrw-moneda` por un service binding privado.
- `main-creator-template.js` contiene la plantilla exacta de producción para restaurar o actualizar la variable `Be`. El Worker completo de UNIVERSHZRW **no** se duplica en este repositorio; respaldo sin rutas en Cloudflare: `univershzrw-backup-20261105-before-inft-creadores`.

## Lo que sí funciona

- La cuenta ya existente en UNIVERSHZRW alimenta `#coinBalance`; el panel nuevo observa ese mismo saldo. No hay saldo independiente inventado.
- Conexión voluntaria EIP-1193 (MetaMask u otras carteras compatibles). No se solicitan semillas ni claves.
- Consulta `balanceOf` al token **solo** después de publicación del contrato oficial en Polygon. Sin contrato muestra que no existe emisión.
- Estado de canje consultable, actualización de la página, validación local de cantidades enteras y saldo.
- Acceso a INFINITO y a su documentación.
- Gold anterior conservado en `#goldBalance`, `#goldHistory` y en la base de datos.

## Lo que todavía NO se puede activar con seguridad

**El canje Coins → INFT está bloqueado** por el backend, además del botón, porque no existe un token INFT oficial emitido ni tesorería con liquidez, tasa ejecutable ni sistema de liquidación. Mostrar una cifra de INFT al usuario sin transferir tokens reales constituiría un saldo ficticio. No se debita ningún Coin ni Gold.

Para operar con valor real, diseñar y auditar un servicio servidor que autentique sesión, calcule cotización con vigencia, reserve el saldo de Coins atómicamente, firme/envíe la transacción financiada en blockchain, compruebe el recibo y concilie el saldo con una política de compensación ante fallos. Deben existir controles de idempotencia, límites, antiabuso, auditoría y cumplimiento legal según el modelo final.

## Verificaciones efectuadas

Se comprobó la página publicada y su vista móvil, visibilidad de la sección INFINITO, componentes de Coins, existencia de Gold histórico y protección del botón de canje. Se comparó el Worker original respaldado con el actual: **solo cambió la plantilla de Creadores**. No se inició sesión con credenciales privadas ni se probó un canje monetario, puesto que todavía no está disponible.
