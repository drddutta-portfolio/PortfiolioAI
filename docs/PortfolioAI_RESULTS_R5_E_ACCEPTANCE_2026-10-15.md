# PortfolioAI Results R5-E — Formal Acceptance

**Decision: PASS / COMPLETED**  
**Date:** 15 October 2026 IST  
**Branch:** PortfolioAI-Development. Production/main and V1-4 research scores unchanged.

## Scope and objective
R5-E comprises evidence-bound explanatory insights for the owner's four-period Results release (Sep 2025, Dec 2025, Mar 2026, Jun 2026). It does **not** assert AI-generated causality, investment advice, point-in-time valuation or thesis changes. It reuses original-source selected observations through the already-accepted R5-B comparison engine and R5-C versioned grading.

## Acceptance criteria and verified behavior
- Qualifies issuer, metric, selected status, period, original-source record, INR unit, currency and accounting scope before narrating a performance change.
- Distinguishes bank NII plus PAT from nonbank Revenue plus PAT. Generates exact decimal and sign-safe two-decimal QoQ comparisons.
- A YoY sentence appears only for a separately qualified prior-year observation; under the approved four-quarter scope YoY can be unavailable and is never fabricated.
- Unselected/missing observations, incompatible source or reporting scope, duplicate selected facts and zero/negative percentage baselines cannot become a growth claim.
- A current-quarter evidence gap must be identified before optional YoY limitations. This issue was discovered by an acceptance test and corrected inside the non-UI `quarterlyR5.ts` explanation function.
- Distinguishes evidence narrative from the R5-C grade. Unsupported industries remain Not Rated; peer grading and company-trend assessments retain their explicitly distinct provenance.
- All insight conclusions explicitly prohibit inferred causes, investment recommendations and V1-4 research scores. The existing `ResultsReferenceLivePage.tsx` card and reference design were not changed.

## Execution proof
Dedicated Development workflow [R5-E Evidence Insights Acceptance — run 38702128848](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38702128848) **PASS**:
- 34 / 34 focused tests across four files;
- architecture isolation and TypeScript PASS;
- evidence narrative test lint PASS;
- Vite client production-compilation PASS;
- Git diff integrity PASS.
A separate R5-B comparison workflow [run 38702128936](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38702128936) also passed after the limited narration bug fix.

## Invariance and boundaries
No changes to UI layout, CSS, JSX card, R5-C industry grading, DB selections, Supabase schemas, Cloudflare objects, existing scan logic, Production/main, or V1-4 investment research scores. Only acceptance tests, a targeted narrative correctness fix, the isolated R5-E CI check and this document were changed.

**Acceptance:** R5-E PASS / COMPLETED. The separate R5-F storage and recomputation, and R5-G live authenticated dashboard/pixel acceptance remain pending and must not be pre-approved by this document.
