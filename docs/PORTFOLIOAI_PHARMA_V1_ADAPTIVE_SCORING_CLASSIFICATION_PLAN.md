# PortfolioAI — PHARMA_V1 Adaptive Scoring & Classification Plan

**Status:** Canonical architecture / owner-reviewed adaptive plan  
**Scope:** PHARMA_V1 classification, subprofile layering, readiness, overlay scoring, governance/regulatory gates, and Gate G sequencing  
**Execution state:** Architecture only — no score execution, no production mutation, no recommendation or position-sizing activation  

---

## 1. Purpose

This document is the governing PHARMA_V1 architecture for PortfolioAI.

The goal is to keep one consistent PortfolioAI Research grammar while allowing evidence requirements, normalization logic, and interpretation to change according to the actual pharmaceutical business model.

Core principle:

> **Same Research grammar. Different evidence contracts. Different subprofile methodology. One explainable company-level conclusion.**

This plan exists to prevent:
1. treating all Pharma companies as economically equivalent;
2. forcing mixed companies into one label;
3. allowing smaller/emerging businesses to distort the dominant operating model.

---

## 2. Canonical PHARMA_V1 Layer Model

Every Pharma company resolves into:

### Primary subprofile
The dominant business model and principal scoring driver.

Canonical subprofiles:
- `DOMESTIC_FORMULATIONS`
- `GLOBAL_GENERICS`
- `API_BULK_DRUGS`
- `CDMO_CRAMS`
- `BIOPHARMA_BIOSIMILARS`

Additional subprofiles require their own versioned evidence/scoring methodology. Free-text hybrids must not become scoring codes.

### Material Overlay
A secondary exposure that is economically meaningful enough to affect relevant dimensions.

Rules:
- never creates a second independent stock score;
- never replaces the Primary;
- only affects relevant dimensions;
- remains bounded so the secondary business cannot dominate the Primary.

### Emerging Watch
A meaningful but not yet sufficiently material/mature exposure.

Rules:
- visible in Research interpretation;
- may trigger monitoring/evidence collection;
- excluded from score readiness;
- excluded from dimension and overall denominators;
- does not alter numeric score until formally promoted.

---

## 3. Classification Evidence Hierarchy

Classification comes from reviewed business-model exposure evidence, not from one sector label or one quarter.

Preferred hierarchy:
1. audited segment revenue/profit disclosure;
2. annual-report business/geography/product disclosure;
3. issuer presentation/results-release business mix;
4. subsidiary/product/facility disclosure where it maps clearly to economic exposure;
5. other official/exchange-filed evidence.

Third-party labels may help discovery but must not independently determine the scoring subprofile.

Where available, preserve:
- `revenue_share`
- `profit_share`
- `materiality_basis`
- disclosure period
- evidence source
- review status

If either revenue or profit crosses a threshold, the trigger basis must remain explicit.

---

## 4. Materiality Bands

### PRIMARY
- largest reviewed exposure by revenue/profit;
- must remain dominant for at least the trailing **2 annual disclosure periods**;
- one anomalous year/quarter cannot reclassify the company.

### MATERIAL_OVERLAY
- **>=15%** of consolidated revenue or profit;
- sustained for at least **2 consecutive annual periods**.

### EMERGING_WATCH
- **5% to <15%** of consolidated revenue or profit; or
- objectively growing toward the 15% band.

Emerging Watch has no minimum duration, but it remains non-scoring.

### Below 5%
Normally not a scoring exposure.

However, a sub-5% exposure may still generate Risk/Interpretation events if it creates material governance, regulatory, litigation, safety, or balance-sheet consequences.

---

## 5. Promotion, Demotion, Reclassification

### Emerging → Material
Requires >=15% and persistence for 2 consecutive annual periods.

### Material → Emerging
Requires <15% for 2 consecutive annual periods, or a structural change such as divestiture/discontinued operations.

### Primary reassignment
Requires another exposure to exceed the current Primary for 2 consecutive annual periods **and** the shift must be structural.

### Effective-dated history
Every change must preserve:
- `effective_from`
- `effective_to` where relevant
- classification status
- evidence period/source
- review basis
- reviewer/review event

Historical interpretation must use the classification effective at that time.

---

## 6. Common PHARMA_V1 Dimensions

PortfolioAI keeps one 10-dimension Pharma framework:

| Dimension | Weight |
|---|---:|
| Quality | 13% |
| Growth | 15% |
| Capital Efficiency | 10% |
| Cash Flow | 10% |
| Balance Sheet / Credit | 10% |
| Business Durability | 10% |
| Valuation | 12% |
| Momentum | 8% |
| Ownership / Governance | 6% |
| Risk | 6% |

Total = **100%**.

The common dimensions are an aggregation/presentation framework, not evidence that every subprofile shares the same evidence or normalization curve.

---

## 7. Subprofile Research Focus

### Domestic Formulations
- domestic revenue growth
- operating-margin quality/stability
- therapy/brand leadership
- field-force productivity
- chronic/acute mix
- new launches
- domestic pipeline
- R&D productivity
- in-licensing/M&A execution
- domestic/export materiality
- governance/regulatory spillovers

### Global Generics
- US/export revenue growth
- generic price erosion
- volume/mix
- complex/specialty generics mix
- approvals/launch pipeline
- regulated-market site status
- geography concentration
- regulatory remediation
- product/customer concentration

### API / Bulk Drugs
- API growth/cycle position
- molecule concentration
- customer concentration
- capacity/utilization
- raw-material exposure
- backward integration
- pricing/pass-through
- FX sensitivity
- export geography
- manufacturing/regulatory compliance

### CDMO / CRAMS
- revenue visibility/backlog/committed capacity
- client concentration
- project pipeline
- development-to-commercial progression
- service/project mix
- capacity utilization
- capex commissioning/revenue ramp
- customer stickiness
- molecule lifecycle
- regulatory continuity

### Biopharma / Biosimilars
- pipeline maturity
- molecule/geography/stage evidence
- approvals
- commercialization
- patent/litigation timelines
- partner economics
- biologics capacity
- R&D intensity/productivity
- launch concentration
- regulatory milestones

---

## 8. Readiness Model

Visible states:
- `READY`
- `PARTIAL`
- `INSUFFICIENT_EVIDENCE`
- `PROFILE_PENDING`
- `BLOCKED_REVIEW`
- `NOT_APPLICABLE`

These map to deterministic internal gates.

### Dimension score-ready gate
A weighted dimension can emit a numeric score only when:
- score-ready coverage >= **60%**; and
- mandatory blocking conditions are satisfied.

### Overall score-ready gate
Overall PHARMA_V1 preview requires:
- total score-ready coverage >= **70%**;
- every weighted dimension has crossed its own gate;
- common PHARMA_V1 core is `READY`;
- Primary subprofile is `READY`;
- governance has not blocked scoring.

### Material Overlay readiness
A Material Overlay may be `PARTIAL`, but missing overlay evidence must not silently become neutral. Affected dimensions may remain `PARTIAL` if a material overlay is insufficiently researched.

### Primary failure
If Primary is `PROFILE_PENDING`, `INSUFFICIENT_EVIDENCE`, or `BLOCKED_REVIEW`, the whole company fails closed regardless of overlay completeness.

---

## 9. Primary + Overlay Scoring Mechanics

Primary computes the baseline score for all applicable dimensions using:
- PHARMA_V1 common evidence;
- Primary-specific evidence;
- Primary-specific normalization curves.

A Material Overlay may modify only relevant dimensions.

Canonical flow:

`Primary Dimension Score → Overlay Modifier(s) → Final Dimension Score`

Material overlays must not:
- create a second stock score;
- blend another full score into the parent;
- push total PHARMA_V1 weight above 100%.

Overlay modifier magnitude must eventually be deterministic from:
- economic materiality;
- evidence completeness;
- evidence confidence;
- normalized overlay signal.

Conceptual form:

`Modifier = f(materiality × evidence confidence × overlay signal)`

All overlays combined must respect **one per-dimension total cap**. Independent ±10–15 stacking is prohibited.

Whenever an overlay changes a dimension, expose:
- Primary baseline;
- Overlay modifier;
- Final dimension score;
- rationale/evidence;
- confidence;
- contradictions.

---

## 10. Contradictory Evidence

Contradictory evidence is surfaced, not silently averaged away.

Examples:
- strong Domestic durability + weak Global Generics pricing;
- improving revenue growth + weakening cash conversion;
- remediation progress + persistent site concentration.

If the contract does not define how to resolve the contradiction, the metric/dimension remains `REVIEW_REQUIRED` or `PARTIAL`.

---

## 11. Governance Gate

Governance is evaluated before normal aggregation.

### Critical
`GOVERNANCE_BLOCKED_REVIEW` or a `CRITICAL` event:
- blocks PHARMA_V1 score;
- blocks downstream recommendation use.

### High Risk
`GOVERNANCE_HIGH_RISK`:
- does not automatically block;
- must be prominent in Interpretation;
- may invoke a separately versioned transparent cap/constraint.

### Anti-double-counting
Governance must not be punished through several hidden paths.

Ownership/Governance remains part of the 100% model. Any additional cap is a gate/cap contract, not another hidden weighted score.

Exact cap mechanics remain unapproved.

---

## 12. Regulatory Event Interpretation

Before scoring a regulatory event, establish:
1. affected facility/product/geography;
2. economic exposure;
3. event severity;
4. remediation state;
5. subsequent inspection/outcome.

If exposure cannot be established:

`materiality = UNKNOWN / REVIEW_REQUIRED`

PortfolioAI must not invent exposure percentages.

Closure/remediation is separate evidence and does not erase the original event or subsequent economic consequences.

---

## 13. Curve Principles

Some curve families can be shared only when semantics are genuinely shared.

Others require subprofile-specific level bands.

A common methodology shape such as:

`Level + Stability + Trend`

may be reused while thresholds differ by:
- Domestic Formulations
- Global Generics
- API/Bulk Drugs
- CDMO/CRAMS
- Biopharma/Biosimilars

History must dominate snapshots where the evidence contract requires history.

Missing evidence is never zero or neutral.

---

## 14. Existing Validated Gate G Curve Proposals

These remain valid subordinate methodology artifacts and are **not active**.

### Segment Growth
`PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL`

Applies to:
- `PHARMA_DOMESTIC_REVENUE_GROWTH`
- `PHARMA_EXPORT_US_REVENUE_GROWTH`

Composite:
- 60% growth level
- 25% consistency
- 15% trend

Minimum 4 comparable reviewed quarters; preferred 8.

Activation: **NO**

### Operating Margin
`PHARMA_OPERATING_MARGIN_CURVE_V1_PROPOSAL`

Scope:
- `PHARMA_OPERATING_MARGIN_HISTORY`
- Primary `DOMESTIC_FORMULATIONS` only

Composite:
- 50% margin level
- 30% stability
- 20% trend

Minimum 8 matched comparable quarters; preferred 12.

Unsupported Pharma primaries fail closed.

Activation: **NO**

---

## 15. TORNTPHARM Reference Assignment

Current pilot:
- Primary: `DOMESTIC_FORMULATIONS`
- Material Overlay: `GLOBAL_GENERICS`
- Emerging Watch: `CDMO_CRAMS`

TORNTPHARM remains the first end-to-end PHARMA_V1 reference implementation.

Reviewed US growth observations:
- Q1 FY26: 19%
- Q2 FY26: 26%
- Q3 FY26: 19%
- Q4 FY26: 16%

The scope-incompatible consolidated 31% Q4 claim remains excluded.

---

## 16. Reference Classifications — Discovery Only

These are starting points only and require evidence review before canonical assignment:

| Company | Likely Primary | Likely Material Overlay | Likely Emerging Watch |
|---|---|---|---|
| TORNTPHARM | Domestic Formulations | Global Generics | CDMO/CRAMS |
| Sun Pharmaceutical | Global Generics | Domestic Formulations | Specialty/Biopharma candidate — taxonomy review required |
| Dr. Reddy's | Global Generics | Biopharma/Biosimilars | — |
| Cipla | Global Generics | Domestic Formulations | — |
| Aurobindo Pharma | Global Generics | API/Bulk Drugs | Biopharma/Biosimilars |
| Lupin | Global Generics | Domestic Formulations | — |
| Mankind Pharma | Domestic Formulations | — | — |
| Alkem Laboratories | Domestic Formulations | — | — |
| Divi's Laboratories | API/Bulk Drugs | — | — |
| Laurus Labs | API/Bulk Drugs | CDMO/CRAMS | Biopharma/Biosimilars |
| Biocon | Biopharma/Biosimilars | Global Generics | — |
| Syngene International | CDMO/CRAMS | — | — |
| Gland Pharma | CDMO/CRAMS | Global Generics | — |

---

## 17. Validation Sequence

### Phase 1 — TORNTPHARM
Complete:
- reviewed subprofile assignment
- Primary/Material/Emerging architecture
- evidence pipeline
- Gate F closure
- Gate G architecture
- Segment Growth proposal
- Domestic Formulations Operating Margin proposal

### Phase 2 — Lock architecture contracts
Before additional curve families:
1. classification materiality contract
2. promotion/demotion contract
3. overlay modifier contract
4. readiness mapping contract
5. governance/regulatory gate contract

### Phase 3 — Second multi-exposure validation
Validate one independent mixed Pharma company.

Preferred:
- Aurobindo Pharma; or
- Cipla.

Do not generalize overlays portfolio-wide until the architecture works on a second mixed company.

### Phase 4 — Single-primary references
Use cleaner references:
- Domestic Formulations: Mankind / Alkem
- API/Bulk Drugs: Divi's
- CDMO/CRAMS: Syngene
- Biopharma/Biosimilars: reviewed reference
- Global Generics: reviewed reference

### Phase 5 — Broader Pharma rollout
Only after classification, overlays, readiness, and curves validate without hidden double-counting.

---

## 18. Gate G Adaptive Development Order

### G1 — Classification Contract
Formalize:
- evidence hierarchy
- materiality thresholds
- revenue-vs-profit basis
- 2-year persistence
- effective dating

### G2 — Overlay Modifier Contract
Formalize:
- eligible dimensions
- materiality scaling
- confidence scaling
- one per-dimension total cap
- contradiction handling

### G3 — Readiness Mapping Contract
Formalize visible readiness states while preserving:
- 60% dimension gate
- 70% overall gate

### G4 — Governance / Regulatory Gate Contract
Formalize:
- blocking states
- high-risk cap behavior
- unknown regulatory materiality
- remediation handling
- anti-double-counting

### G5 — Core Parent Curve Families
Then continue:
- ROCE / Capital Efficiency
- Cash Conversion
- Balance Sheet / Leverage
- Valuation
- Ownership/Governance
- Risk
- Momentum

### G6 — Subprofile-Specific Curves
Complete missing thresholds for every Pharma primary model.

### G7 — Read-only Scoring Adapter
Only after curve contracts are reviewed:
- non-persisting calculation
- full component explainability
- no persisted score run

### G8 — Second-Company Validation
Run same engine on the second mixed Pharma reference.

### G9 — Activation Approval Gate
Only after explicit owner approval:
- activate reviewed curves
- consider persisted score runs
- recommendation/position sizing stay separately gated

---

## 19. Foreground UI Principle

The Research page should remain visually consistent.

Foreground should emphasize:
- Research readiness
- Quality
- Growth
- Capital Efficiency
- Cash Flow
- Financial Strength
- Business Durability
- Valuation
- Momentum
- Ownership/Governance
- Risk
- Research Interpretation

Underlying evidence engines may differ substantially by subprofile.

Deep engine panels remain available for audit but should eventually become secondary/background tooling.

---

## 20. Mandatory Alignment Rules

Future PHARMA_V1 implementation must not:

1. revert to one generic Pharma methodology;
2. create independent Primary and Overlay stock scores and average them;
3. allow Emerging Watch into numeric scoring;
4. apply Domestic Formulations thresholds automatically to other subprofiles;
5. substitute missing evidence with zero or neutral;
6. silently blend contradictory evidence;
7. infer materiality without evidence;
8. double-count governance/regulatory penalties;
9. reclassify Primary from one anomalous quarter/year;
10. activate scoring, recommendation, or position sizing without separate approval.

If code/docs conflict with this plan, the conflict must be explicitly reconciled and versioned.

---

## 21. Canonical Source-of-Truth Hierarchy

For PHARMA_V1 work:

1. **This document** — classification, layering, overlay, readiness, governance/regulatory architecture.
2. **Versioned PHARMA_V1 parent/subprofile contracts** — metric applicability and evidence/history requirements.
3. **Validated Gate G curve proposal docs** — metric/subprofile normalization methodology.
4. **Cumulative Development HANDOFF** — chronological implementation state and current stop point.
5. **UI glass-box panels** — visibility only; they must reflect the contracts above.

No temporary UI or implementation shortcut may redefine the canonical methodology.

---

## 22. Explicitly Unapproved

This document does not approve:
- exact overlay adjustment magnitude
- overlay cap size
- materiality scaling formula
- confidence scaling formula
- governance high-risk cap
- all subprofile thresholds
- scoring adapter activation
- scoring-rule DB migration
- persisted score runs
- recommendations
- position sizing
- production Supabase changes
- PR merge/deployment

---

## 23. Adoption State

At adoption:
- Gate F: **CLOSED**
- Gate G architecture: **VALIDATED**
- Segment Growth proposal: **VALIDATED / NOT ACTIVE**
- Domestic Formulations Operating Margin proposal: **VALIDATED / NOT ACTIVE**
- score execution: **NO**
- persisted score run: **NO**
- recommendation change: **NO**
- position-sizing change: **NO**
- production mutation: **NO**
- PR #101 merge: **NO**

**Next safe action:** implement G1–G4 architecture contracts before adding more normalization-curve families.
