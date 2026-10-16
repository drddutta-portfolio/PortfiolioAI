# Results R3 — live Development completion audit (2026-10-16)

Environment: `PortfolioAI-Development`, Supabase Development `lrgpjimipfkyoqbpsqzz`.
Status: **NOT COMPLETE**. This report is a read-only evidence-based handoff, not a pass or a claim that collection was run successfully.

## Audited acceptance denominator
- 262 distinct non-superseded transaction-linked equities, including closed holdings.
- 240/262 have any four core-metric source-selected quarterly reporting dates after 2025-01-01, **not necessarily the four most recent fixed target periods**.
- **231/262** have all four fixed quarters **2025-09-30, 2025-12-31, 2026-03-31, 2026-06-30** with three selected core observations (revenue/NII, profit, diluted EPS), sharing an original source record within each quarter. This is the correct R3 recent-window denominator.
- **31/262** are incomplete against that fixed window: 9 have 3 quarters, 2 have 2, and 20 have none. Selected core metric presence does not prove publication/PIT qualification or every R4 evidence condition.
- Original publication dates for current quarter fundamentals remain unavailable: 0 non-null `published_at` among 8,615 core quarterly observation records as inspected. Do not invent publication timestamps.
- Do not infer success solely from source selections, provider capture rows, build pass or deployment READY.

## 31 unresolved symbols (fixed target quarter window)
Three selected same-filing quarters (9): BDL, COROMANDEL, DATAPATTNS, MGL, SANSERA, UNIONBANK, WELSPUNLIV, YATRA, ZAGGLE.

Two selected same-filing quarters (2): AVANTIFEED, VAML.

Zero selected same-filing quarters in target window (20): 360ONE, ABCAPITAL, ANGELONE, CGCL, CHOLAFIN, HDFCAMC, HUDCO, ICICIAMC, IREDA, JIOFIN, LTF, MFSL, MUTHOOTFIN, NAM-INDIA, PNBHOUSING, SHRIRAMFIN, STARHEALTH, TATACAP, TDPOWERSYS, UTIAMC.

## Operational issues independently observed
- The latest `RESULTS_QUARTERLY_SCAN` run began 2026-10-15T07:10:28Z, remains `RUNNING`: 262 requested, 48 processed, **214 PLANNED**, 47 UNCHANGED / HAVE_PARTIAL_QUARTERS and one REJECTED / NO_VERIFIED_SOURCE; no accepted observations.
- The previous 2026-10-14 scan finished PARTIAL, explicitly states full exchange discovery and PDF extraction NOT COMPLETE.
- Supabase Edge Function `results-quarterly-scan` is ACTIVE; it requires authenticated START/STEP and processes batches of at most 12. It does not itself provide an automatic worker for the outstanding 214 items.
- The GitHub `results-r3-original-filings-acquisition.yml` workflow supports manual dispatch; no `cron.job` matched results or quarterly. The R6 scheduled polling gate is separate; do not assert it is running.
- The source collector `scripts/results/r3-live-public-filing-batch.py` is designed to reuse existing selected observations before new NSE fetches, persist compact source manifests to Development R2 and qualified observations to Development Supabase.
- The vendor BseIndiaApi is present under `vendor/bseindiaapi`; its presence does not by itself prove an ingestion backfill has run.

## Executable closure sequence
1. Preserve 231 complete recent-window companies and existing R4 selected facts. Read back all 31 missing issuer/quarter/metric/source requirements; use existing R2 source manifests and SQL source records first, **without redownload**.
2. Recover the remaining 9 single-quarter gaps first, then 2 partial companies, then the 20 zero-quarter companies. Use issuer-origin NSE/BSE filings (including the vendored BseIndiaApi for discovery where useful), and allowed Trendlyne data only where exact quarter, issuer, scope, original publication and unit are independently provable.
3. For every admission, prove original source identity/hash, period start/end, scope, reporting units, selected same-filing revenue or bank NII / PAT / diluted EPS, appropriate historical share basis and any relevant historical identity mapping; preserve source evidence in Development R2 and compact projection in Supabase.
4. Independently read back `fundamental_observations` and `fundamental_observation_decisions` by symbol and all four fixed quarter end dates. A complete quarter requires 3 selected metrics from one defensible original statement.
5. Resolve the stale scan or record a valid explicit partial/failed terminal outcome; wire resumable execution and expose accurate scanner results in authenticated Results UI. Verify filters, 262 member visibility, and chart and evidence panel. Do not move incomplete stocks to strong/mixed/weak.
6. Run tests, Architecture Guard, deployment and live authenticated UI readback. R3 PASS requires **262/262 four-quarter source-backed coverage** unless owner explicitly approves a different denominator. R4/R5 analysis is separate; R6 scheduling is not proof of R3.

## Scope discipline
No changes to main / Production, V1-4 research scores, frozen baseline, or retroactively guessed observation dates. Never claim completion merely because 240 companies have *some* four quarters.

## Development execution implementation — 16 October 2026

Owner instruction: **All 31 missing equities are explicitly IN R3 scope**. ETFs are separate. Do not remove these equities from the Results table or from the 262 acceptance denominator.

Implementation committed to `PortfolioAI-Development`:
- `255ba82`: R3 original-filing collector counts ONLY already R4-selected same-source quarterly triplets as completed. Unselected original source facts are carried forward as reconciliation candidates, not completion. Banking coverage includes UNIONBANK and other verified bank symbols.
- `7615258`: focused same-source triplet and banking-contract regression cases added to existing collector test suite.
- `76d27ef`: new Development-only `scripts/results/r3-current-coverage-readback.py` independently enumerates transaction-derived equities, excludes ETFs, identifies exact missing September/December 2025 and March/June 2026 quarters, and emits explicit `INCOMPLETE` until 262/262 qualify.
- `a5a556b` and `2348b9c`: Development `.github/workflows/results-r3-original-filings-acquisition.yml` now responds to scoped Development pushes. After collection it invokes existing R4 immutable Cloudflare R2 source verification/selection, emits coverage JSON artifact, and enforces a fail-closed 262-equity completion check even after partial source failures.

**Verified execution result at update:** code commits were accepted by GitHub; the Development Vercel commit status was successful. **Neither a successful GitHub Actions source-backfill execution nor new 262/262 database coverage has been independently verified.** The latest queried Supabase R3 scan remained RUNNING with 214 planned items and 0 newly accepted observations. No evidence-backed basis exists to mark the 31 complete. No main or Production changes.

The collector continues using pre-existing selected facts, bounded verified original issuer-source data and compact Dev R2 storage. Missing documentation, source conflicts, historical share-basis issues or unproven source units must remain review-pending. A green frontend deployment is NOT evidence of financial data completeness.

## October 16 continuation — 233/262 and BSE-first Development recovery

Verified selected-core coverage in the locked September/December 2025 and March/June 2026 window is **233/262**, with **29 incomplete**.

- 3 selected quarters (7): BDL, COROMANDEL, DATAPATTNS, MGL, WELSPUNLIV, YATRA, ZAGGLE.
- 2 selected quarters (2): AVANTIFEED, VAML.
- No selected complete core triplet in the target window (20): 360ONE, ABCAPITAL, ANGELONE, CGCL, CHOLAFIN, HDFCAMC, HUDCO, ICICIAMC, IREDA, JIOFIN, LTF, MFSL, MUTHOOTFIN, NAM-INDIA, PNBHOUSING, SHRIRAMFIN, STARHEALTH, TATACAP, TDPOWERSYS, UTIAMC.

SANSERA and UNIONBANK are no longer incomplete; no unverified attribution is made to the new BSE workflow.

Original issuer filings for several shortfalls disagree in EPS/PAT, including AVANTIFEED 2025-12 consolidated EPS 10.96 vs 12.00, BDL 2025-09 minor PAT discrepancy, COROMANDEL scale conflict, DATAPATTNS zero vs 24.71 EPS, and MGL/WELSPUNLIV/YATRA/ZAGGLE source-version discrepancies. R4 must remain fail-closed and not choose a newest-version winner without a certified correction.

Development implementation commits:
- a08861d: BSEIndiaApi v3.3.3 BSE-first compact results enrichment for only incomplete equities, exact scrip+ISIN, period/date-linked issuer, compact INR-crore revenue/PAT only as REVIEW-PENDING; no guessed diluted EPS, scope, publication time or canonical selection.
- 5139304: focused BSE source/period/EPS/conflict protection tests.
- 543244f: BSE-first stage connected ahead of existing issuer/NSE acquisition in Development workflow; BSE failure cannot suppress issuer fallback.
- b8bb348: satisfy mandatory observation freshness field in optional review-only secondary-source write.
All changes stay in PortfolioAI-Development and do not alter V1-4 investment scoring or main.

Runtime verification: read-only BSE resultsSnapshot request from the Development Supabase backend returned HTTP 403 Access Denied (pg_net request 614); there was no successful source acquisition by that request. Do not bypass the access denial. The new Python GitHub Actions BSE collector has no independently verified successful execution/readback yet, and it must not be reported as executed solely on Vercel READY.

Previously unfinished Results quarterly scan now has terminal PARTIAL status, completed 2026-10-16T04:04:08.936Z: 262/262 items processed, 14 not qualified, zero newly accepted observations. Finishing a visit is not equal to acquiring new financial quarters.

**R3 remains NOT COMPLETE.** Require 262/262 genuine selected four-quarter original-filing readback (or an explicit owner-approved contract change). Preserve conflicts/unavailable quarters honestly.

## October 16 independent Cloudflare R2 source-inventory audit

Directly listed original object keys in `portfolioai-history-dev` under `portfolioai-results/development/v1/quarterly/security_id=<ISIN>/` for **all 20 zero-qualified-core companies**. Results: **0 R2 objects with period_end in the four required 2025-09, 2025-12, 2026-03, 2026-06 dates** for every one of those 20. There are some older R2 records for 360ONE (March 2025), ABCAPITAL/JIOFIN/LTF/MFSL/MUTHOOTFIN/PNBHOUSING/UTIAMC (September/December 2024), HDFCAMC and NAM-INDIA (September/December 2024, March 2025); no objects at all for several others. Direct Cloudflare list calls succeeded. Supabase data_source_records independently corroborate no required-period original source records for these companies; TDPOWERSYS has only four BSE review-only, non-original summary observations.

This rules out "just replaying R2" as a solution for those 20. Actual original financial documents must be acquired and their source identity, quarter, units, scope, EPS and publication eligibility independently verified, without making up values or selecting conflicting numbers.

Last measured complete quarterly cohort remains **233/262**, leaving 29 companies and 91 quarter slots. Code deploy status and successful cache scans are not evidence of source acquisition. Original conflicts among seven single-quarter companies also remain unadmitted; financial denominators must not be auto-inferred.

**No R3 PASS claimed.** The owner requested clearing all blockers; without successful authorized original acquisition and qualification, the fail-closed result stays incomplete. Work is isolated to Development.
