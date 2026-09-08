# PortfolioAI Stage 7 — Fundamental Data & Security Enrichment Foundation

**Status:** Owner-approved architecture — deployed and complete
**Checkpoint:** Nine forward migrations are applied locally and remotely; the narrow ninth adds publication time, canonical research-document provenance, and fundamental reconciliation. No provider was activated or called
**Prepared:** 8 September 2026

## 1. Purpose and boundary

Stage 7 should establish auditable, provider-neutral security identity, company,
classification and fundamental-observation foundations. It should activate sector
and market-cap Dashboard analytics only when their inputs meet explicit trust and
freshness rules.

This stage does not implement Quality-Growth, Core Selection, Core Health,
Satellite Opportunity, valuation, risk, portfolio-fit or AI scoring. It may store
the normalized point-in-time inputs that those future deterministic engines need.

Exchange or provider listing identity is operational evidence only. NSE/BSE
listing, provider token or preferred exchange must never become an input to Core,
Satellite, quality, valuation, risk, portfolio-fit or action decisions. Company-
level fundamentals are attached once to the canonical security and are not
duplicated per exchange listing.

The stage preserves these completed-stage invariants:

- transactions remain the sole source of truth for holdings and portfolio accounting;
- security enrichment never creates, edits, supersedes or deletes a transaction;
- asset class remains independent from portfolio role and from analytical quality;
- imported STOCK MASTER and HOLDINGS data remain immutable evidence, not canonical truth;
- missing, ambiguous, conflicting or stale data remain explicit and never become zero;
- provider data and AI output cannot override deterministic calculations;
- canonical/reference writes are trusted server operations; browser clients remain read-only;
- original source evidence and historical point-in-time observations are retained.

## 2. Pre-flight findings and current milestone

Stage 6 implementation, deployment and owner acceptance are complete. On 8
September 2026 the owner approved this Stage 7 architecture and explicitly
authorized the local implementation checkpoint. Stage 7 then became the active
local milestone. Its later remote deployment was separately authorized, completed
and verified on 8 September 2026.

The following repository evidence was inspected:

- the Master Blueprint, Database Architecture, Development Rules, Development
  Status and Requirements Register in their required authority order;
- Stage 4 market data, Stage 5 accounting, Stage 5.1 transaction management, Stage
  6 classification and the Stage 6 ETF audit;
- foundation, import, market-data, manual-security, classification-correction and
  Stage 6 migrations;
- generated Supabase database types;
- workbook parsing, STOCK MASTER reconciliation, trusted import commit, Angel One
  mapping, portfolio repository, deterministic portfolio calculation, Dashboard,
  Holdings and their relevant tests.

### Documentation inconsistencies

1. `PortfolioAI_Database_Architecture.md` still says in its heading, section 24 and
   parts of its Stage 6 narrative that the Stage 6 migration awaits remote
   approval. The newer Development Status and Stage 6 document state that it and
   the three completion migrations are remotely applied and accepted. The living
   Development Status is the accurate implementation record; the Database
   Architecture deployment-status prose should be corrected without changing its
   canonical design rules.
2. The Blueprint's broad numbered product phases do not correspond to repository
   implementation stage numbers. This is an acknowledged sequencing difference,
   not an architectural conflict.
3. No Stage 7-specific document existed before this proposal.

### Current implementation gaps relevant to Stage 7

- `securities` combines a canonical instrument with one exchange/symbol/series
  listing. Its unique ISIN and unique exchange/symbol constraints work for the
  present dataset but do not cleanly represent one instrument with multiple
  exchange listings or historical symbol/ISIN changes.
- `security_identifiers` stores alternate identifiers but has no assertion source,
  retrieval time, validity period, confidence, reconciliation status or history.
- Angel One mappings are provider-specific and current-state oriented. Their JSON
  evidence is useful but is not a general append-only identity-evidence model.
- `sectors` and `industries` exist as read-only reference masters, while trusted
  classification observations, taxonomy mappings, current-selection provenance
  and freshness do not exist.
- `securities.name`, `sector_id` and `industry_id` are current mutable fields and do
  not provide field-level historical provenance.
- no fundamental observation table is implemented. In particular, no market-cap
  value, applicable date, currency, provider field, publication time or confidence
  is stored.
- STOCK MASTER rows are preserved immutably and currently provide ticker/ISIN
  evidence for transaction resolution. Their company, sector, market-cap and
  category cells are not normalized as independent observations.
- when `securities.name` equals its symbol, `portfolioRepository` substitutes an
  imported transaction or HOLDINGS company value for display without carrying its
  evidence/trust state into the view model. Stage 7 should replace that unlabeled
  fallback with an explicit accepted name or an explicit evidence-only label.
- Dashboard sector allocation is computed whenever a holding has a price. It groups
  null sectors as `Sector unavailable`, but does not gate on classification trust,
  freshness, ambiguity, conflicts or enrichment-load failure. No market-cap panel
  exists.

## 3. Proposed logical architecture

The data flow should be:

`provider/import adapter -> immutable source record -> normalized observation ->`
`identity reconciliation / field decision -> trusted current projection ->`
`coverage-aware application service -> Dashboard or future deterministic engine`

Adapters may retrieve and normalize evidence. They may not directly declare a
conflicted observation canonical. Canonical decisions are deterministic policy or
explicit human/service review, and every decision is itself append-only evidence.

### 3.1 Provider and ingestion control plane

#### `data_sources`

General provider-neutral source registry, distinct from source-specific adapters.

Proposed fields:

- `code` primary key, `name`, `source_kind`, `trust_tier`, `is_active`;
- `capabilities` JSON object for discoverable domains, not provider field mappings;
- `licence_metadata` JSON object containing no credentials;
- audit timestamps.

Initial codes may include `NSE`, `BSE`, `ANGEL_ONE`, `TRENDLYNE`,
`LEGACY_WORKBOOK` and `MANUAL_REVIEW`, but inserting a code does not imply that an
adapter or entitlement exists. `market_data_providers.code` should become a child
or compatible projection of this general registry rather than creating two
unrelated meanings for `ANGEL_ONE`.

#### `data_ingestion_runs`

One auditable attempt per provider/domain/request.

Proposed fields:

- `id`, `source_code`, optional requesting `portfolio_id` and `requested_by`;
- `data_domain` (`IDENTITY`, `CLASSIFICATION`, `FUNDAMENTALS`);
- `adapter_version`, `normalization_version`, requested scope and cache policy;
- `started_at`, `completed_at`, status (`RUNNING`, `SUCCEEDED`, `PARTIAL`,
  `FAILED`, `SKIPPED_FRESH`);
- requested, cached, fetched, unchanged, accepted, ambiguous, conflicting and
  failed counts;
- stable allowlisted `error_code` and non-sensitive metadata.

Credentials remain only in Supabase secrets/server configuration. Provider bodies,
tokens and secrets must not appear in client errors or logs.

#### `source_records`

Immutable retrieval evidence common to every adapter.

Proposed fields:

- `id`, `ingestion_run_id`, `source_code`, `data_domain`;
- optional provider `external_record_id`, `source_url` and source parameter/path;
- deterministic `logical_key` and SHA-256 `content_hash`;
- `published_at`, `applicable_from`, `applicable_to`, `retrieved_at`;
- optional reporting `period_type`, `period_start`, `period_end`;
- original structured value/payload where licence and storage policy permit, or a
  source reference plus hash when raw retention is prohibited;
- optional immutable `import_source_row_id` for workbook-derived evidence;
- optional `supersedes_source_record_id` for corrected/revised provider records;
- visibility scope (`GLOBAL` or `PORTFOLIO`) and matching nullable `portfolio_id`.

Checks must enforce global versus portfolio-owned scope. The uniqueness key should
be `(source_code, data_domain, logical_key, content_hash)`, so an unchanged retry is
idempotent while a changed payload becomes a new version. `external_record_id`
should be separately unique per source where the provider guarantees stability.

### 3.2 Canonical security and listing identity

#### `security_listings`

Introduce a provider-neutral listing layer while preserving `securities.id` as the
stable canonical instrument referenced by transactions.

Proposed fields:

- `id`, `security_id`, `exchange`, `symbol`, `series`, `currency`;
- `valid_from`, `valid_to`, `is_primary`, `status`;
- audit timestamps.

Constraints:

- one current listing per `(exchange, symbol, series)` using normalized values;
- at most one current primary listing per security;
- valid-to must not precede valid-from;
- historical ticker/listing rows remain retained and are never repurposed;
- listing changes do not change transaction `security_id`.

The existing `securities.exchange`, `symbol` and `series` columns should remain
during a compatibility period. A reviewed migration would backfill one primary
listing for every existing security without changing any UUID or transaction. Only
after all consumers use the listing layer should the legacy columns be considered
for deprecation in a later milestone.

`securities.id` remains the canonical investable company/security identity.
Checksum-valid ISIN is its strongest normal instrument anchor, but an ISIN change
is not silently folded into the same identity: corporate-action and official
evidence must determine whether it is a renamed/changed instrument or a successor
security. Accepted company name is a versioned `COMPANY_NAME` attribute selected
from evidence; `securities.name` remains a compatibility baseline. Ticker, listing
or company-name similarity alone never creates or merges a security.

Angel One mapping should eventually reference `security_listing_id` as well as
`security_id`, because its token identifies a provider listing. The existing
mapping and price keys remain intact during Stage 7 to avoid changing Stage 4
valuation semantics.

#### `security_identity_observations`

Append-only source assertions, including assertions that cannot yet be reconciled.

Proposed fields:

- `id`, `source_record_id`;
- optional claimed `isin`, company name, exchange, symbol, series, provider
  instrument ID and provider instrument type;
- optional initially resolved `security_id` and `security_listing_id`;
- validation state (`VALID`, `INVALID`, `INCOMPLETE`), validation reasons;
- normalization version and created timestamp.

An ISIN must pass the existing format and checksum validation before it can
participate in automatic matching. An invalid ISIN remains in original evidence
but not in normalized identity.

#### `security_resolution_cases` and `security_resolution_candidates`

Each identity assertion receives a deterministic reconciliation result:

- status: `RESOLVED`, `UNRESOLVED`, `AMBIGUOUS`, `CONFLICTING`, `REJECTED`;
- match basis: exact ISIN plus compatible instrument/listing evidence, exact
  exchange/symbol/series, stable provider ID, or explicit reviewed decision;
- algorithm/policy version, decided time and optional reviewer;
- candidate securities/listings and machine-readable reason codes.

Recommended automatic rule order:

1. a checksum-valid exact ISIN may identify one canonical instrument, but a
   conflicting exchange/symbol assertion opens a conflict rather than silently
   changing the listing;
2. a stable previously verified provider mapping may identify a listing;
3. exact exchange + symbol + compatible series may identify one listing only when
   it produces exactly one candidate and does not conflict with ISIN;
4. ticker alone, company-name similarity, or imported category must never create a
   canonical match;
5. zero candidates are unresolved; multiple candidates are ambiguous;
6. changes to an already verified identity are quarantined for review, following
   the established Stage 4 mapping-review pattern.

This makes Angel One, Trendlyne and NSE/BSE identity assertions evidence in one
reconciliation system. Normal selection prefers verified structured Angel One or
Trendlyne identity when available, uses official company/exchange evidence when
verification or conflict resolution requires it, then imported STOCK MASTER,
controlled public-web evidence and audited manual correction. Official evidence
may override the normal acquisition order when it conclusively resolves a conflict,
but never through an unrecorded overwrite. Imported STOCK MASTER remains lower-
trust portfolio-owned evidence. Any contradiction creates a new reconciliation
decision and audit event.

### 3.3 Company, sector and industry observations

#### `classification_taxonomies` and taxonomy values

PortfolioAI will own a stable two-level canonical taxonomy: `sector` and
`industry`. The existing `sectors`/`industries` masters remain those canonical
values. Add an explicit taxonomy/version registry and a mapping from every provider
label/code to canonical sector and industry IDs. A provider label must not be
inserted as a new canonical value merely because it is new.

Recommended initial policy is `PORTFOLIOAI_INDUSTRY_V1`: curate the initial
canonical sector/industry vocabulary from the best-covered trusted structured
source, review it as a complete controlled list, assign stable PortfolioAI codes,
and map Trendlyne, Angel One, exchange, imported and public-web labels into it.
Provider hierarchy levels and wording remain in their source observations.
Changing a display label does not change its stable code; splitting, merging or
reparenting a classification requires a new taxonomy version and explicit mapping.
An `industry_id` must continue to belong to its selected `sector_id` through the
existing composite foreign key.

Sector, industry, theme and role remain orthogonal. No mapper may infer sector or
industry from ticker, company name alone, theme membership or portfolio role.

#### `security_attribute_observations`

Append-only field-level observations for `COMPANY_NAME`, `SECTOR`, `INDUSTRY` and
provider-reported `MARKET_CAP_CATEGORY`.

Proposed fields:

- `id`, `security_id`, optional `security_listing_id`, `source_record_id`;
- `attribute_code`;
- original value and exactly one normalized typed value (`text_value`,
  `sector_id`, `industry_id` or `json_value`);
- `observed_at`, `published_at`, applicable/effective dates and `retrieved_at`;
- `evidence_quality`, ordinal `confidence`, normalization/mapping version;
- validation state and reason codes.

Confidence is not a fabricated probability. Recommended confidence values are
`HIGH`, `MEDIUM`, `LOW`, `UNASSESSED`; evidence quality separately records
`OFFICIAL_PRIMARY`, `VERIFIED_PROVIDER`, `BROKER_MASTER`, `IMPORTED_UNVERIFIED`,
`MANUAL_REVIEWED` or `OTHER_VERIFIED`. Trust derives from a documented policy using
source tier, validation, conflicts and freshness—not from confidence alone.

#### `security_attribute_decisions`

Append-only accept/reject/withdraw decisions identify the current trusted
observation for each security and attribute. A read-only current view selects the
latest effective decision. This preserves the old selection, reason, policy
version, actor and timestamp when a newer observation replaces it.

`securities.name`, `sector_id` and `industry_id` should remain compatibility fields
in Stage 7. The application should read the trusted-current view first. It may show
the legacy value as explicitly labeled baseline evidence, but must not silently
promote imported company text. Later removal or repurposing of the legacy fields is
out of scope.

### 3.4 Fundamental observations and market-cap category

#### `fundamental_metric_definitions`

Canonical metric dictionary with metric code, value kind, expected unit/currency,
allowed period types, applicable asset/sector templates and active/version state.
It prevents Trendlyne parameter names from becoming architecture.

#### `fundamental_observations`

Append-only normalized observations following the canonical flexible metric model.

Proposed fields:

- `id`, `security_id`, optional listing, `metric_definition_id`, `source_record_id`;
- exact `numeric_value numeric(38,18)` or another definition-approved typed value;
- unit, currency and scaling basis;
- `period_type`, `period_start`, `period_end`, `as_of_date`;
- `published_at`, `retrieved_at`, original provider value and source parameter;
- evidence quality, confidence, validation state;
- normalization methodology/version and optional superseded-observation link.

The first required metric is `MARKET_CAP_CURRENT`. Missing values remain null by absence or
an explicit unavailable observation; neither database nor UI converts them to
zero. Conflicting same-period values coexist until policy or review selects one.

Use the canonical metric code `MARKET_CAP_CURRENT` for the raw current company
value. Its observation must state `FULL` versus `FREE_FLOAT` basis, currency, scale,
as-of date and whether the provider supplied the value directly or PortfolioAI
derived it from separately identified share-count and price observations. Stage 7
selects only `FULL` market cap for company-size presentation unless a consumer asks
for free-float explicitly. An unknown basis is retained but is not auto-accepted.
ETF/fund `AUM` is a separate metric and cannot populate `MARKET_CAP_CURRENT`.

#### `fundamental_observation_decisions`

Append-only selection decisions provide one trusted current observation for a
metric/as-of context while retaining all competing observations. Future Stage 8
engines must consume selected observations by ID and record those IDs in their
calculation evidence.

#### `market_cap_category_assessments`

Market-cap category is a deterministic, versioned classification distinct from the
latest raw market-cap value. Store the input source-record/observation ID, policy
version, rank, effective period, evaluated time and result. Never treat an
unverified provider label as PortfolioAI's canonical category.

### 3.5 Proposed deterministic Large/Mid/Small policy

Adopt `SEBI_AMFI_FULL_MARKET_CAP_RANK_V1` for Indian equities:

- `LARGE_CAP`: ranks 1–100 by full market capitalization;
- `MID_CAP`: ranks 101–250;
- `SMALL_CAP`: rank 251 onward;
- `INSUFFICIENT_EVIDENCE`: no securely reconciled row in the applicable official
  universe, an identity conflict, an inapplicable asset type, or an invalid/stale
  classification dataset.

The canonical input should be the applicable official AMFI categorisation list,
which is prepared using exchange data under the SEBI framework. The current SEBI
Master Circular specifies that a security listed on multiple recognized exchanges
uses the average of its full market capitalization across those exchanges; a
single-listed security uses that exchange; the consolidated list uses the previous
six-month average and is updated after June and December, with monthly treatment
for eligible newly listed/reorganization securities. The AMFI publication includes
rank, company, ISIN, exchange symbols, exchange market caps, the average across
exchanges and the resulting category.

Ingestion must match the AMFI row primarily by checksum-valid ISIN, validate that
the published category agrees with the rank boundaries, retain the published raw
values and category as evidence, and create a conflict rather than use ticker-only
matching. The assessment's effective interval is the interval stated by the
applicable AMFI publication or its superseding monthly addition.

The latest `MARKET_CAP_CURRENT` observation remains useful current evidence and is
refreshed more frequently, but it must not continuously reclassify a company
against the semiannual policy. A future engine may reproduce the SEBI method from a
complete licensed universe, but a portfolio-only set cannot establish market rank.
Provider-supplied Large/Mid/Small labels remain observations and may flag a
conflict; they do not replace the official policy.

ETFs and non-company assets receive `INSUFFICIENT_EVIDENCE` for this equity-company
classification unless a future explicitly approved asset-specific policy exists.
AUM is a separate canonical metric and must never be stored as company market cap.

Authoritative policy evidence:

- SEBI, *Master Circular for Mutual Funds as on March 20, 2026*, paragraph 3.9:
  <https://www.sebi.gov.in/sebi_data/attachdocs/mar-2026/1774024028162.pdf>
- AMFI, *Categorisation of Large, Mid and Small Cap Stocks* and period files:
  <https://www.amfiindia.com/otherdata/categorisation-of-stocks>

## 4. Provider adapters and ingestion flow

Define domain interfaces rather than a Trendlyne service in application logic:

- `IdentityEvidenceProvider.fetchIdentity(scope, cacheContext)`;
- `ClassificationProvider.fetchClassifications(scope, cacheContext)`;
- `FundamentalDataProvider.fetchObservations(metricCodes, scope, cacheContext)`.

Every adapter returns provider DTOs to an adapter-specific normalizer. Only
canonical normalized records cross into reconciliation services. DTOs, field maps
and normalization versions live in provider adapter modules.

### Trendlyne

Trendlyne MCP is the planned primary structured fundamental/intelligence provider
and remains one replaceable adapter behind the provider-neutral boundary. Its
publicly documented scope is understood to include EOD prices, 3,500+ parameters,
financials, technicals, shareholding, insider trades, quarterly results, investor
presentations, earnings calls and annual reports. None of those capabilities is
treated as subscribed-account entitlement until the actual MCP tools/schema are
inspected. Stable identifiers, fields, periods, timestamps, rate limits, caching
and retention rights must be verified before activation. Unsupported or
unavailable fields remain unavailable. No
Trendlyne response shape or fundamental value should be fabricated for tests;
contract fixtures must be captured from authorized, redacted real responses or
written as explicitly synthetic schema-only fixtures with no production facts.

Trendlyne MCP is PortfolioAI's planned primary structured fundamental-data
provider, but it is neither the canonical data model nor a single point of failure.
Fallback operates per metric, period, data class and document: an eligible
Trendlyne metric may coexist with an owner-provided Screener structured import,
official company/exchange filing, controlled allowlisted public-web observation,
future licensed provider or manual audited observation. Missing one field never
switches every metric for the security to another provider.

Current fallback status is deliberately explicit:

- **Implemented:** common raw/normalized/selection/reconciliation persistence,
  publication time, canonical document identity/source appearances, immutable
  evidence, source-field-path adapter contract and provider-neutral analytical input;
- **Architecturally supported / planned:** `SCREENER_IMPORT_ADAPTER` for legitimate
  owner-provided CSV/XLSX exports, official company/filing acquisition, controlled
  allowlisted public-web acquisition, future licensed providers and manual evidence;
- **Not operational:** Screener parsing, live official-document retrieval,
  public-web crawling, subscribed Trendlyne mappings and production ingestion.

### Angel One

Reuse its existing secure server boundary, rate controls, leases and verified
mapping quarantine. Adapt its daily instrument master into immutable identity
source records in addition to the current operational market-data mapping. The
Stage 4 current mapping remains the quoting authority until a separately reviewed
transition proves equivalent behavior.

### NSE/BSE and other exchange evidence

Use official, legally accessible masters/filings as primary identity evidence.
Record publication/as-of and retrieval times separately. Symbol, series, ISIN and
company-name changes create new source records and reconciliation decisions rather
than rewriting the earlier assertion.

### Imported STOCK MASTER

Project observations from existing immutable `import_source_rows`, referencing the
row ID and preserving original cell/formula/error evidence. Normalize company,
sector, market cap and category only when types are valid. Formula results may be
retained as imported evidence but should not be accepted automatically as canonical
fundamental facts. Duplicate rows, invalid ISINs and conflicting values remain
explicit cases. The workbook is never mutated and its observations never directly
update `securities`.

### Deterministic processing sequence

1. authorize the requester and resolve the allowed portfolio/security scope;
2. acquire a provider/domain lease and apply the cache TTL;
3. retrieve, hash and store or reuse immutable source records;
4. normalize using a versioned adapter;
5. validate identity, type, units, dates, currency, period and provenance;
6. insert observations idempotently;
7. reconcile identity and create unresolved/ambiguous/conflict cases;
8. apply only documented auto-accept policy; quarantine all contradictions;
9. compute market-cap category only from an accepted input and approved policy;
10. complete the run with counts and allowlisted failure codes;
11. expose the trusted-current projection and coverage state to the application.

Failure after source-record insertion is recoverable: evidence remains and the run
is failed/partial; no previously accepted observation is deleted or replaced.

### 4.1 Source-precedence matrix

Precedence is a selection policy, not an overwrite order. Every observation is
retained. Freshness, validation and unresolved conflicts may make a nominally
higher-priority observation ineligible.

| Data class | Normal selection order | Automatic acceptance boundary |
|---|---|---|
| Company/security identity | verified Trendlyne structured identity; verified Angel One identity; official company/exchange verification; STOCK MASTER; controlled public web; manual reviewed correction | exact valid ISIN or stable provider ID plus compatible listing; no ticker/name-only acceptance |
| Sector/industry | Trendlyne structured classification; other trusted structured classification; reliable Angel/company metadata; STOCK MASTER; controlled public web; manual reviewed correction | only an approved provider-to-PortfolioAI taxonomy mapping with no conflict |
| Current market cap | Trendlyne structured value; verified Angel One value if available; other trusted structured source; controlled trusted financial web; manual reviewed evidence | exact unit/currency/as-of validation and one reconciled security; material conflicts quarantine selection |
| Market-cap category | applicable AMFI/SEBI-policy dataset; complete policy-equivalent universe calculation; other provider category as comparison evidence; manual only to resolve identity/evidence, not invent rank | checksum-valid ISIN match and rank/category validation under the versioned policy |
| Period fundamentals | Trendlyne/other licensed structured source; official filing/company statement; controlled public web; manual reviewed observation | canonical metric mapping, valid period/unit and no material trusted-source conflict |

Within the same tier, prefer the observation with the applicable period/as-of date
required by the consumer, then the newest eligible publication, not simply the most
recent retrieval. Retrieval time never changes the period the value describes.

### 4.2 Controlled public-web fallback

Public-web acquisition is invoked only after structured and official adapters
return unavailable, unsupported or failed for a required field. It uses an
allowlisted source registry by data class; arbitrary search results cannot be
accepted automatically.

Each acquired record must retain source URL, page/source title, retrieval time,
extracted original value, extraction method and version, applicable date/period,
content hash or archived source reference where legally feasible, evidence quality,
confidence and validation status. Structured data embedded by an allowlisted site
is preferred to screen-text parsing. HTML selectors are adapter implementation
details and cannot enter canonical metric definitions.

An allowlisted web observation starts as `PENDING`. It may be selected only under a
documented policy when no better eligible observation exists and validation is
complete. A material conflict with any selected higher-priority observation creates
a reconciliation case. It cannot silently replace the selected value. Robots,
terms, licence and retention restrictions must be reviewed for each source before
automation; brittle scraping is never required for Stage 7 completion.

### 4.3 Conflict and materiality rules

- identity disagreement on valid ISIN, exchange/symbol ownership or provider ID is
  always material and blocks automatic replacement;
- sector/industry disagreement after taxonomy mapping is material when canonical
  IDs differ;
- current market-cap values use `MARKET_CAP_CONFLICT_TOLERANCE_V1`: compare only
  identical currency and capitalization basis after canonical unit normalization;
  observations more than 36 hours apart are not comparable. A relative difference
  of at most 1% on the same UTC date, or at most 5% across adjacent observations
  within 36 hours, is explainable and equivalent; a larger difference is material
  and opens a conflict. These are versioned operational review thresholds, not
  estimates or permission to average values;
- financial observations compare only like metric, period, consolidation basis,
  currency, unit and scale. Unlike bases remain separate observations, not conflicts;
- a safe deterministic winner records selected observation, eligibility rule,
  precedence tier, freshness result, `selected_at` and policy version;
- otherwise a reconciliation case remains `OPEN`, and the current value is
  unavailable or retains the previously accepted non-stale value with an explicit
  conflict warning;
- manual decisions require reviewer, reason and evidence references. AI cannot
  select or modify a financial fact.

## 5. Idempotency, cache and freshness policy

Cache TTL and analytical freshness are different:

- **cache TTL** controls whether an adapter makes another provider request;
- **freshness threshold** controls whether a cached observation is trusted for a
  current UI/engine use;
- **applicable period** states what date/financial period the value describes;
- **published_at** states when the source released it;
- **retrieved_at** states when PortfolioAI obtained it.

Approved initial defaults, still constrained by provider entitlement and limits:

| Domain | Fetch/cache policy | Freshness for current UI | Notes |
|---|---|---|---|
| exchange/broker identity master | daily, provider-wide | 7 days for verification health | accepted historical identity remains evidence; staleness prompts refresh, not deletion |
| company name | event/daily-master driven | 30 days | a stale accepted name is labeled stale, not erased |
| sector/industry | weekly or source-event driven | 90 days | taxonomy/mapping version is mandatory |
| market-cap value | once per trading day at most | 2 trading days | requires applicable date and currency/unit |
| reporting-period fundamentals | event/new-period driven plus weekly check | expected-report cadence, max policy age | the period never changes merely because it was retrieved later |

Provider rate limits may require longer cache TTLs. The stricter of entitlement,
provider limit and safety policy controls fetching. Freshness is evaluated by a
pure deterministic function with tests around time zones, invalid timestamps and
boundaries.

## 6. Ownership, RLS and audit boundaries

- canonical securities, listings, taxonomies, provider registry, accepted global
  observations and reconciliation decisions are shared reference intelligence;
  browser roles receive SELECT only and trusted server/service operations write;
- portfolio-owned workbook source records remain readable only through the owning
  portfolio, using both RLS and a real portfolio foreign key;
- ingestion runs requested for a portfolio are readable only by its owner;
- global observations should be readable only for securities the user is entitled
  to see. Initially this means any security appearing in that user's transaction
  history, including closed histories; future watchlist access needs a reviewed rule;
- service-role bypass is confined to Edge Functions/trusted operations with caller
  ownership checks. No service credential enters browser code;
- direct UPDATE/DELETE on source records, observations and decision history is
  denied. Defence-in-depth immutable-history triggers should match the Stage 6
  audit-event pattern;
- manual corrections create owner requests and trusted reviewed decisions. They do
  not overwrite original observations;
- large documents stay outside Supabase. Stage 7 stores only structured source
  payloads permitted by licence/storage policy, hashes, metadata and references.

## 7. Dashboard and Holdings activation contract

Create a dedicated enrichment repository/service. Business rules and aggregation
must not live in React components. Its view model should expose, per field and for
the portfolio aggregate:

- value/category;
- selected observation ID and source label;
- evidence quality and confidence;
- applicable date/period, publication time and retrieval time;
- freshness deadline and stale flag;
- resolution/trust status and reason code.

Use an explicit panel state machine:

- `LOADING`: trusted-current observations are being loaded;
- `AVAILABLE`: all priced holdings eligible for the panel have trusted, fresh data;
- `PARTIAL`: at least one but not all eligible priced holdings have trusted data;
- `UNAVAILABLE`: no eligible holding has trusted data, or required category policy
  is not approved;
- `STALE`: data exists but the accepted set is outside freshness policy;
- `FAILED`: the repository/provider read failed; do not mislabel failure as missing.

For a partial sector or market-cap allocation, use the full priced-market-value
denominator and show a distinct `Unavailable / untrusted` bucket plus count and
value coverage. This avoids making covered categories appear to be the complete
portfolio. Stale values should not silently enter the trusted allocation; they may
be shown separately with their stale coverage.

Stage 7 may activate sector **allocation** and market-cap **allocation**. Sector
performance remains deferred because it requires an approved comparison period and
historical price evidence. It must not be inferred from current price or unrealised
portfolio return.

Holdings may show trusted company name, sector, industry, market-cap value/category
and provenance. If no trusted company name exists, show the ticker and `Company
name unavailable`; imported text may appear only under a labeled evidence detail.

## 8. Exact proposed database and API surface

Names below are the implementation contract for review. They may be changed only
through owner review before a migration is written.

### Tables

| Object | Purpose and key identity |
|---|---|
| `data_sources` | global source registry; PK `code` |
| `data_ingestion_runs` | auditable provider/domain attempt; UUID PK; optional owned portfolio request context |
| `data_source_records` | immutable hashed retrieval/import evidence; unique source/domain/logical-key/content-hash |
| `data_ingestion_leases` | server-only source/domain distributed lease and cooldown |
| `security_listings` | temporal exchange listing for stable `security_id`; current exchange/symbol/series uniqueness |
| `security_identity_observations` | immutable claimed ISIN/name/listing/provider identity from one source record |
| `security_reconciliation_cases` | identity-only case with status and resolution audit |
| `security_reconciliation_candidates` | normalized candidate security/listing rows for a case |
| `classification_taxonomies` | PortfolioAI taxonomy name/version/effective state |
| `classification_source_mappings` | versioned provider label/code to canonical sector/industry mapping |
| `security_attribute_observations` | company name, sector, industry and provider-category observations |
| `security_attribute_decisions` | append-only ACCEPT/REJECT/WITHDRAW selection history |
| `fundamental_metric_definitions` | canonical metric dictionary, including `MARKET_CAP_CURRENT` and `AUM` as distinct metrics |
| `fundamental_observations` | exact point-in-time/period metric values and provenance |
| `fundamental_observation_decisions` | append-only selected metric observation history |
| `market_cap_classification_policies` | versioned rank policy and authoritative source definition |
| `market_cap_classification_observations` | published universe row: rank, average market cap, category, effective period and source record |
| `market_cap_category_assessments` | canonical deterministic category for security/policy/effective period |
| `security_enrichment_correction_requests` | portfolio-owner request for manual evidence/review; no direct canonical mutation |
| `research_documents` | immutable provider-independent document identity/metadata; no large document body |
| `research_document_sources` | immutable provider/source appearances, URLs, hashes and extraction provenance for a canonical document |
| `fundamental_reconciliation_cases` | metric/period/semantic conflict review and audited resolution |
| `fundamental_reconciliation_members` | immutable competing fundamental-observation membership |
| `fundamental_reconciliation_events` | append-only opening/resolution audit snapshots |

All exact monetary/fundamental values use `numeric(38,18)`. Category checks allow
only `LARGE_CAP`, `MID_CAP`, `SMALL_CAP` and `INSUFFICIENT_EVIDENCE`. Decision and
observation tables use restrictive foreign keys and no destructive cascade.

### Read-only views

| Object | Contract |
|---|---|
| `current_security_identity_v1` | stable security plus current primary listing and accepted company name with evidence status |
| `current_security_classification_v1` | accepted canonical sector/industry and provenance |
| `current_fundamental_observations_v1` | latest eligible accepted observation per security/metric/context, not newest retrieval blindly |
| `current_market_cap_category_v1` | applicable category assessment and policy/source evidence |
| `current_security_enrichment_v1` | application projection combining the four current views without duplicating fundamentals by listing |
| `portfolio_enrichment_coverage_v1` | owner-scoped holdings coverage inputs; invoker security and transaction-derived portfolio membership |

### Trusted functions and Edge Function

- `acquire_data_ingestion_lease_v1(source_code, domain, holder, seconds)` and
  `release_data_ingestion_lease_v1(...)`: service-role only;
- `apply_security_attribute_decision_v1(...)`: service-role only, append-only
  selection decision and reconciliation closure in one transaction;
- `apply_fundamental_observation_decision_v1(...)`: service-role only with the same
  atomicity and validation;
- `submit_security_enrichment_correction_v1(...)`: authenticated, caller-derived
  ownership, idempotency UUID, evidence/reason required; creates a request only;
- `apply_security_enrichment_correction_v1(request_id, ...)`: service-role only,
  appends reviewed observation/decision/audit without direct history rewrite;
- `refresh-security-enrichment` Edge Function actions:
  `READ_CACHE`, `REFRESH_IDENTITY`, `REFRESH_CLASSIFICATION`,
  `REFRESH_MARKET_CAP`, `REFRESH_FUNDAMENTALS`. It authenticates the caller,
  validates owned portfolio scope, then uses service credentials internally.

There is no browser RPC that accepts arbitrary canonical observations or selected
values. Provider refresh bodies cannot bypass cache, scope, leases or cooldowns.

## 9. Compatibility and impact analysis

### Database/schema

Material additive schema work is required for the proposed tables, constraints,
indexes, immutable-history protections, current views and RLS. No existing
transaction, import row, price or settings row should be updated. Backfilling one
listing per security is the only proposed derived compatibility population and
must be deterministic and validated before application.

### Generated types

After an approved migration is applied in an approved environment, regenerate
`supabase/types/database.types.ts`. Application domain types should wrap generated
rows and keep exact numerics as strings at runtime even though Supabase generation
currently represents PostgreSQL numeric as `number`.

### Services and Edge Functions

- add provider-neutral enrichment interfaces and normalization/reconciliation services;
- add a secure enrichment Edge Function or narrowly scoped functions with leases,
  caching, run audit and allowlisted errors;
- reuse market-data identity evidence without coupling fundamentals to Angel One;
- add a STOCK MASTER evidence projector that reads, but never edits, import rows.

### UI

- replace unlabeled imported-company fallback;
- move sector allocation calculation out of `DashboardPage`;
- add classification/market-cap provenance and coverage states;
- add market-cap allocation only after the market-cap policy is approved and trusted observations exist;
- preserve all existing accounting, broker, role, asset-class and price coverage UI.

### Completed-stage semantics

No accounting or holdings behavior needs to change. Current prices continue to use
the Stage 4 provider-independent price boundary. Portfolio roles/themes/settings
continue unchanged. Asset-class correction remains its existing audited process.
Stage 7 decisions cannot cascade into transactions, FIFO/average cost, themes or
roles.

## 10. Test strategy and acceptance criteria

### Schema and RLS

- clean additive migration applies without editing prior migrations;
- existing security UUIDs and all transaction/import/price counts are unchanged;
- listing backfill is one-to-one, complete and collision-free for existing rows;
- two-user tests prove global/reference read policy and portfolio evidence isolation;
- browser writes to observations/decisions are denied;
- immutable source/observation/decision history rejects UPDATE and DELETE;
- composite keys prevent cross-portfolio evidence links;
- generated types match the applied schema.

### Identity reconciliation

- exact checksum-valid ISIN plus compatible listing resolves deterministically;
- invalid ISIN is retained raw and excluded from matching;
- exact exchange/symbol resolves only one candidate;
- ticker-only, name-only, multiple-candidate and conflicting-ISIN cases do not auto-resolve;
- provider identity changes are quarantined and preserve the prior verified mapping;
- symbol, series, listing and ISIN changes retain effective history;
- repeated unchanged provider/import evidence inserts no duplicate observation;
- changed provider content creates a linked new source version.

### Fundamental/classification ingestion

- exact decimals, currencies, units, periods and timestamps are validated;
- null/missing, malformed, stale and provider-error states remain distinct;
- conflicting sector/industry/market-cap observations coexist pending decision;
- STOCK MASTER values remain lower-trust linked evidence and never mutate canonical rows;
- Trendlyne adapter contract tests prove provider DTO isolation from canonical models;
- no category is produced without an approved versioned policy and trusted input.

### Application/UI

- Dashboard tests cover loading, unavailable, partial, stale, failed and complete states;
- partial allocation includes an unavailable/untrusted bucket and correct full priced denominator;
- sector performance remains absent/unavailable without historical-period evidence;
- company fallback is visibly evidence-only or unavailable;
- Stage 4 price, Stage 5 accounting and Stage 6 role/theme regression suites pass unchanged.

### Completion checks

For each approved phase: TypeScript, ESLint, Vitest, relevant pgTAP/RLS tests,
production build, Supabase lint, migration diff/history checks, `git diff --check`
and an appropriate secret scan must pass. Remote migration and provider acceptance
require separate explicit authorization.

## 11. Stage 8 observation-input contract

Stage 7 exposes evidence, never a score. A future deterministic engine receives an
immutable input snapshot containing:

- `securityId`, `observationId`, `selectionDecisionId` and `metricCode`;
- exact decimal-string value, unit, currency, scaling and consolidation basis;
- period type/start/end or point-in-time `asOfDate`;
- source code/record/parameter, publication and retrieval timestamps;
- evidence quality, confidence, validation and freshness status;
- normalization version and selection-policy version;
- engine evaluation cutoff and explicit availability reason when absent.

Point-in-time reconstruction may use only observations whose `published_at` and
`retrieved_at` were on or before the engine cutoff. A later retrieval of an older
period does not make it historically available. Every future score must store the
exact observation and policy IDs it consumed. Sector/industry and market-cap
category inputs use their selected decision/assessment IDs under the same cutoff
rule. AI receives these outputs only after deterministic calculation and cannot
alter them.

## 12. Exact migration plan and local implementation record

### Migration A — Stage 7 provenance and identity foundation

Proposed filename suffix:
`create_stage7_provenance_and_security_identity.sql`.

Creates `data_sources`, `data_ingestion_runs`, `data_source_records`,
`data_ingestion_leases`, `security_listings`, `security_identity_observations`,
`security_reconciliation_cases`, `security_reconciliation_candidates` and their
constraints/indexes/comments. Seeds only reviewed source registry codes. Adds
owner-scope RLS, reference SELECT policies, service-only write privileges, immutable
history triggers and service-only lease functions.

Before writing or applying it, inspect current exchange/symbol/series/ISIN
collisions. Its data step inserts one primary listing per existing security using
the existing values and preserves every `security_id`. It does not update or delete
`securities`, transactions, prices or mappings. Postconditions compare security,
transaction, import and price counts and prove one backfilled primary listing per
security.

### Migration B — Stage 7 classification and fundamental observations

Proposed filename suffix:
`create_stage7_enrichment_observations.sql`.

Creates `classification_taxonomies`, `classification_source_mappings`,
`security_attribute_observations`, `security_attribute_decisions`,
`fundamental_metric_definitions`, `fundamental_observations`,
`fundamental_observation_decisions` and `security_enrichment_correction_requests`.
Seeds reviewed canonical metric definitions, not provider fields. Adds typed-value,
period, unit, provenance, immutability, RLS and privilege constraints plus trusted
decision/correction functions.

It does not populate company, sector, industry or fundamental facts. Evidence is
populated later through adapters and reviewed ingestion.

### Migration C — Stage 7 market-cap policy and trusted projections

Proposed filename suffix:
`create_stage7_market_cap_policy_and_views.sql`.

Creates `market_cap_classification_policies`,
`market_cap_classification_observations`, `market_cap_category_assessments`, the six
read-only views in section 8, category/rank validation and `portfolio_enrichment_coverage_v1`.
Seeds the reviewed `SEBI_AMFI_FULL_MARKET_CAP_RANK_V1` definition and its official
reference URLs, but no company category or market-cap value.

### Migration D — listing-aware provider mapping compatibility

Proposed filename suffix:
`link_market_data_mappings_to_security_listings.sql`.

Adds nullable `security_listing_id` to `market_data_instrument_mappings`, backfills
it only where the current verified mapping has one exact compatible primary
listing, and adds a composite consistency constraint after validation. Existing
security/provider unique keys and Stage 4 price relationships remain unchanged.
Unresolved or ambiguous links remain null and open reconciliation cases. Making the
column mandatory or changing quote identity is explicitly outside Stage 7.

### Migration E — multi-source resilience add-on

Implemented locally as
`20260908120000_add_stage7_document_and_fundamental_reconciliation.sql`.
It adds nullable `published_at` to raw evidence and normalized fundamental
observations; immutable `research_documents` and `research_document_sources`;
deduplication by content hash, authoritative identifier or reviewed metadata hash;
and dedicated fundamental reconciliation cases, members and immutable events.
Exact structural semantics are enforced before an observation can become a case
member. Resolution retains every original observation and remains separate from the
selected-observation decision.

Each migration remains separately reviewable. Creation and each local or remote
application require the explicit approval mandated by `AGENTS.md`; remote
application requires a later, separate owner instruction after local acceptance.

## 13. Exact implementation sequence and checkpoint result

1. **Complete locally.** Owner approved this proposal and authorized Migrations A–D.
2. **Complete locally.** Migrations A–D were created and applied in order. A fifth
   forward migration restricts aggregate enrichment views after pgTAP exposed an
   authenticated cross-user row-disclosure gap; a sixth corrects the lease retry
   expression found by schema lint; a seventh enforces immutable raw/normalized
   evidence and append-only decision audit events; an eighth fixes seeded policy
   effective dates to the owner-decision date for deterministic replay. Applied
   migrations were not edited.
3. **Resilience add-on complete locally.** The ninth migration and provider-neutral
   fixtures/contracts are implemented. The full `public` schema replays and has no
   diff when a temporary shadow-only prerequisite fixture satisfies the immutable
   historical MOTHERSON verification migration. No fixture is stored in the repository.
4. **Complete locally.** Generated database types, deterministic market-cap policy,
   cache/freshness helpers, allocation logic and provider-neutral adapter contract
   are implemented and tested.
6. Implement adapters in this order: immutable STOCK MASTER projector; existing
   Angel identity-master bridge; official AMFI market-cap universe adapter; approved
   NSE/BSE identity source. Populate no production evidence during tests.
7. **Complete at contract level.** Trendlyne is the planned primary adapter, but
   network mapping waits for subscribed MCP schema and rights inspection.
8. **Complete at local contract level.** `refresh-security-enrichment` provides
   authenticated cache reads and an explicit configuration-pending audit path.
9. Run identity/enrichment locally against approved non-production or read-only
   evidence; reconcile open holdings first, then remaining historical securities.
10. Implement Migration D only after listing reconciliation proves the backfill;
    apply locally only with explicit approval and rerun Stage 4 mapping/price tests.
11. **Complete locally.** Added `enrichmentRepository` and pure allocation; removed
    the unlabeled imported-name fallback.
12. **Dashboard complete locally.** Trusted sector and market-cap allocation use
    all six states and the full priced denominator. Holdings provenance presentation
    remains a later UI increment.
13. Run all completion checks, update Development Status, Requirements Register,
    Database Architecture and this Stage 7 document with actual implemented state.
14. Present migration diffs, schema diff, test evidence, data-coverage report and
    known conflicts for owner acceptance.
15. **Remote database deployment complete.** After a separate explicit instruction,
    all nine approved migrations were applied and non-destructive production
    acceptance passed. The Edge Function remains intentionally undeployed.

## 14. Remaining entitlement and data questions

The prior decisions approve security/listing separation, global canonical
fundamentals, portfolio-private settings, full transaction-history enrichment scope,
source precedence, controlled public-web fallback and the six Dashboard states.
The proposed SEBI/AMFI category policy in section 3.5 is now presented for final
approval.

Before production ingestion:

1. inspect STOCK MASTER/provider classifications before seeding the actual value
   list for approved two-level `PORTFOLIOAI_INDUSTRY_V1`;
2. confirm each proposed public-web source allowlist and its terms before automation;
3. for Trendlyne: subscribed MCP methods, permitted endpoints/parameters,
   stable security identifier, point-in-time/historical depth, observation and
   publication timestamps, consolidation basis, rate limits, caching duration,
   database retention, derived-use/redistribution restrictions, raw-payload
   retention and document/research rights.

Until Trendlyne entitlement is verified, its code exists only in `data_sources` and
provider-neutral interfaces; no response shape or availability is assumed.

Deterministic derived-metric formula/version and input-observation lineage remains
deferred to a mandatory pre-Stage-8 analytical-input checkpoint. No Stage 8 score
or AI financial calculation is implemented by Stage 7.

### Documentation correction made in this review

`PortfolioAI_Database_Architecture.md` now records Stage 6 and its completion
migrations as remotely applied and owner-accepted, and identifies Stage 7 as the
current architecture-review checkpoint. No historical migration file was edited.
`PortfolioAI_Development_Status.md` now records the local checkpoint separately
from remotely deployed Stage 6 behavior.

## 15. Architecture-review checkpoint

The approved material schema change is implemented and verified locally and
remotely. The linked history now includes exactly the nine Stage 7 migrations
through `20260908120000`; remote catalog, lint, data-safety, application and RLS
checks passed. No database reset, Edge Function deployment, Angel One/Trendlyne
call, invented enrichment data or transaction/accounting mutation was performed.
The subscribed Trendlyne MCP schema and rights inspection remains the gate for
provider-specific mappings and ingestion in Stage 7.1.
