# PortfolioAI News Refresh Recovery — 15 October 2026

## Observed failure
The Development Supabase database contained 251 canonical news items, latest publication 26 September 2026; last NSE ingestion run was 26 September 2026. NEWS policy V7 was enabled at 30 minutes, but `cron.job` contained **no news jobs**, only two unrelated banking schedules. Vault contained none of the three scheduler credentials required by the original NEWS wrapper. The Dashboard misleadingly said “Live” for cached content.

## Development implementation
- `20261015191500_restore_news_refresh_scheduler.sql`: versioned, forward-only migration to persist 1/3/6/12-hour per-portfolio refresh, default 6; RLS checks ownership; authenticated operational readback; one hourly NEWS dispatcher and hourly stored-evidence classifier. The old 30-minute NEWS job names are retired if present. Banking cron jobs remain untouched.
- `src/data/newsRefreshRepository.ts`: typed shared owner preference/status data authority.
- `DashboardNewsPreview`: frequency selector, true last scheduled scan, alert on failed/stale status. “Live” misleading claim removed. UI polls cached news and scheduler status every five minutes; no browser NSE calls.
- `run-nse-news-pipeline`: existing Edge environment token supported; service-only Vault token-verification RPC is the fallback. Retains source matching, leases, deduplication, import accounting, bounded document work, JWT validation and no AI.
- `DashboardNewsRefresh.test.ts`: regression contracts for the allowed intervals, server-only dispatch and stale labeling.

## Deployment prerequisites and acceptance
**Code committed; live deployment not yet accepted.** The repository's AGENTS.md requires explicit per-migration approval before executing database-changing operations. Therefore the migration is not applied in this work session.

Before enabling the hourly cron in Development:
1. Provision Vault names `portfolioai_nse_news_scheduler_token`, `portfolioai_publishable_key` (JWT-compatible legacy anon key) and `portfolioai_api_url`, with their corresponding valid secret values. Do not paste secrets into chat or GitHub.
2. Deploy `run-nse-news-pipeline` with `verify_jwt=true` after confirming dependencies and the RPC verifier.
3. Execute the versioned migration in Development only, verify exactly two NEWS cron entries, leave banking cron unchanged, confirm an actual authenticated Edge invocation and recent canonical news ingestion.
4. Test 1/3/6/12-hour preference edits and denied writes to another owner's portfolio; check zero duplicates on replay and visible stale state on failure.
5. Pass architecture, type checks, lint, tests and Vercel preview verification before marking accepted.

Source coverage stays official NSE corporate announcements for currently held NSE equities, not a general business-news aggregator. A successful scheduled scan may legitimately add zero articles; display the scan timestamp separately from the latest published article date.
