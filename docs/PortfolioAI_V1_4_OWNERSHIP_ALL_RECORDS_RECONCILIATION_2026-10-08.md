# Operational V1-4 ownership: corrected 39-case retained-source reconciliation

**Date:** 2026-10-08. **Target:** Development Supabase `lrgpjimipfkyoqbpsqzz`. Source run `c0b7f1c4-3e36-4d5c-b79a-19e44fe74e83`; fixed population 115. Repository commit before writing this record: `33c915eccc4e89fc87c57b85e3a59cf983828f0d`.

## Why the earlier 39-item result was misleading

The prior item-linked report evaluated only `data_source_records.raw_payload.p7_ic2_ownership_history.series`. For all **39 of 39** labeled `OWNERSHIP_SERIES_MISSING`, that cached projection is absent, yet the original retained `raw_payload.result` is present and contains the **exact required** `Promoter` or `Institutional` section heading. These 39 are **not supported as genuinely absent provider evidence** and should not automatically trigger new paid retrieval.

The canonical `loadSliceFacts` path reprojects `COMPLETE_RESEARCH_OWNERSHIP` through `parseTrendlyneOwnershipHistory` when the cached projection is absent. The earlier standalone replay did not replicate that exact branch. A dedicated reprojection regression was added in `supabase/functions/_shared/p7-ic-ownership-v14.test.ts` at code commit `33c915eccc4e89fc87c57b85e3a59cf983828f0d`. The new test was committed but could not be executed in the full repository environment in this session.

## Independent all-retained-record query

Across the 39 item-linked missing cases, read-only query of exact `security_id`, `COMPLETE_RESEARCH_OWNERSHIP`, and the original run's source cutoff found:
- 39 cases inspected; 39 original selected raw captures have matching series headings and zero cached normalized ownership projection.
- On **cached projections only**, 1 case has an alternative retained record with at least 4 selected-series entries, and 38 do not. This count should **not** be mistaken for actual raw-source missing evidence.
- Recovered alternative: `JUBLPHARMA` (security `91520c5a-60a2-4719-9a5e-eeb3da6df18c`). The original selected raw source `45097558-0002-4719-a36a-a993c8cf8bb3` has a Promoter heading but no cached projection; another retained source `789ad512-cc8c-4832-8ec6-0add24d189e6` (same provider instrument ID 700) has 6 cached Promoter quarters, March 2025–June 2026. This is a source-recovery candidate, NOT reviewed/canonically accepted.
- 2 of the 39 have multiple retained captures, including one with nine; conflicts/revisions must be checked from original values and point-in-time cutoff before deterministic selection. Retrieval recency cannot independently resolve conflicts.

The current implementation's guard remains unconditionally `REVIEW_REQUIRED` unless extended to accept *proven* reviewed source contracts. The presence of a raw chart heading does not prove total equity denominator, publication date, valid historical revision, or governance review. No safe canonical candidates are authorized by the current proof.

## Corrected dry-run classification and boundaries

Original source-item replay still accounts for 115/115 securities and 114 ownership requirements (53 Promoter + 10 Institutional + 51 Governance). However, its **39 missing-series results are cache-projection limitations**, not demonstrated raw-source absence. They must be re-evaluated through the real canonical reprojector. The 24 previously syntactically eligible ownership series remain semantically unproven, and all 51 governance requirements remain independently review-gated. Counts are not additive unique-stock measurements.

The 49-versus-51 discrepancy reflects differing measures: 51 current governance requirement items, 49 directly linked raw ownership records and 2 without such a link. No change to methodology, frozen 111, or V1 thresholds.

## Execution prerequisite

Full verified Deno handler validation is **not** claimed: remote Development deployment is not authorized, complete repository checkout is unavailable to the container (GitHub DNS resolution failed), and an authenticated portfolio-owner session is required for the existing non-writing validation action. A connector SQL reconstruction cannot substitute for handler execution. Before deployment, run exact-HEAD architecture/TS/lint/Vitest/Edge/Deno/build suites, then invoke `P7_IC3_VALIDATE_CANONICAL_INPUTS` in authenticated read-only Development batches after confirming it has zero grant consumption, writes, R2 access and provider calls.

No paid provider calls, R2/database writes, migration, reviewer ACCEPT, Development deployment, Production change or V1-5 activity was performed. **V1-4 NOT PROVEN**.
