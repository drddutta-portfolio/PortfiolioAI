# Results R5 historical 110-case remediation — execution ledger, 17 October 2026

**Target:** PortfolioAI-Development, Supabase project lrgpjimipfkyoqbpsqzz. Production/main excluded.

## Verified starting point
R5-G actual engine run [39047882944](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39047882944) PASS: 262 equities, historical quarters March/June/September 2025 **210 + 215 + 216 = 641 rated**; **110 source-qualified but Not Rated**: **44** historical source/history/coherence failures (33 missing eligible prior selections, eight insufficient comparisons, three incompatible adjacent scopes), and **66** unsupported or missing methodology. These are failures among *source-qualified company-quarters*, not all quarter slots.

## Development work performed in this continuation
1. Added `scripts/results/r5-qualify-missing-classifications.py` and `.github/workflows/results-r5-official-classification-recovery.yml`. They read the actual 262 equity universe, collect NSE official industry classifications, strictly match ISIN and issuer, and admit only empty canonical attributes with original source evidence. No UI-only substitute classifications, existing decision overwrites, R4 mutation or production access.
2. First NSE collector attempt [39054255325](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39054255325) completed execution but returned **NSE_AUTH_HTTP_403 for all 23 requested identities**, so **zero admitted canonical attributes**; workflow success only proves guarded fallback and engineering, not recovery of any classifications.
3. Two separately reviewed, exact-ISIN original-exchange industry cases were admitted using the existing `data_source_records`, `security_attribute_observations`, and `security_attribute_decisions` chain. Confirmed by Development SQL readback: `360ONE` sector `Financial Services` with industry `Stockbroking & Allied`; `DDEVPLSTIK` sector `Material` with industry `Specialty Chemicals`. Exactly two new source records, two observations, and two decisions. Existing sectors untouched; no R4 financial selection changes.
4. Latest 262-equity grade recheck dispatched by commit `cf99bdb3`: [R5-G actual grading](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39055275686). New reduction in historical exceptions must be read from this run's derived census rather than inferred from the two classification admissions.
5. The existing original R2/hash proof and R4 source recovery remain separate. Do not relax two-comparison/source-continuity requirements, use predecessor companies' facts without verified identity, or assign industry percentile grades from sparse peers.

## Unresolved
- All remaining historical cases without qualified earlier filings/selection require further issuer-original recovery or a documented genuinely nonexistent history.
- Remaining unknown sector/industry records require NSE alternative authenticated access, BSE official detail, or explicitly reviewed admissible source evidence. Current NSE runner is blocked by HTTP 403.
- R5-G latest derived census, authenticated browser design at 100% zoom, and actual foreground/10-minute refresh proofs remain pending at this stage of the ledger.

**Release:** R5 PARTIAL. A successful GitHub Actions job does not imply all 110 exceptions are graded.
