# PortfolioAI — Database Architecture

**Step 0.4 — Foundation database design**  
**Status:** Architecture specification; implementation follows after review

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
- securities
- sectors and industries
- themes
- system settings

### B. Portfolio source data
- transactions
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
- investment thesis records

### F. Decision and audit layer
- recommendations
- recommendation evidence
- user decisions/actions
- engine/scoring versions
- portfolio snapshots
- AI analysis runs
- AI usage ledger

## 4. Main tables — V1 foundation

### 4.1 `portfolios`
Represents a user's investment portfolio.

Key fields:
- `id`
- `user_id`
- `name`
- `base_currency` (default INR)
- `is_active`
- `created_at`
- `updated_at`

A portfolio must not assume a single broker.

### 4.2 `brokers`
Broker/master data.

Key fields:
- `id`
- `name`
- `code`
- `api_provider`
- `is_active`

Examples may include Angel One and other brokers used through import/manual workflows.

### 4.3 `securities`
Canonical security master.

Key fields:
- `id`
- `symbol`
- `exchange`
- `isin`
- `name`
- `asset_class`
- `instrument_type`
- `sector_id`
- `industry_id`
- `currency`
- `is_active`
- `created_at`
- `updated_at`

`asset_class` is mandatory for classification and must support at least:
- EQUITY
- ETF
- MUTUAL_FUND
- GOLD
- SILVER
- BOND
- CASH
- OTHER

Do not send ETFs through equity Quality-Growth/ROCE/EBITDA scoring.

### 4.4 `transactions`
The primary portfolio source-of-truth table.

Key fields:
- `id`
- `portfolio_id`
- `broker_id`
- `security_id`
- `transaction_type`
- `transaction_date`
- `quantity`
- `price`
- `gross_amount`
- `charges`
- `net_amount`
- `currency`
- `source`
- `import_batch_id`
- `source_row_id`
- `external_transaction_id`
- `notes`
- `created_at`

Transaction types should support at least BUY, SELL, DIVIDEND, SPLIT, BONUS, RIGHTS, TRANSFER_IN, TRANSFER_OUT and other explicitly defined corporate/portfolio events as required.

Quantities and monetary amounts should use numeric/decimal types, never floating-point storage for financial values.

### 4.5 `holdings` / derived holdings view
Holdings should normally be derived from transactions rather than manually maintained as an independent source of truth.

The application may expose a database view/materialized/derived representation containing:
- security
- quantity
- average cost
- invested value
- current value
- realized P&L
- unrealized P&L
- portfolio weight
- broker exposure
- role
- target/min/max weight

FIFO/lot support should be designed into the transaction model even if tax calculations are deferred.

### 4.6 `portfolio_security_settings`
User-specific investment configuration for a security.

Key fields:
- `id`
- `portfolio_id`
- `security_id`
- `portfolio_role`
- `target_weight`
- `min_weight`
- `max_weight`
- `priority`
- `is_watchlisted`
- `is_frozen`
- `holding_horizon`
- `notes`
- `created_at`
- `updated_at`

Portfolio roles should support CORE, SATELLITE, THEMATIC, ETF and OTHER. The role does not determine asset class.

## 5. Import architecture

### 5.1 `import_batches`
Tracks every XLSX/CSV or future broker/API import.

Key fields:
- `id`
- `portfolio_id`
- `source_type`
- `file_name`
- `file_hash`
- `imported_at`
- `status`
- `row_count`
- `success_count`
- `error_count`
- `duplicate_count`
- `mapping_version`
- `notes`

### 5.2 `import_source_rows`
Preserves the original imported row for auditability.

Key fields:
- `id`
- `import_batch_id`
- `row_number`
- `raw_data_json`
- `normalized_security_id`
- `normalized_transaction_id`
- `status`
- `validation_errors`
- `created_at`

The original source row must not be discarded after successful normalization.

Import rules:
- validate before committing
- show errors clearly
- identify ETFs separately
- identify securities where possible
- detect duplicate rows/transactions
- preserve original values
- require explicit confirmation where mapping is ambiguous
- never silently alter financial values

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

## 10. Deterministic engine result tables

The exact engine tables may be normalized or versioned snapshots. The following logical entities must exist.

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
- Foreign keys for portfolio/security/broker/document relationships.
- Unique constraints for canonical security identifiers where valid.
- Unique security/date/source constraints for market observations as appropriate.
- Unique import batch hashes where appropriate.
- Check constraints for enumerated asset classes and transaction types.
- Decimal/numeric financial types rather than float.
- `created_at` and `updated_at` on mutable entities.
- Soft-delete/archive flags where historical traceability requires them.

## 18. Security / RLS

Supabase Row Level Security must be enabled on user-owned tables.

Baseline rule:
- authenticated users can access only their own portfolios and portfolio-linked records.
- security master/reference data can be read more broadly if appropriate.
- write permissions should be restricted by table and role.
- service-role operations must be server-side only.
- API keys/secrets must never be committed to GitHub.

V1 is personal-use, but the schema should not make future multi-user isolation impossible.

## 19. Storage policy

### Supabase
Use for:
- transactions
- holdings-derived data
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

## 21. V1 database scope

The first physical migration should implement only the foundation required for:
1. authentication/user ownership
2. portfolios
3. brokers
4. securities and asset classification
5. XLSX/CSV import audit trail
6. transactions
7. derived holdings
8. portfolio roles and position sizing settings
9. basic price data
10. core/satellite/thematic structure
11. initial provenance framework
12. RLS/security foundations

Advanced scoring/result tables can be added incrementally once the base schema is verified.

## 22. Important non-goals for first migration

Do not build the entire system in one migration.

Do not initially add:
- complex tax engine
- automatic trading/execution
- intraday/scalping strategy engine
- multi-user billing
- massive document storage
- full backtesting infrastructure
- every possible broker integration

These can be added later without destabilizing the foundation.

## 23. Migration discipline

Each database change should be:
- additive where possible
- reversible where practical
- documented
- tested against existing data
- followed by an application compatibility check

Never modify historical accounting/investment records merely to make a new score or UI look correct.

## 24. Next implementation step

Before writing the first SQL migration, inspect the actual Supabase project and confirm whether any tables, policies, functions or extensions already exist.

Then create the initial migration in small, reviewable units:

1. extensions/utilities
2. portfolios + user ownership
3. broker/security master
4. import batches + source rows
5. transactions
6. corporate actions
7. derived holdings
8. portfolio security settings
9. RLS policies
10. seed/reference data

Only after this foundation is validated should the advanced deterministic engines be implemented.
