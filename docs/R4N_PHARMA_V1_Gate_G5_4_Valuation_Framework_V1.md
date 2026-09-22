# R4N Gate G5.4 — PHARMA_V1 Valuation Framework V1

**Status:** Proposal only / numeric thresholds unapproved / no score execution  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Canonical parent architecture:** `docs/PORTFOLIOAI_PHARMA_V1_ADAPTIVE_SCORING_CLASSIFICATION_PLAN.md`

## Purpose

Gate G5.4 defines the common PHARMA_V1 **Valuation** framework without activating numeric scoring.

Unlike ROCE, Cash Conversion, and Balance Sheet / Leverage, the existing parent evidence contract already maps directly to canonical `VALUATION`. No dimension reconciliation is required.

## Canonical evidence contract

Existing parent metric:

`PHARMA_VALUATION_CONTEXT`

Current evidence requirements:

- TTM / point-in-time / annual evidence;
- minimum **1** annual observation;
- preferred **5** annual observations for self-history context;
- current authoritative market price required;
- current reviewed earnings/cash inputs required;
- provider valuation labels may be evidence but cannot override authoritative market price;
- normalization semantics: `pe_ev_ebitda_fcf_yield_vs_history_and_peers`.

## Dimension alignment

Canonical Gate G dimension:

`VALUATION`

Current parent evidence-contract dimension:

`VALUATION`

Alignment state:

`ALIGNED`

G5.4 therefore does not introduce a reconciliation layer.

## Candidate methodology framework

The existing normalization semantics support a three-part framework:

1. `SELF_HISTORY_RELATIVE_VALUATION`
2. `PEER_RELATIVE_VALUATION`
3. `CASH_FLOW_CORROBORATION`

Supported evidence families:

- P/E;
- EV/EBITDA;
- FCF yield.

Component weights remain unapproved.

## Why universal absolute multiple bands are not created

A fixed rule such as “P/E below X is cheap” is not sufficiently robust across:

- Domestic Formulations;
- Global Generics;
- API / Bulk Drugs;
- CDMO / CRAMS;
- Biopharma / Biosimilars.

Growth durability, R&D intensity, capital requirements, launch risk, regulatory exposure and business maturity differ.

Therefore:

- universal absolute P/E bands: **NO**
- universal absolute EV/EBITDA bands: **NO**
- universal absolute FCF-yield bands: **NO**
- peer cohort must respect business model: **YES**
- subprofile threshold/context contracts remain **null / unapproved**

## Self-history and peer context

Preferred 5-year self-history is used as context, not as permission to score from stale price data.

Any future numeric implementation must combine:

- current authoritative price;
- current reviewed earnings/cash evidence;
- comparable self-history;
- business-model-appropriate peer context.

The 70%/60% readiness rules remain separate and unchanged.

## Cash-flow corroboration

P/E or EV/EBITDA alone must not dominate valuation interpretation where cash conversion materially disagrees.

FCF yield is therefore retained as corroborating evidence.

This does not create a second Cash Flow score or duplicate the Cash Flow dimension. It is valuation evidence used only inside the Valuation dimension.

## Price-to-book exclusion

The existing PHARMA_V1 UI/profile contract excludes:

`PBV_ADJUSTED_PROVIDER`

from Pharma valuation.

G5.4 preserves that boundary.

Bank-style P/BV valuation logic must not leak into PHARMA_V1.

## Distorted denominator handling

Future valuation scoring must fail closed or explicitly normalize when:

- earnings are negative or not economically meaningful;
- EBITDA is distorted or not comparable;
- FCF is temporarily distorted by material investment;
- acquisitions materially change the earnings denominator;
- exceptional/one-off items impair comparability.

No misleading “cheap” signal may be produced from a broken denominator.

## Repository artifacts

Added:

- `src/features/research/pharmaValuationCurveProposal.ts`
- `src/features/research/pharmaValuationCurveProposal.test.ts`
- this G5.4 methodology document

Updated:

- `src/features/research/PharmaResearchWorkspacePanel.tsx`

The Gate G glass-box now exposes:

- **G5.4 · Valuation framework**
- **G5.4 · Price authority, peer-context & denominator boundary**

## Explicit non-activation boundary

- Valuation framework proposal: **YES**
- dimension reconciliation required: **NO**
- component weights approved: **NO**
- universal absolute multiple bands: **NO**
- subprofile threshold/context contracts approved: **NO**
- numeric valuation curve ready: **NO**
- score execution: **NO**
- persisted score run: **NO**
- scoring-rule migration: **NO**
- schema migration: **NO**
- production mutation: **NO**
- deployment: **NO**

## Next checkpoint

Owner should:

1. `git pull`;
2. inspect the G5.4 cards on TORNTPHARM → Research → Gate G;
3. confirm the aligned dimension and valuation boundaries;
4. run focused G5.4 validation.

Only after validation should the next G5 parent family, Ownership / Governance, be considered.
