# PortfolioAI — Gate I / I3 First PHARMA_V1 Recommendation + AUROPHARMA Fail-Closed Control

**Date:** 21 September 2026
**Repository:** `drddutta-portfolio/PortfiolioAI`
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**I3 base head:** `4564614e4f7efcb8b5204d86d59a1d4af7ec5537`
**Status:** IMPLEMENTED / VALIDATION + OWNER VISUAL REVIEW PENDING

## Purpose

I3 applies the owner-approved PHARMA_V1 recommendation policy for the first time without persistence.

It has two reference controls:

1. TORNTPHARM — the first completed-score deterministic recommendation;
2. AUROPHARMA — the real fail-closed negative control while Global Generics Primary scoring methodology remains incomplete.

No score is recalculated in I3.

## TORNTPHARM deterministic result

Authoritative Gate H input:

| Dimension | Locked score |
|---|---:|
| Quality | 92 |
| Growth | 78.25 |
| Capital Efficiency | 79 |
| Cash Flow | 93.6 |
| Balance Sheet / Credit | 65 |
| Business Durability | 75 |
| Valuation | 30 |
| Momentum | 95 |
| Ownership / Governance | 70 |
| Risk | 80 |
| **Overall** | **75.1575** |

Approved I2 ladder:

- Core >= 80;
- Satellite >= 65;
- Watch >= 50;
- Avoid < 50 only when fully evaluable.

Deterministic evaluation:

- Core overall threshold: not reached;
- Satellite overall threshold: passed;
- all seven Satellite role floors: passed;
- Valuation 30: visible caution below Neutral 50;
- Momentum 95: no caution;
- governance: CLEAR;
- Global Generics Material Overlay: context only;
- CDMO / CRAMS Emerging Watch: context only and numerically excluded;
- no second score or recommendation.

Expected I3 role:

> **SATELLITE_CANDIDATE**

This is a PortfolioAI research-role suggestion. It does not change the user's selected portfolio role.

## AUROPHARMA fail-closed result

Canonical research role:

- Primary: GLOBAL_GENERICS;
- Emerging Watch: API_BULK_DRUGS;
- unresolved Biosimilars remains outside active authority.

Upstream score state:

`SCORE_NOT_COMPUTABLE`

Reason:

`GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE`

Expected I3 result:

> **INSUFFICIENT**

I3 does not expose partial dimensions, reconstruct an overall score, or renormalize a denominator for AUROPHARMA.

## Implementation

Added:

- `src/features/research/pharmaGateI3ReadOnlyRecommendation.ts`;
- `src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts`;
- `src/features/research/PharmaRecommendationPanel.tsx`;
- `src/features/research/PharmaRecommendationPanel.test.tsx`;
- `scripts/i3-validate-pharma-first-recommendation.sh`.

Updated:

- `src/pages/ResearchPage.tsx`;
- `.github/workflows/architecture-guard.yml`;
- Gate I plan;
- cumulative HANDOFF.

The read-only result preserves:

- policy version;
- source authority state;
- overall score where authoritative;
- all ten TORNTPHARM dimension scores;
- role threshold result;
- floor evaluations;
- cautions;
- governance state;
- overlay context;
- reason codes;
- evidence lineage;
- methodology lineage;
- deterministic/read-only/non-persisting flags.

## UI boundary

The shared Research Overview now receives one reusable PHARMA_V1 recommendation panel for the I3 reference companies.

It explicitly shows:

`PortfolioAI suggested research role ≠ Your selected portfolio role`

The panel does not include:

- suggested weight;
- action bias;
- trade action;
- AI interpretation action;
- persistence action.

No Research-page redesign or permanent TORNTPHARM-specific page tree was created.

## Safety

I3 implementation does not:

- write `stock_recommendation_runs`;
- call `record_recommendation_preview_v2`;
- create OFFICIAL or PREVIEW recommendation rows;
- persist the H3 score;
- activate a production recommendation policy;
- generate weight guidance;
- generate action bias;
- invoke AI interpretation;
- invoke position sizing;
- mutate user portfolio settings;
- invoke a provider;
- mutate production Supabase;
- deploy;
- merge PR #101;
- place an order.

## Validation

Run:

`git pull && bash scripts/i3-validate-pharma-first-recommendation.sh`

After the consolidated command passes, visually inspect localhost:

- TORNTPHARM Overview should show Satellite candidate, score 75.1575, 7/7 applicable Satellite floors passed, and the Valuation caution;
- AUROPHARMA Overview should show Insufficient / Not computable with the Global Generics methodology blocker;
- each page must keep the PortfolioAI suggested role separate from the current user-selected portfolio role.

## Current state

```text
Gate H = COMPLETE / PASS
I1 = COMPLETE / PASS
I2 = COMPLETE / PASS
I3 = IMPLEMENTED / VALIDATION + OWNER VISUAL REVIEW PENDING
I4 = NOT STARTED
```

Do not start I4 automatically.


## Core-shell / sector-add-on integration correction

Owner visual review confirmed the I3 detail panel itself was correct, but exposed a contradictory presentation: the universal Decision Workspace still showed its older generic `Recommendation pending` state while the Pharma sector add-on showed the valid I3 result.

The owner reaffirmed the stock-page architecture:

```text
Universal stock/research core shell
    ->
sector/profile-oriented add-ons
```

The correction preserves that rule.

The universal Decision Workspace remains the same component for every stock. It now accepts a generic read-only sector-recommendation extension contract. PHARMA_V1 supplies the Gate I3 result through that generic extension point.

Consequences:

- the core shell's existing `PortfolioAI suggestion` surface shows the sector-authoritative I3 role;
- the detailed PHARMA_V1 panel remains below as a sector add-on and is labelled `PHARMA_V1 recommendation detail`;
- no permanent Pharma-specific stock-page fork is introduced;
- BANK/NBFC and other existing core-shell behavior remains on the legacy shared path;
- read-only sector add-ons explicitly suppress recommendation persistence, action bias, weight guidance, tracking and AI interpretation;
- the core shell and sector add-on no longer contradict one another.

This correction is presentation/orchestration only. The approved I2 methodology and deterministic I3 result are unchanged.
