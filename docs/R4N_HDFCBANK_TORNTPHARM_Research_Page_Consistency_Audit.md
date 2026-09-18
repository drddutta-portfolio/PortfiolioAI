# R4N — HDFCBANK ↔ TORNTPHARM Research Page Consistency Audit

**Date:** 18 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`

## Design rule

HDFCBANK and TORNTPHARM must look like the same PortfolioAI product at a glance.

They do **not** need identical research content. Sector-specific research criteria, evidence requirements, readiness details, workspace sections, source contracts and subprofile logic are expected to differ.

The consistency requirement applies to the **visual grammar and page hierarchy**, not to the research subject matter.

## Shared visual/product invariants

The following should remain common across profiles unless a future product decision explicitly changes them:

1. Research page shell
2. Security header and identity treatment
3. Position dashboard
4. Decision controls
5. Research refresh placement
6. Overview / Financials / Quality & Growth / Ownership / Valuation / Documents / Evidence tabs
7. `Research at a glance` heading
8. Three-card context strip
9. Investment Decision Cockpit / scorecard placement
10. Profile Research Readiness placement and shell
11. Investment heatmap visual grammar
12. Snapshot/cockpit card treatment
13. Research Health footer for the shared overview
14. Documents and Evidence ledger interaction patterns
15. Typography, spacing, card radii, badge style and section-heading hierarchy

## Allowed sector-specific divergence

The following may differ materially by profile without violating visual consistency:

- profile name and classification source;
- subprofile/secondary-exposure summary;
- score dimension labels and applicability;
- snapshot metric groups;
- readiness requirement counts and details;
- Financials workspace sections;
- Quality & Growth workspace sections;
- refresh modules and provider eligibility;
- source/evidence contracts;
- sector-specific evidence acquisition and review workflows;
- Pharma subprofile logic;
- Bank/NBFC-specific metrics and reference-stock completion workflows.

In other words: **same product frame, different research engine.**

## Audit finding

Before this audit, TORNTPHARM inserted the full `PharmaResearchWorkspacePanel` immediately after the context strip and before the shared scorecard/readiness/cockpit sequence.

That made the Pharma page visually diverge from HDFCBANK at the most important first-glance point even though the shared components themselves were already reusable.

HDFCBANK effectively followed:

```
Research at a glance
→ Context strip
→ Investment Decision Cockpit
→ Research Readiness
→ Snapshot cockpit
→ Research Health
```

TORNTPHARM followed:

```
Research at a glance
→ Context strip
→ large Pharma deep-research workspace
→ Investment Decision Cockpit
→ Research Readiness
→ Snapshot cockpit
→ Research Health
```

This was a layout-order problem, not a profile-contract problem.

## R4N correction

The shared overview spine is now identical in ordering for HDFCBANK and TORNTPHARM:

```
Research at a glance
→ Context strip
→ Investment Decision Cockpit
→ Profile Research Readiness
→ Snapshot cockpit
→ Research Health
```

For TORNTPHARM only, the Pharma-specific deep research now follows afterward under:

**Sector research workspace**

This preserves:
- shared first-glance appearance;
- HDFCBANK as the visual/UX reference implementation;
- all existing Pharma-specific Gate F work;
- freedom for the actual sector research sections to differ.

## Pharma workspace policy

The current Pharma workspace contains multiple Gate F development/research-control panels:
- Business model research map
- Official evidence pilot
- Evidence acquisition plan
- Public / official source discovery
- Exact document review plan
- Read-only content-review dry run

These are valid sector-specific deep-research surfaces during R4N.

They should not be used as a reason to alter the shared top-of-page PortfolioAI grammar.

A later UX-consolidation pass may decide which of these become permanent user-facing sections, which become collapsible Evidence Workspace subsections, and which remain internal/research-control surfaces. That consolidation is separate from the present consistency fix.

## Guardrail for future profiles

Any new profile should satisfy this rule:

> Profile-specific content may change after the shared overview spine, but the page must still be immediately recognizable as the same PortfolioAI Research experience.

Do not force BANK_NBFC research content onto PHARMA_V1, or PHARMA_V1 content onto future sectors, merely to achieve visual sameness.
