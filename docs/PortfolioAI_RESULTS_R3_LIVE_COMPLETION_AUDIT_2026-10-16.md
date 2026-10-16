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
