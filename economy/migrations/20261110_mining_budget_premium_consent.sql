
-- UNIVERSHZRW: campaña de minería con tope global, sin auto-pagos ni saldos monetarios.
-- No se crea campaña activa ni se convierten Coins históricos.
CREATE TABLE IF NOT EXISTS private.uhz_eco_mining_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_key text NOT NULL UNIQUE CHECK (campaign_key ~ '^[a-z0-9_]{4,48}$'),
  title text NOT NULL CHECK (char_length(title) BETWEEN 4 AND 160),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  budget_coins integer NOT NULL CHECK (budget_coins BETWEEN 1 AND 1000000),
  spent_coins integer NOT NULL DEFAULT 0 CHECK (spent_coins >= 0),
  max_per_account integer NOT NULL DEFAULT 5 CHECK (max_per_account BETWEEN 1 AND 100),
  max_per_day integer NOT NULL DEFAULT 5 CHECK (max_per_day BETWEEN 1 AND 20),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uhz_eco_mining_campaigns_dates CHECK (ends_at > starts_at),
  CONSTRAINT uhz_eco_mining_campaigns_budget CHECK (spent_coins <= budget_coins)
);
ALTER TABLE private.uhz_eco_mining_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.uhz_eco_mining_campaigns FROM PUBLIC, anon, authenticated;
ALTER TABLE private.uhz_eco_mission_claims
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES private.uhz_eco_mining_campaigns(id);
CREATE INDEX IF NOT EXISTS uhz_eco_claims_campaign_account_idx
  ON private.uhz_eco_mission_claims(campaign_id,user_id,local_day);
COMMENT ON TABLE private.uhz_eco_mining_campaigns IS
  'Presupuesto total de Coins promocionales, cerrado de forma predeterminada; no es dinero ni INFT.';
COMMENT ON COLUMN private.uhz_eco_mission_claims.campaign_id IS
  'Identifica presupuesto consumido; las reclamaciones históricas quedan sin campaña.';

-- Sin presupuesto activo, la interfaz no debe ofrecer minería como operativa.
CREATE OR REPLACE FUNCTION public.uhz_eco_missions()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
WITH campaign AS (
 SELECT greatest(budget_coins-spent_coins,0) AS remaining, max_per_day
 FROM private.uhz_eco_mining_campaigns
 WHERE enabled AND starts_at<=now() AND ends_at>now() AND spent_coins<budget_coins
 ORDER BY starts_at DESC,id DESC LIMIT 1
), missions AS (
 SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.sort_order),'[]'::jsonb) AS items
 FROM (
  SELECT mission_key,title,description,reward_coins,sort_order
  FROM private.uhz_eco_missions
  WHERE enabled AND NOT requires_manual_review
    AND EXISTS(SELECT 1 FROM campaign WHERE remaining>=reward_coins)
  ORDER BY sort_order LIMIT 20
 ) m
)
SELECT jsonb_build_object(
 'missions',(SELECT items FROM missions),
 'max_daily_coins',coalesce((SELECT least(max_per_day,5) FROM campaign),0),
 'campaign_remaining_coins',coalesce((SELECT remaining FROM campaign),0),
 'campaign_status',CASE WHEN EXISTS(SELECT 1 FROM campaign) THEN 'active' ELSE 'paused' END,
 'notice','Las recompensas son promocionales, nunca dinero ni INFT; sujetas a presupuesto.'
);
$function$;

-- En una sola transacción: validar cuenta, campaña, presupuesto y límites; después acreditar.
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

-- Los autores ven su propio contenido sin crear una compra ficticia.
-- Premium sólo desbloquea contenido con consentimiento explícito del autor
-- (details.premium_included=true), nunca transforma visitas en regalías.
CREATE OR REPLACE FUNCTION public.uhz_eco_unlock(p_content_id uuid, p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 actor uuid := CASE WHEN auth.uid() IS NULL THEN NULL ELSE private.community_check_member() END;
 item private.uhz_eco_content%ROWTYPE;
 total bigint;
 journal_id bigint;
 subscription_active boolean := false;
 premium_eligible boolean := false;
 existing boolean := false;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Inicia sesión para conservar tus desbloqueos' USING errcode='42501'; END IF;
 IF p_content_id IS NULL OR p_request_id IS NULL THEN
  RAISE EXCEPTION 'Falta identificador de petición' USING errcode='22023';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('uhz-eco:'||actor::text,0));
 SELECT * INTO item FROM private.uhz_eco_content
 WHERE id=p_content_id AND state='published' AND rights_verified
 AND review_state='approved' AND length(license_evidence)>=20 FOR SHARE;
 IF item.id IS NULL THEN RAISE EXCEPTION 'Este contenido no está disponible' USING errcode='22023'; END IF;
 IF item.created_by=actor THEN
  RETURN jsonb_build_object('ok',true,'already_unlocked',true,'self_access',true,'charged',0,'url',item.media_url);
 END IF;
 SELECT EXISTS(SELECT 1 FROM private.uhz_eco_unlocks
 WHERE user_id=actor AND content_id=item.id) INTO existing;
 SELECT EXISTS(SELECT 1 FROM public.community_memberships
 WHERE user_id=actor AND plan='premium' AND status='active'
 AND (begins_at IS NULL OR begins_at<=now()) AND expires_at>now()) INTO subscription_active;
 premium_eligible := coalesce(item.details->>'premium_included','false')='true';
 IF existing OR (subscription_active AND premium_eligible) OR item.coins_cost=0 THEN
  RETURN jsonb_build_object('ok',true,'already_unlocked',true,
   'subscription',subscription_active AND premium_eligible,'charged',0,'url',item.media_url);
 END IF;
 SELECT coalesce(sum(coins_delta),0) INTO total FROM (
  SELECT coins_delta FROM public.community_coin_ledger WHERE user_id=actor
  UNION ALL SELECT coins_delta FROM private.community_coin_journal WHERE user_id=actor
 ) x;
 IF total<item.coins_cost THEN
  RETURN jsonb_build_object('ok',false,'error','insufficient_coins',
  'cost',item.coins_cost,'balance',greatest(total,0),'premium_eligible',premium_eligible);
 END IF;
 INSERT INTO public.community_coin_ledger(user_id,contribution_id,event_type,coins_delta,note)
 VALUES(actor,NULL,'manual_adjustment',-item.coins_cost,'Desbloqueo permanente: '||item.title)
 RETURNING id INTO journal_id;
 INSERT INTO private.uhz_eco_unlocks(user_id,content_id,charged_coins,coin_ledger_id,request_id)
 VALUES(actor,item.id,item.coins_cost,journal_id,p_request_id);
 RETURN jsonb_build_object('ok',true,'already_unlocked',false,'charged',item.coins_cost,'url',item.media_url);
END;
$function$;
