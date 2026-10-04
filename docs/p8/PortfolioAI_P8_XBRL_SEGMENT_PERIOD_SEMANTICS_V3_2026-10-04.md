# PortfolioAI P8 XBRL Segment-Period Semantics Candidate V3

Date: 4 October 2026  
Status: **Conditional / not owner-approved**

V3 exists because the V2 source audit found a systematic fact not represented in the V2 rule: the literal `FourD` XBRL context is quarter-dated, but explicit official `DateOfStartOfReportingPeriod` and `DateOfEndOfReportingPeriod` facts attached to the `FourD` group identify the full audited annual period.

V3 therefore does **not** treat `Four` naming, amount size or reconciliation as period proof. It requires the explicit reporting-period facts as the independent period label, then uses matched One/Four segment identities and multi-measure reconciliation to prove that the reportable-segment subcontexts belong to those table-column groups.

Original context dates remain immutable raw evidence and are recorded as a conflict. The proposed annual semantic period is an additional normalized field only.

This is a semantic policy change from approved V1 and from V2. It requires owner approval before any V3 result can become authoritative or replay-ready.
