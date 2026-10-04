# PortfolioAI P8 XBRL Segment-Period Semantics Investigation

Date: 4 October 2026  
Scope: Frozen 32-pair canary only  
Approved V1 contract: `P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1`  
Approved V1 Git blob: `45e990981371dba217d12c430f8ce567acbf25fc`

## Conclusion

The 12 prior segment/base period mismatches are **not V1 parser omissions**. No already-valid literal annual reportable-segment facts were found.

They do, however, show a systematic same-filing conflict that is recoverable under a separately versioned semantic-normalization rule:

- `ReportingQuarter = Yearly`;
- explicit `DateOfStartOfReportingPeriod` / `DateOfEndOfReportingPeriod` facts attached to `OneD` identify the quarter;
- the same explicit reporting-period facts attached to `FourD` identify the full audited annual period;
- literal `OneD` and `FourD` XBRL context dates are both quarter-dated;
- One/Four reportable-segment identities match;
- One segment-revenue groups reconcile to the OneD total;
- Four segment-revenue groups reconcile to the FourD total;
- One/Four segment-profit groups independently preserve the same mapping and reconcile to their totals.

Therefore the defect is best described as:

**source XBRL context-date conflict with explicit same-filing reporting-period/table-column evidence**

—not as a missing annual fact and not as a simple parser selection bug.

## Evidence hierarchy

V1 literal context dates remain immutable raw evidence.

The V3 candidate uses the source's explicit reporting-period facts as independent period labels and the One/Four table structure as deterministic linkage. It never infers annuality from the word `Four`, amount size, expected revenue or arithmetic reconciliation alone.

Original quarter-dated segment contexts are preserved and reported as `SOURCE_CONTEXT_DATE_CONFLICT`.

## Source-reference limitation

The stored XML instances reference:

`Ind-AS_entry_point_2020-03-31.xsd`

but the applicable XSD/linkbase was not found in the authorized repository/R2 evidence set.

No companion rendered PDF/HTML filing was found in the existing P8 recovery R2 inventory.

Accordingly, V3 is supported by explicit in-instance period facts plus deterministic same-filing table-column structure, but not by an independently stored taxonomy definition or rendered filing. That limitation is disclosed and is why V3 remains a reviewable semantic policy candidate rather than an automatic V1 correction.

## Frozen-canary dispositions

Primary dispositions reconcile exactly to 32:

| Primary disposition | Pairs |
|---|---:|
| V3 conditional recoverable source-tagging defect | 12 |
| Accounting incomplete / other blocker | 12 |
| No eligible audited consolidated annual source | 8 |
| **Total** | **32** |

Overlapping V3 diagnostics:

- conditional period normalizations: **12**
- comparable segment-revenue cases: **6**
- strict >50% dominant-business candidates: **6**
- exact official Basic-Industry matches among dominant cases: **1**
- candidate methodology routes: **0**
- authoritative V1 recoveries: **0**

The exact Basic-Industry case is **Edible Oil — IN040101001**. It still produces no route because the active application taxonomy has no exact crosswalk for that classification.

The other five V3 dominant descriptions require OD2 review/catalog mapping or remain ambiguous:
- Manufacturing- Steel Pipes
- IT and Business Service
- EPC/Engineering Services
- Textile
- Automotive Segment

## Missing accounting disclosures

The 12 accounting-incomplete canary cases were searched independently for alternate intersegment/elimination/total-segment facts.

Result: **12 / 12 = NO_ALTERNATE_RELATED_FACTS_FOUND** under the bounded deterministic search.

Absence remains absence; no missing intersegment value was converted to zero.

## Research boundary

V3 is not owner-approved.

Therefore all V3 recoveries remain conditional and cannot count as authoritative replay-ready evidence. V1 authoritative counts remain:

- comparable segment revenue: 0
- complete company classifications: 0
- unique methodology routes: 0
- complete normalized inputs: 0
