export function prepareGuestContributionLayout(source) {
  const declaration = /^const STYLE=(.+);$/m;
  const match = source.match(declaration);
  if (!match) throw new Error('The contribution page stylesheet was not found.');

  let css = JSON.parse(match[1]);
  const changes = [
    [
      ".inft-invite{display:flex;align-items:center;justify-content:space-between;gap:24px;border:1px solid #40cfba77;border-radius:19px;background:linear-gradient(115deg,#123443,#0e253c 65%,#1b2f4e);padding:25px;margin:0 0 28px;box-shadow:0 14px 35px #0002}",
      ".inft-invite{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:0 0 28px}"
    ],
    [
      ".inft-invite h2{margin:10px 0;color:#fff;font-size:clamp(22px,3vw,31px);line-height:1.2}",
      ".inft-invite h2{margin:10px 0;color:var(--uhz-ink,var(--ink,#18384d));font-size:clamp(22px,3vw,31px);line-height:1.2}"
    ],
    [
      ".inft-invite p{margin:0;color:#d0e5e9;max-width:620px;line-height:1.7}",
      ".inft-invite p{margin:0;color:var(--uhz-muted,#506777);max-width:620px;line-height:1.7}"
    ],
    [
      "@media(max-width:650px){.inft-invite{flex-direction:column;align-items:stretch;padding:20px}.inft-invite .inft-invite-button{max-width:none}.inft-steps{grid-template-columns:1fr}}",
      "@media(max-width:650px){.inft-invite{flex-direction:column;align-items:stretch}.inft-invite .inft-invite-button{max-width:none}.inft-steps{grid-template-columns:1fr}}"
    ],
    [
      "html:is([data-uhz-theme=\"dark\"],[data-theme=\"dark\"]) body[data-page] main#contenido .inft-invite{background:linear-gradient(125deg,#123549 0%,#102c44 65%,#1e3452 100%)!important;border:1px solid #3e8b94!important;box-shadow:0 14px 35px rgba(0,0,0,.16)!important}",
      ""
    ]
  ];
  for (const [original, replacement] of changes) {
    if (css.split(original).length !== 2) {
      throw new Error('The existing INFYNITY invitation style has changed.');
    }
    css = css.replace(original, replacement);
  }

  css += `
html body[data-page="random"] main#contenido.uhz-contribute > :is(.hero, .inft-invite) {
  background: transparent !important;
  border: 0;
  box-shadow: none;
}
`;
  return updateGuestContributionRewards(source.replace(declaration, () => 'const STYLE=' + JSON.stringify(css) + ';'));
}

export function updateGuestContributionRewards(source) {
  const pagesDeclaration = /^const PAGES=(.+);$/m;
  const styleDeclaration = /^const STYLE=(.+);$/m;
  const pagesMatch = source.match(pagesDeclaration);
  const styleMatch = source.match(styleDeclaration);
  if (!pagesMatch || !styleMatch) {
    throw new Error('The contribution pages and styles could not be found.');
  }

  const pages = JSON.parse(pagesMatch[1]);
  const previousInvitation = "<section class=\"inft-invite\" aria-label=\"Ganar INFYNITY aportando\"><div class=\"inft-invite-copy\"><span class=\"tag\">RECOMPENSAS · INFYNITY (INFT)</span><h2>¿Quieres ganar cripto INFYNITY?</h2><p>Descubre cómo aportar recursos originales, obtener Coins tras la aprobación y cómo funcionará el canje por INFT cuando esté habilitado.</p></div><a class=\"btn primary inft-invite-button\" href=\"/Aportar_contenido/infynity\">Conocer la guía y cómo participar</a></section>";
  const previousExchange = "<section class=\"inft-mini\"><a href=\"/Aportar_contenido/infynity\">¿Cómo convertiré mis Coins en INFYNITY (INFT)? Consulta la guía y el estado real del canje.</a></section>";
  const previousGuideTab = "<a href=\"/Aportar_contenido/infynity\"><span>Guía INFYNITY</span></a>";
  if (pages.random.split(previousInvitation).length !== 2 ||
      pages.coins.split(previousExchange).length !== 2 ||
      pages.coins.split(previousGuideTab).length !== 2) {
    throw new Error('The contribution rewards copy does not match the reviewed pages.');
  }

  pages.random = pages.random.replace(previousInvitation, `<section class="inft-invite" aria-labelledby="guest-coins-heading" translate="no">
  <div class="inft-invite-copy">
    <h2 id="guest-coins-heading"><span lang="es">Gana Coins por tus aportes</span><span lang="en">Earn Coins for your contributions</span></h2>
    <p><span lang="es">Comparte recursos originales. Los aportes aprobados y publicados pueden recibir Coins.</span><span lang="en">Share original resources. Approved contributions can earn Coins once published.</span></p>
  </div>
  <a class="btn primary inft-invite-button" href="/Aportar_contenido/coins"><span lang="es">Ver guía de Coins</span><span lang="en">View the Coins guide</span></a>
</section>`);
  pages.coins = pages.coins.replace(previousExchange, '').replace(previousGuideTab, '');
  const css = JSON.parse(styleMatch[1]) + `
html:lang(en) body[data-page="random"] .inft-invite [lang="es"],
html:not(:lang(en)) body[data-page="random"] .inft-invite [lang="en"] {
  display: none;
}
`;

  return source
    .replace(pagesDeclaration, () => 'const PAGES=' + JSON.stringify(pages) + ';')
    .replace(styleDeclaration, () => 'const STYLE=' + JSON.stringify(css) + ';');
}
