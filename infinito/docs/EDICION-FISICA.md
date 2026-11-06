# INFINITO físico — especificación previa a fabricación

## Dos productos distintos
**A. Coleccionable sin saldo:** pieza metálica con símbolo ∞, nombre INFINITO, año y serie. Debe indicar explícitamente «PIEZA DE COLECCIÓN — SIN SALDO / SIN VALOR MONETARIO». No prometer canje ni limitar injustificadamente derechos de compradores.

**B. Canjeable (NO AUTORIZADA AÚN):** una pieza asociada a una cantidad fija de INFT previamente inmovilizada por `fundCoin` en la red y contrato publicados. Nunca acuñar o vender piezas cargadas sin comprobar primero que los fondos están depositados.

## Diseño inicial para cotización
- Diámetro nominal: 38 mm; espesor propuesto: 2.5 mm, validable con fabricante.
- Material propuesto: aleación base no preciosa; no anunciar oro/plata sin ensayos y documentación.
- Acabado: relieve del infinito en anverso; reverso con marca de proyecto, año, serie grabada y descripción de edición.
- Canto: relieve o estriado; tolerancias, peso y material contractual en presupuesto del proveedor.
- Arte en `assets/moneda-prototipo.svg`; el proveedor deberá convertir textos a curvas y preparar matriz, tolerancias y sangrías.

## Serie y seguridad
- ID público de pieza distinto de secreto; el ID se almacena como `bytes32` y se muestra en consulta.
- Código secreto generado criptográficamente (mínimo 128 bits de entropía), único, bajo etiqueta inviolable. **No se incluye en QR público, foto, empaque de fabricante ni repositorio.**
- El QR público enlaza a la consulta de estado; no al código privado.
- Emisión de voucher: un backend autenticado verifica el secreto, aplica límites de intentos, bloqueos antifraude, idempotencia y presenta el monto/chain ID/contrato/dirección; firma un mensaje EIP-712 restringido a la cartera del usuario y con plazo corto.
- El usuario envía el voucher al contrato. El contrato entrega INFT a la dirección firmada y registra `redeemed=true`; la pieza queda de recuerdo sin saldo digital.
- La validación del código y el sistema de firma deben desarrollarse, evaluarse y probarse. El contrato NO valida por sí mismo códigos secretos impresos ni demuestra que un comprador legítimo poseía la pieza.

## Control de calidad
Prueba visual, peso, material, número de serie, inventario de códigos y sellos, trazabilidad, custodia, pérdidas, venta a menores, devoluciones, errores de activación y soporte. Emitir certificado verificable solo cuando haya un registro público real.

## Proceso de fabricación
1. Cotizar muestra SIN SALDO.
2. Verificar marca y derechos de diseño.
3. Aprobar relieve, diámetro, tolerancias, empaque y leyendas.
4. Fabricar muestra y ensayar resistencia.
5. Para canjeable, no avanzar a comercialización sin auditoría, fondos depositados, backend protegido, marco contractual y revisión legal.

**Nunca grabar «moneda de curso legal», «BTC», «respaldada por BANXICO» o «1 INFT = 1 MXN».**
