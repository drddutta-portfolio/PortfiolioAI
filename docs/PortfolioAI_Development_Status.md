# PortfolioAI — Development Status

**Status:** Living implementation and handover record

**Current milestone:** Stage 5 — Transactions, FIFO Lot Accounting & Portfolio Accounting

**Last reviewed:** 7 September 2026

This document records what is actually implemented, live, incomplete, and approved
next. It is intentionally concise and does not duplicate the product specification.

## A. Project identity

PortfolioAI is the private `drddutta-portfolio/PortfiolioAI` repository for a
personal investment decision-support system covering a diversified Indian
portfolio across multiple broker/demat accounts. It is not an autonomous investment
adviser, order-execution bot, or trading bot; investment decisions remain with the
owner.

- Frontend: React, Vite, and strict TypeScript.
- Backend: Supabase Auth, PostgreSQL, Row Level Security, RPCs, and Edge Functions.
- Current major sources/integrations: trusted Excel/XLSX portfolio imports and
  Angel One SmartAPI market prices through a server-side integration.
- Portfolio: one consolidated portfolio across distinct broker/demat accounts.

## B. Canonical document hierarchy

Authority descends in this order:

1. `PortfolioAI_Master_Blueprint.md` defines product vision, intended capabilities,
   investment methodology, and long-term architecture.
2. `PortfolioAI_Database_Architecture.md` defines approved database design, data
   ownership, provenance, accounting semantics, and security/RLS expectations.
3. `PortfolioAI_Development_Rules.md` defines engineering, security, testing,
   deterministic-calculation, and implementation standards.
4. This Development Status records actual implementation, completed milestones,
   known limitations, the current milestone, and next approved work.
5. Stage-specific documents, including `Stage_4_Market_Data.md`, record detailed
   stage decisions and completed-stage behaviour.

The first three documents are canonical specifications. This file reports current
reality without overriding them. Implementation sequencing may differ from the
Blueprint's broad phases without constituting an architectural conflict.

## C. Completed implementation state — Stages 1–4

### Foundation and security

- React + Vite + TypeScript frontend and Supabase backend.
- Email/password authentication, password reset, persisted sessions, logout, and
  protected application routes; public self-registration is not exposed.
- User-owned portfolio RLS/security foundation and browser read-only financial
  ledger boundary.
- Private GitHub repository and a Consolidated Portfolio.

### Broker structure

The consolidated portfolio contains five distinct broker/demat accounts:

- Motilal Oswal
- Sharekhan
- Angel One
- Zerodha
- INDMoney

### Import and transaction foundation

- Trusted Excel/XLSX import with preview, validation, explicit confirmation, and a
  trusted ledger-commit path.
- Immutable staged source evidence, original values, import provenance, and
  transaction-to-source-row lineage.
- Browser clients cannot directly insert, update, delete, or truncate trusted
  transactions. Corrections must use controlled, auditable semantics.
- Financial quantities and calculations use PostgreSQL numeric values and decimal
  strings/Decimal.js rather than JavaScript floating-point arithmetic.

### Current verified portfolio snapshot

The completed-stage operational snapshot records:

- 477 `ACTIVE` transactions.
- 270 transaction/security histories.
- 248 open holdings and 22 closed positions.
- 270 canonical securities.

These counts describe the current imported portfolio state; they are not generic
application limits.

### Dashboard and holdings

- Professional Dashboard foundation with transaction-derived position counts,
  supported portfolio totals, allocation presentation, and explicit completeness
  states.
- Holdings page plus a separate Closed Positions view.
- Current price, market value, portfolio weight, supported cost basis/P&L, broker
  exposure, price evidence, role, and sector presentation where evidence permits.
- Cost-basis coverage and data-quality indicators; unavailable values remain
  unavailable rather than estimated.
- Holdings search, role and sector filters, open/closed filtering, and deterministic
  sorting are implemented.

### Market data — Stage 4

- Angel One SmartAPI is integrated server-side through an authenticated Supabase
  Edge Function; provider credentials are not exposed to the browser.
- Application calculations use a provider-independent `MarketPriceProvider`
  boundary. Provider identifiers remain separate from canonical security identity.
- Mapping is deterministic and evidence-backed: 248 of 248 open holdings have
  verified mappings, including an explicitly reviewed mapping exception.
- Latest-price cache coverage is 248 of 248 open holdings, enabling current
  portfolio market value and weights even where cost basis is incomplete.
- Market-data provenance preserves provider, mapping evidence, exact decimal price,
  provider timestamp, and retrieval timestamp.
- Fresh/stale status is based on retrieval time; missing provider timestamps are
  not replaced with retrieval time.
- Server-side caching, bounded quote batches, cooldowns, rate control, and
  database-backed operation leases protect the provider and shared account.

## D. Known current limitations

These are explicit, deferred limitations—not accidental omissions:

- 28 open holdings with SELL history lack a deterministic remaining cost basis
  pending an approved FIFO/lot-accounting engine.
- Those 28 positions may still have valid CMP, Market Value, and Portfolio Weight.
  Missing cost basis must not be confused with missing market-price evidence.
- 296 historical imported transactions have no known transaction date. Dates must
  remain null and must never be fabricated merely to make FIFO work.
- Total unrealised P&L remains unavailable because the approved completeness rules
  do not permit a deterministic portfolio-wide value until every open position has
  a supported remaining cost basis.
- Trusted sector classifications are not yet populated.
- Cached prices may become stale between market-data refreshes.
- Historical OHLCV population is not complete for the future technical/momentum
  engine.
- Advanced investment engines remain future work.
- Manual transaction-entry UI is not implemented.

## E. Current next milestone

### Stage 5 — Transactions, FIFO Lot Accounting & Portfolio Accounting

This section records approved scope only. Stage 5 has not been designed or
implemented by this governance milestone.

**Transactions page:** add user-facing navigation and a page for reviewing
historical transactions, with search; sorting; security, broker/account,
transaction-type, and available-date filters; and visible data quality, source, and
provenance.

**Manual transaction entry:** support validated, trusted BUY/SELL entry with
portfolio, broker/demat account, security, transaction date, quantity, price,
available charges, appropriate source/notes, and auditable provenance.

**Accounting engine:** introduce transaction lots and deterministic FIFO accounting,
including partial sales, remaining quantity and cost basis, average cost, realised
and unrealised P&L, and explicit coverage/completeness states.

**Missing-date problem:** explicitly define behaviour when chronological ordering
cannot be established. Never invent dates; expose accounting quality/completeness
where deterministic FIFO is impossible.

**Auditability:** preserve imported historical evidence. Corrections and reversals
must be linked and auditable; manual changes must retain provenance and must not
silently rewrite trusted history.

## F. Deferred future work

- Core/Satellite/Thematic UI and classification
- ETF and other-asset-specific treatment
- Trendlyne/fundamental ingestion
- Quality-Growth diagnostic
- Core Selection and Core Health engines
- Satellite Opportunity Engine
- Valuation, Momentum/Technical, Sector, Risk, and Portfolio-Fit engines
- Position Sizing, Movement Radar, and Exit Radar
- Investment Thesis and Stock Detail
- Corporate research/document pipeline
- Ownership/shareholding intelligence
- Credit Intelligence
- Analyst & Earnings Revision Intelligence
- Why Stocks Moved and Portfolio Calendar
- Watchlist and Screeners
- Core/Satellite candidates
- AI Investment Committee
- Advanced quant/backtesting

**Deferred does not mean removed from scope.** Each area remains governed by the
Master Blueprint and requires its own reviewed implementation work.

## Documentation consistency

Repository code, migrations, generated database types, tests, Git history and the
owner-verified operational snapshot support the completed Stage 1–4 state recorded
above. The canonical Database Architecture and Stage 4 documentation now reflect
the remotely applied and operational Stage 4 deployment.
