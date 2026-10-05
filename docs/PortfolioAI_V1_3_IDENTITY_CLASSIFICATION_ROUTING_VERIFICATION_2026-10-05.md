# PortfolioAI V1-3 Identity, Classification and Methodology Routing — Verification

**Date:** 5 October 2026  
**Repository:** `drddutta-portfolio/PortfiolioAI`  
**Branch:** `PortfolioAI-Development`  
**Starting authoritative remote HEAD:** `6186ddf2acae853b0f5d57652f9b99cd6ab7bccc`  
**Scope:** V1-3 only  
**Disposition:** **NOT PROVEN — application-routing compatibility defect identified**  
**Application code changed:** NO  
**Database/schema/Auth changed:** NO  
**Provider/scheduler/storage/P8 execution:** NO

## 1. Authority and manifest verification

The actual remote Development branch began at the owner-approval commit above. No later conflicting Development commit existed before this V1-3 verification.

The private frozen manifest prerequisite is satisfied by the dated owner-approval record. The approved JSON remains the unchanged Git blob `6583d106d7b53b0f4adcdca3f6f4d600f742658f` and approved SHA-256:

`79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`

Frozen contract preserved:
- 111 unique equities;
- 109 REVIEW_REQUIRED + 2 STALE;
- frozen value 132,585,696 paise / INR 1,325,856.96;
- release minimum 100 successful members AND 119,327,127 paise from those same successful members.

No manifest membership or valuation was regenerated.

## 2. Development target

Read-only Supabase target was reverified as:
- PortfolioAI Dev;
- project ref `lrgpjimipfkyoqbpsqzz`;
- ACTIVE_HEALTHY;
- PostgreSQL 17.6.

All database work was SELECT-only.

## 3. Full-population census

Current open population remains:
- 248 open holdings;
- 239 equities;
- 9 ETFs.

### Equity identity/classification

For the 239 equities:
- 239/239 have canonical security IDs;
- 239/239 have ISIN;
- 239/239 have instrument type;
- 239/239 have sector;
- 239/239 have industry;
- 0 classification conflicts;
- 239/239 have a current stored profile code;
- 239/239 have a current stored methodology authority/version.

Two equities lack a canonical listing projection in `current_security_identity_v1`: the view has no listing ID/exchange/trading symbol for those rows. Both nevertheless have a VERIFIED Angel One provider mapping with NSE trading identity. Exact member-level details are retained in the private exception record. No identity field was fabricated and no database repair was authorized.

### ETF boundary

For the 9 ETFs:
- all remain asset class ETF;
- none has an equity research profile/methodology route;
- sector/industry research classification is not treated as required equity intelligence;
- equity methodology routing is NOT APPLICABLE.

This preserves asset-class versus portfolio-role separation.

## 4. Approved methodology census

The approved P7-IC1 coverage artifact contains exactly 239 equity rows across 45 approved profile codes.

Live Development comparison to that approved matrix:
- missing approved rows: 0;
- extra live equity rows: 0;
- profile/subprofile/methodology mismatches: 0;
- sector/industry label mismatches: 0;
- classification conflicts: 0.

The complete frozen 111-member manifest is present in the live 239-equity population:
- manifest members missing from live population: 0;
- manifest route mismatches: 0.

The one approved factual-review exception remains BLUEJET:
- parent profile PHARMA;
- Primary Pharma subprofile unresolved;
- methodology family preserved;
- state remains REVIEW_REQUIRED rather than guessed.

This exception is fail-closed and does not justify assigning an invented Primary Pharma subprofile.

## 5. Application-routing compatibility defect

The persisted/canonical route matrix and the current application route resolver are not yet equivalent.

Approved IC1 matrix:
- 45 profile codes;
- 239 equities.

Current `RESEARCH_PROFILE_ROUTING_V2` type/router surface:
- 29 profile codes total;
- only 25 of the 45 approved held-profile codes are exposed;
- 20 approved held-profile codes are absent.

Those 20 absent profile codes cover:
- 74 of the 239 held equities;
- 26 of the frozen 111-member cohort.

Absent approved profiles:
- AGRI_PROCESSING
- BUSINESS_SERVICES
- CEMENT_BUILDING_MATERIALS
- CONSUMER_DURABLES
- DIVERSIFIED_CHEMICALS_PETROCHEM
- ENVIRONMENTAL_SERVICES
- FINANCIAL_HOLDING_COMPANY
- HOSPITALITY_LEISURE
- INDUSTRIAL_PRODUCTS
- IT_BPM_SERVICES
- JEWELLERY
- LOGISTICS
- OIL_OPERATIONS
- REAL_ESTATE_DEVELOPER
- RETAIL_COMMERCE
- SHIPPING
- SOLID_FUELS_MINING
- TELECOM_INFRA
- TELECOM_OPERATOR
- TEXTILES_APPAREL

The current `SECTOR_ENGINE_REGISTRY` has the same effective 165/239 held-equity profile coverage for these approved profiles. Engine implementation itself belongs to later V1-5 where missing, but V1-3 requires current application routing to be compatible with the approved assignment authority and to fail closed as "engine not implemented" only after the approved route is resolved.

The current scoring path does not yet meet that separation:
- `scoringRepository.ts` resolves most securities from `security_scoring_profile_assignments` or `routeResearchProfileV1()`;
- only 4 of 239 held equities have a REVIEWED legacy scoring-profile assignment;
- the remaining population depends on the application classification router;
- therefore an approved persisted IC1 assignment can be present while the current application route returns methodology unavailable because the approved profile is absent from the router/engine surface.

This is not an evidence-readiness issue and is not repaired by V1-4 provider work. It is a V1-3 routing-compatibility defect.

## 6. Canonical source and shared-consumer findings

Classification presentation is correctly centralized through the shared portfolio/enrichment path:
- `current_security_enrichment_v1` is the classification authority;
- `applySharedClassification()` overlays that canonical classification onto the shared portfolio view;
- Holdings, Portfolio Structure and Research consume the shared portfolio position rather than creating independent page taxonomies.

P7 current intelligence also has an approved shared repository:
- `current_research_evidence_snapshot_lineage_v1`;
- `loadP7CurrentEvidenceSnapshots()`.

However, the generic scoring resolver currently re-resolves methodology from classification/legacy scoring assignment rather than consuming the full approved IC1 route assignment. That is the compatibility boundary that must be repaired.

Owner roles/settings remain a separate authority and were not changed.

## 7. Implemented-engine support

V1-3 does not convert methodology assignment into engine readiness.

Current evidence proves:
- approved route assignment: 238 RESOLVED + 1 factual REVIEW_REQUIRED;
- stored live profile/methodology projection: 239/239 present;
- generic application router/engine exposure: 165/239;
- 74/239 approved profiles currently lack application router/engine exposure;
- BLUEJET remains factual-review-required.

Where engine adapters or deterministic engines are absent/pending, status remains NOT PROVEN / later-gate work. No missing engine was implemented under V1-3.

## 8. Identity exceptions

Two held equities have canonical security ID + ISIN + VERIFIED Angel One NSE mapping but no canonical listing row projected through `current_security_identity_v1`.

Because this authorization forbids database mutation, no listing row was synthesized and no provider mapping synchronization was run.

This does not erase their canonical identity or approved methodology assignment, but it remains an identity completeness exception for V1-3 and should be repaired through the approved identity/listing authority under separate data-correction authorization if the final V1-3 closure requires the canonical listing projection to be complete.

## 9. Verification evidence and limitations

Read-only verification performed:
- current remote HEAD / governing approval state;
- private-manifest blob/approval identity;
- verified Development Supabase target;
- 248/239/9 population census;
- equity identity/classification completeness;
- classification-conflict census;
- ETF applicability boundary;
- exact live-vs-approved 239-row route comparison;
- exact frozen-111-vs-live route comparison;
- profile distribution and methodology authority/version census;
- legacy scoring-assignment census;
- application router profile coverage;
- sector-engine registry profile coverage;
- identity/listing/provider-mapping exception inspection.

Application source has not changed since the previously build-tested application SHA; comparison from `9b24b97eec37cdb6ce6ffa6440f2ee333ce2b41f` to the starting V1-3 HEAD is documentation/private-artifact only. The starting HEAD itself has a successful Vercel Preview deployment status.

No new code was committed, so no new build/deployment was required merely for documentation. V1-3-specific executable regression tests were not run in this execution environment; the routing defect is independently demonstrated by deterministic source/registry comparison and live read-only census, so V1-3 cannot be marked PASS regardless.

Authenticated hosted browser interaction was not executed and is not claimed.

## 10. V1-3 disposition

**V1-3 = NOT PROVEN.**

Primary blocker:
> The approved canonical IC1 route matrix covers 45 profiles / 239 equities, but the current application routing/sector-engine surface exposes only 25 of those approved held profiles / 165 equities. 74 equities, including 26 frozen-cohort members, can therefore have a valid approved stored route while the generic application scoring path cannot resolve that same approved profile.

Secondary identity exception:
> Two held equities have complete canonical security/ISIN plus VERIFIED Angel One NSE mappings but no canonical listing projection in `current_security_identity_v1`.

BLUEJET remains an accepted factual-review exception and must not be guessed into a Pharma Primary subprofile.

### Required next V1-3 repair

The preferred repair is not to duplicate all 45 assignments as page-local taxonomy rules. The current application scoring/routing path should consume the approved canonical route assignment authority (the P7 IC1/current snapshot-lineage projection), then separately map resolved profiles to available engines/adapters. This preserves the distinction:

identity/classification → approved route → engine support → evidence readiness.

For the two listing exceptions, prepare a separate exact canonical-listing data correction or approved identity-projection fix; do not infer database rows.

Any database correction/migration remains outside this authorization.

No V1-4 work was started.

## 11. Side-effect confirmation

- main/Production changes: NO
- database mutation/migration/Auth/RLS: NO
- provider calls/campaigns/refresh/mapping sync: NO
- scheduler action: NO
- R2/storage writes: NO
- P8 execution/canaries/backtests/backups/restores: NO
- investment-engine implementation: NO
- evidence acquisition: NO
