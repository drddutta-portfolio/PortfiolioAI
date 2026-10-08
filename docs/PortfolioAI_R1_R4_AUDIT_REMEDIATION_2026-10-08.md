# PortfolioAI R1–R4 Audit Remediation — Scope and Completion Matrix

**Date:** 8 October 2026  
**Remediation branch:** `r1-r4-audit-remediation-2026-10-08`  
**Audit baseline supplied by owner:** `9362f15`  
**Development baseline inspected before remediation:** `1a6d16e0a553ba08232bdc5f003e78b8f032c404`

## Scope clarification

The current repository contains both the historical R1/R2/R3/R4 workstream names and a newer operational `V1_4` evidence-readiness stage. The audit request describes R1–R4 defects and references the R1–R4 audit. This remediation therefore changes only R1–R4 audit findings and scope-independent verification until the owner explicitly resolves that naming ambiguity. It does not silently absorb the newer operational V1-4 stage.

## Completion vocabulary

- **Repository complete** — reviewed contracts/code/tests are present and verification gates pass.
- **Pilot complete** — the separately specified bounded reference/pilot evidence was actually materialized and validated.
- **Production deployed/verified** — approved migrations/functions/data writes were actually applied and post-action checks passed.
- **Portfolio-wide capability complete** — the required evidence/methodology exists across the intended portfolio population. A working UI or reference security does not establish this state.

## R1–R4 matrix

| Stage | Required behavior | Current repository implementation | Audit-remediation work | Repository completion criterion | Production prerequisite / gate |
| --- | --- | --- | --- | --- | --- |
| **R1 — Position sizing** | Equity-only deterministic sizing; require approved READY research profile, persisted score/recommendation lineage, readiness coverage and validated weight guidance; owner target/min/max remain owner-controlled; fail closed on missing prerequisites. | `positionSizingEngine.ts` enforces equity-only applicability, READY profile, score/recommendation lineage, coverage, current weight and range prerequisites. Owner settings are comparison/freeze context only and are never engine output. | No semantic change required. Verification gate covers existing engine tests. | Engine contract/tests/architecture/lint/type/build pass without changing accounting or owner-setting authority. | Existing sizing-persistence migration remains separately gated. Applying it and writing real sizing assessments require explicit owner approval. Repository completion does not mean portfolio-wide sizing coverage. |
| **R2 — Coverage registry** | Authenticated, owner-scoped, cache-only portfolio coverage; no provider calls/budget spending; expose missing/stale/conflicting state truthfully; preserve application classification authority. | R2D documentation records production integration of an authenticated owner-scoped read-only endpoint, service-only data boundary, zero provider calls/budget, and explicit ownership check. Registry/projection modules preserve non-executing coverage semantics. | No production mutation authorized or required by this remediation. Existing coverage tests remain mandatory. | Registry/projection tests and architecture/security boundaries pass; browsing remains cache-only. | R2D production endpoint is documented as deployed/verified, but this remediation does not redeploy it. New schema/grant/RLS work would require separate approval. |
| **R3 — Bounded evidence planning** | Plan only approved missing/stale domains; reuse cache first; provider execution only through provider-control plane; planning itself consumes zero calls/budget. | `research-refresh-plan.ts` builds cohort plans from cached evidence, enforces bounded document scope and returns `providerCalls: 0`, `budgetConsumed: 0`, `executionAllowed: false`. | No provider execution added. Existing planner/control-plane tests remain mandatory. | Planner tests prove missing/stale-only bounded planning and non-execution; full verification gates pass. | Any actual Trendlyne/Angel/NSE/provider call or ingestion write requires the existing explicit execution/budget approval path. |
| **R4 — research-profile routing / Pharma evidence** | Routing must remain separate from application classification; ambiguous/non-equity cases fail closed; Pharma history must preserve reconciliation semantics, use compatible evidence only, have one deterministic OPM owner, and remain blocked when required evidence/regulatory history is incomplete. | `researchProfileRouting.ts` preserves displayed classification and returns `PROFILE_PENDING`, `REVIEW_REQUIRED`, or `NOT_APPLICABLE` where appropriate. PHARMA_V1 readiness remains fail-closed. R4H is a prepared repository pilot and explicitly not proof of production ingestion. | Canonical Pharma history now honors `fundamental_observation_decisions`; absent a decision it collapses only semantically identical same-valued duplicates. Conflicting/incompatible periods, scope, unit, currency or provider semantics stay unresolved. OPM derivation has one Decimal owner. Readiness UI separates security-specific cached evidence sufficiency from source-contract readiness. R4G documentation reconciled with R4H production boundary. | Targeted regression tests plus architecture/type/lint/full app tests/Edge tests/build/diff check pass. No unresolved conflict may be silently converted into a value. | R4H ingestion/provider execution remains separately gated. Prepared manifests/migrations do not prove production writes. Portfolio-wide Pharma evidence and scoring readiness are not claimed. |

## Audit findings versus current HEAD

The supplied audit baseline predates substantial repository work. At the inspected Development baseline:

- `src/test/setup.ts` already provides a test-environment `ResizeObserver` implementation, so the audited ResearchPage environment failure had already been repaired.
- Angel One public errors already use the specific safe contract `ANGEL_SESSION_EXPIRED_<provider-code>`; its test now expects `ANGEL_SESSION_EXPIRED_AG8001`. The session retry remains bounded to one reauthentication attempt.
- The Pharma canonical history view still contained the substantive audited defect: newest-capture-per-period selection and independent two-decimal OPM derivation. That is the principal code correction in this remediation.
- R4 source/readiness documents had evolved, but R4G wording still needed reconciliation with the R4H production boundary and current cache-specific behavior.

## Canonical authorities affected

- **Fundamental reconciliation / selected observation:** unchanged authority; `fundamental_observation_decisions` remains the canonical selection owner. The new read model consumes that decision instead of creating a competing selection rule.
- **Operating-margin derivation:** consolidated under `src/features/research/pharmaOperatingMargin.ts`; provider observations remain raw evidence and the derived margin remains PortfolioAI-owned.
- **Readiness UI:** presentation consumes actual cached evidence counts; source-contract readiness remains a separate contract dimension.
- **Application classification:** unchanged. Research-profile routing does not rewrite sector/industry.
- **Accounting / transactions / owner settings:** unchanged.

## Database, migration and deployment boundary

This remediation creates **no database migration** and applies **no migration**. It performs **no provider execution, ingestion write, scheduler activation, Production deployment, RLS/grant change, transaction/accounting mutation, or owner-setting write**.

Existing production-dependent R1/R4 artifacts remain review-gated under `AGENTS.md`. Any such action must be proposed with its exact migration/manifest, preconditions, conflict checks, idempotency proof, post-action validation and rollback/recovery procedure before separate owner approval.

## Verification requirement

The remediation is not repository-complete until the PR verifies:

`npm run check:architecture`  
`npm run typecheck`  
`npm run lint`  
`npm run lint:edge`  
`npm test`  
`npm run test:edge`  
`npm run build`  
`git diff --check`

The Architecture Guard workflow is changed in this branch so full lint and both full test suites are mandatory rather than diagnostics.
