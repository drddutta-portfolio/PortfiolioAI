# PortfolioAI — Gate J / G10.4 CDMO_CRAMS Checkpoint B

**Date:** 21 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 — OPEN / DRAFT / UNMERGED
**Reference:** SYNGENE
**Primary:** `CDMO_CRAMS`
**Checkpoint A:** COMPLETE / PASS
**Checkpoint B:** IMPLEMENTED / LOCAL VALIDATION PENDING

## Consolidated build contract

G10.4 Checkpoint B is intentionally implemented as one package:

```text
CDMO/CRAMS methodology
→ bounded SYNGENE evidence
→ deterministic score/result
→ unchanged Gate I handling
→ UI integration
→ one consolidated validator
```

No additional Checkpoint B micro-stages are introduced.

## Methodology boundary

The CDMO/CRAMS methodology preserves the PHARMA_V1 ten-dimension spine and does not borrow numeric bands from Domestic Formulations, API/Bulk Drugs, Global Generics, Biosimilars or BANK_NBFC.

Mandatory CDMO-specific evidence includes:

- revenue-visibility evidence;
- disclosed client concentration;
- compatible capacity-utilization evidence;
- multi-period margin, capital-efficiency and cash-flow histories;
- current valuation and momentum history;
- four-quarter ownership/pledge context;
- current quality/site evidence and market-risk history.

Missing mandatory evidence fails closed.

## Current SYNGENE deterministic result

The bounded issuer package contains substantial operating evidence, including FY25 cash generation, FY25 large- and small-molecule mix context, FY26 revenue/PAT scale, customer count and manufacturing-capacity expansion.

However, the package does not yet lock all mandatory inputs required by the methodology.

Current deterministic result:

```text
State = COMPLETE_FAIL_CLOSED
Score state = SCORE_NOT_COMPUTABLE
Gate I recommendation = NOT EXECUTED
```

This is not a negative company score.

Current blocker groups include:

1. eight-quarter operating-margin history incomplete;
2. capital-efficiency + matched cash-flow history incomplete;
3. client-concentration + capacity-utilization disclosures incomplete;
4. valuation + momentum market package incomplete;
5. four-quarter ownership normalization incomplete;
6. client-concentration + market-risk evidence incomplete.

## Safety

```text
Partial score reconstruction = PROHIBITED
Hidden renormalization = PROHIBITED
Score persistence = OFF
Recommendation persistence = OFF
Position sizing = OFF
AI interpretation = OFF
Production mutation = NO
Deployment = NO
PR merge = NO
```

## Local review

After `git pull`, open:

```text
Research → SYNGENE → Overview
```

The Gate J block should now include:

```text
Gate J · G10.4 · Checkpoint B
CDMO / CRAMS controlled-expansion result
CDMO / CRAMS-specific
SCORE NOT COMPUTABLE
Gate I recommendation not executed
```

Then run:

`bash scripts/g10-4-validate-cdmo-checkpoint-b.sh`
