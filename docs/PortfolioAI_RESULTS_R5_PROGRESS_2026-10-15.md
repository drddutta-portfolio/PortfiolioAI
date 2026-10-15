## Owner-approved R5 continuation — 15 October 2026 (later checkpoint)

**Current overall decision: R5 PARTIAL, NOT ACCEPTED.** Owner approved historical comparison acquisition, calibrated quarterly performance and reference UI verification. GitHub Development only; `main` and V1-4 research unchanged.

### Confirmed source and historical comparison coverage
- Rechecked Development Supabase: 262 unique portfolio equities; 231 have selected issuer-quarter facts; 223 of 231 have all four recent quarters. 2,797 selected facts for 916 stock-quarter combinations.
- Selected comparison baselines *preceding 30 September 2025*: **0**. Existing March/June 2025 observation rows are not promoted without the original R4 hash/identity/scope verification.
- Read-only cohort SQL identified **203** June-2026 company-quarter cases with issuer-selected same-scope NII/revenue and PAT comparison pairs using March 2026; this is a *candidate calculation-eligibility count* before all R5 sector/industry gates, not an accepted Strong/Mixed/Weak count.
- Historical issuer acquisition workflow: [Results R5 Development Historical Comparison Acquisition](https://github.com/drddutta-portfolio/PortfiolioAI/actions/workflows/results-r5-comparison-acquisition.yml). On a Development-only trigger it runs original source-reuse-first acquisition of March/June 2025, retains qualified compact manifests in Development R2, verifies their hash and qualification through the unchanged R4 selector in R5 comparison mode, and independently checks database persistence. Provider quota and original filing source access can prevent completion. A *running job* is not proof that any missing quarters are acquired.
- September/December **2024** remain a distinct prior-year acquisition gap requiring original pre-integrated-era issuer/NSE/BSE filings. This workflow does **not** silently claim to cover them.

### R5 code implemented
- `src/features/results/quarterlyR5Classification.ts`: versioned `R5_QOQ_EMPIRICAL_20261015_V1` model. It uses canonical reviewed sector, only qualified source-selected, issuer-coherent current and prior sequential quarter results; NII+PAT for banks, revenue+PAT for other permitted operating groups. It fails closed if previous baseline is missing/nonpositive, currency/unit/scope is incompatible, issuer filing differs for current core facts, or sector/industry calibration is not defensible.
- Empirical calibration: the current selected 2025-09 through 2026-06 cohorts. For each published sector with enough comparable pairs, upper-quartile sector QoQ **both** metrics and positive PAT = Strong; material joint lower-quartile deterioration or source-selected loss with valid prior baseline = Weak; other qualified two-metric signals = Mixed; anything less = Not Available. Sample sizes, sector thresholds and proxy restrictions are versioned in code. Financial services lenders/insurers and unclassified businesses fail closed where their method is not comparable. **QoQ ONLY** is disclosed; historical YoY performance grade is not yet an acceptable outcome.
- `src/features/results/ResultsReferenceLivePage.tsx`: retains the approved R2 screen shell and four-panel grid; adds R5 Strong/Mixed/Weak presentation, labeled QoQ/YoY growth where qualified, hover details and evidence-based narrative; chart bars now use selected/eligible facts only, never pending source versions. Actual portfolio position remains from `usePortfolioView`.
- `src/features/results/ResultsReferenceLivePage.test.tsx`, `quarterlyR5Classification.test.ts`, and `quarterlyR5.test.ts`: regression checks for bank-specific NII, IT/pharma calibration, source-selection, decimal arithmetic, split EPS restrictions, source-coherent facts, no thesis inference and visual-shell structure.
- `src/contracts/canonicalDataAuthorities.ts`: registers `RESULTS_QUARTERLY_PERFORMANCE` as the one versioned derived Results signal, explicitly separate from V1-4 research recommendations.
- R5 collector and selector use opt-in environment flags. Original R3/R4 period scopes and parser tests remain unchanged when the flags are disabled.
- Edge scanner lint fixed without changing scanner logic; prior CI source-reconciliation text matching corrected to actual UI text.

### R5 acceptance gates not yet cleared
1. March/June 2025 historical acquisition run must finish successfully with independent selected database readback. All required 2024 baselines must also be acquired, source-qualified and lineage-checked before claiming complete multi-year YoY history.
2. Full six-quarter charts per equity cannot be asserted until six valid selected original quarters exist. Missing bars remain blank.
3. Strong/Mixed/Weak counts from actual 262-equity live model and all permitted current / closed positions must be verified, with an R5 data readback or exact reproducible browser output.
4. Architecture Guard, TypeScript, ESLint, unit suites, Edge tests and build must finish green at final Development HEAD; earlier workflow failures and ongoing runs do not constitute acceptance.
5. Authenticated browser presentation at 100% zoom must be compared to the owner-approved reference screenshot. Code-level structural UI tests do **not** replace pixel/visual verification. The screenshot file was not present in the current handoff attachment.
6. No Production/main or investment score change; no Supabase schema migration was created or applied. Historical source writes are made only if original evidence passes the R5 workflow guards.

---

# PortfolioAI Results R5 — Development execution checkpoint
**Date:** 2026-10-15 (IST)  
**Scope:** Results R5 progressive delivery; Development branch only  
**Status:** PARTIAL — deterministic comparison and evidence-based narration wired, full R5 classification/acceptance NOT PASS.

## Independently read-back R4 selected evidence
- Current selected financial observations: 2,797.
- Selected equity-quarter combinations: 916 of 924 across the 231 original-filing company cohort.
- Fully selected four-quarter equities: 223 of 231.
- Selected comparative prior-year quarters preceding September 2025: zero. Unselected older records exist but are not valid R5 comparison inputs.
- All 262 current + closed equities remain the Results universe; only 231 have source-selected R4 quarter coverage.
- R4 unresolved eight-company exception register is in `PortfolioAI_RESULTS_R4_ORIGINAL_PDF_RECOVERY_2026-10-15.md`. R4 and R5 progress are independent.

## Implemented in this checkpoint
1. `quarterlyR5.ts`: a versioned, `decimal.js` deterministic quarterly QoQ/YoY engine. Eligibility requires selected issuer-filing evidence, matching company and metric, period start/end, declared original units and currency, and consistent standalone/consolidated reporting. Declines unselected, ambiguous and split-affected EPS. Uses half-up percentage rounding to two decimals; null for non-positive baselines and insufficient history.
2. `resultsSourceRepository.ts`: fetch period start, source record identity, and currency from existing observation repository; no new table or network provider.
3. `ResultsReferenceLivePage.tsx`: display calculated comparison percentages in existing Key Metrics table, and traceable explanatory statements in the existing AI Insight panel without redesigning the approved grid. No thesis or buy/sell recommendation.
4. `quarterlyR5.test.ts`: source selection, accurate QoQ/YoY, cross-scope rejection, missing period, nonpositive baseline, split-affected EPS and no thesis inference.

## Strict limitations / remaining work
- Strong/Mixed/Weak for ordinary companies has **not** been activated. Industry-calibrated, approved thresholds and appropriate supporting history are required. The existing status presentation still marks selected financial figures as source reconciled when they are not yet performance-gradeable.
- Historic comparison data: selected prior-year periods are absent; YoY returns Not Available. Acquisition and R4 source qualification must precede results grading.
- The chart is not yet an independently validated six-quarter qualified-only financial presentation for each equity. It requires the same fail-closed selections and additional quarters.
- Full 262-company, all-industry calibrated scoring/insights, persistence, industry acceptance counts, and production-like authenticated pixel match are pending.
- No Supabase migrations, database writes, Cloudflare R2 writes, Trendlyne/NSE calls, V1-4 changes or Production updates in this checkpoint.
- CI, TS/lint, Architecture Guard, unit tests and authenticated Vercel browser acceptance must still be independently checked on final HEAD. Vercel preview creation alone is not acceptance.

## Next required R5 execution
1. Run `npm run check:architecture && npm run typecheck && npm run lint && npm test -- --run src/features/results/quarterlyR5.test.ts && npm run build` in development CI; fix every failure.
2. Qualify actual missing comparison-period evidence and introduce six-quarter chart selections; do not re-fetch accepted R4 originals.
3. Specify and validate R5 grading for banks vs other industry models, with explicit confidence and missing-data treatment before Strong/Mixed/Weak activation.
4. Integrate versioned assessment storage through an owner-authorized schema migration if genuinely needed; the current checkpoint is derived entirely from existing observations.
5. Compare authenticated Development page with owner's approved screenshot at 100%, read back assessments, and supply a verified acceptance report.

The March/June/September/December date window is aligned to fiscal-year quarter labels, but prior-year comparison periods must be actually selected rather than generated.
