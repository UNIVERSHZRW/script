-- Alinear catálogo con el consentimiento Premium del autor y el acceso propio.
DO $guard$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.uhz_catalog_api(text,jsonb)'::regprocedure);
 IF position('AND expires_at>now()) INTO v_plan;' in definition)=0
   OR position('INTO existing;' in definition)=0 THEN
   RAISE EXCEPTION 'No coincide la versión esperada de la función de catálogo';
 END IF;
 definition:=replace(definition,
  'AND expires_at>now()) INTO v_plan;',
  'AND expires_at>now() AND coalesce(item.details->>''premium_included'',''false'')=''true'') INTO v_plan;');
 definition:=replace(definition,
  'WHERE user_id=actor AND content_id=item.id) INTO existing;',
  'WHERE user_id=actor AND content_id=item.id) INTO existing; existing := coalesce(existing,false) OR item.created_by=actor;');
 EXECUTE definition;
END $guard$;
