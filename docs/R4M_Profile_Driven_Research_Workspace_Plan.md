# R4M — Profile-Driven Research Workspace / PHARMA_V1

## Status

IMPLEMENTATION IN PROGRESS — repository only.

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

## Remaining R4M work

1. Route Research-page specialist sections through the UI contract.
2. Make Complete Research Refresh profile-driven while preserving HDFCBANK controls unchanged.
3. Add PHARMA_V1 specialist workspace sections for Financial Strength, Business Durability, Regulatory/Risk and profile-specific valuation context.
4. Compact the Overview readiness surface while keeping full canonical-history diagnostics accessible.
5. Ensure all 13 PHARMA_V1 research contracts are represented in the workspace.
6. Add stronger regression and rendering tests.
7. Run Architecture Guard, lint, typecheck and production build.
8. Review localhost before any production evidence write.
