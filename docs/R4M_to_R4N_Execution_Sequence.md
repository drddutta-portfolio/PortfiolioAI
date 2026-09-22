# PortfolioAI — R4M to PHARMA_V1 Subprofile Execution Sequence

**Status:** proposed owner-controlled sequence
**Scope:** closes R4M, freezes the universal Research workspace, then designs and pilots `PHARMA_V1 + DOMESTIC_FORMULATIONS`.
**Safety:** no step implicitly authorizes production mutation, provider execution, deployment or scoring.

## Gate 1 — Close R4M visual review

1. Review authenticated localhost pages for HDFCBANK and TORNTPHARM side by side.
2. Record every visible difference as either intentional methodology/data variation or unnecessary shared-UI variation.
3. Fix only genuine shared-shell, component, interaction or status-semantic defects.
4. Rerun focused Research tests, application tests, Edge tests, typecheck, modified-file lint, architecture guard, build and `git diff --check`.

**Exit:** owner accepts both pages as one Research application; CI is green; no unresolved category-B UI difference remains.

Current evidence: authenticated review has confirmed the common page hierarchy, suggestion structure, interpretation placement/state, refresh shell, tabs, score/heatmap shell, external-ratings shell and readiness shell. Profile-specific data and capability states remain intentionally different.

**Resolved blocker:** the shared refresh component no longer contains a HDFCBANK-specific rendering branch. Typed profile/reference-security capability metadata now selects the reference pilot modules through the common renderer. PR #100 was owner-approved and merged as commit `de54ed1fa9569e9db0c14cfa8dac6dfbc2638c9f`.

## Gate 2 — Approve and merge R4M

1. Review draft PR #100 and its final diff.
2. Confirm no production/backend/provider mutation is included.
3. Obtain owner approval.
4. Merge PR #100 only after explicit owner instruction.

**Exit:** R4M is merged and tagged in Development Status as `UI COMPLETE`; merge status and deployment status remain separate.

## Gate 3 — Freeze the universal Research workspace

Freeze the public contracts for:

- Research page section order and navigation;
- profile UI contract registry;
- score/evidence display states;
- readiness view model;
- refresh-module lifecycle states;
- PortfolioAI suggestion availability states;
- AI interpretation availability state;
- external-rating and snapshot component interfaces.

Add contract tests proving a new profile/subprofile supplies configuration and data rather than a new page/component tree.

**Exit:** an architecture note identifies the frozen interfaces, allowed extension points and versioning/change policy.

## Gate 4 — Approve profile + subprofile architecture

1. Retain `profile_code = PHARMA_V1`.
2. Add a distinct versioned `subprofile_code` concept.
3. Define reviewed primary assignment, optional secondary exposures, effective dates, provenance and conflict handling.
4. Define deterministic parent/subprofile contract composition.
5. Register the eventual canonical authority and shared access path before implementation.
6. Review schema, RLS, provenance, audit and backward-compatibility impact.

**Exit:** owner approves the architecture candidate. No migration has yet been applied.

## Gate 5 — Finalize evidence/readiness contracts

1. Normalize the five supplied matrices into versioned machine-readable contract candidates.
2. Reconcile metric codes with existing canonical Pharma definitions.
3. Split continuous metrics, event evidence and composite qualitative contracts.
4. Define applicability conditions, requirement levels, history, units, source contracts, freshness and calculation ownership.
5. Define disclosure-unavailable behavior and source/licensing constraints.
6. Add deterministic fixture tests for inheritance, overrides, conditional activation, conflicts and missing evidence.

**Exit:** `PHARMA_V1 + DOMESTIC_FORMULATIONS` is `PROFILE CONTRACT COMPLETE`; other subprofiles may remain architecture candidates.

## Gate 6 — Re-audit the 42-row TORNTPHARM manifest

1. Assign TORNTPHARM to `DOMESTIC_FORMULATIONS` as an owner-review candidate.
2. Map every manifest row to the effective parent/subprofile requirement.
3. Identify duplicates, incompatible periods/units, provisional values and unsupported promotions.
4. Determine which parent gaps close.
5. Record new domestic-franchise gaps and conditional export/regulatory activation evidence.
6. Produce a revised bounded manifest and expected readiness deltas.

**Exit:** owner receives a row-level dry-run report. No evidence has been written.

## Gate 7 — Local implementation and dry runs

1. Implement schema changes only as new versioned migration files after owner approves the schema design; do not apply them yet.
2. Implement repositories, composition services and generated types against a local Supabase environment only after explicit approval for local schema commands.
3. Build immutable fixtures for parent and domestic-formulations evidence.
4. Run idempotent dry-run ingestion with no provider calls.
5. Verify RLS, ownership, provenance, duplicate rejection, conflict handling and rollback/recovery behavior.
6. Verify the shared Research page renders the effective contract without layout branching.

**Exit:** local tests and dry runs pass; production remains unchanged.

## Gate 8 — Production evidence and provider approval

Require a new explicit approval identifying:

- exact migration(s), if any;
- exact evidence rows;
- target security and profile/subprofile;
- provider and maximum call budget;
- expected canonical writes;
- validation queries;
- recovery plan.

Only then may an approved operator apply migrations, promote evidence or execute a provider call. Verify before/after migration status, schema diff, row counts, provenance and readiness deltas.

**Exit:** bounded production action is verified and audited. This does not authorize scoring.

## Gate 9 — Pharma scoring and recommendation methodology

1. Approve dimension mapping, metric weights, curves, missing-evidence behavior and overall gates.
2. Approve subprofile valuation methods and any mixed-model treatment.
3. Add hand-verifiable deterministic reference cases and cross-profile leakage tests.
4. Keep recommendation, role and sizing downstream of approved score/readiness gates.
5. Pilot TORNTPHARM before any broader Pharma cohort.

**Exit:** methodology is `ENGINE CONTRACT COMPLETE`; production execution requires its own approval.

## Gate 10 — Controlled expansion

After the TORNTPHARM pilot passes, select one reviewed reference company for each remaining subprofile. Complete contract, evidence, scoring and pilot gates independently before cohort or portfolio-wide expansion.

## Approved immediate next work

The owner approved the hierarchy for documentation/fixture-only R4N-A/R4N-B work:

```text
PHARMA_V1
  -> DOMESTIC_FORMULATIONS (TORNTPHARM first)
  -> API_BULK_DRUGS
  -> GLOBAL_GENERICS
  -> BIOPHARMA_BIOSIMILARS
  -> CDMO_CRAMS
```

All security mappings remain provisional review candidates. Unknown, missing or conflicting required subprofile assignment may expose parent evidence but blocks effective-contract completion, readiness, scoring and recommendation. The shared top-line readiness denominator is active mandatory effective requirements only; Important and Supplementary coverage remain separate.

The immediate work item is to freeze the shared shell contracts, define the typed assignment model and create a fixture-only 26-security candidate register. ZYDUSWELL is represented as `OUTSIDE_PHARMA_V1 / CONSUMER_HEALTH_REVIEW`. This work authorizes no migration, production assignment, ingestion, provider action or scoring implementation.
