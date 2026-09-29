# PortfolioAI P7-IC2 Canonical Current-Selection Contract V1

Date: 29 September 2026
Environment target: PortfolioAI Dev only
Branch: `PortfolioAI-Development`
Baseline before remediation build: `572d87dd108c0bf2d698a8e3ea46035dfce5bfbc`

## Purpose

IC2 is blocked because immutable research evidence snapshots are content-addressed while the current view chooses the newest physical snapshot by `as_of_date / created_at / id`. When corrected materialization reproduces an older valid content hash, the append helper correctly reuses that immutable row, but the current view still points to a newer erroneous row.

The remediation separates immutable evidence content from canonical-selection history.

## Invariants

1. `research_evidence_snapshots` remains immutable content history.
2. `research_evidence_snapshot_items` remains immutable requirement/evidence history.
3. `research_evidence_snapshot_selections` becomes immutable canonical-selection history.
4. Currentness is the latest valid selection event for a portfolio/security, not the latest snapshot creation time.
5. No snapshot or item is deleted, overwritten, or duplicated merely to make older deterministic content current again.
6. Initial migration backfill must preserve the pre-migration current view exactly.
7. Corrective state changes occur only in a later approved reconciliation campaign.
8. One reconciliation campaign uses one stable `selection_run_id` across all bounded slices.
9. Each bounded slice retains its own one-time execution grant.
10. Every campaign freezes one `evaluation_as_of` and one `source_cutoff_at`.
11. Same-content materialization is content-idempotent.
12. Same `portfolio_id + selection_run_id + security_id` is selection-idempotent.
13. A new approved run may reselect the same immutable snapshot and append a new audit event.
14. Partial slice failure is resumable; completed per-security selections remain valid.
15. Selection writes are service-controlled only.
16. Authenticated portfolio owners may read their own selection history under RLS.
17. Anonymous/browser write access is not permitted.
18. `current_research_evidence_snapshot_v1` remains `security_invoker = true`.

## Stage 2 repository artifacts

### Additive migration

`supabase/migrations/20260929235000_add_p7_ic2_canonical_snapshot_selection_ledger.sql`

The migration:

- adds composite snapshot-scope integrity needed for a three-column foreign key;
- creates `research_evidence_snapshot_selections`;
- adds append-only enforcement;
- enables owner-scoped RLS;
- restricts write privileges;
- backfills exactly the current pre-remediation projection;
- replaces the current view so it resolves through the latest selection event;
- adds `append_and_select_research_evidence_snapshot_v2`;
- preserves `append_research_evidence_snapshot_v1` for compatibility until callers are migrated.

### Verification script

`supabase/tests/p7_ic2_current_selection_ledger.sql`

The transaction-only verification script checks:

- one backfill selection per current security;
- one current row per security;
- `security_invoker = true`;
- authenticated read-only / anon-denied selection-table privileges;
- service-role-only V2 execution;
- deterministic reuse of an older snapshot without increasing snapshot/item cardinality;
- canonical reselection of older valid content;
- exact backfill/current snapshot-ID equivalence and deterministic mapping fingerprint equality;
- same-run retry idempotency scoped by portfolio;
- fail-closed reuse of one portfolio/run/security key with different content;
- fail-closed reuse of a stored snapshot when the submitted item payload does not match its immutable stored items;
- append-only UPDATE/DELETE rejection;
- cross-security selection rejection by composite foreign key.

The script ends with `ROLLBACK`.

## V2 function result contract

`append_and_select_research_evidence_snapshot_v2` returns:

- `snapshot_id`
- `selection_id`
- `snapshot_created`
- `snapshot_reused`
- `selection_created`
- `selection_reused`

## Backfill behavior

The migration uses one fixed backfill run and one fixed transaction-time evaluation/source-cutoff timestamp. It selects every row visible through the old `current_research_evidence_snapshot_v1` before replacing the view.

Immediately after the migration, before any remediation campaign:

- snapshot count must remain unchanged;
- snapshot-item count must remain unchanged;
- current-view cardinality must remain unchanged;
- every current snapshot ID must remain identical to its pre-migration value;
- status and requirement matrices must remain unchanged.

## Campaign behavior

The later materializer update must provide:

- one stable `selection_run_id` for the entire 239-equity campaign;
- the exact consumed slice grant ID as `execution_grant_id`;
- fixed `evaluation_as_of`;
- fixed `source_cutoff_at`;
- `MATERIALIZED_RECONCILIATION` as the normal selection basis;
- a versioned materializer identifier.

The materializer must recompute evidence deterministically. It must not choose an older snapshot simply because its status appears preferable.

## Stage boundary

Stage 2 is repository-only.

The migration exists in GitHub but is not applied to PortfolioAI Dev.
No database row has been changed by Stage 2.
No Edge Function has been deployed by Stage 2.
No provider call is required by this remediation.
Production and `main` remain out of scope.

Development migration application is Stage 3 and requires separate owner approval after local/replay verification of the Stage 2 package.
