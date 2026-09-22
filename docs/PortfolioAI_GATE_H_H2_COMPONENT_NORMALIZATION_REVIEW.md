# PortfolioAI — Gate H H2 Component Normalization Review

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** OWNER APPROVED / NOT ACTIVE  
**Scope:** bounded H2 correction only

## Purpose

Resolve the three component-normalization gaps discovered during H2 without reopening the approved parent dimension weights.

Affected dimensions:

- Business Durability
- Ownership / Governance
- Risk regulatory context

## 1. Reviewed qualitative component rubric

The candidate uses one common ordinal-to-numeric normalization for reviewed qualitative components:

| Reviewed state | Score |
|---|---:|
| VERY_STRONG | 90 |
| STRONG | 75 |
| NEUTRAL | 50 |
| WEAK | 25 |
| VERY_WEAK | 10 |
| REVIEW_REQUIRED | null |

This rubric applies only after a component has been reviewed from approved evidence.

It is not a freeform analyst score.

Every component assessment requires:

- official or otherwise approved evidence;
- explicit rationale;
- source lineage;
- contradiction state;
- REVIEW_REQUIRED when material contradictions remain unresolved;
- REVIEW_REQUIRED when evidence is missing.

The reviewer chooses an ordinal evidence state; PortfolioAI converts that state deterministically to the numeric value.

## 2. Business Durability components

The rubric is proposed for:

- Brand / Therapy Leadership — 35%
- Field Force Productivity — 25%
- R&D Productivity — 20%
- Pipeline / Corporate Execution — 20%

The parent weights remain unchanged.

## 3. Ownership / Governance components

The same rubric is proposed for:

- Ownership Stability — 45%
- Pledge / Control Risk — 35%
- Non-G4 Governance Context — 20%

Constraints remain:

- promoter percentage alone is not a score;
- zero pledge alone is not automatically VERY_STRONG;
- institutional ownership alone is not automatically positive;
- G4-consumed events cannot be penalized again.

## 4. Risk regulatory-context normalization

The governance-safe candidate mapping is:

| Runtime state | Regulatory-context score |
|---|---:|
| CLEAR | 100 |
| HIGH_RISK | 100 |
| REVIEW_REQUIRED | null |
| BLOCKED_REVIEW | null |

Reason:

The owner-approved G7-P2 contract explicitly freezes:

- Critical / blocked review => blocking;
- High Risk => interpretation-only;
- no numeric High Risk cap;
- no additional hidden penalty;
- no double counting.

Therefore giving HIGH_RISK a lower regulatory-context score would violate the frozen anti-double-counting behavior.

Under this mapping:

- resolved non-blocking governance/runtime states do not impose a second numeric penalty;
- unresolved states remain fail-closed;
- actual market risk remains numerically expressed by Drawdown and Relative Volatility.

## 5. Why 90 / 75 / 50 / 25 / 10?

The proposed qualitative rubric deliberately avoids 100 and 0 for normal evidence assessments.

- 90 = very strong reviewed evidence without claiming perfection;
- 75 = clearly positive;
- 50 = genuinely balanced/neutral reviewed state;
- 25 = clearly weak;
- 10 = very weak but still evidence-backed;
- null = unresolved or missing, not neutral.

This keeps the distinction between:
- genuine neutral evidence;
- missing evidence;
- unresolved contradictions.

## 6. What approval would authorize

Approval would authorize only the methodology freeze for these component normalizations.

It would not authorize:

- production writes;
- score persistence;
- provider refresh;
- recommendation;
- sizing;
- deployment;
- PR merge.

After approval, H2 can apply this deterministic rubric to reviewed TORNTPHARM evidence and continue building the company score-input package.

## Proposed approval phrase

> **APPROVE H2 COMPONENT NORMALIZATION RUBRIC**


---

## Owner approval record

The owner explicitly approved the H2 component-normalization rubric after validation passed.

Frozen version:

`PHARMA_GATE_H2_COMPONENT_NORMALIZATION_V1_OWNER_APPROVED`

Frozen state:

- methodology approved: YES
- activation approved: NO
- score execution: OFF
- score persistence: OFF
- recommendation: OFF
- sizing: OFF

The approved rubric may now be applied to reviewed TORNTPHARM evidence inside H2.
