# Stage N3 — Controlled Trendlyne News Pilot Preparation

**Status:** Code prepared on branch; not migrated, not deployed, not invoked  
**Branch:** `news-intelligence`

## 1. Goal

Prepare the smallest safe live-news experiment needed to observe the real Trendlyne `get_overview_news_corp_events(type='news')` response for one current held equity, while preserving PortfolioAI provider controls and avoiding premature parser assumptions.

## 2. Prepared artifacts

### Additive migration

`supabase/migrations/20260912220000_create_news_intelligence_pilot_foundation.sql`

Prepared but not applied. It adds:

- `news_items` normalized cache table;
- `news_source_appearances` provenance table;
- indexes and bounded field constraints;
- no direct browser table privileges;
- owner-scoped read-only `get_portfolio_news_feed_v1(...)` RPC;
- `TRENDLYNE_MCP / NEWS` refresh-domain policy V2 for owner-controlled N3 pilot use;
- no scheduler enablement;
- no transaction/accounting/scoring/recommendation/AI changes.

The migration does not mutate `provider_ingestion_controls` directly. Any future provider-control change must use the audited Stage 7.2A control path.

### Pilot Edge Function

`supabase/functions/pilot-trendlyne-news/index.ts`

Prepared but not deployed. It:

1. requires an authenticated owner;
2. verifies portfolio ownership;
3. requires a current open held equity;
4. requires a verified Trendlyne provider identity;
5. verifies Trendlyne source entitlement/retention state;
6. requires global ingestion enabled;
7. refuses to run if Trendlyne scheduling is enabled;
8. requires reviewed NEWS policy V2 or later to be active;
9. creates one ingestion run and one NEWS run item;
10. reserves exactly one provider business-tool unit before provider work;
11. makes exactly one business call: `get_overview_news_corp_events(stock_code, 'news')`;
12. makes no search/fallback provider call;
13. records one provider tool-attempt usage event;
14. captures the bounded raw provider result in `data_source_records` as `NEWS_PILOT_RESPONSE`;
15. settles the reservation;
16. writes zero normalized news rows;
17. does not promote a parser contract;
18. does not update Dashboard behavior.

MCP initialize/session transport remains implementation overhead of the existing observed client; the N3 safety unit is specifically the single business-tool attempt.

## 3. Why normalization is deliberately disabled

The real provider payload shape has not yet been observed for PortfolioAI's configured endpoint. N3 therefore stops after safe raw capture.

The pilot must not guess:

- story identifier field;
- headline field;
- source/publisher field;
- article URL field;
- publication timestamp shape/timezone;
- whether the response is JSON text, tabular text, nested records, or another provider-specific representation.

After one successful pilot, the captured response is reviewed and only then is the parser/deduplication mapping implemented.

## 4. Production safety gate

Nothing in this stage is active merely because it exists in GitHub.

Before a live pilot, explicit owner approval is required for:

1. applying the additive migration to production Supabase;
2. deploying `pilot-trendlyne-news`;
3. selecting exactly one held equity for the pilot;
4. invoking the function once, consuming at most one provider business-tool attempt;
5. reconciling the resulting reservation, usage event, ingestion run, and raw capture.

No scheduler should be enabled during N3.

## 5. Expected successful pilot evidence

A successful live run should produce:

- one `data_ingestion_runs` row with `operation = NEWS_PILOT`;
- one `data_ingestion_run_items` row with `data_domain = NEWS`;
- one provider budget reservation settled with one consumed unit;
- one `provider_usage_events` row for `GET_OVERVIEW_NEWS_CORP_EVENTS`;
- one bounded `data_source_records` raw capture with `record_kind = NEWS_PILOT_RESPONSE`;
- zero `news_items` rows created by the pilot;
- zero `news_source_appearances` rows created by the pilot;
- scheduler still disabled.

## 6. Stop conditions

Stop after the single call and do not retry automatically if any of the following occur:

- provider tool contract error;
- unexpected result shape;
- capture too large;
- accounting write failure;
- budget settlement failure;
- provider identity conflict;
- scheduler unexpectedly enabled;
- NEWS policy not active/reviewed.

The existing cached application remains unaffected.

## 7. Next gate

After the code is locally validated, the next decision is **not** to schedule news. The next decision is whether to apply/deploy this controlled pilot foundation to production.

Only after one live response is captured and reviewed should PortfolioAI add:

- concrete parser contract;
- deterministic deduplication implementation;
- normalized news writes;
- freshness-state updates;
- scheduled portfolio-wide ingestion;
- Dashboard live cached-news rendering.
