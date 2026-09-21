# PortfolioAI — Gate J / G10-FINAL Portability & Isolation Closure

**Date:** 21 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**Stage:** G10-FINAL
**Status:** IMPLEMENTED / LOCAL VALIDATION PENDING

## Purpose

G10-FINAL is the Gate J integration and portability closure. It does not build another Pharma category or another reference company.

Its acceptance target is:

```text
ANY NEW PHARMA STOCK
        ↓
PHARMA_V1
        ↓
reviewed primary subprofile assignment
        ↓
existing subprofile methodology authority
        ↓
existing PHARMA_V1 evidence/readiness framework
        ↓
deterministic score only when complete
        ↓
unchanged Gate I recommendation policy
```

No new Gate J methodology should be required merely because a new ticker enters the portfolio.

## Five portable methodology authorities

| Primary subprofile | Reference validation anchor | Method authority |
|---|---|---|
| DOMESTIC_FORMULATIONS | TORNTPHARM | Domestic owner-approved methodology |
| API_BULK_DRUGS | ALIVUS | G10.1 API methodology |
| GLOBAL_GENERICS | AUROPHARMA | G10.2 Global Generics methodology |
| BIOPHARMA_BIOSIMILARS | BIOCON | G10.3 Biosimilars methodology |
| CDMO_CRAMS | SYNGENE | G10.4 CDMO/CRAMS methodology |

The reference stock is a validation anchor only. Runtime methodology selection is by reviewed subprofile, not by symbol.

## New Pharma stock behavior

A new Pharma holding with no reviewed subprofile remains fail-closed:

```text
PHARMA_V1
Subprofile = REVIEW REQUIRED
Methodology routing = BLOCKED
Score = NOT COMPUTABLE
Gate I recommendation = NOT READY
Persistence = OFF
```

Once one reviewed primary subprofile resolves, the corresponding existing methodology authority is selected without symbol-specific code.

Material Overlays remain context within the one stock score and cannot create a second independent score.

Emerging Watch exposures remain context-only and numerically excluded.

## UI closure

The Research Overview now has a generic:

```text
Gate J · G10-FINAL · Runtime portability
Pharma methodology routing
```

block for any Pharma stock.

For a resolved stock it shows:
- reviewed primary subprofile;
- methodology authority/version;
- reference validation stock as an anchor only;
- unchanged Gate I policy;
- Material Overlay context;
- Emerging Watch context.

For an unresolved new Pharma stock it explicitly shows:
- subprofile review required;
- no methodology guessed;
- no score;
- no Gate I recommendation.

The older G10.1-G10.4 reference-company blocks remain only on the validation anchors as engineering/history evidence.

## Closure invariants

G10-FINAL preserves:

```text
Reference identity as runtime requirement = NO
Cross-subprofile band borrowing = PROHIBITED
Material Overlay second stock score = PROHIBITED
Emerging Watch numeric participation = PROHIBITED
Unresolved exposure auto-resolution = PROHIBITED
Hidden denominator renormalization = PROHIBITED
Missing mandatory evidence = FAIL CLOSED
Gate I policy = UNCHANGED
Score persistence = OFF
Recommendation persistence = OFF
Position sizing = OFF
AI interpretation = OFF
Production mutation = NO
Deployment = NO
PR merge = NO
Automatic trading = NO
```

## Validation

Run:

`bash scripts/g10-final-validate-portability-closure.sh`

This validates:
1. all five methodology authorities;
2. arbitrary future-stock routing for each subprofile;
3. unresolved-stock fail-closed behavior;
4. overlay/emerging isolation;
5. prior Gate J reference outcomes;
6. Gate I isolation;
7. full non-Edge tests, TypeScript, architecture, lint and build;
8. diff whitespace.

G10-FINAL must not be marked COMPLETE / PASS until this consolidated local validator passes.
