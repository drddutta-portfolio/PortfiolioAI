# PortfolioAI P8 XBRL Segment-Period Semantics V3 — Owner Approval Package

Date: 4 October 2026  
Status: **OWNER APPROVED / ADOPTED**

Candidate:

`P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V3`

Frozen Git blob:

`797b7e91d7770f3377d0061ee338c76e8220391f`

Approved V1 remains unchanged at:

`45e990981371dba217d12c430f8ce567acbf25fc`

## What V3 changes

V3 does not change OD1, OD2, OD3 or OD4.

It adds one narrowly scoped normalization rule for a documented source-tagging conflict.

When all frozen conditions pass, V3 permits the semantic period of a `FourReportableSegment...` fact group to be linked to the explicit annual `FourD` reporting-period facts, while preserving the original literal quarter-dated XBRL contexts.

The rule requires:

1. eligible source hash and point-in-time filing;
2. `ReportingQuarter = Yearly`;
3. explicit OneD quarter reporting-period facts;
4. explicit FourD annual reporting-period facts with the same end date;
5. matching One/Four reportable-segment identities;
6. independent One/Four revenue reconciliation;
7. independent One/Four segment-profit reconciliation;
8. compatible units/scale;
9. permanent preservation of the original conflicting context dates.

It does **not** infer annuality from prefixes, amount magnitude or reconciliation alone.

## Measured implication

On the unchanged 32-pair canary:

- 12 source-period conflicts satisfy V3;
- 6 become comparable segment-revenue cases because intersegment revenue is explicit zero;
- 6 produce a strict >50% dominant segment;
- 1 produces an exact four-tier Basic-Industry mapping: Edible Oil (`IN040101001`);
- 0 produce an existing methodology route;
- 0 produce complete normalized route inputs.

The other 6 V3-normalized cases remain blocked by non-zero aggregate intersegment revenue without segment-specific external revenue.

Approval therefore improves source/accounting proof but **does not pass the existing expansion gate**.

## Exact approval statement

> **I approve `P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V3` frozen at Git blob `797b7e91d7770f3377d0061ee338c76e8220391f` as the PortfolioAI normalization rule for the documented One/Four XBRL source-period conflict, subject to its full evidence conditions and preservation of original context dates. Approved V1 at blob `45e990981371dba217d12c430f8ce567acbf25fc` remains unchanged. This approval does not authorize 25,761-pair expansion, experiment freeze/execution, B5/B6/B-FINAL rebuild, P8-C, database/storage writes, migrations or deployment.**



---

## Owner adoption record — 4 October 2026

The owner explicitly approved:

`P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V3`

Frozen Git blob:

`797b7e91d7770f3377d0061ee338c76e8220391f`

Approved V1 remains unchanged at:

`45e990981371dba217d12c430f8ce567acbf25fc`

Immutable adoption record:

`docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_SEMANTICS_V3_OWNER_ADOPTION_2026-10-04.json`

### Adoption effect

V3 is now the approved PortfolioAI normalization rule for the documented One/Four XBRL source-period conflict whenever all frozen V3 evidence conditions pass.

Original literal XBRL context dates remain preserved.

Measured canary implications are unchanged:

- 12 approved V3 period normalizations;
- 6 comparable segment-revenue cases;
- 6 strict >50% dominant-business candidates;
- 1 exact Basic-Industry classification;
- 0 methodology routes;
- 0 complete normalized inputs.

### Boundary

This approval does **not** authorize:

- 25,761-pair expansion;
- experiment freeze/execution;
- B5/B6/B-FINAL rebuild;
- P8-C;
- Supabase/R2 writes;
- migrations;
- deployment;
- scheduler activation.

The expansion gate remains closed.
