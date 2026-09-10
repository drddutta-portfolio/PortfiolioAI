# Stage 8.1B — Bank Metric Contract Discovery

## Purpose

Discover the exact production Trendlyne labels for the Bank/NBFC scoring inputs that are still `PENDING_SOURCE`, using the already-proven `get_parameter_values_multi_stock` MCP contract.

## Scope

The pilot is restricted to the already verified held equity `HDFCBANK` and makes exactly one provider tool call requesting:

- net interest margin;
- gross NPA percent;
- net NPA percent;
- CET1 ratio;
- capital adequacy ratio;
- return on assets;
- advances growth YoY;
- deposits growth YoY;
- EPS growth YoY.

The query includes both `HDFC Bank` and `HDFCBANK` to reduce entity ambiguity.

## Safety boundary

- owner-authenticated only;
- owned portfolio and open holding required;
- HDFCBANK-only hard gate;
- existing matched Trendlyne provider identity required;
- provider entitlement and ingestion controls required;
- reserve exactly 1 internal unit before provider client construction;
- one `get_parameter_values_multi_stock` provider attempt, no automatic retry;
- one append-only provider usage event;
- deterministic reservation settlement;
- raw result captured immutably in `data_source_records` as `BANK_SCORING_CONTRACT_DISCOVERY`;
- 512 KiB capture limit;
- zero canonical fundamental writes;
- zero scoring writes;
- zero scoring-model activation;
- zero Core/Satellite assignment.

## Acceptance

After one live invocation, reconcile:

1. provider usage increases by exactly one;
2. no unsettled reservation remains;
3. one discovery run and one raw capture exist;
4. `fundamental_observations` count is unchanged by the discovery call;
5. `stock_score_runs` remains unchanged;
6. inspect exact returned labels and values before changing any `PENDING_SOURCE` scoring rule.

No second invocation is permitted until the first run is reconciled.
