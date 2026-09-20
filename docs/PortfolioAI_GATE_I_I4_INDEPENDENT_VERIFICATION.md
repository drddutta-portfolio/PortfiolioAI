# PortfolioAI — Gate I / I4 Independent Verification and Gate I Closure Candidate

**Date:** 21 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**I4 base head:** `d051d7a8f05d11c902a451de73c8fb5fd2572ba3`
**Status:** IMPLEMENTED / VALIDATION + GATE I CLOSURE REVIEW PENDING

## Purpose

I4 independently reproduces the first PHARMA_V1 recommendation and proves that Gate I did not change the closed Gate H score or activate downstream mutation/action paths.

I4 does not introduce a new recommendation methodology.

## Independent hand verification

The I4 hand fixture independently uses the owner-approved I2 rules:

```text
Core >= 80
Satellite >= 65
Watch >= 50
Avoid < 50 only when fully evaluable
```

TORNTPHARM overall score:

`75.1575`

Therefore:

- Core threshold: FAIL;
- Satellite threshold: PASS;
- Watch threshold: PASS.

Satellite role floors:

| Dimension | Minimum | Observed | Result |
|---|---:|---:|---|
| Quality | 50 | 92 | PASS |
| Growth | 50 | 78.25 | PASS |
| Cash Flow | 50 | 93.6 | PASS |
| Balance Sheet / Credit | 50 | 65 | PASS |
| Business Durability | 50 | 75 | PASS |
| Ownership / Governance | 50 | 70 | PASS |
| Risk | 50 | 80 | PASS |

All 7 Satellite floors pass.

Cautions:

- Valuation 30 < Neutral 50 -> `VALUATION_BELOW_NEUTRAL_ANCHOR`;
- Momentum 95 -> no caution.

Governance:

- CLEAR;
- no second penalty;
- no cap.

Context:

- Global Generics Material Overlay -> context only, no second recommendation;
- CDMO / CRAMS Emerging Watch -> context only, no numeric role input.

Independent hand result:

> **SATELLITE_CANDIDATE**

## Score preservation

I4 verifies exact preservation of the Gate H result:

| Dimension | Gate H | Gate I3 |
|---|---:|---:|
| Quality | 92 | 92 |
| Growth | 78.25 | 78.25 |
| Capital Efficiency | 79 | 79 |
| Cash Flow | 93.6 | 93.6 |
| Balance Sheet / Credit | 65 | 65 |
| Business Durability | 75 | 75 |
| Valuation | 30 | 30 |
| Momentum | 95 | 95 |
| Ownership / Governance | 70 | 70 |
| Risk | 80 | 80 |
| **Overall** | **75.1575** | **75.1575** |

No recommendation-side score reconstruction or denominator renormalization is permitted.

## Anti-leakage

I4 verifies:

- BANK_NBFC thresholds not used;
- BANK_NBFC mandatory floors not used;
- NIFTY Bank logic not used;
- HDFCBANK-specific assumptions not used;
- no Global Generics second recommendation;
- no CDMO Emerging numeric role input;
- no governance double counting.

## Determinism

The I3 recommendation is run twice from the same locked authority and policy.

Expected result:

- serialized outputs identical;
- role identical;
- score identical;
- rationale/floors/cautions/context identical.

## AUROPHARMA negative control

AUROPHARMA must remain:

```text
Score authority = SCORE_NOT_COMPUTABLE
Role = INSUFFICIENT
Overall score = null
Dimensions exposed = 0
Threshold state = NOT_EVALUATED
```

No partial-score reconstruction is allowed.

## Safety verification

I4 verifies the I3 recommendation result remains:

- read-only;
- non-persisting;
- recommendation persistence disabled;
- score persistence disabled;
- weight guidance disabled;
- action bias disabled;
- position sizing disabled;
- AI interpretation disabled.

The independent test also source-audits the I3 recommendation adapter for forbidden mutation/action/provider dependencies.

The shared UI regression suite additionally proves that the read-only sector extension does not call `recordRecommendationPreview`.

## Engineering validation

Run:

`git pull && bash scripts/i4-validate-pharma-recommendation-closure.sh`

The consolidated command performs:

1. focused I4 + Gate I regressions;
2. related Gate H preservation regressions;
3. full non-Edge application test suite;
4. strict TypeScript;
5. presentation architecture guard;
6. focused I4 lint + architecture lint;
7. production build;
8. diff whitespace check.

No Edge Function code changed, so Edge tests are not part of the I4 closure gate.

## Safety boundary

I4 does not authorize:

- score persistence;
- recommendation persistence;
- policy activation in production;
- recommendation history creation;
- weight guidance;
- action bias;
- AI recommendation interpretation;
- position sizing;
- user role mutation;
- target-weight mutation;
- target-price mutation;
- stop-loss mutation;
- provider calls;
- production Supabase mutation;
- deployment;
- PR #101 merge;
- automatic trading.

## Current state

```text
Gate H = COMPLETE / PASS
I1 = COMPLETE / PASS
I2 = COMPLETE / PASS
I3 = COMPLETE / PASS
I4 = IMPLEMENTED / VALIDATION + GATE I CLOSURE REVIEW PENDING
```

Gate I is not closed until the I4 consolidated validation passes and the closure result is recorded.
