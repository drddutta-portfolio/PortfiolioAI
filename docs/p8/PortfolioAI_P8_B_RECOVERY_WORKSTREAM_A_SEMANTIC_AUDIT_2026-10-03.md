# PortfolioAI P8-B Recovery — Workstream A semantic correction audit

Date: 3 October 2026
Environment: Development only
Branch: PortfolioAI-Development
Authority: docs/p8/PortfolioAI_P8_B_SINGLE_RECOVERY_PLAN_2026-10-03.md
Status: WORKSTREAM A STARTED / SEMANTIC AUDIT COMPLETE / NO HOSTED MUTATION

## Purpose

Freeze the exact semantic corrections required before any new evidence acquisition or B5/B6 rematerialization.

This document does not rewrite the original P8-B1 contract, B2-B6 artifacts, or B-FINAL audit. It records the recovery interpretation that will govern a separately versioned recovery implementation.

## Finding A1 — Historical identity

B2 V3 is explicit:

> An identity may be a valid historical universe member with canonical_security_id = NULL; live PortfolioAI security identity is not required for historical eligibility.

B5 V1 later introduced a stricter requirement that classification resolution requires a current canonical security link.

That later requirement is inconsistent with the survivor-free B2 identity model.

### Recovery correction

Historical eligibility and historical evidence routing MUST use:

- p8_historical_security_identities.id
- historical_isin
- dated listing/symbol/name evidence

Current canonical_security_id remains an optional bridge to the live PortfolioAI product and must not be a prerequisite for P8 historical eligibility.

## Finding A2 — Frozen methodology vs historical facts

P8-B1 freezes:

- methodologyVersion = P8_R6_R10_REPLAY_V1
- classificationVersion = P8_HISTORICAL_CLASSIFICATION_V1

The experiment purpose is to replay a frozen methodology retrospectively over point-in-time historical company information.

B5 V1 later required DB methodology assignments and recommendation policies themselves to have been assigned/reviewed/created before the simulated decision date.

That would make a 2026-designed retrospective replay impossible for earlier years.

### Recovery correction

The strict-before-decision rule applies to company facts/evidence:

- financial statements
- documents
- historical classification evidence
- business-model/subprofile evidence when treated as a company fact
- publication/availability timestamps

The frozen experiment algorithm and thresholds do NOT need to have existed historically. They must instead be:

- frozen before outcome inspection;
- deterministic;
- unchanged across replay;
- version-hashed;
- not derived from future company facts.

A present-day manual company assignment must not be backdated. Historical company evidence must be routed through the frozen methodology router.

## Finding A3 — Coverage denominator

B2/B3 establish 121,956 B2-eligible security/date pairs under the frozen historical universe/decision ledger.

B6 V1 materializes 144,768 identity/date dispositions because it expands all 4,524 identities across all 32 decision dates.

Legitimate universe-ineligible identity/date rows must remain auditable, but they are not failed research signals.

### Recovery correction

B-FINAL recovery coverage must distinguish:

- full audit surface: 144,768 identity/date dispositions;
- experiment candidate denominator: B2-eligible pairs;
- replay-ready numerator: B6 replay-ready pairs among B2-eligible pairs.

No universe-ineligible pair may be silently reclassified as eligible.

## Finding A4 — B4 provider scope

B4-2 proved:

- historical identities = 4,524
- exact Trendlyne identities = 239
- blocked exact provider identities = 4,285

Therefore Trendlyne/current-security identity cannot remain the primary identity gate for historical evidence acquisition.

### Recovery correction

Official NSE/BSE filings will be keyed directly to P8 historical identity using exact historical ISIN or deterministic dated exchange identity. Trendlyne becomes supplemental enrichment only.

## Frozen non-negotiables preserved

Recovery does NOT relax:

- strict-before-publication/availability;
- no invented publication timestamp;
- no current classification backdating;
- no cross-security imputation;
- no unknown-to-zero;
- survivor-free universe;
- current holdings prohibited as historical universe;
- immutable raw evidence;
- untouched holdout;
- no P8-C before B-FINAL PASS;
- no Production/main change.

## Workstream A execution state

Completed:

1. Read original Codex P8 master plan.
2. Read frozen P8-B1 experiment contract.
3. Reconciled B2 V3 historical identity contract against B5 V1.
4. Reconciled frozen methodology semantics against B5 V1 historical-assignment test.
5. Reconciled B4 provider identity scope against 4,524 historical identities.
6. Defined corrected recovery semantics.

Not yet executed:

- no B5/B6 hosted schema or data mutation;
- no provider call;
- no NSE/BSE acquisition;
- no recovery coverage ceiling frozen;
- no metadata feasibility census;
- no P8-C.

## Next execution step

Continue Workstream A by implementing a separately versioned recovery contract/fixtures that encode:

1. historical_identity_id as the mandatory historical key;
2. canonical_security_id as optional;
3. historical facts strict-before-decision;
4. frozen methodology router reusable retrospectively;
5. B2-eligible-pair coverage denominator;
6. recovery exclusion-ceiling values after owner freeze.

Only after this contract passes tests should Workstream B metadata/source adapters begin.
