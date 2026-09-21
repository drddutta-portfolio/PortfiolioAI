# PortfolioAI — Gate J / G10.2 Checkpoint B: Global Generics Methodology Completion Candidate

**Date:** 21 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Reference:** AUROPHARMA  
**Status:** CANDIDATE IMPLEMENTED / OWNER APPROVAL REQUIRED

## Why this candidate exists

Checkpoint A is closed. The existing G6 Global Generics audit already proved that most numeric families are intentionally fail-closed:

- Operating Margin
- ROCE / Capital Efficiency
- Cash Conversion
- Balance Sheet / Leverage
- Valuation
- Ownership / Governance
- Regulatory / Market Risk
- Momentum

Copying Domestic, API or BANK/NBFC thresholds would violate the frozen isolation rules.

Checkpoint B therefore resolves the old G6 blockers inside the existing G10.2 stage instead of creating G6.46+ or a new Gate.

## Proposed consolidated policy

`REVIEWED_REFERENCE_RELATIVE_MEDIAN_V1`

Principles:

1. no fabricated absolute Global-Generics bands;
2. reviewed same-primary peer-relative percentile normalization where cross-company calibration is required;
3. self-history only where the parent contract already requires corroboration;
4. component aggregation by median rather than hidden weights;
5. every mandatory component must be present — no renormalization around missing inputs;
6. G4 regulatory state remains gate/context and is not numerically penalized twice;
7. NIFTY Pharma remains the market-relative Pharma benchmark candidate;
8. API Emerging Watch remains numerically excluded;
9. unresolved Biosimilars remains unresolved and numerically excluded.

## Existing approved building blocks retained

- PHARMA Segment Growth curve for Export / US growth;
- Global Generics pipeline combined-score contract;
- H2 reviewed qualitative-component normalization rubric.

## Current score state

```text
AUROPHARMA score = SCORE_NOT_COMPUTABLE
Reason = GLOBAL_GENERICS_METHOD_COMPLETION_NOT_OWNER_APPROVED
Recommendation = BLOCKED
Partial score reconstruction = FORBIDDEN
```

No score is calculated by this candidate.

## Owner decision

The localhost Gate J block must be visually reviewed before the methodology is executable.

Approval of this candidate does not persist a score, recommendation, position size, evidence row, assignment or production change.

After approval, Checkpoint B continues directly to the bounded AUROPHARMA evidence package, deterministic ten-dimension score, unchanged Gate I recommendation and one consolidated final validation.
