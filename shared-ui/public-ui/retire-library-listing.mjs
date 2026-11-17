export function removeLibraryListingLinks(source) {
  return source
    .replace(/(?: \/ )?<a href=(\\*)"\/biblioteca\/?\1"[^<>]*>[^<>]*<\/a>/g, '')
    .replace(/\{label:(\\*)(['"])Biblioteca\1\2,path:\1\2\/biblioteca\1\2,group:\1\2Explorar\1\2\},/g, '')
    .replace(/\[(\\*)(['"])Biblioteca\1\2,\1\2\/biblioteca\1\2\],/g, '')
    .replace(/const library=document\.getElementById\('publicaciones'\);if\(library&&!library\.querySelector\('\.uhz-ed-library-link'\)\)\{const p=document\.createElement\('p'\);p\.className='uhz-ed-library-link';const a=document\.createElement\('a'\);a\.href='\/biblioteca';a\.textContent='[^']*';p\.append\(a\);library\.append\(p\);\}/g, '')
    .replace(/const o=document\.getElementById\("publicaciones"\);if\(o&&!o\.querySelector\("\.uhz-ed-library-link"\)\)\{const e=document\.createElement\("p"\);e\.className="uhz-ed-library-link";const a=document\.createElement\("a"\);a\.href="\/biblioteca",a\.textContent="[^"]*",e\.append\(a\),o\.append\(e\)\}/g, '')
    .replaceAll('<url><loc>https://univershzrw.com/biblioteca</loc></url>', '');
}

export function removeHomeLibraryLinkStyles(source) {
  return source
    .replace('.publication-main-link,\nhtml body #publicaciones.publications-wide .uhz-ed-library-link a {', '.publication-main-link {')
    .replace(':is(.publication-main-link, .uhz-ed-library-link a):hover', '.publication-main-link:hover')
    .replace(/\n#publicaciones > \.uhz-ed-library-link \{\n[^}]+\}\n/, '\n');
}

export function removeLegacyLibraryMenuLinks(source) {
  const tablePattern = /^const UI_ASSETS = (.+);$/m;
  const declaration = source.match(tablePattern);
  if (!declaration) throw new Error('The shared navigation asset table was not found.');

  const assets = JSON.parse(declaration[1]);
  for (const [name, asset] of Object.entries(assets)) {
    if (/^ui-js-\d+$/.test(name) && asset.type === 'application/javascript') {
      asset.body += '\n;document.querySelectorAll(\'.uhz-ui-menu-links a[href="/biblioteca"]\').forEach(link => link.remove());\n';
    }
  }
  return removeLibraryListingLinks(source.replace(tablePattern, () => 'const UI_ASSETS = ' + JSON.stringify(assets) + ';'));
}

export async function handleRetiredLibraryRequest(request, env) {
  const url = new URL(request.url);
  let page = url.pathname;
  if (page === '/_uhz/page') {
    page = url.searchParams.get('_uhz_path') || '';
    try { page = decodeURIComponent(page); } catch {}
  }

  if (/^\/biblioteca\/?$/.test(page)) {
    return new Response(request.method === 'HEAD' ? null : 'Esta página ya no está disponible.', {
      status: 410,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  }

  const editorialScript = /^\/_uhz\/build\/site-enterprise-[0-9a-f]+\.js$/.test(url.pathname);
  const sitemap = url.pathname === '/sitemap-pages.xml';
  if (!(editorialScript || sitemap) || !['GET', 'HEAD'].includes(request.method)) return null;

  const original = await env.ORIGINAL_SITE.fetch(request);
  const type = original.headers.get('content-type') || '';
  if (!original.ok || !(editorialScript ? /javascript/i.test(type) : /xml/i.test(type))) return original;

  const headers = new Headers(original.headers);
  for (const name of ['content-length', 'content-encoding', 'etag', 'last-modified']) headers.delete(name);
  headers.set('cache-control', 'no-store');
  const body = request.method === 'HEAD' ? null : removeLibraryListingLinks(await original.text());
  return new Response(body, {status: original.status, statusText: original.statusText, headers});
}

export function prepareHomeLibraryRetirement(source) {
  const fetchAnchor = "if(url.pathname==='/_uhz/uhz-home-app.css')";
  const htmlAnchor = 'const page=new HTMLRewriter()';
  if (source.split(fetchAnchor).length !== 2 || source.split(htmlAnchor).length !== 2) {
    throw new Error('The homepage fetch and HTML handlers do not match the reviewed Worker.');
  }

  const fetchStep = 'const libraryResponse = await handleRetiredLibraryRequest(req, env);\n if (libraryResponse) return libraryResponse;\n ';
  const markup = [
    '',
    '   .on(\'script[src^="/_uhz/build/site-enterprise-"]\', {',
    '     element(script) {',
    "       const asset = new URL(script.getAttribute('src'), url);",
    "       asset.searchParams.set('v', 'sin-biblioteca');",
    "       script.setAttribute('src', asset.pathname + asset.search + asset.hash);",
    '     }',
    '   })',
  ].join('\n');

  return removeLibraryListingLinks.toString() + '\n\n' +
    handleRetiredLibraryRequest.toString() + '\n\n' +
    source.replace(fetchAnchor, () => fetchStep + fetchAnchor).replace(htmlAnchor, () => htmlAnchor + markup);
}
