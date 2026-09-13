# Stage N2 — Canonical News Data Model & Security Plan

**Status:** Design complete; no migration or provider call applied  
**Branch:** `news-intelligence`  
**Base:** merged Dashboard `main` commit `d51cbf68e628a91bff5d78817346ce9525db5565`

## 1. Goal

Define the additive PortfolioAI schema, provenance, deduplication, RLS/read contract, provider-accounting flow, retention model, and Dashboard query contract for holding-specific Portfolio News Intelligence before any production migration or live Trendlyne news call.

Stage N2 is intentionally architecture-only. It does **not**:

- alter production Supabase;
- enable the currently disabled `NEWS` refresh domain;
- enable the Trendlyne scheduler;
- deploy an Edge Function;
- call Trendlyne;
- consume provider quota;
- replace the Dashboard placeholder.

## 2. Existing canonical capabilities reused

PortfolioAI already has the infrastructure required to avoid inventing a parallel ingestion system:

1. `data_sources` for provider identity, entitlement and retention rights.
2. `data_ingestion_runs` and `data_ingestion_run_items` for auditable orchestration.
3. `provider_budget_reservations` for reservation-before-provider-work.
4. `provider_usage_events` for immutable provider accounting.
5. `security_refresh_states` and `refresh_domain_policies` for freshness/cooldown state.
6. `data_source_records` for immutable raw provider evidence with SHA-256 payload deduplication.
7. verified Trendlyne security identity observations.
8. the production-observed Trendlyne method `get_overview_news_corp_events(stock_code, type='news')`.

The current Stage 7.2A policy already contains a `TRENDLYNE_MCP / NEWS` domain, but it is deliberately `DISABLED`. N2 preserves that state.

## 3. Design decision: canonical news is security-centric, not portfolio-specific

A news story describes a company/security, not one portfolio. The first implementation therefore stores normalized news against canonical `security_id` and derives portfolio visibility from current holdings.

This avoids:

- duplicating the same story for Core, Satellite and Themes;
- duplicating a story if the same security later appears in multiple portfolio scopes;
- coupling news history to a mutable portfolio classification.

Portfolio Scope remains a **read-time filter** in the Dashboard.

For V1, a normalized news item belongs to exactly one canonical security. Cross-security story grouping can be added later without changing the original evidence.

## 4. Proposed additive table: `news_items`

Purpose: store the normalized, bounded, Dashboard-safe representation of one news appearance for one canonical security.

Proposed columns:

| Column | Type | Rule / meaning |
| --- | --- | --- |
| `id` | uuid PK | generated UUID |
| `security_id` | uuid FK → `securities` | canonical PortfolioAI security |
| `canonical_key` | text | deterministic V1 dedupe identity; unique |
| `headline` | text | required, trimmed, bounded; never AI-generated |
| `summary` | text nullable | only provider-supplied/approved normalized summary; bounded |
| `category` | text | deterministic category enum |
| `importance_state` | text | conservative deterministic state |
| `published_at` | timestamptz nullable | provider/source publication timestamp if supplied; never fabricated |
| `publication_precision` | text | `DATETIME`, `DATE`, or `UNKNOWN` |
| `primary_source_name` | text nullable | publisher/source if supplied |
| `primary_source_url` | text nullable | source URL if supplied and validated |
| `first_seen_at` | timestamptz | first successful PortfolioAI ingestion |
| `last_seen_at` | timestamptz | most recent repeat appearance |
| `is_active` | boolean | false only for controlled retirement/hide policy; no hard deletion |
| `created_at` | timestamptz | audit timestamp |
| `updated_at` | timestamptz | audit timestamp |

### 4.1 Category contract

Initial allowed values should be deliberately bounded:

- `RESULTS`
- `CORPORATE_ACTION`
- `REGULATORY`
- `MANAGEMENT`
- `ORDER_CONTRACT`
- `FUND_RAISE`
- `MA_INVESTMENT`
- `CREDIT_RATING`
- `SHAREHOLDING_INSIDER`
- `LITIGATION_GOVERNANCE`
- `GENERAL`
- `UNCLASSIFIED`

Unknown/ambiguous stories remain `UNCLASSIFIED`. No AI is required.

### 4.2 Importance contract

Initial states:

- `UNCLASSIFIED`
- `ROUTINE`
- `NOTABLE`
- `IMPORTANT`

`IMPORTANT` must come only from deterministic rules defined in code/config. The initial release must not claim investment materiality merely because a headline sounds dramatic.

## 5. Proposed additive table: `news_source_appearances`

Purpose: preserve source/provider lineage separately from the normalized Dashboard item.

Proposed columns:

| Column | Type | Rule / meaning |
| --- | --- | --- |
| `id` | uuid PK | generated UUID |
| `news_item_id` | uuid FK → `news_items` | normalized item |
| `source_code` | text FK → `data_sources` | e.g. `TRENDLYNE_MCP` |
| `data_source_record_id` | uuid FK → `data_source_records` | immutable raw response/batch evidence |
| `provider_record_id` | text nullable | provider-native story identifier if present |
| `provider_security_identity` | text | verified Trendlyne stock identity used for request |
| `publisher_name` | text nullable | publisher/source as returned |
| `source_url` | text nullable | returned article/source URL |
| `headline_as_received` | text | bounded provider text |
| `summary_as_received` | text nullable | bounded provider text if returned/retention permitted |
| `published_at` | timestamptz nullable | as returned |
| `retrieved_at` | timestamptz | ingestion time |
| `content_hash` | text | SHA-256 of stable normalized appearance fields |
| `dedupe_key` | text | provider-specific appearance identity |
| `created_at` | timestamptz | immutable audit timestamp |

Recommended uniqueness:

```text
unique(source_code, dedupe_key)
```

This table should be append-only for browser users and should not expose privileged raw payloads.

## 6. Raw provider evidence remains in `data_source_records`

N2 does **not** create another raw-response table.

For a Trendlyne news request, the bounded provider response should be retained through the existing immutable `data_source_records` contract, for example:

```text
source_code      = TRENDLYNE_MCP
record_kind      = NEWS_RESPONSE
external_record_id = provider stock identity + bounded request identity when appropriate
payload_hash     = SHA-256
raw_payload      = bounded parsed JSON response
retrieved_at     = actual retrieval time
```

One raw response may contain multiple news stories. Each normalized `news_source_appearances` row may therefore reference the same `data_source_record_id`.

Raw payload retention remains governed by the already verified Trendlyne retention-rights state and future provider-contract review. The browser should not receive `raw_payload` through the Dashboard feed.

## 7. V1 deterministic deduplication policy

The goal is incremental ingestion: repeated scheduled runs must update `last_seen_at` or add a new source appearance rather than create duplicate Dashboard stories.

### 7.1 Provider appearance `dedupe_key`

Use the strongest available identity in this order:

1. provider-native story ID;
2. normalized canonical source URL;
3. normalized headline + exact provider publication timestamp;
4. normalized headline + publication date;
5. normalized headline + source/publisher + security + stable content hash.

### 7.2 Canonical `canonical_key`

V1 should be conservative and security-specific to avoid falsely merging unrelated stories:

```text
SHA256(
  security_id
  + normalized canonical source URL when available
  OR provider_record_id when stable
  OR normalized headline + normalized publication time/date
)
```

A future cross-security/related-story clustering layer can group stories without rewriting these V1 keys.

### 7.3 Normalization rules

Deterministic only:

- Unicode normalize;
- trim/collapse whitespace;
- lowercase only for key generation, not display;
- remove URL tracking parameters only through an allowlisted normalizer;
- never rewrite factual headline wording for display;
- never fabricate missing publication dates;
- never treat retrieval time as publication time.

## 8. Security matching contract

The ingestion request is already scoped to one known held security and must use the existing verified Trendlyne provider instrument identity.

For the initial pilot and scheduler:

- do not guess identity from company name;
- do not silently search for a substitute stock;
- if a verified Trendlyne stock identity is missing, mark the run item skipped/failed with a safe reason code;
- all parsed stories from that bounded response inherit the explicitly requested canonical `security_id`;
- provider text that appears to name a different company should be treated as conflicting evidence, not silently remapped.

This keeps V1 mapping deterministic.

## 9. RLS and browser access plan

### 9.1 Raw evidence

`data_source_records` stays inaccessible to ordinary browser clients under the existing Stage 7 provenance rules.

### 9.2 `news_source_appearances`

Recommended browser privileges: **no direct SELECT initially**. Source/provenance details exposed to the UI should be projected through a safe feed view/RPC.

### 9.3 `news_items`

Browser access is read-only and owner-scoped. No authenticated browser INSERT/UPDATE/DELETE.

Recommended policy principle:

> A user may see a normalized news item only when its `security_id` is an open transaction-derived holding in a portfolio owned by `auth.uid()`.

Do not authorize visibility merely because a security exists in the global security master.

## 10. Dashboard read contract

Prefer a dedicated read-only, security-invoker view or narrowly scoped RPC such as:

```text
get_portfolio_news_feed_v1(
  portfolio_id,
  security_ids optional,
  limit default 40,
  before optional
)
```

The operation must:

- derive/verify owner identity from `auth.uid()`;
- verify `portfolio_id` ownership;
- return news only for current open holdings of that portfolio;
- optionally restrict to a supplied list of security IDs that are themselves current holdings;
- support Portfolio Scope by allowing the frontend to pass the already-derived scope security IDs;
- enforce a bounded result limit;
- order primarily by `published_at desc nulls last`, then `first_seen_at desc`;
- return normalized safe fields only;
- never trigger provider ingestion.

Suggested result shape:

- `news_item_id`
- `security_id`
- `symbol`
- `company_name`
- `headline`
- `category`
- `importance_state`
- `published_at`
- `publication_precision`
- `source_name`
- `source_url`
- `first_seen_at`

The existing Dashboard remains cache-read-only.

## 11. Provider-control flow for Stage N3/N4

Every live Trendlyne news call must use the existing Stage 7.2A controls.

Required sequence:

```text
owner/scheduler request
→ validate portfolio + held equity + verified Trendlyne identity
→ inspect TRENDLYNE_MCP provider control
→ inspect NEWS refresh-domain policy
→ acquire ingestion lease / run context as applicable
→ reserve provider budget BEFORE external work
→ create run item with data_domain = NEWS
→ call get_overview_news_corp_events(type='news')
→ record provider_usage_event
→ store bounded raw response in data_source_records
→ parse/validate/dedupe normalized stories
→ write news_items/news_source_appearances
→ update security_refresh_states
→ settle/release reservation
→ complete run/run item
```

No Edge Function may call Trendlyne first and account for it afterward.

## 12. Existing NEWS domain must remain disabled in N2

The Stage 7.2A migration currently defines:

```text
TRENDLYNE_MCP / NEWS / policy_version 1 / DISABLED
```

N2 does not change it.

For N3, the migration/config proposal should explicitly retire the disabled policy version and introduce a reviewed pilot-safe NEWS policy version. The global Trendlyne `scheduler_enabled` flag should remain **false** during the one-security pilot.

Only N4 may consider enabling scheduled news ingestion after pilot reconciliation.

## 13. Proposed N3 pilot safety limits

The next live stage should be intentionally small:

- one owner-selected currently held equity;
- verified Trendlyne identity required;
- exactly one business news tool call per pilot execution;
- no fallback search call in the same pilot;
- reserve one provider tool-attempt unit before the call;
- bounded raw response size;
- bounded maximum number of normalized stories accepted from the response;
- no scheduling;
- no Dashboard replacement yet;
- no AI classification or summarization;
- reconcile `provider_usage_events`, budget reservation settlement and stored raw evidence after the run.

If provider response shape is materially different from expectations, stop after raw capture and revise the parser/schema contract before normalization.

## 14. Freshness and scheduling proposal for later N4

N2 recommends a conservative initial news freshness policy for later review:

- normal target cadence: 60 minutes;
- only current eligible held equities;
- do not call a security while its NEWS refresh state is still fresh;
- use `security_refresh_states` per security;
- use provider budget and conservation thresholds before planning calls;
- avoid retries for semantic/parser failures until reviewed;
- bounded network retry only for explicitly retryable provider failures;
- scheduler remains off until N3 succeeds.

The exact NEWS `refresh_domain_policies` V2 values should be finalized from the observed N3 provider behavior rather than guessed now.

## 15. Retention policy

Initial normalized news records should be retained because they are small, structured decision-support evidence and may later explain why a recommendation changed.

Rules:

- no full article body scraping;
- retain only fields returned under the approved provider contract and permitted retention rights;
- store raw provider response through the existing bounded `data_source_records` evidence mechanism;
- preserve hashes and source URLs for dedupe/provenance;
- no browser hard delete;
- future cleanup, if needed, should archive/retire normalized records rather than silently rewrite historical evidence.

## 16. Deterministic classification boundary

Initial category and importance rules must be explicit and testable. Examples may include provider event labels, source type, or narrow keyword contracts, but N3 should first inspect the real payload before finalizing those rules.

Until then:

```text
category = UNCLASSIFIED
importance_state = UNCLASSIFIED
```

is preferable to guessing.

AI may be added only later as an explanation/summarization layer over stored source-backed news. It must not be part of ingestion correctness.

## 17. Indexing proposal

Likely indexes for the future migration:

```text
news_items(security_id, published_at desc)
news_items(security_id, first_seen_at desc)
news_items(importance_state, published_at desc)
unique news_items(canonical_key)
unique news_source_appearances(source_code, dedupe_key)
news_source_appearances(news_item_id, retrieved_at desc)
news_source_appearances(data_source_record_id)
```

Final SQL should be written only after N3 response-shape assumptions are reviewed if those assumptions affect column semantics.

## 18. Failure semantics

Provider or parser failure must not erase previously cached news.

Expected states:

- provider unavailable + prior cache → `FAILED_WITH_CACHE`;
- provider unavailable + no cache → `FAILED_NO_CACHE`;
- successful response with no new items → successful/unchanged state;
- duplicate-only response → `UNCHANGED` rather than duplicate inserts;
- malformed response → preserve raw evidence when safe, mark parser failure, no fabricated normalized items.

The Dashboard continues to display the most recent valid cache with a freshness indicator when later implemented.

## 19. Migration shape planned for N3 implementation branch

After N2 review, an additive migration may contain:

1. `news_items` table;
2. `news_source_appearances` table;
3. indexes and constraints;
4. read-only owner-scoped feed view/RPC and grants;
5. RLS enabling and read policy;
6. NEWS refresh-domain policy V2 for manual/pilot use only;
7. no scheduler enablement.

The migration must not modify transactions, accounting, scoring, recommendation, AI, or market-price authority.

## 20. N2 acceptance criteria

N2 is complete when all of the following are agreed:

- normalized news is security-centric;
- raw provider evidence reuses `data_source_records`;
- two additive normalized/provenance tables are sufficient for V1;
- deterministic dedupe hierarchy is defined;
- missing publication time remains missing;
- browser remains read-only;
- only currently held securities are visible in portfolio news feed;
- Dashboard feed never invokes a provider;
- provider reservation/accounting precedes every external news call;
- NEWS remains disabled and unscheduled until the controlled N3 pilot;
- N3 starts with one security and one business provider tool call.

## 21. Next gate — Stage N3

After owner approval of this N2 design, the next step is **not** full scheduling.

Stage N3 should:

1. prepare the additive migration and pilot Edge Function on `news-intelligence`;
2. keep scheduler disabled;
3. test locally/static where possible;
4. review the exact migration before production application;
5. obtain explicit approval before applying the migration/deploying the pilot;
6. run exactly one controlled Trendlyne NEWS call for one held stock;
7. inspect the actual payload and provider accounting;
8. only then finalize parser/category/scheduling assumptions.

## 22. Safety conclusion

Stage N2 changes documentation only.

No production Supabase schema, RLS, Edge Function, provider control, quota, scheduler, stored news, or Dashboard behavior has been changed.