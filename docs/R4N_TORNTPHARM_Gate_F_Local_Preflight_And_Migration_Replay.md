# R4N Gate F — Local Numeric Preflight + Regulatory Migration Replay Preparation

**Status:** Prepared only / not executed  
**Branch:** `r4n-pharma-subprofile-architecture`

## Numeric local preflight

Contract: `TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_V1`

The preflight is a pure evaluator. It does not query or mutate the database itself.

Prepared local lookups:
- `fundamental_metric_definitions`
- `data_source_records`
- `fundamental_observations`
- `research_subprofile_assignments`

For each of the four reviewed US-growth rows, a supplied local snapshot is classified as:
- `INSERT_CANDIDATE`
- `ALREADY_PRESENT`
- `CONFLICT`
- `BLOCKED`

Fail-closed rules:
- missing/mismatched metric definition → block;
- missing source record → block that row;
- exact existing value → already present, no duplicate insert;
- conflicting existing quarter value → conflict;
- no condition ever sets `writeAuthorized = true`.

A clean preflight only reaches:
`readyForSeparateWriteApproval = true`

## Regulatory migration replay

Contract: `PHARMA_REGULATORY_EVENT_MIGRATION_REPLAY_PLAN_V1`

Execution target:
`LOCAL_SUPABASE_ONLY`

Proposal SQL:
`docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql`

Prepared replay assertions include:
- proposed object absent before replay;
- canonical prerequisite tables/functions present;
- proposed table created inside the transaction;
- RLS enabled;
- authenticated mutation denied;
- service-role mutation allowed;
- immutable trigger present;
- site-specific / US FDA scope enforced;
- current-state view uses security invoker;
- rollback removes proposed objects;
- Supabase migration history remains unchanged.

The replay package is not an executable production migration and does not authorize schema application.

## Current gate state

- local numeric preflight: **prepared, not executed**
- regulatory migration replay: **prepared, not executed**
- numeric write authorized: **NO**
- schema apply authorized: **NO**
- production execution authorized: **NO**
