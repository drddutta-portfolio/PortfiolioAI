# Stage 7.2D.2B.3 — Non-financial parser and controlled promotion

The exact-entity V2 discovery produced one immutable capture each for INFY, M&M and TORNTPHARM, with the intended Trendlyne instrument as the first/primary entity.

## Approved exact mappings

| Provider label | Canonical metric | Unit | Period type |
|---|---|---|---|
| `ROCE Ann. %` | `ROCE_ANNUAL` | `PERCENT` | `YEAR` |
| `OPM TTM %` | `OPM_TTM` | `PERCENT` | `TTM` |
| `Promoter holding pledge percentage % Qtr` | `SHAREHOLDING_PROMOTER_PLEDGE_PERCENT` | `PERCENT_OF_PROMOTER_HOLDING` | `QUARTER` |

The mapper first validates the provider instrument id and symbol on the first entity row, then accepts exactly one value from exactly one matching provider section. Nearby companies in the provider result are ignored.

## Explicitly not promoted yet

`Net Profit 3Y Growth %`, `Cash EPS 3Y Growth %`, `Operating Cash Flow 3Y Growth %`, Trendlyne `Momentum Score`, and other useful fields remain evidence only until their PortfolioAI semantics are separately reviewed. Trendlyne Momentum Score is not PortfolioAI's canonical momentum authority; market-derived momentum remains an Angel One/PortfolioAI calculation.

## Promotion endpoint

`promote-trendlyne-nonfinancial-capture-v2` is owner-authenticated and portfolio-scoped. It verifies open holdings, reviewed profile assignments, matched Trendlyne identities, exact V2 captures and canonical units. It then idempotently promotes only the three mappings above for INFY, M&M and TORNTPHARM.

It performs **zero provider calls**, creates **zero score runs**, invents **no period-end dates**, and makes **no Core/Satellite or portfolio-role changes**.
