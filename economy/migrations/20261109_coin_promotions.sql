-- UNIVERSHZRW 2026-11-09: paquetes promocionales; nunca acredita Coins ni ejecuta pagos.
-- 50 Coins + 5 (10%), 150 + 23 (15% redondeado), 500 + 100 (20%).
-- Los bonos son promocionales y NO pueden ser canjeados por INFT o dinero.
CREATE OR REPLACE FUNCTION public.uhz_eco_custom_pack_request(p_base_coins integer,p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
 actor uuid := private.community_check_member();
 row_data private.uhz_eco_coin_custom_requests%ROWTYPE;
 bonus integer := CASE p_base_coins WHEN 50 THEN 5 WHEN 150 THEN 23 WHEN 500 THEN 100 ELSE 0 END;
BEGIN
 IF actor IS NULL THEN
  RAISE EXCEPTION 'Inicia sesión para solicitar un paquete' USING errcode='42501';
 END IF;
 IF p_request_id IS NULL OR p_base_coins NOT BETWEEN 1 AND 5000 THEN
  RAISE EXCEPTION 'Elige entre 1 y 5000 Coins' USING errcode='22023';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('eco-custom-request:' || actor::text,0));
 SELECT * INTO row_data FROM private.uhz_eco_coin_custom_requests
 WHERE user_id=actor AND request_id=p_request_id;
 IF row_data.id IS NULL THEN
  IF (SELECT count(*) FROM private.uhz_eco_coin_custom_requests
      WHERE user_id=actor AND created_at>now()-interval '1 day')>=3
  THEN
   RAISE EXCEPTION 'Ya alcanzaste el límite de solicitudes por día' USING errcode='22023';
  END IF;
  INSERT INTO private.uhz_eco_coin_custom_requests
    (user_id,request_id,base_coins,bonus_coins,total_coins,proposed_mxn)
  VALUES (actor,p_request_id,p_base_coins,bonus,p_base_coins+bonus,p_base_coins)
  RETURNING * INTO row_data;
 END IF;
 RETURN jsonb_build_object('ok',true,'folio',row_data.id,'base_coins',row_data.base_coins,
   'bonus_coins',row_data.bonus_coins,'total_coins',row_data.total_coins,
   'proposed_mxn',row_data.proposed_mxn,'paid',false,'credited',0,'status',row_data.status,
   'message','Paquete registrado sin cobro ni acreditación. Los bonos promocionales son para uso interno y no se pueden convertir a INFT o efectivo.');
END
$function$;