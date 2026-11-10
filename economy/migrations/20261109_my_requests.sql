-- UNIVERSHZRW · historial privado de solicitudes para el Centro Económico.
-- Solo lectura. No puede efectuar cobros, entregar Coins ni cambiar solicitudes.
CREATE OR REPLACE FUNCTION public.uhz_economy_my_requests_v1()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  actor uuid := private.community_check_member();
  result jsonb;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Inicia sesión para consultar tus solicitudes' USING errcode='42501';
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(q) ORDER BY q.created_at DESC, q.id DESC),'[]'::jsonb)
  INTO result
  FROM (
    SELECT *
    FROM (
      SELECT id, 'personalizado'::text AS origin, base_coins AS base_coins,
             bonus_coins AS bonus_coins, total_coins AS total_coins,
             proposed_mxn AS reference_price_mxn, status::text AS status, created_at
      FROM private.uhz_eco_coin_custom_requests
      WHERE user_id = actor
      UNION ALL
      SELECT id, 'paquete'::text, coins::int, 0::int, coins::int,
             reference_price_mxn::int, status::text, created_at
      FROM private.uhz_eco_coin_pack_requests
      WHERE user_id = actor
    ) own
    ORDER BY created_at DESC, id DESC
    LIMIT 30
  ) q;
  RETURN result;
END
$fn$;

REVOKE ALL ON FUNCTION public.uhz_economy_my_requests_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.uhz_economy_my_requests_v1() FROM anon;
GRANT EXECUTE ON FUNCTION public.uhz_economy_my_requests_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION public.uhz_economy_my_requests_v1() TO service_role;