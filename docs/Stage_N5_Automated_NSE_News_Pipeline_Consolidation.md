# Stage N5 — Automated NSE News Pipeline Consolidation

**Status:** Repository implementation prepared; not deployed; scheduler disabled  
**Branch:** `news-intelligence-automation`  
**Base:** completed N4C.2 production validation

## 1. Goal

Replace the N3/N4 pilot-by-pilot execution path with one bounded, scheduler-ready NSE news orchestration while preserving the controls already validated in production:

- official NSE Corporate Announcements RSS as the single global feed fetch;
- exact held-equity identity matching only;
- deterministic parsing/category/importance/tone;
- immutable raw/source lineage;
- idempotent normalized news and source appearances;
- bounded normalization (100 matched items/run) and linked-document work (3 capture/extraction work items per run, at most 3 external document fetches);
- stored-PDF hash verification and deterministic text extraction;
- canonical ingestion-run/run-item accounting;
- no commercial-provider budget reservation for the unmetered official NSE source;
- no AI, OCR, recommendation or transaction/accounting mutation.

N5 does **not** enable a scheduler. Scheduler activation is a separate approval gate after one final owner-controlled dry run.

## 2. Consolidated flow

```text
owner dry run / later scheduler
→ validate source + current N5 policy
→ acquire service-only portfolio/source lease
→ load current open NSE-listed equities + exact identity evidence
→ one bounded NSE RSS GET
→ parse feed deterministically
→ exact-match announcements across all eligible held equities
→ DRY_RUN: inspect existing canonical/document identities, write audit accounting only, stop
→ RUN/SCHEDULED_RUN: reuse or persist hash-deduped raw feed capture
→ idempotently normalize news + source appearance
→ scan matched evidence for missing work; process at most 3 capture/extraction work items per run
→ store newly fetched documents by stable document SHA-256 path
→ for PDF only, verify hash and extract with pinned `unpdf@1.8.1`
→ persist bounded derived text record without mutating normalized news
→ update per-security NEWS refresh state through canonical result RPC
→ complete run and release lease
```

## 3. Why one global fetch

NSE Corporate Announcements is a global feed. N5 therefore performs one feed request for the portfolio run and filters locally to current holdings. It does not perform one news request per security. This is the scheduling model already recommended in N3C and materially reduces network work while keeping deterministic matching.

The shared feed request is accounted at the run level. Per-security run items record zero direct external attempts because the one feed request is shared by all securities. Linked-document requests are also reported at run scope, with metadata making that distinction explicit.

## 4. Security boundary

Manual `DRY_RUN` / future manual `RUN` require an authenticated PortfolioAI owner and portfolio ownership.

Future `SCHEDULED_RUN` additionally requires the dedicated `NEWS_PIPELINE_SCHEDULER_TOKEN` Edge secret and a policy with `scheduler_allowed=true`. N5 preparation keeps that policy flag false, so the scheduled action cannot run even if the function is deployed.

All canonical writes use the service-role client inside the Edge Function. Browser roles receive no new table/storage write privilege. The new lease table and lease RPCs are service-role only.

Official linked-document fetches retain N4C protections:

- HTTPS only;
- exact `nsearchives.nseindia.com` host;
- no credentials in URL;
- redirects rejected with `redirect: "manual"`;
- allow-listed PDF/XML content types;
- 5 MiB byte ceiling;
- bounded timeout.

## 5. Idempotency changes from the pilots

N5 removes run-ID identity from canonical automated evidence:

- RSS raw capture: `NSE:CORPORATE_ANNOUNCEMENTS:SHA256:<feed-hash>`
- linked document: `NSE:LINKED_DOCUMENT:<news-item-id>:<document-hash>`
- PDF text: `NSE:LINKED_DOCUMENT_TEXT:<capture-record-id>:unpdf@1.8.1:<document-hash>`

A partial unique index protects those new automated record kinds. Existing pilot records are not rewritten or re-keyed.

Normalized news continues to use the URL-derived canonical SHA-256 key and source appearances continue to use `(source_code, dedupe_key)` uniqueness. Existing normalized items only receive `last_seen_at`/`updated_at`; N5 does not silently rewrite prior deterministic classifications. An existing source appearance must still reference the expected canonical news item or the run fails safely with an explicit conflict.

Before any linked-document request, N5 searches both the new canonical document kind and the validated N4C.1 pilot kind. Existing captures are reused, which prevents repeat NSE document fetches during migration from pilot to automation. Existing N4C.2 extractions are likewise reused. Unchanged cached candidates do not consume the three-work-item budget, so later missing evidence can make forward progress on subsequent runs instead of being starved by the newest already-cached announcements.

## 6. Accounting contract

NSE is treated as an official unmetered source, exactly as N4C established:

- `provider_budget_reservations = 0`;
- no `reserve_provider_budget_v1` call;
- every orchestration still writes `data_ingestion_runs` and `data_ingestion_run_items`;
- live per-security results use `record_refresh_item_result_v1` so NEWS freshness remains canonical;
- one RSS request plus actual new linked-document GET attempts become `attempted_call_count` at run level;
- successful HTTP responses are separately represented by `fetched_count`;
- fatal failures finalize still-`PLANNED` run items as `FAILED` rather than leaving incomplete audit rows;
- linked-document failures can produce a `PARTIAL` run without pretending the shared feed ingestion failed.

A dry run is intentionally different: it writes only the run/run-item audit trail and does **not** call `record_refresh_item_result_v1`, because a no-mutation dry run must not mark NEWS freshness as updated.

## 7. Final dry-run contract

The prepared V6 NEWS policy follows N4C.2 policy V5 and allows only `DRY_RUN`:

- `dry_run_allowed = true`
- `manual_run_allowed = false`
- `scheduler_allowed = false`

One final production dry run, after explicit approval to deploy the preparation, should verify:

1. one and only one NSE RSS external fetch;
2. eligible holding count is plausible;
3. parsed/matched/unmatched/ambiguous counts are plausible;
4. HDFCBANK is deterministically matched when present in the live feed;
5. canonical-key lookup correctly reports existing vs planned-new items;
6. existing N4C/N4C.2 evidence is recognized and not re-fetched/re-extracted;
7. `normalizedNewsWrites = 0`;
8. `sourceRecordWrites = 0`;
9. `storageWrites = 0`;
10. `refreshStateMutation = false`;
11. scheduler remains disabled;
12. accounting shows exactly one shared feed attempt and zero provider budget reservations.

The dry run does not fetch linked documents. N4C.1 and N4C.2 have already separately validated the linked-document network/storage/extraction boundaries in production; N5 dry-run planning confirms which documents would be reused or captured without changing evidence.

## 8. Scheduler gate after dry-run reconciliation

Do not create a Cron job as part of this preparation.

After the dry run is reviewed, a separate approved change should:

1. introduce NEWS policy V7 with `scheduler_allowed=true` (and decide whether manual live runs remain allowed);
2. create/configure `NEWS_PIPELINE_SCHEDULER_TOKEN` as a Supabase Edge secret;
3. create one Supabase Cron HTTP invocation for the portfolio, initially every 30–60 minutes;
4. keep only one scheduler job;
5. monitor `data_ingestion_runs`, run items, lease behavior, and document-fetch counts on the first scheduled execution;
6. retain the ability to disable scheduling by policy without deleting cached news.

The scheduler request should use the normal Edge authorization header plus the dedicated scheduler token header. N5 deliberately does not commit `cron.schedule` SQL before approval.

## 9. Validation required before deployment approval

Repository validation target:

- existing NSE parser unit tests;
- N5 safety-contract tests;
- Edge lint;
- application TypeScript/ESLint/build regression checks;
- migration review for grants/RLS/unique-index compatibility;
- secret scan;
- branch diff review confirming no transaction/accounting/price/scoring/recommendation changes.

Production validation must remain untouched until explicit approval is given for the N5 migration/function deployment and final dry-run invocation.
