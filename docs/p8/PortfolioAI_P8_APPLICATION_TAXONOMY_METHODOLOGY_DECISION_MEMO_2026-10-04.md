# PortfolioAI P8 Application-Taxonomy / Methodology Coverage Decision Memo

Date: 4 October 2026

## Exact audit conclusion

**APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_BLOCKED_APPLICABILITY_AND_EXECUTION_GAPS**

Neither authoritative historical classification is blocked only by missing router wiring.

## Architectural decision

Do **not** add an Edible Oil → BRANDED_CONSUMER_FMCG alias.

Do **not** add Iron & Steel Products / Steel Pipes → STEEL_FERROUS or CAPITAL_EQUIPMENT_ELECTRICAL aliases from taxonomy alone.

Those changes would collapse economic classification and analytical applicability into one taxonomy and violate the fail-closed architecture.

## Smallest future change if Edible Oil applicability is proven

If a bounded historical evidence review proves AGRI_PROCESSING applicability, the smallest canonical capability extension would be:

1. define a versioned, point-in-time **methodology-applicability contract** owned by the existing research-profile routing architecture;
2. represent the needed business-model attributes without modifying the official NSE taxonomy;
3. register AGRI_PROCESSING in `SECTOR_ENGINE_REGISTRY` with an approved executable scoring authority;
4. add a canonical `RESEARCH_PROFILE_ROUTING_V2` (or explicitly versioned successor) path using those applicability prerequisites;
5. activate/implement the sector scoring adapter required by `scoringProfileResolution`;
6. validate historical and live consumers against the same authority;
7. rerun only the frozen canary before considering broader census authorization.

This is **not merely router wiring** because AGRI_PROCESSING currently has no canonical sector-engine implementation.

## Steel Pipes

No integration change is currently justified.

Before any route extension, point-in-time evidence must establish whether the business actually behaves like:

- a through-cycle steel/commodity producer; or
- a capital/industrial equipment business; or
- neither existing profile.

If neither profile fits, the owner must choose between a new methodology extension and retaining `UNSUPPORTED_EXISTING_METHODOLOGY`.

## Proposed next bounded owner decision

Authorize one of:

### Option A — Recommended

**P8 Historical Business-Applicability Evidence + Methodology Capability Decision**

Read-only, canary-only task to search already-stored contemporaneous evidence for the business attributes required by AGRI_PROCESSING, BRANDED_CONSUMER_FMCG and STEEL_FERROUS, and to produce a reviewed applicability contract plus implementation proposal. No route activation.

### Option B

Retain both Edible Oil and Steel Pipes as `UNSUPPORTED_EXISTING_METHODOLOGY` for this historical experiment path and close this recovery branch without further methodology work.

No broad expansion should be authorized before one of these decisions.
