# UNIVERSHZRW · Economía unificada

## Estado de producción · 9 de noviembre de 2026

Publicada la ruta `https://univershzrw.com/economia/centro` mediante `univershzrw-economy-center` en Cloudflare; rutas apex y www. El endpoint `/economia/centro/api` consulta `uhz-economy-dashboard` en Supabase y **solo muestra el catálogo de planes**, sin publicar referencias financieras ni claves privadas.

El Centro económico muestra el catálogo actual (Gratis $0 / Premium $49 MXN por 30 días), consulta Coins y membresía mediante la sesión del usuario y permite registrar solicitudes de 5 a 50 Coins mediante la función existente `uhz_eco_custom_pack_request`. Las solicitudes no tienen cobro ni acreditación. Para Premium se reutiliza el endpoint actual `/api/public-social/membership` y no se activa un plan.

El plan visible en `/planes` recibe un script de sincronización `plan-sync.js` desde el Centro económico para corregir automáticamente discrepancias. Si el catálogo falla, no se afirma un precio antiguo. Menú compartido y menú de inicio incluyen la entrada directa «Centro económico». Se preservó el service binding `ORIGINAL_SITE` de ambos Workers.

## Integración de productos abiertos sin duplicar infraestructura

| Área | Reutilizar | Complemento |
| --- | --- | --- |
| Planes | `public.uhz_economy_plans` y membresías existentes | Patrones de facturación y suscripción de Stripe y Lago solo como referencia |
| Coins | `community_coin_ledger`, `private.community_coin_journal`, RPCs existentes | Patrones de store credit de Medusa Loyalty, sin instalar otro backend |
| Compra de Coins | Tienda Supabase y webhook de Mercado Pago existentes | Servicio de acreditación idempotente sólo tras cobro real verificado |
| INFYNITY | `infynity/finance` y `uhz-inft-wallet` existentes | OpenZeppelin para contrato auditado y Viem ya incluido |
| Cartera y retiros | Registro de solicitudes, saldos bloqueados y conciliación existentes | Verificaciones de firma, reservas, referencias y doble aprobación |
| Creadores | Libro de recompensas y movimientos de consumo existentes | Liquidación contra eventos autorizados y protección antifraude |

## Requisitos antes de completar los flujos de dinero

1. **Consolidación de saldos:** Coins comprados, ganados y promocionales deben tener lotes/orígenes y reglas diferentes de elegibilidad para canje. Evitar convertir directamente Coins de una compra con tarjeta revocable en un token irreversible.
2. **Pagos:** mantener compras desactivadas hasta certificar un cobro real, rechazo, vencimiento, reembolso, contracargo, notificación firmada y reintento; nunca acreditar saldo por retorno al sitio o captura de pantalla.
3. **Ledger:** transacciones PostgreSQL atómicas para debitar reserva y acreditar destinatario, no permitir valores negativos, usar una llave de idempotencia global única por cobro, reversión y settlement.
4. **Planes:** un solo catálogo real en Supabase; no anunciar Plata ni bonificaciones adicionales hasta que sean aplicables por una regla publicada y aprobada.
5. **INFYNITY:** registrar contrato ERC-20 auditado, tesorería, banco receptor y reservas reales; cotizaciones inmutables con vencimiento; pruebas sobre Polygon testnet; autorización legal/financiera específica para México.
6. **Operaciones financieras:** bloqueo de retiros y conversiones hasta reservas suficientes; no mezclar gastos operativos con fondos de usuarios; conciliación diaria e informes de auditoría.
7. **Permisos:** el cliente jamás tiene service_role; login firmado y sesión viva para cada acción; RLS; protecciones contra replay y CSRF; pruebas automatizadas de invariantes contables.
8. **Producto digital:** UniversHZRW no aloja, copia, descarga, retransmite ni sirve como proxy de contenido externo: la tienda conserva únicamente metadatos y referencias autorizadas.

## Estado auditado del proyecto

- `TIENDA_MODULO_ACTIVO` está en `false`; ningún pedido comercial registrado en las tablas consultadas.
- En `private.uhz_fin_config`, contrato INFT, tesorería y CLABE receptora no están registrados; la reserva informada es 0. Las cotizaciones, solicitudes y carteras de la sección financiera están vacías.
- Hay una función financiera con operaciones `coins_to_inft` e `inft_to_coins`, pero no hay cotización ni reserva para ejecutar intercambio real. No se desplegó ni acuñó token.
- El catálogo de base de datos conserva Gratis y Premium; no se creó un tercer plan ni se cambió el precio de $49.
- No se hicieron cobros, alteraciones de saldos, créditos promocionales ni autorizaciones de exchanges.

## Pruebas

- Cloudflare Browser Rendering confirmó la carga de `/economia/centro`, el catálogo Premium y la vista de cuenta sin sesión.
- La URL `/economia/centro/api` devolvió dos planes verificados con $0 y $49 y flags de venta e intercambio deshabilitados.
- Los Workers de navegación conservaron `ORIGINAL_SITE`; el sitio de planes se actualizó con sincronización de precios.
- `node --test economy/center.test.mjs` está disponible para comprobaciones unitarias; todavía falta ejecutar el conjunto en CI y pruebas autenticadas reales.
- La validación visual adicional de `/planes` se vio limitada por cuota HTTP 429 de Cloudflare Browser Rendering. Se inspeccionó el código publicado para comprobar la inclusión de `plan-sync.js`.

## Próxima fase de desarrollo

Prototipar el flujo compra -> pago verificado -> acreditación de Coins en un entorno de pruebas aislado, incorporando reembolsos y contracargos. Reutilizar el backend y la tabla de pedidos existentes, no montar Medusa/Lago completos. Para INFYNITY, proseguir únicamente con pruebas y revisión legal antes de cualquier intercambio público.

## Actualización operativa de historial y estado (9 nov. 2026)

- La página `/economia/centro` incorpora ahora **movimientos reales de Coins**, mediante el RPC de solo lectura `community_coin_history`, y **solicitudes personales** mediante el nuevo RPC `uhz_economy_my_requests_v1`.
- Este RPC se limita a las 30 solicitudes más recientes de la sesión y combina los dos sistemas anteriores: paquetes y cantidades personalizadas. No permite cambios de estado ni acreditaciones. Solo `authenticated` y `service_role` disponen de `EXECUTE`; `anon` no.
- Botón **Actualizar historial**, avisos claros de sesión y distinción entre solicitudes pendientes y saldo efectivamente acreditado.
- Se muestra el estado público de INFYNITY (emisión, precio publicado si existe, auditoría de reservas y posibilidad de retiros) desde el mismo dashboard público que informa los planes. No existen precios inventados.
- Accesos directos a los contenidos y al uso de Coins en el buscador.
- Se sincronizaron HTML, CSS y JS embebidos en el Worker público, con actualización de versiones de assets para evitar caché de la versión anterior.
- Cloudflare confirmó el despliegue del Worker; comprobación de sintaxis JavaScript positiva; RPC consultado y validado en permisos, `anon=false`, `authenticated=true`.

### Alcance de este cambio

No se habilitaron cobros con Mercado Pago, acreditaciones por pagos, reservas de tokens, compra/venta ni canje con valor real. El módulo financiero todavía no tiene contrato ni tesorería registrados. Ninguna solicitud pendiente debe representarse como una compra pagada.
