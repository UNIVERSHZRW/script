# INFYNITY (INFT) — contrato ERC-20 propuesto

**No está desplegado ni autorizado para recibir dinero.** Código fuente para auditoría y pruebas.

- OpenZeppelin Contracts v5.7.0 y Solidity 0.8.28; Polygon PoS (chain ID 137).
- Token ERC-20 INFYNITY / INFT, 18 decimales, exactamente **10,000,000 INFT** creados una sola vez y enviados a la tesorería.
- Sin función de emisión posterior, cobro de comisión, bloqueo selectivo ni proxy modificable.
- Pausa de emergencia bajo una dirección de gobierno (usar Safe multifirma) y cambio de gobierno en dos pasos.

## Pruebas

```sh
cd infynity/token
forge install --no-git OpenZeppelin/openzeppelin-contracts@v5.7.0
forge build
forge test -vv
```

## Activación pendiente

1. Aprobar tokenomics y efectuar revisión jurídica y AML/KYC en México.
2. Crear tesorería y Safe multifirma con firmantes independientes.
3. Compilar, probar, auditar y desplegar primero en testnet Polygon Amoy.
4. Tras autorizar mainnet, desplegar y verificar código, contrato y reservas.
5. Configurar las direcciones en admin.univershzrw.com/inft. El servicio `uhz-inft-wallet` ya contempla verificar transferencias Polygon 137.
6. No habilitar compra, venta ni conversiones Coins/INFT sin conciliación, antifraude, liquidez y aprobación final.

**No subir claves privadas ni secretos al repositorio.** Los Coins siguen siendo créditos internos separados del token y la compra de INFT no garantiza una subida de precio.

El suministro de 10 millones está fijado en `INITIAL_SUPPLY`; el constructor únicamente recibe las direcciones de tesorería y gobierno. No acepta un parámetro para crear más o menos unidades. Esta propuesta todavía no se ha desplegado en mainnet.
