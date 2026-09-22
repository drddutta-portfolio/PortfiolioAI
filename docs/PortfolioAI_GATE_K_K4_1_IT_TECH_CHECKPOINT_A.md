# PortfolioAI — Gate K4 Package 1 · IT_TECH · Checkpoint A

**Contract:** `IT_TECH_K4A_METHODOLOGY_V1`
**Date:** 22 September 2026
**Branch:** `r4n-pharma-subprofile-architecture`
**PR:** #101 OPEN / DRAFT / UNMERGED
**Status:** OWNER REVIEW REQUIRED / RUNTIME NOT ACTIVATED

## 1. Purpose

Freeze the IT_TECH methodology/evidence contract before any score curves, recommendation thresholds, runtime routing activation, provider refresh, persistence or deployment.

## 2. Why the old IT_TECH scaffold is insufficient

The Stage 8 IT_TECH profile was intentionally GENERAL-derived. Its dimensions inherited GENERAL weights and its recommendation policy had no numeric thresholds. It therefore does not constitute a specialised IT methodology.

K4 Package 1 replaces that assumption with an industry-driven contract.

## 3. Frozen proposed subprofiles

### IT_SERVICES

Industry examples: Computers - Software & Consulting, IT Services, IT Services & Consulting, Software Services.

Reference anchors: INFY, PERSISTENT; HCLTECH as additional control.

Primary emphasis:
- Quality
- Growth
- Cash Flow
- Business Durability
- Valuation

Key evidence:
- multi-period revenue growth;
- operating-margin history;
- FCF conversion;
- ROCE/ROIC;
- net cash/leverage;
- valuation self-history;
- market momentum/drawdown.

Valuation family: P/E self-history + peer-relative P/E + FCF yield; EV/EBITDA as context.

### SOFTWARE_PRODUCTS_PLATFORMS

Industry examples: IT Software Products, Software Products, Internet Software & Services where the business is genuinely a software/platform company.

No current reference symbol is frozen yet. A clean reference must be selected from the reconciled cohort before Checkpoint B.

Primary emphasis:
- Quality
- Growth
- Cash Flow
- Business Durability
- Valuation

Valuation family: EV/Sales when profitability is immature; P/E when mature; FCF yield when positive; growth-adjusted valuation when evidence supports it.

### DIGITAL_INFRA_HARDWARE

Industry examples: Computer Hardware, Computers - Hardware & Equipments, Data Centre Infrastructure, Digital Infrastructure.

Reference anchor: NETWEB.

Primary emphasis:
- Quality
- Growth
- Capital Efficiency
- Cash Flow
- Balance Sheet / Credit
- Valuation

Valuation family: P/E + EV/EBITDA + FCF yield + ROCE with cycle context.

## 4. Benchmark authority

Primary benchmark family: NIFTY IT.

Size/context cross-check where appropriate: NIFTY MidSmall IT & Telecom.

No subprofile may use a benchmark simply because the company is broadly labelled IT; business-model and size comparability remain mandatory.

## 5. Evidence-history requirements

Minimums:
- 3 annual years, preferably 5;
- 8 quarterly growth observations, preferably 12;
- 8 quarters of margin history;
- 3 years cash-conversion evidence;
- 252 trading days market history.

Single-quarter growth cannot be treated as durable growth.

## 6. Normalization principles

- self-history plus peer-relative normalization where economically valid;
- absolute floors only for accounting quality or balance-sheet safety;
- no cross-subprofile peer percentiles;
- missing mandatory evidence fails closed;
- no denominator renormalization around missing mandatory inputs.

Checkpoint A deliberately does not freeze numeric score curves yet. Those require reference-cohort evidence and owner approval before Checkpoint B validation.

## 7. Business durability

IT Services durability focuses on client concentration, long-duration relationships/deal visibility, margin/utilisation durability, talent/cost discipline and diversification.

Software/Platforms durability focuses on recurring revenue, retention/stickiness where disclosed, product concentration, switching costs/network effects, R&D reinvestment and scalable margins.

Digital Infrastructure durability focuses on order visibility, customer concentration, supply-chain resilience, domestic value addition/IP, capacity utilisation and technology-refresh capability.

## 8. Major risks

IT Services: discretionary technology spend, client concentration, FX, margin/utilisation, talent and AI automation disruption.

Software/Platforms: product obsolescence, platform competition, customer concentration, high-duration valuation, cash burn and AI/technology disruption.

Digital Infrastructure: supply chain, component costs, working capital, customer concentration, capex execution and technology obsolescence.

## 9. Recommendation contract

Universal role names may be reused, but all numeric role thresholds, role floors, caution thresholds and AVOID boundaries remain subprofile-owned.

No IT_TECH recommendation thresholds are activated at Checkpoint A.

## 10. Runtime and safety state

- runtime activation: NO;
- score persistence: OFF;
- recommendation persistence: OFF;
- provider refresh: NO;
- production mutation/migration: NO;
- scheduler mutation: NO;
- deployment: NO;
- PR merge: NO;
- automatic trading: NO.

Unknown or unsupported IT industry → METHOD_NOT_AVAILABLE.

## 11. Checkpoint A acceptance

Owner approval must freeze:
- the three-subprofile structure;
- reference anchors;
- evidence/history requirements;
- benchmark families;
- valuation families;
- durability/risk model;
- fail-closed behavior;
- recommendation ownership.

Only after approval may K4 IT_TECH proceed to deterministic score-method implementation and Checkpoint B reference/portability validation.
