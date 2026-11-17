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

export function retireLibraryListing(source) {
  const guard = 'if(t!=="/biblioteca"&&!/^\\/biblioteca\\/[A-Za-z0-9_-]{1,100}$/.test(t))';
  const retired = 'if(t==="/biblioteca")return U("Esta p\\xE1gina ya no est\\xE1 disponible.",410,n,!1);';
  const detailGuard = 'if(!/^\\/biblioteca\\/[A-Za-z0-9_-]{1,100}$/.test(t))';
  const listingStart = 'if(t==="/biblioteca"){let l=r.map(';
  const detailsStart = '}let d=t.slice(12)';
  const start = source.indexOf(listingStart);
  const end = source.indexOf(detailsStart, start);

  if (source.split(guard).length !== 2 || source.split(listingStart).length !== 2 || end < start) {
    throw new Error('The library listing handler does not match the reviewed Worker.');
  }

  const indexRemoved = source.slice(0, start) + source.slice(end + 1);
  return removeLibraryListingLinks(indexRemoved.replace(guard, retired + detailGuard))
    .replace(/(src=(\\*)"\/_uhz\/build\/site-enterprise-[0-9a-f]+\.js)(\2")/g, '$1?v=sin-biblioteca$3');
}
