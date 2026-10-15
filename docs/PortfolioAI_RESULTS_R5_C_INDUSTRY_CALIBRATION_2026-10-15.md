# R5-C broadened four-quarter acceptance — updated 15 October 2026 (supersedes V2 census)

**Version:** `R5_INDUSTRY_AND_COMPANY_TREND_20261015_V3`. **Scope:** the 223 securities with four source-selected issuer quarterly core financial trios, from the frozen 231-member original Results cohort. Development only, no production or V1-4 score changes.

The R5-C engine has now assessed the full 223-member four-quarter cohort using two **explicitly different**, versioned decision bases:
- **INDUSTRY_PEER:** independently selected issuer-specific Revenue/NII and PAT QoQ percentage pairs calibrated to the *exact reviewed industry*, >=4 issuers and >=12 qualified pair samples; neither missing peers nor another sector is substituted.
- **COMPANY_TREND:** where peer calibration is genuinely sparse, compare the same issuer's source-coherent adjacent-quarter **financial level changes**. Minimum two individually qualified sequential quarter comparisons including the latest. A bank uses NII + PAT; operating companies use revenue + PAT. A PAT loss-to-profit comparison remains directionally valid even when a percentage growth denominator is nonpositive, but no invalid percentage is asserted. This is explicitly **not a peer ranking** in the grid, hover, summary or insight panel. Strong requires current profit positive and a latest joint improvement plus at least two jointly improving comparisons; Weak requires current PAT nonpositive or latest plus two total jointly deteriorating comparisons; otherwise Mixed.
- **UNAVAILABLE / NOT RATED:** reviewed industry absent, no defensible industry financial contract, insufficient independently comparable quarter pairs, competing issuer data, or scope mismatch. This is a completed evidence evaluation, not a fabricated Weak or Mixed.

**Independent read-only Development SQL candidate census, June 2026, 15 October:** `223 four-quarter-complete = 82 peer-gradeable + 123 trend-gradeable + 18 not-gradeable`. This expands the source-evidenced candidate grading population to **205/223 (91.9%)**, from the earlier V2 82/223 peer-only grading. Candidate counts are independently derived in SQL, not yet authenticated-browser counts; exact UI parity is separately verified during R5-G.

**18 remaining, with explicit non-grade state:** ADANIPORTS, ASTERDM, BHARTIARTL, CARBORUNIV, CDSL, COFORGE, DRREDDY, E2E, ENGINERSIN, FEDERALBNK, HINDPETRO, IRB, IRMENERGY, JWL, KOTAKBANK, LODHA, TECHM, UTLSOLAR. Of these, 12 have no current reviewed sector/industry in Development's `current_security_enrichment_v1`; the other six have issuer/period/model eligibility constraints that must not be bypassed. All remain visible, and the UI explains why classification is unavailable.

**UI integration:** approved four-quarter grid and existing four-card detail shell preserved. Added a compact Jun 2026 four-qualified-quarter cohort header showing Strong, Mixed, Weak, Not Rated and counts of peer-ranked vs own-trend decisions; each quarterly cell shows the grade, accessible explanation and provenance basis, and the insight card distinguishes peer percentile from company trend.

**No data modification** was required: this is deterministic derivation from already-selected compact Supabase facts and reviewed classification metadata, with original large evidence preserved in Development R2. No new provider call, no score migration, no change to the V1-4 research authority.

**Acceptance interpretation:** R5-C execution is complete for all 223 stock identities, with 205 *potential* Strong/Mixed/Weak outcomes and 18 **Not Rated** exceptions. It is **not** correct to say all 223 have a grade. Do not promote the feature to R5-G full authenticated dashboard/visual acceptance without verified browser readback. Earlier V2 figures and constraints below are historical only.

---

> **R5-C implementation closeout:** Industry-specific policy, deterministic peer calibration, UI wiring and regression tests implemented. Focused verification [run 38685589819](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38685589819) PASSED architecture, TypeScript, industry/quarter/UI tests, lint, production build and Git diff. An additional pre-existing four-vs-six-quarter R2 test suite has been corrected and is under verification. **Engineering state:** implemented and focused checks green; full 231-company authenticated UI census and pixel acceptance belong to R5-G. This does not imply 231/231 gradeable: the independently replicated June 2026 example supports only 83 candidate gradeable companies, with 148 safely Unavailable.\n\n# PortfolioAI Results R5-C — qualified industry operating signals

**Implementation:** `src/features/results/quarterlyR5Classification.ts`  
**Version:** `R5_INDUSTRY_QOQ_EMPIRICAL_20261015_V2`  
**Boundary:** Development only; R5 231-equity cohort and Sep 2025 / Dec 2025 / Mar 2026 / Jun 2026 quarters. No Production or V1-4 research score changes.

## Method and constraints

1. Grade quarter-over-quarter **only**, for NII + PAT (reviewed Banking industry) or Revenue + PAT (eligible non-financial industries). Diluted EPS is preserved as source evidence but never graded across unqualified splits. No investment thesis, recommendation or historical PIT claim.
2. Group by **exact normalized canonical sector and exact normalized canonical industry**. Source-selected original issuer observations and industry metadata are loaded from existing Results and portfolio repositories. No sector-wide thresholds, cross-industry proxies, guessed taxonomies or provider calls.
3. Calibration requires **at least 12 valid QoQ quarter-pairs from at least four distinct issuers** within an exact industry, using only the three comparisons Dec 2025/Sep 2025, Mar 2026/Dec 2025 and Jun 2026/Mar 2026. No calibration from unselected or unqualified historical periods.
4. For each pair, current and preceding quarters must each have one source-selected Revenue/NII + PAT pair from the same filing and scope. Currency/units, three-month period, positive current topline and positive preceding topline/PAT must pass. A missing or conflicting fact removes that peer comparison; it is not treated as zero or repaired.
5. Use deterministic decimal p25/p75 percentiles of qualified cohort growth, interpolating between adjacent order statistics; preserve output to four decimals. Strong requires **both** revenue/NII QoQ and PAT QoQ at or above industry p75 and positive current PAT. Weak requires nonpositive current PAT or materially negative joint growth at/below both p25. Other valid comparisons are Mixed; every unsupported case is Unavailable with an explanation. This is a *performance signal*, not stock investment research.
6. No lender/insurer/NBFC financial statements are passed through the ordinary industrial Revenue/PAT contract. Banks use NII/PAT only if the canonical sector is Banking and industry identifies banks. An unclassified or semantically mismatched industry fails closed.
7. Industry baselines are built **once per UI evidence refresh**, not on each cell, and reused by all Results status, hover and insight components. Peer boundaries do not include years before the frozen R5 release.

## Live SQL independent candidate census (2026-10-15)

Read-only Development SQL joined selected decisions to qualified issuer observations on two adjacent quarters, then grouped by `current_security_enrichment_v1.sector/industry`, preserving source ID, scope, currency and units. Groups reaching the exact-industry minimum are:

| Canonical sector | Canonical industry | Compatible pairs | Issuers |
|---|---|---:|---:|
| Pharma | Pharmaceuticals | 65 | 23 |
| Capital Goods | Industrial Products | 29 | 10 |
| Chemicals | Chemicals & Petrochemicals | 21 | 7 |
| Automobile and Auto Components | Auto Components | 18 | 6 |
| Information Technology | Computers - Software & Consulting | 18 | 6 |
| Consumer Services | Leisure Services | 16 | 6 |
| Textiles | Textiles & Apparels | 15 | 6 |
| Banking | Banks | 14 | 6 |
| Consumer Durables | Household Appliances | 14 | 5 |
| Gems and Jewellery | Gems, Jewellery And Watches | 12 | 4 |
| Healthcare | Hospital | 12 | 4 |
| Consumer Services | Retailing | 12 | 4 |

These counts are **independent SQL candidates**, not a claim that every source-eligible current-quarter stock was graded. The browser code applies exact canonical quarter identity, uniqueness and original-source checks that can further reduce eligibility. This is honest coverage, not a 231/231 Strong/Mixed/Weak assertion. Other industries are deliberately Unavailable where the own-industry sample is insufficient. The first displayed quarter, September 2025, also lacks its earlier sequential baseline under the frozen four-quarter scope.

## Required engineering acceptance

- Unit tests must verify industry-key isolation, small-sample gating, source coherence for **both** issuer periods, bank NII/PAT rules, unselected prerequisites, strong/weak/mixed outcomes and no investment advice.
- Full Development TypeScript, lint, Results UI test and build must pass; CI red means R5-C not formally accepted even if a policy is committed.
- Verify actual, authenticated 231-stock classification counts and reference screenshot separately before full R5 release PASS.
- The sector-only `R5_QOQ_EMPIRICAL_20261015_V1` policy is **superseded**, not silently reused for unsupported industries.

## June 2026 independent SQL grading census (candidate, before browser acceptance)

A second read-only SQL calculation used the same selected original-filing Revenue/NII/PAT period pairs and exact industry lower/upper quantiles. For the **June 2026** report in the 231-company cohort, it reproduced **12 Strong, 55 Mixed and 16 Weak** grades — **83 potentially gradeable equities**. The other **148 / 231** are not forced into any status; their own-industry calibration or comparable financial pair is insufficient, so the UI must preserve **Unavailable**.

This is an **independent SQL check, not a claim of 83 verified browser grades**. The frontend requires unique source-qualified quarter selections and can exclude additional records. September 2025 has no earlier sequential comparison within the approved four quarters. Later R5-G acceptance must reconcile actual frontend counts at a fixed source cutoff; no fabricated peer thresholds or sector substitution is allowed merely to increase 83.
