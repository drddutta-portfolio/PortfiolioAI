# R4N Gate F — TORNTPHARM Candidate-to-Ingestion Proposal Contract

**Status:** Proposal-only / no writes  
**Contract:** `TORNTPHARM_CANDIDATE_TO_INGESTION_PROPOSAL_V1`

## Purpose

Project the already reviewed TORNTPHARM evidence candidates against the current canonical ingestion contracts and make every blocker explicit before any evidence write is authorized.

This gate does **not** mutate the database and does **not** expand the validator automatically.

## Inputs

Reviewed candidates from the read-only content-review pilot:

- 4 Export / US Revenue Growth observations:
  - 2025-06-30: 19%
  - 2025-09-30: 26%
  - 2025-12-31: 19%
  - 2026-03-31: 16% base-business
- 2 Indrad regulator events:
  - 2019-10-08: WARNING_LETTER_ACTIVE
  - 2024-09-04: WARNING_LETTER_CLOSED_OUT
- 1 rejected Q4 FY26 reported US-growth claim:
  - 31%, excluded because the consolidated scope includes JB Pharma and is not comparable with Q1-Q3.

## Current canonical ingestion constraint

The existing `researchEvidenceIngestionValidator` and TORNTPHARM official manifest support numeric evidence only:

- INR_CR
- INR_PER_SHARE
- PERCENT
- MULTIPLE

The metric/unit registry currently contains the canonical financial-history metrics only.

It does **not** currently include:
- `PHARMA_EXPORT_US_REVENUE_GROWTH`;
- a non-numeric regulatory event-state contract for `PHARMA_REGULATORY_SITE_STATUS`.

## Proposal result

### Export / US Revenue Growth

The four reviewed growth candidates can be projected structurally into the current numeric candidate shape:

- direct official lineage;
- PERCENT unit;
- period-end date;
- source artifact code;
- reviewed PHARMA_V1 + Domestic Formulations assignment version.

However, when passed through the current canonical validator, all four remain quarantined because the validator contract has not yet versioned this Pharma business-model metric.

Disposition:

`VALIDATOR_CONTRACT_EXTENSION_REQUIRED`

This is a schema/contract blocker, not a reason to alter the reviewed values.

### Regulatory Site Status

The two FDA event states are not projected into the numeric manifest.

Disposition:

`EVENT_EVIDENCE_SCHEMA_REQUIRED`

They require a versioned event-evidence storage and validation contract. They must not be coerced into fake numeric values.

### Rejected Q4 claim

The reported Q4 FY26 31% US-growth claim remains outside the ingestion proposal entirely.

## Current summary

- reviewed candidates: **6**
- numeric candidates: **4**
- regulatory event candidates: **2**
- validator accepted: **0**
- validator quarantined: **4**
- event-schema blocked: **2**
- rejected claims excluded: **1**
- proposed writes: **0**
- ingestion authorized: **false**

## Required gates before any future write

1. Version the numeric validator contract to explicitly recognize `PHARMA_EXPORT_US_REVENUE_GROWTH` and its approved PERCENT semantics.
2. Re-run candidate validation and confirm idempotency/conflict behavior.
3. Design and approve a separate regulatory event-evidence storage/validation contract.
4. Re-run the FDA event candidates against that contract.
5. Only then prepare a new ingestion proposal with rows that are actually validator-accepted.
6. Obtain separate explicit approval before any local or production write.

## Safety boundary

Not authorized:
- evidence writes;
- production Supabase mutation;
- silent validator widening;
- regulatory event coercion into numeric values;
- paid/licensed provider calls;
- score/recommendation/sizing changes;
- scheduler changes;
- deployment;
- PR merge.
