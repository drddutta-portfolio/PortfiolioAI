# PortfolioAI P8 Historical Segment-Revenue Classification Contract + Frozen Canary Validation — Closure

Date: 4 October 2026

## Exact disposition

**SEGMENT_REVENUE_CONTRACT_COMPLETE_CANARY_EVIDENCE_BLOCKED_PENDING_OWNER_ADOPTION**

Implementation and testing are **COMPLETE / PASS**.

Accounting proof is **BLOCKED** on the frozen canary.

OD1–OD3 remain **PENDING OWNER APPROVAL**. OD4 remains blocked.

Company-level complete classification, authoritative routes and complete normalized-input pairs remain **0**.

## Methodology authority

The current official NSE Indices classification methodology page is marked updated **21 September 2023** and documents audited consolidated annual financials as the prime source and strict segment-revenue `>50%` dominance for multi-business companies.

The frozen PortfolioAI taxonomy vocabulary is **November 2022**. Its official PDF contains historical definition text using >50% / >=20% diversified concepts, but the exact complete November-2022 methodology text is not preserved.

Accordingly, the frozen V1 accounting contract measures the rule conditionally and does not pretend that the 2023 page is verbatim November-2022 policy.

## Frozen contract

Contract:

`P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1`

Git blob SHA:

`45e990981371dba217d12c430f8ce567acbf25fc`

The contract was committed before the final measurement run.

Its central safeguards are:

- audited consolidated annual evidence only;
- latest eligible source strictly before each historical decision;
- same-period company and segment evidence;
- company denominator from net Revenue from Operations;
- explicit total-segment/intersegment/company-revenue reconciliation;
- segment external revenue required for comparability;
- gross segment revenue accepted only when aggregate intersegment revenue is valid zero;
- strict `>0.50`; exactly 50% fails;
- no segment combination or denominator substitution;
- units, currency, scale and XBRL rounding provenance preserved;
- future evidence/revisions remain point-in-time.

## Frozen 32-pair canary

Original membership and fingerprint were unchanged:

`b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce`

Final measured result:

| Measure | Result |
|---|---:|
| Semantic canary pairs | **32** |
| Eligible audited consolidated annual source | **24** |
| Period-context accounting block | **12** |
| Accounting-incomplete | **12** |
| No eligible audited consolidated annual source | **8** |
| Comparable segment-revenue pairs | **0** |
| Dominant-business candidates | **0** |
| Candidate complete classifications | **0** |
| Authoritative complete classifications | **0** |
| Candidate unique routes | **0** |
| Authoritative routes | **0** |
| Complete normalized-input pairs | **0** |

Accounting audit fingerprint:

`cce3a731431ade7caf697ef7af036074c1cbb5e5ce27ead0f833df3b02e09d50`

Final classification/router fingerprint:

`146206681ac7cc7f5f2978b8d7f1954afca56ce65aa7082e1ec17d2c2f032667`

## Accounting evidence findings

The source bodies explicitly expose company Revenue from Operations, Total Segment Revenue and aggregate Inter-Segment Revenue in many filings. Their arithmetic can reconcile.

However, in 12 canary pairs the eligible audited annual filing contains reportable-segment facts whose XBRL context period differs from the selected audited annual base period. Examples include `FourReportableSegmentRevenue...` values that appear annual-sized but whose literal contexts cover only a quarter.

The frozen contract does **not** infer annual semantics from the word `Four` or from the magnitude of the number. Those cases therefore fail with:

`REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH`

Another 12 pairs have incomplete annual accounting evidence, prominently missing aggregate intersegment revenue. Eight pairs have no eligible audited consolidated annual source at all.

## Six prior exact Basic-Industry cases

All six were inspected against audited annual source availability.

- five have an eligible audited consolidated annual source;
- one has no eligible audited consolidated annual source;
- none proves a valid comparable annual segment numerator under V1;
- none produces company-level dominance.

Therefore previously observed segment labels such as Pharmaceuticals, Commercial Vehicles, Education, Sugar and Edible Oil remain segment evidence only. They do not classify the whole company under this contract.

## Route and input completeness

The actual canonical `RESEARCH_PROFILE_ROUTING_V2` was invoked by the audit workflow only when a candidate route input was available.

Candidate routes: **0**.

Authoritative routes: **0**.

Therefore route-specific normalized-input completeness was not evaluated beyond the explicit zero state. Raw historical XBRL facts were not promoted into canonical scoring metrics.

## Expansion boundary

The 25,761 provisional candidate pairs were **not processed**.

The full B2 denominator remains 121,956 pairs / 4,524 historical identities / 32 decision dates.

The provisional candidate surface remains 25,761 pairs / 877 identities and is **NOT MEASURED** under this accounting contract.

The expansion gate remains failed because there is no complete company classification and no unique route.

## Owner adoption

A consolidated adoption package is provided separately.

Approval of OD1–OD3 would adopt the policy contracts. It would **not** make the current canary pass and would **not** authorize broad expansion.

The remaining evidence question—whether certain source-column semantics may legitimately override literal XBRL period contexts—would require a separately versioned semantic contract and reproducible rerun if ever authorized. It is not silently resolved here.

## Verification

Final workflow: **37217432181 — SUCCESS**

Focused accounting/semantic tests: **18 / 18 PASS**

The workflow also executed smoke guards against the actual canonical router and deterministic repeat fingerprints.

## Safety boundary

No Supabase or R2 writes, migrations, deployments, scheduler activation, company-source acquisition, Production/main changes, experiment freeze/execution, B5/B6/B-FINAL rebuild, P8-C, returns, forward outcomes, performance or holdout inspection occurred.
