# Stage 8.1C — Live Bank Metric Mapping Result

The one-call HDFCBANK Trendlyne discovery run succeeded and was captured immutably. It consumed exactly one provider-tool unit and left no unsettled reservation.

Exact HDFCBANK fields verified from the live response:

- `Gross NPA ratio Qtr %` = 1.17
- `Net NPA ratio % Qtr` = 0.41
- `EPS Qtr YoY Growth %` = 18.37

These three provider labels are approved for the Bank/NBFC V1 scoring contract and mapped to:

- `GROSS_NPA_PERCENT`
- `NET_NPA_PERCENT`
- `EPS_GROWTH_YOY`

The following requested concepts remain `PENDING_SOURCE` because the response did not provide an exact, semantically safe mapping:

- NIM
- CET1
- capital adequacy ratio
- ROA
- advances growth YoY
- deposits growth YoY

`Key Performance Tier1 Ann. %` must not be assumed to equal CET1 without provider/primary-source confirmation. `Capital Adequacy BaseII Qtr %` returned zero across the cohort and is not approved as a usable CAR contract.

The scoring model remains DRAFT. No score is calculated by this stage and no Core/Satellite assignment is made.
