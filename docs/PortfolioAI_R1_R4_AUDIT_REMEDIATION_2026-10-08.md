# PortfolioAI R1–R4 Audit Remediation and Repository Completion — 8 October 2026

**Audit baseline supplied by owner:** `9362f15`  
**Development head inspected before final verification repair:** `4403eac1c30663a6fdccc787e55503838422042c`  
**First fully green code-verification head:** `aefef83da45e3274e44a6d8819ee354dbace33b4`  
**Scope:** repository implementation and verification only; no production/provider/ingestion authorization.

## Scope resolution

The repository contains two different naming systems: historical **R1/R2/R3/R4** workstreams and a newer operational **V1-4** evidence-readiness stage. The supplied audit findings, named files and required behaviors map directly to the R1–R4 workstreams. This remediation therefore treats the requested scope as **R1–R4 repository completion** and does not silently expand it into the newer operational V1-4 stage.

Completion terms remain distinct:

- **Repository complete:** required contracts/code/tests exist and the repository verification gates pass.
- **Pilot complete:** a separately bounded pilot was actually materialized and validated.
- **Production deployed/verified:** separately approved production migrations/functions/data writes were applied and post-action checks passed.
- **Portfolio-wide capability complete:** the required evidence/methodology exists across the intended population.

A working UI, a passing reference stock, a migration file or historical documentation does not by itself prove the latter three states.

## R1–R4 completion matrix

| Stage | Required behavior | Verified repository implementation | Repository completion criterion | Production prerequisite / gate |
| --- | --- | --- | --- | --- |
| **R1 — position sizing** | Equity-only deterministic sizing; fail closed without READY profile, score/recommendation lineage, evidence coverage and valid weight guidance; owner target/min/max remain owner-controlled. | `positionSizingEngine.ts` enforces equity-only applicability, READY research profile, persisted score/recommendation IDs, coverage and weight guidance. Owner settings are comparison/freeze context and are not engine output. | Architecture/type/lint/tests/build green without changing accounting or owner-setting authority. | Any new sizing persistence/schema write or real assessment population requires the specific approval required by `AGENTS.md`. Repository completion is not portfolio-wide sizing coverage. |
| **R2 — coverage registry** | Authenticated, ownership-checked, cache-only coverage; browsing spends no provider budget; missing/stale/conflicting states remain visible; application classification authority is preserved. | Existing registry/projection and R2D endpoint contracts are read-only/cache-first and preserve classification authority. No provider execution was added by this remediation. | Registry/projection/security tests plus full verification green. | Existing R2D production state is historical evidence, not a new deployment authorization. Any new schema/RLS/grant/deployment requires separate approval. |
| **R3 — bounded evidence planning** | Plan only approved missing/stale work; cache first; actual provider execution only through the provider-control plane; planning consumes zero calls/budget. | `research-refresh-plan.ts` returns `providerCalls: 0`, `budgetConsumed: 0`, `executionAllowed: false`; document scope is bounded and non-equities are rejected. | Planner/control-plane tests and full repository verification green. | Trendlyne/Angel/NSE/provider calls, ingestion writes and budget consumption require the existing explicit execution approval path. |
| **R4 — profile routing / Pharma evidence** | Research routing stays separate from application classification; ambiguous/non-equity cases fail closed; canonical history must not mix incompatible observations; one deterministic OPM owner; readiness remains blocked while required evidence/regulatory history is incomplete. | Routing returns `PROFILE_PENDING`, `REVIEW_REQUIRED` or `NOT_APPLICABLE` as appropriate. Canonical Pharma history consumes the canonical selection authority, detects conflict/incompatible scope/unit/currency/period/provider semantics, and derives OPM only from compatible matched inputs. `derivePharmaOperatingMarginPercent` is the single calculation owner using Decimal arithmetic and six-decimal calculation precision. Readiness UI uses security-specific cached evidence and keeps source-contract readiness separate. | Regression tests for conflicts/compatibility/zero/missing inputs plus all repository gates green. | R4H remains a separately gated TORNTPHARM canonical-ingestion pilot. Its migration/write package is not production permission and does not prove portfolio-wide Pharma readiness. |

## Audit findings resolved

### Verification environment and lint

The test environment now installs a real `ResizeObserver` stub through `src/test/setup.ts`, and Vitest loads that setup globally. ResearchPage tests no longer depend on a browser-only observer being present.

Application and Edge lint are mandatory in `.github/workflows/r1-r4-verification.yml`. At the green verification head both commands completed with no lint output, errors or warnings. The lint configurations were not weakened to suppress the audited findings.

### Angel One session contract

The public safe error contract is the provider-specific code `ANGEL_SESSION_EXPIRED_<provider-code>`; AG8001 therefore produces `ANGEL_SESSION_EXPIRED_AG8001` with the safe message `Angel One rejected the market-data session (AG8001).` The tests now assert that actual contract. Session reauthentication remains bounded to one retry, and the controlled no-retry history path remains available.

### Pharma canonical-history selection

`src/features/research/canonicalResearchSeries.ts` now owns fail-closed compatible-series selection.

- Retrieval recency does not decide a conflicting period.
- An explicit canonical observation decision is honored.
- Unresolved same-period value conflicts remain unresolved.
- Standalone and consolidated observations are not mixed.
- Period start/end/type, unit, currency, scope and provider/source semantics are compatibility inputs.
- Missing inputs and zero revenue do not manufacture a margin.

`pharmaCanonicalHistoryView.ts` derives OPM only after canonical series selection and only for compatible same-period revenue/profit observations. Tests cover conflicting captures, explicit canonical selection, incompatible scope/unit/currency/period, provisional evidence, missing input, zero revenue and a valid matched case.

### One operating-margin owner

`derivePharmaOperatingMarginPercent` in `pharmaHistoryNormalization.ts` is the deterministic calculation owner. It uses `decimal.js`, rounds the normalized calculation to six decimal places with half-up rounding, and returns null for invalid/non-positive revenue. The canonical-history view delegates to it. Two-decimal formatting is presentation-only.

### Pharma readiness/UI status

The readiness model now derives state from the current security's cached evidence. Cache evidence sufficiency and source-contract validation are separate dimensions. Generic Pharma UI no longer treats the TORNTPHARM pilot/migration record as proof that history was ingested for every Pharma security.

R4G/R4H boundaries remain explicit: R4G is repository engine/UI work; R4H is a prepared canonical-ingestion pilot whose production write is separately gated.

## Final verification repair after the audit-remediation code

The first full verification run after the broader audit fixes reached the Deno handler gate and exposed eight type-check issues in newer V1-4 shared Edge code. These were repaired without changing R1–R4 financial semantics:

- normalized the WebCrypto digest buffer type in `v14-official-benchmark-r2.ts`;
- narrowed reviewed-document nullability before publication checks;
- pinned the P4 execution-grant helper to the callers' Supabase client version;
- updated the Deno capture test to the current typed-document-minima contract version;
- corrected Deno-safe `ReadonlyArray` and benchmark-history Map typing in the materializer.

No lint, type, architecture or security rule was relaxed.

## Verification result

GitHub Actions job `113170264795` for commit `aefef83da45e3274e44a6d8819ee354dbace33b4` completed **SUCCESS**.

| Gate | Result |
| --- | --- |
| `npm run check:architecture` | PASS — data-boundary guard passed |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — no errors/warnings emitted |
| `npm run lint:edge` | PASS — no errors/warnings emitted |
| `npm test` | PASS — 343 files / 2,167 tests |
| Deno handler tests | PASS — 2 / 2 |
| `npm run test:edge` | PASS — 55 files / 359 tests |
| `npm run build` | PASS |
| `git diff --check HEAD^ HEAD` | PASS |

This verification is repository/build evidence. It is not a provider execution, production deployment, production data verification or portfolio-wide readiness assertion.

## Migrations and deployment boundary

**New migration files created by this audit remediation: none.**  
**Migrations applied by this audit remediation: none.**  
**Provider calls / provider budget used: none.**  
**Ingestion writes: none.**  
**Scheduler activation: none.**  
**Production deployment: none.**  
**Auth/RLS/grant changes: none.**

Existing production-dependent artifacts remain governed by `AGENTS.md`. In particular, the R4H TORNTPHARM package still requires separate explicit approval before applying its prepared metric-definition migration and inserting the exact approved canonical observations. That production action must retain its preconditions, conflict checks, idempotent insert key, post-write reread/validation and rollback/recovery boundary.

## Completion statement

**R1–R4 repository implementation and verification: COMPLETE for the audited repository scope.**

This statement does **not** mean R4H production ingestion is executed, all Pharma holdings are evidence-ready, provider work is authorized, the newer operational V1-4 evidence stage is complete, or portfolio-wide investment intelligence is READY.


## Current-head verification after concurrent research-shell merge — 8 October 2026

The first fully green audit-remediation executable head remains `aefef83da45e3274e44a6d8819ee354dbace33b4`. After that verification, PR #116 (`feat(research): share canonical research context and Industry-first stock shell`) was merged into `PortfolioAI-Development` as `00a0dfe5621450354c7e6027820870becc5f9f11`. The current Development head at this documentation update is `d3883d3182f686c82bdde1d2840b68285ac61421`.

This later merge contains executable Research-page/canonical-context changes. It therefore supersedes the earlier temporary statement that the post-`aefef83d` branch contained only documentation. The core audit-remediation owners remain unchanged after the green head except for additional `ResearchPage.test.tsx` coverage: `src/test/setup.ts`, `vitest.config.ts`, `supabase/functions/_shared/angel-one.ts`, `canonicalResearchSeries.ts`, `pharmaCanonicalHistoryView.ts`, `pharmaHistoryNormalization.ts`, `pharmaReadinessViewModel.ts`, `PharmaResearchReadinessPanel.tsx`, `.github/workflows/r1-r4-verification.yml` and `eslint.config.js` did not change in the PR #116 merge.

PR #116 has separate repository and hosted verification evidence:

- Architecture Guard run `37732538454` at `ddae8c897f43a929baf463dc90c9cc80c7d06b10` completed successfully, including Stage 2 integration tests, shell safeguards, canonical-authority checks, TypeScript, full repository lint, production build and whitespace check.
- Architecture Guard run `37734884062` at application commit `506ffbd91808bc70fa01be9c07395febda5b3e40` completed successfully with the same code-quality/build gates.
- Final hosted review commit `9e736abc80d87b551e5c15f045d69ab2c74d31e3`, which includes `506ffbd9`, passed 118 authenticated read-only Chromium checks across seven representative stocks; the sanitized evidence records zero runtime errors, zero provider refresh attempts and zero research writes.
- PR #116 was subsequently merged to Development as `00a0dfe5621450354c7e6027820870becc5f9f11`.

The dedicated current-head R1–R4 verification workflow could not obtain a GitHub-hosted runner after the account billing/spending-limit restriction began. Runs including `37755743453`, `37766046568`, `37766062400` and `37766093515` completed with `runner_id: 0` and an empty step list. A retry of `37755743453` behaved identically. These runs provide **no code verdict** and are recorded as CI provisioning/infrastructure failures, not as passing or failing repository checks.

Therefore the evidence boundary is:

- the audit-remediation implementation itself has a full green verification at `aefef83da45e3274e44a6d8819ee354dbace33b4`;
- the later merged Research/canonical-context code has successful targeted architecture/type/lint/build verification and final hosted read-only acceptance before merge;
- an exact full-suite run on the current merged Development head remains **not executed because GitHub did not provision a runner**;
- production/provider/ingestion and portfolio-wide readiness remain separate approval/evidence gates.

The repository-completion statement is limited accordingly: the audited R1–R4 remediation is implemented and verified, while exact-current-head full-suite re-verification remains an infrastructure-blocked verification item rather than an implementation defect.

