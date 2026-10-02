# PortfolioAI Development Historical Data Gateway

Permanent online server-side adapter for immutable P8 historical data stored in Cloudflare R2.

## Bound resources

- R2 binding: `HISTORY_BUCKET` -> `portfolioai-history-dev`
- Environment: Development only
- Public surface contains sanitized public-market data only. Private backup files, internal portfolio IDs, experiment IDs, source archive IDs and canonical Parquet objects are not directly exposed.

## Endpoints

- `GET /v1/health` — operational health and verified-backup presence.
- `GET /v1/catalog` — sanitized dataset/runtime catalog.
- `GET /v1/raw-prices?symbol=RELIANCE&series=EQ&from=2024-01-01&to=2024-12-31` — sanitized historical daily market-price rows loaded from the R2 runtime projection.

The canonical evidence representation remains private, versioned Parquet under `portfolioai-history/development/p8/`. The runtime JSON projection is derived from exactly the same verified backup and contains only market-data fields needed by the application.

This Worker is Development-only. It must never bind to a Production bucket or Production Supabase project.
