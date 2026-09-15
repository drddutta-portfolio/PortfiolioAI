# PortfolioAI baseline V1 curated artifacts

Status: **DISPOSABLE REPLAY VERIFIED — NOT ACTIVE MIGRATIONS**

These artifacts are deterministic derivatives of the gate-1 candidates. They are
not present in `supabase/migrations/`, do not alter the ordinary local database,
and must never be applied over an existing production schema.

## Contents

- `portfolioai_schema_baseline_v1.sql` creates the repaired final public schema,
  required extensions, grants, RLS, functions, triggers, indexes and constraints.
- `portfolioai_reference_registry_v1.sql` loads only the explicit global
  reference/configuration allowlist and asserts every expected table row count.
- `portfolioai_reference_registry_contract_v1.json` records each reference
  table's canonical owner, purpose, natural key and expected row count, plus
  source-candidate checksums and the timestamp normalization policy.
- `portfolioai_local_operational_defaults_v1.sql` is opt-in and inert unless
  `portfolioai.enable_local_schedulers=on`; it contains no credentials and makes
  no provider or network call.

## Determinism and dependency handling

Replay-generated SQL timestamps are sorted and mapped to stable millisecond
offsets from `2026-09-15T00:00:00Z`. This preserves strict effective-date
intervals while removing wall-clock replay variance. Business dates, embedded
source timestamps and historical dates are not rewritten.

`scoring_profiles` is emitted parent-first (`GENERAL` precedes its children), so
its self-referential foreign key remains enabled throughout loading. No triggers,
RLS policies or foreign keys are disabled.

Fresh Supabase bootstrap default privileges are neutralized before baseline
objects are created. The captured explicit grants and final default privileges
then recreate the repaired full-history ACL state. This prevents consolidated
creation order from accidentally granting callable functions to `anon` or
`authenticated`.

## Disposable verification result

- clean baseline-only replay: passed;
- schema dump versus repaired full-history candidate: byte-identical;
- database lint: no schema errors;
- schema diff: empty;
- R4N and forward-repair pgTAP suites: 29/29 passed;
- self-referential scoring-profile load: passed with constraints enabled;
- local scheduler jobs: zero because opt-in was absent;
- portfolio/transaction/evidence/score/recommendation/sizing rows: zero.

The repository-wide pgTAP command passed 13 of 14 test files. The historical
`stage7_2a_provider_control_plane_test.sql` is state-pinned to its original Stage
7.2A defaults (one provider control, quota `UNKNOWN`, 11 policies) and is not a
valid final-state test after later approved migrations changed those values. It
failed before completing its 45-test plan. This is recorded as legacy test drift,
not hidden or bypassed; the baseline-specific R4N suites pass independently.

## Remaining cutover gates

The active historical migrations have not been replaced by compatibility
markers. The ordinary local database has not been reset. Production has not been
inspected, repaired or modified. Each remains separately gated by
`docs/R4N_Migration_Baseline_Cutover_Plan.md`.
