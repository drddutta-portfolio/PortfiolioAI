# PortfolioAI Stage 5 — Transactions and Portfolio Accounting

## Architecture

Transactions remain the sole accounting source of truth. The Stage 5 accounting projection is computed on demand from the authenticated user's `ACTIVE` ledger rows using Decimal.js. Persisting derived lots was deliberately avoided at the current 477-row scale: it removes cache invalidation and rebuild risk while retaining a reproducible `BUY transaction → SELL transaction → matched quantity/cost/proceeds` match graph in each calculation result. Future tax or reporting work may materialise the same deterministic output without changing source transactions.

## Per-history accounting-basis rules

- A complete, provable chronology uses FIFO: `BUY` creates an acquisition lot and `SELL` consumes open lots in chronological order.
- An incomplete or ambiguous chronology uses deterministic, order-independent weighted-average cost when all effective ACTIVE BUY/SELL quantities and prices are valid. It does not create inferred lots or claim FIFO.
- Exact decimal strings are used throughout. No authoritative calculation uses JavaScript floating point.
- Stored BUY charges/taxes increase acquisition cost; stored SELL charges/taxes reduce proceeds. They are allocated pro rata across the transaction quantity.
- If any charge or tax is null, a gross price-based result remains visible as `GROSS_ONLY_CHARGES_INCOMPLETE`; all charges/taxes are excluded rather than partially mixed. Null is never changed in storage.
- Basis is `FIFO`, `AVERAGE_COST` or `UNRESOLVED`. Quality separately discloses complete FIFO, incomplete-chronology average cost, gross-only costs, or an unresolved/inconsistent ledger.
- An oversell is not assigned negative lots. Imported evidence is disclosed as not calculable; the manual-write RPC rejects it before insertion.
- Market value remains independent of cost-basis coverage and continues to use Stage 4 cached-price semantics.

## Transactions UI

`/app/transactions` is a primary authenticated route with compact, horizontally scrollable history. It supports security/broker search; type, account, source, missing-date, missing-broker and date-range filters; data-quality and provenance badges; and expandable UUID/import lineage details. Missing evidence is labelled unavailable rather than shown as zero.

The manual form is limited to BUY and SELL and requires portfolio, owned broker account, canonical active security, transaction date, positive quantity and non-negative execution price. Total charges and notes are optional; blank charges remain null.

## Trusted manual-write path

Migration `20260907160000_create_stage5_manual_transactions.sql` adds the server-owned `manual_transaction_requests` replay ledger and `create_manual_transaction_v1` RPC.

The `SECURITY DEFINER` function has an empty `search_path`, schema-qualified relations, authenticated-only execute permission, and no browser table-write grant. It derives the caller from `auth.uid()`, checks portfolio ownership, account/portfolio integrity, active security identity, date and decimal constraints, and obtains a portfolio/security advisory transaction lock before validating available quantity. The UUID idempotency key is bound to a SHA-256 request hash; identical retries return the existing transaction and changed payloads are rejected. Manual rows have `MANUAL / PORTFOLIOAI` provenance and a stable deduplication key.

## Holdings and Dashboard

Holdings display the selected basis, average cost, remaining cost, unrealised P&L, realised cost/proceeds/P&L and accounting quality. Dashboard totals and rankings may combine supported FIFO and average-cost histories only with explicit basis coverage. Incomplete price or accounting coverage remains partial and cannot be presented as a complete portfolio total.

## Deployment and real-portfolio validation (read-only snapshot, 7 September 2026)

Migration `20260907160000_create_stage5_manual_transactions.sql` is applied locally
and to the linked remote project. Its 13 local pgTAP security/write tests pass;
local and remote schema lint report no errors. The generated TypeScript schema was
refreshed from the deployed project.

- 477 active transactions; 296 have unknown dates.
- 270 security histories: 248 open and 22 closed.
- The later owner-approved Stage 6-completion rule replaces the former unavailable state for chronology-incomplete but mathematically consistent BUY/SELL ledgers. Production-snapshot reconciliation classifies 58 histories as FIFO and 213 as average cost, with no currently unresolved history; 48/201 are open and 10/12 are closed respectively.
- Quantity counts and Stage 4 market-price data are unchanged. The accounting projection is read-only and does not refresh or mutate market data.
- Current-price coverage remains 248/248 and market value is unchanged at ₹22,48,208.55.

## Tests and limitations

Unit tests cover single/multiple lots, partial and multi-lot sells, closure, fractional exact decimals, charge allocation, missing dates, ambiguous timestamps, oversells, repeatability and unknown-charge quality. UI tests cover transaction rendering/filtering and manual required-field validation. SQL tests cover authentication privileges, direct-write denial, ownership, account consistency, exact decimals, provenance, idempotency and oversell/input rejection.

Deferred intentionally: corporate-action lot semantics, transfers, reversals/corrections UI, tax holding-period rules, same-timestamp broker sequencing, and persisted tax-lot snapshots. These require separately approved evidence and semantics.
