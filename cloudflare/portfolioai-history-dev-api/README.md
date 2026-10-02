# PortfolioAI Development Historical Data Gateway

Permanent online server-side adapter for immutable P8 historical data stored in Cloudflare R2.

## Bound resources

- R2 binding: `HISTORY_BUCKET` -> `portfolioai-history-dev`
- Supabase Auth authority: PortfolioAI Dev (`lrgpjimipfkyoqbpsqzz`)
- Secret: `SUPABASE_PUBLISHABLE_KEY` (configured in Cloudflare, never committed)

## Endpoints

- `GET /v1/health` — public operational health only; no market rows are returned.
- `GET /v1/catalog` — authenticated; serves the immutable R2 dataset catalog when S4 export is complete.
- `GET|HEAD /v1/object?key=...` — authenticated; reads only keys beneath `portfolioai-history/development/p8/`; supports byte ranges.

This Worker is Development-only. It must never bind to the Production bucket or Production Supabase project.
