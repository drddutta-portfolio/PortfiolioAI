# PortfolioAI — G7.3 Validation, Leakage Tests & Research-Gap Register V1

**Status:** PROPOSAL ONLY / OWNER VALIDATION REQUIRED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**G7 stage:** FINAL BOUNDED CHECKPOINT

## Purpose

G7.3 closes the read-only adapter stage by proving that the implementation remains isolated, fail-closed and non-persisting, while explicitly registering every unresolved scoring dependency.

G7.3 does not create new numeric methodology.

## Validation invariants

The contract fixes the following boundaries:

- hidden reweighting: **NO**
- independent overlay-cap stacking: **NO**
- hidden governance double counting: **NO**
- BANK_NBFC fallback into Pharma: **NO**
- Domestic threshold transfer to other Pharma primaries: **NO**
- Emerging Watch evidence entering Material Overlay evidence pool: **NO**
- Emerging Watch numeric score participation: **NO**
- second independent Overlay stock score: **NO**
- score persistence: **NO**

## TORNTPHARM research-gap register

The register explicitly records current TORNTPHARM blockers rather than hiding them behind bounded G7 numbering.

Current registered blockers include:

1. canonical G4 governance/regulatory runtime input unresolved;
2. no approved Business Durability whole-dimension aggregation;
3. Domestic ROCE/Capital Efficiency thresholds unapproved;
4. Domestic Cash Conversion thresholds unapproved;
5. Domestic Balance Sheet/Leverage thresholds unapproved;
6. Domestic Ownership/Governance numeric thresholds unapproved;
7. Pharma regulatory/market-risk bands unapproved;
8. Pharma Momentum benchmark/bands/weights/aggregation unapproved.

Each entry records:

- stable Gap ID;
- category;
- affected subprofile;
- affected dimension;
- methodology state;
- evidence state;
- whether it blocks TORNTPHARM overall preview;
- whether it blocks overlay modification;
- whether it blocks the subprofile becoming Primary;
- future stage;
- required evidence/decision;
- decision lineage;
- revisit trigger.

## Controlled expansion

Remaining unresolved/unsupported methodology for:

- API/Bulk Drugs;
- CDMO/CRAMS;
- Biopharma/Biosimilars

is programmatically derived from the G6 applicability registry and entered into the controlled-expansion register.

These gaps:

- do not block the current TORNTPHARM reference architecture from completing G7 as a read-only/fail-closed system;
- do block those subprofiles from becoming numerically scored Primary models until their own reference-company methodology is completed;
- cannot borrow Domestic or Global Generics thresholds.

## Leakage proof

The focused G7.3 tests additionally prove:

- the combined overlay cap cannot stack beyond the approved G7-P1 bound;
- an unavailable weighted dimension blocks the overall result instead of causing denominator renormalization;
- all known TORNTPHARM blockers are explicitly present;
- all remaining reference-subprofile gaps are assigned to controlled expansion;
- the register itself cannot execute or persist a score.

## G7 closure condition

G7 may close after G7.3 owner validation if:

- G7-P1 validated;
- G7-P2 validated;
- G7.1 validated;
- G7.2 validated;
- G7.3 focused tests pass;
- focused ESLint passes;
- typecheck passes;
- build passes;
- the G7.3 cards/register summary are visually approved.

Closing G7 means:

> **G7 COMPLETE / READ-ONLY / NOT ACTIVE**

It does **not** mean TORNTPHARM has a complete numeric overall Pharma score.

The validated G7 system is successful precisely because it exposes that incompleteness rather than fabricating a number.

## Next stage

After G7.3 validation:

> **G8 — Second-Company Validation**

No G7.4 should be created for routine follow-up.

Any genuine methodology issue discovered in G8 is handled through the versioned Research-Gap Register and the appropriate future methodology/controlled-expansion decision.

## Safety boundary

- persisted score: **NO**
- recommendation mutation: **NO**
- position-sizing mutation: **NO**
- database/schema mutation: **NO**
- provider call: **NO**
- deployment: **NO**
- PR #101 merge: **NO**
