# PortfolioAI — Sector Research Profile Architecture

**Status:** Architecture candidate for owner review; documentation only  
**Purpose:** Define the sector-aware company-research contracts that will feed PortfolioAI deterministic scoring, recommendation, Core Health, Exit, and Position Sizing engines.  
**Scope:** Indian listed equities. ETFs and other non-equity assets remain outside these equity research profiles unless separately contracted.  
**Authority:** Subordinate to `PortfolioAI_Master_Blueprint.md`, `PortfolioAI_Research_and_Intelligence_Architecture.md`, `PortfolioAI_Database_Architecture.md`, `PortfolioAI_Development_Rules.md`, and `PortfolioAI_Integration_and_Execution_Plan.md`.

---

## 1. Core design rule

PortfolioAI must not apply one generic fundamental formula to every company.

The research chain is:

```text
Security
  -> canonical sector
  -> research subprofile
  -> universal overlays
  -> profile-specific evidence and deterministic calculations
  -> standardized investment dimensions
  -> recommendation
  -> portfolio-context engines
  -> position sizing / Core Health / Exit / combined action
```

The generic Research UI remains reusable by `security_id`. The evidence and scoring contract changes by research profile.

A sector label is not itself a scoring formula. Example: `BANKING_FINANCIAL_SERVICES` contains banks, NBFC/lenders, insurers, AMCs, brokers, exchanges and depositories, which require different research contracts.

Missing or inapplicable evidence must never be silently replaced by zero, estimates, or a metric from another profile.

---

## 2. Canonical sector vs research subprofile vs overlay

PortfolioAI uses three distinct concepts.

### 2.1 Canonical sector

Stable owner-facing taxonomy for portfolio allocation, concentration, filtering and Dashboard reporting.

Initial Indian-equity sector set:

1. Banking & Financial Services
2. Information Technology
3. Oil, Gas & Energy
4. FMCG
5. Automobile & Auto Ancillaries
6. Pharmaceuticals & Healthcare
7. Metals & Mining
8. Cement & Construction Materials
9. Infrastructure & Capital Goods
10. Telecommunications
11. Consumer Durables
12. Real Estate
13. Chemicals & Fertilizers
14. Textiles
15. Media & Entertainment
16. Power & Utilities
17. Agriculture & Allied
18. Aviation & Logistics
19. New-Age / Digital Businesses
20. Defence

### 2.2 Research subprofile

Fine-grained operating model used to determine metric applicability and scoring rules.

Examples:

- `BANK`
- `NBFC_LENDING`
- `LIFE_INSURANCE`
- `GENERAL_INSURANCE`
- `IT_SERVICES`
- `AUTO_OEM`
- `AUTO_COMPONENTS`
- `PHARMA`
- `HOSPITAL`
- `DIAGNOSTICS`
- `CEMENT`
- `RENEWABLE_POWER`
- `AVIATION`
- `LOGISTICS`
- `DIGITAL_PLATFORM`
- `DEFENCE_AEROSPACE`

### 2.3 Overlays

Cross-sector attributes that modify analysis but do not replace the operating sector:

- `PSU`
- `MNC_SUBSIDIARY`
- `FOUNDER_PROMOTER_LED`
- `HOLDING_COMPANY_SOTP`
- `CYCLICAL`
- `RATE_SENSITIVE`
- `FX_SENSITIVE`
- `COMMODITY_INPUT_SENSITIVE`
- `REGULATED_POLICY_SENSITIVE`
- `EXPORT_HEAVY`

A security may have multiple overlays.

---

## 3. Universal overlay — every equity

Universal evidence runs before profile-specific scoring.

### 3.1 Governance and accounting-quality evidence

Track where trustworthy evidence exists:

- promoter shareholding trend;
- promoter pledge;
- related-party transactions;
- auditor changes/resignations;
- qualified/adverse audit observations;
- independent-director turnover;
- material preferential allotments, warrants, repeated dilution;
- multi-year CFO versus PAT divergence;
- regulatory/governance enforcement where official evidence exists.

Governance must not use a simplistic `two flags = fail` rule. Events are classified by severity:

- `CRITICAL`
- `HIGH`
- `MODERATE`
- `INFORMATIONAL`

Derived governance states:

- `GOVERNANCE_CLEAR`
- `GOVERNANCE_WATCH`
- `GOVERNANCE_HIGH_RISK`
- `GOVERNANCE_BLOCKED_REVIEW`

A critical event may block downstream scoring pending review. Multiple moderate items may reduce confidence without automatically failing the company.

### 3.2 Macro sensitivity

Many-to-many tags, not a single classification:

- rate sensitivity;
- FX sensitivity;
- commodity-input sensitivity;
- regulation/policy sensitivity;
- cyclical/defensive/secular-growth context.

These are portfolio-risk and interpretation inputs, not automatic investment recommendations.

### 3.3 Ownership and structural form

Record as facts:

- private;
- PSU;
- MNC subsidiary;
- founder/promoter-led;
- dispersed ownership;
- holding-company/conglomerate structure.

PortfolioAI must not hard-code a generic valuation penalty merely because a company is a PSU or holding company. Structural type routes the company to the appropriate valuation method.

---

## 4. Standard metric contract

Every sector/profile metric definition must be machine-readable and versioned.

Minimum contract fields:

```text
metric_code
profile_code
applicability
requirement_level
period_types
minimum_history
preferred_history
direction
normalization_method
calculation_owner
source_contract
freshness_policy
score_curve_version
reason_code_namespace
```

### 4.1 Applicability

- `APPLICABLE`
- `NOT_APPLICABLE`
- `CONDITIONAL`

Example: `GNPA_RATIO` is applicable to `BANK` and not applicable to `IT_SERVICES`.

### 4.2 Requirement level

- `MANDATORY` — missing blocks the relevant dimension/profile score;
- `IMPORTANT` — missing lowers evidence coverage/confidence;
- `SUPPLEMENTARY` — useful for interpretation but non-blocking.

### 4.3 Research readiness states

- `READY`
- `PARTIAL`
- `INSUFFICIENT_EVIDENCE`
- `PROFILE_PENDING`
- `BLOCKED_REVIEW`
- `NOT_APPLICABLE`

No numeric score should be forced when mandatory evidence is absent.

---

## 5. Historical interpretation

PortfolioAI should distinguish:

- current level;
- trend;
- consistency;
- acceleration/deceleration;
- cycle context where applicable.

Profile contracts should specify minimum and preferred history. Typical preferences:

- quarterly metrics: at least 8 quarters where available;
- annual metrics: 3–5 years where economically meaningful;
- cyclicals: longer history where needed to avoid peak/trough misinterpretation.

One quarter alone must not silently determine long-term business quality.

---

## 6. Standardized investment outputs

Profile-specific metrics are converted into a common downstream interface:

- `quality_state` / score;
- `growth_state` / score;
- `financial_strength_state` / score;
- `earnings_cash_quality_state` / score;
- `business_durability_state` / score;
- `valuation_state` / score;
- `risk_state` / score;
- `evidence_coverage`;
- `evidence_confidence`;
- `profile_code` + `profile_version`;
- missing/blocking inputs;
- reason codes;
- supporting and contradictory evidence lineage.

Downstream engines consume these standardized outputs rather than raw sector ratios.

---

# 7. Sector and research-profile contracts

## 7.1 Banking & Financial Services

### BANK

**Research questions:** sustainable loan/deposit growth, liability franchise quality, underwriting quality, credit-loss control, capital strength, durable ROA/ROE, valuation versus franchise quality.

**Mandatory core evidence:**

- loan/advances growth;
- deposit growth;
- NII growth;
- ROA;
- ROE;
- NIM;
- GNPA;
- NNPA;
- capital adequacy/CAR or equivalent capital measure;
- PAT/EPS history.

**Important evidence:** credit cost, provision coverage, slippages, recoveries/upgrades, CASA, credit/deposit ratio, CET1/Tier-1, cost-to-income, unsecured exposure, fee income.

**Valuation profile:** P/B, valid adjusted-book variants where semantically reviewed, P/E, ROE/ROA versus valuation, own-history and bank-peer comparison.

**Red flags:** worsening GNPA/NNPA, rising slippages/credit cost, falling provision coverage, loan growth materially outrunning funding, weakening CASA/NIM with worsening credit, weakening capital, aggressive unsecured growth, material governance/regulatory events.

**Reference stock:** HDFCBANK.

### NBFC_LENDING

**Core evidence:** AUM growth, disbursement growth, NIM/spread, ROA, ROE, Stage-2/Stage-3 or GNPA/NNPA evidence, credit cost, capital adequacy, leverage, cost of funds.

**Important evidence:** provision coverage, write-offs, secured/unsecured mix, funding mix, securitisation/co-lending, liquidity, ALM profile.

**Valuation:** P/B, P/E, ROA/ROE-adjusted comparison, historical and peer valuation.

**Red flags:** rising Stage-2/3, excessive unsecured growth, funding-cost shock, ALM mismatch, rising leverage, falling capital adequacy, weak liquidity.

### LIFE_INSURANCE

Track APE, VNB, VNB growth, VNB margin, embedded value, EV growth, persistency, solvency, product mix, protection mix and distribution quality.

**Valuation:** P/EV, VNB multiples, growth-adjusted VNB valuation.

### GENERAL_INSURANCE

Track gross written premium, premium growth, combined ratio, loss ratio, expense ratio, underwriting result, investment income and solvency.

### CAPITAL_MARKET_FINANCIAL

Subtype overlays:

- AMC: AUM, equity AUM, market share, net flows, yield on AUM, operating margin;
- Broker/wealth: active clients, client assets, market share, broking/fee revenue, financing exposure;
- Exchange: transaction volume, market share, transaction/data/listing revenue;
- Depository: demat accounts, transaction activity, issuer/client growth.

Generic bank asset-quality metrics do not apply.

---

## 7.2 Information Technology

### IT_SERVICES

**Mandatory/important evidence:** revenue growth, constant-currency growth where disclosed, EBIT/EBITDA margin, ROCE, ROE, CFO/FCF conversion, net cash/debt, deal wins/TCV where available.

Operational evidence: utilization, attrition, employee growth, subcontracting cost, top-client concentration, geography and vertical mix.

**Structural overlay:** AI/GenAI exposure should be evidence-based (service mix, disclosed AI/data work, legacy exposure, AI order wins), not stored as unsupported opinion.

**Valuation:** P/E, PEG, EV/EBITDA, FCF yield, own history and peers.

**Red flags:** repeated guidance reductions, weak bookings, persistent margin erosion, weak FCF conversion, rising receivables, concentration risk.

**Reference candidate:** INFY after evidence/readiness review.

### SOFTWARE_PRODUCT

Future specialty profile. Track recurring revenue/ARR where relevant, retention, product growth, gross margin, R&D intensity, sales efficiency, FCF and customer concentration.

---

## 7.3 Oil, Gas & Energy

### UPSTREAM_OIL_GAS

Production, reserves, reserve replacement, realization, lifting cost, capex, FCF and balance-sheet resilience.

### REFINING_DOWNSTREAM

Throughput, utilization, GRM, product cracks, feedstock economics, marketing margins and capex.

### GAS_TRANSMISSION_DISTRIBUTION

Transmission/marketing volumes, utilization, tariff, margin, infrastructure and regulatory terms.

### INTEGRATED_ENERGY

Use segment-aware evidence rather than forcing a single ratio across upstream, refining, petrochemicals and newer energy businesses.

**Valuation methods:** subtype-dependent EV/EBITDA, P/E, FCF yield, dividend yield, asset/reserve evidence where valid.

---

## 7.4 FMCG

### FMCG_CONSUMER_STAPLES

Emphasize genuine demand and franchise strength.

Track revenue growth, volume growth, price/mix, gross margin, EBITDA margin, ROCE, ROE, FCF, working capital, market share, distribution reach, rural/urban mix and premiumization.

PortfolioAI should distinguish volume-led from pricing-led growth.

**Valuation:** P/E, PEG, FCF yield, own-history premium and deterministic premium-justification inputs.

**Red flags:** volume weakness hidden by pricing, persistent market-share loss, weak cash conversion, inventory/margin deterioration.

---

## 7.5 Automobile & Auto Ancillaries

### AUTO_OEM

Vehicle volume, retail/registration evidence where available, market share, realization, segment mix, exports, EBITDA margin, ROCE, utilization, FCF and balance sheet.

Track dealer/channel inventory to distinguish wholesale dispatch from end demand.

### AUTO_COMPONENTS

Add order wins, OEM/customer concentration, content per vehicle, platform exposure, export mix and EV/ICE transition exposure.

**Structural evidence:** EV transition, regulation, premiumization, commodity costs.

**Valuation:** P/E, EV/EBITDA, P/B where appropriate, FCF yield, cycle-adjusted context.

**Reference candidate:** M&M for OEM after readiness review.

---

## 7.6 Pharmaceuticals & Healthcare

### PHARMA

Revenue growth, domestic and export/US growth, EBITDA margin, R&D intensity, ROCE, FCF, debt, product pipeline, launches and approvals.

**Regulatory evidence has high priority:** USFDA inspections, Form 483, warning letters, import alerts, remediation and plant approvals.

**Red flags:** unresolved plant action, product/geography concentration, price erosion, litigation/regulatory risk, weak R&D productivity.

### HOSPITAL

Occupancy, ARPOB, beds, bed additions, mature/new-facility economics, EBITDA/bed, margins, ROCE, capex and FCF.

### DIAGNOSTICS

Test volumes, realization/test, network expansion, franchise/owned mix, margins and cash generation.

---

## 7.7 Metals & Mining

### METALS_MINING

Production, sales volume, realization, cost/unit, EBITDA/unit, capacity, utilization, net debt, FCF and capex.

Add global/domestic commodity context, China/global supply, duties and key raw-material evidence.

**Cycle-aware rule:** current/trailing P/E must not dominate valuation at cyclical peaks or troughs.

Future deterministic cycle states may include `EARLY_UPCYCLE`, `MID_CYCLE`, `LATE_CYCLE`, `DOWNTURN`, `RECOVERY`, `UNKNOWN` only when evidence is sufficient.

**Valuation:** EV/EBITDA, P/B, normalized earnings, FCF and asset context.

---

## 7.8 Cement & Construction Materials

### CEMENT

Volume, realization/tonne, EBITDA/tonne, fuel cost, freight cost, capacity, utilization, clinker capacity, regional exposure and expansion pipeline.

**Valuation:** EV/EBITDA, EV/tonne, replacement-cost context, supplementary P/E.

### BUILDING_MATERIALS

Future subtype overlays for pipes, tiles, sanitaryware, boards and related categories using volume, realization, capacity, brand/distribution, working capital and ROCE.

---

## 7.9 Infrastructure & Capital Goods

### INDUSTRIAL_CAPITAL_GOODS

Order inflow, order book, book-to-bill, execution/revenue growth, EBITDA margin, ROCE, CFO, FCF, receivables, working capital and capacity utilization.

Order-book size is supporting evidence only; quality requires executable orders and collections.

**Red flags:** order-book growth without execution, receivables growing faster than revenue, poor CFO/PAT, project delays, customer concentration, rising debt despite reported profit growth.

---

## 7.10 Telecommunications

### TELECOM

Subscribers, ARPU, churn, market share, data usage, EBITDA margin, network capex, spectrum liabilities, net debt and FCF.

**External/structural evidence:** tariffs, spectrum, competition and regulatory policy.

**Valuation:** EV/EBITDA and FCF primary; EV/subscriber supplementary where meaningful.

---

## 7.11 Consumer Durables

### CONSUMER_DURABLES

Revenue and volume growth, product/category mix, market share, margins, ROCE, inventory, working capital, FCF and distribution.

Important macro/cycle context: housing, discretionary demand, commodity costs and seasonality.

### JEWELLERY_RETAIL_OVERLAY

For Titan-like businesses add store growth, same-store/like-for-like growth where disclosed, inventory turns, category mix, network and capital employed.

---

## 7.12 Real Estate

### REAL_ESTATE

Pre-sales/bookings, collections, launches, area sold, realization/sq ft, project pipeline, land bank, inventory, net debt and operating cash flow.

Derived metrics may include collection efficiency, debt/cash generation and inventory overhang.

**Valuation:** NAV only when project-level inputs are trustworthy, plus NAV premium/discount, P/B, EV and normalized cash/earnings measures.

Never fabricate NAV.

---

## 7.13 Chemicals & Fertilizers

### CHEMICALS

Volumes, realization, capacity, utilization, product mix, export mix, customer concentration, margins, ROCE, FCF and working capital.

Structural evidence: China/global supply, feedstock costs, environmental rules, backward integration and molecule/product concentration.

### FERTILIZER_AGROCHEM

Product volumes, crop cycle, acreage, monsoon context, inventory, subsidy receivables, raw-material/input costs, regulated pricing and import dependence.

---

## 7.14 Textiles

### TEXTILES_COMMODITY

Revenue, volumes, realization, cotton/yarn/raw-material costs, capacity, utilization, export/domestic mix, margins, ROCE, working capital, debt and FCF.

Cycle and raw-material economics carry high weight.

### BRANDED_APPAREL

Add store growth, like-for-like growth, brand/distribution strength, inventory turns, working capital and channel mix.

---

## 7.15 Media & Entertainment

### MEDIA_ENTERTAINMENT

Advertising revenue, subscription revenue, audience/viewership evidence, content costs, EBITDA margin, digital revenue, subscribers where relevant and cash generation.

Risk evidence: advertising cyclicality, content-cost inflation, regulation and platform disruption.

Digital-first businesses may route to `DIGITAL_PLATFORM` where that better reflects economics.

---

## 7.16 Power & Utilities

### CONVENTIONAL_POWER

Capacity, generation, PLF, tariffs, regulated/contracted returns where relevant, fuel availability, receivables, debt and interest coverage.

### TRANSMISSION

Asset base, capitalization, regulated return, project pipeline and availability factor.

### RENEWABLE_POWER

Operational capacity, under-construction capacity, pipeline, CUF/PLF, tariff, PPA counterparty quality, commissioning execution, leverage and project returns.

Valuation is subtype-specific using EV/EBITDA, P/B, FCF/dividend yield and project economics where contractually supported.

---

## 7.17 Agriculture & Allied

Possible subprofiles include `SEEDS`, `AGRI_INPUTS`, `IRRIGATION`, `FOOD_PROCESSING` and commodity-linked agricultural businesses.

Common evidence: volumes, market share, realization, margins, working capital, commodity exposure and rural demand.

External overlays where approved: monsoon, acreage, crop prices, MSP/subsidy policy, inventories and export restrictions.

Food processors add brand strength, capacity, input-cost management and cash conversion.

---

## 7.18 Aviation & Logistics

### AVIATION

Passengers, load factor, ASK, RPK, yield, RASK, CASK, fuel cost, fleet, utilization, lease liabilities, net debt and market share.

### LOGISTICS

Subtype-specific freight/container/shipment volume, network capacity, warehousing, utilization, revenue/unit, EBITDA margin, asset turns, ROCE and FCF.

Rail/container/port-linked businesses may require concession/regulatory overlays.

---

## 7.19 New-Age / Digital Businesses

### DIGITAL_PLATFORM

GMV/GOV where economically valid, revenue growth, MAU/DAU, orders/transactions, frequency, ARPU, take rate, contribution margin, CAC, retention/repeat usage, unit economics, adjusted EBITDA reconciliation, operating cash flow and cash runway.

Track ESOP dilution as a shareholder-cost input even when excluded from adjusted EBITDA.

Management profitability milestones may be tracked as dated evidence with hit/miss history; they must not become unverified facts.

### FINTECH_OVERLAY

Add regulation, credit risk where lending exists, take rate, transaction volume, customer economics and funding/capital requirements.

Traditional P/E/ROCE screens must not automatically penalize earlier-stage businesses before their economics mature; evidence coverage and path-to-cash-generation are explicit.

---

## 7.20 Defence

### DEFENCE

Order book, order inflow, book-to-bill, execution, domestic defence orders, exports, product/program mix, EBITDA margin, ROCE, working capital, receivables and FCF.

Strategic evidence: Ministry of Defence orders, Defence Acquisition Council decisions, indigenous-content policy, major programs, export licences/orders and capacity expansion.

Subtype overlays may distinguish aerospace, shipbuilding, defence electronics, weapons/ammunition and components.

**Risks:** government-customer concentration, long procurement cycles, execution delays, working capital, order timing and single-platform dependence.

**Valuation:** P/E, EV/EBITDA, PEG, FCF yield; order-book visibility is supporting evidence, not a substitute for valuation.

---

# 8. Specialty research profiles that need not become new top-level sectors

## 8.1 RETAIL

Apparel, grocery/general retail and department stores.

Track like-for-like/same-store sales, store additions, revenue/sq ft, category mix, inventory turns, working capital, private-label penetration and omnichannel mix.

## 8.2 HOTELS_TOURISM

Occupancy, ARR, RevPAR, room additions/pipeline, owned versus managed mix, seasonality, domestic/inbound mix and FCF/capex.

## 8.3 PORTS_SHIPPING_WATER_INFRA

Cargo/container throughput, tariffs, capacity utilization, concession terms, capex and asset/vessel utilization where applicable.

## 8.4 SUGAR_ETHANOL

Cane crush, recovery rate, sugar realization, ethanol volumes/blending exposure, by-product economics and FRP/SAP or other policy-driven cost inputs.

These can map to existing canonical sectors while retaining specialized research economics.

---

# 9. Holding-company / conglomerate valuation overlay

`HOLDING_COMPANY_SOTP` is a valuation methodology, not an operating sector.

Where the primary value is ownership of listed/unlisted entities:

1. identify underlying stakes/assets from trustworthy evidence;
2. value listed holdings from approved market data;
3. use reviewed methods for unlisted assets only when evidence is sufficient;
4. adjust for parent cash/debt and liabilities;
5. calculate observable NAV;
6. calculate the **actual current discount/premium to NAV**;
7. compare with the entity's own historical discount/premium and peers where valid.

Do not hard-code a universal 20–50% holding-company discount.

---

# 10. Source contracts

Every metric must declare its authoritative or approved evidence source.

Current architectural authority remains:

- PortfolioAI transaction ledger: holdings/quantity/accounting facts;
- Angel One: current price and historical daily OHLCV;
- reviewed Trendlyne contracts: approved structured fundamentals/ownership/valuation evidence;
- NSE/BSE/company/official regulator/agency documents: filings, announcements, regulatory and document evidence;
- PortfolioAI deterministic engines: normalized calculations, scores and states.

No provider may silently replace the designated authority for another domain.

Interpretive evidence such as brand strength, GenAI exposure, cycle state or competitive position must retain the supporting source observations/documents and calculation/review version.

---

# 11. Freshness and refresh triggers

Refresh should be domain/event aware, not blanket per-stock polling.

Indicative policy classes:

- quarterly financial/operating metrics: refresh on result/publication plus bounded backstop;
- annual metrics: annual filing;
- ownership: quarterly shareholding filing;
- market valuation calculations: recompute from current approved market price plus last valid fundamental denominator;
- market history: incremental daily Angel One updates;
- official regulatory events: event-driven;
- credit rating: new rating action/publication;
- order book/project/disclosure evidence: new company/exchange disclosure;
- news: separate approved NSE News pipeline;
- deterministic scores: recompute when required inputs materially change.

Each value shown to the user must expose observation/publication/retrieval age where relevant.

---

# 12. Sector/index benchmark mapping

Benchmarking belongs to market intelligence, not fundamental company research.

Where reliable mappings exist, profiles may use sector/index relative-strength evidence, for example BANK -> banking index and IT -> IT index. Benchmark mapping must be explicit, versioned and owner-reviewed.

Broad-market benchmarks remain valid where no trustworthy sector index mapping exists.

---

# 13. Evidence coverage and fail-closed rules

For each profile/dimension:

1. evaluate mandatory-input presence and semantic validity;
2. evaluate important-input coverage;
3. verify minimum historical depth;
4. detect conflicts/review-required evidence;
5. calculate coverage/confidence;
6. only then compute the deterministic state/score.

Fail closed when required evidence is inadequate:

```text
INSUFFICIENT_EVIDENCE
```

A profile that has not yet been approved for the business returns:

```text
PROFILE_PENDING
```

This is preferred to forcing `GENERIC_NON_FINANCIAL` when the generic model is economically inappropriate.

---

# 14. Generic non-financial fallback

`GENERIC_NON_FINANCIAL_V1` is allowed only for ordinary non-financial businesses where no specialty profile is materially required.

Potential evidence:

- revenue;
- operating profit/EBITDA;
- PAT/EPS;
- revenue/PAT/EPS growth;
- operating margin;
- ROCE;
- ROE;
- CFO;
- FCF;
- debt/equity;
- interest coverage;
- working capital.

Suggested valuation inputs: P/E, PEG, EV/EBITDA, P/B where appropriate, FCF yield and own historical valuation.

Every use records:

```text
profile_specificity = GENERIC
```

A company requiring specialist economics must move to `PROFILE_PENDING` rather than be permanently forced through the fallback.

---

# 15. Relationship to Stage 8 and Position Sizing

Sector research does not directly decide position size.

The intended chain is:

```text
sector/profile evidence
    -> standardized Quality/Growth/Financial Strength/Cash Quality/Durability/Valuation/Risk
    -> market/momentum evidence
    -> deterministic recommendation
    -> portfolio context
    -> Position Sizing Engine
```

Therefore D35B should not need to know that BANK used GNPA/NIM while IT used TCV/FCF conversion. It should consume validated, versioned upstream outputs plus portfolio context and retain lineage to those upstream runs.

A stock lacking a valid sector/profile research contract and sufficient upstream evidence must not become sizing `READY` merely because a min/max weight was supplied.

---

# 16. Implementation and validation sequence

This document defines the target architecture; it does not authorize provider calls, schema changes or production migrations.

Recommended execution:

1. R1/D35B remains a downstream engine-contract/reference implementation; HDFCBANK remains the only genuine current research-backed sizing reference until more profiles are validated.
2. R2 inventories current holdings against canonical sectors and proposed research subprofiles.
3. Count portfolio value and security count by subprofile.
4. Prioritize profile implementation by portfolio relevance, evidence availability and strategic importance.
5. Formalize `BANK_V1` from the HDFCBANK reference path.
6. For each additional profile, define the complete metric applicability/requirement/source/freshness/history/scoring contract.
7. Validate one reference stock.
8. Validate a controlled 3–5 security real cohort.
9. Only then mark the profile `PROFILE_CONTRACT_COMPLETE` / `PILOT_COMPLETE` as appropriate.
10. Broaden R3/R4 evidence coverage safely through existing provider-budget and provenance controls.
11. Unlock R6 scoring only for securities meeting the profile readiness contract.
12. Unlock recommendation and D35B sizing only downstream of validated score/recommendation lineage.

No scheduler or portfolio-wide research execution is implied by this document.

---

# 17. Completion terminology

Use explicit completion levels:

- `ARCHITECTURE APPROVED`
- `PROFILE CONTRACT COMPLETE`
- `PILOT COMPLETE`
- `PORTFOLIO-WIDE COVERAGE COMPLETE`
- `AUTOMATION COMPLETE`

A Research UI rendering sector fields is not evidence that the sector research engine is complete.

---

# 18. Non-goals

This architecture does not:

- authorize live provider refreshes;
- define final scoring weights/curves for every profile;
- claim all 20 sectors are implemented;
- claim portfolio-wide research coverage;
- allow AI to invent missing metrics;
- allow sector research to mutate holdings, roles, targets or transactions;
- replace Angel One market-data authority;
- replace owner judgment or execute trades.

---

## 19. Immediate next design work after owner approval

1. Use R2 to map the current portfolio to canonical sectors/subprofiles.
2. Produce the profile-priority table by holdings count and portfolio value.
3. Convert `BANK_V1` into the first fully explicit metric contract using HDFCBANK evidence.
4. Select the next non-bank profile based on actual portfolio importance and best available evidence.
5. Add profile-specific source/readiness/scoring specifications incrementally rather than attempting all profiles at once.
