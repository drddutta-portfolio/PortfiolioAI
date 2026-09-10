# Stage 7.2D.2B.3 — Observed Trendlyne MCP Contract

## Production finding

A guarded MCP `tools/list` capability-discovery run against the configured Trendlyne endpoint succeeded and exposed the following relevant tool names:

- `search_entities`
- `get_parameter_values_multi_stock`
- `get_overview_news_corp_events`
- `get_ownership_deals_insider_sast`
- `get_document_search_results`

The configured endpoint did not expose the legacy names `search_parameters` or `get_parameter_values` that the original adapter assumed.

## Safety interpretation

PortfolioAI internal provider-usage accounting is deliberately conservative and is not the same thing as Trendlyne's provider-side billing/dashboard counter. Internal accounting records attempted external provider interactions even when the provider rejects an unknown tool name. MCP protocol bootstrap and `tools/list` discovery may also be visible to PortfolioAI accounting without appearing as a billable financial-data tool call in the Trendlyne dashboard.

## Adapter change

Add an isolated observed-contract adapter instead of replacing the legacy adapter globally. This avoids breaking the already deployed enrichment path while the new contract is still under controlled review.

The observed adapter:

- uses the production-observed tool names and input schemas;
- adds text-level provider error detection so strings such as `Unknown tool:` cannot be counted as successful business responses;
- makes no provider call by itself;
- introduces no schema migration;
- does not alter canonical research/fundamental storage.

## Next gate

Before a new live structured-data pilot:

1. review and test the observed adapter;
2. wire only the dedicated contract-discovery path to it;
3. preserve reservation, usage-event, settlement, capture, and owner-authentication boundaries;
4. obtain explicit authorization for exactly one controlled provider tool call;
5. reconcile provider-side and PortfolioAI-side accounting separately.
