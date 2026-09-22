# R4N Gate G5.3 — PHARMA_V1 Balance Sheet / Leverage Framework V1

**Status:** Proposal only / numeric thresholds unapproved / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G5.3 defines the common PHARMA_V1 **Balance Sheet / Leverage** framework without activating numeric scoring.

It preserves the parent debt/cash/operating-earnings evidence contract, aligns the intended destination with canonical `BALANCE_SHEET_CREDIT`, and avoids inventing universal leverage or interest-cover thresholds across different Pharma business models.

## Canonical evidence contract

Existing parent metric:

`PHARMA_BALANCE_SHEET_LEVERAGE`

Current evidence requirements:

- annual and point-in-time evidence;
- minimum **3** comparable annual observations;
- preferred **5** comparable annual observations;
- latest balance-sheet period required;
- reviewed debt, cash and operating-earnings evidence with matched periods;
- lower leverage is directionally better;
- a point-in-time snapshot alone is insufficient for the proposed curve.

## Dimension-alignment issue

The canonical adaptive scoring architecture assigns this family to:

`BALANCE_SHEET_CREDIT`

with a **10%** PHARMA_V1 dimension weight.

The older lower-level parent evidence contract still records:

`PHARMA_BALANCE_SHEET_LEVERAGE.dimension = FINANCIAL_STRENGTH`

The lower-level `ResearchMetricContract` taxonomy predates the canonical PHARMA_V1 ten-dimension model.

G5.3 records:

- canonical target dimension: `BALANCE_SHEET_CREDIT`
- current parent-contract dimension: `FINANCIAL_STRENGTH`
- alignment state: `REQUIRES_VERSIONED_PARENT_RECONCILIATION`

No silent remapping is applied.

## Shared methodology framework

The parent normalization semantics already specify:

`net_debt_leverage_and_interest_cover`

G5.3 therefore records the candidate framework:

1. `NET_DEBT_LEVERAGE`
2. `INTEREST_COVERAGE`
3. `BALANCE_SHEET_TREND_AND_RESILIENCE`

The following remain unapproved:

- component weights;
- leverage bands;
- interest-cover bands;
- trend/resilience bands.

No numeric score is emitted.

## Cash and net-cash semantics

Net-debt calculations can be misleading if cash definitions are inconsistent.

G5.3 therefore requires:

- reviewed cash/cash-equivalent semantics before cash offsets debt;
- explicit treatment of net-cash cases;
- no automatic “best score” merely because reported net debt is negative.

Any later numeric methodology must define these rules transparently.

## Acquisition and expansion context

Leverage can temporarily rise because of:

- acquisitions;
- manufacturing-capacity expansion;
- CDMO / biologics build-out;
- other material investment programs.

Therefore G5.3 requires reviewed acquisition/expansion context before leverage trend is interpreted.

This context requirement does not excuse weak leverage; it prevents a context-free numeric judgment.

## Why universal bands are not created

Balance-sheet structures differ across Pharma subprofiles.

Therefore:

- universal leverage bands: **NO**
- universal interest-cover bands: **NO**
- subprofile threshold contracts required: **YES**
- all five current subprofile threshold slots remain **null / unapproved**

## Fail-closed rules

Balance Sheet / Leverage remains non-scoreable when:

- fewer than 3 comparable annual observations exist;
- latest balance-sheet evidence is missing or stale;
- debt, cash and operating-earnings periods are incompatible;
- cash semantics are not reviewed;
- only one point-in-time snapshot exists;
- canonical dimension alignment is unreconciled;
- applicable Primary subprofile thresholds are unapproved;
- component weights/bands remain unapproved.

Missing evidence must never become zero or neutral.

## Relationship to G5.1 and G5.2

G5.1 and G5.2 surfaced the same legacy taxonomy issue for:

- ROCE → `CAPITAL_EFFICIENCY`
- Cash Conversion → `CASH_FLOW`

G5.3 confirms the pattern for:

- Balance Sheet / Leverage → `BALANCE_SHEET_CREDIT`

No taxonomy migration is applied in this checkpoint.

## Repository artifacts

Added:

- `src/features/research/pharmaBalanceSheetLeverageCurveProposal.ts`
- `src/features/research/pharmaBalanceSheetLeverageCurveProposal.test.ts`
- this G5.3 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G5.3 · Balance Sheet / Leverage framework**
- **G5.3 · Dimension alignment & leverage-context boundary**

## Explicit non-activation boundary

- Balance Sheet / Leverage framework proposal: **YES**
- parent dimension reconciliation applied: **NO**
- component weights approved: **NO**
- universal numeric leverage bands: **NO**
- universal interest-cover bands: **NO**
- subprofile thresholds approved: **NO**
- numeric curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G5.3 cards on TORNTPHARM → Research → Gate G;
3. confirm the Balance Sheet / Credit dimension mismatch and leverage-context boundary;
4. run focused G5.3 validation.

Only after validation should the next G5 parent family, Valuation, be considered.
