# Development news refresh audit — 15 October 2026

- News cache: 251 items; newest 26 September 2026.
- Latest `NSE_NEWS_PIPELINE` scheduled run: 26 September 2026.
- Development `cron.job` contains no news jobs; only unrelated banking jobs.
- The existing NEWS policy remains enabled at 1800 seconds, yet without cron triggers.
- Vault lacks the three news scheduler secret names required by the original scheduler wrapper.
- Dashboard News incorrectly shows a Live indicator for historical cached items.

Required remediation: recover a server-only authenticated NSE ingestion scheduler and preserve the existing canonical news matching, source lineage and deduplication. Use 6 hours by default, with per-portfolio, owner-adjustable 1/3/6/12 hour intervals, backed by an hourly pg_cron dispatcher, RLS, and visible last-run status. Implement a forward-only migration and tests. Do not mutate production/main. Completion requires actual job and latest-article readbacks.
