# PortfolioAI — G-FINAL-2 Numeric Dimension Audit

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Status:** ACTIVE AUDIT — NO NEW NUMERIC BANDS APPROVED  
**Target:** TORNTPHARM / PHARMA_V1 / DOMESTIC_FORMULATIONS

## Purpose

G-FINAL-2 closes the seven remaining weighted dimensions before Gate H:

1. Capital Efficiency
2. Cash Flow
3. Balance Sheet / Credit
4. Business Durability
5. Momentum
6. Ownership / Governance
7. Risk

The audit confirms that six dimensions already have proposal scaffolds. The missing work is primarily calibration, versioned parent-dimension reconciliation, evidence sufficiency, deterministic evaluators, and owner approval.

Business Durability is the only one of the seven without an existing numeric curve/aggregation proposal.

---

## Current proposal scaffolds

### Capital Efficiency

Existing contract:
- `pharmaRoceCurveProposal.ts`

Existing methodology shape:
- Level
- Stability
- Trend

History:
- minimum 3 comparable annual periods
- preferred 5
- latest period required
- consistent calculation semantics required
- single snapshot prohibited

Unresolved:
- component weights
- Domestic-specific level bands
- stability bands
- trend bands
- parent metric is still stored under legacy `QUALITY` and requires versioned reconciliation to canonical `CAPITAL_EFFICIENCY`

TORNTPHARM fixture evidence:
- 2024 ROCE = 28%
- 2025 ROCE = 31%
- 2026 ROCE = 26%

Minimum three-year history is present in the official manifest fixture.

### Cash Flow

Existing contract:
- `pharmaCashConversionCurveProposal.ts`

Existing methodology shape:
- CFO/PAT conversion
- FCF conversion
- consistency/trend

History:
- minimum 3 annual periods
- preferred 5
- matched CFO/PAT/capex/FCF periods required
- CFO alone insufficient
- capex-intensity context required

Unresolved:
- component weights
- Domestic CFO/PAT bands
- FCF conversion bands
- consistency/trend bands
- parent metric is legacy `EARNINGS_CASH_QUALITY`; canonical target is `CASH_FLOW`

TORNTPHARM fixture evidence:
- PAT: 2024, 2025, 2026
- CAPEX: 2024, 2025, 2026
- FCF: 2024, 2025, 2026
- CFO: only 2026 in the current exact official manifest fixture

Therefore current fixture does **not** satisfy the three-year matched CFO/PAT requirement.

### Balance Sheet / Credit

Existing contract:
- `pharmaBalanceSheetLeverageCurveProposal.ts`

Existing methodology shape:
- Net Debt Leverage
- Interest Coverage
- Balance Sheet Trend & Resilience

History:
- minimum 3 annual periods
- preferred 5
- matched debt/cash/operating earnings required
- point-in-time snapshot alone insufficient

Unresolved:
- component weights
- Domestic leverage bands
- Domestic interest-cover bands
- trend/resilience bands
- explicit net-cash treatment
- parent metric is legacy `FINANCIAL_STRENGTH`; canonical target is `BALANCE_SHEET_CREDIT`

TORNTPHARM fixture evidence includes 2024–2026 for:
- Net Debt / EBITDA
- Interest Coverage
- Total Debt
- Cash Equivalents
- EBITDA

Minimum three-year structure is present.

### Business Durability

No approved numeric dimension aggregation currently exists.

Available PHARMA_V1 evidence families include:
- R&D intensity/history
- pipeline / launch / approval evidence
- subprofile-specific durability evidence
- material Global Generics overlay evidence where applicable

TORNTPHARM fixture contains:
- R&D expense 2024–2026
- R&D intensity 2024–2026

But no whole-dimension numeric aggregation contract exists.

This remains a true methodology-design gap.

### Momentum

Existing contract:
- `pharmaMomentumCurveProposal.ts`

Candidate evidence lanes:
- 12M absolute momentum
- 6M absolute momentum
- 12M relative strength

Unresolved:
- dedicated Pharma parent metric contract
- Pharma benchmark
- component weights
- absolute-momentum bands
- relative-strength bands

Explicitly prohibited:
- BANK_NBFC momentum weights
- NIFTY Bank benchmark
- Trendlyne technical score as methodology authority

### Ownership / Governance

Existing contract:
- `pharmaOwnershipGovernanceCurveProposal.ts`

Methodology shape:
- Ownership Structure & Stability
- Pledge & Control Risk
- Governance Event Context

History:
- minimum 4 shareholding quarters
- preferred 8
- latest quarter required
- current material governance events required

Unresolved:
- component weights
- ownership bands
- pledge bands
- event-context bands
- legacy `GOVERNANCE` dimension reconciliation to canonical `OWNERSHIP_GOVERNANCE`

Anti-double-counting remains mandatory:
- G4 Critical/Blocked cannot receive a second hidden penalty
- G4 High Risk cannot receive a second hidden penalty
- no extra dimension cap from the governance gate

### Risk

Existing contract:
- `pharmaRiskCurveProposal.ts`

Methodology shape:
- Regulatory Risk Context
- Market Drawdown
- Market Volatility Context

Evidence lanes:
- official regulatory evidence
- MAX_DRAWDOWN_1Y
- VOLATILITY_1Y

Unresolved:
- component weights
- regulatory bands
- drawdown bands
- volatility bands
- Pharma peer/benchmark volatility context

Risk is already aligned to canonical `RISK`.

G4/G7-P2 anti-double-counting remains authoritative.

TORNTPHARM reviewed regulator evidence currently covers the Indrad warning-letter → closeout chain, but not a complete company-wide current regulatory map.

---

## Parent-dimension reconciliation required

Before Gate H, the following PHARMA_V1 parent metric dimension mappings must be versioned/reconciled:

| Metric | Current parent dimension | Canonical Gate G dimension |
|---|---|---|
| PHARMA_ROCE_HISTORY | QUALITY | CAPITAL_EFFICIENCY |
| PHARMA_CASH_CONVERSION_HISTORY | EARNINGS_CASH_QUALITY | CASH_FLOW |
| PHARMA_BALANCE_SHEET_LEVERAGE | FINANCIAL_STRENGTH | BALANCE_SHEET_CREDIT |
| PHARMA_OWNERSHIP_GOVERNANCE | GOVERNANCE | OWNERSHIP_GOVERNANCE |

This must not be handled by hidden adapter remapping only; the canonical contract must eventually reflect the intended dimension.

---

## G-FINAL-2 bounded implementation sequence

### G-FINAL-2A — Dimension-contract reconciliation
- version the parent dimension corrections above;
- preserve evidence codes and provenance;
- add regression tests;
- no scoring activation.

### G-FINAL-2B — Evidence sufficiency lock
For TORNTPHARM, determine whether canonical evidence is sufficient for each dimension:
- ROCE
- Cash Conversion
- Balance Sheet
- Business Durability
- Momentum
- Ownership/Governance
- Risk

Missing evidence remains explicit and cannot become neutral.

### G-FINAL-2C — Numeric calibration candidates
Create owner-reviewable Domestic Formulations calibration candidates for:
- ROCE
- Cash Conversion
- Balance Sheet
- Business Durability
- Momentum
- Ownership/Governance
- Risk

No threshold becomes approved without explicit owner methodology approval.

### G-FINAL-2D — Deterministic evaluators + reference cases
For approved contracts:
- implement pure deterministic calculation functions;
- add hand-verifiable fixtures;
- preserve score execution OFF.

### G-FINAL-2E — G7 adapter integration
Wire approved dimension scores into the read-only Gate G adapter while:
- persistence OFF;
- recommendation OFF;
- sizing OFF;
- hidden reweighting prohibited.

---

## Current evidence sufficiency summary

| Dimension | Proposal scaffold | TORNTPHARM minimum evidence currently visible | Current state |
|---|---:|---|---|
| Capital Efficiency | Yes | 3 annual ROCE periods | calibration-ready candidate |
| Cash Flow | Yes | CFO only 1 year; PAT/FCF/capex 3 years | evidence gap before score |
| Balance Sheet / Credit | Yes | 3 annual periods across leverage/coverage/debt/cash/EBITDA | calibration-ready candidate |
| Business Durability | No numeric aggregation | 3-year R&D history + other research evidence | methodology gap |
| Momentum | Yes | market evidence lanes exist system-wide | benchmark/calibration gap |
| Ownership / Governance | Yes | contract exists; full reviewed ownership history must be confirmed | evidence + calibration gap |
| Risk | Yes | regulator chain partial; market-risk lanes exist | evidence scope + calibration gap |

---

## Gate H boundary

G-FINAL-2 does not itself authorize Gate H.

Gate H remains blocked until:
- every weighted dimension has an owner-approved deterministic numeric contract;
- required evidence is sufficient or explicitly blocks the dimension;
- G-FINAL-3 overlay treatment is complete;
- G-FINAL-4 governance runtime is complete;
- G-FINAL-5 full-score dry run passes.

No production mutation or score persistence is authorized by this audit.
