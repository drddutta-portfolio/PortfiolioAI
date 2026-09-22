# R4N Gate G5.7 — PHARMA_V1 Momentum Framework V1

**Status:** Proposal only / missing parent metric contract / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G5.7 defines the final G5 core family: **Momentum**.

The canonical Gate G model already allocates **8%** to `MOMENTUM`, and the repository already stores deterministic market-momentum evidence.

However, `pharmaResearchProfile.ts` currently contains **no dedicated PHARMA_V1 parent Momentum metric contract**.

G5.7 therefore versions the methodology framework while preserving that missing-parent-contract state as a fail-closed prerequisite.

## Canonical dimension

Canonical Gate G dimension:

`MOMENTUM`

Current dedicated Pharma parent metric:

`NONE`

Parent contract state:

`MISSING_DEDICATED_PHARMA_PARENT_CONTRACT`

A versioned PHARMA_V1 parent metric contract is required before Momentum can become active or score-ready.

G5.7 does not silently create or inject that parent contract into the scoring profile.

## Existing deterministic market evidence

The market-data foundation already provides:

- `PRICE_MOMENTUM_12M`
- `PRICE_MOMENTUM_6M`
- `RELATIVE_STRENGTH_12M`

Raw price authority:

`market_price_history`

Derived evidence store:

`market_metric_observations`

Existing absolute-momentum derivation:

- close-to-close return;
- first trading day on/after calendar lookback target;
- 14-day tolerance.

Relative-strength definition:

`stock return - approved benchmark return`

## Candidate methodology framework

G5.7 records:

1. `ABSOLUTE_MOMENTUM_12M`
2. `ABSOLUTE_MOMENTUM_6M`
3. `BENCHMARK_RELATIVE_STRENGTH_12M`

The following remain unapproved:

- component weights;
- absolute-momentum bands;
- relative-strength bands.

No numeric score is emitted.

## BANK_NBFC pilot separation

The existing HDFCBANK/BANK_NBFC pilot reviewed:

- 12M momentum at 40% of the Bank/NBFC Momentum dimension;
- 6M momentum at 30%;
- NIFTY Bank as the intended benchmark context for relative strength.

Those are **BANK_NBFC-specific reviewed rules**.

G5.7 explicitly records:

- Bank 12M weight inherited: **NO**
- Bank 6M weight inherited: **NO**
- NIFTY Bank benchmark inherited: **NO**
- Trendlyne technical Momentum score allowed: **NO**

PHARMA_V1 requires its own reviewed weighting and benchmark contract.

## Benchmark boundary

Relative-strength scoring requires an approved Pharma benchmark.

Current state:

`PHARMA_BENCHMARK_UNAPPROVED`

Until a benchmark is explicitly versioned:

- `RELATIVE_STRENGTH_12M` may remain evidence only;
- missing relative strength cannot become neutral;
- no denominator substitution is allowed.

## Why no numeric bands are created

The repository has robust derivations but does not yet have a reviewed PHARMA_V1 Momentum normalization contract.

Therefore G5.7 does not invent:

- absolute-return score bands;
- relative-strength score bands;
- component weights;
- Pharma benchmark choice.

## Fail-closed rules

Momentum remains non-scoreable when:

- dedicated PHARMA_V1 parent Momentum contract is absent;
- market history is insufficient for 12M/6M derivation;
- evidence is stale/conflicting;
- Pharma component weights/bands remain unapproved;
- relative-strength scoring is attempted without an approved Pharma benchmark.

Missing evidence is never zero or neutral.

## G5 completion boundary

With G5.7 prepared, all seven G5 core parent families now have proposal frameworks:

1. ROCE / Capital Efficiency
2. Cash Conversion
3. Balance Sheet / Leverage
4. Valuation
5. Ownership / Governance
6. Risk
7. Momentum

This does **not** mean G5 is activated.

Several prerequisites remain unresolved, including:

- legacy parent-dimension reconciliation for G5.1/G5.2/G5.3/G5.5;
- missing dedicated Pharma Momentum parent metric contract;
- unapproved numeric bands/weights;
- unapproved Pharma benchmark;
- G6 subprofile-specific curve thresholds.

## Repository artifacts

Added:

- `src/features/research/pharmaMomentumCurveProposal.ts`
- `src/features/research/pharmaMomentumCurveProposal.test.ts`
- this G5.7 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G5.7 · Momentum framework**
- **G5.7 · Parent-contract & benchmark boundary**

## Explicit non-activation boundary

- Momentum framework proposal: **YES**
- dedicated Pharma parent Momentum contract: **MISSING**
- Pharma benchmark approved: **NO**
- BANK/NBFC weights inherited: **NO**
- NIFTY Bank benchmark inherited: **NO**
- Trendlyne technical Momentum score used: **NO**
- component weights approved: **NO**
- numeric bands approved: **NO**
- numeric Momentum curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G5.7 cards on TORNTPHARM → Research → Gate G;
3. confirm the missing-parent-contract and benchmark boundaries;
4. run focused G5.7 validation.

Only after G5.7 validation should Gate G advance to **G6 — Subprofile-Specific Curves**.
