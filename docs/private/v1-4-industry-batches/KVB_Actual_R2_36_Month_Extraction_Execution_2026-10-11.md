# Banking V1-4 — KVB 36-month R2 extraction completed (2026-10-11)

## Actual credentialed execution

- PR #124, branch `codex/banking-source-remediation`.
- GitHub Actions run: https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38156445608
- Artifact: `kvb-r2-monthly-pit-candidates`, ID `11708890282`, 36-row CSV + summary JSON.
- Credentialed `extract` job: **SUCCESS**, not PR preflight. It ran pinned reviewed extractor at commit `03cf0c85916ce32c7f4e5c734349eb13b5505d75` and accessed the scoped R2 bucket via existing environment credentials. R2 account ID was independently confirmed.
- R2 Parquet objects accessed: 36 / 36. Extracted KVB identity-matched price candidates: 36 / 36, each with the original object key, original-byte computed SHA-256, source exchange date and retained price string.
- Four daily-adjusted-series fallback months: October 2023, November 2023, December 2023 and January 2024.
- Independent Development read-only SQL verified 24 additional, original NSE month-end `V1_4_BANK_VALUATION_MONTH_END_PRICE_CAPTURE` source records from October 2021 through September 2023 (KVB ISIN INE036D01028).
- Total distinct monthly source-linked price rows for 60-month target: **60 / 60**.

## Qualification remains fail-closed

These rows constitute source-linked **price candidates** and are NOT PIT P/E or P/B admissions. R2 adjusted-series and adjusted-decision-ledger price bases have not been demonstrated comparable with the unadjusted NSE legacy snapshots. Original-availability EPS TTM/BVPS is absent per monthly evidentiary contract; 2026-retrieved retrospective Trendlyne fundamentals cannot be attributed to old months. Corporate-action/share basis remains unqualified. Current P/E admissible months: **0**; P/B: **0**; each 12-month bucket: **0/12**, longest unqualified run: **60 months**. Do not use raw price coverage to assert model coverage.

The original artifact provides 36 new exact exchange dates and price strings. Appendix ledger for the full 60 months was produced from the artifact and read-only Development original source captures; no direct privileged Development writes were made.

## Next required evidence
- Original publication/availability-bounded EPS TTM and BVPS facts per observation.
- Exact period/share basis and effective corporate actions, notably the 2025 bonus.
- Canonical M5/M7 review and acceptance, then materializer and readback.
- Independent owner-authenticated numeric ROA review remains blocked pending reviewed migration protections and source-register binding; separate from this successful raw extraction.

No changes to Production, main branch, Development scheduler, BANK V2 financial methodology, grant scope, or provider accounting were made in this extraction.
