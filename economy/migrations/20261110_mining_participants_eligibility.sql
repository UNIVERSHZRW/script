
-- Una persona verificada por campaña: no confiar sólo en IP, VPN o cookies.
-- participant_key = seudónimo HMAC revisado por administrador, nunca dato personal en claro.
CREATE TABLE IF NOT EXISTS private.uhz_eco_mining_participants (
 campaign_id uuid NOT NULL REFERENCES private.uhz_eco_mining_campaigns(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 participant_key text NOT NULL CHECK (participant_key ~ '^[a-f0-9]{64}$'),
 approved_at timestamptz,
 revoked_at timestamptz,
 reviewed_by uuid REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(campaign_id,user_id),
 UNIQUE(campaign_id,participant_key),
 CONSTRAINT uhz_mining_participant_review CHECK (
  approved_at IS NULL OR reviewed_by IS NOT NULL
 )
);
ALTER TABLE private.uhz_eco_mining_participants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.uhz_eco_mining_participants FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE private.uhz_eco_mining_participants IS
'Lista privada de identidades revisadas, una sola cuenta por participante en cada campaña.';
COMMENT ON COLUMN private.uhz_eco_mining_participants.participant_key IS
'Identificador seudónimo derivado de verificación real. No usar IP, User-Agent, correo ni hash sin secreto como prueba de unicidad.';

CREATE OR REPLACE FUNCTION public.uhz_eco_claim(p_key text, p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 actor uuid := private.community_check_member();
 mission private.uhz_eco_missions%ROWTYPE;
 campaign private.uhz_eco_mining_campaigns%ROWTYPE;
 day_mex date := (now() at time zone 'America/Mexico_City')::date;
 day_spent integer := 0;
 account_spent integer := 0;
 ledger_id bigint;
 current_balance bigint := 0;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión con una cuenta verificada' USING errcode='42501'; END IF;
 IF p_request_id IS NULL OR p_key IS NULL THEN
  RAISE EXCEPTION 'Solicitud incompleta' USING errcode='22023';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('uhz-eco:'||actor::text,0));
 SELECT * INTO mission FROM private.uhz_eco_missions
 WHERE mission_key=p_key AND enabled AND NOT requires_manual_review;
 IF mission.mission_key IS NULL THEN
  RAISE EXCEPTION 'Actividad no disponible' USING errcode='22023';
 END IF;
 -- Bloqueo de fila: dos cuentas no pueden sobrepasar simultáneamente el presupuesto.
 SELECT * INTO campaign FROM private.uhz_eco_mining_campaigns
 WHERE enabled AND starts_at<=now() AND ends_at>now() AND spent_coins<budget_coins
 ORDER BY starts_at DESC,id DESC LIMIT 1 FOR UPDATE;
 IF campaign.id IS NULL THEN
  RAISE EXCEPTION 'No existe una campaña de minería activa con presupuesto' USING errcode='22023';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM private.uhz_eco_mining_participants p
  WHERE p.campaign_id=campaign.id AND p.user_id=actor
    AND p.approved_at IS NOT NULL AND p.revoked_at IS NULL
 ) THEN
  RAISE EXCEPTION 'Campaña disponible únicamente para participantes verificados' USING errcode='42501';
 END IF;
 IF EXISTS (
  SELECT 1 FROM private.uhz_eco_mission_claims
  WHERE user_id=actor AND mission_key=p_key AND local_day=day_mex
 ) THEN
  RETURN jsonb_build_object('ok',true,'already_claimed',true,'added',0,'day',day_mex);
 END IF;
 SELECT coalesce(sum(m.reward_coins),0) INTO day_spent
 FROM private.uhz_eco_mission_claims c
 JOIN private.uhz_eco_missions m ON m.mission_key=c.mission_key
 WHERE c.user_id=actor AND c.local_day=day_mex;
 SELECT coalesce(sum(m.reward_coins),0) INTO account_spent
 FROM private.uhz_eco_mission_claims c
 JOIN private.uhz_eco_missions m ON m.mission_key=c.mission_key
 WHERE c.user_id=actor AND c.campaign_id=campaign.id;
 IF day_spent+mission.reward_coins>least(campaign.max_per_day,5)
    OR account_spent+mission.reward_coins>campaign.max_per_account THEN
  RAISE EXCEPTION 'Límite de campaña o límite diario alcanzado' USING errcode='22023';
 END IF;
 IF campaign.spent_coins+mission.reward_coins>campaign.budget_coins THEN
  RAISE EXCEPTION 'Se agotó el presupuesto de minería' USING errcode='22023';
 END IF;
 UPDATE private.uhz_eco_mining_campaigns
 SET spent_coins=spent_coins+mission.reward_coins WHERE id=campaign.id;
 INSERT INTO public.community_coin_ledger(user_id,contribution_id,event_type,coins_delta,note)
 VALUES(actor,NULL,'manual_adjustment',mission.reward_coins,
  'Coin promocional de campaña '||campaign.campaign_key||': '||mission.title||' · '||day_mex::text)
 RETURNING id INTO ledger_id;
 INSERT INTO private.uhz_eco_mission_claims
 (user_id,mission_key,local_day,request_id,ledger_id,campaign_id)
 VALUES(actor,mission.mission_key,day_mex,p_request_id,ledger_id,campaign.id);
 SELECT coalesce(sum(coins_delta),0) INTO current_balance FROM (
  SELECT coins_delta FROM public.community_coin_ledger WHERE user_id=actor
  UNION ALL SELECT coins_delta FROM private.community_coin_journal WHERE user_id=actor
 ) t;
 RETURN jsonb_build_object(
  'ok',true,'already_claimed',false,'added',mission.reward_coins,
  'coins',greatest(current_balance,0),'day',day_mex,
  'campaign_remaining_coins',campaign.budget_coins-campaign.spent_coins-mission.reward_coins,
  'convertible',false);
END;
$function$;

