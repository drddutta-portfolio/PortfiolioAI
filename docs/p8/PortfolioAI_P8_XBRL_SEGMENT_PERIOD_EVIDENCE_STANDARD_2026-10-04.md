# PortfolioAI P8 XBRL Segment-Period Semantics Evidence Standard

Date: 4 October 2026  
Candidate: `P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V2`  
Status: **Conditional / not owner-approved**

The approved V1 accounting contract remains unchanged at Git blob `45e990981371dba217d12c430f8ce567acbf25fc`.

## Period proof

Literal XBRL context dates are primary raw evidence. A parser may select a different already-existing annual fact under V1, but it may not change the period semantics of a fact.

A separate normalization candidate may propose a corrected semantic period only when independent source structure links the fact group to an explicitly annual table column. The original fact and context dates must remain preserved.

The following are not sufficient alone: `One`/`Four` prefixes, amount magnitude, expected revenue, arithmetic reconciliation, another issuer's filing, or current company knowledge.

## Conditional One/Four table-column bridge

The V2 candidate requires all of the following: `ReportingQuarter = Yearly`; a quarter `OneD` base context and annual `FourD` base context with the same end date; matching One/Four reportable-segment identities; One segment group reconciliation to the OneD total; Four segment group reconciliation to the FourD total; compatible units/scope; and corroboration from an additional One/Four segment measure family when available.

If those conditions hold, the Four-segment facts may receive a **proposed annual semantic period** linked to the FourD period. Their original literal quarter dates are never overwritten.

This is a policy change from V1 and therefore remains conditional until owner approval.

## Missing accounting disclosures

Missing intersegment or total-segment facts are searched across exact and semantically related concepts/contexts. Absence is never zero. Available segment totals never replace the company denominator.
