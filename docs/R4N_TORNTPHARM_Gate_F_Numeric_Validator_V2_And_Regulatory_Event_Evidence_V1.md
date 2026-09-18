# R4N Gate F — Numeric Validator V2 and Pharma Regulatory Event Evidence V1

**Status:** Local-first contract extension only  
**Numeric validator:** `R4N_NUMERIC_EVIDENCE_V2`  
**Regulatory event contract:** `PHARMA_REGULATORY_EVENT_EVIDENCE_V1`  
**Evidence writes authorized:** NO

## Purpose

Bring the ingestion contracts into alignment with already-approved PHARMA_V1 research semantics without performing any evidence write.

## Numeric validator V2

The canonical numeric evidence validator now explicitly recognizes:

`PHARMA_EXPORT_US_REVENUE_GROWTH → PERCENT`

This metric already exists in PHARMA_V1 and, under the reviewed Global Generics material overlay, requires a minimum four-quarter history.

The four reviewed TORNTPHARM candidates are therefore structurally accepted by the numeric validator:

- 2025-06-30: 19%
- 2025-09-30: 26%
- 2025-12-31: 19%
- 2026-03-31: 16% base-business

This changes structural eligibility only. It does not authorize an ingestion write.

## Pharma regulatory event evidence V1

A separate event-evidence validator now exists for `PHARMA_REGULATORY_SITE_STATUS`.

Required fields include:
- security id;
- metric code;
- event date;
- event state;
- regulator code;
- facility key/name;
- regulatory chain id;
- source artifact/reference;
- site-specific scope.

Current supported event states:
- `WARNING_LETTER_ACTIVE`
- `WARNING_LETTER_CLOSED_OUT`

The contract fails closed on:
- missing/invalid site identity;
- missing chain identity;
- missing source provenance;
- invalid dates;
- duplicate events;
- company-wide scope;
- closeout without a prior active warning in the same chain;
- invalid chronological transitions.

The reviewed FDA Indrad chain is structurally accepted:

1. 2019-10-08 — WARNING_LETTER_ACTIVE
2. 2024-09-04 — WARNING_LETTER_CLOSED_OUT

This remains explicitly **site-specific** and does not establish company-wide current regulatory clearance.

## Candidate-to-ingestion proposal after contract versioning

Current proposal state:

- reviewed candidates: 6
- numeric candidates: 4
- numeric validator accepted: 4
- numeric validator quarantined: 0
- regulatory event candidates: 2
- event contract accepted: 2
- event contract quarantined: 0
- event storage blocked: 2
- rejected Q4 31% claim excluded: 1
- proposed writes: 0
- ingestion authorized: false

### Numeric candidates

Disposition:

`SEPARATE_INGESTION_APPROVAL_REQUIRED`

The rows pass structural validation but remain non-writing until a separately approved ingestion gate is prepared.

### Regulatory event candidates

Disposition:

`EVENT_STORAGE_IMPLEMENTATION_REQUIRED`

The rows pass the event-evidence contract, but there is still no canonical event-evidence persistence/write path. No table or production schema is created by this checkpoint.

## Safety boundary

Not authorized:
- local or production evidence write;
- production Supabase mutation;
- new event-evidence table/migration;
- automatic ingestion;
- provider calls;
- scoring/recommendation/sizing;
- scheduler changes;
- deployment;
- PR merge.

## Next safe step

After localhost visual approval and focused validation, the next decision is whether to:

1. prepare the **first local numeric ingestion dry-run/write package** for the four validator-accepted US-growth rows; and/or
2. design the **canonical persistence schema/migration proposal** for regulatory event evidence.

Either action remains separately approval-gated.
