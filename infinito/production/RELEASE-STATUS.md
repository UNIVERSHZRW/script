# INFINITO — Registro de implementación de UNIVERSHZRW

## Portal público
- URL: https://univershzrw.com/criptomoneda
- Cloudflare Worker: \`univershzrw-moneda\`
- Cabecera, estilo y acceso integrado con UNIVERSHZRW.
- Red propuesta para la emisión: **Polygon PoS, chain ID 137**.
- Lectura pública: \`GET /criptomoneda/chain/status\` y \`GET /criptomoneda/chain/tx/0x<64-hex>\` (solo consulta, no custodia ni claves).
- Conexión directa EIP-1193 a la cartera del visitante; la aplicación no pide frase semilla ni realiza envíos de fondos.
- Lógica de blockchain: dos RPC públicos fijos, sin URL arbitraria, con timeout y comprobación del resultado. El explorador externo es PolygonScan.
- El token puede recibir dirección oficial SOLO por configuración del Worker mediante \`INFT_TOKEN_ADDRESS\` después de un despliegue autorizado. Al detectarse código en dicha dirección, el portal consulta \`totalSupply\` con \`eth_call\` y puede consultar \`balanceOf\` desde la cartera del usuario. **Actualmente NO hay dirección oficial configurada.**
- El servicio nunca debe presentar un hash de Polygon como transferencia INFT hasta que el contrato oficial configurado haya emitido el evento esperado. Aun después, deben publicarse código, hash de creación, auditoría y dirección verificada.
- **0** tokens reales confirmados, **0** monedas metálicas verificadas, **sin precio real ni canje habilitado**.

## Prototipos desactivados
- \`univershzrw-infinito-terminal\`: rutas de laboratorio ya no ejecutan movimientos; la portada anterior redirige al portal.
- \`univershzrw-infinito-mercado\`: solicitudes de operaciones del antiguo laboratorio devuelven HTTP 410; cron desactivado.
- \`univershzrw-infinito-fisica\`: antigua portada física redirige a la sección pública de modelos 3D.
- Las tablas D1 y sus datos históricos se preservan, sin convertirlos a saldos monetarios. No se borraron cuentas.

## Seguridad y evidencia
- Reglas de CSP y de restricción de contenido, no iframe, no cookies compartidas con endpoints RPC, RPC allowlist, respuestas no cacheadas para comprobaciones.
- GitHub CI del contrato compiló y aprobó **14 pruebas**, ver ejecución: https://github.com/UNIVERSHZRW/script/actions/runs/42150152946
- El contrato Solidity es ERC-20 de 21 millones de suministro fijo propuesto y la bóveda tiene validador EIP-712 de un solo canje.
- **No existe auditoría independiente**. Las pruebas automatizadas no garantizan que el código o el servidor sean invulnerables.
- El código del portal está guardado en esta rama; el enlace de la PR sirve como registro público de cambios. No sustituye registro en cadena.

## Activación que no debe fingirse
1. Revisión legal y comercial para México, y política de tesorería/venta pública.
2. Confirmar red y las direcciones reales de multisig y del firmante.
3. Ejecutar testnet, auditoría externa y pruebas de seguridad.
4. Desplegar desde una cartera bajo control del usuario (requiere gas POL, firma y claves que no comparte con el asistente).
5. Verificar código y contrato en PolygonScan; registrar transacción y dirección en UNIVERSHZRW y configurar \`INFT_TOKEN_ADDRESS\`.
6. Habilitar canje físico solo cuando exista acuñación real y reserva de 1 INFT por pieza en bóveda en cadena.
7. Establecer políticas AML/PLD, impuestos, privacidad, comisiones y términos si aplica a la operación.

**No comercializar INFT ni pedir dinero en este estado.**
