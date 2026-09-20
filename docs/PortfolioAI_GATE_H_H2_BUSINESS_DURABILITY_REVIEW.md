# PortfolioAI — Gate H H2 TORNTPHARM Business Durability Review Candidate

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** OWNER REVIEW CANDIDATE / NOT ACTIVE

## Purpose

Apply the owner-approved H2 qualitative normalization rubric to the Business Durability evidence that is currently supportable without a licensed-provider call.

Parent weights remain frozen:

- Brand / Therapy Leadership — 35%
- Field Force Productivity — 25%
- R&D Productivity — 20%
- Pipeline / Corporate Execution — 20%

## Component review

### Brand / Therapy Leadership

State:

`REVIEW_REQUIRED`

Normalized score:

`null`

Reason:

The approved evidence-acquisition contract requires issuer evidence to be cross-checked against an approved licensed market source. Issuer self-description alone is insufficient.

No licensed provider call is authorized.

### Field Force Productivity

State:

`REVIEW_REQUIRED`

Normalized score:

`null`

Reason:

Current issuer evidence discloses a large India field force and domestic revenue context, but the approved contract requires a minimum three-period comparable series of disclosed MR/field-force headcount plus compatible domestic revenue.

A single current headcount cannot establish productivity, and total employee count may not be substituted.

### R&D Productivity

Candidate state:

`STRONG`

Normalized score:

`75`

Evidence:

- three locked annual R&D expense/intensity periods;
- differentiated-product development;
- FY2025-26 regulatory filings/approvals;
- first Indian market authorisations highlighted for Brexpiprazole tablets and oral Semaglutide.

The candidate deliberately stops below VERY_STRONG because no approved cross-company productivity benchmark is being used.

### Pipeline / Corporate Execution

Candidate state:

`STRONG`

Normalized score:

`75`

Evidence:

- multiple FY2025-26 complex-product launches across the US, EU, Brazil and India;
- continuing pipeline expansion;
- JB Pharma controlling-stake acquisition and broader combined domestic franchise.

The candidate stops below VERY_STRONG because longer-term integration outcomes remain incomplete.

## Dimension result

Ready components:

`2 / 4`

Business Durability combined score:

`null`

No missing-component renormalization is allowed.

## Current blockers

1. `BRAND_THERAPY_LEADERSHIP_LICENSED_MARKET_CROSS_CHECK_REQUIRED`
2. `FIELD_FORCE_PRODUCTIVITY_THREE_PERIOD_COMPARABLE_MR_HEADCOUNT_REQUIRED`

## Safety

- licensed provider call: NO
- evidence write: NO
- production mutation: NO
- score execution: OFF
- score persistence: OFF
- recommendation: OFF
- sizing: OFF
- deployment: NO
- PR merge: NO

## Review boundary

This package does not request activation or a provider call.

It asks only whether the two evidence-backed ordinal candidates are acceptable while the other two components remain explicitly fail-closed.
