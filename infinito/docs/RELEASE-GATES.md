# INFINITO — Controles obligatorios para emisión real

**Estado actual: SIN lanzamiento público ni precio real.** El frontend de UNIVERSHZRW puede conectar una cartera Web3 y consultar pruebas públicas de Polygon, pero no puede crear firmas, contratos o monedas físicas sin el operador y sus claves.

## Cadena de confianza verificable

1. Código fuente Solidity publicado, dependencias fijadas y revisión de cambios en Git.
2. Compilación limpia y todas las pruebas unitarias, de fuzzing y de integración aprobadas por CI; no equivalen a una auditoría independiente.
3. Auditoría de seguridad por un tercero independiente y resolución verificable de hallazgos.
4. Multisig con control humano de tesorería y propietario del depósito físico; respaldos y rotación.
5. Red y parámetros oficiales aprobados; red sugerida: **Polygon PoS, chain ID 137**. Alternativa de validación previa: Amoy 80002.
6. Dirección y código fuente del token verificados en PolygonScan. Publicar hash de transacción de despliegue, bytecode y metadatos del compilador. No usar dirección arbitraria del usuario.
7. Suministro, propiedad de tesorería, restricciones, distribución y eventos de emisión confirmados con llamadas de solo lectura a blockchain. Verificar hash/código y coincidencia de source.
8. Depósito de 1 INFT por pieza física **antes** de asignar serie y codificación; inventario y controles de anti-doble-canjes auditados.
9. Contrato de fabricación y logística: relieve, tolerancias, sello antimanipulación, serial y verificación de custodia.
10. Dictamen jurídico y fiscal mexicano según modelo exacto (emisión, oferta, cambio, custodia, prevención de lavado y protección al consumidor). La Ley Fintech/Circular 4/2019 contiene restricciones especiales a las entidades reguladas.
11. Verificador público de hash + enlace PolygonScan; cada estado de emisión debe indicar claramente el origen de la prueba.
12. Plan de incidentes; monitor de eventos, transferencias relevantes, pausas de servicios web no financieros, control de acceso y revocación de credenciales.
13. Publicar condiciones, privacidad, comisiones, riesgos y limitaciones antes de aceptar dinero.

## Qué está disponible en el frontend principal

- /criptomoneda: estado oficial, conexión EIP-1193 sin exportar claves, explorador y diseño visual.
- /criptomoneda/chain/status: estado de integración con Polygon y dirección oficial **solo si ha sido configurada y detectada**. La variable `INFT_TOKEN_ADDRESS` no está configurada.
- /criptomoneda/chain/tx/<txhash>: obtención de recibo de Polygon; no interpreta una transacción de terceros como INFT.
- /criptomoneda/transparencia: texto vigente de divulgación.
- /criptomoneda/terminal: laboratorio antiguo **aislado**, sin conexión económica con el token real ni autorización para cobros; no promover sus saldos como monetarios.

## Despliegue no ejecutado

Archivo `infinito/script/DeployInfinito.s.sol`. Solo el titular autorizado de una cartera con fondos y decisión documentada puede ejecutar un despliegue en cadena. Requiere `INFT_TREASURY_MULTISIG`, `INFT_VOUCHER_SIGNER`, `INFT_VAULT_OWNER_MULTISIG` y `INFT_DEPLOYER_PRIVATE_KEY` en un entorno seguro local, nunca en Git, Cloudflare Worker ni una publicación.

El proyecto **no incluye ni solicita** claves privadas reales, promesas de rentabilidad ni venta anticipada.

## Límites de la verificabilidad

- Un hash de transacción real acredita un evento en la red indicada, pero **no necesariamente** que fue una operación INFT: debe confirmarse que el evento fue emitido por el contrato oficial.
- Una copia de datos de una base privada, incluso acompañada de SHA-256, no sustituye una prueba anclada en una blockchain pública.
- Código abierto no garantiza ausencia de vulnerabilidades. El contrato debe superar auditoría; las carteras, claves, interfaces web, RPC y procesos físicos tienen riesgos independientes.
- Un token ERC-20 sobre Polygon no es una blockchain nueva ni posee la misma red, minería o descentralización que Bitcoin.
