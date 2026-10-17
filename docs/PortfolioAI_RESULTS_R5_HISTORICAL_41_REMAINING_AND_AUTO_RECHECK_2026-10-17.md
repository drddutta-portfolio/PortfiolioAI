# PortfolioAI Results R5 – Historical Source-Reconciliation Continuation (17 October 2026)

**Branch:** `PortfolioAI-Development` only. **Release status:** PARTIAL, not accepted as R5-G PASS. No Production/main changes.

## Confirmed application-engine live counts

The latest successful 262-equity actual-grader census [GitHub Actions run 39025594041](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39025594041) demonstrates:

| Historic quarter | Strong | Mixed | Weak | Rated |
|---|---:|---:|---:|---:|
| Mar 2025 | 56 | 135 | 18 | 209 |
| Jun 2025 | 39 | 136 | 39 | 214 |
| Sep 2025 | 70 | 124 | 22 | 216 |
| **Total** | **165** | **395** | **79** | **639** |

Of the formerly 66 specifically source-qualified / industry-supported but Not Rated historical cases, **25 are now rated**, and **41 remain unresolved**. The 41 break into **31 lacking selected earlier-quarter evidence**, **7 insufficient sequential/coherent comparisons**, and **3 incompatible adjacent-quarter evidence cases**. Unmodeled industries are a separate backlog, not counted in the 41.

The prior after-21-improvements cohort counted 43 unresolved; this R5 enhancement resolved two additional cases under the strict original-source comparator. Historical results are graded as retrospective operating trends, **not financial recommendations or point-in-time backtests**.

## Engineering and evidence changes

- Revised `scripts/results/r4-verify-quarterly.py` read-only R5 proof to expose **each separately eligible Consolidated and Standalone issuer original** when individually R2-byte-hash-replayed, with unique source identity and no numeric conflicts in the scope. Competing originals within one issuer/period/scope remain inadmissible.
- R5 proof workflow [39025443494](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39025443494) PASS, subsequently pinned **149 exact original source trios** (24 issuer-periods with both separately verified scopes) in `src/features/results/resultsR5ComparisonProof.json`; it **did not overwrite or rewrite any R4 canonical selection**.
- `src/features/results/resultsR5VerifiedComparison.ts` now tests verified Consolidated and Standalone historical streams separately, with a deterministic **Consolidated-first preference** independent of grade strength. It returns UNAVAILABLE unless the original issuer/source/period/currency/unit and R5 sequential-history contracts pass. Original source alternatives are only applied to the R5 assessment, never the displayed Results table.
- Added regression cases for both independently verified scope choices, alternation between canonical scopes, missing source IDs, duplicate proofs, no source substitution, and actual grading.
- The result was confirmed by R5-G live census [39025594041](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39025594041): **37 focused tests PASS** and live SQL readback of the complete 262-company cohort.
- On **17 October 2026**, linked the successful protected R4 original-filing recovery workflow `.github/workflows/results-r4-historical-recovery-v3.yml` to dispatch both the R5 original-scope proof and R5 actual-engine grading census against `PortfolioAI-Development`. R4's own R2 hashes, existing-selection conflict guards and Dev isolation remain authoritative. New automatic recovery run [39026030568](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39026030568) started with eight bounded BSE original-source shards; the exact source outcomes must be read before updating grade completion.

## Findings limiting further ratings

- A read-only Development examination of the 30 targeted symbols and five quarters (Sep 2024 to Sep 2025) identified **58 symbol-quarter slots without a complete eligible original Revenue/NII + PAT + diluted EPS trio stored**, not the same as 58 R5 cases. This includes pre-IPO or predecessor/de-merged names where a same-issuer historical filing must not be inferred.
- The earlier targeted BSE result [39015867789](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39015867789) found no newly admissible issuer originals: some source PDFs were absent, and others failed geometric fiscal-quarter/date/metric extraction. These records must remain Not Rated until explicit issuer-original evidence qualifies.
- Cases needing legitimate earlier evidence include, among others, TATAPOWER Sep/Dec 2024; FEDERALBNK Sep/Dec 2024; MANKIND Mar 2025; GMBREW Mar 2025; several newly listed or demerged names. No generic issuer-matched EPS or revenue value may be invented from another entity or a noncomparative annual result.

## Remaining acceptance gates

1. Finish the eight-shard R4 source-recovery run and read its independent source-admission logs; only accepted original period facts can change grading.
2. Reassess the exact remaining 41 via a fresh R5-G actual-engine census and 262-security UI readback, on the same Development commit.
3. Reconcile unsupported-model and missing classification sectors separately, with approved financial-contract models.
4. Complete authenticated UI reference-design, tooltip/slider and live-refresh evidence at 100% zoom.
5. Vercel new Development deployment was blocked earlier by the free-plan daily deployment quota (HTTP 402); do not claim preview READY for a newer commit without independently verifying it.

**No auto-rating, R4 selection overwrite, look-ahead data, unverified issuer PDFs, or Production promotion.**
