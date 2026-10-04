# PortfolioAI P8 Historical Taxonomy Crosswalk + Existing Methodology Route Validation — Closure

Date: 4 October 2026

## Exact disposition

**HISTORICAL_CROSSWALK_ROUTE_VALIDATION_BLOCKED_NO_SEMANTICALLY_SUPPORTED_EXISTING_ROUTE**

Implementation and deterministic validation are **COMPLETE / PASS**.

## Canary result

- authoritative complete classifications: **1**
- conditional OD2 complete classifications: **1**
- authoritative unique routes: **0**
- conditional unique routes: **0**
- complete normalized-input pairs: **0**

The authoritative classification is **Edible Oil — IN040101001**.

The conditional OD2 candidate is **Manufacturing- Steel Pipes → Iron & Steel Products — IN070205015**.

## Edible Oil

The official hierarchy is:

`Fast Moving Consumer Goods → Fast Moving Consumer Goods → Agricultural Food & other Products → Edible Oil`

Development has no active application taxonomy target representing that hierarchy.

The actual router would route the hypothetical input `FMCG + Vegetable Oils Products` to `BRANDED_CONSUMER_FMCG`, but that path is rejected. The profile requires branded-consumer semantics, including brand/distribution/category durability, which the official Edible Oil classification does not establish.

The registry contains an `AGRI_PROCESSING` methodology, but `RESEARCH_PROFILE_ROUTING_V2` does not expose it. Adding a route is outside this task.

Disposition: **UNSUPPORTED_EXISTING_METHODOLOGY**.

## Five other dominant descriptions

- `Manufacturing- Steel Pipes`: reviewable OD2 synonym candidate to `Iron & Steel Products`, but no semantically compatible existing application crosswalk or methodology route.
- `IT and Business Service`: ambiguous below IT macro/sector.
- `EPC/Engineering Services`: ambiguous across Construction and Engineering Services.
- `Textile`: partial Textiles/Textiles & Apparels hierarchy only.
- `Automotive Segment`: Automobile vs Auto Components unresolved.

No fallback route is used.

## Input completeness

No supported route exists, so canonical route-specific input completeness remains **0**. Raw XBRL presence is not counted as normalized methodology input completeness.

## Accounting boundary

The six V3-normalized cases with non-zero aggregate intersegment revenue remain blocked under approved V1. No allocation was inferred and no accounting rule was weakened.

## Verification

Workflow `37224872015`: **SUCCESS**.

Focused tests: **5 / 5 PASS**.

Crosswalk fingerprint:

`4cec9b0468f27d0724e7db04487dba2af75794d9ffbcd19d304b855f2ddf6eb7`

Final router-validation fingerprint:

`c6c15c0e9bce15a20242e6ad8684bfd97f38ce584652515809a13bcd4e98cd19`

## Expansion boundary

The 25,761-pair surface remains **NOT AUTHORIZED / NOT MEASURED**.

No experiment freeze/execution, B5/B6/B-FINAL rebuild or P8-C follows from this task.
