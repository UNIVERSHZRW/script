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
  return source.replace(declaration, () => 'const STYLE=' + JSON.stringify(css) + ';');
}
