# Stage 7.2D.2B.3 — Trendlyne Metric Mapping and Quota Policy

## Production evidence

The controlled HDFCBANK pilot successfully called the production-observed Trendlyne MCP tool `get_parameter_values_multi_stock` once and captured the response as `OBSERVED_CONTRACT_DISCOVERY_RESULT` without canonical research/fundamental writes.

The response confirmed these useful provider labels for HDFCBANK:

| PortfolioAI use | Provider label | Example value | Proposed period | Proposed unit | Mapping state |
| --- | --- | ---: | --- | --- | --- |
| Current annual ROCE | `ROCE Ann. %` | 6.75 | YEAR | PERCENT | REVIEW_CANDIDATE |
| Diluted EPS, latest quarter | `Diluted EPS Qtr` | 12.47 | QUARTER | INR_PER_SHARE | REVIEW_CANDIDATE |
| EBITDA trailing twelve months | `EBITDA TTM` | 293893.13 | TTM | INR_CRORE | REVIEW_CANDIDATE |
| Operating profit margin trailing twelve months | `OPM TTM %` | 35.14 | TTM | PERCENT | REVIEW_CANDIDATE |

These are intentionally review candidates only. No automatic promotion is authorized by this document.

## Canonical-code policy

`EPS_DILUTED` already exists in `fundamental_metric_definitions`; `period_type=QUARTER` is required for `Diluted EPS Qtr` so that it cannot be confused with annual or TTM EPS.

The following proposed codes do not yet exist in the canonical metric registry and therefore MUST NOT be written to `fundamental_observations` until a separately reviewed migration registers them:

- `ROCE_ANNUAL`
- `EBITDA_TTM`
- `OPM_TTM`

The mapper introduced in this stage only extracts provider evidence into typed review candidates. It does not insert or update canonical fundamentals.

## Semantic guardrails

The query can return many related fields. Exact-label matching is mandatory; fuzzy matching is prohibited for promotion.

Examples that MUST remain distinct:

- `ROCE Ann. %` vs `ROCE Ann. 3Y Avg %` vs `ROCE Ann. 5Y Avg %`;
- `Diluted EPS Qtr` vs basic EPS or growth percentages;
- `EBITDA TTM` vs `EBITDA Qtr`, historical-quarter EBITDA, or EBITDA margin;
- `OPM TTM %` vs quarterly OPM, annual OPM, EBITDA margin, or OPM change.

`None`, missing values, malformed numbers, absent stock symbols, or ambiguous duplicate exact sections must fail closed for that metric.

## Period-date requirement

The provider response identifies the stock and retrieval date but does not, by itself, prove the fiscal period-end date for every returned metric. Before canonical promotion, PortfolioAI must either:

1. derive the fiscal period end from a provider field whose semantics explicitly encode it; or
2. store the observation with a defensible period model approved in the architecture.

Do not invent quarter-end or financial-year-end dates from the retrieval date.

## Trendlyne quota policy

Owner-confirmed Pro entitlement: 400 provider calls/day and 2,000 calls/month.

PortfolioAI currently has 249 open holdings. A once-per-month fundamental refresh using one bundled `get_parameter_values_multi_stock` call per holding would consume about 249 calls/month, only 12.45% of the stated monthly quota. Spread across a month, that is roughly 8–9 calls/day on average.

Therefore monthly refresh is the default cadence for slow-changing Trendlyne fundamentals. Daily refresh of all holdings is unnecessary.

### Internal safety budget

Do not automatically raise PortfolioAI's existing conservative provider-control limits merely because the provider entitlement is higher. The current internal limits remain a safety buffer until the monthly scheduler and observed call economics are proven in production.

Recommended operating pattern:

- fundamentals: monthly per held stock;
- shareholding: monthly or after a new reported quarter;
- documents/news: event-driven or selective, not full-portfolio daily polling;
- provider current price: disabled as price authority; Angel One remains authoritative;
- stagger full-portfolio refreshes across days rather than producing a single large burst;
- cache and reuse fresh observations until their freshness window expires.

Even two Trendlyne tool calls per stock per month would be about 498 calls/month for the current 249-stock portfolio, leaving substantial headroom below 2,000.

## Next gate

1. validate the exact-label review mapper;
2. review the four proposed canonical meanings and units;
3. add missing canonical metric definitions only through a separate migration/PR;
4. pilot canonical parsing on one held equity with no broad cohort expansion;
5. only after reconciliation, design the staggered monthly portfolio refresh scheduler.
