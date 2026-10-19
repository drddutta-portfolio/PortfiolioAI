# Results R5-G: exact 40-case census (20 October 2026)

**Development only. Status: PARTIAL — no final R5 acceptance.**

## Latest independently read-back position

- **HEAD:** `53ef820c41ed2ad8f2a3163e72deef7c05d13704` at the latest successful census.
- **R5-G live 262-equity run:** [39339381953](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39339381953), completed 19 October 2026 23:07 UTC.
- **Historical March, June and September 2025:** **714 source-qualified issuer-quarters rated**, **40 Not Rated**. Counts are 27 earlier-quarter source selections missing, 4 accounting/source-coherence incompatibilities, and 9 insufficient sequential comparison histories; **zero newly declared permanently ungradable**.
- **Exact 40 symbol/quarter entries, selected-baseline flags, and R5 grade-engine reasons:** the `historical-remaining-case-register.md` in that run's `results-r5-g-derived-grade-census` artifact. Its accompanying `alternate-scope-reconciliation.json` has the 40-case original-source diagnostic.
- **R5-G focused verification:** 44 tests passed across five files, TypeScript, architecture, focused ESLint and Vite build completed successfully. This is not full-repository acceptance or authenticated UI acceptance.
- **Independent original-source R2 replay:** [39339379316](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39339379316), 3,985 hash-checked original sources, 11,986 qualified original fact rows, 28 verified same-scope source pairs and 292 comparison-only proof identities. These identities do not replace R4 selections.
- **R4 historical recovery:** [39338846748](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39338846748) completed all eight BSE shards and verifier. The source verifier independently read back **2,017 qualified / 67 missing / 9 conflict / 3 review-required** company-quarter slots among 2,096. It created **zero** new canonical decisions in its final verification. No R5 historical exception reduction is supported by the subsequent R5-G readback.

## Exact evidence interpretation

The 40 are **grade-engine failures among source-qualified historical issuer-quarters**, not missing financial filings for all 40. The read-only same-scope diagnostic found **20 immediate selected-baseline gaps, 8 adjacent-scope mismatches, and 12 second-comparison/other cases**. These diagnostic categories differ from the 27/4/9 engine remediation classes and must not be conflated. Eighteen cases have a stored original complete trio in both adjacent quarters under at least one common scope; this alone does **not** establish two source-coherent adjacent comparisons, nor independent source replay approval for every record.

The latest eight-shard BSE replay reused retained original PDFs but did not produce a new admissible original trio in its shard summaries. Its successful job status is not evidence of a newly graded stock. Previously signed JASH and SSWL original-source recoveries remain preserved; do not repeat provider requests for their already qualified records.

**BDL March 2025 remains an unresolved competing-original PAT conflict**: see `PortfolioAI_RESULTS_R5_2026_10_18_BDL_SOURCE_CONFLICT.md`. Do not silently replace the canonical source, average the conflicting PAT values, or infer EPS/share comparability. For pre-IPO or demerged issuers, do not assert a genuinely ungradable period without independently proving the exact issuer and original historical filing facts.

## Still required for completion

Resolve each of the 40 using already qualified R2 evidence first; only then original BSE/NSE/issuer evidence, with Trendlyne as fallback and no duplicate provider calls. Admit only separately source-verified, same-scope, period-identified **R5 comparison-only** evidence. Re-run the complete 262-equity actual-engine census and exact-case ledger at the resulting fixed Development HEAD. Pass repository-wide acceptance, authenticated Results UI/refresh tests, 100%-zoom approved-design comparison, and SHA-matched protected Development preview verification. Until those gates pass, **R5 remains PARTIAL**; no Production/main promotion.
