# PortfolioAI Results R4 — Owner-directed resumption with R3 deferred

**Date:** 16 October 2026
**Environment:** `PortfolioAI-Development` / Dev Supabase `lrgpjimipfkyoqbpsqzz` / Dev Cloudflare R2 `portfolioai-history-dev`
**Status:** R4 IMPLEMENTATION AND LIVE SOURCE-VALIDATION JOB STARTED; full R4 source/eligibility PASS not claimed.

## Controlling owner decision

The owner explicitly instructed: "**Leave R3 as of now, proceed to R4.**" Freeze R3 acquisition and remediation: do **not** require the last 13 companies / 18 current-quarter slots to be resolved before continuing source verification, status classification, comparison availability and reproducible R4 audits. Do not describe R3 as PASS or erase its exception list. The 26 Trendlyne MCP captures are stored as **review-only evidence**, not authority for canonical original-source selection.

The owner-approved eight-quarter scope in `PortfolioAI_RESULTS_262_EQUITY_EIGHT_QUARTER_PLAN_AMENDMENT_2026-10-15.md` remains controlling: 262 transaction-linked open and closed equities, 4 displayed quarters (2025 Sep/Dec, 2026 Mar/Jun), 4 prior-year baselines (2024 Sep/Dec, 2025 Mar/Jun). Do not add columns to the Results UI. Historical changes require same original-filing, metric, scope, identity, declared units and admissible source manifest.

## Independently measured Development baseline (16 October)

| Period end | Window | 262-company slots with qualified, same-filing, same-scope selected core financial facts | Not qualified |
|---|---|---:|---:|
| 2024-09-30 | Historical YoY | 160 | 102 |
| 2024-12-31 | Historical YoY | 163 | 99 |
| 2025-03-31 | Historical YoY | 220 | 42 |
| 2025-06-30 | Historical YoY | 229 | 33 |
| 2025-09-30 | Displayed | 255 | 7 |
| 2025-12-31 | Displayed | 258 | 4 |
| 2026-03-31 | Displayed | 256 | 6 |
| 2026-06-30 | Displayed | 261 | 1 |
| **Total** | 8 periods | **1,802 / 2,096** | **294** |

**249/262** current-display equities have all four qualified quarterly trios. The count is **not** 262 complete. An earlier simple metric count was independently cross-checked against the stronger same-source same-scope qualification and agrees with the period counts listed here.

Potential available YoY baseline pair count (both original source-selected metric trios, BEFORE full currency/share-basis/publication comparability): Sep-2025 **159**, Dec-2025 **162**, Mar-2026 **215**, Jun-2026 **229**. With explicit pre-split EPS guards removed, the corresponding **candidate** pairs are 156, 159, 210, 224. **These are not approved comparison values or publishable YoY percentages.**

294 unresolved slots require status categories, not forced zeros, substitutions or invented histories. Particularly, missing prelisting/demerger quarters must not be auto-declared NOT_APPLICABLE without verified issuer chronology.

## R4 work started

- Added `scripts/results/r4-eight-quarter-readback.py`, an independent read-only 262×8 reconciliation that demands matching issuer-original selections, reporting period, currency, original numeric units, one source and one scope, with separate bank-NII and insurer-net-premium contracts. Statuses `QUALIFIED`, `PARTIAL_SELECTED`, `CONFLICT`, `REVIEW_REQUIRED` and `MISSING` are evidence-derived. Unknown non-applicability remains unknown.
- Added `scripts/results/test_r4_eight_quarter_readback.py` covering 8-quarter matrix, source/scope/unit mixing, insurer metrics, conflicting reported values, unavailable pre-listing and split EPS guards.
- Added explicit Development-only `RESULTS_R4_EIGHT_QUARTER_SELECTION=1` option to existing immutable R2 original-source verifier `scripts/results/r4-verify-quarterly.py`, without changing the original four-quarter mode or older isolated comparison modes.
- Added `.github/workflows/results-r4-eight-quarter-qualification.yml`, with Development-only DB/R2 guards, deterministic R4 tests, original R2 source-verification, protected `fundamental_observation_decisions` selection, read-only 262×8 acceptance classification and retained artifact. Original issuer source collection is **not** part of this job and no R3 acquisition is resumed.
- Initiated live GitHub Actions run **[38869795361](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38869795361)**; early run steps passed isolation, installation and both R4 deterministic regression suites. Final immutable-R2 readback/exception artifact must be independently verified before asserting live execution PASS.

## Boundaries and acceptance

- Historical issuer source alone is insufficient for point-in-time trading decisions: original filing publication precision, amended versions, old/new ISIN, accounting scope and EPS share basis require separate proof.
- R4 may deliver verified partial history and company/quarter-specific reasons while R3 remains deferred. Full R4 **is not PASS** until all eight-quarter slots are either qualified or are justified as unavailable / inapplicable by issuer-specific documented evidence and the protected selection gate has no regressions.
- R5/A-I insight classifications and V1-4 investment-readiness scores are separate; no silent score modifications.
- No UI redesign, extra result columns, Production/main writes, or artificial completion counts.

This record freezes the actual latest measured state and stage transition. Subsequent jobs must append their observed run IDs, invalid manifest reasons, selection conflicts, new decisions and post-run database source readback before closing R4.

## Independently verified live R4 run — 16 October 2026, 07:52 UTC

**GitHub Actions:** [R4 eight-quarter source qualification, run 38869795361](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38869795361), conclusion **SUCCESS**. [Source-verification and exact exception artifact](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38869795361/artifacts/12033305886) was retained (artifact ID `12033305886`).

**Regressions:** 10 existing source-validator tests passed; 9 new eight-quarter classification tests passed. Dev DB/R2 credentials/environment guards passed. Immutable R2 verification and independent 262×8 readback passed mechanically. The partial-data result is *not* a full R4 financial-coverage PASS.

**Verifier:** `target_quarter_count=8`, 10,828 candidate source-observation rows, 3,594 compact R2 source manifests read/checked, 10,819 qualified fact rows, 5,459 candidate selections across 1,802 stock-quarters, 261 companies with at least one selected candidate, and **136/262 with all eight quarters**. **0 inserted selections, 5,459 existing selections unchanged and 0 conflicting protected selection decisions**. The 8-quarter selector observed 10 same-scope issuer conflicts; isolated/source-related exceptions include 2 no-complete-single-source and 6 BSE original-issuer-quarter contract rejections. Original publication timestamp remained generally UNKNOWN. No R3 acquisition was resumed.

**Independent readback** produced `status=PARTIAL`, `262 equities`, `2096 slots`, `1802 QUALIFIED`, `10 CONFLICT`, `3 REVIEW_REQUIRED`, `281 MISSING`, and `249/262` with four displayed-quarter trios. `potential_yoy_pairs_not_final_comparability=749` after explicit split-share-basis guard; this is a preliminary mathematical source-pair count only, **not authorization to publish YoY changes**. More provenance and share-basis checks are still required to assert comparable growth.

**Engineering status:** R4 original-source validator, 262×8 exception readback and CI are operating and independently tested on Development. R4 financial qualification remains **PARTIAL** due to 294 unresolved slots. Owner's instruction to defer R3 remains respected. There were **zero new financial observation selections and zero external provider calls** in this R4 run, and no Production/main changes.

Any later R4 completion must classify/verify missing histories and genuine non-applicability, not silently treat a passed workflow as 2,096 fully qualified company-quarters. R5 grades are separate.

## Continued R4 completion attempt — 16 October 2026, live historical-original pilot

**Source recovery attempt is executed, not assumed.** [R4 original-source historical recovery run 38879146991](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38879146991) concluded **SUCCESS** on a bounded 12-equity pre-2025 pilot: AUROPHARMA, AXISBANK, BEL, CANBK, DRREDDY, FEDERALBNK, GRASIM, HAL, ICICIBANK, ONGC, SBIN, TITAN. These 12 were chosen because both Sep/Dec 2024 original-source results remain missing and the issuers are long-listed. Reuse-first acquisition returned **12 checked, 0 qualified new filings, 0 observations inserted, 48 `UNKNOWN_HISTORICAL_ISIN` rejection events**. This is a genuine source-identity blocker; do **not** relax matching, guess 2024 share identities or label the scan a data-coverage gain. The immutable R4 verification step then checked the same 3,594 manifests, 10,819 eligible observations, reported **0 new selections**, 0 conflicts with accepted selections and 5,459 already-accepted proposals unchanged. Original-source validation and 262×8 audit both passed mechanically, leaving **1,802 qualified, 294 unresolved** (281 no qualifying original, 10 conflicts, 3 review). [Full issuer-attempt artifact](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38879146991/artifacts/12036009692).

**YoY scope-integrity hardening:** The original preliminary report counted 749 potential prior-year pairs after only explicit historical EPS guards. Subsequent independent SQL reconciling the accepted financial trios and preferred CONSOLIDATED/STANDALONE scope found **765 total available displayed/prior-year original-source pairs**: **28 cross-period reporting-scope mismatches**, **14 same-scope pairs with explicit original pre-split EPS guard**, and therefore only **723 same-scope, not-explicitly-split-guarded provisional pairs**. These 723 are still not approved publishable YoY percentages: share-count comparability and original publication precision remain separate checks. Code `r4-eight-quarter-readback.py` and its tests were hardened to require same selected scope for provisional YoY membership, and the Development R4 workflow was automatically triggered by the patch.

**Full repository verification:** The earlier R1–R4 job failed at `lint:edge` due to one `any` cast in the R3 Trendlyne capture interface; fixed in Development with a typed narrow union, preserving authentication and source semantics. Full repository checks re-triggered; do not claim PASS until an observed workflow concludes.

**Legal issuer chronology for VAML:** [Vedanta Aluminium's original 20 April 2026 release](https://vedantaaluminium.com/media/press-releases/list/vedanta-fixes-1st-may-as-record-date-for-demerger-announces-share-allotment-details/) and [NSE company financial filing](https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_180504_30072026153539_iXBRL_WEB.html) explicitly establish the resulting-company demerger effective **1 May 2026**. Pre-demerger Vedanta segment numbers cannot be silently presented as originally reported VAML equity statements. This supports a **business-comparability exception requiring issuer-specific evidence**, but does not automatically declare all past VAML financial quarters nonexistent or establish approved historical diluted EPS/share basis. Keep missing periods unresolved until classified and sourced under a separately evidenced original-reporting contract.

**R4 status remains PARTIAL, not full acceptance.** R3 current-quarter acquisition stays paused, no Production/main writes and no V1-4 scoring changes. Do not claim 262/262 x 8 from 12 failed historical issuer identity checks or a green workflow alone.

## October 16 ongoing official NSE historical qualification — real source-selected improvement

After the earlier verified 1,802/2,096 R4 baseline, the historical Sep/Dec 2024 NSE original-file recovery and subsequent independent R4 verification have now produced **at least eleven newly source-selected company-quarter metric trios** (**33 new selected financial facts** from the 2026-10-16 09:20 UTC baseline) confirmed by live Development SQL.

**Independently rechecked 8-period selected-core coverage**:
| Quarter | Selected qualified trios of 262 | Missing/unqualified |
|---|---:|---:|
| 2024-09 | 165 | 97 |
| 2024-12 | 169 | 93 |
| 2025-03 | 220 | 42 |
| 2025-06 | 229 | 33 |
| 2025-09 | 255 | 7 |
| 2025-12 | 258 | 4 |
| 2026-03 | 256 | 6 |
| 2026-06 | 261 | 1 |
| **Total** | **1,813/2,096** | **283** |

The 2024 new original-source evidence includes issuer-original consolidated/standalone facts from ANGELONE, ARVINDFASN, AURIONPRO, BANKINDIA and DDEVPLSTIK. The September and December quarters for ANGELONE (original pre-split EPS), ARVINDFASN, AURIONPRO and BANKINDIA have been positively read back as source-selected. Do not infer share-adjusted EPS comparability from old EPS values.

Live [R4 AXISBANK 2024 issuer identity pilot run 38880464871](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38880464871) completed successfully as a workflow, but **acquired zero new AXISBANK source results**. It returned 4 `UNKNOWN_HISTORICAL_ISIN` diagnostics; separate concurrent historical original-file ingestion populated additional 2024 source records and this run's protected R4 selector admitted 21 new selected fact rows from previously eligible full-cohort evidence, with zero protected decision conflicts. It is incorrect to attribute that increase to AXISBANK.
- The [prior broad 12-company legacy attempt](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38879146991) returned 48 `UNKNOWN_HISTORICAL_ISIN`, zero data admits; subsequent exact NSE/CML/61473 AXISBANK identity bridge **did not by itself remove the issuer-source identity blocker**. Its test fixture initially failed because the fixture used nonbank metrics; corrected, tested, but no unauthorized identity override was admitted.
- A previously automatically triggered legacy-2024 full-cohort original-source workflow was still executing during this audit. The count above reflects **only already persisted, verified decisions**, not assumptions about that job.
- R4 262×8 readback now checks that prospective displayed/current and corresponding prior-year sources have identical preferred Consolidated/Standalone scope; prior approved test-backed R4 verifier [run 38879435574](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38879435574) passed with **723 same-scope, non-explicitly-split-guarded provisional YoY pairs** at its earlier source snapshot, not fully publication/share-basis-proven growth signals.
- Because the owner paused R3, the two R3 acquisition GitHub workflows were subsequently changed to **manual dispatch only**, and the broad legacy-2024 workflow's auto-push trigger was removed. Previously triggered runs cannot be reinterpreted as new R3 authorization; no new R3 acceptance or Production action was claimed.
- Repository-wide CI previously showed 9 failing tests across Results historical visual assertions and canonical authority registry (2,344 tests passed). The earlier `lint:edge` unexpected-any compiler issue was repaired. These UI tests are separate acceptance gates, and must not be silently described as PASS or fixed by redesigning the approved UI.

**Current completion statement:** R4 verifier engineering and original-source selection are operating and producing real historical qualification, but **full R4 source-data acceptance remains PARTIAL**, with 283 exceptions at the latest accepted SQL readback. No fake data, no overridden existing selected observations, no Production/main changes; V1-4 scores untouched.

## Latest completed R4 historical recovery / verified final snapshot — 16 October 2026, 09:34 UTC

**The owner asked for full R4 completion; this is the latest verified partial completion, not a falsely asserted 262×8 PASS.**

[Official NSE 2024 full-cohort original-source recovery — run 38880157368](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38880157368): terminal GitHub Actions **SUCCESS**; source acquisition processed all 262 equities and reported `checked=262`, `qualified=33` original 2024 issuer/scoped filing candidates, `observations_inserted=97`, `periods:2024-09=15,2024-12=18`; fail-closed extractor diagnostics `UNKNOWN_HISTORICAL_ISIN=281` and `SOURCE_QUARTER_CONTEXT_MISSING=15`. R4 original-source validator independently hash-verified R2 and committed **6 new decisions** in its final pass with **0 prior-selection conflicts** (1,014 unchanged in its legacy two-period mode), source test R2 `1952` eligible facts. A concurrent R4 8-quarter selector also admitted evidence from the fresh original sources, with all prior selections protected.

**Latest independent live database readback after both completed source selection runs:**

| Quarter end | Selected/qualified stock-quarter metric trios | Not qualified |
|---|---:|---:|
| Sep 2024 | **168/262** | 94 |
| Dec 2024 | **172/262** | 90 |
| Mar 2025 | **220/262** | 42 |
| Jun 2025 | **229/262** | 33 |
| Sep 2025 | **255/262** | 7 |
| Dec 2025 | **258/262** | 4 |
| Mar 2026 | **256/262** | 6 |
| Jun 2026 | **261/262** | 1 |
| **TOTAL** | **1,819 / 2,096** | **277** |

**Actual source-qualified coverage gain in this R4 execution: +17 company-quarter slots** over the original 1,802/2,096. **142 of 262 companies have all eight quarters qualified** (up from 136), while **249/262 still have four displayed quarters qualified**; this user-approved R3 deficiency remains deferred. 2024 historical original EPS for splits is retained on the as-filed share basis and must not be considered cross-split comparable without documented normalization.

The long-listed 12-company original-source recovery run and narrowly evidenced AXISBANK pilot **did not produce a verified additional AXISBANK quarter**: historical source identity remained uncertain (four AXISBANK `UNKNOWN_HISTORICAL_ISIN` rejects). Although exact NSE/CML/61473 corroborates AXISBANK's 2024 historical security, the available NSE catalog identity conflicted or was unproven. Rather than discarding the safety gate, the code preserved the reject. Additional issuer-specific independent corporate-action/source identity proof is required for the 281 old-ISIN failures; 15 other original files lack a proven standalone OneD single-quarter context.

**R4 technical validation vs acceptance:** New R4 eight-quarter verifier/readback and source safeguards passed their own regression suites and immutable Cloudflare R2 checked-source workflow. The 8-quarter YoY candidate scope was tightened to 723 pairs at the earlier 1,802-source snapshot; **do not reuse this count as an after-recovery final figure without recomputation**. Overall `R1-R4 repository verification` remains not fully green: the latest observed full-suite job had 9 failing tests in Results UI/approved-heading assertions and canonical metric registry expectations (2,344 passed), separate from source-selection tests. No R4 complete/PASS assertion while 277 source/identity conflicts or unsupported histories remain.

**Boundary:** R3 source acquisition workflows were switched to manual-only to honor the owner's pause. R4 historical original-source work and protected selections were performed solely on `PortfolioAI-Development` / Dev Supabase / Dev R2. No Production/main, no V1-4 valuation/research/score authority modifications. R4 engineering and evidence safety are operational; **financial completeness remains partial**.

## Owner-directed R4 historical 259-slot recovery — fresh BseIndiaApi/NSE runs, 16 October 2026 evening

**Scope:** 4 historical periods (2024-09, 2024-12, 2025-03, 2025-06), all 262 open/closed equities. The 18 current R3 quarters remain intentionally deferred. No Production/main, no V1-4 scoring writes, no forced historic EPS rebasing. The historical baseline before this run: 789/1048 qualified, 259 outstanding; total 8-quarter baseline 1819/2096.

**BseIndiaApi evidence executed:** GitHub [2024 BSE discovery run 38929899357](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38929899357) **SUCCESS** on 24 portfolio 2024-gap companies. The vendored BseIndiaApi 3.3.3 returned current-canonical ISIN-verified BSE codes for 24/24 and **159 official 2024 financial-announcement PDF candidates**. Read-only; no facts selected from titles. Follow-up [original BSE PDF check 38930659966](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38930659966) **SUCCESS**: 15 real official-source PDFs retrieved and SHA-256 hashed, 15 with recognizable financial-result pages; no canonical ISIN present in extracted original PDF text. PDFs include CAMS, COFORGE, BEL, AXISBANK and STARHEALTH official source evidence; result versions/scopes/quarter columns require source-specific qualification. [Source excerpt run 38930832180](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38930832180) provides document URLs and audited text excerpts. No BSE-only PDF was force-admitted into an original-selected financial quarter.

**2025 historical NSE XBRL run:** First 12-company [run 38930144102](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38930144102) **SUCCESS**, 2 source candidates but zero new observations due issuer identities or one-quarter context. It exposed why a generic scan would not pass data. Identified and verified CAMS 2025 split: NSE Clearing [NCL/CMPT/71607, 4 December 2025](https://nsearchives.nseindia.com/content/circulars/CMPT71607.pdf) old ISIN **INE596I01012**, new **INE596I01020**, 5:1 effective **5 December 2025**; separate 2025-05 original NSE IndAS filing and 2026-01 original NSE IndAS filing independently confirm old/new issuer source identity. Added exact historical identity in `r3-live-public-filing-batch.py`, source check `r4-verify-quarterly.py`, 2024/2025 XBRL source extractors and regression tests; original pre-split EPS is preserved. A later authenticated NSE collector admitted both 2025-03 and 2025-06 original CAMS quarters (consolidated & standalone), R4 selected 3 core metrics per quarter. A 2024 original NSE legacy run [38931510503](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38931510503) selected CAMS 2024-09 and 2024-12 original source trios, all within the protected R4 gate.

**TDPOWERSYS:** Official split identity old **INE419M01027**, new **INE419M01035**, 2:1 effective 2026-08-24 (NSE/CML/75855) already approved in Development. Further 2025 [run 38931855996](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38931855996) **SUCCESS**: 12 new original NSE observation facts across 2025-03 and 2025-06, **six new selected core financial facts**, no protected decision conflicts. The 2024 legacy run [38932545374](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38932545374) **SUCCESS** as execution but its source file acquisition rejected five candidates with `UNKNOWN_HISTORICAL_ISIN`; **no 2024 TDPOWERSYS quarter admitted**. Never translate job success to financial PASS.

**Historical source-selected improvement so far: +6 company-quarter slots** (four CAMS 2024/2025 and two TDPOWERSYS 2025), resulting in **795/1048 historical qualified and 253 outstanding**. Across all eight quarters **1825/2096 qualified, 271 unresolved**, counting the 18 owner-deferred R3 slots. Accepted displayed four-quarter companies remain 249/262. R4 canonical original-source verifier completed with `selected_stock_quarters=1825`, `created_decisions=6`, `conflicting_existing_decisions=0`; independent readback `status=PARTIAL`, `QUALIFIED=1825`, `MISSING=258`, `CONFLICT=10`, `REVIEW_REQUIRED=3`.

**Additional split evidence:** Official MSE [MSE/LIST/18443/2026, 9 Jan 2026](https://www.msei.in/SX-Content/Circulars/2026/January/Circular-18443.pdf) ties KOTAKBANK pre-split ISIN **INE237A01028** to new **INE237A01036**, 5:1 effective 2026-01-14; a narrowly scoped 2024 verifier patch and regression added and isolated historical-original acquisition run started. Do not claim coverage increase until live independent readback confirms new issuer trios.

**Why R4 cannot be marked fully PASS yet:** 253 of the 259 historical slots remain without qualified source-selected trios. Most 2024 NSE legacy candidates fail because their historical filing ISIN or one-quarter accounting context cannot be proven. BSE attachments can establish an official dated corporate-result document, but may not establish old/new share identity, consolidation scope, source version and diluted EPS table column. Some 2024-2025 slots involve pre-listing/mergers/demergers and must be justified by dated issuer evidence, not fabricated or auto-marked N/A. Trendlyne relative-quarter metrics are unsuitable as standalone proof of source-quarter precision. R3 remains paused.

## End-of-turn historical R4 readback — exact source accepted

Post-run independent selected-source SQL readback:
- 2024-09: **169/262** qualified (**93** missing/unqualified)
- 2024-12: **173/262** qualified (**89** missing/unqualified)
- 2025-03: **222/262** qualified (**40** missing/unqualified)
- 2025-06: **231/262** qualified (**31** missing/unqualified)
- **Historical: 795/1048** original-source selected; **253 remain**. Six quarters (four CAMS, two TDPOWERSYS) newly qualified in this user request; starting historical baseline was **789/1048, 259 missing**.
- 8-quarter aggregate **1825/2096** qualified, 271 unresolved including the separately paused 18 R3 quarters; the 249/262 R3 display cohort remains protected.
- [KOTAKBANK 2024 pilot run 38932902520](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38932902520) **SUCCESS as workflow only**, zero observations admitted, four `UNKNOWN_HISTORICAL_ISIN` candidate rejects and zero new decisions, despite independently verified MSE/LIST/18443/2026 old/current ISIN split mapping. Correct action: keep those two 2024 quarters unqualified until their exact archive identity can be shown. [TDPOWERSYS 2024 pilot run 38932545374](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38932545374) similarly executed but admitted zero from five unknown-ISIN sources.
- [R4 March/June 2025 original recovery 38931855996](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38931855996) passed and admitted **12 TDPOWERSYS source observations**, 6 selected facts across 2 quarter-end groups; 0 conflicts with existing source decisions.
- [R4 CAMS 2024 recovery 38931510503](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38931510503) qualified both Sep/Dec 2024 CAMS source trios. All pre-split EPS as reported, no rebasing.
- BseIndiaApi 159 dated BSE company financial-announcement candidates and 15 downloaded original PDFs are discovery inputs only; none was falsely promoted without contemporaneous issuer/SCRIP code, old/new ISIN, three-month financial table, unit, source version and diluted EPS verification.
- Original-source validation preserved the 5,528 existing qualified selection candidates and **0 selection conflicts** in the latest pilot.

**R4 full historical data completeness is NOT PASS**. Next priority is proving historical old ISINs and source quarter single-period contexts for remaining 253, with audited BSE original PDFs / dated issuer originals and genuinely comparable pre-listing treatments. Trendlyne relative quarter measurements are not suitable substitutes for the primary source requirement. Production/main untouched.
