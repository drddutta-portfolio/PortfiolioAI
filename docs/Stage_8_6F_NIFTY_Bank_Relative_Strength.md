# Stage 8.6F — NIFTY Bank Relative Strength

## Goal
Complete the BANK_NBFC Momentum dimension for the HDFCBANK reference stock with an auditable benchmark-relative market signal.

## Authority
- Angel One remains the historical/current market-data authority.
- Trendlyne technical scores are not used.
- HDFCBANK raw daily OHLCV comes from `market_price_history`.
- NIFTY Bank raw daily OHLCV is retained separately in `market_benchmark_price_history`.

## Benchmark identity
`NIFTY_BANK` is resolved from the current Angel One instrument master at execution time. Only exact accepted aliases (`NIFTY BANK`, `BANKNIFTY`) on NSE are allowed, and exactly one provider token must resolve before history can be fetched. The token is not hardcoded.

## Relative-strength derivation
`RELATIVE_STRENGTH_12M = HDFCBANK 12M close-to-close return - NIFTY Bank 12M close-to-close return`.

The stock and benchmark use the latest common trading date and the first common trading date on/after the 365-day target, with a 14-day tolerance. The resulting metric is stored in `market_metric_observations` with complete derivation metadata.

## Scoring
The existing BANK_NBFC Relative Strength rule becomes REVIEWED and uses its existing 30% Momentum weight and deterministic bands. This can move Momentum coverage from 70% to 100% and should move HDFCBANK overall score-ready coverage above the 70% gate if all other mandatory gates remain satisfied.

## Safety
- PLAN uses zero Angel One historical calls.
- EXECUTE uses one NIFTY Bank historical call.
- HDFCBANK history must already exist locally; it is not fetched again.
- No official score run is created.
- No portfolio holding, target, or Core/Satellite role is changed.
