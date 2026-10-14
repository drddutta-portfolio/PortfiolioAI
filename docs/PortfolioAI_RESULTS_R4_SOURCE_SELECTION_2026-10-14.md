# Results R4 — Source Consistency Verification and Presentation Selection (14 October 2026)

**Environment**: PortfolioAI-Development; Supabase Dev `lrgpjimipfkyoqbpsqzz`; Cloudflare R2 `portfolioai-history-dev`. **Production/main untouched**.

**Scope clarification**: The canonical UI-first plan uses the R4 label for historical acquisition. This owner-requested follow-on is the *R4 source-verification/selection subgate* that must precede R5 earnings-performance assessment. It neither replaces the original R4 acquisition gate nor activates R5 performance classifications or R6 daily scanning.

## Acceptance authority

- Transaction-derived current/closed portfolio universe is not reclassified.
- Existing `fundamental_observations` are immutable source facts. R4 uses existing `fundamental_observation_decisions` to select source-consistent *current-display* facts, not an alternative financial authority.
- Source candidate must match canonical symbol, ISIN, quarter period_start/period_end, accounting scope, unit, exact decimal and `AVAILABLE` status. Only quarterly original NSE iXBRL compact source records with verified R2 manifest hashes and matching immutable `data_source_records` may be selected in the first automated cohort.
- Read-back the actual R2 manifest bytes and compare the SHA-256 stored in Supabase. Revalidate source content/contract, source URL, original source hash record and the same-filing metric map. The R2 bytes are *a compact extracted evidence manifest*, **not original NSE filing bytes**.
- For the four target completed quarters (2025-09-30, 2025-12-31, 2026-03-31, 2026-06-30), auto-selection requires one complete source record with Revenue/PAT/diluted EPS (non-banks) or NII/PAT/diluted EPS (banks). A conflicting same-scope revision, missing core metric, unverified identity, missing R2 bytes/hash or pre-split EPS leaves the stock-quarter in review; no substitution with TTM or other scopes.
- Select a preferred `CONSOLIDATED` cohort if present, else `STANDALONE`, and never combine the two. Other evidence remains in Source & Verification Details; UI presentation only collapses repeated/alternative scopes.
- Existing selections cannot be replaced automatically (fail closed, roll back on any disagreement); upserts are idempotent and only append decisions for previously unselected metrics.
- Original `published_at` is **unknown for most filings**. Source-reconciled selections are **for current presentation only**, *not historical point-in-time availability* and not a claim that the original bytes or publication time were independently proven. UI must explicitly say **Source reconciled · publication unverified** for such records.
- R4 does **not** calculate or invent Strong/Mixed/Weak, QoQ/YoY, investment returns, scores, V1-4 readiness or a thesis impact. R5 needs calibrated, comparable industry-specific performance gates.

## Engineering implementation

- `scripts/results/r4-verify-quarterly.py` — fail-closed R2 byte/hash reconciliation, candidate eligibility, source/scoped conflict quarantine, canonical decision insert and independent count report.
- `scripts/results/test_r4_verify_quarterly.py` — deterministic scope, conflict, partial-period, bank-NII and source/hash tests.
- `.github/workflows/results-r4-source-verification.yml` — Development-only secrets, environment guard, limited R2 reads, idempotent decision writes, artifact report.
- `src/features/results/quarterlyPresentation.ts` — deterministic UI-only scope/duplicate collapse from *existing decisions*; does not make choices about authority or write to the database.
- `src/features/results/ResultsReferenceLivePage.tsx` — reconciliation status without misleading performance grading, exact publication caveats and original evidence retained in expandable details.

## Release conditions

A green CI alone does not pass R4. The workflow must finish; its artifact must report source-readback/fact qualification, number of selected facts, distinct company-quarters and reasons for exclusions. Independent Dev SQL must confirm decision IDs are valid for their exact metric/period/scope, source rows unchanged and no V1-4 scoring mutations. Verify Development preview UI after merge with an authenticated session, then record remaining pending cases. No Production/main changes.

**Status at implementation commit**: built, PR #143 open; awaiting workflow/decision readback. Do not advertise 231/231 verified or Strong/Mixed/Weak before their actual gates.


## 2026-10-14 R4 exception audit

The source-validation follow-on PR #144 admits complete nonconflicting Standalone source records when consolidated is incomplete; it does not permit conflicts or cross-filing metric blending. The independent readback recorded **2,743 selections, 898 selected stock-quarters, 212 equities with all four and 19 equities incomplete**. Original publication timestamps remain UNKNOWN for most observations. Exact company/quarter failure ledger and requisite evidence: `docs/PortfolioAI_RESULTS_R4_EXCEPTION_AUDIT_2026-10-14.md`. Full acceptance is **NOT PASS**; R5 Strong/Mixed/Weak remains unimplemented.


## Final follow-on verification — 2026-10-14 18:04 UTC

Issuer-original Q1 FY27 NSE reacquisition plus test-backed packed after-extraordinary bank EPS extraction closed HCLTECH and HDFCBANK. Independent Development readback: 214/231 companies with four source-selected quarters; 900/924 company-quarters; 2,750 source selections; 17 companies and 24 stock-quarters remain unselected. R2 verified 1,902 archived compact manifests; no existing-decision conflicts. Source-reconciled current display is not original publication-time verification or investment R5 classification. Full portfolio-wide R4 acceptance **NOT PASS**. Details in `PortfolioAI_RESULTS_R4_EXCEPTION_AUDIT_2026-10-14.md`.
