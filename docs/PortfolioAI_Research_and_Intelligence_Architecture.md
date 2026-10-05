# PortfolioAI — Research and Intelligence Architecture

**Status:** Canonical domain architecture for source responsibility, deterministic calculations, score lineage, and research/intelligence boundaries  
**Owner:** PortfolioAI project owner  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Scope:** Research, market data, derived analytics, portfolio intelligence, and explanation layers

---

## Scope Freeze A historical-data boundary — 5 October 2026

The release boundary is governed by [PortfolioAI V1/V1.1/V2 Product Scope Freeze A](PortfolioAI_V1_V2_PRODUCT_SCOPE_FREEZE_2026-10-05.md).

For V1, do **not** interpret "historical validation deferred" as "historical data deferred."

V1 still requires historical observations needed for correct present-tense analysis, including as required by approved methodologies:

- multi-quarter/multi-year fundamental history;
- valuation and ownership history;
- prior observations needed for deterioration/improvement or anti-churn logic;
- current-market OHLCV lookback;
- corporate-action-compatible price history;
- benchmark history/alignment for relative strength and market-risk calculations.

What is deferred to V2/P8 is point-in-time reconstruction and historical strategy evaluation: recreating what PortfolioAI knew on past decision dates, replaying scores/actions and evaluating subsequent investment effectiveness.

Current Momentum/Relative Strength may remain V1 only when authoritative OHLCV, sufficient lookback, corporate-action semantics, benchmark identity and date alignment are ready.

Temporal role/movement claims require actual prior observations; otherwise expose current eligibility and `TRANSITION_NOT_ASSESSABLE`.

---

## 1. Purpose

PortfolioAI will combine data from multiple providers, the trusted transaction ledger, deterministic calculations, and later optional AI synthesis. The main architectural risk is not insufficient data; it is allowing multiple values with different origins and meanings to become mixed together.

This document therefore answers four questions for every important research or intelligence value:

1. **Who is the authoritative raw source?**
2. **Who is allowed to calculate or normalize it?**
3. **What type of value is it: raw, normalized, derived, scored, or interpreted?**
4. **How can the UI and later AI explain its lineage?**

No new research metric, market metric, score, recommendation, or explanation should be introduced without an explicit source-and-calculation contract.

---

## 2. Core principle

> **Raw evidence, deterministic calculations, composite scores, and explanations are different layers and must never be stored or presented as if they are the same thing.**

A PortfolioAI user should always be able to ask:

> “Where did this number come from?”

and obtain one unambiguous answer.

---

## 3. The four-layer model

### Layer 1 — Raw authoritative evidence

Provider or ledger facts that PortfolioAI did not invent.

Examples:

- Angel One current market price
- Angel One daily OHLCV
- Trendlyne revenue observation
- Trendlyne promoter holding observation
- trusted transaction quantity
- broker account associated with a transaction

Layer 1 records must retain provider/ledger provenance and must not be silently overwritten by derived values.

### Layer 2 — Normalized and deterministic calculations

PortfolioAI transforms trustworthy Layer 1 inputs using explicit formulas or aggregation rules.

Examples:

- weekly/monthly candles derived from daily OHLCV
- 20/50/100/200 DMA
- RSI
- MACD
- relative strength versus NIFTY
- portfolio current value
- unrealised P/L
- portfolio weight
- revenue CAGR when the required period-qualified data is actually available

Every Layer 2 metric must identify its calculation owner and formula/engine version.

### Layer 3 — Composite scores and deterministic states

PortfolioAI combines multiple validated Layer 1/2 inputs into a structured score or classification.

Examples:

- Momentum Score 72/100
- Daily Trend = WEAK
- Weekly Trend = POSITIVE
- Monthly Trend = STRONG
- future Quality Score
- future Growth Score
- future Core Health
- future Exit Score

These outputs must remain reproducible from their component inputs.

### Layer 4 — Explanation and decision-support synthesis

Human-readable interpretation of the evidence and deterministic outputs.

Example:

> **Momentum 72/100 — Positive.** Price is below the 50DMA but remains 14% above a rising 200DMA. Weekly and monthly trends are positive, six-month relative performance versus NIFTY is +11 percentage points, and correction volume is below the 20-day average.

Later AI may improve the language, compare evidence, surface contradictions, or create an Investment Committee narrative. AI must not secretly replace Layer 1–3 calculations.

The final investment decision remains with the portfolio owner.

---

## 4. Provider and calculation responsibilities

### 4.1 PortfolioAI transaction ledger

**Authority for:**

- buy/sell transactions
- broker account associated with each transaction
- open quantity derived from transactions
- cost basis once supported by the approved accounting method
- invested amount
- realised/unrealised accounting inputs

Broker APIs may later reconcile these values, but they do not silently replace the transaction ledger.

### 4.2 Angel One SmartAPI

**Primary market-data authority for:**

- current market price / LTP
- current market snapshot fields supported by the approved contract
- daily historical OHLCV
- volume
- price timestamps
- provider market identity/token mappings

PortfolioAI should use Angel One efficiently through server-side batching, throttling, caching, and incremental historical refresh.

Angel One does **not** become the authority for:

- company fundamentals
- ownership/shareholding fundamentals
- long-term investment recommendations
- PortfolioAI deterministic scores

### 4.3 Trendlyne

**Primary structured research evidence source for currently approved domains:**

- fundamentals
- ownership/shareholding
- valuation evidence where semantically reviewed
- provisional document/source appearances

Trendlyne technical/market values must not replace Angel One as PortfolioAI's market-data authority.

### 4.4 PortfolioAI deterministic engines

**Authority for calculations and scores such as:**

- current value and portfolio weight
- weekly/monthly OHLCV aggregation
- moving averages
- technical indicators
- relative strength
- volatility/drawdown
- trend states
- Momentum Score
- future Quality/Growth/Valuation/Core/Portfolio-Fit/Exit intelligence

PortfolioAI calculations must be deterministic, versioned, and reproducible.

### 4.5 Optional AI layer

AI may:

- explain deterministic outputs
- summarize evidence
- compare stocks
- surface contradictions
- draft an Investment Committee narrative
- identify which evidence changed

AI must not:

- fabricate unavailable metrics
- silently replace authoritative source values
- modify deterministic scores
- mutate transactions, roles, themes, targets, or holdings autonomously
- execute trades

---

## 5. Authoritative Data Responsibility Matrix

The following table defines the intended owner for major data classes. Exact storage objects may evolve through approved migrations, but authority should not change silently.

| Domain / metric | Raw authority | Calculation owner | Layer | Intended UI label / meaning |
| --- | --- | --- | --- | --- |
| Transaction | PortfolioAI trusted ledger | — | 1 | Transaction |
| Open quantity | PortfolioAI trusted ledger | PortfolioAI accounting | 2 | Quantity |
| Average cost | PortfolioAI trusted ledger | PortfolioAI accounting | 2 | Avg Cost |
| Invested amount | PortfolioAI trusted ledger | PortfolioAI accounting | 2 | Invested |
| Current price / CMP | Angel One | — | 1 | Current Price |
| Current value | ledger + Angel One CMP | PortfolioAI accounting | 2 | Current Value |
| Unrealised P/L | ledger + Angel One CMP | PortfolioAI accounting | 2 | P/L |
| Portfolio weight | ledger + Angel One CMP | PortfolioAI accounting | 2 | Portfolio Weight |
| Daily OHLCV | Angel One | — | 1 | Daily Market Data |
| Weekly OHLCV | Angel One daily OHLCV | PortfolioAI market aggregator | 2 | Weekly Market Data |
| Monthly OHLCV | Angel One daily OHLCV | PortfolioAI market aggregator | 2 | Monthly Market Data |
| SMA20 / SMA50 / SMA100 / SMA200 | Angel One daily closes | PortfolioAI Technical Engine | 2 | 20/50/100/200 DMA |
| Weekly SMA | derived weekly series | PortfolioAI Technical Engine | 2 | 10/20/40-week SMA |
| Monthly SMA | derived monthly series | PortfolioAI Technical Engine | 2 | 10/20-month SMA |
| RSI | Angel One OHLCV | PortfolioAI Technical Engine | 2 | RSI |
| MACD | Angel One OHLCV | PortfolioAI Technical Engine | 2 | MACD |
| Volume ratio | Angel One volume | PortfolioAI Technical Engine | 2 | Relative Volume |
| 52-week position | Angel One OHLCV | PortfolioAI Technical Engine | 2 | Distance from 52W High/Low |
| Returns | Angel One price history | PortfolioAI Market Engine | 2 | 1M/3M/6M/1Y/etc Return |
| Relative strength vs NIFTY | Angel One stock + benchmark prices | PortfolioAI Market Engine | 2 | Relative Performance |
| Drawdown | Angel One price history | PortfolioAI Risk Engine | 2 | Drawdown |
| Volatility / ATR | Angel One OHLCV | PortfolioAI Risk Engine | 2 | Volatility / ATR |
| Daily/Weekly/Monthly trend | market-derived inputs | PortfolioAI Trend Engine | 3 | Trend State |
| Momentum Score | validated market-derived inputs | PortfolioAI Momentum Engine | 3 | Momentum Score 0–100 |
| Momentum explanation | score components and market evidence | PortfolioAI explanation rules; optional AI wording | 4 | Evidence-based explanation |
| Revenue | Trendlyne reviewed evidence | normalization only | 1/2 | Revenue |
| PAT | Trendlyne reviewed evidence | normalization only | 1/2 | PAT |
| EPS | Trendlyne reviewed evidence | normalization only | 1/2 | EPS |
| ROE / ROCE | Trendlyne reviewed evidence | normalization only unless formula contract approved | 1/2 | ROE / ROCE |
| Cash-flow evidence | Trendlyne reviewed evidence | normalization only | 1/2 | CFO / cash metrics |
| Promoter / FII / DII / MF / Public holding | Trendlyne | normalization only | 1/2 | Ownership |
| Provider adjusted P/B | Trendlyne | — | 1 | Provider Adjusted P/B; preserve conflict semantics |
| Generic P/B | only an explicitly approved semantically equivalent source/calculation | PortfolioAI only if formula contract exists | 1/2 | P/B |
| Quality Score | validated fundamental inputs | PortfolioAI Quality Engine | 3 | Quality Score |
| Growth Score | validated growth inputs | PortfolioAI Growth Engine | 3 | Growth Score |
| Valuation Score | approved valuation inputs | PortfolioAI Valuation Engine | 3 | Valuation Score |
| Core Health | multiple validated domains | PortfolioAI Core Engine | 3 | Core Health |
| Portfolio Fit | holdings/weight/risk/role context | PortfolioAI Portfolio-Fit Engine | 3 | Portfolio Fit |
| Exit Score / Exit Review state | validated fundamental/market/portfolio evidence | PortfolioAI Exit Engine | 3 | Exit Review |
| Combined action state | deterministic domain outputs | PortfolioAI Action Engine | 3 | Add/Hold/Reduce/Exit Review |
| AI Investment Committee | selected evidence + deterministic outputs | optional AI | 4 | Narrative / synthesis |

---

## 6. Naming rules

Ambiguous names create long-term data risk. Names should distinguish source, semantic meaning, and calculation status.

### 6.1 Do not use ambiguous generic fields where multiple meanings exist

Avoid labels or internal names such as:

- `price`
- `score`
- `pb`
- `growth`
- `momentum`

without a domain-specific contract.

Prefer explicit semantic names such as:

- `current_price`
- `daily_close`
- `provider_adjusted_pb`
- `momentum_score_v1`
- `daily_trend_state`
- `weekly_trend_state`
- `portfolio_market_value`

Database names should remain provider-neutral where practical, with provider provenance stored separately. Provider-specific field names may exist in adapter/raw evidence contracts but should not leak into canonical domain types unnecessarily.

### 6.2 UI labels may be friendly but must remain semantically exact

Example:

- internal `PBV_ADJUSTED_PROVIDER`
- UI: **Provider Adjusted P/B**

It must never be shortened to generic **P/B** if the semantic contract says they are not equivalent.

---

## 7. Provenance requirements

Every important raw or derived research value must be traceable.

### 7.1 Raw/provider evidence should retain

- provider/source
- canonical security identity
- provider security identity where applicable
- source field/metric code
- raw/normalized value
- period
- scope
- unit
- currency where relevant
- publication date where available
- retrieval timestamp
- evidence status
- source record/hash where applicable

### 7.2 Derived calculations should retain or be reproducibly linked to

- calculation engine
- calculation version
- calculation timestamp
- input period start/end
- source data domain/version
- component values or a reproducible input reference
- any benchmark used
- output state/score

### 7.3 Composite scores should be explainable

A score such as `Momentum Score = 72` is not sufficient on its own.

PortfolioAI should be able to show:

- score
- state/label
- component contributions
- important supporting evidence
- contradictory evidence
- missing inputs
- engine version

---

## 8. Score + explanation policy

PortfolioAI should keep **both** the compact score and the human-understandable explanation.

Recommended presentation:

**Momentum Score: 72/100 — Positive**

Then expose the important drivers:

- Daily Trend: Neutral
- Weekly Trend: Positive
- Monthly Trend: Strong
- Price vs 200DMA: +14.2%
- 200DMA slope: Rising
- 6M relative performance vs NIFTY: +11.0 percentage points
- RSI: 58
- Relative volume: 0.8× 20-day average

Followed by a concise explanation:

> Long-term trend remains positive despite a short-term correction. Weekly and monthly structure are intact, price remains above a rising 200DMA, relative strength remains positive, and the correction is not accompanied by abnormal selling volume.

This rule should later apply to Quality, Growth, Valuation, Core Health, Portfolio Fit, Exit intelligence, and combined action states.

---

## 9. Planned Angel One market-intelligence architecture

### 9.1 Core data strategy

Use Angel One daily historical OHLCV as the single underlying market-history source where the provider contract supports the required coverage.

Prefer:

**Angel One Daily OHLCV → PortfolioAI Daily history → derive Weekly/Monthly → deterministic analytics**

Do not fetch redundant weekly/monthly history when it can be reproduced correctly from daily candles.

### 9.2 Intended historical coverage

Target:

- preferably up to 8 years of daily OHLCV where available
- minimum useful target around 5 years for established securities
- full available history for securities listed more recently

Historical loading should be incremental and idempotent:

1. initial backfill
2. record latest stored trading date
3. fetch only missing/new candles thereafter

### 9.3 Official PortfolioAI investment timeframes

- **Daily:** short/medium-term investment timing and current trend
- **Weekly:** primary medium-term trend
- **Monthly:** structural long-term trend

Intraday timeframes and WebSocket streaming are explicitly deferred unless future product needs justify them.

### 9.4 Planned technical calculations

Daily:

- SMA20
- SMA50
- SMA100
- SMA200
- SMA slopes
- RSI(14)
- MACD
- rate of change
- volume averages and relative volume
- returns
- 52-week position
- drawdown
- volatility
- ATR

Weekly:

- 10-week SMA
- 20-week SMA
- 40-week SMA
- weekly trend/momentum state

Monthly:

- 10-month SMA
- 20-month SMA
- monthly structural trend state

### 9.5 Relative strength

Initial benchmark:

- NIFTY 50 or another owner-approved broad-market benchmark with reliable market history

Later:

- sector/index benchmarks after canonical sector classification and benchmark mapping are trustworthy

PortfolioAI should calculate relative performance for useful windows such as 1M, 3M, 6M, and 12M.

### 9.6 Portfolio breadth

Planned portfolio-level deterministic analytics include:

- percentage of holdings above 20DMA
- percentage above 50DMA
- percentage above 200DMA
- percentage with positive weekly trend
- percentage with positive monthly trend
- percentage outperforming benchmark
- percentage near 52-week highs
- percentage in material drawdown

These are portfolio market-state inputs, not automatic trading instructions.

---

## 10. Research architecture: company vs market vs investment decision

To prevent conceptual mixing:

### Stage 7.2 — Company research layer

Question:

> **What do we know about the company?**

Includes:

- trusted fundamental evidence
- ownership
- valuation evidence
- documents
- evidence provenance
- research coverage/freshness

### Stage 7.3 — Market-intelligence layer

Question:

> **What is the stock doing in the market?**

Includes:

- current market state
- historical OHLCV
- daily/weekly/monthly trends
- moving averages
- momentum inputs
- volume
- relative strength
- drawdown and volatility
- market movement detection

### Stage 8 — Investment-intelligence layer

Question:

> **What does the company evidence + market evidence + valuation + portfolio context mean for this investment?**

Includes later deterministic engines such as:

- Quality/Growth
- Core Selection
- Core Health
- Satellite Opportunity
- Momentum Score
- Valuation state
- Portfolio Fit
- position sizing
- Exit intelligence
- combined action state

This stage must not erase the underlying component evidence.

---

## 11. Suggested Stage 8 substructure

To keep implementation understandable, Stage 8 should be split rather than built as one large opaque engine.

Suggested sequence:

- **8A — Canonical input and point-in-time lineage review**
- **8B — Quality & Growth Engine**
- **8C — Core Selection / Core Health / Satellite Opportunity**
- **8D — Momentum & Market State integration**
- **8E — Valuation Engine**
- **8F — Portfolio Fit & Position Sizing**
- **8G — Exit Intelligence**
- **8H — Combined Action Engine**

Exact stage numbering may be refined before implementation, but the conceptual separation should remain.

---

## 12. UI responsibility

### Research header

Should show authoritative portfolio/market facts such as:

- company identity
- sector/industry/classification when available
- Angel One CMP
- quantity
- invested amount
- current value
- P/L
- portfolio weight
- brokers/demat accounts
- target/stop-loss only when actually supported

### Research Overview

Should show research-at-a-glance:

- company/business context
- quality inputs
- growth inputs
- ownership
- valuation
- research health
- later market-state summary when Stage 7.3 is built

### Detailed tabs

Should expose evidence and source meaning rather than hiding it behind scores.

### Later Intelligence UI

May show compact scores/states, but should always provide a drill-down to the evidence and component explanation.

---

## 13. Data-source conflict policy

When multiple providers expose apparently similar values:

1. Do not average them automatically.
2. Do not silently choose the numerically convenient one.
3. Compare semantic contracts first: period, scope, unit, currency, adjusted/unadjusted definition, timestamp, and provider meaning.
4. Use the explicitly approved authority for that metric/domain.
5. Retain competing/conflicting evidence where useful.
6. Surface material conflicts to the user.
7. Change canonical authority only through an approved architecture decision.

---

## 14. Fallback policy

A fallback provider may be used only when:

- the primary authority is unavailable;
- the fallback's semantic contract is explicitly compatible;
- provenance clearly identifies the fallback;
- the UI can show that the value came from a fallback where material;
- the fallback does not silently overwrite primary-source history.

“No data” is preferable to an untraceable or semantically wrong value.

---

## 15. AI boundaries

AI is an explanation/synthesis layer, not a hidden calculation engine.

AI may receive structured context such as:

- Quality Score 81
- Growth Score 74
- Momentum Score 72
- Valuation state = Elevated
- portfolio weight = 3.8%
- weekly trend = Positive
- monthly trend = Strong
- one conflicting valuation observation

AI may then explain what those facts imply and what evidence deserves attention.

AI must not fabricate missing components or silently change the scores before explaining them.

---

## 16. Change-control rule

Any future proposal that changes the authoritative source for a domain, changes the semantic meaning of a canonical metric, or changes a score formula must explicitly update this document or an approved successor.

Examples requiring explicit review:

- replacing Angel One as current-price authority
- using Trendlyne technical data as primary market history
- changing `PBV_ADJUSTED_PROVIDER` into generic P/B
- changing Momentum Engine v1 weights
- replacing ledger-derived quantity with broker API quantity
- allowing AI to directly determine a deterministic score

These must never occur as incidental implementation details.

---

## 17. Immediate implementation boundary

This document defines architecture; it does not itself authorize Angel One historical backfill, new scoring engines, broader Trendlyne ingestion, WebSocket streaming, or Stage 8 implementation.

Current work should continue according to the owner-approved development stage. Before Stage 7.3 implementation, Codex should inspect the existing Stage 4 market-data foundation, current SmartAPI adapter, historical table contract, API rate controls, storage implications, and existing market identity mappings, then produce a bounded implementation plan and acceptance gates.

---

## 18. Research classification and methodology authority

PortfolioAI must keep **portfolio classification** separate from **micro-research methodology selection**.

The canonical hierarchy is:

```text
Macro-Economic Sector
        ↓
Sector
        ↓
Industry
        ↓
Basic Industry / Business Model
        ↓
Research Profile
        ↓
Research Subprofile
        ↓
Applicable Metrics / Peer Set / Valuation Family / Risk Model
        ↓
Company Evidence
        ↓
Deterministic Score
        ↓
Recommendation / Buy More / Hold / Reduce / Exit logic
```

The responsibilities of those layers are different:

- **Sector = macro context and portfolio classification.** It describes the broad economic environment and is suitable for allocation, concentration, benchmark context, and sector-level analysis.
- **Industry = minimum micro-research methodology selector.** It identifies the operating economics required to choose relevant company metrics, peers, valuation logic, and risk factors.
- **Basic Industry / Business Model = methodology refinement.** It distinguishes economically different businesses that may share the same sector and industry label.
- **Research Profile / Subprofile = deterministic applicability contract.** It determines which metrics are applicable, which peer universe and benchmark family are valid, which valuation methods are allowed, and which sector/business risks must be evaluated.
- **Company evidence = scoring input.** Evidence quality, growth, capital efficiency, cash flow, balance sheet, ownership/governance, momentum, valuation, risk and other profile-specific factors are evaluated here.
- **Score = company assessment.** Scores must remain reproducible from versioned evidence and methodology.
- **Recommendation = action logic.** Buy More / Hold / Reduce / Exit or equivalent recommendation states must be produced only after the correct methodology, evidence, score, valuation context, risk rules, and stability guardrails are satisfied.

### 18.1 Sector is not a specialised methodology selector

A sector label alone must **never** select a specialised stock-research methodology, scoring profile, valuation model, or recommendation policy.

Examples:

```text
Healthcare alone
≠ Pharma methodology
≠ Hospital methodology
≠ Diagnostics methodology

Financial Services alone
≠ Bank methodology
≠ NBFC methodology
≠ AMC methodology
≠ Broker methodology
≠ Insurance methodology
≠ Fintech methodology

Capital Goods alone
≠ EPC methodology
≠ Electrical Equipment methodology
≠ Defence/Aerospace methodology
```

The sector remains visible and canonical for portfolio classification, while the industry/business-model layer determines the appropriate research route.

### 18.2 Industry evidence may route independently of the visible sector label

Exchange-primary or canonical application sector and research methodology are separate layers.

For example:

```text
Sector = Healthcare
Industry = Pharmaceuticals
→ visible sector remains Healthcare
→ research profile may route to PHARMA
→ reviewed pharma subprofile selects the detailed methodology

Sector = Healthcare
Industry = Hospitals
→ visible sector remains Healthcare
→ research profile may route to HOSPITAL

Sector = Financial Services
Industry = Non Banking Financial Company (NBFC)
→ visible sector remains Financial Services
→ lender/NBFC methodology may apply

Sector = Capital Goods
Industry = Aerospace & Defence
→ visible sector remains Capital Goods
→ defence/aerospace methodology may apply
```

Research routing must never rewrite the canonical user-facing sector merely to make a methodology convenient.

### 18.3 Industry and Basic Industry are first-class research data

For every operating-company equity, PortfolioAI should retain, where authoritative evidence exists:

```text
Primary Sector
Industry
Basic Industry / Business Model
Classification Source
Classification Evidence State / Review State
Research Profile
Research Subprofile
Methodology Version
```

Missing industry or business-model evidence is a research-readiness problem, not permission to infer a methodology from company name, theme, peers, ticker, or sector similarity.

---

## 19. Fail-closed enforcement and change-control

The classification-to-methodology hierarchy above is a **system-wide architecture invariant**.

### 19.1 Required runtime behavior

For an operating-company equity:

```text
Sector known
+ Industry known
+ Industry/business-model route supported
→ specialised research profile may resolve

Sector known
+ Industry missing
→ PROFILE_PENDING or REVIEW_REQUIRED
→ no specialised methodology
→ no specialised score/recommendation

Sector known
+ Industry present but taxonomy unsupported/ambiguous
→ PROFILE_PENDING or REVIEW_REQUIRED
→ no nearest-looking fallback
```

A specialised score or recommendation must not be generated merely because a broad sector has a similarly named methodology.

### 19.2 Machine-readable taxonomy

The implementation should maintain a versioned machine-readable mapping from:

```text
Sector + Industry + Basic Industry / Business Model
→ Research Profile
→ Research Subprofile
→ Methodology Version
```

Stage-specific taxonomy files may evolve as research packages are developed, but they must conform to this canonical architecture and may not weaken the fail-closed rule.

### 19.3 Automated enforcement

Repository tests and architecture guards should reject regressions such as:

- routing a specialised methodology from sector alone;
- silently converting a canonical sector to match a research profile;
- assigning a nearest-looking methodology when industry is missing;
- producing a specialised score/recommendation for an unresolved research profile;
- using one industry's peer set, valuation family, or operating metrics for a materially different business model.

### 19.4 Branch and documentation rule

This document is the canonical PortfolioAI authority for the classification-to-methodology hierarchy.

Stage plans, handoff documents, completion reports, and branch-specific implementation notes may reference this rule, but must not redefine it.

Any future proposal to change:
- the role of Sector;
- the role of Industry / Basic Industry;
- profile/subprofile routing authority;
- the fail-closed behavior;
- or the relationship between methodology, scoring, and recommendation

requires an explicit update to this canonical architecture document and owner review.

---

## 20. Non-negotiable summary

PortfolioAI must always preserve these distinctions:

**Provider fact** ≠ **PortfolioAI calculation** ≠ **PortfolioAI score** ≠ **AI explanation** ≠ **human decision**

The application may bring all five together on one screen, but the provenance and authority of each must remain explicit and auditable.
