# PortfolioAI — Master Blueprint v1.0

**Status:** Canonical product and architecture specification  
**Owner:** PortfolioAI project owner  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Backend:** Supabase (Free-first)  
**Frontend:** React + Vite + TypeScript  
**Initial portfolio import:** Excel/XLSX or CSV exported from Google Sheets  
**Initial broker integration:** Angel One SmartAPI  
**Fundamental/research integration:** Trendlyne MCP  
**Large-document archive:** Google Drive  
**AI:** Provider-agnostic, optional, evidence-grounded

---

## Scope Freeze A release-sequencing note — 5 October 2026

**Release sequencing authority:** [PortfolioAI V1/V1.1/V2 Product Scope Freeze A](PortfolioAI_V1_V2_PRODUCT_SCOPE_FREEZE_2026-10-05.md).

This note does not alter the Blueprint's product architecture. It freezes the near-term release sequence:

- **V1:** operational current-portfolio investment intelligence and owner decision support;
- **V1.1:** non-blocking monitoring/intelligence/discovery expansion;
- **V2/P8:** point-in-time historical reconstruction and historical strategy validation.

Historical observations required to evaluate a company or portfolio **today** remain V1 dependencies. Only point-in-time replay/backtesting and historical strategy-effectiveness inference are deferred.

The existing deterministic architecture remains V1 where prerequisites are satisfied: Core Selection, Core Health, Satellite Opportunity, Valuation, current Momentum/Relative Strength, Risk, Portfolio Fit, Position Sizing, Exit Risk and advisory action states. AI remains optional and evidence-grounded; deterministic operation cannot depend on AI availability.

Scope Freeze B must be owner-approved after the Development audit before implementation begins.

---

## 1. Vision

PortfolioAI is a personal investment decision-support system for managing a diversified Indian equity portfolio across multiple demat/broker accounts. It is not an order-execution bot, intraday/scalping system, or autonomous investment adviser.

The system should answer four questions well:

1. What do I own and how is my portfolio performing?
2. How healthy is each investment and why?
3. What should I consider adding, reducing, holding, promoting, demoting, or exiting?
4. What new information has changed the investment thesis?

The final decision always remains with the human portfolio owner.

### Core design principle

> **Good company ≠ good investment ≠ good portfolio position ≠ good current price.**

PortfolioAI must evaluate these dimensions separately and then combine them into an evidence-based portfolio decision.

---

## 2. Portfolio Structure

### 2.1 Portfolio roles

- **Core:** long-term wealth-compounding holdings. Initial target: approximately **35 stocks by count**, not 35% of portfolio value.
- **Satellite:** higher-alpha opportunities such as emerging growth, turnaround, cyclical, momentum/catalyst, value re-rating and special situations.
- **Thematic:** user-controlled structural themes.
- **ETF / Other assets:** managed separately from equity stock-selection engines.

A stock failing the strict Quality-Growth screen is **not automatically a Satellite or Exit**. Portfolio role and business quality are separate dimensions.

### 2.2 Asset classification

Every security must have an asset class, at minimum:

- Equity
- ETF
- Mutual Fund
- Gold
- Silver
- Bond / Fixed Income
- Cash
- Other

Equity engines must not be applied indiscriminately to ETFs or other non-equity assets.

### 2.3 Configurable allocation

Core/Satellite/Thematic allocation ranges are user-configurable. The architecture must not hard-code a fixed percentage allocation. Position sizing determines actual weights.

---

## 3. Storage Architecture — Free-Tier First

The application is deliberately designed to minimize Supabase storage and recurring cost.

### 3.1 Supabase = structured intelligence database

Store permanently:

- securities and identifiers
- asset classifications
- portfolio settings
- broker accounts and mappings
- transactions and transaction lots
- holdings / derived positions
- relevant price history
- canonical fundamental metrics and periods
- valuation metrics
- technical/momentum metrics where useful
- ownership/shareholding metrics
- corporate-action metadata
- quality, growth, Core Health, Satellite, valuation, momentum, risk and exit scores
- position targets and recommendations
- investment theses and thesis observations
- movement/promotion/demotion events
- alerts and calendar events
- document metadata, source, hash, Drive file ID and processing state
- extracted structured intelligence from documents
- AI requests/responses/usage metadata when AI is used
- audit records and model/engine versions

### 3.2 Google Drive = document archive

Do **not** use Supabase as the primary store for large binary documents unless a compelling technical reason is documented.

Store in Google Drive:

- quarterly result PDFs
- annual reports
- investor presentations
- earnings-call transcripts
- recordings where appropriate and legally/technically available
- company/NSE/BSE announcements
- important filings
- rating reports and other research documents

Supabase stores the metadata and reference to the Drive file.

### 3.3 Temporary processing storage

Downloaded documents may exist temporarily on the processing environment while being parsed. After successful archival and processing, temporary copies should be deleted where safe.

### 3.4 Backups

Important Supabase data should be periodically exportable to local/Drive backup files. The system must not assume the free-tier database is the only copy.

---

## 4. Data Ingestion and Deduplication

PortfolioAI must use incremental ingestion rather than repeatedly downloading unchanged data.

For documents, maintain:

- security/company
- document type
- financial period
- publication date
- source
- source URL or identifier
- Google Drive file ID/path
- content hash/fingerprint
- retrieved_at
- processing status
- parser/version
- AI processing status

Before storing or processing a document, check whether the same logical document or content hash already exists. Unchanged data must not be downloaded or AI-processed again unnecessarily.

For structured data, retain source, period, retrieved date and freshness. Missing data must not silently become zero or be replaced without provenance.

---

## 5. Source of Truth and Provenance

### Transactions are the source of truth for holdings.

Every transaction should preserve:

- broker/account
- security
- transaction type
- quantity
- price
- date/time
- charges when available
- source/import identifier
- original source row/reference
- creation/import timestamp

FIFO/lot support should be designed early even if taxation is implemented later.

### Every important financial metric should support provenance

At minimum:

- value
- source
- source parameter/field
- financial period
- retrieved_at
- publication date where applicable
- confidence/quality status

Supported source categories include Trendlyne, Angel One, Google/Excel import, official company filing, NSE/BSE, Manual and Other Verified.

External credit-rating, analyst-consensus and earnings-estimate observations must additionally preserve the provider's source identifier where available, observation date, applicable financial period, original value, normalized value, publication date, retrieval time, confidence and normalization methodology/version. Historical observations are append-only evidence: a later rating, estimate or consensus observation must not silently overwrite the point-in-time record that preceded it.

Manual overrides must retain original value, replacement value, reason, user and timestamp.

---

## 6. Data Import — Initial Approach

Initial portfolio import should support:

- XLSX/XLS where practical
- CSV
- exported Google Sheet data

The application should not depend on live Google Sheets access for the initial portfolio build.

Import flow:

1. Upload file.
2. Detect/preview columns.
3. Map columns.
4. Validate rows.
5. Identify securities and asset classes.
6. Separate ETFs and other non-equity assets.
7. Detect duplicate or conflicting transactions.
8. Show validation/errors before committing.
9. Import only after user confirmation.
10. Preserve source row and original values.

No silent modification of historical transaction data.

---

## 7. Deterministic Investment Engines

The core engines must be implemented as deterministic, testable software modules. AI is not the calculation engine.

### 7.1 Core Selection Engine — initial engineering weights

| Dimension | Initial Weight |
|---|---:|
| Business Quality | 25% |
| Sustainable Growth | 20% |
| Capital Efficiency | 15% |
| Cash Generation | 10% |
| Balance Sheet | 10% |
| Competitive Advantage | 5% |
| Management / Capital Allocation | 5% |
| Valuation | 5% |
| Momentum | 5% |

These are **initial engineering weights**, not permanent investment laws. Future versions may be tested using historical, point-in-time data.

Core scoring dimensions may include:

- ROCE/ROIC
- ROE where appropriate
- margins
- cash generation
- balance sheet
- capital efficiency
- competitive position
- business economics
- revenue/EBITDA/PAT/EPS growth
- growth consistency and acceleration
- valuation relative to quality and growth
- momentum as timing/confirmation

### 7.2 Quality-Growth diagnostic

The strict quality-growth methodology is a diagnostic, not a hard Core/Satellite gate.

Initial factors:

- market cap > ₹500 crore
- revenue 5Y CAGR >15%
- operating profit/margin growth
- PBT growth
- double-digit growth in at least 4 of 5 years
- median 5Y ROCE >15%, with the intended yearly quality check
- cumulative CFO/EBITDA >65%
- median dividend payout <30%
- PEG <2

Sector-specific templates must exist. Banks/NBFCs should use appropriate metrics such as ROE/ROA, NIM, GNPA/NNPA, credit cost, capital adequacy, loan/deposit growth, CASA and provisioning rather than blindly applying EBITDA/ROCE rules.

### 7.3 Satellite Opportunity Engine — initial weights

- Earnings acceleration 20%
- Growth potential 15%
- Catalyst 15%
- Momentum 15%
- Valuation opportunity 10%
- Business quality 10%
- Balance sheet 5%
- Management 5%
- Risk/reward 5%

Categories: Emerging Growth, Turnaround, Cyclical, Momentum, Value Re-rating, Special Situation, Event/Catalyst.

Satellite is not a failed-Core bucket.

### 7.4 Core Health Engine

Question: **How healthy is this investment as a Core holding today?**

Initial weights:

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

- CORE
- CORE — WATCH
- CORE — AT RISK
- CORE — DEMOTION CANDIDATE

### 7.5 Valuation Engine

Valuation must be **quality- and growth-adjusted**, not a simplistic PE ranking.

Consider:

- PE
- PEG
- EV/EBITDA where appropriate
- P/B where appropriate
- FCF yield
- dividend yield
- historical valuation range
- sector/peer valuation
- earnings growth versus valuation
- profitability and capital efficiency
- valuation premium sustainability

Outputs may include Undervalued, Fair, Elevated, Expensive, Extreme, plus a **Premium Justification / Valuation Sustainability** assessment.

A high PE alone must not trigger exit when superior growth, profitability and durability justify the premium.

### 7.6 Momentum / Technical Engine

Once clean OHLCV exists, support:

- 1M/3M/6M/12M returns
- SMA/EMA
- RSI
- MACD
- ADX
- ATR
- Bollinger Bands
- ROC
- relative strength versus NIFTY
- slope/trend
- support/resistance
- drawdown
- volatility
- volume confirmation

Momentum should influence timing and confirmation, not automatically determine Core or Exit status.

### 7.7 Risk Engine

Monitor:

- stock concentration
- sector concentration
- thematic concentration
- correlation
- beta
- volatility
- drawdown
- liquidity
- hidden economic concentration

### 7.8 Sector Engine

Assess sector:

- performance
- momentum
- valuation
- earnings growth
- cycle
- relative strength
- portfolio exposure
- concentration/risk

### 7.9 Portfolio-Fit Engine

Question:

> What happens if I add this stock to THIS portfolio?

Consider overlap, correlation, concentration, diversification benefit, role balance, risk contribution and position size.

### 7.10 Credit Intelligence Engine

Credit Intelligence is an independent external-intelligence dimension for Indian listed companies. It must remain source-agnostic and may use verified observations from CRISIL, ICRA, CARE Ratings, India Ratings, official company disclosures or exchange announcements, and other legally accessible rating-agency sources.

Each rating observation should conceptually capture:

- security/company
- rating agency and source identifier where available
- rating and publication dates
- rating type
- long-term and short-term ratings
- outlook and watch status
- rating action: UPGRADE, DOWNGRADE, REAFFIRMED, ASSIGNED, WITHDRAWN or OTHER
- previous rating
- instrument or facility
- amount rated where available
- rationale/source URL
- retrieved_at
- original and normalized values
- provenance, confidence and normalization methodology/version

Derived deterministic intelligence may include a normalized credit score, upgrade/downgrade history, outlook improvement or deterioration, rating-agency disagreement and a recent-adverse-credit-event flag. Credit trend states are IMPROVING, STABLE, DETERIORATING, NOT_RATED and INSUFFICIENT_DATA.

**NOT_RATED is not poor credit quality.** A debt-free or lightly leveraged company may have no relevant public rating. Credit ratings are opinions about creditworthiness and debt-servicing ability, not equity Buy/Sell recommendations.

Credit Intelligence acts primarily as balance-sheet and risk confirmation. Deterioration may increase risk or Exit Radar attention, and improvement may strengthen conviction, but neither a rating nor its trend automatically determines Core eligibility or an investment action.

### 7.11 Analyst & Earnings Revision Intelligence Engine

Analyst & Earnings Revision Intelligence is a separate, provider-agnostic external-intelligence engine. Potential sources include Trendlyne and licensed or otherwise verified structured broker/institutional research providers.

Point-in-time consensus observations should conceptually capture analyst count, Buy/Hold/Sell counts, consensus label and score, consensus/high/low target prices, current price at observation, implied upside/downside and observation date.

Earnings-estimate observations should capture period-specific revenue, EBITDA, PBT, PAT and EPS estimates where available, together with the estimate timestamp. Revision history should retain:

- EPS revisions over 1M, 3M and 6M
- revenue and profit revisions
- target-price revisions
- counts of upward and downward revisions
- analyst upgrades and downgrades

Derived deterministic outputs may include Analyst Consensus Score, Earnings Revision Score, Target Revision Score, Analyst Intelligence Score, coverage confidence and a revision trend of STRONGLY_POSITIVE, POSITIVE, STABLE, NEGATIVE, STRONGLY_NEGATIVE, NOT_COVERED or INSUFFICIENT_DATA.

**NOT_COVERED is not negative.** Limited small- or mid-cap coverage lowers confidence; it must not penalize the company. Earnings revision direction may be more informative than a simple Buy/Hold/Sell label, and consensus alone must never trigger an investment action.

### 7.12 Engine separation and conflict handling

PortfolioAI conceptually separates its evidence dimensions:

- **Fundamental engines:** Quality, Growth, Capital Efficiency, Cash Generation, Balance Sheet and Valuation.
- **Market engines:** Momentum, Technical and Relative Strength.
- **External Intelligence engines:** Credit Intelligence, Analyst Intelligence and Earnings Revision Intelligence.
- **Portfolio engines:** Position Sizing, Portfolio Fit, Risk, Exit Radar and Movement Engine.

These dimensions remain independently visible inputs to the Investment Committee and optional AI synthesis layer. PortfolioAI must not collapse them into one arbitrary master score that hides disagreement.

Contradictions are first-class observations and alerts. Examples include strong fundamentals and positive consensus alongside deteriorating EPS revisions, or weak momentum alongside an improving credit rating and strong earnings revisions. Deterministic engines identify the conflict; the Investment Committee layer explains it with evidence rather than erasing it through averaging.

---

## 8. Position Sizing Engine

PortfolioAI must determine how much each stock should represent and why.

Every relevant position should have:

- current weight
- target weight
- minimum weight
- maximum weight

Factors:

1. conviction
2. portfolio role
3. business quality
4. growth durability
5. permanent-loss risk
6. valuation
7. volatility
8. portfolio concentration
9. liquidity
10. portfolio fit

Actions:

- ADD
- HOLD
- ADD ON WEAKNESS
- REDUCE
- TRIM INTO STRENGTH
- FREEZE
- EXIT REVIEW
- EXIT

Core target count remains approximately 35 stocks; it is not a 35% value allocation rule.

---

## 9. Movement Engine

Monitor transitions:

- Core → Core Watch
- Core Watch → Core At Risk
- Core → Satellite
- Core → Review/Exit
- Satellite → Core Candidate
- Satellite → Core Promotion Ready
- Watchlist → Core Candidate
- Watchlist → Satellite Candidate

Anti-churn rules:

- price weakness alone must not automatically demote Core
- one weak quarter is not an automatic demotion
- promotion generally requires sustained evidence over 2–4 quarters unless exceptional
- hard thesis breaks can accelerate demotion
- distinguish soft deterioration from hard deterioration

Human actions for demotion:

- KEEP CORE
- MOVE TO SATELLITE
- MOVE TO REVIEW
- EXIT
- SNOOZE 90 DAYS

Promotion:

- PROMOTE TO CORE
- KEEP SATELLITE
- WATCH
- REJECT

---

## 10. Exit Radar

Exit is different from Reduce/Sell.

- **Reduce/Sell:** may result from overweight, valuation, concentration or position-sizing issues.
- **Exit:** thesis/business deterioration or unacceptable permanent-loss risk.

Initial Exit Risk weights:

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

- Healthy
- Monitor
- Exit Watch
- Exit Candidate
- High Exit Risk

Also support **HARD EXIT FLAG** for exceptional events.

Exit → Replacement Engine should search existing Satellite holdings, promotion candidates, Watchlist, Thematic candidates and market-wide Core candidates.

---

## 11. Thematic Engine

Themes are user-controlled.

System may:

- identify portfolio exposure
- suggest possible structural themes
- rank stocks within themes
- monitor theme strength
- monitor valuation and concentration

User controls active themes, definitions, included securities, maximum allocation, priority and retirement.

---

## 12. Investment Thesis Engine

For important holdings, maintain:

- why I own it
- portfolio role
- what must happen for thesis to succeed
- what invalidates thesis
- key metrics
- key risks
- holding horizon
- target position size

Continuously compare new evidence with the thesis.

---

## 13. Corporate Intelligence / Research Pipeline

PortfolioAI should automatically monitor relevant companies for:

- quarterly results
- annual results/reports
- investor presentations
- earnings calls/transcripts where available
- corporate announcements
- material filings
- management guidance/commentary

Pipeline:

**Source → detect new item → deduplicate → archive original to Google Drive → extract structured data → validate → update financial metrics → compare with prior periods → update engines → create evidence/observations → optional AI synthesis.**

The system must not fabricate missing events or documents.

### Document processing principle

Original documents are evidence. Extracted structured observations are intelligence. The application should normally operate on the structured intelligence and only retrieve the original document when needed for evidence, detailed research or reprocessing.

---

## 14. Why Stocks Moved

Daily/meaningful-move analysis should consider:

- company news
- results
- corporate announcements
- sector movement
- broad market movement
- volume
- technical breakout/breakdown
- other verified evidence

If no reliable catalyst is found, say so. Never invent a reason.

---

## 15. Portfolio Calendar

Weekly forward-looking calendar:

### Next 7 days

- results
- board meetings
- dividends
- investor presentations
- earnings calls
- corporate actions
- major announcements

### Next 2–4 weeks

- upcoming results/events
- sector events
- macro events
- portfolio-specific risk windows

Highlight portfolio-specific events.

---

## 16. AI Brain

Architecture:

**Raw Data → Data Validation → Deterministic Engines → Structured Evidence → AI Context Builder → AI Brain → Investment Committee Summary → Human Decision**

AI responsibilities:

- synthesize
- explain
- compare
- identify conflicting evidence
- summarize thesis changes
- generate weekly reports
- answer portfolio questions
- interpret documents
- produce evidence-grounded recommendations
- surface and explain contradictions between fundamental, market, external-intelligence and portfolio engines

AI must **not**:

- invent financial facts
- silently alter deterministic metrics
- override deterministic calculations
- manufacture catalysts or sources
- act as the sole decision maker

The AI must receive structured evidence and cite/identify the relevant source records where practical.

### AI is optional

Core PortfolioAI must continue operating without AI. If an AI provider is unavailable or disabled, deterministic portfolio functions remain available.

### AI usage levels

1. Deterministic calculations — no AI
2. Event-driven AI — new result/material event
3. Weekly AI — portfolio review
4. On-demand AI — user request

Track where practical:

- provider
- model
- date/time
- usage/tokens if available
- estimated cost
- prompt version
- context version
- subject/portfolio analysed

Avoid repeatedly sending unchanged documents/context to AI.

---

## 17. Dashboard and UI

PortfolioAI should feel like a professional personal investment committee terminal, not a spreadsheet.

Primary navigation:

- Dashboard
- Holdings
- Core
- Satellite
- Thematic
- Movement Radar
- Exit Radar
- Watchlist
- Screeners
- Calendar
- Research
- Investment Committee
- Settings

### Dashboard

Show:

- total portfolio value
- invested capital
- realised/unrealised P&L
- today's P&L
- return
- Core/Satellite/Thematic/ETF/Cash allocation
- Core Health
- portfolio risk
- position sizing health
- diversification
- exit risk
- Action Center
- meaningful recent changes

### Holdings

Columns should include, as appropriate:

- Stock
- Role
- Sector
- Quantity
- Average Cost
- Current Price
- Invested Value
- Current Value
- P&L / P&L%
- Portfolio Weight
- Target/Min/Max Weight
- Quality Score
- Core Health
- Satellite Opportunity
- Valuation
- Momentum
- Risk
- Exit Risk
- Action

Tables must support sorting, filtering, column visibility and useful ranking/order changes.

### Stock Detail

Should eventually contain:

- price and position
- role
- scores
- thesis
- financial trends
- valuation
- technical/momentum
- ownership
- peer comparison
- results
- investor presentations
- earnings-call intelligence
- corporate events
- source documents
- AI Investment Committee view
- change history

UI quality should be treated as a first-class engineering requirement: responsive, consistent, fast, readable, accessible, professional, with clear hierarchy and restrained use of color.

---

## 18. Data Model — High-Level

Initial groups:

### Identity / configuration

- users
- portfolios
- portfolio_settings
- brokers
- broker_accounts

### Securities

- securities
- security_identifiers
- sectors
- themes
- portfolio_roles

### Portfolio accounting

- transactions
- transaction_lots
- holdings/derived views
- prices
- corporate_actions

### Fundamental/research data

- fundamental_periods
- fundamental_metrics
- ownership_data
- news_items
- company_events
- documents
- document_observations
- credit_rating_observations
- analyst_consensus_observations
- earnings_estimate_observations
- analyst_revision_observations

### Engines

- quality_scores
- core_health_scores
- satellite_scores
- valuation_scores
- momentum_scores
- risk_scores
- exit_scores
- position_targets
- position_recommendations
- movement_events
- promotion_events
- demotion_events
- credit_intelligence_assessments
- analyst_intelligence_assessments
- earnings_revision_assessments

### Thesis / AI / audit

- investment_theses
- thesis_observations
- ai_requests
- ai_responses
- ai_usage
- alerts
- calendar_events
- data_sources
- data_ingestion_runs
- manual_overrides
- audit_logs

Avoid making thousands of source-specific financial parameters separate database columns. Use a flexible metric model: security → parameter → period → value → source → retrieved_at, with canonical metrics for frequently used calculations.

---

## 19. Multi-Broker Architecture

Transactions remain portfolio source of truth.

Broker integrations should use adapters so additional brokers can be added later.

Initial sources:

- Excel/imported history across all brokers
- Angel One SmartAPI for live prices/orders/trades where implemented

Other brokers may remain manual/import-based.

---

## 20. ETFs, Gold, Silver and Other Assets

Non-equity assets must be classified separately.

Equity quality/growth/ROCE/EBITDA-style engines must not be applied to ETFs, gold or silver.

A separate Asset Allocation view should eventually cover all assets.

---

## 21. Auditability

Every important recommendation should be reproducible and record:

- recommendation ID
- timestamp
- portfolio snapshot/reference
- input data references
- engine versions
- score versions
- AI provider/model if used
- prompt/context version if used
- evidence references
- recommendation
- confidence
- user decision/action

Historical accounting and transaction data must not be silently rewritten.

---

## 22. Development Phases

### Phase 0 — Architecture

- this Master Blueprint
- Development Rules
- database design
- security model
- engine interfaces
- data contracts
- audit architecture
- storage architecture

### Phase 1 — PortfolioAI Foundation

- React/Vite/TypeScript
- Supabase
- authentication
- database schema/migrations
- GitHub
- Excel/CSV import
- transactions
- holdings
- P&L
- broker classification
- asset classification
- dashboard
- Core/Satellite/Thematic architecture
- Quality-Growth diagnostic
- Core Selection
- Core Health
- Satellite Opportunity
- Position sizing foundation
- Exit Radar foundation
- Movement foundation
- professional UI foundation

Credit and analyst intelligence must not delay the initial XLSX/CSV import and transaction-derived holdings foundation.

### Phase 2 — Angel One

- live prices
- historical market data
- orders/trades/positions as appropriate
- broker reconciliation

### Phase 3 — Trendlyne

- fundamental automation
- historical metrics
- ownership/shareholding and supported research parameters
- analyst consensus, earnings-estimate and revision-history ingestion where licensed and available
- incremental updates/caching

### Phase 4 — Advanced Engines

- valuation
- momentum/technical
- sector
- risk
- portfolio fit
- advanced position sizing
- thesis monitoring
- replacement engine
- Credit Intelligence ingestion after a verified source strategy is selected
- Credit Intelligence scoring
- Analyst and Earnings Revision Intelligence scoring
- cross-engine conflict observations for the Investment Committee

### Phase 5 — AI Brain

- provider abstraction
- evidence context builder
- document intelligence
- event-driven analysis
- weekly Investment Committee
- on-demand research assistant

### Phase 6 — Monitoring

- Why Stocks Moved
- Calendar
- alerts
- movement monitoring
- thesis changes

### Phase 7 — Discovery

- watchlist
- screeners
- Core candidates
- Satellite candidates
- re-entry

### Phase 8 — Advanced Quant / Backtesting

Only after sufficient point-in-time historical data exists. Avoid look-ahead bias, survivorship bias and use correct historical information availability dates.

Credit ratings, analyst consensus, earnings estimates and revisions used in backtests must be selected by the date they were actually observable, never by a later revised history.

---

## 23. Testing Philosophy

Every major module must have:

- unit tests for deterministic calculations
- validation tests for ingestion
- duplicate-data tests
- edge-case tests
- UI smoke tests where practical
- security/RLS checks
- regression tests before major releases

Financial calculations must be tested against hand-verified examples.

---

## 24. Security

- Never commit secrets/API keys to GitHub.
- Use environment variables and Supabase secrets/functions where appropriate.
- Use Row Level Security appropriately.
- Do not expose service-role keys to the browser.
- Minimize sensitive data retention.
- Maintain audit trails for administrative/manual changes.

---

## 25. Engineering Principles

1. Build incrementally.
2. GitHub is the source of truth for code and canonical specifications.
3. Supabase is the structured intelligence database, not a document warehouse.
4. Google Drive is the initial large-document archive.
5. Transactions are the source of truth for holdings.
6. Deterministic calculations must be independent of AI.
7. AI is optional and evidence-grounded.
8. Never silently fabricate or overwrite financial data.
9. Never apply equity-specific analytics to ETFs or other unsuitable assets.
10. Prefer incremental ingestion and deduplication.
11. Preserve provenance.
12. Preserve historical data and backward compatibility.
13. Do not implement future phases prematurely.
14. Every major feature must be testable independently.
15. Human remains final decision maker.

---

## 26. Definition of a Successful V1 Foundation

The first meaningful milestone is not AI and not automated trading.

V1 Foundation is successful when the user can:

1. sign in securely;
2. import the existing portfolio from Excel/CSV;
3. classify stocks and ETFs correctly;
4. view holdings derived from transactions;
5. view portfolio value and P&L;
6. view a professional dashboard;
7. assign/configure Core/Satellite/Thematic roles;
8. view initial deterministic investment scores;
9. see data provenance and validation status;
10. maintain the code in the private GitHub repository;
11. run the application locally and connect it to Supabase.

Only after this foundation is stable should live broker/research/AI integrations be layered in.
