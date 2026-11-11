# Modelo seguro de Coins, campañas y Premium · propuesta técnica 2026-11-10

Este cambio añade funciones puras con pruebas. **No cobra dinero, acredita Coins, habilita minería, convierte INFT ni libera retiros.** El despliegue financiero necesita una integración transaccional y revisión manual.

## Reglas no negociables
- 1 Coin base = $1 MXN en paquetes actuales. Cambiar a 10 Coins por peso es solo redenominar; **no** disminuye el costo de un bono del 10–20 %.
- Tres orígenes distintos en el ledger: `paid-coins` (consumo asignado a ingreso **cobrado, conciliado y no revertido**), `promo-coins` y `mined-coins` (uso interno, no convertibles). Las regalías de autor son saldos separados y solo pueden salir de ingresos netos verificables.
- Compra realizada con Coins promocionales/minados: solo acceso a creadores que lo autoricen y 0 pesos de regalía, salvo subsidio **realmente financiado** por una campaña independiente. No puede haber retiro, canje INFYNITY ni auto-compra con retorno económico.
- Auto-consumo: mismo `user_id` o cuentas relacionadas con mismo beneficiario real = sin regalía. Anomalías no concluyentes (VPN, IP, dispositivo) se envían a revisión; nunca se presume que una VPN prueba fraude.
- Campañas: presupuesto y límite por persona bloqueados en la base de datos por transacción, verificación de tarea, análisis antifraude y máximo por participante. No basta con un chequeo en JS; son necesarios locks y unicidad por beneficiario.
- Contenido comprado con Coins pagados: 70 % de **ingreso neto atribuible a ese consumo**, 30 % para plataforma, no 70/30 del valor facial.
- Premium $49 / 30 días: conservar precio en fase de prueba; contenido solo del catálogo cuyos autores **acepten** el modelo Premium. Del ingreso neto confirmado (ejemplo IVA y comisión estimados) se asigna 30 % a un fondo mensual, 70 % a plataforma y operación. No se paga tarifa por cada clic/archivo. El fondo se reparte por participaciones de consumo auditadas, evitando reproducciones repetitivas de la misma persona.
- El acceso Premium a contenidos de autores requiere consentimiento de derechos, política comercial de reparto, gating efectivo y pruebas de sesión. **No anunciar acceso universal hasta implementar ese control.**
- No hacer conversiones Coin → INFT mientras falten custodia, reservas, contratos y autorización legal.

## Escenario puramente ilustrativo (IVA 16 %, tarifa estimada 3.49 % + $4 más IVA)
- Venta de $100 → IVA incluido $13.79, procesamiento $8.69, neto $77.52; fondo de autores $54.26, plataforma $23.26 antes de costos.
- Premium de $49 → neto calculado $35.62; fondo máximo $10.68 y plataforma $24.94 por suscripción según redondeo conservador a centavos.
- El costo de infraestructura y obligaciones fiscales efectivas pueden hacer que el precio de $49 sea inviable. No está probado que sea rentable. Tarifas y tratamiento de IVA deben verificarse con el proveedor y asesor fiscal.

## Integración posterior
1. Libro de lotes de Coins con `origin`, `payment_id`, neto por lote, `spend_id` idempotente, expiración, reversiones y saldos no negativos. Sin confiar en datos del frontend.
2. Operación transaccional: certificar cobro → crear lote pagado + lote de bono, nunca mezclar; registro del consumo con bloqueo y reparto de ingreso neto proporcional a lotes pagados.
3. Campañas con presupuesto reservado antes de emitir créditos y límite por beneficiario, monitoreo de identidad y cola de revisión. Limitar abuso sin pedir vigilancia invasiva a usuarios legítimos.
4. Fondo Premium con `pool_id` verificado, regla mensual inmutable, deduplicación de consumos, prevención de cuentas relacionadas y conciliación antes de liberar regalías.
5. Pruebas negativas: pago revertido, saldo promocional, varias cuentas, concurrencia, duplicados, fraude, errores de identidad y falta de fondos. No habilitar pagos/retiros sin éxito en esos casos.
