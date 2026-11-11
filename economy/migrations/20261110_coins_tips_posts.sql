-- UNIVERSHZRW / 2026-11-10: Propinas de Coins: transacción atómica, sin dinero ni INFT.
-- No crea nuevos usuarios ni altera saldos anteriores.
CREATE TABLE IF NOT EXISTS private.uhz_coin_tip_config(
  key text PRIMARY KEY CHECK (key='platform'),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.uhz_coin_tip_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.uhz_coin_tip_config FROM PUBLIC, anon, authenticated;

INSERT INTO private.uhz_coin_tip_config(key,recipient_user_id)
SELECT 'platform',p.user_id FROM public.community_profiles p
JOIN auth.users u ON u.id=p.user_id AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
WHERE p.display_name='UNIVERSHZRW'
ORDER BY p.created_at LIMIT 1
ON CONFLICT(key) DO NOTHING;

CREATE TABLE IF NOT EXISTS private.uhz_coin_tips(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 donor_user_id uuid NOT NULL REFERENCES auth.users(id),
 recipient_user_id uuid NOT NULL REFERENCES auth.users(id),
 resource_kind text NOT NULL CHECK(resource_kind IN ('resource','eco')),
 resource_id uuid NOT NULL,
 recipient_kind text NOT NULL CHECK(recipient_kind IN ('creator','platform')),
 amount_coins integer NOT NULL CHECK(amount_coins BETWEEN 1 AND 100),
 request_id uuid NOT NULL,
 donor_ledger_id bigint REFERENCES public.community_coin_ledger(id),
 recipient_ledger_id bigint REFERENCES public.community_coin_ledger(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT uhz_tip_distinct_users CHECK(donor_user_id <> recipient_user_id),
 CONSTRAINT uhz_tip_once UNIQUE(donor_user_id,request_id)
);
CREATE INDEX IF NOT EXISTS uhz_coin_tips_donor_time ON private.uhz_coin_tips(donor_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS uhz_coin_tips_recipient_time ON private.uhz_coin_tips(recipient_user_id,created_at DESC);
ALTER TABLE private.uhz_coin_tips ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.uhz_coin_tips FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE private.uhz_coin_tips IS 'Propinas voluntarias de Coins internos. No representan saldos monetarios, derechos de cobro ni INFYNITY.';

CREATE OR REPLACE FUNCTION public.uhz_coin_tip_options(p_kind text,p_identifier text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  resource_id uuid;
  resource_title text;
  author uuid;
  platform uuid;
  creator_name text;
  platform_name text;
  actor uuid:=auth.uid();
BEGIN
  IF p_identifier IS NULL OR length(p_identifier)>140 OR p_kind NOT IN ('resource','eco') THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_resource');
  END IF;
  IF p_kind='resource' THEN
    SELECT r.id,r.title,r.creator_user_id INTO resource_id,resource_title,author
    FROM public.content_resources r
    WHERE (r.id::text=p_identifier OR r.legacy_id=p_identifier)
      AND r.publish AND r.record_status='ACTIVO'
      AND r.review_status ILIKE 'Verificado%'
    ORDER BY (r.id::text=p_identifier) DESC,r.modified_at DESC NULLS LAST,r.id LIMIT 1;
  ELSE
    SELECT e.id,e.title,e.created_by INTO resource_id,resource_title,author
    FROM private.uhz_eco_content e
    WHERE (e.id::text=p_identifier OR e.slug=p_identifier)
      AND e.state='published' AND e.review_state='approved' AND e.rights_verified
    ORDER BY (e.id::text=p_identifier) DESC,e.id LIMIT 1;
  END IF;
  IF resource_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_available'); END IF;
  SELECT c.recipient_user_id INTO platform FROM private.uhz_coin_tip_config c WHERE c.key='platform';
  IF platform IS NULL THEN RETURN jsonb_build_object('ok',false,'error','recipient_not_configured'); END IF;
  SELECT p.display_name INTO platform_name FROM public.community_profiles p WHERE p.user_id=platform;
  IF author IS NOT NULL AND author<>platform THEN
    SELECT p.display_name INTO creator_name FROM public.community_profiles p WHERE p.user_id=author;
  END IF;
  RETURN jsonb_build_object(
    'ok',true,'kind',p_kind,'id',resource_id,'title',resource_title,
    'platform',jsonb_build_object('label',coalesce(platform_name,'UNIVERSHZRW'),'available',true,'self',actor=platform),
    'creator',CASE WHEN author IS NOT NULL AND author<>platform THEN
      jsonb_build_object('label',coalesce(nullif(creator_name,''),'Creador'),'available',true,'self',actor=author)
      ELSE jsonb_build_object('available',false) END,
    'preset_coins',jsonb_build_array(1,5,10,25),
    'notice','Las donaciones son voluntarias, internas y no canjeables por dinero ni INFYNITY.'
  );
END $function$;

CREATE OR REPLACE FUNCTION public.uhz_coin_send_tip(
  p_kind text,p_identifier text,p_recipient text,p_coins integer,p_request_id uuid
)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 actor uuid := private.community_check_member();
 platform uuid; author uuid; recipient uuid; resource_id uuid; resource_title text;
 prior private.uhz_coin_tips%ROWTYPE;
 balance bigint := 0; day_spent bigint := 0;
 donor_event bigint; recipient_event bigint; tip uuid := gen_random_uuid();
 recipient_label text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Inicia sesión para apoyar con Coins' USING errcode='42501'; END IF;
 IF p_request_id IS NULL OR p_coins IS NULL OR p_coins NOT BETWEEN 1 AND 100
    OR p_identifier IS NULL OR length(p_identifier)>140
    OR p_kind NOT IN ('resource','eco') OR p_recipient NOT IN ('creator','platform') THEN
   RAISE EXCEPTION 'Datos de donación inválidos' USING errcode='22023';
 END IF;
 -- La misma cuenta no puede gastar en paralelo con esta acción ni con desbloqueos.
 PERFORM pg_advisory_xact_lock(hashtextextended('uhz-eco:'||actor::text,0));
 SELECT * INTO prior FROM private.uhz_coin_tips WHERE donor_user_id=actor AND request_id=p_request_id;
 IF prior.id IS NOT NULL THEN
   IF prior.amount_coins<>p_coins OR prior.resource_kind<>p_kind
     OR prior.recipient_kind<>p_recipient OR prior.resource_id::text<>p_identifier THEN
     -- Permitir reintentos que usen el ID normalizado guardado.
     IF prior.amount_coins<>p_coins OR prior.resource_kind<>p_kind
       OR prior.recipient_kind<>p_recipient THEN
       RAISE EXCEPTION 'Esta solicitud ya se utilizó para otra donación' USING errcode='22023';
     END IF;
   END IF;
   RETURN jsonb_build_object('ok',true,'already_processed',true,'tip_id',prior.id,'coins',prior.amount_coins);
 END IF;
 IF p_kind='resource' THEN
   SELECT r.id,r.title,r.creator_user_id INTO resource_id,resource_title,author
   FROM public.content_resources r
   WHERE (r.id::text=p_identifier OR r.legacy_id=p_identifier)
     AND r.publish AND r.record_status='ACTIVO'
     AND r.review_status ILIKE 'Verificado%'
   ORDER BY (r.id::text=p_identifier) DESC,r.modified_at DESC NULLS LAST,r.id LIMIT 1;
 ELSE
   SELECT e.id,e.title,e.created_by INTO resource_id,resource_title,author
   FROM private.uhz_eco_content e
   WHERE (e.id::text=p_identifier OR e.slug=p_identifier)
     AND e.state='published' AND e.review_state='approved' AND e.rights_verified
   ORDER BY (e.id::text=p_identifier) DESC,e.id LIMIT 1;
 END IF;
 IF resource_id IS NULL THEN RAISE EXCEPTION 'Publicación no disponible' USING errcode='22023'; END IF;
 SELECT c.recipient_user_id INTO platform FROM private.uhz_coin_tip_config c WHERE c.key='platform';
 recipient:=CASE p_recipient WHEN 'platform' THEN platform ELSE author END;
 IF recipient IS NULL OR (p_recipient='creator' AND author=platform) THEN
    RAISE EXCEPTION 'Esta publicación no tiene un creador vinculado; elige UNIVERSHZRW' USING errcode='22023';
 END IF;
 IF actor=recipient THEN RAISE EXCEPTION 'No puedes enviarte Coins a ti mismo' USING errcode='22023'; END IF;
 IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id=recipient AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL) THEN
   RAISE EXCEPTION 'El destinatario no está habilitado' USING errcode='22023';
 END IF;
 SELECT coalesce(sum(coins_delta),0) INTO balance FROM (
   SELECT coins_delta FROM public.community_coin_ledger WHERE user_id=actor
   UNION ALL SELECT coins_delta FROM private.community_coin_journal WHERE user_id=actor
 ) transactions;
 IF balance<p_coins THEN
   RETURN jsonb_build_object('ok',false,'error','insufficient_coins','balance',greatest(balance,0));
 END IF;
 SELECT coalesce(sum(amount_coins),0) INTO day_spent FROM private.uhz_coin_tips
 WHERE donor_user_id=actor AND created_at>=(date_trunc('day',now() AT TIME ZONE 'America/Mexico_City') AT TIME ZONE 'America/Mexico_City');
 IF day_spent+p_coins>200 THEN
    RETURN jsonb_build_object('ok',false,'error','daily_limit','remaining_daily',greatest(200-day_spent,0));
 END IF;
 INSERT INTO public.community_coin_ledger(user_id,contribution_id,event_type,coins_delta,note)
 VALUES(actor,NULL,'manual_adjustment',-p_coins,'Propina a '||p_recipient||' por publicación '||resource_id::text||' ['||tip::text||']')
 RETURNING id INTO donor_event;
 INSERT INTO public.community_coin_ledger(user_id,contribution_id,event_type,coins_delta,note)
 VALUES(recipient,NULL,'manual_adjustment',p_coins,'Propina recibida por '||resource_id::text||' ['||tip::text||']')
 RETURNING id INTO recipient_event;
 INSERT INTO private.uhz_coin_tips
 (id,donor_user_id,recipient_user_id,resource_kind,resource_id,recipient_kind,amount_coins,request_id,donor_ledger_id,recipient_ledger_id)
 VALUES(tip,actor,recipient,p_kind,resource_id,p_recipient,p_coins,p_request_id,donor_event,recipient_event);
 SELECT display_name INTO recipient_label FROM public.community_profiles WHERE user_id=recipient;
 RETURN jsonb_build_object('ok',true,'already_processed',false,'tip_id',tip,'coins',p_coins,
   'balance',balance-p_coins,'recipient',coalesce(recipient_label,'Creador'));
END $function$;
REVOKE ALL ON FUNCTION public.uhz_coin_send_tip(text,text,text,integer,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.uhz_coin_send_tip(text,text,text,integer,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.uhz_coin_tip_options(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uhz_coin_tip_options(text,text) TO anon,authenticated;
