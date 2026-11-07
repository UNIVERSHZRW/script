# INFYNITY · UNIVERSHZRW

Production: https://univershzrw.com/criptomoneda

`worker.mjs` is a self-contained Cloudflare Worker ES module. It includes the site, CSS, client JavaScript, native WebGL coin renderer, CSS 3D fallback, SVG favicon and optimized WebP artwork. No external build or client library is required.

Deploy it as `univershzrw-moneda`, entry point `worker.mjs`, compatibility date `2026-11-06`. Preserve the routes under `/criptomoneda*` on the apex domain and canonical www alias. Enable observability logs and traces. The deployed module has no secret credentials.

## Behaviors

- Real artwork on both faces, automatic rotation and pause; reduced motion and a WebGL-free fallback.
- Same-origin, HttpOnly session integration through the existing portal; Coin balance is requested from `community_my_coins` only after the portal validates the account.
- Server-proxied Polygon status, address balances and transaction receipt checks. No arbitrary RPC gateway.
- Security headers, canonical redirects, bounded JSON parsing, origin checks, explicit route and method allowlists.
- Availability queries for buy/sell/redeem do not create orders, collect payments or debit Coins.

## Operational requirements

A deployed official INFT token contract, verified supply and token ABI, funding and custody arrangements, real liquidity, an authorized settlement engine, and a published Coins redemption policy are required to enable buying, selling or redemption. This deployment does not create a token, a blockchain, a market or a guaranteed investment return. Current financial capabilities fail closed.

An optional `INFT_TOKEN_ADDRESS` binding enables read-only contract and balance checks. The token's exact INFT symbol, decimals, supply and bytecode are validated. Adding this binding alone never enables trading or settlement.

The displayed target supply is the existing contract proposal of 21,000,000 INFT. Accounting allocations from platform revenue are never displayed as market quotations.

## Validation

15 automated security and API tests passed before deployment. Checks cover security headers, HEAD bodies, www canonicalization, method allowlists, same-origin quotes, input tampering, request sizes, absent contract balances, malformed hashes, node outages, exact token ABI identity and reverted receipts. Live browser QA verifies the published layout, coin fallback rotation and the redemption availability form. Authenticated wallet ownership and settlement require the user's own wallet; no financial transaction is performed during QA.
