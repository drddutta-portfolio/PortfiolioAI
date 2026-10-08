# Stock Research Stage 2 — Canonical Page Data Integration

**Date:** 8 October 2026 (Asia/Kolkata)
**Status:** Implementation complete; final verification evidence follows below.
**Authority:** [Stage 1 contract](PortfolioAI_STOCK_RESEARCH_INDUSTRY_FIRST_STAGE_1_CONTRACT_2026-10-08.md) and [stock-page design plan](PortfolioAI_STOCK_RESEARCH_PAGE_DESIGN_PLAN_2026-10-06.md).

| Sub-stage | Result |
|---|---|
| 2.1 Trace consumers | Scoring already used the approved P7 route. Readiness and specialist requirements independently selected current snapshots; Pharma header, workspace and R6 also used legacy assignment resolution. |
| 2.2 Share canonical projection | `useStockResearchContext` selects evidence once and passes the exact snapshot to scoring. All current-page evidence panels receive that result. Portfolio/security ownership and explicit-null semantics are enforced at the scoring repository boundary. |
| 2.3 Remove contradictory assignment selection | Header, live Pharma framework and R6 consume the resolved canonical route. Original reviewed research remains accessible as earlier-review detail; its legacy read is deferred until opened and cannot override current assignment/readiness. |
| 2.4 Preserve lineage and safeguards | Assignment identity/version, methodology authority/version, actual classification version and evidence snapshot/date remain distinct. Missing official hierarchy and secondary/reviewer metadata stay unavailable. Unbound Pharma parent scores cannot be promoted to qualified current scores. |

## Verification scope

Regression coverage includes all five Pharma primary models, blocked/review states,
no legacy-only specialist activation, exact snapshot injection without reselection,
wrong portfolio/security rejection, canonical read errors, portfolio navigation,
reload with changed or unchanged snapshot identity, shared evidence consumption,
lineage preservation and score suppression. Existing classification remains
contextual; company assignments and methodology contracts are not rewritten.

This is data-flow integration. Stage 3's Industry-led visual identity layout,
Stage 4's full specialised result presentation, taxonomy remediation C1/C8 and
methodology/evidence qualification retain their separate gates. No migrations,
remote writes, provider execution or Development merge are part of this change.
