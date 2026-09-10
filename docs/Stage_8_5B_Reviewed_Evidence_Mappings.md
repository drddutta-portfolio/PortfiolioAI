# Stage 8.5B — Reviewed evidence mappings after HDFCBANK deep refresh

## Purpose

Promote only the Trendlyne mappings that were safe to review from the successful HDFCBANK Complete Research Refresh, without making additional provider calls or activating the scoring model.

## Reviewed evidence contracts

- `ROE_ANNUAL` / Trendlyne `ROE_A` — evidence mapping reviewed.
- `PE_TTM` / Trendlyne `PE_TTM` — evidence mapping reviewed, but valuation scoring remains `DRAFT` until peer and self-history benchmark series exist.
- `NET_PROFIT_TTM` / Trendlyne `NP_TTM` — evidence mapping reviewed, but growth scoring remains non-score-ready until the required historical series/normalization exists.

For `BANK_NBFC`, the existing ROE normalization bands are retained and the ROE rules in Quality and Capital Efficiency are promoted to `REVIEWED`.

## Deliberately unchanged

- `REVENUE_TTM` remains `PROVISIONAL` because bank revenue semantics need a bank-specific reviewed contract.
- `CFO_ANNUAL` remains `PROVISIONAL` and is not used for Bank/NBFC scoring.
- `MARKET_CAP_PROVIDER_RAW` remains `PROVISIONAL`/secondary because Trendlyne is not PortfolioAI's current-price authority.
- `PBV_ADJUSTED_PROVIDER` remains quarantined/conflicting and must not be treated as generic P/B.

## Safety

This change is metadata/policy only. It makes no Trendlyne calls, performs no canonical observation rewrites, creates no official score run, and does not activate the scoring model or mutate portfolio roles.
