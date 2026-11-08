-- Adds supported providers to the existing private validator. No access/price/role changes.
CREATE OR REPLACE FUNCTION private.uhz_catalog_safe_url(v text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO '' AS $function$
 SELECT coalesce(length(v)<=1500 AND v ~ '^https://[A-Za-z0-9.-]+(/|$)' AND v !~ '[[:space:]\\]' AND
 lower(substring(v from '^https://([^/]+)')) ~ '(^|\.)(univershzrw\.com|drive\.google\.com|docs\.google\.com|youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|terabox\.com|1024tera\.com|teraboxapp\.com|terabox\.app|1024terabox\.com|mirrobox\.com|teraboxlink\.com|teraboxshare\.com|mediafire\.com|mega\.nz|mega\.io|onedrive\.live\.com|1drv\.ms|sharepoint\.com|dropbox\.com|dl\.dropboxusercontent\.com|interactive-examples\.mdn\.mozilla\.net)$',false);
$function$;
