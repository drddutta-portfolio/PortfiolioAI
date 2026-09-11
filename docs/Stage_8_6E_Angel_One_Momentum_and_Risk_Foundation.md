# Stage 8.6E — Angel One Momentum and Risk Foundation

## Goal
Make the HDFCBANK reference stock's Momentum and Risk dimensions score-ready from PortfolioAI's market-data authority rather than Trendlyne technical scores.

## Authority and evidence
- Angel One remains the authority for current and historical market prices.
- `market_price_history` remains the canonical raw daily OHLCV store.
- New `market_metric_observations` stores deterministic derived market evidence with derivation metadata, freshness and RLS.
- No Trendlyne Momentum Score is promoted into PortfolioAI scoring.

## Reviewed BANK_NBFC scoring inputs
Momentum can become scoreable from:
- 12-month close-to-close price momentum — 40% dimension weight.
- 6-month close-to-close price momentum — 30% dimension weight.
- 12-month relative strength — remains pending until benchmark history is available.

Risk can become scoreable from:
- Gross NPA — 25%.
- Net NPA — 25%.
- 1-year maximum close-to-close drawdown — 20%.
- 1-year volatility — stored when available but remains pending because the current rule requires a Bank/NBFC benchmark series.
- Rating trend — remains draft.

Thus HDFCBANK can cross the 60% dimension gate for both Momentum and Risk without inventing benchmark data.

## Historical refresh
`refresh-market-history` is an authenticated single-security owner-confirmed pilot. PLAN consumes zero provider calls. EXECUTE requires a verified Angel One mapping and an open equity holding, acquires the Stage 4 provider lease, requests 400 calendar days of ONE_DAY candles, upserts canonical OHLCV, derives market metrics, and writes a refresh audit row.

The refresh does not create an official score run and does not change any portfolio role.

## Derivations
- 12M / 6M momentum: close-to-close total return using the first trading day on or after the calendar lookback target, with a 14-day tolerance.
- Max drawdown: maximum peak-to-trough decline in daily closing prices over the trailing year.
- Volatility: annualized sample standard deviation of daily log returns using sqrt(252).

## Remaining market work
- Add a canonical benchmark series (for example NIFTY Bank for BANK_NBFC) before enabling Relative Strength or relative Volatility scoring.
- Generalize the reviewed market contract beyond the HDFCBANK/BANK_NBFC pilot only after the pilot is validated.
