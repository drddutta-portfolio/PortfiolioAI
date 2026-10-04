# PortfolioAI P8 Historical Four-Tier Taxonomy Mapping + Canary Validation Closure

Date: 4 October 2026

## Exact disposition

**HISTORICAL_FOUR_TIER_TAXONOMY_MAPPING_PENDING_OWNER_DECISION**

The bounded implementation and canary validation completed successfully. The mapping candidate is reviewable but **not adopted**, and experiment feasibility remains blocked.

## 1. Implementation / tests

The build created a versioned four-tier mapping candidate, authority inventory, owner decision package, deterministic mapper, focused tests and a canary validation workflow.

The first validation run passed 13/13 tests but stopped before producing a result because PostgreSQL date objects were not JSON-serializable in the audit fingerprint. The serializer was corrected without changing the frozen candidate or canary. The rerun completed successfully with the same candidate and canary.

## 2. Authority inventory

The repository already encodes the NSE four-field classification shape in `k1-fetch-nse-primary-classification.mjs`: Macro-Economic Sector, Sector, Industry and Basic Industry.

However, Development currently materializes only two-level PortfolioAI taxonomy authority:

- active taxonomy rows: 2, both `SECTOR, INDUSTRY`;
- sectors: 8;
- industries: 9;
- verified source mappings: 9.

No preserved historical K1 four-level snapshot was found in the repository or existing R2 inventory. Gate-K remains an analytical routing authority, not a complete economic taxonomy.

Therefore the prior blocker is now refined: **semantic evidence exists; complete materialized mapping authority does not.**

## 3. Frozen 32-case canary result

Semantic evidence remained valid for **32/32** canary pairs.

Measured mapping outcomes:

| Measure | Pairs | Unique identities |
|---|---:|---:|
| Authoritative partial taxonomy proof | **5** | **4** |
| Authoritative Sector + Industry partial proof | **2** | **2** |
| Conditional / pending-owner mapping | **4** | **4** |
| Unsupported or ambiguous | **23** | — |
| Complete four-tier authoritative classification | **0** | **0** |
| Authoritative methodology route | **0** | **0** |
| Unique route candidate from partial proof | **2** | **2** |
| Complete normalized-input pairs | **0** | **0** |

The two route-compatible partial cases resolve to the existing **PHARMA_V1** route from exact `Pharmaceuticals` evidence plus the existing canonical two-level parent relation. They are not reported as authoritative routes because Macro-Economic Sector and Basic Industry remain unproven.

## 4. What is genuinely proven

Existing exact authority can recover partial historical classification without using current company assignments. Examples include:

- `Pharmaceuticals` → existing canonical Pharma / Pharmaceuticals Sector+Industry relation;
- `Pharma` → existing canonical Pharma Sector only;
- `Banking` → existing canonical Banking Sector only.

This is stronger than the prior state, which had zero taxonomy proof of any level.

## 5. What remains conditional

Four owner-controlled decisions remain unresolved:

- OD1 — whether a later frozen NSE taxonomy vocabulary may be used retrospectively;
- OD2 — whether a reviewed semantic synonym catalog may map phrases such as `Hospital Business`;
- OD3 — whether any dominant-business inference rule is approved;
- OD4 — how genuinely diversified companies should be treated when no dominant business is authoritatively resolved.

The previous >50% segment-revenue dominance proposal is **not** treated as approved.

## 6. Expansion decision

The pre-existing expansion gate is preserved.

It fails because:

- mapping authority is still a candidate, not adopted;
- complete four-tier classification = 0;
- authoritative route from complete classification = 0.

Therefore the build **did not process all 25,761 provisional candidate pairs**. Full-population semantic recovery remains **NOT MEASURED**. No successful rows were used to manufacture a narrower denominator.

## 7. Route-specific normalized inputs

They were not evaluated because there is no authoritative complete route. Raw fact presence was not treated as normalized completeness.

## 8. Research standards

The proposed standards remain not owner-frozen:

- >=24 dates: PASS — 32;
- >=80% overall complete-input coverage: FAIL — 0%;
- >=70% each retained date: FAIL;
- >=60% per major methodology sector: NOT COMPUTABLE / fail closed.

## 9. Cause classification

This closure is **not primarily blocked by missing source evidence**. The canary retains semantic evidence in all 32 cases.

The material blockers are:

1. **missing complete taxonomy definitions/materialization** — Macro-Economic Sector and Basic Industry are not present in the active Development authority;
2. **unapproved mapping policy** — four owner decisions remain pending;
3. **ambiguous business semantics in a subset** — multi-business and broad descriptions cannot be silently collapsed;
4. **methodology is downstream, not the primary blocker** — two PHARMA_V1 route candidates exist from partial proof, but cannot become authoritative until classification is complete.

## 10. Safety boundary

Provider calls 0; new source acquisition 0; Supabase/R2 writes 0; migrations 0; deployments 0; Production/main changes 0; B5/B6/B-FINAL rebuild 0; experiment execution 0; P8-C 0; return/performance/forward/holdout inspection 0.
