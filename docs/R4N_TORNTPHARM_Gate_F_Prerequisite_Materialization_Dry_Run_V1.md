# R4N Gate F — TORNTPHARM Prerequisite Materialization Dry Run V1

**Status:** Prepared only / not executed / zero writes  
**Branch:** `r4n-pharma-subprofile-architecture`

## Purpose

Prepare a local-only, non-writing executor that converts the already validated canonical prerequisite package into deterministic materialization output.

The executor:

- does not connect to Supabase;
- does not insert or mutate any row;
- deterministically serializes each reviewed source payload;
- computes SHA-256 hashes;
- prints exact proposed SQL for:
  - one `fundamental_metric_definitions` row;
  - four `data_source_records` rows.

## Command

`npm run r4n:dry-run:prerequisites`

## Shared manifest

`scripts/r4n/torntpharm-prerequisite-materialization-manifest.json`

The manifest contains:

- the validated `PHARMA_EXPORT_US_REVENUE_GROWTH` metric-definition proposal;
- four Q1-Q4 FY26 issuer source-record proposals;
- exact reviewed source URLs;
- reviewed canonical raw payloads;
- explicit non-writing execution policy.

A regression test compares the manifest to `TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_V1` so the execution manifest cannot silently drift from the validated TypeScript package.

## Deterministic serialization

Serialization contract:

`RECURSIVE_LEXICOGRAPHIC_KEY_SORT_V1`

Every object is recursively rewritten with lexicographically sorted keys before JSON serialization.

Hash contract:

`SHA256(UTF8(canonical_payload_json))`

The executor prints:

- artifact code;
- observation date;
- reviewed value;
- canonical payload;
- SHA-256 payload hash.

## Proposed SQL output

The dry-run prints the exact SQL text that would later be considered for:

1. `public.fundamental_metric_definitions`
2. `public.data_source_records`

No SQL is executed.

The source-record proposal uses:

- `source_code = COMPANY_EXCHANGE_FILING`
- `record_kind = ISSUER_RESULTS_RELEASE`
- external record id = reviewed artifact code
- exact source URL
- computed SHA-256 payload hash
- canonical raw JSON payload

## Safety invariants

The executor fails if:

- database connections are not explicitly prohibited by the manifest;
- writes are not explicitly prohibited;
- the metric code differs from `PHARMA_EXPORT_US_REVENUE_GROWTH`;
- the source-record count differs from four;
- any source payload contains the rejected Q4 31% value.

The dry-run ends with:

- database connections: **0**
- writes executed: **0**
- mutation authorized: **NO**

## Current state

- dry-run executor prepared: **YES**
- hashes computed yet: **NO**
- dry-run executed yet: **NO**
- DB connected: **NO**
- DB mutation: **NO**

## Next gate

After localhost visual approval and local validation, the owner may separately authorize execution of the non-writing dry-run command. That execution would still not authorize any local database mutation.
