export function serveFavicon(request, icon) {
  if (new URL(request.url).pathname !== '/favicon.ico') return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  return new Response(request.method === 'HEAD' ? null : icon, {
    headers: {
      'content-type': 'image/vnd.microsoft.icon',
      'cache-control': 'public, max-age=86400',
      'x-content-type-options': 'nosniff'
    }
  });
}
