> **ACTIVE UPDATE — Owner decision 15 Oct 2026:** Superseding the earlier read-only inventory and original collection scope below, R3/R4 must collect and qualify exactly **eight financial periods** for each eligible equity of the **262 current/closed portfolio securities**, while the dashboard continues displaying **only four latest selected quarters**. The other four periods are the same-quarter previous-year counterparts used for verified YoY, not visible matrix columns. Reuse source data first; store permitted bulky sources in Cloudflare R2 and compact qualified metrics in Supabase. Explicitly classify prelisting, nonexistent and unqualified history; never manufacture 2,096 slots. New operating acceptance is defined in [PortfolioAI_RESULTS_262_EQUITY_EIGHT_QUARTER_PLAN_AMENDMENT_2026-10-15.md](PortfolioAI_RESULTS_262_EQUITY_EIGHT_QUARTER_PLAN_AMENDMENT_2026-10-15.md). This updates requirements only; cron/provider acquisition and historical backfill are not thereby executed.

# PortfolioAI Results — Existing Data Reuse, R2 Storage and Daily Collection Contract
**Date:** 2026-10-13 | **Status:** Planning/read-only inventory, not a deployed Results pipeline.  
**Scope:** Development `lrgpjimipfkyoqbpsqzz`; Cloudflare bucket `portfolioai-history-dev`. Subordinate to AGENTS.md, canonical architecture and Results implementation plan.

## Live read-only inventory (2026-10-13)
Direct Supabase read-only SQL and Cloudflare R2 GET performed; **no mutation**:
- Database size via `pg_database_size(current_database())`: **217 MB** (not evidence of plan quota, available headroom, WAL/backup costs or capacity approval).
- `data_source_records`: 7,655 approximate table-inventory rows; **1,683 exact records where source_code='TRENDLYNE_MCP'**. Meaningful record groups: `COMPLETE_RESEARCH_STRUCTURED_METRICS` 236, `P8_B4_4_FUNDAMENTALS` 236, `P8_B4_4_DOCUMENTS` 236, `COMPLETE_RESEARCH_DOCUMENT_SEARCH` 225, `COMPLETE_RESEARCH_OVERVIEW` 164, `FUNDAMENTAL_SNAPSHOT` 25, `V1_4_BANK_VALUATION_HISTORY_FUNDAMENTALS_CAPTURE` 13. Some categories have nested provider `result` JSON and may be recoverable without more calls. Counts are capture records, **not quarters, stocks fully covered, or approved current observations**.
- `fundamental_observations`: `REVENUE_TTM` 157, `NET_PROFIT_TTM` 157 (both **zero explicit period_end**); `EPS_GROWTH_YOY` 94 QUARTER (zero explicit period_end); `OPERATING_REVENUE_QUARTER` 8 (all 8 period_end populated); `OPERATING_PROFIT_QUARTER` 6 (all 6 dated). These are observation rows, not distinct covered stock/quarter counts; multiple source/versions possible.
- `research_documents`: **19 exact `QUARTERLY_RESULT` rows**, none with `reporting_period_end` populated. Document identity/source links may still be reusable; period recovery must be source-proven.
- `research_evidence_snapshot_items` 34,505 and `research_evidence_snapshots` 2,194 approximate inventory rows: **do not conflate evidence requirement/status records with usable quarterly financial values**.
- Existing market history and portfolio data contracts provide separate authority for prices and holdings.
- Cloudflare GET confirms existing R2 bucket `portfolioai-history-dev`. The **first 1,000 listed objects** include 803 P8-B3, 192 P8-B2, four Dev backup objects and one Angel One capture. The response is paginated/truncated; a complete inventory was **not** performed. **No Results archive confirmed** on this partial listing. Do not interpret it as proof of absence.
- Existing `data_sources` row comment says Trendlyne entitlement/retention verification is required; historic captures and implementation evidence exist, but cannot replace current live entitlement/legal checks.
- The source JSONB `raw_payload` in Supabase itself may be storage-costly. **Do not delete or relocate historic authoritative rows** without an approved, audit-safe migration/retention contract; new bulky Results payloads default to R2.

## Reuse-first discovery algorithm (read-only initial audit)
1. Derive eligible unique equity universe using canonical transaction-derived holdings, including sold-out equities, canonical security identities and corporate action/name changes. Do not assume fixed 248/239 counts.
2. Inspect existing capture payload schemas, provenance and provider contract: especially `COMPLETE_RESEARCH_STRUCTURED_METRICS`, `P8_B4_4_FUNDAMENTALS`, `COMPLETE_RESEARCH_DOCUMENT_SEARCH`, banking originals and `research_document_sources`.
3. Extract candidate periods/metrics into an **in-memory or isolated dry-run** map: security_id × period_start/end × source/version × standalone/consolidated × metric. Maintain exact source IDs; never overwrite original captures.
4. Validate units, currency, accounting scope, fiscal year, quarter, publication/known availability, source version and comparable quarter boundaries. Distinguish document discovery vs factual admissibility.
5. Emit per-security/period/metric coverage report: AVAILABLE, PARTIAL, MISSING, INVALID, CONFLICTING; include method, source ID and reason. Explicitly separate `available for display` and `validated for advanced scoring`.
6. Obtain explicit approval and quota/retention proof before new Trendlyne MCP campaigns. Only target demonstrated gaps; original NSE/BSE/issuer disclosures remain reference/verification and possible permitted fallback.
7. Never fabricate missing dates or values; never map current TTM to reported quarter or annual sum to audited annual without approved reconciliation.

## Storage design — Supabase is intentionally small
**Supabase:** preserve existing canonical financial authorities. Store only a *small*, indexed Results discovery/catalog/projection if necessary: stable security ID, period dates/type, report basis, filing/document/source/version identifiers, R2 object key and SHA-256, compact display-ready metrics, latest job state, update timestamps, permissions and selected lineage. Do not add copycat authoritative fundamental tables or duplicate raw source JSONB.

**Cloudflare R2:** large source documents (subject to terms), full financial statements, versioned normalized snapshots, historical series, extraction/debug artifacts, manifests and bounded verbose job logs. Reuse the `portfolioai-history-dev` bucket only after validating permissions/backup and scoped prefix. Proposed prefix, *not yet created*: `portfolioai-results/development/v1/quarterly/security_id=<canonical-id>/period_end=YYYY-MM-DD/source_version=<hash>/` with immutable `manifest.json` plus financial object/source pointers. Annual gets a sibling prefix after future authorization. Stable security IDs prevent symbol-change breakage.
- Publisher: write immutable R2 blobs, validate readback and hashes, then publish a small authoritative catalog reference through an approved transaction/selection flow. Retry safely for partially completed writes; catalog must never claim a missing blob.
- Retrieval: secured server-side API for R2, filtered/paginated matrix from compact indexed summary, detail objects fetched lazily with cache and ETags. Never expose R2 secrets or use list-all-object requests for page loads.
- Verify bucket lifetime/storage quotas, object operations, retention/caching budgets, R2 terms, encryption/security, Supabase database headroom, backups and disaster recovery before implementation.
- **No migration applies without separate explicit owner approval**. No rewrite/removal of 7,655 existing source rows for convenience.

## Daily collection / cron job — specification, not deployed
**Business timezone:** `Asia/Kolkata`, every day at **07:00 IST**. This corresponds to **01:30 UTC** year-round (India does not observe DST). For a UTC-only scheduler, candidate cron expression is `30 1 * * *`. If using a timezone-aware scheduler, prefer `0 7 * * *` with `Asia/Kolkata` explicitly configured. **Do not schedule both.**

Scheduler technology to be selected during R6 after inspecting the existing production-compatible scheduler (Supabase pg_cron, external scheduler/Vercel/Cloudflare trigger). Prefer one authorized, observable scheduler, not browser-dependent polling, and avoid duplicating existing provider jobs. Cron is NOT ACTIVE merely because this plan specifies it.

**Run contract:**
1. Acquire service-only distributed lease, record run_id, source cutoff, last successful cursor and actual start time; guard against manual/scheduled overlap.
2. Reconcile open+closed equity universe and new identities. Discover new/amended quarterly filings since safe cursor with bounded lookback for late publications; distinguish source publication from PortfolioAI retrieval.
3. Inspect hashes/IDs and cached historical sources first; limit provider calls by verified entitlements, budget, cooldown, backoff and concurrency. Do not redownload every known quarter daily.
4. Validate original identity, period, consolidated/standalone basis, units, numeric integrity, source version, evidence availability and conflicts. Quarantine invalid/revised evidence for deterministic reconciliation; do not turn a missing field into zero.
5. Commit immutable or versioned R2 evidence, verify readback/hash, then publish small catalog/summary selections via canonical write path, preserving superseded originals and audit trail.
6. Refresh derived QoQ/YoY/industry metrics only when actual compatible inputs change; update changed matrix cells. An announced result can show 'Reported, analysis pending' while complex scoring remains blocked.
7. Persist job counts **actually observed**: universe checked, listings checked, attempted/successful provider requests, new/revised/unchanged/failed source items, validations, R2 writes, catalog projections, retries and duration. Report last successful completed scan separately from partial/failed scan.
8. Release lease on normal and failure paths; use idempotent replay/retry and alerting for overdue/failing jobs. A 7 AM-only scan can miss filings issued later that day until next morning; UI states this explicitly.
9. Manual **Run Scan Now** invokes the same authenticated service-only routine and respects the same quotas and idempotency.
10. Quality gates: observed scheduler invocation; no-change run with zero duplicate catalog rows; newly published source; revised result preserved; provider outage/partial failure; malformed payload quarantine; R2 write/read failure recovery; fixed sample of dated metrics; readback status reflects source records. Never claim a scan succeeded solely because HTTP 200 occurred.

## Cross-page and future Annual Results
The new Results page is a presentation of canonical portfolio/accounting, financial and research facts. No independent NAV/P&L, security taxonomy, recommendation logic or quote cache. Source-backed financial values may be shown without implying V1-4 READY; research-scoring activation has separate constraints. Annual Results is postponed, with schema and R2 naming extensible and audit-safe.
