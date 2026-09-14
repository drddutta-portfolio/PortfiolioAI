# R4B — PHARMA_V1 Research Profile Contract

**Status:** ENGINE / RESEARCH CONTRACT CANDIDATE — repository only  
**Date:** 14 September 2026  
**Profile:** `PHARMA`  
**Version:** `PHARMA_V1`

## 1. Purpose

PHARMA_V1 defines the evidence/readiness contract for listed pharmaceutical companies before PortfolioAI may calculate profile-specific Quality, Growth, Financial Strength, Earnings/Cash Quality, Business Durability, Valuation and Risk outputs.

It does **not** alter the application sector displayed in Dashboard, Holdings, Research or any other page. Application classification remains owned by `current_security_enrichment_v1` under the Single Source of Truth architecture.

It also does not yet define final numeric score curves. R4B answers a more fundamental question first:

> **Do we possess enough current, historically adequate and semantically reviewed Pharma evidence to score this company at all?**

## 2. Portfolio importance

The current read-only portfolio baseline contains 26 holdings classified by the application as `Pharma`, representing approximately 11.67% of current priced equity value.

This makes Pharma the largest current application sector by priced equity value.

Existing structured evidence is incomplete. For example, TORNTPHARM and LAURUSLABS have a limited set of current fundamental observations, but most are single-period snapshots rather than the multi-period history required for a durable Pharma assessment.

Therefore existing observation count must not be treated as profile readiness.

## 3. Readiness states

PHARMA_V1 uses the generic research-profile evaluator with these states:

- `READY` — every active mandatory and important requirement satisfies freshness/history/review rules;
- `PARTIAL` — mandatory evidence is sufficient, but one or more important inputs are absent/stale/insufficient;
- `INSUFFICIENT_EVIDENCE` — at least one active mandatory input is missing, stale, or has insufficient history;
- `BLOCKED_REVIEW` — mandatory evidence is conflicting or requires review.

Conditional mandatory metrics become active only when their condition applies.

## 4. Mandatory evidence

### 4.1 Revenue growth history

`PHARMA_REVENUE_GROWTH_HISTORY`

- Mandatory.
- Minimum: 3 comparable annual observations.
- Preferred: 5 annual observations.
- PortfolioAI calculates multi-period growth and consistency.
- A single `REVENUE_TTM` snapshot does not satisfy this contract.

### 4.2 Operating-margin history

`PHARMA_OPERATING_MARGIN_HISTORY`

- Mandatory.
- Minimum: 8 comparable quarterly observations.
- Preferred: 12 quarters.
- Evaluates level, direction and stability.
- One `OPM_TTM` observation does not satisfy this requirement.

### 4.3 ROCE history

`PHARMA_ROCE_HISTORY`

- Mandatory.
- Minimum: 3 annual observations.
- Preferred: 5 annual observations.
- Current production `ROCE_ANNUAL` evidence may contribute only when adequate history exists.

### 4.4 PAT / EPS history

`PHARMA_PAT_EPS_HISTORY`

- Mandatory.
- Minimum: 3 comparable annual periods, with quarterly history useful where available.
- One current `NET_PROFIT_TTM` value is insufficient.

### 4.5 Cash-conversion history

`PHARMA_CASH_CONVERSION_HISTORY`

- Mandatory.
- Minimum: 3 matched annual periods.
- Requires matched CFO, PAT and capex/FCF semantics.
- `CFO_ANNUAL` alone does not prove cash-conversion quality.

### 4.6 Balance-sheet leverage

`PHARMA_BALANCE_SHEET_LEVERAGE`

- Mandatory.
- Minimum: 3 comparable annual periods.
- Must use reviewed debt, cash and earnings evidence.
- Intended outputs include net-debt/leverage and interest-coverage context where semantically available.

### 4.7 Regulatory manufacturing status — conditional mandatory

`PHARMA_REGULATORY_SITE_STATUS`

Condition: `REGULATED_EXPORT_EXPOSURE`.

Where the company has material regulated-export exposure, current official regulatory/manufacturing-site evidence becomes mandatory. Examples of relevant evidence include material inspection findings, Form 483/warning/import-alert status, remediation, approvals and resolution state where applicable.

This evidence must come from official regulator/issuer or separately reviewed canonical evidence. Absence of an event is not silently interpreted as a clean regulatory record.

## 5. Important evidence

Important evidence does not block mandatory profile readiness but keeps the profile `PARTIAL` when missing.

### Domestic growth

`PHARMA_DOMESTIC_REVENUE_GROWTH`, conditional on material domestic-business disclosure.

### Export / US growth

`PHARMA_EXPORT_US_REVENUE_GROWTH`, conditional on material regulated-export exposure.

### R&D intensity and productivity

`PHARMA_RND_INTENSITY`.

High R&D spend is not automatically good. PortfolioAI must interpret spend with product/approval productivity and business mix.

### Pipeline / launch / approval evidence

`PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE`.

This is evidence-weighted business-durability context, not a count-every-announcement score.

### Ownership and governance

`PHARMA_OWNERSHIP_GOVERNANCE`.

Uses reviewed shareholding history plus pledge/governance-event evidence. Promoter absence is not automatically negative.

### Valuation context

`PHARMA_VALUATION_CONTEXT`.

Uses authoritative current market price plus reviewed earnings/cash evidence. Provider PE/PBV/etc. are evidence; they are not allowed to replace the authoritative Angel One market-price layer.

## 6. Current production evidence reality

Read-only production inspection of TORNTPHARM and LAURUSLABS found current evidence such as:

- `REVENUE_TTM`
- `NET_PROFIT_TTM`
- `CFO_ANNUAL`
- `ROE_ANNUAL`
- `PE_TTM`
- ownership/shareholding snapshots
- `OPM_TTM` and `ROCE_ANNUAL` for TORNTPHARM

Most of these are currently one observation per metric for those securities.

Accordingly PHARMA_V1 intentionally evaluates a synthetic single-period evidence set as `INSUFFICIENT_EVIDENCE`.

This is the desired behavior: existing cached snapshots are useful evidence but do not yet prove longitudinal Pharma quality/growth/cash durability.

## 7. Source-contract status

Some source mappings are already reviewed in `fundamental_metric_definitions`, for example:

- `OPM_TTM` — reviewed;
- `ROCE_ANNUAL` — reviewed;
- `NET_PROFIT_TTM` — reviewed;
- `PE_TTM` — reviewed;
- promoter/shareholding definitions — reviewed or explicitly defined;
- `REVENUE_TTM` / `CFO_ANNUAL` currently include provisional mapping semantics in the existing production definition set.

PHARMA_V1 must **not** trigger broad provider collection until each mandatory profile input has a reviewed source/derivation contract capable of satisfying the required history.

If Trendlyne cannot reliably provide a required historical or regulatory field, PortfolioAI must use another approved source or keep that input unavailable. It must not guess from unrelated fields.

## 8. R3 execution gate for Pharma

Before a production Pharma cohort is authorized, repository work must identify for every PHARMA_V1 metric:

1. canonical raw/source metric(s);
2. exact approved provider/official source;
3. period/history retrieval contract;
4. physical provider-call estimate;
5. normalization/calculation owner;
6. freshness policy;
7. conflict/review behavior;
8. whether the input can be obtained cache-first from already stored evidence.

Then R3 should plan only missing/stale approved evidence for a small Pharma cohort.

No `26 stocks × all possible research calls` sweep is allowed.

## 9. Proposed first validation cohort

After source contracts are reviewed and before any wider rollout:

- TORNTPHARM — existing partial evidence;
- LAURUSLABS — existing partial evidence;
- one Pharma holding with no current structured fundamentals, to prove missing-evidence behavior;
- one regulated-export case, when a suitable holding/source contract is identified, to validate the conditional regulatory gate.

Provider execution for this cohort remains a separate production approval gate.

## 10. Completion boundary

R4B repository contract is complete when:

- `PHARMA_V1` is machine-readable and versioned;
- mandatory/important/conditional evidence is explicit;
- history requirements are explicit;
- generic readiness evaluation is deterministic and tested;
- single-period snapshot evidence demonstrably fails closed;
- regulated-export conditions activate mandatory regulatory evidence;
- conflicting mandatory evidence produces `BLOCKED_REVIEW`;
- no final scoring curve is invented before scoring review;
- Architecture Guard, tests, typecheck/lint/build pass.

R4B contract completion does **not** mean:

- Pharma provider source contracts are all production-ready;
- Pharma evidence is portfolio-wide;
- Pharma scoring is implemented;
- any provider calls are authorized;
- any production database/profile assignments are changed.
