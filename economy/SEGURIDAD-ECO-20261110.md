# UniversHZRW · Control económico y seguridad · 10/11/2026

## Publicado
- `/planes`: explicación de dinero, Coins, bonificaciones, minería, fondo de creadores, acceso Premium y propuesta de escala.
- Supabase: `private.uhz_eco_mining_campaigns` presupuestos globales transaccionales, intervalos de vigencia, topes por persona y por día.
- Supabase: `private.uhz_eco_mining_participants` whitelist privada. Cada participante aprobado usa una única cuenta por campaña, identificado por seudónimo criptográfico revisado (nunca por IP/VPN sola).
- `public.uhz_eco_claim`: bloqueo de presupuesto con `SELECT ... FOR UPDATE`; acreditación atómica e idempotencia por actividad/día; verifica miembro y participante aprobado.
- `public.uhz_eco_missions`: muestra `paused`, 0 misiones y 0 de límite cuando no hay presupuesto activo.
- `public.uhz_eco_unlock`: el dueño abre su propio artículo con 0 Coins cobrados; Premium solo desbloquea contenido editorialmente aprobado con `details.premium_included=true` por decisión del autor.
- Campaña piloto `piloto_200_coins`: **200 Coins, 0 gastados, DESACTIVADA**; no habilitar sin revisión de identidad ni evidencia de presupuesto publicitario.

## Política operativa (propuesta, NO programa de pagos activado)
- Coin comprado: **$1 MXN por Coin** en paquetes vigentes; 50+5, 150+23 y 500+100.
- Coin regalado/minado: únicamente promocional; nunca valor monetario, cashout ni INFT. No debe crear automáticamente regalías.
- Ventas de contenido: 70% del ingreso **neto verificado y atribuible al creador**; 30% plataforma. No es 70% del precio con IVA y pasarela.
- Premium: **$49 MXN / 30 días**, catálogo autorizado. Propuesta de **30% del ingreso neto** al fondo colectivo de creadores y 70% a UniversHZRW para sus costos; no pagar una cantidad fija por cada apertura.
- Ejemplo Premium de $49 (IVA 16%; pasarela 3.49% + $4 + IVA): $35.62 netos estimados, $10.69 fondo y $24.93 plataforma, **antes de costos operativos**. No garantiza rentabilidad.
- Escala de **10 Coins por MXN 1** es un EJEMPLO no activado. Requiere migrar saldos históricos, precios y eventos contables atómicamente; cambiar nombres/unidades no financia bonos.
- No hay todavía reservas, pasarela liquidada, cuenta mercantil ni fondo de regalías certificado. **No activar retiros, canjes Coins→INFYNITY ni acreditaciones cobrables.**

## Invariantes y pruebas
1. Saldo de campaña nunca mayor que presupuesto; una transacción actualiza gasto, ledger y reclamo o revierte todo.
2. Ninguna cuenta recibe Coins minados sin campaña vigente y participante aprobado.
3. Un seudónimo de identidad no puede aprobar varias cuentas en la misma campaña.
4. Ningún creador obtiene ingreso de un desbloqueo propio, ni de visitas sin un fondo real verificado.
5. Bonos se registran separados de base en solicitudes; **la cartera final aún requiere segregación por lotes antes de aceptar cobros**.
6. `uhz_eco_missions()` respondió `paused`, `missions=[]`, `max_daily_coins=0`; Cloudflare confirmó publicación del Worker y Browser Rendering comprobó la sección.
7. No se movieron pagos, saldos ni retiros durante esta actualización.

## Pendiente para operar dinero real
- Contabilidad por lotes, control de reembolsos, verificación de pagos, impuestos y comisión neta con conciliación.
- Integración de eventos de consumo legítimo con el fondo de creadores y flujo de consentimiento individual.
- Administrador para programar campañas y verificar participantes con proceso de protección de datos; sin registro de PII en claro.
- Antifraude con señales de comportamiento, ritmo de transacciones, vínculos entre cuentas, revisión humana y apelación; ninguna regla de IP bloquea por sí sola.
- Revisión jurídica de contenidos, licencias, impuestos, activos virtuales e identidad en México.
