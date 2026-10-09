# Banking 13 — independent retained-evidence and selected-snapshot readback, 9 October 2026

**Kind:** Live Development SQL read-only evidence checkpoint. **NOT** a current owner-authenticated canonical evaluation, bank-level admission, or readiness materialization. Environment `lrgpjimipfkyoqbpsqzz`. Bank code `BANK_NBFC_STAGE_8_BANK_V1` remains authoritative.

## New independently verified source evidence

- Exactly 13 frozen banking stock Oct-8 market-price bars now exist, each linked by retained provenance source ID to a `V1_4_BANK_TAIL_CAPTURE` record with non-empty payload hash. The one `NIFTY_BANK` benchmark bar has the same capture linkage (record `bce3e295-8fb4-4758-baf9-d82042b89c1a`).
- There are 26 accepted delegated Gross/Net NPA reviews (two per bank). All 26 have source IDs, matching retained source payload hashes, standalone-quarter percent unit contracts, null personal reviewer and source-bound delegated attribution. Their selected-snapshot adoption remains pending actual canonical materialization.
- The October 8 source capture is already retained. Do not reacquire the same day simply to clear an old `HISTORY_LATEST_SESSION_STALE` reason.
- This is a **retained-source** count, not a current qualified or READY count. A new signed-in canonical replay must validate applicable freshness, corporate action/return basis and exact requirement items.
- No unexpired and unconsumed P4 grant was found in live ledger; no unsupported issuer/grant mutation occurred.
- Selected status count: 0 READY / 11 REVIEW_REQUIRED / 2 CONFLICTING. No newly selected READY snapshot was made in this read-only operation.

| Bank | Selected historical status | Historical blocked items | Selected snapshot | Selected selection | Oct-8 raw source record | Accepted NPA reviews |
| --- | --- | ---: | --- | --- | --- | ---: |
| AUBANK | REVIEW_REQUIRED | 17 | `6193b778-5063-46df-8c9c-940d484c2963` | `4bcf6208-92bc-4576-8b63-f864a65ae8dc` | `9ee3151b-bde1-4d60-b08c-1bc15625b474` | 2 |
| AXISBANK | REVIEW_REQUIRED | 17 | `f81e4d3e-ba6b-496f-b3f8-8bea8da75828` | `ff63f4e3-a8e2-488f-a0e9-11618e6d38f6` | `b8c3796a-e0c2-49e1-808a-4bcaec70d163` | 2 |
| BANDHANBNK | REVIEW_REQUIRED | 17 | `4eeb7ec0-151f-458c-9573-40e6fd1715e2` | `3934ad33-8e84-4001-b571-0803fc14cae9` | `fc1e6371-100f-4a4d-bdea-9063cf1eaf38` | 2 |
| BANKBARODA | REVIEW_REQUIRED | 17 | `ff6163db-fe29-4f23-aae4-cedb9cf94abe` | `234bd0c6-ca49-4905-98bf-5d79da5bf0a0` | `7c10a0d3-d953-4a51-ad05-d8e80b118485` | 2 |
| FEDERALBNK | REVIEW_REQUIRED | 17 | `3696242d-eb86-42e8-8dc7-152c5a40231b` | `ceae2763-8259-4270-8e67-03782697e710` | `47ac646d-619a-4342-8f69-24c73a3fdfa8` | 2 |
| HDFCBANK | REVIEW_REQUIRED | 15 | `de6796b4-d076-4d1e-a120-393347019424` | `f8bb668e-610e-428f-8e0c-78e732eb22c0` | `b4170a00-f3c0-49cb-bac1-9b8f3b21394c` | 2 |
| ICICIBANK | REVIEW_REQUIRED | 17 | `cd640846-2474-4b3d-abb0-f302c5a7bd89` | `fd45e8c9-69ad-4884-8bc8-b9563310a5d9` | `e0d3756f-be23-47d1-aeb5-ac571f14b5cd` | 2 |
| IDBI | REVIEW_REQUIRED | 17 | `a3e13a87-b856-4eea-b109-81de0210738c` | `ed5172bf-0c1f-47b7-82c2-c2998a5ffc87` | `5740d1bf-42d5-4629-a187-19859d1ca3b3` | 2 |
| IDFCFIRSTB | REVIEW_REQUIRED | 17 | `769ddaca-ce52-4166-b48c-7da636aef070` | `bea4c208-8485-49d5-aa29-bacb761876fc` | `00f9d038-bad5-4680-a551-fac89afbd928` | 2 |
| INDIANB | REVIEW_REQUIRED | 17 | `c3fa5774-47cf-48cc-97ac-55be1ac5a669` | `fc722991-2203-45a5-b67c-6eca130f9f48` | `dbd38368-14df-4839-8651-305cf0d2a6df` | 2 |
| KARURVYSYA | CONFLICTING | 22 | `6f51ead4-b4da-46dc-85af-c7b185ab0e3c` | `3888d732-0304-449c-92ba-924a22049042` | `3484e3e6-4cbe-4bb9-b063-ceb75f8ae00a` | 2 |
| KOTAKBANK | CONFLICTING | 22 | `a02ac622-85f7-4824-9522-ce38d66524d0` | `a9f29211-28e1-4a4e-baf4-02d1f90e1407` | `216b6b3e-8001-4b55-b87c-a49fbc321fe6` | 2 |
| SBIN | REVIEW_REQUIRED | 22 | `e2470e85-10e0-430b-a1fe-6569518c5f87` | `0ee17b88-68f2-4cc5-8f25-abf33b11bb09` | `fa90d184-e65e-4082-ac74-8b2bf0920e54` | 2 |


## Non-negotiable qualification boundary

History, NPA reviews and annually labelled financial captures are distinct evidence families. `FRESH` from selected snapshots is historical until the signed-in read-only `P7_IC3_VALIDATE_CANONICAL_INPUTS` handler checks current source cutoffs. Market prices cannot prove regulatory CAR/CET1, financial periods, ownership denominator, ratings/governance or valuation contracts. No canonical READY value accrues before materialized selection readback.

## Current frontend remediation on this PR

BANK research UI now labels persisted READY as **HISTORICAL READY (CURRENT NOT VERIFIED)**. An independent wall-clock veto checks required evidence timestamps without provider responses and a Development-only owner-session read-only request verifies prospective canonical results on load/expiry. It does not write or claim current READY. This frontend has not been deployed as part of the readback.
