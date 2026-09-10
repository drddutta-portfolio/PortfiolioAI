# Stage 7.2D.2B.3 — MCP Capability Discovery

## Finding

The second controlled HDFCBANK contract-discovery run completed with correct PortfolioAI accounting and capture, but every returned search result was the provider text `Unknown tool: 'search_parameters'`. This means the transport returned successfully while the connected Trendlyne MCP endpoint did not expose the expected tool under that exact name.

Trendlyne's public MCP documentation currently lists `search_parameters` and `get_parameter_values`, but production behavior is authoritative for the configured endpoint. No further provider tool call should be attempted until the actual tool list exposed by that endpoint is observed.

## Safe diagnostic

Add a separate owner-authenticated Edge Function, `discover-trendlyne-capabilities`, that performs MCP protocol capability discovery only:

- owner-authenticated portfolio and held-equity context;
- verified Trendlyne identity required;
- provider entitlement and ingestion controls required;
- reserve exactly one internal safety unit before external MCP transport;
- initialize MCP session and issue `tools/list` only;
- never issue `tools/call`;
- never call `search_parameters` or `get_parameter_values`;
- record one `TRANSPORT_BOOTSTRAP` usage event;
- settle the one-unit reservation;
- persist the returned tool list as bounded immutable raw provider evidence with record kind `MCP_CAPABILITY_DISCOVERY`;
- maximum serialized capture 256 KiB;
- no canonical metric or research promotion;
- no writes to `fundamental_observations` or `research_documents`.

## Interpretation

The captured tool list is diagnostic evidence only. It must be reviewed against Trendlyne's published documentation before any client method name or input schema is changed.

## Rollback

No schema migration is introduced. The new diagnostic function is additive and independent of `discover-trendlyne-contract`. If it behaves unexpectedly, do not invoke it again; reconcile its run/reservation read-only and leave the prior production functions untouched. Removing or not deploying the additive diagnostic function restores the pre-change behavior.
