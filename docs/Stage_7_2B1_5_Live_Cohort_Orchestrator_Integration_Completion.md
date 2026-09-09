# Stage 7.2B1.5 — Live Cohort Orchestrator Integration Completion

**Status:** Complete; deployed dry-run validated; no Cohort A provider execution

## Integration gap and correction

Stage 7.2B1 had validated the shared cohort planner and cleanup executor, but the
deployed `refresh-security-enrichment` function still used the earlier
action-separated `rows.length * 4` execution path. Stage 7.2B1.5 removes that
production bypass. Non-cache legacy actions now stop safely, and the only live
provider execution entry is the exact owner-approved `REFRESH_COHORT` contract.

The Edge boundary authenticates the owner, verifies portfolio ownership and open
equity holdings, loads provider controls and cached evidence, verifies the exact
25-symbol allowlist, and delegates planning and batch cleanup to the shared
orchestrator. The live branch creates domain run items, reserves budget, acquires
the provider-wide lease, accounts for each actual attempt, applies only bounded
transient retries, records refresh results, settles unused units, releases the
lease, and completes each logical run. One overview response is reused for
compatible identity and fundamental processing; ownership and approved document
discovery retain their separate calls and evidence semantics.

## Authenticated live dry-run

The same planner is exposed through authenticated `dryRun: true`. It performs
read-only validation and returns planned domains, cached skips, base calls, retry
reserve, batch reservations, observed daily usage, projected daily usage and
budget eligibility. It returns before provider-client construction, budget
reservation, run creation, run-item creation, evidence writes or refresh-state
updates.

The linked version 11 dry-run on 9 September 2026 returned:

- ten fresh pilot securities skipped and fifteen additions planned;
- 60 base attempts and 12 bounded retry attempts;
- batch reservations of 39 and 33 attempts;
- zero observed daily usage and projected daily usage of 72/100;
- `providerCalls: 0`, `budgetConsumed: 0`, and `budgetEligible: true`.

Post-call linked statistics remained at zero provider usage events, zero budget
reservations, zero run items and zero refresh states. The evidence and financial
regression estimates remained 482 transactions, 271 securities, 249 Angel One
mappings, 248 latest prices, 128 fundamental observations, 10 identity
observations, two themes, 14 memberships and zero position settings.

## Validation and boundary

The full Vitest suite, Edge suite, TypeScript, application and Edge ESLint,
production build, `git diff --check`, secret scan, and the 45-assertion disposable
Stage 7.2A pgTAP/RLS/control-plane suite passed. The Edge deployment bundled
successfully. No migration or database mutation was required. The standalone Deno
CLI was unavailable; successful Supabase bundling plus Edge lint/tests covered the
deployed module. Cohort A remains unexecuted and requires separate owner approval.
