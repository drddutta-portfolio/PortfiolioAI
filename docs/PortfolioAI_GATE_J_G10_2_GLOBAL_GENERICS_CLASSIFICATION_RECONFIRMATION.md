# PortfolioAI — Gate J / G10.2 Checkpoint A: AUROPHARMA Global Generics Re-confirmation

**Date:** 21 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**Stage:** G10.2 — Checkpoint A
**Status:** IMPLEMENTED / LOCALHOST OWNER RE-CONFIRMATION PENDING

## Purpose

G10.2 does not rebuild AUROPHARMA classification from scratch.

Checkpoint A re-confirms the existing reviewed G8.1 authority before any Global Generics methodology is written.

## Re-confirmed authority

```text
Reference = AUROPHARMA
Primary = GLOBAL_GENERICS
Material Overlay = none
Emerging Watch = API_BULK_DRUGS
BIOPHARMA_BIOSIMILARS = REVIEW_REQUIRED / unresolved
Evidence through = 2026-03-31
Effective from = 2026-03-31
```

Two-period conservative Global Generics leadership remains:

```text
FY25: Global Generics lower bound 73.04% · API 13.63%
FY26: Global Generics lower bound 73.46% · API 12.03%
```

The Global Generics measure deliberately remains a conservative US + Europe formulations lower bound.

## Distortion / structural-change re-check

The existing G8.1 checks remain authoritative:

- consolidated denominator alignment;
- conservative Global Generics mapping;
- API legal-entity transfer does not break consolidated scope;
- business profit-share split remains unavailable without being invented;
- Khandelwal/Lannett structural changes are handled by effective date rather than back-projection.

No new material evidence is introduced by Checkpoint A, so the G8.1 classification remains valid.

## Fail-closed boundary

Checkpoint A deliberately preserves:

```text
AUROPHARMA score = SCORE_NOT_COMPUTABLE
Reason = GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE
Gate I role = INSUFFICIENT
No partial score reconstruction
```

The unresolved Biosimilars exposure remains unresolved. Completing a Biosimilars methodology elsewhere later must not silently change AUROPHARMA classification.

## Local UI proof

After pulling the branch, open:

`AUROPHARMA → Research → Overview`

The Gate J block immediately before Research Health must show:

- G10.2 / Checkpoint A;
- Reference-company classification re-confirmation;
- Global Generics primary;
- API / Bulk Drugs Emerging Watch;
- no Material Overlay;
- Biosimilars unresolved;
- FY25/FY26 conservative Global Generics lower-bound shares;
- score not computable / methodology incomplete.

No new local Supabase fixture is required if the existing AUROPHARMA G9.2 reviewed local assignment is already present.

## Validation

After owner visual re-confirmation:

`bash scripts/g10-2-validate-global-generics-classification-reconfirmation.sh`

Do not begin Checkpoint B before the visual re-confirmation and consolidated validation pass.
