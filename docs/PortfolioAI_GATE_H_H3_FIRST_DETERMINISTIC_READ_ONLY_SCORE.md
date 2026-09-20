# PortfolioAI — Gate H H3 First Deterministic Read-Only TORNTPHARM Score

**Date:** 20 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — KEEP OPEN / DRAFT / UNMERGED
**Stage:** H3 — FIRST DETERMINISTIC READ-ONLY TORNTPHARM SCORE
**Status:** IMPLEMENTED / CONSOLIDATED VALIDATION PENDING / OWNER REVIEW PENDING

## Purpose

H3 consumes the formally closed H2 input package and the already-approved Gate G/G7 methodology. It does not reopen H2 methodology and does not create a parallel scoring engine.

The implementation reuses:

- `PHARMA_V1_G7_READ_ONLY_SCORING_ADAPTER_V1_PROPOSAL` as the existing pure fixed-weight read-only adapter;
- the approved Gate G fixed ten-dimension weights;
- the owner-approved Global Generics overlay eligibility/materiality contracts;
- the owner-approved G7 governance high-risk constraint;
- the resolved TORNTPHARM governance/regulatory runtime.

## Locked H2 inputs and fixed contributions

| Dimension | H2 locked score | Weight | H3 contribution |
|---|---:|---:|---:|
| Quality | 92 | 13% | 11.9600 |
| Growth | 78.25 | 15% | 11.7375 |
| Capital Efficiency | 79 | 10% | 7.9000 |
| Cash Flow | 93.6 | 10% | 9.3600 |
| Balance Sheet / Credit | 65 | 10% | 6.5000 |
| Business Durability | 75 | 10% | 7.5000 |
| Valuation | 30 | 12% | 3.6000 |
| Momentum | 95 | 8% | 7.6000 |
| Ownership / Governance | 70 | 6% | 4.2000 |
| Risk | 80 | 6% | 4.8000 |

Fixed-weight total:

`11.9600 + 11.7375 + 7.9000 + 9.3600 + 6.5000 + 7.5000 + 3.6000 + 7.6000 + 4.2000 + 4.8000 = 75.1575`

> **H3 deterministic read-only overall score = 75.1575 / 100**

No denominator renormalization is used.

## Global Generics Material Overlay

The reviewed business exposure remains `MATERIAL`.

Locked economic materiality:

- 12.05%

Approved numeric overlay minimum:

- 15%

Therefore the current H3 treatment is:

- material business context remains visible;
- Global Generics touches the approved overlay dimensions;
- numeric modifier = **not applied / null** because the locked exposure is explicitly `BELOW_SCORING_MATERIALITY`;
- no neutral substitution is used for missing evidence;
- no second Global Generics stock score is created.

This is an explicit contract exclusion, not a missing-data fallback.

## CDMO / CRAMS Emerging Watch

CDMO / CRAMS remains:

- visible research context;
- Emerging Watch;
- excluded from numeric scoring;
- excluded from the score denominator;
- not represented by an independent stock score.

## Governance / regulatory runtime

Current locked runtime resolves to:

- constraint state: `CLEAR`;
- overall preview blocked: NO;
- numeric penalty: NONE;
- overall score cap: NONE;
- historical Indrad event retained: YES.

The same regulatory history is not penalized again inside H3.

## Valuation lineage

Current Valuation = 30 under:

`PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED`

Current transition:

- Self-history = 40 at 50%;
- Peer-relative = 20 at 50%;
- FCF corroboration = 0% weight while comparable post-merger completed annual FCF is unavailable.

The base G6.17 40/40/20 contract remains unchanged and resumes when the transition exit condition is met.

## Engineering contract

Implementation:

- `src/features/research/torntpharmGateH3ReadOnlyScore.ts`
- `src/features/research/torntpharmGateH3ReadOnlyScore.test.ts`
- existing `pharmaG7ReadOnlyScoringAdapter.ts` reused with an explicit below-scoring-materiality participation state;
- `pharmaSectorWorkspaceCompanyContext.ts` used as the shared company-level preview registry, avoiding a new permanent symbol branch in the Research component;
- existing Pharma Research workspace reused for read-only display;
- no score table or persistence path added.

The Research UI displays:

- all ten dimension scores;
- fixed weights;
- weighted contributions;
- final overall score;
- overlay treatment;
- governance state;
- methodology, evidence and derived-statistic lineage.

## Fail-closed invariants

H3 tests explicitly cover:

- exact fixed weights totaling 100%;
- exact deterministic 75.1575 result;
- no hidden reweighting;
- all ten dimensions mandatory;
- below-threshold Global Generics numeric exclusion;
- no Global Generics second stock score;
- CDMO Emerging Watch numeric exclusion;
- governance CLEAR with no extra penalty/cap;
- no BANK_NBFC leakage;
- no NIFTY Bank leakage;
- NIFTY Pharma benchmark retention;
- no persistence, recommendation or sizing;
- repeated calculation identity.

## Consolidated validation command

Because hosted CI availability is external to H3, the repository also provides one non-mutating local validation command:

```bash
bash scripts/h3-validate-torntpharm-read-only-score.sh
```

It runs the focused H3 tests, related Gate G/G7/H2 regressions, TypeScript, the presentation data-boundary guard, focused H3 lint, existing architecture lint, production build, and `git diff --check` across the H3 change range.

## Safety boundary

H3 does **not** authorize or perform:

- official score-run persistence;
- recommendation;
- position sizing;
- production Supabase mutation;
- provider call;
- deployment;
- PR #101 merge;
- Gate I;
- scoring rollout to another Pharma stock.

Production remains untouched.

## Stage boundary

H1 = COMPLETE / PASS
H2 = COMPLETE / PASS
H3 = IMPLEMENTED / VALIDATION PENDING
H4 = NOT STARTED

Gate H is **not** closed by this document. H4 remains the separate independent hand-verification and closure stage.
