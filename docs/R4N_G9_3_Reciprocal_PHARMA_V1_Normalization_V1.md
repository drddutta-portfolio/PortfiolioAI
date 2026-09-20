# R4N — G9.3 Reciprocal PHARMA_V1 Normalization V1

> **SUPERSEDED BY G9.3 V2.** This document records the abandoned full-page normalization experiment for historical/audit purposes only. It is not the active implementation plan.

**Status:** IMPLEMENTED FOR TWO-STOCK LOCAL VISUAL NORMALIZATION REVIEW — NOT YET VALIDATED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Stage:** G9.3 of the hard-capped G9 sequence  
**Production mutation:** none

## Purpose

G9.3 removes the historical presentation asymmetry between the two Pharma reference companies without changing their company-specific research semantics.

The permanent PHARMA_V1 product architecture is:

```text
PHARMA_V1
  -> Common Pharma core
  -> Reviewed Primary business model
  -> Reviewed secondary exposures
  -> Shared methodology
  -> Evidence / readiness
  -> Read-only score state
  -> Research gaps / audit history
```

## Reciprocal normalization

### TORNTPHARM receives the reusable G8-era three-layer architecture

Canonical roles remain:

- Primary: `DOMESTIC_FORMULATIONS`
- Material Overlay: `GLOBAL_GENERICS`
- Emerging Watch: `CDMO_CRAMS`

The new normalized panel is built from the same canonical assignment and shared workspace model used by the existing validated research engine.

### AUROPHARMA receives the shared G1–G7 methodology surface

Canonical roles remain:

- Primary: `GLOBAL_GENERICS`
- Material Overlay: none
- Emerging Watch: `API_BULK_DRUGS`
- unresolved: `BIOPHARMA_BIOSIMILARS`

Shared methodology surfaces now include:

- Gate G
- G1
- G2
- G3
- G4
- G7-P1
- G7-P2
- G7.1

The contract is shared; engagement is company-role specific.

## Distinct NOT ENGAGED state

For AUROPHARMA, no reviewed Material Overlay exists.

Therefore G2 and G7-P1 render:

`NOT ENGAGED`

through a distinct UI branch.

This state must never be presented as:

- zero;
- empty;
- unavailable;
- failed;
- neutral modifier.

A zero modifier would falsely imply that the overlay contract executed and returned a neutral numeric value.

## TORNTPHARM semantic continuity guard

G9.3 defines two semantic snapshots:

1. legacy TORNTPHARM semantic snapshot;
2. normalized TORNTPHARM semantic snapshot.

They compare:

- Primary role;
- secondary roles/materiality/modes;
- overall preview state;
- overall score;
- all dimension methodology states;
- all dimension calculation states;
- evidence counts;
- overlay states;
- primary scores;
- overlay modifiers;
- final dimension scores;
- reason codes.

G9.3 requires deep semantic equality.

Presentation normalization must not change TORNTPHARM investment semantics.

## Persisted-data isolation regression

Added local read-only regression:

- `scripts/r4n/pharma-g9-3-persistence-regression.sql`
- `scripts/r4n/run-pharma-g9-3-persistence-regression.sh`

It asserts:

- TORNTPHARM remains Domestic Formulations Primary;
- TORNTPHARM Global Generics remains Material Overlay;
- TORNTPHARM CDMO/CRAMS remains Emerging;
- AUROPHARMA remains Global Generics Primary;
- AUROPHARMA API/Bulk Drugs remains Emerging;
- assignment identities remain distinct;
- AUROPHARMA Global Generics is not duplicated as its own secondary exposure;
- AUROPHARMA API is not promoted to Material;
- no active reviewed AUROPHARMA Biosimilars Primary/secondary authority exists.

The script uses `BEGIN READ ONLY` and `ROLLBACK`; it writes nothing.

## UI implementation

Added:

- `src/features/research/pharmaG93NormalizedResearch.ts`
- `src/features/research/pharmaG93NormalizedResearch.test.ts`
- `src/features/research/PharmaG93NormalizedResearchPanel.tsx`
- `src/features/research/pharmaG93NormalizationGuards.test.ts`

Updated:

- `src/pages/ResearchPage.tsx`
- `src/features/research/PharmaResearchWorkspacePanel.css`

The normalized panel is rendered for every canonical `PHARMA_V1` security.

For the current two-company reference set:

- TORNTPHARM receives the new shared architecture panel and retains its existing company-specific/development deep-research tooling below it;
- AUROPHARMA receives the shared normalized panel instead of inheriting the old TORNTPHARM-heavy deep-research monolith.

This is intentionally the first normalization pass. The owner must compare both complete localhost screenshots before final layout cleanup.

## Safety boundary

G9.3 normalization does not:

- mutate assignments;
- write research evidence;
- run or persist scores;
- activate recommendations;
- persist recommendation runs;
- activate/persist position sizing;
- refresh providers;
- change schedulers;
- deploy;
- merge PR #101.

## Required visual-review workflow

1. owner pulls latest branch;
2. Local Supabase remains on the validated G9.2 canonical state;
3. optionally run the read-only persisted-data regression;
4. run Local Vite;
5. hard-refresh TORNTPHARM → Research → Overview;
6. capture the full Pharma-related Overview sections;
7. hard-refresh AUROPHARMA → Research → Overview;
8. capture the full Pharma-related Overview sections;
9. compare both screenshots for reciprocal omissions, duplicates and company-specific leakage;
10. make any final vice-versa presentation corrections;
11. only after owner visual approval run the full G9.3 local validation;
12. record final G9.3/G9 checkpoint.

**CURRENT STOP POINT:** two-stock localhost screenshot comparison. Do not run full G9.3 validation and do not close G9 until the vice-versa visual normalization review is complete.


## Full-page canonical research-profile authority correction

The complete-page visual comparison showed that canonical subprofile resolution alone was not enough: AUROPHARMA still inherited General Research presentation in several places because those surfaces used the downstream scoring snapshot profile.

G9.3 therefore establishes a stronger permanent rule:

> **Canonical reviewed research-profile authority drives research presentation; downstream scoring-profile authority drives numeric scoring only.**

For a canonical PHARMA_V1 security whose numeric Pharma scoring is not yet computable:

- Research profile = PHARMA_V1;
- Overview snapshot groups = PHARMA_V1;
- Pharma readiness = PHARMA_V1;
- Research Refresh modules = PHARMA_V1;
- Financials workspace = PHARMA_V1;
- Quality & Growth workspace = PHARMA_V1;
- Valuation exclusions/presentation = PHARMA_V1;
- General/Bank-only research metrics must not be selected merely because the scoring hook falls back;
- numeric score remains fail-closed;
- General Research scoring/recommendation must not substitute for the unavailable Pharma numeric methodology.

### Advisory fail-closed rule

When canonical research authority is PHARMA_V1 but the downstream scoring profile is not PHARMA_V1:

- no General recommendation preview is accepted;
- no General recommendation preview is recorded;
- no General suggested weight is emitted;
- the Decision Workspace remains read-only and shows the canonical Pharma recommendation as pending until approved Pharma scoring/recommendation authority exists.

This preserves the user's manual investment-plan controls while preventing cross-profile advisory leakage.

### Permanent template boundary

G9.3 is building one reusable **PHARMA_V1 sector/profile template**, not one universal template for every stock.

PortfolioAI retains:

- a common application shell;
- profile/sector-specific research templates;
- subprofile/business-model role configuration;
- company-specific evidence and audit history.

No validated TORNTPHARM or AUROPHARMA evidence/audit functionality is deleted by this normalization.
