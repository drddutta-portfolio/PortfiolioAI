# Stage 7.2D.2B.3 — Contract Discovery Capture Follow-up

## Purpose

The first production `CONTRACT_DISCOVERY` pilot completed successfully and reconciled all four internal provider attempts, but its transient HTTP response was lost when the caller session ended. This follow-up adds bounded persistence of the successful `search_parameters` response so contract metadata can be reviewed without relying on a transient screen.

## Scope

- Reuse the existing `data_source_records` table; no schema migration.
- Preserve the exact four approved discovery terms: ROCE, diluted EPS, EBITDA, operating margin.
- Preserve Stage 7.2A reservation, per-attempt usage accounting, and settlement behavior.
- Persist only after all four `search_parameters` calls and their usage events succeed.
- Persist one raw provider-evidence object using record kind `CONTRACT_DISCOVERY_SEARCH_RESULT`.
- Cap the serialized capture at 512 KiB.
- Compute and store a SHA-256 `payload_hash`.
- Deduplicate exact repeated payloads through the existing unique key on `(source_code, record_kind, external_record_id, payload_hash)`.
- Mark the capture explicitly as `CONTRACT_DISCOVERY_ONLY`, `research_writes_performed: 0`, and `canonical_promotion_performed: false`.
- Do not call `get_parameter_values`.
- Do not write `fundamental_observations` or `research_documents`.

## Failure behavior

If provider calls fail, no discovery capture is written. If capture persistence fails or the payload exceeds the 512 KiB cap, provider usage must still be settled using the actual consumed/failed/released units and the run must terminate with a safe failure code. No automatic provider retry is permitted.

## Rollback

The pre-change production function is version 1 and remains the known-good behavioral baseline. Rollback requires no database migration rollback. If the capture version behaves unexpectedly:

1. Do not issue another provider call.
2. Reconcile the current run, usage events, and reservation read-only.
3. Redeploy the version-1 source from merged `main` commit `11172695f7d51e65096f84345b016050c9f6ceba` (or revert this PR and redeploy the reverted source).
4. Leave any already-written `CONTRACT_DISCOVERY_SEARCH_RESULT` row as immutable audit evidence; do not promote it into canonical research/fundamental data.
5. Confirm provider controls, fundamental observations, and research-document counts remain unchanged.

## Second controlled discovery acceptance

Before the second live discovery, require clean provider controls, no active reservation, and a verified held HDFCBANK identity. One invocation only. On success expect four additional usage events, one settled four-unit reservation, one successful `CONTRACT_DISCOVERY` run, one `CONTRACT_DISCOVERY_SEARCH_RESULT` row for that run, and no change to canonical fundamental/research evidence counts.
