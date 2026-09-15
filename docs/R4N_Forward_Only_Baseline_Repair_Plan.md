# R4N forward-only baseline repair plan

Status: **MIGRATIONS PREPARED / NOT APPLIED**

## Scope

Two new migrations repair the final database contract without editing any historical migration:

1. `20260915133027_repair_news_scheduler_baseline_state.sql`
2. `20260915133028_fix_portfolio_profile_weight_context_ambiguity.sql`

No production application, provider call, schedule invocation, evidence write, score write, recommendation write or portfolio mutation is included.

## Repair 1 — final pg_cron and NEWS policy state

Expected changes:

- idempotently ensure the `pg_cron` extension and `cron.job` catalog exist;
- fail closed if the refresh-policy table is missing or an enabled policy incorrectly uses `DISABLED` freshness;
- temporarily remove only the named `refresh_domain_policy_disabled` check constraint;
- normalize disabled policies to `freshness_basis='DISABLED'` without changing enabled policies, policy versions, effective intervals, definitions or scheduler configuration;
- recreate and validate the same canonical enabled/freshness constraint;
- assert that NEWS policy V6, if present, is disabled, closed and uses `DISABLED` freshness;
- never call `cron.schedule`, `cron.unschedule`, a scheduled wrapper, pg_net, an Edge Function or a provider.

This repairs final state on a database that has already reached the new migration. It does **not** retroactively move `pg_cron` before historical migration `20260913130000`, so a completely empty replay still requires the documented disposable bootstrap/harness or a future owner-approved baseline/squash strategy.

## Repair 2 — portfolio profile weight function

Expected changes:

- replace `get_portfolio_profile_weight_context_v1(uuid, uuid, text)` with the same signature, return columns, SECURITY DEFINER mode, ownership checks and calculation;
- rename the internal totals CTE field from `total_position_count` to `position_count`;
- return it as `t.position_count` from an explicitly aliased `totals t` subquery;
- preserve authenticated/service-role execution and explicitly revoke anonymous/public execution;
- make no changes to holdings, prices, assignments, weight formulas or persisted financial data.

## Verification before ordinary-local application

The migrations will first be appended to the already proven disposable replay harness. Required results:

- all historical migrations, R4N and both repair migrations apply in order;
- existing R4N 19-test pgTAP suite passes;
- new 10-test repair pgTAP suite passes;
- `supabase db lint --local --schema public --level warning --fail-on error` no longer reports the ambiguous function reference;
- schema diff contains only the expected extension/constraint final state and function-body correction;
- no evidence, scoring, recommendation, sizing or outbound-request rows are created;
- ordinary local and production migration histories remain unchanged.

Only after those results are reviewed should the ordinary local application be separately executed.

## Duplicate historical versions

The four duplicate historical version pairs remain documented separately. A new forward migration cannot give two already-applied historical files distinct ledger identities, and renaming applied migrations would break history alignment. No repository rename or migration-history manipulation is proposed.

A safe permanent remedy requires a separately approved baseline/squash mechanism that preserves an immutable mapping from every legacy file/checksum to the new baseline. Until then, disposable clean replay uses filename-only normalization in its temporary copy.
