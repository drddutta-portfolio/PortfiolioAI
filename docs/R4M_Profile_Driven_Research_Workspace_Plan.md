# R4M — Profile-Driven Research Workspace / PHARMA_V1

## Status

IMPLEMENTATION COMPLETE — repository-only local UI review candidate.

## Objective

Turn the current Research page into one reusable PortfolioAI research workspace whose layout remains consistent while the active research/scoring profile controls research metrics, labels, heatmap behavior, readiness presentation and specialist evidence emphasis.

HDFCBANK remains the BANK_NBFC regression reference. TORNTPHARM / PHARMA_V1 is the first non-bank implementation.

## Non-negotiable architecture

- One common Research page; no stock-specific mini-applications.
- Canonical application classification remains external to the page.
- The already-resolved scoring/research profile chooses the presentation contract.
- UI contracts never classify securities, invent evidence, or calculate scores.
- PHARMA_V1 must never show bank-only Advances, Deposits, GNPA or NNPA metrics.
- BANK_NBFC behavior must remain regression-protected.
- Evidence coverage and score-ready coverage remain separate.
- Insufficient evidence fails closed.
- Production evidence/provider/scoring/scheduler changes are outside R4M unless separately approved.

## Initial implementation

R4M introduces a `researchProfileUiContract` registry that owns presentation behavior for registered profiles.

The PHARMA_V1 contract now defines:

- Pharma-specific snapshot groups;
- Pharma score-section labels;
- Cash Quality / Financial Strength-Leverage / Ownership-Governance / Regulatory-Market-Risk labels;
- Business Durability as applicable and evidence-gated;
- compact external-ratings prominence;
- PHARMA_V1 readiness-panel ownership.

The scorecard consumes the resolved profile UI contract instead of keeping Pharma conditions locally inside the component.

## Completed R4M work

1. Research-page specialist sections and labels are selected through the resolved UI contract.
2. Complete Research Refresh receives the selected profile code. The existing BANK_NBFC flow remains enabled; PHARMA_V1 fails closed against that generic provider flow until a Pharma-specific backend source and promotion contract is approved.
3. PHARMA_V1 exposes specialist modules for core fundamentals, business durability, regulatory risk and market/valuation. Only the already-approved Angel One market-history planning/execution path is actionable; all other profile modules remain visibly gated.
4. The Overview readiness surface is compact while detailed canonical-history diagnostics remain accessible.
5. All 13 PHARMA_V1 research contracts are represented in readiness and regression coverage.
6. Regression coverage protects profile selection, Pharma presentation, refresh payload profile propagation, bank-metric exclusion and responsive Research rendering.
7. Architecture Guard, scoped lint, TypeScript, focused tests and the production build pass. Repository-wide lint still reports pre-existing debt outside the R4M change set.
8. The localhost server and authentication boundary were verified. Final authenticated TORNTPHARM and HDFCBANK visual review remains an owner step; no provider control was invoked and no production data was changed.

## Review boundary

R4M does not approve or apply the TORNTPHARM official-evidence manifest, add numeric PHARMA_V1 score curves, deploy an Edge Function, change a scheduler, or perform a provider-backed refresh. Those actions require separate owner approval.
