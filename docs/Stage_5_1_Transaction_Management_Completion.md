# PortfolioAI Stage 5.1 — Transaction Management Completion

## Purpose and architecture

Stage 5.1 completes daily ledger management. Transactions remain authoritative;
only `ACTIVE` rows feed holdings and the on-demand exact-decimal accounting engine.
The later owner-approved Stage 6-completion amendment selects FIFO when chronology
is provable and weighted-average cost otherwise. Imported source rows remain immutable.

## New-security workflow

Manual BUY/SELL entry uses one searchable security selector. Typing a ticker or company shows existing matches; when none match, the same control exposes **Add [ticker] as a new security**. The compact onboarding panel pre-fills the typed ticker. On success it closes, selects the canonical security automatically, preserves already entered transaction fields, and displays either verified mapping availability or **Price mapping pending**. No reload is required. This direct accessibility is part of REQ-TRAN-001; the backend RPC alone does not satisfy the requirement.

The trusted `create_manual_security_v1` RPC supports NSE/BSE equities and ETFs, derives the caller, verifies portfolio ownership, normalizes exchange/symbol/ISIN/series, applies the established ISIN format plus checksum, rejects symbol or ISIN collisions, records creation provenance, and is idempotent. Exchange series is stored on the canonical security listing rather than misrepresented as a globally unique alternate identifier. Browser roles still cannot write `securities` or `security_identifiers` directly.

Provider identity stays separate. A newly created security receives an `ANGEL_ONE / UNRESOLVED` mapping with review evidence. No provider token is guessed. The transaction may proceed while CMP is explicitly pending; a future trusted instrument-master sync can verify the mapping.

## Audited corrections

`correct_transaction_v1` accepts corrections to date, security, BUY/SELL type, quantity, price, owned broker account, charges, and notes, with a required reason and idempotency UUID. In one database transaction it locks the portfolio, validates ownership and effective status, checks both affected security quantities against oversell, marks the original `SUPERSEDED`, and inserts a linked `ACTIVE` correction. Original import batch/source-row evidence stays on the original row. Accounting rebuild is automatic because projections read current `ACTIVE` rows on demand.

The UI explains this preservation, flags high-impact edits, and exposes correction lineage/reason in details. Internal UUIDs stay out of the compact default row.

## Table, filters and derived data

Headers sort date, security, type, quantity, price, gross, charges, and broker/account in both directions. Missing dates/charges remain missing and are ordered explicitly. Filters combine security, account, type, source, quality, date range, missing date and missing broker; text search covers ticker, company, broker/account and source. Reset restores the full effective ledger. Client-side processing remains appropriate for the current 477-row scale; repository/UI boundaries allow later server pagination.

Current price, current value and unrealised P&L remain position-level Holdings data. Realised FIFO is also kept in the accounting/position presentation until a transaction allocation view can show lot matches without semantic ambiguity. Sector, market cap, category and momentum remain security/engine outputs rather than copied ledger fields.

## Former Excel column placement

| Former sheet fields | PortfolioAI owner |
|---|---|
| Date, Buy/Sell, Ticker/Security, Units, Price/Unit, Broker, Charges | Transaction ledger |
| Prev./cumulative units, invested/current value, P&L and %, unrealised/realised P&L and %, holding days | Deterministic accounting and Holdings/Stock Detail |
| Target price, stop loss, target/min/max weight | Portfolio/security position settings |
| Company, sector, market cap, category | Canonical security and fundamental intelligence |
| 90-day chart and momentum indicators | Market-data/technical engine |
| Alert status and threshold triggers | Future monitoring/notification engine with trigger history and deduplication |

These requirements are tracked in `PortfolioAI_Requirements_Register.md`; separation does not remove them. The future alert engine may notify but must never place autonomous SELL orders.

## Security, tests and limitations

Both new RPCs are schema-qualified `SECURITY DEFINER` functions with empty `search_path`, caller-derived ownership, narrow authenticated grants, exact PostgreSQL numeric inputs, idempotency ledgers and advisory locks. Direct browser writes remain denied. The migration is additive.

Tests cover migration security invariants, immutable evidence, normalized symbol and ISIN collisions, ISIN checksum acceptance/rejection, unresolved mapping behavior, correction provenance/idempotency, UI sorting/filter reset, existing manual-entry validation, FIFO accounting, and prior stages. Known limitations: automated Angel master resolution is deferred until a durable trusted instrument-master source is available; corrections are limited to BUY/SELL effective rows; client-side table operations should move server-side when volume materially grows.
