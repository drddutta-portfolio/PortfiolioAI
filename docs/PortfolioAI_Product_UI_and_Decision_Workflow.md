# PortfolioAI Product UI and Decision Workflow

**Document type:** Product/UI workflow specification  
**Project:** PortfolioAI  
**Status:** Planning / implementation reference  
**Authority:** This document is subordinate to the PortfolioAI Master Blueprint, Database Architecture, and Development Rules. If any conflict exists, those canonical governance documents take precedence.

---

## Shared signed-financial-value colors — 8 October 2026

All application surfaces use the same presentation tokens for canonical signed financial results: green (`--color-gain`) for gains, red (`--color-loss`) for losses, neutral for zero and muted for unavailable values. This applies to realised/unrealised P/L, covered returns, daily price movement and return contributions. Preserve signs, labels, coverage and source/period context; color alone must not convey a conclusion. Classify the canonical Decimal value before display rounding through the shared portfolio formatting helper. Colors must never introduce a separate calculation or turn unknown values into zero.

Prices, quantities, balances, categorical allocation charts, transaction types and research-readiness/quality states retain their own meanings. A green gain is not a research approval or buy recommendation. The common stock shell includes this rule for every stock; specialist research remains Industry-first and uses the effective canonical assignment.

## Scope Freeze A UI/release boundary — 5 October 2026

The V1 release boundary is governed by [PortfolioAI V1/V1.1/V2 Product Scope Freeze A](PortfolioAI_V1_V2_PRODUCT_SCOPE_FREEZE_2026-10-05.md).

The existing top-level navigation remains the V1 shell:

**Dashboard | Holdings | Portfolio Structure | Research | Intelligence | Transactions | Import | Settings**

V1 is an integration/correctness/completion program, not another broad UI redesign. V1 retains current-portfolio deterministic intelligence, Core/Satellite eligibility, Core Health, Satellite Opportunity, Valuation, current Momentum, Risk, Portfolio Fit, Position Sizing, Exit Risk, portfolio-aware advisory actions, optional grounded AI explanation and owner decision recording when prerequisites are satisfied.

`BLOCKED` is a readiness state rather than an investment opinion. Missing evidence must not be presented as HOLD/REDUCE/EXIT.

V1 selects the minimal thesis/invalidation record defined in Scope Freeze A where thesis-based exit reasoning is used. Owner decisions must reference the exact recommendation snapshot reviewed.

Richer monitoring/notifications/discovery may remain V1.1 release work unless the V1 audit proves a bounded subset is necessary for an accepted V1 workflow.

---

## 1. Purpose

This document defines the intended end-to-end user experience of PortfolioAI.

Its purpose is to translate the broader investment architecture into a clear application workflow covering:

- portfolio monitoring;
- holdings management;
- Core / Satellite / ETF / Other classification;
- user-controlled themes;
- company research;
- AI-assisted analysis;
- investment intelligence;
- target and stop-loss monitoring;
- add / hold / reduce / exit decision support;
- alerts and notifications;
- Trendlyne quota-aware enrichment;
- human approval of portfolio decisions;
- transaction entry/import;
- accounting and feedback into portfolio monitoring.

PortfolioAI is a **personal investment research and decision-support system**. It is not an autonomous trading system and must never execute investment decisions without user action.

---

# 2. Core Product Principle

PortfolioAI must clearly separate four layers:

1. **Trusted data**
2. **Deterministic calculations and engines**
3. **AI synthesis and explanation**
4. **Human decision**

The intended architecture is:

**Raw Data → Validation → Deterministic Engines → Structured Evidence → AI Context → AI Analysis / Investment Committee → Human Decision**

AI must not replace deterministic accounting or financial calculations.

AI may:

- synthesize;
- explain;
- compare;
- identify contradictions;
- interpret documents;
- summarize changes;
- generate portfolio reviews;
- produce evidence-grounded recommendations;
- explain why a stock may deserve Add / Hold / Reduce / Exit Review consideration.

AI must not:

- fabricate financial facts;
- silently modify deterministic calculations;
- invent catalysts;
- change portfolio roles automatically;
- alter transactions;
- place orders;
- act as the sole investment decision-maker.

---

# 3. Recommended Main Navigation

The intended final top-level navigation is:

**Dashboard | Holdings | Portfolio Structure | Research | Intelligence | Transactions | Import | Settings**

This is deliberately more compact than exposing every analytical engine as a separate top-level menu.

Functions such as Movement Radar, Exit Radar, Calendar, Screeners, Role Movement, Alerts, and Investment Committee should live inside **Intelligence**.

---

# 4. End-to-End User Workflow

The complete workflow should be:

**Data Acquisition**  
↓  
**Validation / Canonical Storage**  
↓  
**Portfolio & Accounting State**  
↓  
**Research**  
↓  
**Deterministic Analysis**  
↓  
**AI Explanation / Investment Committee**  
↓  
**Portfolio Context**  
↓  
**User Decision**  
↓  
**Transaction / Position Change**  
↓  
**Updated Holdings / Accounting**  
↓  
**Ongoing Monitoring / Alerts**

In practical use:

1. Open **Dashboard**.
2. Identify important movers, alerts, role-change candidates, theme changes, target hits, stop-loss hits, or research updates.
3. Click a stock to open **Research**.
4. Review financials, ownership, valuation, documents, evidence, and AI synthesis.
5. Check its current portfolio role and position size.
6. Review **Intelligence** signals:
   - Add candidate;
   - Hold;
   - Reduce;
   - Exit Review;
   - Core Watch;
   - Satellite Promotion Candidate;
   - target/stop-loss trigger;
   - theme headwind/tailwind.
7. Make the final human decision.
8. Enter/import the transaction if action is taken.
9. Holdings and accounting recalculate.
10. Dashboard and monitoring update automatically.

---

# 5. Dashboard

## Objective

Answer:

> What is happening to my portfolio now?

The Dashboard should be the executive summary of PortfolioAI.

## 5.1 Portfolio Summary

Display:

- total invested / covered cost;
- current portfolio value;
- unrealised P&L;
- realised P&L;
- total return %;
- number of current holdings;
- priced holding coverage;
- research coverage;
- last market-price refresh;
- latest research refresh status.

## 5.2 Portfolio Allocation

Show:

- Core;
- Satellite;
- ETF;
- Other;
- Unclassified.

Also show:

- Large / Mid / Small / ETF;
- sector allocation;
- industry allocation;
- theme exposure;
- broker exposure.

## 5.3 Performance

Show:

- best performers;
- worst performers;
- largest P&L contributors;
- largest P&L detractors.

**Return %** and **contribution to portfolio P&L** must remain separate concepts.

## 5.4 Theme Snapshot

Example:

| Theme | Exposure | Theme Return | Best Contributor | Outlook |
|---|---:|---:|---|---|
| Defence & Aerospace | 8.4% | +18.6% | BEL | Pending |
| Waste Management | 4.1% | +12.2% | WABAG | Pending |

Theme performance is an analytical overlay and is **not additive** to total portfolio performance.

## 5.5 Action Center

Future Dashboard Action Center should surface:

- Core Watch;
- Core At Risk;
- Satellite Promotion Candidate;
- Add Candidate;
- Reduce Candidate;
- Exit Review;
- Target Hit;
- Stop-Loss Hit;
- thesis review required;
- stale research;
- concentration warning;
- theme headwind/tailwind;
- important new result/document/news.

---

# 6. Holdings

## Objective

Answer:

> What do I own and how is every position performing?

The Holdings page is the operational portfolio table.

Recommended columns:

- Stock
- Current Role
- Themes
- Sector
- Industry
- Market Cap Category
- Quantity
- Average Cost
- CMP
- Current Value
- Unrealised P&L
- Unrealised Return
- Realised P&L
- Portfolio Weight
- Target Weight
- Min Weight
- Max Weight
- Target Price
- Stop-Loss
- Research Freshness
- Core Health
- Satellite Opportunity
- Valuation State
- Momentum State
- Exit Risk
- Action State

The user should be able to:

- sort;
- filter;
- search;
- choose visible columns;
- rank holdings by analytical state.

Clicking a stock/ticker should open its **Research** page.

---

# 7. Portfolio Structure

## Objective

Answer:

> How have I organised the portfolio?

Portfolio Structure should have three internal sections:

**Roles | Themes | Position Settings**

## 7.1 Roles

Primary role options:

- Core
- Satellite
- ETF
- Other
- Unclassified

The user must always be able to assign or change a role manually.

### Manual workflow

Each holding should provide:

**Edit Settings → Primary Role**

The user can select:

- Core
- Satellite
- ETF
- Other
- Unclassified

Bulk role assignment should also be supported.

Example:

Select 10 stocks → **Assign to Core**

### Future recommendation workflow

When deterministic engines are operational, the page should show:

| Stock | Current Role | Recommended Role | Confidence | Action |
|---|---|---|---|---|
| HDFCBANK | Unclassified | Core Candidate | High | Review |
| ZAGGLE | Satellite | Core Candidate | Medium | Review |

Actions:

- Accept Recommendation
- Keep Current
- Move to Satellite
- Move to Core
- Review Later
- Reject Recommendation

The App may recommend a role, but must not silently change it.

---

# 8. Core / Satellite Movement Monitoring

PortfolioAI should continuously evaluate role health.

## 8.1 Core states

Possible states:

- CORE
- CORE-WATCH
- CORE-AT-RISK
- DEMOTION CANDIDATE

Signals may include:

- earnings deterioration;
- growth slowdown;
- falling capital efficiency;
- weakening cash flow;
- balance-sheet deterioration;
- valuation excess;
- competitive deterioration;
- governance concerns;
- persistent thesis changes;
- momentum confirmation.

## 8.2 Satellite states

Possible future states:

- SATELLITE
- SATELLITE-WATCH
- CORE CANDIDATE
- CORE PROMOTION READY

## 8.3 Anti-churn rules

PortfolioAI should not cause excessive movement.

Rules:

- price weakness alone must not demote a Core stock;
- one weak quarter must not automatically demote a stock;
- promotion should normally require sustained evidence over multiple quarters;
- hard thesis breaks may accelerate review/demotion;
- soft deterioration and hard deterioration must be distinguished.

## 8.4 Human decision

For a Core stock under pressure:

- KEEP CORE
- MOVE TO SATELLITE
- MOVE TO REVIEW
- EXIT
- SNOOZE / REVIEW LATER

For a Satellite promotion candidate:

- PROMOTE TO CORE
- KEEP SATELLITE
- WATCH
- REJECT

---

# 9. Themes

## Objective

Answer:

> How is an investment theme performing and what is driving it?

Themes are **user-controlled analytical overlays**.

A security may belong to more than one theme.

Theme performance must never be added together to calculate total portfolio performance.

## 9.1 Theme Overview

For each theme show:

- number of holdings;
- portfolio exposure;
- covered cost basis;
- current value;
- unrealised P&L;
- unrealised return;
- realised P&L;
- concentration;
- best contributor;
- worst contributor.

## 9.2 Theme Constituents

Example:

| Stock | Theme Weight | Stock Return | P&L Contribution | Research Trend |
|---|---:|---:|---:|---|
| WABAG | 28% | +34% | +₹X | Improving |
| EMS | 22% | +17% | +₹X | Stable |
| AWHCL | 15% | -4% | -₹X | Weakening |

The UI must distinguish:

- **Stock Return %**
from
- **Contribution to Theme P&L**

A small holding with a large percentage gain may contribute less than a larger holding with a smaller percentage gain.

## 9.3 Theme Breadth

Future analytics should show:

- % of constituents with positive returns;
- % with improving revenue;
- % with improving PAT/EPS;
- % with improving margins;
- % with improving ROCE/ROE;
- ownership trend;
- valuation condition.

This helps distinguish:

> “The theme is doing well”

from:

> “One large stock is making the theme appear strong.”

## 9.4 Theme Outlook

Future evidence-backed states:

- TAILWIND
- NEUTRAL
- MIXED
- HEADWIND

Every state must expose:

- supporting evidence;
- counter-evidence;
- freshness;
- confidence;
- constituent breadth;
- provenance.

Possible portfolio consideration:

- Consider Increasing Exposure
- Maintain
- Selective Add
- Exercise Caution
- Review Exposure

These are decision-support signals only.

---

# 10. Research

## Objective

Answer:

> What is the complete research picture for this stock?

Recommended route:

`/app/research/:security`

Recommended internal tabs:

**Overview | Financials | Quality & Growth | Ownership | Valuation | Documents | Evidence**

## 10.1 Research Overview

Show:

- company name;
- ticker;
- sector;
- industry;
- market-cap category;
- raw current market cap;
- CMP;
- quantity;
- average cost;
- current value;
- portfolio weight;
- current role;
- themes;
- target price;
- stop-loss;
- target weight;
- research freshness.

Key research cards may include:

- ROE;
- ROCE;
- Revenue;
- PAT;
- EPS;
- CFO;
- P/E;
- P/B;
- Promoter holding;
- FII/FPI;
- DII;
- Mutual Fund holding;
- Promoter pledge.

Every card should show, where available:

- value;
- period;
- source;
- freshness;
- evidence status.

## 10.2 Financials

Show:

- Revenue;
- EBITDA / Operating Profit;
- PAT;
- EPS;
- CFO;
- balance-sheet items;
- annual history;
- quarterly history;
- TTM where valid.

Historical charts may later support:

- 3Y;
- 5Y;
- 10Y.

Missing fields must display **Unavailable**, never fabricated zeros.

## 10.3 Quality & Growth

Show:

### Growth
- Revenue CAGR
- PAT CAGR
- EPS CAGR
- quarterly acceleration/deceleration
- earnings consistency

### Quality
- ROE
- ROCE
- operating margin
- net margin
- cash conversion
- capital efficiency

### Balance Sheet
- debt
- cash
- leverage
- interest coverage
- debt trend

## 10.4 Ownership

Show:

- Promoter %
- Promoter Pledge %
- FII/FPI %
- DII %
- Mutual Funds %
- Public %

Provide quarterly history where available.

## 10.5 Valuation

Future valuation workspace may include:

- Market Cap
- P/E
- P/B
- EV/EBITDA
- PEG
- FCF Yield
- Dividend Yield
- historical valuation
- peer valuation
- sector valuation
- growth-adjusted valuation

## 10.6 Documents

Show:

- Annual Reports
- Quarterly Results
- Investor Presentations
- Earnings Calls / Concalls
- important filings
- announcements

Each document should display:

- date;
- reporting period where known;
- provider/source;
- evidence status;
- open/view action.

## 10.7 Evidence & Data Quality

Important metrics should expose provenance.

Example:

| Metric | Value | Provider | Period | Status |
|---|---:|---|---|---|
| ROE | 18.4% | Trendlyne | FY26 | Provisional |
| P/E | 31.2 | Trendlyne | Current | Provisional |
| Promoter | 51.1% | Trendlyne | Jun-26 | Verified |

Statuses may include:

- Verified
- Provisional
- Ambiguous
- Conflicting
- Review Required
- Unavailable

---

# 11. Intelligence

## Objective

Answer:

> What deserves my attention and what action should I consider?

Recommended internal sections:

**Role Movement | Add/Reduce Radar | Exit Radar | Price Alerts | Movement Radar | Calendar | Screeners | Investment Committee**

---

# 12. Add / Hold / Reduce / Exit Decision Support

PortfolioAI should not reduce every decision to a simplistic Buy/Sell button.

The deterministic system should combine independent dimensions such as:

- business quality;
- sustainable growth;
- capital efficiency;
- cash generation;
- balance sheet;
- valuation;
- momentum;
- ownership / revisions;
- theme / sector conditions;
- current portfolio weight;
- concentration;
- target weight;
- current role;
- target/stop-loss status;
- exit-risk signals;
- thesis state.

Possible states:

- ADD CANDIDATE
- ADD ON WEAKNESS
- HOLD / MAINTAIN
- SELECTIVE ADD
- REDUCE CANDIDATE
- TRIM INTO STRENGTH
- FREEZE
- EXIT REVIEW
- EXIT CANDIDATE
- INSUFFICIENT EVIDENCE

The deterministic engine produces the state.

AI explains:

- why;
- supporting evidence;
- counter-evidence;
- uncertainties;
- what changed;
- what to monitor next.

The final action remains with the user.

---

# 13. Exit Radar

Exit is different from Reduce.

**Reduce** may happen because of:

- overweight position;
- valuation;
- concentration;
- portfolio fit;
- position-sizing discipline.

**Exit** should relate primarily to:

- thesis deterioration;
- earnings deterioration;
- cash-flow deterioration;
- falling capital efficiency;
- balance-sheet deterioration;
- competitive deterioration;
- governance concerns;
- permanent-loss risk.

Possible statuses:

- Healthy
- Monitor
- Exit Watch
- Exit Candidate
- High Exit Risk

Exceptional events may create a **Hard Exit Flag**.

---

# 14. Target Price, Stop-Loss and Position Settings

Target and stop-loss values belong to the **position**, not to historical transactions.

Each security may have:

- Target Price
- Stop-Loss Price
- Review Price
- Target Weight
- Min Weight
- Max Weight
- Investment Horizon
- Thesis Invalidation Note
- Position Notes

---

# 15. Price Alerts

PortfolioAI should monitor trusted current prices against user-defined thresholds.

## Target Hit

Example:

**TARGET HIT — HDFCBANK**

- CMP: ₹2,145
- Target: ₹2,120
- Current Return: +18.7%

Suggested workflow:

**Review Valuation / Thesis → Decide Hold / Trim / Raise Target / Exit**

## Stop-Loss Hit

Example:

**STOP-LOSS HIT — ZAGGLE**

- CMP: ₹388
- Stop-Loss: ₹395

Suggested workflow:

**Immediate Review → Hold / Reduce / Exit / Change Threshold**

The system should use deduplicated alerts so the user is not repeatedly notified every refresh cycle.

Future notification channels may include:

- in-app;
- email;
- WhatsApp;
- push notification.

---

# 16. Movement Radar

Movement Radar should monitor both:

## Portfolio role transitions

- Core → Watch
- Core → At Risk
- Core → Satellite
- Core → Exit Review
- Satellite → Core Candidate
- Satellite → Promotion Ready

and:

## Market movement

Why did a stock move?

Possible evidence:

- results;
- announcements;
- company news;
- sector movement;
- broad market movement;
- volume;
- technical breakout/breakdown;
- verified external evidence.

If no reliable cause is found, PortfolioAI must say so rather than fabricate a reason.

---

# 17. Portfolio Calendar

Future Calendar should show:

## Next 7 days
- results;
- board meetings;
- dividends;
- investor presentations;
- earnings calls;
- corporate actions;
- material announcements.

## Next 2–4 weeks
- upcoming results;
- sector events;
- macro events;
- portfolio-specific risk windows.

Portfolio holdings should receive priority highlighting.

---

# 18. Investment Committee / AI Layer

This is where AI becomes the conversational analytical layer of PortfolioAI.

Possible actions:

- Analyse this stock
- Why is this a Core Candidate?
- Why is this Core stock now At Risk?
- Should I add more?
- Why is PortfolioAI recommending Reduce?
- Compare these two stocks
- Review this theme
- Summarize the latest result
- Explain contradictions between fundamentals and momentum
- Generate weekly portfolio review
- Explain why a target/stop-loss alert matters

AI should receive structured PortfolioAI evidence rather than uncontrolled raw values wherever possible.

AI should cite or identify supporting evidence in the application.

---

# 19. Transactions

## Objective

Answer:

> What portfolio transactions have actually occurred?

Recommended sub-sections:

- All
- Buys
- Sells
- Manual
- Corrections
- Audit

Transactions remain the source of truth for holdings/accounting.

Research signals and recommendations must never rewrite transaction history.

---

# 20. Import

## Objective

Handle data acquisition and reconciliation.

Possible sections:

**Upload | Mapping | Validation | Import History**

Sources may include:

- XLSX;
- CSV;
- broker exports;
- future broker/API imports;
- Screener structured fallback files.

Import must remain separate from analytical Research.

---

# 21. Settings

Recommended sections:

**Portfolio | Data Sources | Refresh | Position Rules | Themes | Research Metrics | Alerts | AI | Security/Admin**

---

# 22. Trendlyne Quota Management

PortfolioAI must be designed to remain within the subscribed Trendlyne MCP quota.

The current MCP Pro plan is quota-constrained, so the normal UI must be **cache-first**.

## Fundamental rule

Opening:

- Dashboard;
- Holdings;
- Research;
- Portfolio Structure;
- Theme Analytics

must **not automatically trigger live Trendlyne calls**.

Normal flow:

**UI → Supabase cached/canonical data**

Refresh flow:

**Trusted backend → Trendlyne MCP → evidence → Supabase → UI**

## 22.1 Trendlyne Settings Panel

Example:

**Trendlyne MCP**

- Connection: Active
- Daily Usage: X / 400
- Monthly Usage: X / 2,000
- Last Successful Refresh
- Last Failed Refresh
- Next Scheduled Refresh

Recommended refresh classes:

- Identity: infrequent / conflict-driven
- Annual Financials: filing-driven
- Quarterly Financials: result-driven
- Shareholding: quarterly
- Documents: event-driven
- Raw Market Cap: controlled refresh
- News: selective / on-demand
- Technicals: prefer Angel One where appropriate

## 22.2 Manual Refresh Cost Estimate

Before a manual refresh, show estimated quota cost.

Example:

**Refresh BEL Research**

Estimated calls:

- Fundamentals: 1
- Ownership: 1
- Documents: 1

**Estimated total: 3 calls**

## 22.3 Bulk Refresh Protection

Before bulk enrichment:

**249 holdings**

- Estimated calls: 620
- Monthly remaining: 1,842
- Estimated remaining after refresh: 1,222

Actions:

- Refresh All Eligible
- Refresh Only Stale
- Refresh Selected
- Cancel

## 22.4 Quota Protection States

### Normal
Enough quota available.

### Caution
Usage approaching monthly limit.

Prefer:

- stale securities;
- upcoming results;
- user-requested refreshes.

### Conservation
Near monthly limit.

Disable non-essential automated Trendlyne calls.

Allow only:

- manually requested research;
- critical result refresh;
- selected high-priority holdings.

PortfolioAI must never unintentionally exhaust the monthly quota.

---

# 23. AI Usage Efficiency

AI usage should also be controlled.

Recommended modes:

1. **No AI** — deterministic calculation
2. **Event-driven AI** — result / material event
3. **Weekly AI** — portfolio review
4. **On-demand AI** — user request

Avoid repeatedly sending unchanged information.

Where practical, track:

- provider;
- model;
- time;
- usage;
- estimated cost;
- prompt version;
- context version;
- subject analysed.

---

# 24. Human-Control Principle

PortfolioAI should generate **recommendations**, not autonomous portfolio changes.

Examples:

### Role recommendation

**Current:** Satellite  
**Recommended:** Core Candidate  
**Evidence:** sustained growth, strong ROCE, improving cash generation  
**User actions:** Promote / Keep Satellite / Watch / Reject

### Exit recommendation

**Status:** Exit Review  
**Evidence:** earnings deterioration + balance-sheet weakening  
**User actions:** Hold / Reduce / Exit / Review Later

### Add recommendation

**Status:** Selective Add  
**Evidence:** strong business + attractive valuation + below target weight  
**User actions:** Add / Ignore / Change Target Weight

The user remains the final decision-maker.

---

# 25. Alerts and Notifications

Future Action Center should support:

- target price crossed;
- stop-loss crossed;
- Core Watch;
- Core At Risk;
- Core Demotion Candidate;
- Satellite Promotion Candidate;
- overweight position;
- underweight Core position;
- thesis invalidation;
- exit risk;
- concentration alert;
- theme headwind/tailwind;
- major result/document;
- research freshness warning.

Alerts should be:

- deduplicated;
- timestamped;
- acknowledged;
- snoozable where appropriate;
- historically reviewable.

No alert should automatically place a market order.

---

# 26. Portfolio Decision Loop

The final PortfolioAI operating loop is:

**Observe**  
Dashboard / Alerts

↓  

**Investigate**  
Research

↓  

**Interpret**  
Deterministic engines + AI

↓  

**Place in portfolio context**  
Role + Weight + Theme + Risk + Target

↓  

**Decide**  
Human investment decision

↓  

**Execute externally / record transaction**  

↓  

**Recalculate**  
Holdings + Accounting

↓  

**Monitor again**

---

# 27. Recommended Development Sequence

The UI should be implemented progressively.

## Stage A — Research / Production Enrichment
- scale trusted research data;
- canonical metric policy;
- quota management;
- Research workspace.

## Stage B — Theme Performance
- theme return;
- contributor analysis;
- concentration;
- breadth foundation.

## Stage C — Position Monitoring
- target price;
- stop-loss;
- target/min/max weights;
- alert history;
- notification infrastructure.

## Stage D — Core / Satellite Analytical Engines
- Core Candidate;
- Satellite Candidate;
- Core Health;
- Movement Radar;
- user approval workflow.

## Stage E — Add / Reduce / Exit Intelligence
- position sizing;
- valuation;
- momentum;
- risk;
- Exit Radar;
- Add/Reduce Radar.

## Stage F — AI Investment Committee
- document interpretation;
- evidence-grounded recommendations;
- weekly review;
- contradiction analysis;
- on-demand portfolio questions.

## Stage G — Theme Outlook
- fundamental breadth;
- news/policy evidence;
- tailwind/headwind states;
- theme decision support.

---

# 28. Final UX Principle

PortfolioAI should feel like a **professional personal investment committee terminal**, not a spreadsheet and not a trading bot.

The interface should always make it clear:

- what the data says;
- what the deterministic engines say;
- what AI concludes;
- what is uncertain;
- what changed;
- what requires attention;
- what action is being suggested;
- and that the final investment decision belongs to the user.

---

## Governance Note

This document is a product/UI workflow specification.

It does not override:

1. `PortfolioAI_Master_Blueprint.md`
2. `PortfolioAI_Database_Architecture.md`
3. `PortfolioAI_Development_Rules.md`

The Development Status and stage-specific documents should reference this file when implementing user-facing PortfolioAI workflow.

Recommended filename:

`PortfolioAI_Product_UI_and_Decision_Workflow.md`
