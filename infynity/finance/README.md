# INFYNITY account and reconciliation portal

Customer: https://univershzrw.com/criptomoneda/panel  
Owner: https://admin.univershzrw.com/inft

The portal uses the existing UNIVERSHZRW cookie session and the `uhz-inft-wallet` authenticated Supabase Edge Function. The public site never receives the service-role key or payout encryption key. The `uhz_finance` RPC accepts only service-role execution; its actor and live session are derived from the verified JWT on the server. Administrative changes additionally require the fresh existing owner record and superadmin application metadata.

## Operation

1. In administration, register the actual receiving bank account, holder and CLABE. The checksum is validated.
2. Register the actual INFT token contract and treasury address on Polygon. The server checks the contract decimals. This application does not issue a token or create liquidity.
3. Publish a reference quote in MXN and Coins, including the reason for the quote. Published quotes are immutable and attributed to Mesa UNIVERSHZRW; they are not presented as independent exchange prices.
4. Customers submit deposit requests and privately upload evidence. The owner verifies the actual bank/checkout receipt and records its unique external reference before crediting a balance. Card requests use an official hosted Mercado Pago payment link assigned to that individual request.
5. Withdrawals reserve an existing balance. The owner executes the payment outside this application, then records the matching transfer reference or INFT transaction hash. The application does not initiate bank or blockchain transfers.
6. Customers explicitly confirm an exchange quote, valid for ten minutes, before origin funds are reserved. Settlement checks the actual on-chain INFT reserve and registered cash reserve. Coins debits use the existing Coins ledger and existing content-spend lock. The per-request Coins limit is 1,000 in either direction.

## Security and accounting

- No example funds, artificial price history, investment-return promises or simulated confirmations are stored in production.
- Available and reserved amounts use PostgreSQL fixed precision. Balance and reserve mutations are serialized in one database transaction, with shared Coins locking and nonnegative constraints.
- Payment references and crypto transaction hashes are unique. A completed request is idempotent; cancellation/rejection refunds at most once.
- Private receipt bucket; signed uploads, verified file signatures, 2 MB limit, server-computed SHA-256 and short-lived download links.
- Payout instructions use pgcrypto AES-256 with a server-only key in Supabase Vault. Customer responses expose only the last four CLABE digits. Owner reads are audited.
- Wallet ownership uses a five-minute, one-use, account-bound signed challenge. INFT deposits must originate from that linked address; withdrawals must be received by it. Polygon receipts must be successful, canonical, at least 128 blocks deep and match the configured contract, source, destination and exact amount. Both confirmed and current treasury balances are considered.
- Financial journals, published quotes, settled proof references and hash-chained audit entries reject updates and deletes.
- PMC/Morse represents the receipt folio. Cryptographic integrity uses SHA-256 and standard encryption; Morse is not described as encryption or quantum security.
- Existing account controls, verified email, password-reset restrictions and live DB session revocation apply to every financial action.

## Deployment and validation

Apply `schema.sql` as one Supabase migration, deploy `index.ts` plus `core.mjs` as `uhz-inft-wallet` with JWT verification enabled, publish `dist/worker.mjs` as `univershzrw-inft-panel`, and route `/criptomoneda/panel*` on apex/www plus `/inft*` on the admin hostname to it. The existing account proxy must allow that Edge Function while rejecting `admin_*` actions on the customer hostname.

`npm test` runs isolated PostgreSQL/PGlite scenarios covering permissions, ownership, session revocation, duplicate receipts, idempotent requests, insufficient funds, encrypted payout details, quote confirmation, reserve coverage, Coins refunds and immutability. No financial fixture is inserted in the live database. `npm run build` validates syntax and packages the static financial portal. Install development tools locally or set `PGLITE_ROOT` and `ESBUILD_PATH` to available installations.

Production checks confirmed both dashboard functions for an existing owner session, the public quote feed (HTTP 200), denial of the service-only RPC to anonymous callers (HTTP 401), denial of the Edge endpoint without a session (HTTP 401), a private proof bucket, preserved existing Worker bindings, and customer/admin entry screens. Twelve finance tests and fifteen existing website security tests passed. The mobile entry screen and menu were checked at 340 CSS pixels without horizontal overflow. The browser was signed out; authenticated form interaction and actual external transfers were not performed.
