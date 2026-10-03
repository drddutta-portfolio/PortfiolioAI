# PortfolioAI P8-B3 normalization and adjusted-series execution proposal

Date: 3 October 2026  
Environment: PortfolioAI Development only  
Stage: P8-B3  
Status: **PROPOSAL READY FOR OWNER APPROVAL — NO MATERIALIZATION AUTHORIZED**

## 1. Entry evidence

P8-B3 source acquisition and raw-history verification are complete and PASS.

Authoritative evidence:

- `docs/p8/PortfolioAI_P8_B3_R2_COMPLETE_RAW_PRICE_CAMPAIGN_LATEST.json`
- `docs/p8/PortfolioAI_P8_B3_SOURCE_COMPLETION_VERIFICATION_2026-10-03.json`
- `docs/p8/PortfolioAI_P8_B3_ARITHMETIC_PRECISION_ROUNDING_CONTRACT_FROZEN_2026-10-01.md`
- `docs/p8/PortfolioAI_P8_B3_MARKET_HISTORY_CORPORATE_ACTION_AUTHORITY_MEMO_2026-10-01.md`

Verified source state:

- NIFTY 500 TRI campaign dates: 744 / 744
- NSE raw-price source dates: 744 / 744
- canonical R2 raw-price rows: 1,854,978
- corporate-action monthly archives: 36 / 36
- corporate-action observations: 6,703
  - RESOLVED 6,078
  - AMBIGUOUS 184
  - UNRESOLVED 441
- derived rows remain zero
- Production and main unchanged

B2 closed authority:

- 32 frozen universe decision dates
- 2024-02-29 through 2026-09-29
- eligible security/date pairs measured: 121,956
- same-day raw-price pairs present: 81,403
- same-day raw-price pairs absent: 40,553
- same-day coverage: 66.747843%

The absent pairs are not evidence of a failed raw-source campaign. Many historically eligible securities need not trade on every decision date. They must nevertheless receive deterministic explicit treatment in B3; no implicit carry-forward or zero-imputation is permitted.

## 2. Frozen numerical authority

Use only the already owner-approved frozen contract:

- policy version: `P8_B3_ARITHMETIC_V1`
- adjustment version: `P8_B3_ADJUSTMENT_V2`
- internal precision: 50 significant digits
- persisted derived precision: 30 significant digits
- rounding: ROUND_HALF_EVEN
- total-return index base: 1000
- binary floating point is not authoritative

Any numerical-policy change requires a new version and separate owner approval.

## 3. Proposed execution sequence

### N0 — Re-entry and immutable preflight

Read-only only.

1. Reconfirm source-completion audit PASS.
2. Reconfirm derived B3 row counts remain zero.
3. Reconfirm 744 raw partitions/catalog parity and B3 RLS state.
4. Freeze a new normalization campaign ID and input fingerprint.
5. Produce a dry-run manifest of all 6,703 action observations and all 32 B2 decision dates.

STOP on any drift.

### N1 — Corporate-action normalization classification

No adjustment factors yet.

For each corporate-action observation:

- preserve raw purpose/terms unchanged;
- normalize only when explicit terms permit deterministic classification;
- supported initial action families:
  - CASH_DIVIDEND
  - SPLIT
  - CONSOLIDATION
  - BONUS
  - RIGHTS
  - MERGER_AMALGAMATION
  - DEMERGER_SPINOFF
  - SYMBOL_IDENTITY_TRANSITION
  - DELISTING_INACTIVE
  - OTHER_RESTRUCTURING
- unresolved or economically ambiguous rows remain BLOCKED;
- no price discontinuity may be used to infer an action.

The existing 184 AMBIGUOUS and 441 UNRESOLVED identity rows must remain fail-closed unless independently resolved from approved historical identity evidence.

### N2 — Missing-price blocker policy

For every B2 ELIGIBLE security/date pair without a same-day raw-price observation, assign one deterministic state; never silently impute.

Proposed states:

- `NO_TRADE_ON_DECISION_DATE` — identity is eligible but no official bhavcopy row exists for that identity/date;
- `PRICE_IDENTITY_NOT_RESOLVED` — official source row exists but cannot bind exactly to historical identity;
- `SOURCE_ROW_EXCLUDED_BY_FROZEN_SECURITY_TYPE` — source row is outside the frozen company-equity rule;
- `RAW_PRICE_REQUIRED_BUT_UNAVAILABLE` — other explicit source absence;
- `COMPLEX_CORPORATE_ACTION_BLOCKER` — price exists but cannot safely support adjusted return around unresolved action economics.

No last-price carry-forward is authorized by this proposal. If a stale/last-observation execution rule is ever desired, it must be separately specified and owner-approved before replay.

### N3 — Adjustment-factor canary

Materialize only a bounded hand-verifiable canary after separate owner approval.

Required fixture set:

1. no-action equity;
2. cash dividend;
3. split/consolidation;
4. bonus;
5. rights event with complete terms;
6. one complex/unsupported action that must remain blocked;
7. one eligible/no-same-day-price blocker.

Canary must prove:

- exact terms → deterministic normalization;
- deterministic factor math under P8_B3_ARITHMETIC_V1;
- correct ex/effective-date boundary;
- zero mutation of raw R2 price data;
- rerun creates zero duplicate facts;
- identical fingerprint on replay.

### N4 — Full normalization materialization

Only after N3 PASS and separate owner approval.

Populate `p8_b3_corporate_action_normalizations` append-only.

Requirements:

- service-only writer;
- deterministic UUID/hash;
- raw observation linkage mandatory;
- unsupported rows persist as BLOCKED with explicit reason;
- no normalization overwrites an earlier normalization version.

### N5 — Adjustment-factor materialization

Only from accepted normalizations.

Populate `p8_b3_adjustment_factors` append-only using `P8_B3_ADJUSTMENT_V2`.

Requirements:

- split/bonus/consolidation factors use declared terms only;
- dividend total-return treatment uses declared cash amount and approved reference-price rule;
- rights require full entitlement/subscription economics;
- merger/demerger/spin-off without complete economics remains blocked;
- no inferred factor from unexplained price jumps.

### N6 — Adjusted price / total-return series

Populate `p8_b3_adjusted_market_price_series` only after factor materialization passes.

For every historical identity/date required by the experiment produce either:

- deterministic adjusted/total-return series state, or
- one explicit blocker.

No missing pair may disappear from accounting.

### N7 — B3 final verification

Gate B3 may close only if:

- all source and derived fingerprints are reproducible;
- every required identity/date has adjusted output or explicit blocker;
- all 32 B2 decision dates reconcile;
- NIFTY 500 TRI aligns to the required outcome windows;
- action normalization/factor fixtures pass;
- rerun produces no duplicate or changed canonical facts;
- RLS/security pass;
- raw R2 OHLCV remains immutable;
- Production and main remain unchanged.

## 4. Approval boundaries

This proposal does **not** authorize any derived write.

Separate owner approval is required before:

1. creating/committing any materialization implementation that can write normalization/factor/adjusted-series rows, if not already present;
2. executing N3 canary writes in PortfolioAI Dev;
3. progressing from N3 to N4–N6 full materialization.

P8-B4, P8-C+, classification/taxonomy remediation, Production and main remain out of scope.

## 5. Proposed next authorization

Authorize **N0–N3 only**:

- N0 read-only preflight;
- N1 deterministic normalization classifier implementation/tests;
- N2 deterministic missing-price blocker classifier/tests;
- N3 bounded Development-only canary materialization and replay verification.

Stop after N3 and return for owner approval before full N4–N6 materialization.
