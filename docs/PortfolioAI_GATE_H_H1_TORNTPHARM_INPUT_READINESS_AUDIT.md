# PortfolioAI — Gate H H1
## TORNTPHARM Exact 10-Dimension Input Readiness Audit

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Target:** TORNTPHARM / PHARMA_V1 / DOMESTIC_FORMULATIONS  
**Status:** IMPLEMENTED / LOCAL VALIDATION PENDING  
**Mode:** read-only

---

## H1 result

H1 audited all ten weighted PHARMA_V1 dimensions against the actual TORNTPHARM evidence currently locked in the repository.

Current score-ready count:

> **0 / 10**

This does **not** mean there is no useful evidence.

It means no dimension is yet being promoted to Gate H score-ready until its complete raw/derived input package is explicitly locked.

### Readiness summary

| Dimension | Weight | H1 state | Main finding |
|---|---:|---|---|
| Quality | 13% | INSUFFICIENT_EVIDENCE | 8 matched quarters required; current exact fixture has 0 matched revenue/profit quarters |
| Growth | 15% | INSUFFICIENT_EVIDENCE | Primary Domestic growth series not locked; 4 Global Generics US-growth candidates exist but remain proposal-only score inputs |
| Capital Efficiency | 10% | RAW INPUT MINIMUM PRESENT | 3 annual ROCE periods exist; H2 must lock the exact derived-statistic package |
| Cash Flow | 10% | INSUFFICIENT_EVIDENCE | PAT/CAPEX/FCF have 3 years, but CFO has only 1 year |
| Balance Sheet / Credit | 10% | RAW INPUT MINIMUM PRESENT | 3 years of leverage/coverage/debt/cash/EBITDA exist; H2 must lock derived statistics |
| Business Durability | 10% | PARTIAL_EVIDENCE | 3-year R&D history exists, but four reviewed normalized durability components are missing |
| Valuation | 12% | INSUFFICIENT_EVIDENCE | Approved combined methodology exists, but TORNTPHARM self-history, peer and cash-flow component scores are not locked |
| Momentum | 8% | INSUFFICIENT_EVIDENCE | NIFTY Pharma methodology approved; TORNTPHARM/NIFTY Pharma market-history input package absent |
| Ownership / Governance | 6% | INSUFFICIENT_EVIDENCE | minimum 4-quarter ownership package and reviewed component scores absent |
| Risk | 6% | RUNTIME_REVIEW_REQUIRED | Indrad chain reviewed; company-wide regulatory materiality and market-risk inputs unresolved |

---

## Exact H1 observations

### Quality

The exact official manifest fixture currently contains:

- 1 quarterly operating-revenue observation;
- 2 quarterly operating-profit observations;
- **0 matched quarter identities**.

The owner-approved Quality contract requires at least 8 comparable matched quarters.

Therefore Quality is not H2-score-ready from the current fixture.

### Growth

No locked Primary `PHARMA_DOMESTIC_REVENUE_GROWTH` four-quarter series was found.

The Global Generics overlay has four reviewed/proposed US-growth candidates:

- Q1 FY26 = 19%
- Q2 FY26 = 26%
- Q3 FY26 = 19%
- Q4 FY26 base business = 16%

The reported Q4 31% value remains rejected for comparable-series use because of acquisition scope distortion.

These four candidates are useful H2 evidence but are not silently promoted to canonical score input.

### Capital Efficiency

Three annual ROCE observations are present:

- FY2024 = 28%
- FY2025 = 31%
- FY2026 = 26%

The raw minimum is therefore present.

H2 must version the derived statistics used by the approved evaluator rather than allowing an implicit calculation convention.

### Cash Flow

Current fixture:

- CFO: 1 year
- PAT: 3 years
- CAPEX: 3 years
- FCF: 3 years

The approved methodology requires a matched three-year cash-conversion series.

Therefore Cash Flow remains blocked primarily by missing historical CFO.

### Balance Sheet / Credit

Three annual observations are present for:

- Net Debt / EBITDA
- Interest Coverage
- Total Debt
- Cash Equivalents
- EBITDA

The raw minimum is present.

H2 can proceed directly to a versioned derived-statistic package.

### Business Durability

Available:

- 3-year R&D expense history;
- 3-year R&D intensity history;
- official source families already discovered for field-force, launch, pipeline and execution evidence.

Still required:

- Brand / Therapy Leadership normalized reviewed score;
- Field Force Productivity normalized reviewed score;
- R&D Productivity normalized reviewed score;
- Pipeline / Corporate Execution normalized reviewed score.

Raw qualitative claims cannot become scores directly.

### Valuation

The approved final dimension methodology remains:

- Self-History = 40%
- Peer Relative = 40%
- Cash Flow Corroboration = 20%

The approved peer combined component uses:

- P/E = 50%
- EV/EBITDA = 50%

But no complete TORNTPHARM Gate H component-score package was found.

H2 must lock:

- current authoritative price / market cap;
- current reviewed denominators;
- self-history score;
- reviewed Domestic Formulations peer cohort;
- peer P/E score;
- peer EV/EBITDA score;
- combined peer score;
- cash-flow corroboration score.

Legacy proposal predecessor files remain historical scaffolding and must not override later owner-approved successor contracts.

### Momentum

No locked TORNTPHARM Gate H market-history fixture was found.

H2 must provide:

- 12M TORNTPHARM return;
- 6M TORNTPHARM return;
- 12M NIFTY Pharma return;
- relative strength;
- explicit lookback/trading-day convention.

### Ownership / Governance

No locked minimum four-quarter TORNTPHARM ownership package was found.

H2 must provide:

- minimum four quarters;
- latest quarter;
- ownership stability component;
- pledge/control risk component;
- non-G4 governance context component.

No G4 event may be penalized twice.

### Risk

Current reviewed regulator evidence covers the Indrad FDA warning→closeout chain.

The approved runtime remains:

> **REVIEW_REQUIRED**

because the current evidence does not establish:

- company-wide current regulatory scope;
- regulatory materiality;
- subsequent outcome context.

Market-risk inputs are also absent:

- 1Y max drawdown;
- TORNTPHARM 1Y volatility;
- NIFTY Pharma 1Y volatility;
- relative-volatility ratio.

---

## Cross-cutting overlay state

The Global Generics overlay is not yet numeric-score-ready for TORNTPHARM.

The following remain to be locked:

- canonical overlay evidence input;
- economic materiality percent;
- evidence completeness;
- evidence confidence;
- normalized overlay signal;
- contradiction state.

Partial overlay evidence cannot be converted to a neutral modifier.

---

## H2 work order

H2 should execute in this order:

1. **Derive from already-complete raw history first**
   - Capital Efficiency
   - Balance Sheet / Credit

2. **Complete public-official fundamental evidence**
   - Quality
   - Growth
   - Cash Flow
   - Business Durability
   - Ownership / Governance
   - Regulatory Risk

3. **Complete current valuation inputs**
   - self-history
   - peers
   - FCF corroboration

4. **Complete market-history inputs**
   - Momentum
   - drawdown / volatility for Risk

5. **Lock overlay inputs and governance runtime**

6. Build one immutable:
   `TORNTPHARM_GATE_H_SCORE_INPUT_PACKAGE_V1`

Only after all 10 dimensions are score-ready may H3 calculate the first actual TORNTPHARM score.

---

## Safety

H1 performed no:

- provider refresh;
- paid API call;
- evidence write;
- score write;
- recommendation;
- sizing;
- scheduler change;
- deployment;
- PR merge.

H2 remains read-only unless a specific mutation/provider action is separately authorized.
