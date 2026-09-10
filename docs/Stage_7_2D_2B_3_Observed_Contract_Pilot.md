# Stage 7.2D.2B.3 — Observed Contract Pilot

## Purpose

Run one controlled structured-data call against the production-observed Trendlyne MCP tool contract without changing canonical portfolio research data.

## Provider contract

The live capability-discovery run exposed `get_parameter_values_multi_stock(query, type)`. The pilot uses that tool exactly once with the verified held-equity symbol and the four requested metrics: ROCE, diluted EPS, EBITDA, and operating margin.

## Safety boundary

- owner-authenticated portfolio request;
- open held equity only;
- matched Trendlyne identity required;
- entitlement/retention/provider controls required;
- exactly one internal unit reserved before constructing the provider client;
- exactly one `get_parameter_values_multi_stock` call;
- one `PROVIDER_TOOL_ATTEMPT` accounting event;
- deterministic reservation settlement;
- bounded 512 KiB raw evidence capture in existing `data_source_records`;
- no writes to `fundamental_observations` or `research_documents`;
- no canonical metric promotion;
- no retry.

## Rollback

The function is additive and introduces no schema migration. If the pilot behaves unexpectedly, do not invoke it again. Existing production functions and the legacy enrichment adapter remain untouched. Removing or not deploying `discover-trendlyne-observed-contract` restores the pre-pilot runtime surface. Captured diagnostic evidence should remain for audit unless a separate owner-approved retention action is required.

## Expected reconciliation

A successful invocation should add exactly one provider usage event, one settled reservation, one terminal run/run item, and one `OBSERVED_CONTRACT_DISCOVERY_RESULT` capture row, while canonical research/fundamental counts remain unchanged.
