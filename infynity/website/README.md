# INFYNITY · UNIVERSHZRW

Production: https://univershzrw.com/criptomoneda  
Account: https://univershzrw.com/criptomoneda/panel  
Owner operations: https://admin.univershzrw.com/inft

`worker.mjs` is the self-contained `univershzrw-moneda` Cloudflare Worker. It includes the site, styles, native WebGL coin, CSS 3D fallback, SVG favicon, optimized artwork and documentation. Preserve existing routes, settings and observability when updating it through the content API.

Build the public palette against the matching version of each Worker before publishing. Run these commands from this directory after building the finance Worker.

```sh
node build-palette.mjs moneda worker.mjs /tmp/univershzrw-moneda.mjs
node build-palette.mjs panel ../finance/dist/worker.mjs /tmp/univershzrw-inft-panel.mjs
```

Publish the landing Worker first so the panel can load the versioned stylesheet. The wrapper adds this stylesheet to the two public INFYNITY pages.
When replacing a published palette, pass the previous stylesheet as the fourth argument to the landing build. This keeps its URL available while the two Workers are updated.

The main calls to action open the authenticated financial portal described in [../finance/README.md](../finance/README.md). That portal provides actual account bookkeeping, privately uploaded deposit evidence, manual reconciliation, withdrawals with reserved balances, confirmed exchange quotes and owner controls. The former public availability form has been replaced with links to those operations. The legacy terminal root redirects to the account portal; obsolete mutation endpoints remain closed.

The public chart displays published **Mesa UNIVERSHZRW reference quotes** and their stated reasons. It never substitutes revenue allocations for market prices. Volume is the sum of settled platform buy/sell operations, rather than an external exchange's volume. Empty quote history remains empty until the owner publishes a quote.

INFYNITY balances are held in the private account ledger. The public site shows dated reference quotes and aggregate internal inventory. Customers access their own balances, receipts and operations through the authenticated panel.

Security headers, canonical www redirects, bounded parsing, origin checks and explicit route/method allowlists are retained. Existing HttpOnly account cookies and the site's shared mobile menu remain in use. The public quote endpoint is read-only; financial writes are authenticated through the separate portal and service-only RPC.

The 15 website security tests passed after integration, alongside the 12 finance tests. Browser checks confirmed the published customer/admin entry screens, panel links and mobile navigation at 340 CSS pixels. No real transfer or authenticated financial form submission was made during verification.
