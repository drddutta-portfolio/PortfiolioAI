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

## R3 NBFC original-source recovery and verified readback — 16 October 2026

**Independent readback: 247/262 equities** have all four locked 2025-09/2025-12/2026-03/2026-06 original-source selected financial triplets. **15 equities unresolved**. At start of recovery, same gate counted 233/262 (29 missing). Thus 14 more completed equities are verified in Development, without loosening R4 requirements.

**Source acquisition and selection:** at least 67 new primary official NSE iXBRL `RESULTS_QUARTERLY_NSE_DISCOVERY_V1` source-record entries were observed after 2026-10-16 04:45Z; immutable source manifests were written under `portfolioai-results/development/v1/quarterly/` in Dev R2. Separate R4 source-verification/selection generated new `fundamental_observation_decisions` with `decided_at` around 04:54–04:57Z. Only R4-selected four-quarter companies are counted. The initial code could not ingest NBFC-IndAS originals. Commit a7d885a added the strict NBFC source format and single-quarter revenue, PAT, diluted EPS parser; d524423 adds regression tests. Commit 5be0b54 adds independent original NSE archive seed hints and catalog fallback with permission-respecting access handling, and 56c906f excludes unqualified secondary-source observations and superseded member rows from reuse eligibility.

**Safeguarded Dev verifier:** commit 3591a2e introduced `.github/workflows/results-r3-verify-and-readback.yml`: Development-only R2 hash and original-filing verification, conflict-protecting atomic source selection and strict 262/262 cohort readback.

**Historical split identity fixes:** ANGELONE `INE732I01013` to `INE732I01021`, 10:1 split effective 2026-02-26 (BSE DR-829/2025-2026); TDPOWERSYS `INE419M01027` to `INE419M01035`, 2:1 split effective 2026-08-24 (official NSE/CML/75855 dated 2026-08-20 and BSE DR-700/2026-2027). Both are explicit pre-split source-identity links with originally reported EPS retained and no adjusted historical EPS fabricated. Applied to both original-source collector and R4 verifier and tested. Official NSE TDPOWERSYS original URLs discovered for Dec-2025 and Jun-2026 and added as explicit seed hints (04ea6b0).

**Remaining 15:**
- 3/4 each, missing one: 360ONE (2025-09), BDL (2025-09), COROMANDEL (2026-03), DATAPATTNS (2026-03), ICICIAMC (2025-09), JIOFIN (2025-09), MGL (2026-03), WELSPUNLIV (2025-12), YATRA (2026-03), ZAGGLE (2026-03).
- 2/4 each, missing two: ANGELONE (2025-09 & 2025-12), AVANTIFEED (2025-09 & 2025-12), VAML (2025-09 & 2025-12).
- 0/4: STARHEALTH and TDPOWERSYS as of the latest selected readback.

Prior conflicting originals in seven gaps must not be force-selected. STARHEALTH is a general insurer with a different exchange original statement and premium/PAT metrics; using ordinary operating revenue and diluted EPS requires separately evidenced, industry-appropriate metric admission and cannot be assumed. TDPOWERSYS original ISIN mismatch is now narrowly bridged, but its new source selection has not yet been independently verified.

**Status: R3 still INCOMPLETE** despite substantial progress. UI requires refresh after final source readback and must not be claimed 262/262 until all companies satisfy genuine R4 selection. No Production/main/V1-4 canonical research changes.

## Split-targeted R3 verification — 249/262 confirmed

After the protected ANGELONE and TDPOWERSYS repair, independent Supabase Development readback shows **249 of 262 equities** have the four source-selected same-filing 2025-09/2025-12/2026-03/2026-06 Revenue (or bank NII), PAT, diluted EPS triplets, up 16 companies from 233/262 at the beginning of this recovery. These are selected original-source facts, not merely acquired source documents. **13 companies and 18 exact company-quarter slots remain unqualified.**

The targeted Development-only GitHub workflow `.github/workflows/results-r3-targeted-split-recovery.yml` (commit 1e8320c) acquired and ran R4 for ANGELONE and TDPOWERSYS. R4 `fundamental_observation_decisions` showed all four quarters selected for both companies at 2026-10-16T05:06:28Z. ANGELONE September and December 2025 original consolidated statements were acquired with proven pre-split ISIN `INE732I01013`, current ISIN `INE732I01021`, and original diluted EPS retained (22.71 and 28.79 respectively); no share-price rebasing or EPS adjustment took place. TDPOWERSYS had all four original quarters selected using historical ISIN `INE419M01027`, current `INE419M01035`, under NSE/CML/75855.

The 13 remaining exceptions in the locked four quarter scope, as of this readback:
- Single missing Sep 2025: 360ONE, BDL, ICICIAMC, JIOFIN.
- Single missing Mar 2026: COROMANDEL, DATAPATTNS, MGL, YATRA, ZAGGLE.
- Single missing Dec 2025: WELSPUNLIV.
- Two missing Sep/Dec 2025: AVANTIFEED, VAML.
- Four missing Sep/Dec 2025 & Mar/Jun 2026: STARHEALTH (insurer-specific general-insurance financial statement format, not ordinary revenue/PAT/EPS).
All original issuer revision conflicts and publication uncertainty must remain explicit; older or other-scope/other-quarter records are not substitutions. Neither UI nor final acceptance may claim 262/262 before the gate passes. Production/main unchanged.

## Continued R3 closure work — Development, 16 October 2026

Status from current selected-evidence SQL readback: **249 / 262**, with 13 incompletely qualified equities. No further 262/262 claim. This is the same protected 249 accepted cohort as the previous readback. The remaining fixed-window period gaps are ten one-quarter cases (360ONE, BDL, COROMANDEL, DATAPATTNS, ICICIAMC, JIOFIN, MGL, WELSPUNLIV, YATRA, ZAGGLE), two two-quarter cases (AVANTIFEED, VAML), and four-quarter insurer STARHEALTH: total **18 missing company-quarter slots**.

New source work on Development (no main/Production):
- GI original-source support in the R3 collector: exact official NSE General Insurance iXBRL identity / statement scope / first 3-month date, net premium earned (NOT gross premiums or ordinary corporate operating revenue), PAT and diluted EPS. Rejects non-GI issuer and ambiguous accounting statements; refuses YTD substitution.
- `NET_PREMIUM_EARNED_QUARTER` metric definition added to Development Supabase, marked insurer/results-only with no V1-4 scoring impact. R4 source admission, source inventory and UI coverage contract extended for STARHEALTH specifically; existing noninsurance metrics and bank contracts left intact.
- Separate `.github/workflows/results-r3-starhealth-gi-recovery.yml` targeted original GI acquisition, qualified selection and independent whole-portfolio readback; tests include positive same-filing GI contract and negative gross-premium relabel.
- Original NSE integrated catalog source collection now uses maximum four bounded 100-item pages to search older Sep/Dec 2025 originals without repeating the same source. `.github/workflows/results-r3-targeted-remaining-12.yml` narrows acquisition to the 12 non-insurer exceptions; R4 verifier remains fail-closed on inconsistent source versions.
- Current database readback still has no `NET_PREMIUM_EARNED_QUARTER` observations, and neither workflow can be asserted successfully executed without its authenticated GitHub Actions run artifact. A committed action definition does not equal a successful backfill.

Eligibility distinction: ICICIAMC first traded on 19 Dec 2025 (Prudential issuer press release), so its Sep-2025 financial quarter, if admitted, needs documented prelisting prospectus/issuer original and the correct historical share basis; do not fabricate NSE listed-company financial filing. VAML began operation as separated listed-entity after Vedanta scheme's 1 May 2026 effective date; its Sep/Dec 2025 history needs authentic predecessor/recast legal-entity evidence, and may be genuinely noncomparable. These are not normal unstructured-filing failures.

Original-source conflicts are not waived: BDL PAT ~0.0002 Cr; COROMANDEL first-generation and later original figures 100x apart on same date; AVANTIFEED original consolidated EPS differs; DATAPATTNS March EPS zero vs 24.71; MGL, WELSPUNLIV, YATRA, ZAGGLE reported-value differences. A later upload timestamp alone does not supply a verified correction. Existing 249 selections must not be replaced to artificially improve coverage.

Deployment blocker newly observed: latest relevant GitHub commit statuses point to Vercel build-rate limit (`upgradeToPro=build-rate-limit`), rather than a READY updated Results UI deployment. Do not claim the new insurer UI changes are live. Existing UI may still display previous coverage. Check Vercel only after the account's build-rate restriction clears; no Production deployment.

## October 16 R3 active-run audit — last checked around 07:20 UTC

Developer/operator instruction: all 18 missing slots should be sourced afresh and submitted to immutable Dev R2/R4 source selection, while protecting existing 249 accepted equities and Production/main.

**Identified and fixed actual automation blocker:** official GitHub Actions run [38865530059](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38865530059) stopped at `test_general_insurer_gi_original_first_quarter_contract`; precise assertion was `INSURANCE_SCOPE_UNPROVEN` because the STARHEALTH parser uppercased in-table scope but not general-information scope. Fixed in commit `9786e2f4`. R3 collection run [38865790594](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38865790594) subsequently passed all parser tests, BSE-first review stage and bounded NSE acquisition stage; the run still failed its strict final coverage gate. No fake 262/262 closure.

**Second STARHEALTH discovery blocker:** fixed real `INTEGRATED_FILING_GI_` hostname-validated filename matching in commit `65edd3f7`, previously only `GI_` was supported. Official NSE general insurance xBRL uses separate templates. The STARHEALTH targeted workflow at [38866181477](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38866181477) PASSed tests and completed with terminal status `success`, but its logged acquisition JSON explicitly says `NO_QUALIFIED_LISTING_URL`, `with_documents:0`, `universe_target:1`, `visited:1`. This means its successful run did **not** fetch any accepted quarters. Issuer-original quarterly PDFs exist publicly, including Sep 2025 at `https://nsearchives.nseindia.com/corporate/STARHEALTH_28102025184231_Integratedresults28102025.pdf` but this collector does not yet parse/retain that PDF type. The GitHub output must not be reinterpreted as company completion.

**Third run:** [38865945619](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38865945619) runs the narrowly scoped 12-issuer NSE original source collector and issuer evidence verifier. It was still `in_progress` at last inspection, at the acquisition stage. The preceding failures were from the same unit test, now fixed; do not assume this run will qualify missing quarters without a source-verification and Supabase readback.

**Source reconciliation:** 8 original same-scope conflicts remain fail-closed. Public corroboration confirms COROMANDEL March 2026 revenue ₹6,003.66 crore and DATAPATTNS March 2026 EPS ₹24.71 but this does not constitute issuer-filed amendment proof sufficient to discard conflicting stored originals. Keep originals and select only qualified source/version. BDL is only 0.0002 crore variation, but no generic "choose latest" or approximate equality exception was applied.

**Last DB acceptance:** 249/262 exactly selected, 13 incomplete and 18 missing quarter slots. No new `RESULTS_QUARTERLY_NSE_DISCOVERY_V1` original records after 2026-10-16T07:10Z in the last SQL check. Production unchanged. No R3 PASS.

## Live Trendlyne MCP R3 evidence trial — 16 October 2026

Owner instructed using Trendlyne calls directly for the 18 remaining company-quarter slots. **The authenticated Development provider path now works.** Supabase R3 results-only token was created in Vault via migration `results_r3_trendlyne_bounded_internal_token` (no token values disclosed). The existing Development Edge Function `discover-trendlyne-observed-contract` was extended **without removing or changing its existing action** with a separate, server-authorized action `R3_TRENDLYNE_GAP_CAPTURE` (deployed function version 11). It uses the configured `TRENDLYNE_MCP_URL`, verifies a dedicated R3 internal token with an RPC, confirms portfolio-linked equity membership, checks provider entitlement and enabled ingestion policy, reserves provider budget, logs tool usage, settles the reservation, and stores only noncanonical review evidence.

The supplemental action is present in the GitHub `PortfolioAI-Development` source file `supabase/functions/discover-trendlyne-observed-contract/index.ts`, commit `62c1bc5`; the existing user-authenticated contract-discovery flow remains intact. A separate new function was initially attempted but **blocked by the Supabase Edge Function plan count**; no separate new Edge Function was created.

**Verified live Trendlyne executions:** two authenticated, provider-billed tool attempts for each of the exact 13 incomplete equities: `360ONE`, `AVANTIFEED`, `BDL`, `COROMANDEL`, `DATAPATTNS`, `ICICIAMC`, `JIOFIN`, `MGL`, `STARHEALTH`, `VAML`, `WELSPUNLIV`, `YATRA`, `ZAGGLE`. One `get_parameter_values_multi_stock` financial-metric request and one `get_document_search_results` original-source-discovery request per company = **26 provider calls / 26 successful provider responses / 26 Supabase review captures**. All requests returned HTTP 200 with usage accounting successful and provider capture hashes. The first COROMANDEL metric request had 10,556 returned characters and job `93815245-e6ef-4b5f-a10a-0306847c476c`. The raw captures were inserted as `data_source_records` with `source_code='TRENDLYNE_MCP'`, `record_kind='RESULTS_R3_TRENDLYNE_GAP_CAPTURE_V1'` and `review_only:true`. A descriptive per-call run and usage ledger was created. No legacy Trendlyne research/canonical selection was mutated.

**Factual limitation:** Trendlyne's metric output commonly labels figures as `Diluted EPS Qtr`, `Operating Rev. 7Q ago`, `EPS Adj. 1Q Ago`, and so on. These labels do not by themselves establish that the source records refer to exact historical dates, company filing scope, or originally filed share basis. Its document-search output often returns recent unrelated search hits, IPO filings, annual reports and latest quarterly documents, rather than exact missing 2025/2026 originals. Some targets have relevant provider result records: COROMANDEL July 2026, MGL July 2026, ICICIAMC October 2026, 360ONE October 2026 and JIOFIN October 2026. Treat these as **discovery and independent corroboration**, not automatic resolution of earlier quarter conflicts.

**Acceptance:** Provider calls do NOT close R3 slots by themselves. Every one of the 18 outstanding company-quarter slots still requires original issuer or exchange quarterly reporting period, scope, revenue/net premium/NII, profit, diluted EPS, and a source-selection decision that passes the immutable R4 contract. Trendlyne-only evidence has zero authorized canonical promotions, zero new qualified quarter selections and zero changes to V1-4 research. The independent 262-equity readback must remain INCOMPLETE until original sources are reconciled. Production/main unchanged.

**Next source use:** Filter the 26 captured provider outputs for exact issuer result documents and relevant 2025/2026 quarter dates, then acquire official originals separately (issuer/BSE/NSE). Reconcile the eight conflicting core-metric cases against original and any amended filings. Do not infer historical quarter-end dates from relative provider labels or from retrieval time.
