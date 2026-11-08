CREATE OR REPLACE FUNCTION public.uhz_catalog_media(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor uuid:=CASE WHEN auth.uid() IS NULL THEN NULL ELSE private.community_check_member() END; k text:=p_payload->>'key'; v jsonb;
BEGIN
 IF p_action='public_read' THEN
  RETURN jsonb_build_object('ok',EXISTS(SELECT 1 FROM private.uhz_catalog_images i WHERE i.key=k AND i.state='ready' AND EXISTS(SELECT 1 FROM private.uhz_eco_content e WHERE e.state='published' AND (e.details->>'cover'='https://univershzrw.com/_uhz/catalog-images/'||k OR e.details->'gallery' ? ('https://univershzrw.com/_uhz/catalog-images/'||k) OR e.details->'thumbnails' ? ('https://univershzrw.com/_uhz/catalog-images/'||k) OR e.details->>'cover_thumb'='https://univershzrw.com/_uhz/catalog-images/'||k))));
 END IF;
 IF actor IS NULL OR NOT private.uhz_license_admin() THEN RAISE EXCEPTION 'Solo administración' USING errcode='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('uhz-catalog-media',0));
 IF p_action='reserve' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('uhz-admin-storage',0));
  IF (SELECT coalesce(sum(CASE WHEN metadata->>'size' ~ '^[0-9]+$' THEN (metadata->>'size')::bigint ELSE 0 END),0) FROM storage.objects)+(SELECT coalesce(sum(expected_bytes),0) FROM private.uhz_admin_uploads WHERE status='reserved' AND expires_at>now())+(SELECT coalesce(sum(bytes),0) FROM private.uhz_catalog_images WHERE state='reserved' AND created_at>now()-interval '2 hours')+(p_payload->>'bytes')::bigint>(SELECT storage_budget*threshold_percent/100 FROM private.uhz_admin_console_config WHERE id=1) THEN RAISE EXCEPTION 'Cuota de almacenamiento al 90 por ciento';END IF;
  IF (SELECT coalesce(sum(bytes),0) FROM private.uhz_catalog_images)>1000000000-307200 OR (SELECT count(*) FROM private.uhz_catalog_images WHERE created_at>now()-interval '1 day')>=200 THEN RAISE EXCEPTION 'Cuota de imágenes alcanzada'; END IF;
  INSERT INTO private.uhz_catalog_images(key,bytes,width,height,owner_id) VALUES(k,(p_payload->>'bytes')::int,(p_payload->>'width')::int,(p_payload->>'height')::int,actor);
  RETURN jsonb_build_object('ok',true);
 ELSIF p_action='confirm' THEN
  UPDATE private.uhz_catalog_images SET state='ready' WHERE key=k AND owner_id=actor AND state='reserved';
  RETURN jsonb_build_object('ok',FOUND);
 ELSIF p_action='cleanup' THEN
  WITH candidates AS (SELECT i.key FROM private.uhz_catalog_images i WHERE
   (i.created_at<now()-interval '24 hours' OR coalesce(p_payload->'removed','[]'::jsonb) ? ('https://univershzrw.com/_uhz/catalog-images/'||i.key))
   AND NOT EXISTS(SELECT 1 FROM private.uhz_eco_content e WHERE e.details->>'cover'='https://univershzrw.com/_uhz/catalog-images/'||i.key OR e.details->'gallery' ? ('https://univershzrw.com/_uhz/catalog-images/'||i.key) OR e.details->'thumbnails' ? ('https://univershzrw.com/_uhz/catalog-images/'||i.key) OR e.details->>'cover_thumb'='https://univershzrw.com/_uhz/catalog-images/'||i.key) LIMIT 30 FOR UPDATE),
   marked AS (UPDATE private.uhz_catalog_images SET state='deleting' WHERE key IN (SELECT key FROM candidates) RETURNING key)
   SELECT coalesce(jsonb_agg(key),'[]') INTO v FROM marked;
  RETURN jsonb_build_object('keys',v);
 ELSIF p_action='deleted' THEN
  DELETE FROM private.uhz_catalog_images WHERE key=k AND state='deleting'; RETURN jsonb_build_object('ok',true);
 END IF;
 RAISE EXCEPTION 'Operación no válida';
END $function$

