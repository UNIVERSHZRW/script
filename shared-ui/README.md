# UNIVERSHZRW shared mobile navigation

Production: https://univershzrw.com/

`mobile-menu-worker.mjs` is the self-contained source for the existing Cloudflare Worker `univershzrw-comunichat-nav`. `home-mobile-worker.mjs` is the source for `univershzrw-home-compact`. Both preserve their existing `ORIGINAL_SITE` production service binding to `univershzrw`. Updating code through the scripts content API preserves settings and bindings.

The homepage and secondary pages use identical header markup. The shared shell now includes `/criptomoneda` and its child pages. Robot and embedded documents retain their separate interfaces.

At widths up to 800px the header is 66px tall with branding, notifications, account access and a disclosure menu. The menu groups navigation, theme, language and support, supports internal scrolling, outside click, Escape, and restoration of page scrolling. Account/avatar and notice counts synchronize from the existing authenticated header. The established language and theme services remain in use. The Coin and crypto navigation label is INFYNITY.

The response revision is `x-uhz-mobile-menu: compact-20261107`. Existing versioned script URLs and `?asset=app-shell` remain supported and use no-store caching. Crypto and newly linked homepage shell styles use a mobile media query to preserve desktop presentation.

## Validation

Syntax checks passed for the header and both Worker modules. Request checks confirmed legacy/versioned asset routes, MIME handling, HEAD without body, unsupported methods, and unchanged upstream passthrough.

Live browser checks at a 340 CSS-pixel viewport confirmed a single 66px mobile header and no horizontal overflow on 13 pages: home, content contribution (random), store, donations, plans, account, privacy policy, security, requests, library, creators, INFYNITY and the INFT guide. Theme switching, language switching, Escape closure and scroll restoration passed. Home theme/menu behavior was also exercised independently.
