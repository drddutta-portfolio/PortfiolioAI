# PortfolioAI P8 Application-Taxonomy / Router / Profile Capability Inventory

Date: 4 October 2026

## Canonical chain

`NSE historical economic classification → application taxonomy → RESEARCH_PROFILE_ROUTING_V2 → SECTOR_ENGINE_REGISTRY → scoring profile/version → normalized required signals`

The current Development application taxonomy contains **9 active industries**.

The router is intentionally fail-closed. A methodology registry entry alone does not establish executable capability.

## Capability distinctions

### AGRI_PROCESSING

- Present in P7 methodology registry: **YES**
- Required signals: **10**
- Present in current held-profile assignments: **YES**
- Exposed by `RESEARCH_PROFILE_ROUTING_V2`: **NO**
- Registered in `SECTOR_ENGINE_REGISTRY`: **NO**
- Dedicated K4 scoring implementation: **NO**
- Canonical live/historical sector-engine execution: **NO**

Disposition: **REGISTERED_BUT_UNIMPLEMENTED_IN_CANONICAL_EXECUTION_PATH**

### BRANDED_CONSUMER_FMCG

- Registry profile: **YES**
- Router path: **YES**
- Sector engine: **IMPLEMENTED**
- K4 scoring methodology: **IMPLEMENTED**
- Runtime activation: contract remains read-only / non-persistent
- Generic scoring-profile resolution: **PENDING_ADAPTER** outside BANK/PHARMA
- Applicability requires product-category metadata plus brand/distribution/category-durability evidence.

### STEEL_FERROUS

- Registry profile: **YES**
- Router path: **YES**, under metals/steel application classifications
- Sector engine: **IMPLEMENTED**
- K4 scoring methodology: **IMPLEMENTED**
- Generic scoring-profile runtime: **PENDING_ADAPTER**
- Methodology requires through-cycle steel/commodity evidence including raw-material integration/cost position, volume/realization/spread history, capacity/utilisation and commodity exposure.

### CAPITAL_EQUIPMENT_ELECTRICAL

- Registry profile: **YES**
- Router path: **YES**
- Sector engine: **IMPLEMENTED**
- K4 scoring methodology: **IMPLEMENTED**
- Generic scoring-profile runtime: **PENDING_ADAPTER**
- Profile semantics require capital/electrical equipment business evidence, order/revenue growth, capacity/utilisation and related industrial durability attributes.

## Important architecture finding

PortfolioAI already separates **economic classification** from **analytical methodology**. That separation must be preserved.

A static taxonomy synonym is insufficient whenever two businesses sharing a taxonomy branch require different analytical profiles.

Any future applicability rule should remain owned by the canonical research-profile routing architecture and profile contracts; do not create a second P8-only router.
