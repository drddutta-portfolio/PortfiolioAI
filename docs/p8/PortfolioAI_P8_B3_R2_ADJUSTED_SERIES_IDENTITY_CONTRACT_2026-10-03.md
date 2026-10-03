# PortfolioAI P8-B3 R2-backed adjusted-series identity contract

Date: 3 October 2026  
Environment: PortfolioAI Development only  
Stage: P8-B3 N6  
Status: OWNER-AUTHORIZED / FROZEN FOR N4-N6 EXECUTION

## 1. Storage authority

The canonical raw-price source for N6 is:

`portfolioai-history/development/p8/b3/raw-prices/v1/year=YYYY/month=MM/trade_date=YYYY-MM-DD/part-00000.parquet`

Each canonical raw row already preserves:

- `id` — immutable raw-price observation ID
- `historical_identity_id`
- `trade_date`
- `trading_symbol`
- `series`
- raw OHLCV fields
- `row_hash`
- source archive lineage

The public runtime Worker is not canonical identity authority because it intentionally strips `historical_identity_id`.

## 2. Derived storage doctrine

Bulk adjusted-series data MUST remain outside PostgreSQL.

Authoritative derived roots:

- adjusted rows:
  `portfolioai-history/development/p8/b3/adjusted-series/v2/year=YYYY/month=MM/trade_date=YYYY-MM-DD/`
- decision-date blockers:
  `portfolioai-history/development/p8/b3/decision-date-blockers/v1/decision_date=YYYY-MM-DD/`
- derived catalog:
  `portfolioai-history/development/p8/catalog/v1/b3-adjusted-series.json`

The legacy PostgreSQL table `p8_b3_adjusted_market_price_series` remains fail-closed and must stay at zero rows.

## 3. Canonical adjusted-row identity

Logical key:

`(historical_identity_id, raw_price_observation_id, adjustment_version)`

Frozen adjustment version:

`P8_B3_ADJUSTMENT_V2`

Each adjusted row must contain:

- raw price observation ID
- historical identity ID
- trade date
- adjustment version
- READY/BLOCKED state
- cumulative price factor when READY
- adjusted OHLC when READY
- daily price return when defined
- daily total return when defined
- total-return index when defined
- explicit blocker reason when BLOCKED
- deterministic lineage JSON
- deterministic SHA-256 series hash

No derived row may infer identity from symbol alone.

## 4. Arithmetic

Frozen authority:

- arithmetic policy: `P8_B3_ARITHMETIC_V1`
- internal precision: 50 significant digits
- persisted derived precision: 30 significant digits
- ROUND_HALF_EVEN
- total-return index base: 1000
- binary floating point is not authoritative

## 5. Corporate-action treatment

READY share-action factors:

- SPLIT
- BONUS

are applied as declared back-adjustment factors to rows strictly before their effective date.

READY cash-dividend factors use the exact historical-identity-bound previous and ex-date canonical raw closes.

RIGHTS remains factor-BLOCKED until a separately approved rights pricing treatment exists.

MERGER/DEMERGER or other unsupported economics remain BLOCKED when successor entitlement/valuation lineage is not explicit.

If an identity/date has multiple economic events requiring an ordering not frozen by policy, that date becomes an explicit blocker. No ordering is guessed.

## 6. Series blocker propagation

A resolved BLOCKED economic event compromises continuity from its effective date onward for that historical identity.

Rows before the first blocker may remain READY when their own lineage is complete.

Rows on/after the first blocker remain BLOCKED until a future separately versioned remediation policy resolves the event.

An undated resolved economic blocker blocks the entire identity series.

Unresolved/ambiguous observations with no proven historical identity do not get silently attached to an identity.

## 7. Missing B2 decision-date prices

For each of the 32 frozen B2 decision dates, every ELIGIBLE historical identity must have either:

- a same-day canonical raw-price row, or
- one explicit blocker row.

Permitted blocker states:

- `NO_TRADE_ON_DECISION_DATE`
- `PRICE_IDENTITY_NOT_RESOLVED`
- `SOURCE_ROW_EXCLUDED_BY_FROZEN_SECURITY_TYPE`
- `RAW_PRICE_REQUIRED_BUT_UNAVAILABLE`
- `COMPLEX_CORPORATE_ACTION_BLOCKER`

No carry-forward, backfill, zero-price substitution, or inferred trade is permitted.

## 8. Atomic R2 publication

For every adjusted trade-date partition:

1. write Parquet to a temporary/staging key;
2. compute/read back SHA-256 and row count;
3. publish canonical Parquet;
4. publish partition manifest last.

The final derived catalog is published only after all 744 adjusted partitions and all 32 blocker partitions verify.

Existing canonical raw-price objects are immutable and must not be rewritten.

## 9. Idempotency

A rerun with identical raw catalog, normalization/factor state and policy versions must produce:

- identical partition fingerprints;
- identical aggregate fingerprint;
- zero duplicate PostgreSQL factors;
- no mutation of canonical raw R2 objects;
- identical derived catalog.

Any existing derived object with a different expected hash is a hard stop.

## 10. Completion gate

N6 can PASS only when:

- N4 normalization coverage = 6,703 / 6,703 campaign observations;
- every READY normalization has exactly one N5 factor;
- N5 factors are READY or explicitly BLOCKED;
- 744 adjusted partitions are present and verified;
- raw and adjusted partition date sets match exactly;
- raw/adjusted row counts match exactly;
- all 32 B2 decision dates have complete output-or-blocker accounting;
- PostgreSQL adjusted-series rows remain zero;
- Production and `main` remain unchanged.
