# INFINITO (INFT) | UNIVERSHZRW

**Estado: prototipo técnico. NO emitido, NO desplegado, NO disponible para compra ni para canje.**

Este directorio desarrolla un candidato de token ERC-20 de suministro fijo (no una cadena de bloques propia), un contrato de depósito de fondos para ediciones físicas y documentos públicos de transparencia. El sistema actual de UNIVERSHZRW y su RPC de mercado **no demuestran emisión de tokens**. No confundas una referencia contable con un precio ejecutable.

## Arquitectura propuesta
- **INFT:** ERC-20 sobre una red EVM pública aún por elegir. Propuesta de máximo fijo: 21,000,000 INFT, 18 decimales, todos emitidos inicialmente a una tesorería declarada. No hay función de minteo posterior, blacklist ni administrador del token.
- **Tesorería:** dirección multisig, asignaciones y movimientos públicos; política de distribución todavía por acordar. La emisión inicial NO es una venta ni implica circulación.
- **Moneda física:** pieza metálica coleccionable (sin valor digital) o edición canjeable, claramente rotulada. Antes de fabricar una edición canjeable, la tesorería registra y deposita físicamente en el contrato de depósito la cantidad total de INFT reservada para la pieza.
- **Canje:** el dueño descubre un código secreto bajo sello inviolable, lo verifica en un servicio seguro y solicita un comprobante EIP-712 firmado y vinculado a su dirección. Solo la firma con un identificador de pieza registrada permite sacar los fondos reservados. El contrato no genera INFT nuevos.
- **Coins/Gold:** contabilidad separada. Ningún saldo interno pasa a ser INFT automáticamente; se necesita liquidación, conciliación, reglas y respaldo real.

## Archivos
- `contracts/InfinitoToken.sol`: suministro fijo sin funciones de emisión futura.
- `contracts/InfinitoPhysicalVault.sol`: reserva y canje una sola vez con EIP-712.
- `test/Infinito.t.sol`: pruebas de invariantes y fraudes típicos.
- `docs/WHITEPAPER.md`: reglas y pendientes públicos.
- `docs/EDICION-FISICA.md`: fabricación y proceso de canje seguro.
- `docs/CONDICIONES-BORRADOR.md`: divulgaciones y límites para revisión jurídica.
- `assets/moneda-prototipo.svg`: arte vectorial conceptual para cotizar, **sin saldo**.

## Pruebas locales
Se requiere Foundry y las bibliotecas publicadas de OpenZeppelin y forge-std:
```bash
cd infinito
forge install OpenZeppelin/openzeppelin-contracts@v5.4.0 foundry-rs/forge-std --no-commit
forge test -vvv
```
La integración con el frontend, el servicio que valida secretos y firma comprobantes, la auditoría, red y cadena de despliegue NO están incluidos. Nunca usar claves reales en GitHub ni en la web.

## Control de puesta en marcha
1. Revisar tratamiento legal, fiscal, contractual y prevención de lavado en México, operador responsable y registros aplicables.
2. Seleccionar red, desplegar en testnet, revisar contrato y pruebas de extremo a extremo, contratar revisión independiente.
3. Publicar direcciones, código verificado, supply, tesorería, asignaciones, permisos, red, precios ejecutables y riesgos.
4. Diseñar servicio de canje con claves fuera del frontend, controles de intentos, auditoría, inventario y antifraude. Solo entonces evaluar una venta.

**Nunca afirmar que INFT es Bitcoin, está respaldado por Banco de México, tiene paridad con MXN, liquidez, valor garantizado o está descentralizado como Bitcoin.**
