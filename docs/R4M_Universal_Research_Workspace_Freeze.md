# R4M — Universal Research Workspace Freeze

**Status:** frozen as `R4M_V1`; PR #100 owner-approved and merged at `de54ed1fa9569e9db0c14cfa8dac6dfbc2638c9f`
**Reference implementations:** HDFCBANK / `BANK_NBFC`; TORNTPHARM / `PHARMA_V1`
**Scope:** application surface and extension contracts only

## Frozen product rule

Every security uses one Research page and one interaction grammar. A new profile or subprofile supplies contracts, labels, applicability, evidence, readiness groups and refresh capabilities. It does not supply a new page or component tree.

## Page order

1. Security header and application classification
2. About company
3. Portfolio and price summary
4. Decision Workspace
5. PortfolioAI Suggestion
6. AI Interpretation
7. Key Insights
8. Research Refresh
9. Research navigation tabs
10. Research at a glance
11. Investment Decision Cockpit and section summaries
12. Investment heatmap
13. External ratings
14. Research Readiness
15. Profile-driven metric snapshots and detailed tab content

The tab contract is `Overview`, `Financials`, `Quality & Growth`, `Ownership`, `Valuation`, `Documents`, and `Evidence`.

## Frozen interfaces and states

### Profile UI registry

`researchProfileUiContract(profileCode)` is presentation configuration only. It may provide profile display names, snapshot groups, workspace sections, dimension order/labels, applicability, ratings prominence, readiness mode and refresh modules. It must not classify securities, query storage, calculate business facts or generate scores.

Subprofiles extend this model through effective profile contracts and view models. They must not introduce symbol conditions in presentation code.

### Score and evidence display

- `SCORED`: validated numeric score exists.
- `EVIDENCE_NOT_SCORE_READY`: validated evidence exists but the scoring gate is unmet.
- `NO_VALIDATED_EVIDENCE`: no evidence has passed validation.
- `NOT_APPLICABLE`: the effective contract explicitly excludes the requirement/dimension.
- `NO_DATA`: raw/source data is absent and no validated evidence exists.

Missing values remain null/unavailable and never become zero.

### Heatmap

Heatmap geometry and state language are shared. Scored cells expose `Why this score?`; evidence-only cells expose `View evidence`; no-validated-evidence cells show disabled `Evidence unavailable`; inapplicable cells show disabled `Not applicable`.

### Research readiness

The shell consumes a versioned readiness view model containing profile/subprofile identity, effective-contract version, mandatory readiness, important coverage, supplementary coverage, evidence coverage, score readiness, grouped requirements, blockers and evidence lineage. Profile adapters may group requirements differently, but every numerator and denominator must preserve the definitions in the R4N architecture.

### Refresh modules

Lifecycle states are `AVAILABLE_TO_PLAN`, `PLANNED`, `EXECUTION_DISABLED`, `EXECUTABLE`, and `NOT_AVAILABLE`. A lifecycle state controls the shared footer/control treatment; it never grants provider authority by itself.

### PortfolioAI Suggestion

The common structure is status, role/recommendation, action bias, suggested range, current weight, owner target and portfolio context. Unavailable methodology renders those same regions with explicit unavailable/not-ready states and preserves canonical user-controlled facts. Rendering must not invent or persist a recommendation.

### AI Interpretation

`recommendationReady = true` permits the existing interpretation planning path. `false` preserves the button position but disables interaction. AI explains an existing deterministic recommendation and cannot calculate or alter scores, roles, weights or owner decisions.

### External ratings and snapshots

`External ratings` is the common shell. Empty and populated states share the interface. Snapshot cards consume canonical metric view models with metric code, label, value, unit, period, evidence state, freshness and provenance; UI components do not reinterpret the fact.

### Empty/disabled vocabulary

- `Not available`: no approved method or capability exists.
- `Not ready`: capability exists but prerequisites are unmet.
- `Pending`: an initiated process/result awaits completion.
- `Not started`: evaluation/tracking has not begun.
- `No validated result`: evaluation exists but no approved conclusion exists.
- `Unavailable`: the underlying fact is absent or cannot be represented safely.

## Allowed extension points

- profile and subprofile definitions;
- metric/evidence requirements and applicability;
- labels and grouping metadata;
- readiness adapters using the shared view model;
- refresh capability metadata using the shared lifecycle;
- source, normalization, freshness and provenance contracts;
- scoring/recommendation policies only after separate methodology approval.

## Prohibited extensions

- new Research pages by profile or symbol;
- duplicated profile-specific component trees;
- `symbol === ...` presentation branches;
- page-local classification, evidence, score or readiness calculations;
- provider calls triggered by rendering;
- profile-specific CSS that creates a separate application shell.

The existing HDFCBANK reference-stock operational refresh pilot is bounded behavior, not a pattern for future profiles. Its four modules are selected through typed reference-security eligibility metadata inside the shared profile contract.

## Resolved freeze blocker

The legacy `profileCode === BANK_NBFC && symbol === HDFCBANK` rendering branch has been removed from `CompleteResearchRefreshPanel.tsx`. The shared renderer now consumes typed action and eligibility metadata from `researchProfileUiContract.ts`; HDFCBANK remains explicitly scoped as the reference-security pilot without creating stock-specific presentation JSX. Regression tests prove both the HDFCBANK entitlement and fail-closed behavior for another BANK_NBFC security.

## Contract guard specification

The implementation gate must preserve tests proving:

1. HDFCBANK and TORNTPHARM render the same page regions and tabs.
2. Available and unavailable suggestions share one component structure.
3. Interpretation availability is state-driven.
4. Refresh controls are lifecycle-driven.
5. Score/evidence/heatmap labels derive from explicit states.
6. Readiness adapters preserve common denominator semantics.
7. Profile metric registries cannot leak bank metrics into Pharma.
8. unknown profiles/subprofiles fail closed.
9. presentation code contains no provider invocation or canonical-storage query.
10. source scans reject new symbol-specific UI branching.
