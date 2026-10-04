# PortfolioAI P8 XBRL Segment-Period Semantics Audit + Normalization Candidate — Closure

Date: 4 October 2026

## Exact disposition

**XBRL_SEGMENT_PERIOD_V3_CONDITIONAL_RECOVERY_PENDING_OWNER_APPROVAL**

Implementation and source-semantics investigation are **COMPLETE / PASS**.

Approved V1 remains unchanged and authoritative V1 replay-ready counts remain zero.

A new V3 semantic-normalization candidate has been frozen and measured conditionally.

## 1. Root cause

The prior 12 period mismatches are not caused by a missed literal annual segment fact.

Instead, the stored XML instances contain conflicting period metadata:

- `ReportingQuarter = Yearly`;
- explicit OneD reporting-period facts define the quarter;
- explicit FourD reporting-period facts define the audited annual period;
- literal OneD and FourD XBRL context dates are both quarter-dated;
- reportable-segment One/Four groups match by segment identity;
- One and Four revenue groups independently reconcile to OneD/FourD totals;
- One and Four segment-profit groups independently preserve and reconcile the same table-column structure.

This supports a systematic source-tagging defect, but correcting it changes semantic normalization and therefore cannot be treated as a V1 parser fix.

## 2. V1 result

V1 extraction fixes: **0**.

V1 authoritative state remains:

- comparable segment revenue: 0;
- complete company classification: 0;
- methodology routes: 0;
- complete normalized inputs: 0.

## 3. V3 conditional result

Candidate:

`P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V3`

Git blob:

`797b7e91d7770f3377d0061ee338c76e8220391f`

Conditional measured result:

| Measure | Result |
|---|---:|
| Period conflicts satisfying V3 | **12** |
| Comparable segment-revenue cases | **6** |
| Strict >50% dominant-business candidates | **6** |
| Exact official Basic-Industry mappings | **1** |
| Candidate methodology routes | **0** |
| Complete normalized inputs | **0** |

The exact Basic-Industry classification is:

**Edible Oil — IN040101001**

It has no exact active application-taxonomy crosswalk, so the actual router receives no valid route input.

Five additional dominant descriptions require a reviewed OD2 mapping or remain ambiguous.

The remaining six V3 period-normalized cases have non-zero aggregate intersegment revenue without segment-specific external revenue and therefore remain blocked under approved OD3.

## 4. Missing accounting evidence

The 12 accounting-incomplete cases were searched independently for alternative intersegment/elimination/total-segment facts.

All 12 return:

`NO_ALTERNATE_RELATED_FACTS_FOUND`

No missing value was inferred to zero.

## 5. Source limitations

The XML references `Ind-AS_entry_point_2020-03-31.xsd`, but the applicable XSD/linkbase is not stored in the authorized repository/R2 evidence set.

No companion rendered official PDF/HTML filing was found in the existing P8 recovery R2 inventory.

Therefore V3 relies on explicit in-instance reporting-period facts plus deterministic same-filing table structure. This is strong enough for a reviewable normalization candidate, but not automatically authoritative without owner approval.

## 6. Verification

Final workflow:

`37220672965` — SUCCESS

Focused/source-backed tests:

**12 / 12 PASS**

Fingerprints:

- V2 source matrix: `7cefd5e0ce5675d81c1106c4bf6d846a3b972f42bb6a9aa8d77280feb61c5997`
- V3 pre-router: `2af967ef181706762b43fbbc9aa2919faadb665bc1825062c734c5e2d2fe5723`
- V3 final: `e75ffba7529050c5984b23575ef3663b5c823f1cc1c4a3c7d19e8717de9799f8`

## 7. Expansion boundary

The 25,761-pair candidate surface remains **NOT AUTHORIZED / NOT MEASURED**.

No successful V3 result authorizes broad expansion, experiment execution, B5/B6/B-FINAL rebuild or P8-C.

## 8. Required owner decision

V3 requires explicit owner approval before its period normalizations can become authoritative.

The precise approval statement is provided in:

`docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_SEMANTICS_V3_OWNER_APPROVAL_PACKAGE_2026-10-04.md`
