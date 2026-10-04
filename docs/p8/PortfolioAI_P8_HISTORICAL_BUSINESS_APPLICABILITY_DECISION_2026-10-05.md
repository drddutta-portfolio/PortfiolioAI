# PortfolioAI P8 Historical Business-Applicability + Methodology Capability Decision

Date: 5 October 2026

## Exact disposition

**HISTORICAL_BUSINESS_APPLICABILITY_MIXED_DECISION_STEEL_EXISTING_METHOD_SUPPORTED_EDIBLE_OWNER_POLICY_REQUIRED**

This is a decision closure, not authorization to implement.

## Case 1 — Iron & Steel Products / Steel Pipes

Outcome: **A — Existing methodology applicability is proven.**

The approved historical Basic Industry is `Iron & Steel Products`. The locked Metals K4A methodology explicitly accepts `IRON_STEEL_PRODUCTS` as a `STEEL_FERROUS` selector.

The previous audit was too strict when it treated raw-material integration and other through-cycle evidence as prerequisites for methodology selection. Those are mandatory scoring/readiness inputs.

### Smallest future integration change

A separately authorized implementation should:

1. preserve the official historical hierarchy `Industrials → Capital Goods → Industrial Products → Iron & Steel Products`;
2. add a canonical methodology-selection bridge that can use the proven **Basic Industry** without rewriting the owner-facing economic sector;
3. route that exact Basic Industry to existing `STEEL_FERROUS`;
4. reuse `SECTOR_ENGINE_REGISTRY` and `METALS_COMMODITIES_K4B_SCORING_V1`;
5. activate the existing non-BANK/non-PHARMA scoring adapter path for this profile in read-only historical execution;
6. fail closed on any less-specific `Industrial Products` classification;
7. rerun only the original 32-case canary and confirm no negative-control promotions;
8. separately assess normalized input readiness.

No new methodology is required for Steel Pipes.

## Case 2 — Edible Oil

Outcome: **D / C — owner-controlled selection decision plus AGRI_PROCESSING capability gap.**

### BRANDED_CONSUMER_FMCG

The existing methodology accepts `VEGETABLE_OILS_PRODUCTS`. The source proves `Edible Oil`, but no adopted rule equates these labels.

The owner must decide whether the semantic selector mapping:

`Edible Oil (IN040101001) → VEGETABLE_OILS_PRODUCTS → BRANDED_CONSUMER_FMCG`

is valid for PortfolioAI methodology selection.

If approved, this would be an applicability mapping only. Missing brand/durability and other score inputs remain readiness blockers rather than selection blockers.

### AGRI_PROCESSING

The profile exists in the P7 registry but:
- has no equivalent canonical selector contract;
- is not exposed by the router;
- is not in `SECTOR_ENGINE_REGISTRY`;
- has no dedicated canonical K4 scoring implementation.

Therefore selecting AGRI_PROCESSING would require a separately scoped methodology-capability extension. It should **not** be chosen merely because it sounds intuitively closer to edible-oil processing.

## Canary limits

The 32-case canary proves only that:
- one existing-method integration path is viable for the specific Steel Pipes case;
- Edible Oil still needs an owner selection decision;
- the canary does not represent the entire 25,761 candidate population.

It does **not** prove full-population feasibility or infeasibility.

## Recommended next authorization

### Recommended immediate authorization

**P8 Steel-Ferrous Historical Route Integration + Frozen-Canary Input Readiness Validation**

Bounded scope:
- Steel Pipes / exact `IN070205015` selector only;
- repository-only implementation;
- no 25,761 expansion;
- no scoring persistence;
- no experiment execution;
- no P8-C;
- original canary must remain frozen.

Expected success:
- exactly one authoritative existing route for the Steel Pipes case;
- preserved historical economic taxonomy;
- deterministic fail-closed negative controls;
- concrete normalized-input readiness result.

Stop if:
- integration requires rewriting the historical sector;
- more than one profile becomes selectable;
- the existing METALS_COMMODITIES engine cannot be invoked without changing methodology semantics.

### Separate Edible Oil owner decision

Choose one:

1. approve the selector mapping `Edible Oil → VEGETABLE_OILS_PRODUCTS → BRANDED_CONSUMER_FMCG` for methodology selection, with scored-input readiness still fail-closed; or
2. keep Edible Oil unsupported under current existing methodology capability; or
3. separately authorize design of an AGRI_PROCESSING applicability + executable methodology extension.

Do not bundle AGRI_PROCESSING development into the Steel integration.
