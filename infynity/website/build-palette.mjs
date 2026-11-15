import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

function withInfynityPalette(worker, stylesheetHref, stylesheets = {}) {
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const publicSite = url.hostname === 'univershzrw.com';
      const stylesheet = stylesheets[url.pathname];
      if (publicSite && stylesheet && (request.method === 'GET' || request.method === 'HEAD')) {
        return new Response(request.method === 'GET' ? stylesheet : null, {
          headers: {
            'Content-Type': 'text/css; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

      const response = await worker.fetch(request, env, ctx);
      if (!publicSite || request.method !== 'GET' || response.status !== 200 || !response.body ||
          !/^text\/html\b/i.test(response.headers.get('Content-Type') || '')) {
        return response;
      }

      const path = url.pathname.replace(/\/$/, '');
      if (path !== '/criptomoneda' && path !== '/criptomoneda/panel') return response;
      const page = path === '/criptomoneda' ? 'landing' : 'panel';
      const transformed = new HTMLRewriter()
        .on('html', { element: html => html.setAttribute('data-uhz-inft-page', page) })
        .on('head', { element: head => head.append(`<link rel="stylesheet" href="${stylesheetHref}">`, { html: true }) })
        .transform(response);
      const headers = new Headers(transformed.headers);
      for (const name of ['content-length', 'etag', 'last-modified', 'content-md5', 'digest', 'content-digest']) {
        headers.delete(name);
      }
      return new Response(transformed.body, {
        status: transformed.status,
        statusText: transformed.statusText,
        headers
      });
    }
  };
}

function paletteHref(stylesheet) {
  const revision = createHash('sha256').update(stylesheet).digest('hex').slice(0, 12);
  return `/criptomoneda/infynity-palette-${revision}.css`;
}

export function buildPaletteWorker(source, stylesheet, serveStylesheet, previousStylesheet) {
  const entry = /^export default (?=\{)/gm;
  if ([...source.matchAll(entry)].length !== 1 || source.includes('function withInfynityPalette(')) {
    throw new Error('Expected one unmodified INFYNITY Worker export');
  }

  const stylesheetHref = paletteHref(stylesheet);
  const args = ['infynityWorker', JSON.stringify(stylesheetHref)];
  if (serveStylesheet) {
    const stylesheets = { [stylesheetHref]: stylesheet };
    if (previousStylesheet) stylesheets[paletteHref(previousStylesheet)] = previousStylesheet;
    args.push(JSON.stringify(stylesheets));
  }
  return source.replace(entry, 'const infynityWorker = ').trimEnd() +
    `\n\n${withInfynityPalette.toString()}\nexport default withInfynityPalette(${args.join(', ')});\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [page, input, output, previous] = process.argv.slice(2);
  if (!['moneda', 'panel'].includes(page) || !input || !output) {
    throw new Error('Usage: node build-palette.mjs <moneda|panel> <input.mjs> <output.mjs> [previous.css]');
  }
  const [source, css, previousCss] = await Promise.all([
    readFile(input, 'utf8'),
    readFile(new URL('./public-palette.css', import.meta.url), 'utf8'),
    page === 'moneda' && previous ? readFile(previous, 'utf8') : undefined
  ]);
  await writeFile(output, buildPaletteWorker(source, css, page === 'moneda', previousCss));
}
