# INFYNITY · UNIVERSHZRW

Production: https://univershzrw.com/criptomoneda  
Account: https://univershzrw.com/criptomoneda/panel  
Owner operations: https://admin.univershzrw.com/inft

`worker.mjs` is the self-contained `univershzrw-moneda` Cloudflare Worker. It includes the site, styles, native WebGL coin, CSS 3D fallback, SVG favicon, optimized artwork and documentation. Preserve existing routes, settings and observability when updating it through the content API.

The main calls to action open the authenticated financial portal described in [../finance/README.md](../finance/README.md). That portal provides actual account bookkeeping, privately uploaded deposit evidence, manual reconciliation, withdrawals with reserved balances, confirmed exchange quotes and owner controls. The former public availability form has been replaced with links to those operations. The legacy terminal root redirects to the account portal; obsolete mutation endpoints remain closed.

The public chart displays published **Mesa UNIVERSHZRW reference quotes** and their stated reasons. It never substitutes revenue allocations for market prices. Volume is the sum of settled platform buy/sell operations, rather than an external exchange's volume. Empty quote history remains empty until the owner publishes a quote.

Polygon status, personal on-chain balances and receipt verification use the contract configured through owner administration. An explicit legacy `INFT_TOKEN_ADDRESS` binding can override that read-only lookup; none is needed for the current database configuration. Contract bytecode, exact INFT symbol, supply and decimals are checked. This application does not deploy or mint a token, sign transfers, create external liquidity, or guarantee returns.

Security headers, canonical www redirects, bounded parsing, origin checks and explicit route/method allowlists are retained. Existing HttpOnly account cookies and the site's shared mobile menu remain in use. The public quote endpoint is read-only; financial writes are authenticated through the separate portal and service-only RPC.

The 15 website security tests passed after integration, alongside the 12 finance tests. Browser checks confirmed the published customer/admin entry screens, panel links and mobile navigation at 340 CSS pixels. No real transfer or authenticated financial form submission was made during verification.
