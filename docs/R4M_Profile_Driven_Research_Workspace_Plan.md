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

## Shared-workspace polish

The final R4M polish pass keeps both reference securities inside the same Research shell and moves remaining methodological choices into profile contracts or profile adapters:

- About-company empty states are compact and do not expose enrichment/provider controls in the default investor view.
- Recommendation-unavailable and Key Insights states explain what is missing without repeating a generic `Pending` label.
- Research at a glance uses the same three-card structure for profile, portfolio exposure and evidence status.
- Score summaries and the heatmap share explicit scored, evidence-only, no-evidence and not-applicable states; PHARMA_V1 remains fail-closed and receives no invented numeric curves.
- The readiness surface uses a reusable summary component. PHARMA_V1 supplies grouped readiness data through an adapter, while all 13 contract details remain available on expansion.
- Refresh modules use the shared refresh-card language and responsive grid. Their titles and notes are investor-facing; execution gates remain explicit.
- Profile-specific valuation applicability is owned by `researchProfileUiContract`, not by the shared valuation workspace.
- The duplicate PHARMA_V1 readiness checklist was removed from the Financials tab; readiness appears once in the shared Overview hierarchy.

The supplied authenticated screenshots were used for the side-by-side HDFCBANK / TORNTPHARM audit. An automated authenticated browser review was intentionally not performed because rendering an already-qualified recommendation can invoke the existing recommendation-preview tracking write. Avoiding that write preserves the R4M no-production-mutation boundary. The owner can perform the final visual review in an approved localhost session.

### Side-by-side difference classification

Intentional profile differences: metric definitions and labels, applicable dimensions, readiness contracts, evidence availability, external-ratings prominence, refresh-module content, and whether a validated score/recommendation is available.

Unnecessary UI differences removed: oversized empty About space, repeated `Pending` states, dash-only evidence cards, the always-expanded 13-card Pharma checklist, unbalanced score and refresh grids, duplicated readiness placement, and direct Pharma valuation filtering in the shared workspace.

The HDFCBANK-only complete-refresh controls remain as an explicitly bounded reference-stock provider pilot. They reuse the common refresh-card system and do not create a separate Research page or component tree. Generalizing that operational capability requires approved capability metadata and is outside this UI-only pass.

## Review boundary

R4M does not approve or apply the TORNTPHARM official-evidence manifest, add numeric PHARMA_V1 score curves, deploy an Edge Function, change a scheduler, or perform a provider-backed refresh. Those actions require separate owner approval.
