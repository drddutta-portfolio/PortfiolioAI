# PortfolioAI — Database Architecture

**Step 0.4 — Foundation database design**  
**Status:** Stages 1–5 implemented; Stage 5 trusted-write migration applied remotely

## 1. Purpose

PortfolioAI is a personal investment decision-support system for Indian equities and other portfolio assets. The database must preserve transactions as source-of-truth, support multiple brokers, separate asset classes, provide auditable deterministic calculations, retain data provenance, and remain economical on Supabase Free during the early stages.

The database is designed so that large source documents are not stored in the primary database. Structured investment intelligence lives in Supabase; large research documents are stored externally, initially in Google Drive.

## 2. Core design principles

1. **Transactions are the source of truth for positions.** Holdings are derived from transactions plus corporate-action adjustments where applicable.
2. **Never silently overwrite source data.** Imported values and original source rows are preserved.
3. **Asset class is explicit.** Equity, ETF, Mutual Fund, Gold, Silver, Bond, Cash and Other are distinct.
4. **Portfolio role is separate from asset class and business quality.** Core, Satellite, Thematic and ETF are not substitutes for asset classification.
5. **Core is a portfolio role, not a quality-screen pass/fail result.**
6. **Deterministic engines calculate scores.** AI explains and synthesizes structured evidence; it is not the calculation source of truth.
7. **Every important metric has provenance.** Source, parameter, period, publication/retrieval time and confidence are retained where applicable.
8. **Version important calculations.** Engine and scoring versions must be recorded with recommendations.
9. **Incremental ingestion.** Do not repeatedly process unchanged data. Use stable source identities, hashes and processing status.
10. **No large binary research archive in Supabase.** Store document metadata and extracted intelligence in Supabase; store large source files in Google Drive.
11. **Historical data must remain auditable.** Corrections create new observations/versions rather than rewriting history silently.
12. **Personal-use first.** Multi-user features, brokerage expansion and external data redistribution are not assumed in V1.

## 3. Entity layers

The database is organized into these logical layers:

### A. Identity and configuration
- users / authenticated user identity
- portfolios
- brokers
- broker accounts
- securities
- sectors and industries
- portfolio security settings
- themes
- system settings

### B. Portfolio source data
- transactions
- current holdings view
- corporate actions
- manual adjustments where required
- imported source batches and source rows

### C. Market data
- current/last price observations
- OHLCV history
- market-data provenance

### D. Fundamental and research data
- fundamentals snapshots
- financial periods
- research documents metadata
- extracted research facts/observations
- credit-rating observations
- analyst-consensus observations
- earnings-estimate and revision observations
- source provenance

### E. Deterministic intelligence
- quality-growth diagnostics
- core selection scores
- core health scores
- satellite opportunity scores
- valuation assessments
- momentum/technical assessments
- risk assessments
- position-sizing assessments
- movement assessments
- exit-risk assessments
- portfolio-fit assessments
- sector assessments
- credit-intelligence assessments
- analyst-consensus assessments
- earnings-revision assessments
- investment thesis records

### F. Decision and audit layer
- recommendations
- recommendation evidence
- user decisions/actions
- engine/scoring versions
- portfolio snapshots
- AI analysis runs
- AI usage ledger

## 4. Implemented V1 foundation tables

### 4.1 `portfolios`

Represents a user's investment portfolio. It contains `id`, `user_id`, `name`, `base_currency`, `is_active`, `created_at` and `updated_at`. A portfolio can contain multiple broker accounts and must not assume a single broker.

### 4.2 `brokers`

Trusted broker reference master containing `id`, `name`, `code`, `api_provider`, `is_active` and audit timestamps. Browser-authenticated users can read it but cannot write it.

### 4.3 `broker_accounts`

Represents a broker account within a portfolio. It contains `id`, `portfolio_id`, `broker_id`, `account_name`, optional `external_account_id`, `is_active` and audit timestamps.

Transactions use `broker_account_id`, not `broker_id`. A legacy transaction may have no known broker account, so `transactions.broker_account_id` is nullable. When it is present, a composite foreign key enforces that the account belongs to the same portfolio as the transaction.

### 4.4 `securities`

The canonical security master contains `id`, `symbol`, `exchange`, canonical `isin`, `name`, `asset_class`, `instrument_type`, sector and industry references, `currency`, `is_active` and audit timestamps.

`asset_class` supports `EQUITY`, `ETF`, `MUTUAL_FUND`, `GOLD`, `SILVER`, `BOND`, `CASH` and `OTHER`. It remains separate from portfolio role. Equity-specific engines must not be applied blindly to ETFs or other unsuitable assets.

### 4.5 `transactions`

`transactions` is the accounting source of truth. Holdings are subordinate projections and cannot replace the ledger.

Implemented fields and concepts include:

- `id` and `portfolio_id`
- nullable `broker_account_id`
- `security_id`
- controlled `transaction_type`
- nullable `transaction_date` and `executed_at`
- optional `source_sequence`
- `quantity`, `unit_price`, `gross_amount`, `charges`, `taxes`, `net_amount`, `source_average_cost` and `source_cost_basis`
- `currency_code`
- `source_type`, optional `source_provider`, provider transaction/order/trade identifiers and `deduplication_key`
- optional `import_batch_id` and canonical `import_source_row_id`
- `data_quality_status`
- `accounting_status`
- reversal and supersession relationships
- notes and managed audit timestamps

The V1 transaction types are `BUY`, `SELL`, `OPENING_POSITION`, `TRANSFER_IN`, `TRANSFER_OUT`, `BONUS`, `SPLIT`, `REVERSAL` and `ADJUSTMENT`. Quantity is stored as a positive magnitude; the transaction type determines direction.

Accounting states are:

- `ACTIVE`
- `SUPERSEDED`
- `REVERSED`

Only `ACTIVE` transactions can affect current holdings. Future commit, reversal and reconciliation operations must change transaction state, replacement lineage, import-row linkage and batch state atomically.

Data-quality states are:

- `COMPLETE`
- `MISSING_DATE`
- `MISSING_BROKER`
- `MISSING_DATE_AND_BROKER`
- `NEEDS_REVIEW`

`transaction_date` is intentionally nullable because some legacy source transactions have no known date. Unknown dates must remain `NULL`; import date, snapshot date, row order and inferred dates must never be substituted. Undated active BUY and SELL transactions still contribute to current quantity. FIFO, holding-period, time-based realized P&L, CAGR, XIRR and tax-lot calculations must explicitly exclude or separately handle undated transactions rather than treating them as dated.

Transaction quantities, prices, amounts, charges, taxes and source cost values use PostgreSQL `numeric(38,18)`. Application and API code must carry these values as decimal strings or another exact-decimal representation and must not rely on JavaScript floating-point arithmetic.

Browser-authenticated clients receive read-only access to their own transactions. They cannot insert, update, delete or truncate ledger records. Corrections use controlled reversal or supersession; ordinary hard deletion of financial history is not permitted.

### 4.6 `current_holdings`

`current_holdings` is a normal, non-materialized SQL view with invoker security. It is not independently writable and remains subordinate to `transactions`.

It derives quantity from `ACTIVE` transactions only:

- `BUY`: positive
- `SELL`: negative
- `OPENING_POSITION`: positive
- `TRANSFER_IN`: positive
- `TRANSFER_OUT`: negative
- `BONUS`: positive
- `SUPERSEDED` and `REVERSED` rows: excluded

SPLIT, ADJUSTMENT and REVERSAL quantity effects are not guessed. Active unresolved events contribute zero quantity and are disclosed instead.

The view exposes:

- `current_quantity`
- `active_transaction_count`
- `incomplete_transaction_count`
- `has_missing_dates`
- `has_missing_broker`
- `unresolved_quantity_event_count`
- `is_quantity_complete`

Missing date or broker information alone does not make quantity incomplete when the quantity effect remains mathematically determinable. `is_quantity_complete` is false when unresolved quantity-affecting events exist. Closed positions with zero quantity are omitted unless an unresolved event requires the position to remain visible.

V1 `current_holdings` does not claim FIFO, realized or unrealized P&L, holding period, or reconstructed cost basis where evidence is insufficient.

### 4.7 `portfolio_security_settings`

Stores portfolio-specific configuration for a security:

- `id`, `portfolio_id` and `security_id`
- `portfolio_role`
- `target_weight`, `minimum_weight` and `maximum_weight`
- `priority`
- `is_watchlisted` and `is_frozen`
- `investment_horizon`
- `notes`
- managed audit timestamps

Roles are `CORE`, `SATELLITE`, `THEMATIC`, `ETF` and `OTHER`. Role is independent of asset class. Portfolio weights use `numeric(9,6)` and a `0–100` percentage convention.

## 5. Implemented import architecture

### 5.1 `import_batches`

Every XLSX, XLS, CSV, API or manual import attempt receives its own independently auditable batch record. Fields include portfolio and optional broker-account context, source metadata, optional lowercase SHA-256, optional duplicate-batch linkage, mapping metadata, optional snapshot date, controlled status, row counts, failure details, confirmation/commit timestamps and managed audit timestamps.

Repeated identical file hashes are permitted. SHA-256 is indexed for duplicate detection but is not globally unique. `duplicate_of_import_batch_id` may link an attempt to a prior batch in the same portfolio. A batch cannot link to itself.

Lifecycle states are `UPLOADED`, `PREVIEWED`, `VALIDATED`, `AWAITING_CONFIRMATION`, `COMMITTING`, `COMMITTED`, `REJECTED` and `FAILED`. Once committed, a batch cannot be updated, reopened or deleted.

XLSX/CSV binaries are not stored in Supabase.

### 5.2 `import_source_rows`

Every source row is retained, including valid, invalid, ambiguous, duplicate and ignored rows. Stored evidence includes the original `raw_data`, optional source-row hash, normalized staging representation, security resolution, validation errors and warnings, duplicate state and optional duplicate-transaction reference.

Raw source identity is immutable at every stage. Once the parent batch is committed, source rows cannot be inserted, updated or deleted, including through trusted/service-role application paths.

Source rows carry portfolio-safe provenance through their batch and portfolio composite key. Duplicate transaction evidence is constrained to the same portfolio.

For multi-sheet workbook staging, `import_source_rows.row_number` is a batch-wide sequence required by the existing unique constraint. The exact original sheet name and original worksheet row number remain separately embedded in immutable `raw_data`; they must never be reconstructed from the batch-wide sequence.

The canonical committed lineage direction is:

`transactions.import_source_row_id` → `import_source_rows`

There is no independently writable `committed_transaction_id` relationship. A partial unique index permits at most one committed V1 transaction per source row. If one source row must later produce multiple accounting events, a future mapping table may replace that uniqueness rule without rewriting the original source evidence.

Normalized data, validation results, security resolution and duplicate fields are untrusted staging values. The trusted commit process revalidates them server-side before creating transactions.

### 5.3 Same-portfolio provenance

Composite database constraints—not RLS alone—enforce same-portfolio integrity across transaction import batches, source rows, duplicate transaction evidence, superseding batches, broker accounts and reversal relationships.

### 5.4 Opening positions and incomplete legacy history

`OPENING_POSITION` records a source-reported position anchor; it is not a fabricated BUY. When only a holdings snapshot is known, the system must not manufacture transaction dates, purchase transactions or historical lots. Source-reported average cost and cost basis are preserved when supplied.

If fuller broker history becomes available, it must first be reconciled against legacy or opening records. Replacement uses explicit supersession, never deletion. Legacy/opening evidence remains permanently auditable, and holdings must include either active replacement history or superseded legacy/opening records—never both.

### 5.5 Import and correction workflow

Imports follow preview, validation, confirmation and commit stages. Rejected and ambiguous rows remain auditable. Committed financial records and committed import evidence are immutable to browser clients, and transaction corrections use controlled reversal or supersession.

The atomic import commit operation is implemented. Reversal and
historical-reconciliation operations remain deferred; when implemented, each must
validate ownership and all untrusted inputs, then update every related ledger,
lineage and batch state in one database transaction.

#### Trusted import-commit operation

The browser has no mutation privilege on `transactions`. V1 parsing and review use
staging followed by the narrowly scoped `commit_import_batch_v1` PostgreSQL function
exposed through Supabase RPC. It does not accept arbitrary transaction payloads from
the browser.

Browser inputs are limited to:

- `import_batch_id`
- an explicit ordered list of approved `import_source_row_id` values
- an idempotency/confirmation token bound to the user, batch and reviewed staging version

Inside one transaction, the trusted operation must:

1. derive the caller from `auth.uid()` and confirm ownership through `import_batches.portfolio_id → portfolios.user_id`;
2. lock the batch and approved source rows, require an allowed pre-commit state and reject already committed/changed staging;
3. revalidate transaction type, exact decimals, nullable date/broker rules, security resolution, same-portfolio broker account, source lineage and every database constraint from immutable raw evidence and reviewed normalized staging;
4. reject `INVALID`, `AMBIGUOUS`, `DUPLICATE`, `IGNORED` or otherwise unapproved rows, and recompute duplicate identities server-side without over-deduplicating missing-date legacy records;
5. insert at most one V1 transaction per approved source row with canonical lineage in `transactions.import_source_row_id`;
6. atomically update batch counts/status and set `confirmed_at`/`committed_at` only after all ledger inserts succeed.

The function uses `SECURITY DEFINER` to cross the browser's read-only ledger
boundary, with a fixed empty `search_path`, schema-qualified objects, explicit
authenticated-only execute privilege and internal ownership checks. The service-role
key never enters the browser.

Idempotency combines the confirmation token, batch state, the unique
`transactions.import_source_row_id` constraint and existing provider/deduplication
identities. A retry after a successful commit returns the existing commit result
rather than inserting again. Any validation, constraint, ownership or insertion
failure rolls back every ledger and batch-state change; staged evidence remains
available for diagnosis and correction. The operation was introduced through its
own migration and validated with two-user RLS/security, concurrency/retry and
performance tests before deployment.

### 5.6 Stage 5 manual transaction operation

`create_manual_transaction_v1` is the narrowly scoped authenticated path for
manual BUY/SELL records. It derives ownership from `auth.uid()`, validates the
portfolio/account/security relationships and exact numeric inputs, serializes
quantity validation per portfolio/security, rejects oversells, and inserts a
transaction with explicit `MANUAL / PORTFOLIOAI` provenance. The browser retains
read-only access to `transactions`.

`manual_transaction_requests` is a server-owned UUID idempotency ledger binding
each caller/key to a SHA-256 request hash and created transaction. It has RLS and no
browser table privileges. The security-definer RPC uses an empty search path,
schema-qualified objects, and authenticated-only execute privilege.

FIFO is currently an on-demand exact-decimal projection rather than stored derived
state. This is appropriate for the small personal portfolio, avoids stale caches,
and retains match-level BUY/SELL transaction IDs in the calculation result. A
future tax/reporting stage may materialise those results through a rebuildable,
versioned projection without changing the ledger.

## 6. Market-data tables

### 6.1 `price_history`
Historical OHLCV data.

Key fields:
- `security_id`
- `trade_date`
- `open`
- `high`
- `low`
- `close`
- `adjusted_close` where available
- `volume`
- `source`
- `retrieved_at`

Unique key should prevent duplicate security/date observations.

### 6.2 `price_latest`
Current/latest market price representation for fast dashboard access.

It may store:
- last price
- timestamp
- previous close
- day high/low
- source
- retrieved_at

Live broker data and historical market data should remain distinguishable by source.

## 7. Fundamental-data tables

### 7.1 `fundamentals_snapshots`
Stores normalized fundamental metrics for a security and financial period.

Key fields include:
- `security_id`
- `period_end`
- `period_type`
- `metric_name`
- `metric_value`
- `unit`
- `source`
- `source_parameter`
- `published_at`
- `retrieved_at`
- `confidence`
- `source_document_id`
- `observation_version`

Metrics can include revenue, EBITDA, PAT, EPS, margins, ROCE, ROE, cash flow, debt, dividends and other sector-appropriate measures.

Do not assume EBITDA/ROCE are appropriate for every asset or sector.

### 7.2 Sector-specific metrics
Financial institutions such as banks/NBFCs require a separate metric template. Examples include ROE, ROA, NIM, GNPA, NNPA, credit cost, capital adequacy, loan/deposit growth, CASA and provisioning. These should be represented as metrics rather than forcing industrial-company formulas onto financial institutions.

## 8. Research document architecture

### 8.1 `research_documents`
Stores metadata, not normally the binary document itself.

Key fields:
- `id`
- `security_id`
- `document_type`
- `title`
- `financial_period`
- `publication_date`
- `source`
- `source_url`
- `external_storage_provider`
- `external_file_id`
- `external_path`
- `content_hash`
- `file_size`
- `retrieved_at`
- `processed_at`
- `processing_status`
- `document_version`

Document types include results, annual reports, investor presentations, earnings calls, corporate announcements and other verified research.

### 8.2 Incremental document processing
Document identity should use a combination of company/security, document type, period, publication date, source and content hash.

If an incoming document has the same identity/hash, do not download/process it again.

If the identity is the same but the content hash changes, create a new version and process only the changed version.

Large documents are initially stored in Google Drive under a structured hierarchy such as:
`PortfolioAI Research/{Company}/{Document Type}/`

Supabase stores the metadata and extracted structured intelligence required by the application.

## 9. Extracted research intelligence

### `research_observations`
Stores facts extracted from documents so normal dashboard operation does not require reopening the source document.

Fields should include:
- `security_id`
- `document_id`
- `observation_type`
- `observation_text`
- `numeric_value` where applicable
- `period`
- `source_location` such as page/section when available
- `confidence`
- `created_at`

Examples:
- management guidance
- margin commentary
- capacity expansion
- order book
- risks
- competitive developments
- capital allocation
- governance observations

## 10. External intelligence and deterministic engine results

The exact future observation and assessment tables may be normalized or versioned snapshots. The logical entities below describe architecture, not currently implemented schema.

### Credit-rating observations and assessments

Credit source evidence must be stored independently from derived assessments. A future normalized model should associate every observation with a security and preserve:

- rating agency/provider and provider source identifier
- rating date, observation date, publication date and `retrieved_at`
- rating type, long-term rating, short-term rating, outlook and watch status
- rating action: `UPGRADE`, `DOWNGRADE`, `REAFFIRMED`, `ASSIGNED`, `WITHDRAWN` or `OTHER`
- previous rating
- instrument/facility and amount rated where available
- rationale/source URL or document reference
- original provider values and normalized values
- confidence and normalization methodology/version

Potential providers include CRISIL, ICRA, CARE Ratings, India Ratings, official company or exchange disclosures, and other verified rating-agency sources. Provider-specific payloads must be mapped through adapters rather than embedded in the canonical model.

Future deterministic assessments may produce a normalized credit score, trend, rating-action history, outlook changes, agency disagreement and recent-adverse-event flags. Credit trend values are `IMPROVING`, `STABLE`, `DETERIORATING`, `NOT_RATED` and `INSUFFICIENT_DATA`.

`NOT_RATED` is a neutral availability state, not a low score. Credit ratings assess debt-servicing creditworthiness; they are not equity Buy/Sell recommendations. Credit Intelligence primarily confirms balance-sheet and risk evidence and may increase or reduce risk/exit attention without automatically determining Core eligibility.

### Analyst-consensus, earnings-estimate and revision observations

The analyst-intelligence source layer must preserve separate point-in-time observations for:

- analyst, Buy, Hold and Sell counts
- consensus label and normalized consensus score
- consensus, high and low target prices
- current price at observation and implied upside/downside
- observation date
- period-specific revenue, EBITDA, PBT, PAT and EPS estimates where available
- estimate timestamp
- EPS revisions over 1M, 3M and 6M
- revenue, profit and target-price revisions
- counts of upward/downward revisions and analyst upgrades/downgrades

Every observation must retain provider, source identifier where available, financial period, observation/publication/retrieval dates, original and normalized values, confidence and methodology/version. Trendlyne is a planned provider, but the canonical model must accept licensed or verified structured alternatives through provider adapters.

Future assessments may expose Analyst Consensus Score, Earnings Revision Score, Target Revision Score, Analyst Intelligence Score, coverage confidence and revision trend. Revision trend values are `STRONGLY_POSITIVE`, `POSITIVE`, `STABLE`, `NEGATIVE`, `STRONGLY_NEGATIVE`, `NOT_COVERED` and `INSUFFICIENT_DATA`.

`NOT_COVERED` is neutral rather than negative. Limited coverage reduces confidence instead of penalizing the security. Revision direction may carry more decision value than the simple consensus label, and neither consensus nor target price can independently trigger Buy/Sell.

### Engine-family separation

PortfolioAI keeps four independently inspectable engine families:

- **Fundamental:** Quality, Growth, Capital Efficiency, Cash Generation, Balance Sheet and Valuation.
- **Market:** Momentum, Technical and Relative Strength.
- **External Intelligence:** Credit Intelligence, Analyst Intelligence and Earnings Revision Intelligence.
- **Portfolio:** Position Sizing, Portfolio Fit, Risk, Exit Radar and Movement Engine.

The Investment Committee layer consumes versioned outputs from all families. It must expose conflicts—such as strong fundamentals with deteriorating EPS revisions—in structured observations or alerts instead of hiding them inside an arbitrary master score.

### Acquisition and history policy

Use licensed APIs, MCP integrations, official disclosures or other legally accessible structured sources. Fragile scraping must not be a foundational dependency. Coverage will vary by company, so missing, `NOT_RATED`, `NOT_COVERED` and `INSUFFICIENT_DATA` states must remain explicit. AI must never manufacture a credit rating, analyst recommendation, target or estimate.

Observations must be append-only or explicitly versioned to support point-in-time reconstruction. Later corrections and provider revisions must not silently rewrite what was known on an earlier date. Backtesting must filter by actual publication/availability time to avoid look-ahead bias.

The following existing deterministic assessment entities remain part of the architecture.

### `quality_growth_assessments`
Strict screenshot-style diagnostic. It evaluates:
- market cap > ₹500 crore
- 5Y revenue CAGR >15%
- OPM/PBT growth
- double-digit growth consistency
- median 5Y ROCE >15% with yearly checks
- cumulative CFO/EBITDA >65%
- median dividend payout <30%
- PEG <2

This is a diagnostic, not a hard Core/Satellite gate.

### `core_selection_scores`
Stores component scores and total score for identifying Core candidates.

Initial component model:
- Business Quality 25%
- Sustainable Growth 20%
- Capital Efficiency 15%
- Cash Generation 10%
- Balance Sheet 10%
- Competitive Advantage 5%
- Management/Capital Allocation 5%
- Valuation 5%
- Momentum 5%

### `core_health_scores`
Measures how healthy an existing Core position is today.

Initial components:
- Business Quality 25%
- Earnings/Growth 20%
- Capital Efficiency 15%
- Cash Generation 10%
- Balance Sheet 10%
- Competitive Position 5%
- Valuation 5%
- Momentum 5%
- Management/Capital Allocation 5%

States:
CORE, CORE — WATCH, CORE — AT RISK, CORE — DEMOTION CANDIDATE.

### `satellite_opportunity_scores`
Initial components:
- Earnings acceleration 20%
- Growth potential 15%
- Catalyst 15%
- Momentum 15%
- Valuation opportunity 10%
- Business quality 10%
- Balance sheet 5%
- Management 5%
- Risk/Reward 5%

### `valuation_assessments`
Stores valuation metrics and conclusions. Must include quality-adjusted valuation logic.

The system should answer:
**Is the current valuation justified by quality + growth + durability + risk?**

A high PE alone must not produce an automatic exit recommendation. Premium valuation can be sustainable when supported by superior quality, growth, cash generation, durability and acceptable risk.

### `momentum_assessments`
Stores technical/momentum metrics derived from clean OHLCV data, including 1M/3M/6M/12M return, price versus moving averages, trend slope, relative strength, volume confirmation, volatility and drawdown.

### `risk_assessments`
Stores stock, sector, theme, concentration, correlation, beta, volatility, drawdown and liquidity risk indicators.

### `position_sizing_assessments`
Stores current/target/min/max weights and sizing recommendation.

Actions include ADD, HOLD, ADD ON WEAKNESS, REDUCE, TRIM INTO STRENGTH, FREEZE, EXIT REVIEW and EXIT.

### `exit_risk_assessments`
Initial factors:
- Earnings deterioration 20%
- Cash-flow deterioration 15%
- Capital efficiency 10%
- Balance sheet 10%
- Competitive/business deterioration 15%
- Management/governance 15%
- Valuation 5%
- Momentum confirmation 5%
- Portfolio risk 5%

Statuses:
Healthy, Monitor, Exit Watch, Exit Candidate, High Exit Risk.

A separate HARD EXIT FLAG supports exceptional thesis-breaking events.

### `movement_assessments`
Tracks potential transitions:
- Core → Core Watch
- Core → Core At Risk
- Core → Satellite
- Core → Review/Exit
- Satellite → Core Candidate
- Satellite → Core Promotion Ready
- Watchlist → Core Candidate
- Watchlist → Satellite Candidate

Movement decisions require evidence and anti-churn rules.

## 11. Investment thesis

### `investment_theses`
One current thesis can be maintained per portfolio/security, with version history.

Fields:
- `portfolio_id`
- `security_id`
- `role`
- `why_owned`
- `success_conditions`
- `invalidation_conditions`
- `key_metrics`
- `key_risks`
- `holding_horizon`
- `target_weight`
- `thesis_status`
- `version`
- `created_at`
- `updated_at`

The system should continuously compare current evidence against the thesis.

## 12. Themes

### `themes`
User-controlled investment themes.

Fields:
- `id`
- `portfolio_id`
- `name`
- `description`
- `max_allocation`
- `priority`
- `is_active`
- `created_at`
- `updated_at`

### `theme_securities`
Maps securities to themes.

A stock can belong to multiple themes, but theme exposure must be calculated to identify concentration and overlap.

## 13. Portfolio snapshots and auditability

### `portfolio_snapshots`
Stores reproducible portfolio state used for important recommendations/reports.

A snapshot should identify:
- timestamp
- holdings state
- prices used
- allocation
- engine versions
- relevant data versions

### `recommendations`
Stores every material recommendation.

Fields should include:
- `id`
- `portfolio_id`
- `security_id` where applicable
- `recommendation_type`
- `recommendation`
- `confidence`
- `reason_summary`
- `portfolio_snapshot_id`
- `engine_version`
- `score_version`
- `created_at`
- `status`

### `recommendation_evidence`
Links each recommendation to the structured evidence used to produce it.

This allows the user to ask: **Why did PortfolioAI make this recommendation?**

### `user_decisions`
Human-in-the-loop decision record.

Examples:
- KEEP CORE
- MOVE TO SATELLITE
- MOVE TO REVIEW
- EXIT
- SNOOZE 90 DAYS
- PROMOTE TO CORE
- KEEP SATELLITE
- WATCH
- REJECT

The system recommendation and the user's actual decision must remain separate.

## 14. AI layer

### `ai_runs`
Records each AI analysis.

Fields should include:
- `id`
- `portfolio_id`
- `security_id` where applicable
- `provider`
- `model`
- `prompt_version`
- `context_version`
- `input_reference`
- `output_reference`
- `analysis_type`
- `created_at`
- `token_usage` where available
- `cost` where available

AI must consume structured evidence generated by deterministic engines.

The AI/Investment Committee layer may synthesize credit, analyst and earnings-revision evidence alongside fundamental, market and portfolio-engine results. It must cite the underlying observations, preserve confidence and missing-data states, and surface contradictions rather than inventing a reconciled fact or opaque master score.

### `ai_usage_ledger`
Aggregates AI usage for transparency and cost monitoring.

AI is optional. PortfolioAI must continue operating when AI is unavailable or disabled.

The architecture must not hard-code a single AI provider.

## 15. Data provenance

Where a metric or observation originates externally, retain:
- source
- source parameter
- retrieved_at
- financial period
- publication date when available
- confidence
- source document/reference
- version where applicable

Supported source labels initially include:
- Trendlyne
- Angel One
- CRISIL
- ICRA
- CARE Ratings
- India Ratings
- Licensed analyst-data provider
- Google Sheet/XLSX
- Official company filing
- NSE/BSE
- Manual
- Other verified

Manual overrides must preserve the original value and record:
- replacement value
- reason
- user
- timestamp

Credit-rating, analyst-consensus, earnings-estimate and revision observations additionally require an observation date, original value, normalized value, provider source identifier where available, confidence and normalization methodology/version. Their point-in-time histories must remain reproducible after later provider revisions.

## 16. Corporate actions

### `corporate_actions`
Must support at least:
- stock split
- bonus
- rights
- dividend
- merger
- demerger
- symbol change
- ISIN/security identity change

Corporate actions must not rewrite historical transactions invisibly. They should be represented as explicit events and applied through controlled adjustment logic.

## 17. Recommended database constraints

- UUID primary keys for application entities.
- Foreign keys for portfolio, security, broker-account, import and document relationships.
- Composite foreign keys for relationships that must remain within one portfolio.
- Unique constraints for canonical security identifiers where valid.
- Unique security/date/source constraints for market observations as appropriate.
- Non-unique SHA-256 lookup for import attempts; repeated identical files remain independently auditable.
- Stable provider identifiers and source-row lineage constraints for transaction deduplication.
- Check constraints for enumerated asset classes and transaction types.
- `numeric(38,18)` transaction financial values rather than floating-point storage.
- `numeric(9,6)` portfolio weights using the `0–100` convention.
- `created_at` and `updated_at` on mutable entities.
- Soft-delete/archive flags where historical traceability requires them.
- Restrictive delete behavior for financial and provenance parents.

## 18. Security / RLS

Supabase Row Level Security is enabled on all implemented user-owned and reference tables. Ownership of portfolio data derives through `portfolios.user_id`.

- Authenticated users can access only their own portfolios, broker accounts, import batches, source rows, transactions and portfolio-security settings.
- Transactions are browser read-only. Browser roles have no insert, update, delete or truncate ledger privileges.
- `anon` has no access to the new import, transaction, settings or holdings objects.
- Brokers, sectors, industries, securities and security identifiers remain browser read-only reference masters.
- Import staging fields written by a browser are untrusted. Trusted commit processing must revalidate them before ledger creation.
- RLS is not used as a substitute for same-portfolio foreign-key integrity.
- Service-role RLS bypass is expected only for narrowly controlled server operations; service credentials must never reach browser code.
- API keys, passwords and service-role secrets must never be committed to the repository.
- `SECURITY DEFINER` functions should be avoided unless justified. Any future use requires a fixed safe `search_path`, schema-qualified objects, internal ownership checks and restricted execution privileges.

V1 is personal-use, but these rules preserve future multi-user isolation.

### 18.1 V1 authentication architecture

Supabase Auth is the V1 identity provider. The browser application supports email/password login, password reset, persisted sessions, logout and protected application routes. The centralized Supabase browser client uses only the public anon/publishable key; a service-role credential must never be included in frontend configuration.

The authenticated identity is the UUID issued by `auth.users.id`. Portfolio ownership continues to be enforced through `portfolios.user_id` and existing RLS policies; the application must never fabricate a user UUID or treat a client-supplied portfolio or user ID as proof of ownership.

Public self-registration is disabled for V1. The application exposes no sign-up route, button or browser-side `signUp` operation. The initial owner account must be created through **Supabase Dashboard → Authentication → Users → Add user** (or an equivalently trusted administrative Auth workflow), never through a database insert, frontend service-role key or temporary public-registration endpoint. The hosted project's Auth settings should also disallow public email signups after the owner is provisioned as defense in depth.

Password-reset redirect URLs must be explicitly allow-listed in Supabase Auth for local and deployed application origins. The frontend derives the reset destination from `VITE_APP_URL`, falling back to the current browser origin during local development.

Authentication and authorization remain separate: a valid session identifies the caller, while RLS authorizes each database operation. The auth provider and route guards are deliberately independent of onboarding, plans, teams and account limits so a future reviewed public-registration UI can be enabled without changing the `auth.users.id` ownership model or weakening RLS.

## 19. Storage policy

### Supabase
Use for:
- transactions
- the `current_holdings` view and future transaction-derived results
- securities
- portfolio configuration
- market data needed by engines
- fundamental metrics
- scores
- recommendations
- thesis
- provenance
- document metadata
- extracted research intelligence
- AI audit/usage records

### Google Drive
Use for:
- annual reports
- quarterly result PDFs
- investor presentations
- earnings-call transcripts
- large filings/research documents
- other large source documents

### Temporary/local storage
Downloaded documents may be held temporarily for processing and should be deleted after successful processing where safe.

## 20. Refresh and incremental ingestion policy

Different data types have different refresh frequencies.

Examples:
- live prices: real-time/session-based
- daily OHLCV: daily
- fundamentals: on new published period or scheduled freshness check
- analyst estimates/revisions: on a new provider observation or scheduled freshness check
- credit ratings: on a new rating action, disclosure or scheduled freshness check
- research documents: event/new-document driven
- scores: recompute when their inputs change

Do not fetch and process unchanged data merely because a scheduled job ran.

Use:
- source identifiers
- content hashes
- financial periods
- publication dates
- last retrieved/processed timestamps
- processing status
- version numbers

## 21. Implemented migration status

### Foundation migration

`supabase/migrations/20260904180000_create_portfolio_foundation.sql` has been validated and applied to the remote Supabase project. It establishes portfolios, brokers, broker accounts, sectors, industries, securities, alternate security identifiers, audit timestamps, restrictive relationships and baseline RLS.

### Import and transaction foundation migration

`supabase/migrations/20260905120000_create_import_transaction_foundation.sql` has passed fresh disposable local execution, constraints, two-user RLS tests, privilege checks, linting and schema-diff validation and has been applied to the remote Supabase project.

The trusted import-commit migrations
`20260905180000_create_trusted_import_commit.sql`,
`20260906183000_accept_raw_transactions_record_kind.sql` and
`20260906203000_cache_stock_master_identity_evidence.sql` are also applied. The
trusted commit path is operational and preserves immutable source-row lineage while
keeping browser transaction access read-only.

### Stage 4 market-data migrations

The following Stage 4 migrations are applied to the remote Supabase project:

- `20260907120000_create_market_data_foundation.sql`
- `20260907123000_fix_market_data_lease_retry_after.sql`
- `20260907130000_verify_motherson_angel_mapping.sql`

The authenticated `refresh-market-data` Edge Function is deployed and the
server-side Angel One SmartAPI integration is operational. All 248 open holdings
have `VERIFIED` provider mappings and latest-price cache coverage. The reviewed
MOTHERSON identity is `ANGEL_ONE / NSE / MOTHERSON-EQ / 4204`.

## 22. Deferred features

The following are deliberately deferred and must be introduced through separately reviewed migrations and deterministic application components:

- persisted/materialised tax-lot snapshots (Stage 5 computes auditable FIFO matches on demand)
- cash-ledger semantics
- complete corporate-action processing
- SPLIT and ADJUSTMENT quantity semantics
- historical reconciliation operation
- Trendlyne ingestion
- credit-rating ingestion and Credit Intelligence scoring
- analyst-consensus/estimate ingestion and revision scoring
- cross-engine Investment Committee conflict observations

Until the corresponding deterministic logic exists, unresolved quantity events must remain disclosed and date-sensitive analytics must not treat incomplete legacy transactions as complete.

Other longer-term non-goals for the current foundation remain complex tax calculation, automatic trading, intraday/scalping strategies, multi-user billing, large binary document storage and full backtesting infrastructure.

## 23. Migration discipline

Each database change should be:
- additive where possible
- reversible where practical
- documented
- tested against existing data
- followed by an application compatibility check

Never modify historical accounting/investment records merely to make a new score or UI look correct.

## 24. Next implementation step

Stage 5 and its additive trusted manual-write migration are applied and validated.
Its on-demand FIFO projection
keeps transactions authoritative and exposes match-level transaction lineage;
unknown dates remain null and chronology-incomplete histories do not receive a
fabricated basis.

Advanced deterministic engines remain downstream work. Trendlyne analyst and
estimate ingestion belongs in the Trendlyne phase; credit-rating ingestion waits
for a verified source strategy; scoring and conflict synthesis belong in the
advanced-engine and Investment Committee phases.

## 25. Stage 4 market-data status

Stage 4 is remotely applied, deployed and operational. Its provider-independent
instrument mappings, latest-price observations, refresh audit runs, leases and
daily OHLCV foundation are established by the applied migrations listed in section
21. The deployed authenticated `refresh-market-data` Edge Function keeps Angel One
credentials in Supabase secrets and never exposes them to browser configuration.

All 248 open holdings have verified mappings and latest-price cache coverage. The
Dashboard and Holdings market-data frontend is activated and verified. Price
evidence retains provider provenance, provider timestamp, retrieval timestamp and
fresh/stale status.

Current limitations remain explicit: cached observations may become stale between
refreshes; 28 partial-sale holdings lack deterministic remaining cost basis pending
FIFO/lot accounting; trusted sector classifications are not populated; and the
historical OHLCV dataset required by future momentum/technical engines is not yet
populated.
