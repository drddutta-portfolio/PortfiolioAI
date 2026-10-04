# PortfolioAI P8 Historical Taxonomy Crosswalk — OD2 Review Package

Date: 4 October 2026  
Candidate: `P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1`  
Frozen Git blob: `fd5a683ab595d98c71254ea8c825d5ae82338afb`

## Reviewable OD2 entry

### Manufacturing- Steel Pipes

Proposed official taxonomy synonym mapping:

`Industrials (IN07) → Capital Goods (IN0702) → Industrial Products (IN070205) → Iron & Steel Products (IN070205015)`

Review state: **OWNER APPROVED / ADOPTED**

Rationale: the historical segment description explicitly says steel pipes, which is compatible with the official Basic Industry `Iron & Steel Products`. This is a semantic synonym, not an exact label match.

Important limitation: approving this OD2 entry would **not** create an existing methodology route. PortfolioAI's active application taxonomy has no semantically compatible target for this official branch. The existing Metals & Mining / Iron & Steel application category represents a different official economic branch, and the Capital Goods router's electrical/equipment profile is also not semantically justified for steel pipes.

Therefore adoption, if approved, would establish only the historical official taxonomy classification.

## Entries not presented for approval

- `IT and Business Service`: ambiguous; insufficient to choose a unique Basic Industry.
- `EPC/Engineering Services`: ambiguous across Construction and Engineering Services paths.
- `Textile`: only Sector/Industry level supported; Basic Industry unresolved.
- `Automotive Segment`: Automobile vs Auto Components unresolved.
- `Edible Oil`: already an exact authoritative official taxonomy match; no OD2 synonym approval needed.

## Exact optional approval statement

> **I approve the OD2 synonym entry in `P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1` frozen at Git blob `fd5a683ab595d98c71254ea8c825d5ae82338afb` mapping historical description `Manufacturing- Steel Pipes` to NSE Basic Industry `Iron & Steel Products (IN070205015)` under `Industrials → Capital Goods → Industrial Products`. This approval establishes the historical taxonomy mapping only; it does not authorize an application-taxonomy crosswalk, methodology route, 25,761-pair expansion, experiment execution, B5/B6/B-FINAL rebuild or P8-C.**


---

## Owner adoption record — 4 October 2026

The owner explicitly approved the OD2 synonym entry:

`Manufacturing- Steel Pipes → Iron & Steel Products (IN070205015)`

under:

`Industrials → Capital Goods → Industrial Products`

Frozen candidate:

`P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1`

Git blob:

`fd5a683ab595d98c71254ea8c825d5ae82338afb`

Immutable adoption record:

`docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_OD2_OWNER_ADOPTION_2026-10-04.json`

### Adoption effect

This entry is now authoritative for **historical official taxonomy classification only**.

It does **not** create or authorize:

- an application-taxonomy crosswalk;
- a methodology route;
- 25,761-pair expansion;
- experiment execution;
- B5/B6/B-FINAL rebuild;
- P8-C.

The route state therefore remains:

`NO_SEMANTICALLY_COMPATIBLE_APPLICATION_CROSSWALK`
