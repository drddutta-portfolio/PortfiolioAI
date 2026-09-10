# Stage 7.2D.2B.3 — Controlled Trendlyne Contract Discovery Pilot

## Purpose

Run a narrowly bounded subscribed-provider discovery against one already verified held equity so PortfolioAI can observe the exact MCP parameter metadata for four high-priority missing research metrics:

- ROCE
- diluted EPS
- EBITDA
- operating margin

## Safety boundary

This slice:

- performs parameter discovery only;
- does not call `get_parameter_values` yet;
- does not write research evidence;
- does not modify metric definitions;
- does not widen Cohort A;
- does not enable manual refresh execution;
- does not change any portfolio, accounting, role, theme or market-price data.

The discovery function authenticates the owner, validates the portfolio and open held equity, requires an existing matched Trendlyne provider identity, then issues at most the four approved `search_parameters` calls. The provider responses are returned for review only.

### Stage 7.2A accounting correction

The initial PR #5 implementation was intentionally stopped before deployment after a safety review found that its direct provider calls did not pass through the already-deployed Stage 7.2A provider-control accounting boundary.

The corrected endpoint therefore performs the following operational writes even though it still performs **zero research-evidence writes**:

1. verifies the trusted source and provider ingestion control before provider-client construction;
2. creates one bounded `data_ingestion_runs` record and one `data_ingestion_run_items` record for the selected security;
3. reserves exactly four internal provider-attempt units through `reserve_provider_budget_v1`;
4. constructs the Trendlyne MCP client only after the reservation succeeds;
5. records one append-only `provider_usage_events` entry for every physical `search_parameters` attempt, including a failed attempt;
6. settles the reservation through `settle_provider_budget_v1`, accounting for consumed, failed and unused/released units;
7. records the terminal run-item and ingestion-run outcome.

If the kill switch, daily/rolling/per-run ceiling, or provider-wide concurrency gate blocks the reservation, the endpoint makes **zero provider calls**. If execution stops before all four searches complete, only attempted calls are accounted and the remaining reserved units are released.

This correction requires no schema migration and does not alter the Stage 7.2A limits or the provider quota assumption. Trendlyne's actual contractual quota remains `UNKNOWN`.

## Acceptance

Before deployment:

```bash
npm test
npm run typecheck
npm run lint
npm run lint:edge
npm run test:edge
npm run build
git diff --check
```

The Edge regression suite must additionally prove that:

- `reserve_provider_budget_v1` is reached before `TrendlyneMcpClient` construction;
- `record_provider_usage_event_v1` is present for physical attempts;
- `settle_provider_budget_v1` accounts consumed, failed and released units;
- the endpoint contains no fundamental-observation or research-document writes.

After deployment, invoke once against a previously verified Cohort A equity. For a successful invocation, confirm:

- observed provider usage rises by exactly four attempts;
- the corresponding reservation is `SETTLED` with four consumed units, zero failed units and zero released units;
- the contract-discovery run and run item are terminal and successful;
- fundamental observations, research documents and other research-evidence counts do not change.

Only after reviewing the returned parameter metadata may any executable field name be promoted into `TRENDLYNE_PARAMETER_CONTRACT_V1` or used by `get_parameter_values`.
