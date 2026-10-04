# PortfolioAI P8 Segment-Revenue Classification — Consolidated Owner Adoption Package

Date: 4 October 2026  
Status: **OWNER APPROVED — OD1 / OD2 / OD3 ADOPTED; OD4 BLOCKED**

This package consolidates the unresolved taxonomy and segment-accounting policies after completion of the frozen 32-pair canary audit.

## Candidate authorities

### Four-tier taxonomy reference

Contract:

`PORTFOLIOAI_NSE_FOUR_TIER_TAXONOMY_REFERENCE_V1`

File:

`docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json`

Official source PDF SHA-256:

`ed6a4af212460747510ca551bb14634ab8ef81bb5dee59a33d5d6973e3129dd1`

Generated taxonomy payload SHA-256:

`e68821b19212f38a475bacd9977e9ec316e113babce90becbbca8a7c59bbed96`

Declared hierarchy: 12 Macro-Economic Sectors / 22 Sectors / 59 Industries / 197 Basic Industries.

### Segment-revenue classification contract

Contract:

`P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1`

Frozen Git blob SHA:

`45e990981371dba217d12c430f8ce567acbf25fc`

This contract uses only eligible point-in-time company evidence and requires latest eligible audited consolidated annual evidence, same-period accounting reconciliation, comparable segment external revenue and strict `>50%` dominance.

## Proposed owner decisions

### OD1 — APPROVE

Approve use of the frozen **NSE November-2022 four-tier vocabulary** to organize company evidence that was itself strictly available before each historical decision.

Conditions:

- taxonomy version always disclosed;
- later vocabulary never introduces future company facts;
- output is explicitly described as retrospective analytical classification.

### OD2 — APPROVE WITH REVIEW CONTROL

Approve a versioned, evidence-backed semantic synonym catalog.

Conditions:

- every synonym maps to an official taxonomy node with source definition;
- every company classification cites the contemporaneous source text;
- broad, conflicting or ambiguous descriptions remain blocked;
- company name, current classification, survival, holdings and general model knowledge remain forbidden proof;
- any mapping-catalog change creates a new version and deterministic rerun.

### OD3 — APPROVE THE FROZEN V1 ACCOUNTING CONTRACT, NOT A LOOSER >50% RULE

Approve `P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1` as the accounting/classification rule.

Its strict requirements are:

- audited consolidated annual evidence only;
- company denominator = same-period net Revenue from Operations;
- total segment revenue, aggregate inter-segment revenue and company revenue must reconcile within source rounding tolerance;
- segment numerator must be comparable external revenue;
- gross segment revenue may be used only where aggregate inter-segment revenue is valid zero;
- where inter-segment revenue is non-zero and cannot be allocated by segment, dominance remains blocked;
- exactly 50% does not pass;
- distinct reported segments cannot be combined merely to manufacture dominance;
- no denominator substitution from the sum of available segments;
- revisions/future evidence obey point-in-time rules.

### OD4 — REMAINS BLOCKED

Do not create or adopt a specialised diversified-company methodology.

A company without a valid dominant-business classification remains blocked from specialised routing.

## Measured implication of approval

Approval would make the taxonomy/accounting rules **canonical policy**, but it would **not make the present canary pass**.

Under the frozen V1 canary audit:

- 32 pairs retained;
- 24 pairs have an eligible audited consolidated annual source;
- 12 pairs contain reportable-segment evidence whose period context conflicts with the selected annual base period;
- 12 pairs have incomplete annual accounting facts, including missing aggregate inter-segment revenue;
- 8 pairs have no eligible audited consolidated annual source;
- comparable segment-revenue pairs: **0**;
- dominant-business candidates: **0**;
- complete company classifications: **0**;
- unique routes: **0**;
- complete normalized-input pairs: **0**.

Therefore owner approval **does not authorize the 25,761-pair expansion**. The pre-existing canary expansion gate still fails on evidence proof.

A future change that interprets the source's `FourReportableSegment...` column semantics differently from its literal XBRL context periods would be a **new semantic contract version**, requiring explicit justification and a full canary rerun. It is not included in this approval package.

## Precise approval statement

If the owner accepts this package, the explicit approval statement should be:

> **I approve OD1 under the frozen NSE November-2022 taxonomy reference, OD2 with versioned evidence-backed review control, and OD3 under `P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1` frozen at Git blob `45e990981371dba217d12c430f8ce567acbf25fc`. OD4 remains blocked. This approval adopts the policy contracts only; it does not authorize 25,761-pair expansion, experiment freeze/execution, B5/B6/B-FINAL rebuild, or P8-C.**


---

## Owner adoption record — 4 October 2026, 22:38 IST

The owner explicitly approved the package under the following frozen authorities:

- **OD1 = APPROVED** — frozen NSE November-2022 taxonomy reference;
- **OD2 = APPROVED WITH REVIEW CONTROL** — versioned evidence-backed synonym catalog;
- **OD3 = APPROVED** — `P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1` frozen at Git blob `45e990981371dba217d12c430f8ce567acbf25fc`;
- **OD4 = BLOCKED** — no specialised diversified-company methodology.

Immutable adoption record:

`docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_OWNER_POLICY_ADOPTION_2026-10-04.json`

### Approval boundary

This approval adopts the policy contracts only.

It does **not** authorize:

- the 25,761-pair expansion;
- experiment freeze or execution;
- B5/B6/B-FINAL rebuild;
- P8-C;
- Supabase/R2 writes;
- migrations;
- deployment or scheduler activation.

The existing canary measurement remains unchanged:

- comparable segment-revenue pairs: **0**;
- dominant-business candidates: **0**;
- complete company classifications: **0**;
- unique methodology routes: **0**;
- complete normalized-input pairs: **0**.

Therefore the expansion gate remains closed after policy adoption.
