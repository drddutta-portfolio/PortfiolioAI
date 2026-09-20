# PortfolioAI — Gate H H2 Component Normalization Integrity Audit

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Target:** TORNTPHARM / PHARMA_V1  
**Status:** STRUCTURAL CORRECTION REQUIRED INSIDE H2  
**Mode:** read-only

## Finding

H2 exposed a limitation that the Gate G synthetic dry run did not detect.

The approved G-FINAL-2 aggregation contract defines weighted aggregation for:

- Business Durability;
- Ownership / Governance;
- Risk.

However, the repository does not yet provide deterministic evidence-to-0–100 normalization rules for all component inputs consumed by those aggregators.

Therefore H2 must not manufacture subjective component scores.

This is a concrete exception to the Gate H rule that methodology should not be reopened unless valid company evidence cannot be consumed deterministically.

## Business Durability

Approved aggregation weights exist:

- Brand / Therapy Leadership — 35%
- Field Force Productivity — 25%
- R&D Productivity — 20%
- Pipeline / Corporate Execution — 20%

But no deterministic component normalization contract was found for converting reviewed company evidence into the four 0–100 component scores.

Current state:

> aggregation defined; component normalization missing.

## Ownership / Governance

Approved aggregation weights exist:

- Ownership Stability — 45%
- Pledge / Control Risk — 35%
- Non-G4 Governance Context — 20%

But the legacy `pharmaOwnershipGovernanceCurveProposal.ts` still explicitly records:

- component weights unapproved;
- ownership bands unapproved;
- pledge bands unapproved;
- event-context bands unapproved;
- numeric curve not ready.

The later G-FINAL-2 aggregator supplies weights, but no deterministic component scoring bands replaced those legacy gaps.

Current state:

> aggregation defined; component normalization missing.

## Risk

Approved aggregation weights exist:

- Regulatory Context — 40%
- 1Y Maximum Drawdown — 35%
- Relative Volatility — 25%

Drawdown and relative-volatility numeric bands exist in the approved G-FINAL-2 contract.

But the Regulatory Context input is consumed as a normalized 0–100 score and the governance/regulatory runtime contract returns categorical states:

- CLEAR
- HIGH_RISK
- REVIEW_REQUIRED
- BLOCKED_REVIEW

No approved categorical-runtime-to-0–100 regulatory-context mapping was found.

The Global Generics regulatory-site treatment contract also explicitly leaves `regulatoryNumericScore = null`.

Current state:

> market-risk normalization defined; regulatory-context numeric normalization missing.

## Consequence

Business Durability, Ownership/Governance and Risk cannot become deterministic Gate H dimension scores until these component normalization gaps are resolved.

No missing mapping may be replaced with:

- analyst discretion;
- neutral 50;
- binary 0/100;
- hidden heuristic;
- BANK_NBFC logic.

## H2 correction rule

Resolve these three normalization gaps as one bounded correction inside H2.

Do not create H2A/H2B/H2C.

Any numeric bands/mappings require explicit owner methodology approval before being frozen.

No other Gate G contracts should be reopened.
