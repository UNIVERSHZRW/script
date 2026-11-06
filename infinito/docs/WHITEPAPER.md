# Documento técnico de INFINITO (INFT)
**Borrador v0.1 — 5 de noviembre de 2026 — UNIVERSHZRW**

> INFT NO ha sido emitido ni desplegado. Este documento no constituye una oferta de inversión ni una garantía de precio o de rescate.

## 1. Objetivo
Un activo digital de utilidad potencial para transferencias voluntarias y usos delimitados de UNIVERSHZRW, separado de los créditos internos Coins y de la contabilidad Gold de creadores. No se promete rentabilidad.

## 2. Arquitectura
Para reducir riesgos de escribir una blockchain sin auditorías, la primera versión **propuesta** usa un contrato ERC-20 sobre una blockchain EVM pública. La liquidación depende de la red elegida y sus comisiones. No es un clon de Bitcoin, no tiene minería propia ni consenso PoW, y UNIVERSHZRW será responsable de la distribución inicial y su información pública.

## 3. Parámetros propuestos (todavía no activos)
| Parámetro | Propuesta |
|---|---|
| Nombre | INFINITO |
| Símbolo | INFT |
| Decimales | 18 |
| Suministro máximo | 21,000,000 INFT |
| Emisión inicial | 21,000,000 a tesorería pública |
| Emisión futura | Prohibida por el contrato de token |
| Quema | El usuario puede enviar a dirección irreversible; sin función administrativa de quema |
| Congelación / listas negras | Sin privilegios administrativos en el token |
| Red y chain ID | Por decidir y publicar |
| Dirección de contrato | No existe |
| Cartera recomendada | Por decidir; una cartera compatible con la red, bajo control del usuario |
| Tipo de cambio con MXN y Coins | Ninguno fijado ni prometido |
| Ganancia / recompra | No garantizadas |

**21 millones es una propuesta de límite, no una promesa de equivalencia económica con BTC.**

## 4. Distribución y conflictos de interés
Por definir y publicar ANTES de despliegue: asignaciones a tesorería, desarrollo, comunidad, reservas (si existen), equipo y posibles bloqueos temporales. Se revelarán beneficiarios, direcciones, políticas de venta y control de tesorería. El contrato de token es fijo, pero la tesorería controla la distribución inicial.

## 5. Transferencias y finalización
Los usuarios transfieren INFT desde sus propias carteras. No existe un servidor de UNIVERSHZRW que pueda borrar una transacción confirmada. Los errores de dirección y el robo de claves suelen ser irreversibles. Una transferencia EVM requiere moneda nativa de red para pagar gas.

## 6. Piezas físicas
Dos líneas separadas:
- Coleccionable **SIN SALDO**. Metal + número de serie, no confiere derechos sobre INFT.
- Canjeable **PRE-FINANCIADA**. El registro de una pieza en el depósito mueve su cantidad de INFT a un contrato público. El usuario descubre un secreto de un solo uso y solicita un comprobante firmado EIP-712 para su cartera. El depósito canjea esa pieza una sola vez. El fabricante de metales nunca recibe los secretos.

El firmante y el operador del validador de secretos constituyen un punto de confianza centralizado; se necesita auditoría, protección de claves, atención de reclamaciones y plan de incidentes.

## 7. Evidencia pública
Antes de habilitar compras: dirección y código verificado del token y depósito, cadena y explorer, máxima emisión, saldos de tesorería, depósitos/rescates, políticas de inventario, contratos de servicio, comisiones, elegibilidad, condiciones de compra, aviso de privacidad, soporte y riesgos. Una métrica de ingresos web de 30 días NO es una cotización real ni prueba de liquidez.

## 8. Riesgos y prohibiciones de comunicación
Es posible perder el 100% del valor. Existen riesgos de custodia, malware, falla de cadena, volatilidad, error de envío, fallo de operador, firma de comprobantes, reglas regulatorias y fraude de monedas físicas. No publicar balances ficticios, historial inventado ni anuncios de autorización gubernamental.

## 9. Gobernanza y actualizaciones
El token fijo no puede actualizarse por administrador. El contrato de depósito tiene propietario con transferencia de dos pasos y permite rotar el firmante; no puede emitir INFT ni retirar depósitos de piezas sin una firma de canje. La evolución se documentará con cambios numerados; los contratos desplegados y sus direcciones serán inmutables una vez anunciados.

## 10. Cumplimiento
La operación en México exige dictamen específico antes de venta, intercambio, custodia, redención o manejo de recursos de terceros: Ley para Regular las Instituciones de Tecnología Financiera, Circular 4/2019, legislación de prevención de lavado, protección al consumidor, fiscalidad y protección de datos según el modelo efectivo. El mero carácter privado no exime del análisis.

Referencias: https://bitcoin.org/es/bitcoin-documento ; https://eips.ethereum.org/EIPS/eip-20 ; https://eips.ethereum.org/EIPS/eip-712 ; https://sidof.segob.gob.mx/notas/docFuente/5515623 ; https://sidof.segob.gob.mx/notas/docFuente/5552303
