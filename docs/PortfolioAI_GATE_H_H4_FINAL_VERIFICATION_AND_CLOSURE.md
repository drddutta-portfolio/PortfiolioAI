# PortfolioAI — Gate H H4 Independent Verification and Final Closure

**Date:** 20 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — KEEP OPEN / DRAFT / UNMERGED
**Target:** TORNTPHARM / PHARMA_V1
**Stage:** H4 — Independent Verification + Determinism + Gate H Closure
**Status:** IMPLEMENTED / CONSOLIDATED VALIDATION PENDING / GATE H NOT YET CLOSED

## Purpose

H4 independently reproduces the owner-approved H3 score from the locked underlying observations and approved contracts. It does not reuse H3 as the source of the hand calculation and it does not create a second production scoring engine.

Verification implementation:

- `src/features/research/torntpharmGateH4IndependentVerification.ts`
- `src/features/research/torntpharmGateH4IndependentVerification.test.ts`
- `scripts/h4-validate-torntpharm-gate-h-closure.sh`

The H3 adapter result is used only as the final cross-check target after the independent calculation is complete.

## Independent hand calculation

| Dimension | Independently reconstructed score | Fixed weight | Contribution |
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
| **Total** | — | **100%** | **75.1575** |

Independent hand total:

`75.1575 / 100`

H3 adapter result:

`75.1575 / 100`

Required H4 equality:

`hand total === adapter result`

Rounding convention:

`ROUND_TO_4_DECIMAL_PLACES_AFTER_FIXED_WEIGHT_SUM`

## Evidence trace verification

### Quality

Eight comparable quarters are independently recomputed from operating revenue and operating EBITDA in the H2 official evidence pack.

Derived statistics:

- median latest-8 operating margin ≈ 32.644427%;
- Type-7 IQR ≈ 0.304315 percentage points;
- latest-4 median minus prior-4 median ≈ +0.348595 percentage points.

Approved component bands produce:

- level = 100;
- stability = 100;
- trend = 60.

`100×50% + 100×30% + 60×20% = 92`.

### Growth

Locked comparable Domestic Formulations growth observations:

- 30 Jun 2025 = 11%;
- 30 Sep 2025 = 12%;
- 31 Dec 2025 = 14%;
- 31 Mar 2026 = 15% base-business growth excluding JB acquisition effect.

Derived:

- median = 13%;
- positive quarters = 4/4;
- latest minus prior-three median = +3 percentage points.

Component scores:

- level = 70;
- consistency = 100;
- trend = 75.

`70×60% + 100×25% + 75×15% = 78.25`.

### Capital Efficiency

Locked official ROCE:

- FY2024 = 28%;
- FY2025 = 31%;
- FY2026 = 26%.

Derived:

- median = 28%;
- Type-7 IQR = 2.5 percentage points;
- latest minus prior median = -3.5 percentage points.

Component scores:

- level = 85;
- stability = 100;
- trend = 40.

`85×60% + 100×20% + 40×20% = 79`.

### Cash Flow

Locked annual matched CFO / PAT / FCF observations cover FY2024–FY2026.

Derived:

- median CFO/PAT ≈ 1.397223;
- median FCF/PAT ≈ 1.084105;
- positive FCF years = 3/3;
- latest CFO/PAT minus prior median ≈ -0.264974.

Component scores:

- CFO/PAT = 100;
- FCF/PAT = 100;
- consistency/trend = 68.

`100×45% + 100×35% + 68×20% = 93.6`.

### Balance Sheet / Credit

Locked Net Debt / EBITDA:

- FY2024 = 0.9×;
- FY2025 = 0.6×;
- FY2026 = 2.3×.

Locked Interest Coverage:

- FY2024 = 8.40×;
- FY2025 = 12.43×;
- FY2026 = 9.26×.

Derived:

- median leverage = 0.9×;
- median interest coverage = 9.26×;
- latest leverage minus prior median = +1.55×.

Component scores:

- leverage = 80;
- interest coverage = 70;
- trend resilience = 20.

`80×50% + 70×30% + 20×20% = 65`.

### Business Durability

The four owner-approved H2 reviewed states are independently normalized through the approved qualitative rubric:

- Brand / Therapy Leadership = STRONG = 75;
- Field Force Productivity = STRONG = 75;
- R&D Productivity = STRONG = 75;
- Pipeline / Corporate Execution = STRONG = 75.

`75×35% + 75×25% + 75×20% + 75×20% = 75`.

Evidence lineage remains the locked H2 Business Durability review, including the independent AIOCD-derived cross-check for Brand / Therapy Leadership.

### Valuation

Verification-only fixture is transcribed from the owner-approved canonical H2 M&A transition valuation document.

Self-history:

- implied upside = -15.90%;
- approved band => 40.

Peer observations:

| Security | PE_TTM | EV/EBITDA |
|---|---:|---:|
| MANKIND | 46.51 | 22.33 |
| ERIS | 28.21 | 17.92 |
| EMCURE | 35.82 | 16.70 |
| TORNTPHARM target | 85.02 | 37.11 |

Peer medians:

- PE = 35.82;
- EV/EBITDA = 17.92.

Independent relative calculations:

- PE ≈ -57.87% => score 20;
- EV/EBITDA ≈ -51.71% => score 20.

Peer-relative:

`20×50% + 20×50% = 20`.

Owner-approved M&A transition:

`40×50% + 20×50% + FCF×0% = 30`.

No neutral FCF substitution and no hidden renormalization are used.

### Momentum

Local locked Angel One market-history evidence as of 17 Sep 2026:

- 12M absolute = 35.673039%;
- 6M absolute = 13.343637%;
- 12M relative strength vs NIFTY Pharma = 17.352467%.

Component scores:

- 12M = 100;
- 6M = 80;
- relative strength = 100.

`100×40% + 80×25% + 100×35% = 95`.

### Ownership / Governance

Four official observations from Mar 2025 through Mar 2026 show:

- promoter/promoter group = 68.31% in all four reviewed periods;
- pledged/encumbered = 0% in all four reviewed periods.

Reviewed states:

- Ownership Stability = STRONG = 75;
- Pledge / Control Risk = STRONG = 75;
- Non-G4 Governance Context = NEUTRAL = 50.

`75×45% + 75×35% + 50×20% = 70`.

G4-consumed events are not penalized again.

### Risk

Governance runtime is independently resolved from the locked runtime input:

- event class = Regulatory;
- severity = Moderate;
- materiality = Known Material;
- facility/product/geography scope established;
- remediation = Closed Out;
- subsequent outcome established;
- governance-blocked review = false.

Therefore current runtime = CLEAR and regulatory context = 100 while the historical event remains retained.

Market-risk evidence:

- 1Y signed max drawdown = -10.319388%;
- stock volatility = 22.000330%;
- NIFTY Pharma volatility = 13.720605%;
- relative volatility ratio = 1.603452.

Component scores:

- regulatory context = 100;
- max drawdown = 100;
- relative volatility = 20.

`100×40% + 100×35% + 20×25% = 80`.

## Overlay verification

Global Generics remains a reviewed Material business exposure.

- locked economic materiality = 12.05%;
- numeric-overlay threshold = 15%;
- threshold result = below scoring materiality;
- numeric modifier = not applied / null;
- second stock score = none.

CDMO / CRAMS remains Emerging Watch:

- numeric participation = none;
- denominator participation = none;
- second stock score = none.

## Explicit lineage manifest

The H4 verifier exposes evidence lineage separately from the score result for every weighted dimension.

Evidence authorities include:

- Quality — the exact issuer quarterly releases referenced by the eight locked operating-margin rows;
- Growth — the four exact issuer result releases used for the comparable Domestic growth series;
- Capital Efficiency — `TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE:ROCE_MANAGEMENT_ANNUAL`, transcribed from the owner-reviewed R4L official evidence manifest;
- Cash Flow — the FY2024-25 and FY2025-26 issuer annual reports used for matched CFO/PAT/CAPEX/FCF;
- Balance Sheet / Credit — the locked official-manifest Net Debt/EBITDA and Interest Coverage series;
- Business Durability — all component source-lineage entries from the owner-approved H2 review;
- Valuation — `docs/PortfolioAI_GATE_H_H2_MA_TRANSITION_VALUATION_V1.md`;
- Momentum — local Supabase Angel One TORNTPHARM + NIFTY Pharma history, as-of 17 Sep 2026;
- Ownership / Governance — the four exact official shareholding-pattern documents;
- Risk — local Angel One market history plus the owner-approved regulatory runtime mapping.

The verifier also exposes the methodology contract version used for every dimension, the fixed-weight contract, the overlay contract, and the governance constraint/runtime contract.

## Anti-leakage verification

H4 explicitly tests:

- BANK_NBFC token absent from the H3 result;
- NIFTY Bank token absent;
- NIFTY Pharma benchmark retained;
- no Global Generics second stock score;
- no CDMO Emerging numeric inclusion;
- no second governance/regulatory numeric penalty;
- no missing-evidence neutralization;
- no hidden denominator renormalization.

## Determinism

The same locked H3 input package is calculated twice.

Required result:

- first = 75.1575;
- second = 75.1575;
- serialized outputs identical.

## Safety

H4 remains verification-only.

It does not:

- persist a score;
- create a recommendation;
- create position sizing;
- mutate production Supabase;
- call a provider;
- deploy;
- merge PR #101;
- start Gate I.

## First local validation attempt

The first owner-run H4 validation attempt stopped in the focused H4 test suite on one assertion only:

- independently derived leverage trend expected mathematically: `1.55`;
- JavaScript binary floating-point representation observed: `1.5499999999999998`.

This did **not** change:

- the approved leverage-trend score band;
- Balance Sheet / Credit score = 65;
- any weighted contribution;
- overall score = 75.1575.

The verifier continues to evaluate the unrounded numeric value against the approved scoring band. Only the test assertion was corrected from exact binary equality to `toBeCloseTo(1.55, 12)`.

No methodology, evidence, dimension score, weight, or H3 result was changed.

## Full-suite historical-snapshot regression discovered

After the floating-point assertion correction, the H4-focused tests advanced into the full application suite.

The full suite exposed six visible inherited assertion failures in historical Gate G/H1 artifacts. These were not H4 score failures:

1. G-FINAL-3 historical TORNTPHARM runtime expected `REVIEW_REQUIRED`, but its test imported the later H2-resolved current runtime (`CLEAR`).
2. H1 historical readiness expected `REVIEW_REQUIRED`, but its source dynamically imported the later H2-resolved current runtime.
3. Four Global Generics G6 historical methodology gates correctly retained `parentDimensionReconciliationRequired = true`, but dynamically read the later promoted parent curve state `ALIGNED_VERSIONED_PARENT` instead of their original frozen `REQUIRES_VERSIONED_PARENT_RECONCILIATION`.

Canonical documents confirm the historical expectations are correct:

- G-FINAL-3 froze TORNTPHARM at `REVIEW_REQUIRED` at that stage;
- H1 recorded Risk as `RUNTIME_REVIEW_REQUIRED`;
- G6.32 / G6.34 / G6.36 / G6.40 explicitly preserved the parent-dimension reconciliation blocker.

The repair freezes those historical snapshots in their own artifacts. It does **not** alter:

- current H2-resolved TORNTPHARM governance runtime = `CLEAR`;
- current promoted parent dimension contract = `PHARMA_V1_GATE_G_DIMENSIONS_V1`;
- any H2/H3 dimension score;
- H3 overall score = 75.1575;
- any approved scoring methodology.

The affected historical regression tests are now included in H4 focused validation before the full application suite.

## Full-suite harness correction — Deno Edge test exclusion

The next H4 validation attempt progressed past all application assertions and reported:

- **1,089 tests passed**;
- **1 failed suite**;
- no failed application assertion.

The remaining suite failure was:

`supabase/functions/refresh-pharma-benchmark/index.test.ts`

That file is a native Deno test and imports:

- `jsr:@std/assert`;
- `Deno.readTextFile`;
- `Deno.test`.

The default project `npm test` command uses Node/Vitest and therefore cannot resolve that Deno-only module. This is a test-runner boundary mismatch, not an H4 application or scoring regression.

H4 touches no Edge Function code, and Edge tests are explicitly outside the H4 validation requirement. Therefore the H4 "full application" step now runs:

```bash
npx vitest run --exclude "supabase/functions/**"
```

This preserves the repository-wide `npm test` command and all Edge tests unchanged while making the H4 validation scope explicit: full non-Edge application tests plus the focused H4/Gate-H regressions.

## Consolidated H4 validation

Run exactly:

```bash
git pull && bash scripts/h4-validate-torntpharm-gate-h-closure.sh
```

This runs:

1. focused H4 + Gate H regressions;
2. full application tests;
3. strict TypeScript;
4. presentation data-boundary architecture guard;
5. focused H4 lint;
6. existing architecture lint;
7. production build;
8. `git diff --check` across the H4 change range.

Edge tests are not required because H4 touches no Edge Function code.

## Gate H closure condition

Gate H is not closed until the consolidated H4 validation returns:

`H4 VALIDATION PASS`

On that result, the authorized closure state will be:

```text
H1 = COMPLETE / PASS
H2 = COMPLETE / PASS
H3 = COMPLETE / PASS
H4 = COMPLETE / PASS

GATE H = COMPLETE
TORNTPHARM FIRST DETERMINISTIC SCORE = COMPLETE
FIRST DETERMINISTIC SCORE = 75.1575 / 100
SCORE PERSISTENCE = OFF
RECOMMENDATION = OFF
POSITION SIZING = OFF
```

Gate I remains NOT STARTED until Gate H closure is recorded.
