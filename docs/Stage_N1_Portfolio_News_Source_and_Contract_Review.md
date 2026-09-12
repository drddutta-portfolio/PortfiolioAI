# Stage N1 — Portfolio News Source and Contract Review

**Status:** Architecture/source review complete; implementation not started  
**Branch:** `news-intelligence`  
**Base:** `main` at `d51cbf68e628a91bff5d78817346ce9525db5565`

## 1. Goal

Add a holding-specific Portfolio News Intelligence capability without turning the Dashboard into a live web scraper and without bypassing PortfolioAI provider controls, provenance, deduplication, or financial-integrity rules.

The target user experience is:

> Important news about current holdings appears automatically on the Dashboard from a cached server-side feed. The browser does not scrape providers directly and the user does not need to press Refresh.

## 2. Canonical constraints

PortfolioAI development rules require:

- one bounded feature at a time;
- no fabricated financial facts, catalysts, research, or sources;
- Supabase for structured frequently accessed intelligence;
- incremental ingestion and deduplication;
- unchanged data must not be repeatedly processed;
- hashes/source identifiers should be retained where useful;
- provider keys and privileged credentials must never be exposed in browser code;
- material architecture changes are documented before implementation.

The Research and Intelligence Architecture also requires raw evidence, deterministic normalization/classification, scores/states, and later AI explanation to remain distinct layers with explicit provenance.

## 3. Trendlyne MCP finding

PortfolioAI already has production-observed evidence that the configured Trendlyne MCP endpoint exposes:

- `search_entities`
- `get_parameter_values_multi_stock`
- `get_overview_news_corp_events`
- `get_ownership_deals_insider_sast`
- `get_document_search_results`

The existing observed-contract adapter already defines:

```text
getOverviewNewsCorpEvents(stockCode, type)
```

where `type` can be `overview`, `technical`, `news`, or `events`.

Therefore Trendlyne news support is **not hypothetical** for the configured PortfolioAI endpoint. It is an observed production capability.

Trendlyne's current public MCP documentation independently confirms that its “Get Overview, News & Corporate Events” capability includes a **News** view for company news and announcements and an **Events** view for dividends, board meetings, splits, bonus issues, rights issues and other corporate actions.

## 4. Recommended source strategy

### N1 decision

Use **Trendlyne MCP as the first approved news-ingestion source** for the initial Portfolio News Intelligence implementation.

Reasons:

1. The configured PortfolioAI MCP endpoint already exposes the required tool.
2. PortfolioAI already has a hardened observed-contract adapter and provider accounting/control-plane patterns for Trendlyne.
3. Trendlyne resolves company-specific news in the same provider identity domain already used for company research.
4. It avoids uncontrolled client-side scraping.
5. The first implementation can remain bounded and auditable.

### Future source hierarchy

The architecture should allow later source expansion without changing the canonical news model:

1. **Official exchange/company announcements** — highest authority for filings and corporate actions when a reliable approved ingestion contract is implemented.
2. **Trendlyne MCP** — primary initial aggregated company-news source.
3. **Company investor-relations / official press releases** — secondary primary-source enrichment when contractually and technically appropriate.
4. **Reputable financial media** — optional later supplemental source.
5. **General web search** — discovery/fallback only, not the initial canonical scheduled ingestion source.

No multi-source web scraping should be built in Stage N2.

## 5. Provider-control requirement

News ingestion must use the Stage 7.2A provider-control pattern rather than calling Trendlyne directly from the Dashboard.

Every external Trendlyne news interaction must preserve:

- server-side provider identity/entitlement checks;
- reservation before external provider work;
- provider-usage event recording;
- reservation settlement/release;
- bounded retries;
- explicit provider failure states;
- source/retrieval timestamps;
- no browser-side provider credentials.

PortfolioAI internal safety accounting remains intentionally separate from Trendlyne's own billing/dashboard counters.

## 6. Initial ingestion model

The first functional release should use:

```text
Scheduled server-side job
  → current eligible held equities
  → canonical Trendlyne stock identity
  → get_overview_news_corp_events(type = news)
  → parse bounded returned records
  → normalize
  → deduplicate
  → persist cached news items
  → Dashboard reads cache only
```

The browser must not trigger one Trendlyne call per holding on page load.

## 7. Proposed canonical news record

Stage N2 should design an additive table around fields equivalent to:

- `id`
- `security_id`
- `provider_id`
- `provider_security_identity`
- `source_name`
- `source_url` when supplied
- `headline`
- `summary` when supplied and permitted
- `published_at`
- `retrieved_at`
- `news_category`
- `importance_state`
- `provider_record_id` when available
- `content_hash`
- `dedupe_key`
- `raw_evidence_id` or reproducible source reference where appropriate
- `created_at`
- `updated_at`

The exact schema is deferred to Stage N2 and must be reviewed before migration.

## 8. Deduplication policy

News must be incremental and idempotent.

Initial deterministic duplicate checks should prefer, in order:

1. provider-native unique record ID if available;
2. canonical source URL + security;
3. normalized headline + publication timestamp/date + security;
4. stable content hash.

A repeated scheduled ingestion must not create duplicate Dashboard stories.

## 9. Importance and category policy

The initial version should avoid AI-dependent relevance ranking.

Use deterministic categories/states first, for example:

- Results
- Corporate Action
- Regulatory / Exchange Filing
- Management
- Order / Contract
- Fund Raising
- M&A / Investment
- Credit Rating
- Shareholding / Insider
- Litigation / Governance
- General Company News

Importance should initially be rule-based and conservative. Missing classification should remain `GENERAL`/`UNCLASSIFIED`, not be guessed by AI.

## 10. Dashboard behaviour

The already-created Dashboard placeholder can later become a cached read-only panel.

Initial UX target:

- latest/high-priority 8–12 holding-specific items;
- Portfolio Scope filtering;
- security ticker/company;
- headline;
- category;
- source;
- publication age/time;
- link to source where available;
- link to PortfolioAI Research page;
- no manual provider refresh button required.

Automatic visual updates can initially use lightweight cache polling. Supabase Realtime may be considered later only if it materially improves the experience.

## 11. Scheduling recommendation

Start conservatively with a **60-minute scheduled ingestion cadence during normal operation** rather than every page view.

The cadence must be configurable and quota-aware. It should not blindly call the provider for every held security every hour if quota/budget policy makes that wasteful.

Stage N2/N3 should define batching, eligible-security selection, last-success timestamps, and change-aware refresh rules before production deployment.

## 12. AI boundary

AI is **not required** for initial news ingestion.

Later AI may:

- summarize already stored source-backed news;
- group related stories;
- explain why a development may matter to an existing investment thesis;
- prepare a daily portfolio-news digest.

AI must not invent a headline, source, event, catalyst, impact, or recommendation. Raw provider evidence and deterministic classifications remain separately inspectable.

## 13. Stage gates

### Stage N1 — Source/contract review

**Complete with this document.**

Outcome: Trendlyne MCP is technically viable and recommended as the initial scheduled news source because the production-observed PortfolioAI endpoint exposes `get_overview_news_corp_events` with `type = news`.

### Stage N2 — Canonical News Data Model & Security Plan

Next stage. Define additive schema, RLS/read model, dedupe keys, provider-control flow, retention, and Dashboard query contract. No migration should be applied until reviewed.

### Stage N3 — Controlled Trendlyne News Pilot

After N2 approval, implement a tightly bounded owner-controlled pilot for one held security. Validate actual response shape, source fields, timestamps, provider accounting, parsing, and deduplication before scheduling anything.

### Stage N4 — Scheduled Portfolio Ingestion

Only after the single-security pilot succeeds. Add quota-aware scheduled ingestion for eligible holdings.

### Stage N5 — Dashboard News Panel

Replace the placeholder with cached read-only news. No provider call on Dashboard load.

### Stage N6 — Optional multi-source/AI enrichment

Official-source enrichment, media supplementation, related-story grouping and AI digest are future additive stages only.

## 14. Safety conclusion

No Supabase migration, Edge Function deployment, provider call, provider quota consumption, or production write is performed in Stage N1.

The next safe step is to design Stage N2's canonical news schema and access/control contract on this branch, then review it before any production migration.