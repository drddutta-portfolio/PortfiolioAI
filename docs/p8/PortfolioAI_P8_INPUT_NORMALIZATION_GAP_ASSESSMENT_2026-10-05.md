# PortfolioAI P8 Input / Normalization Gap Assessment

Date: 5 October 2026

## Steel Pipes → STEEL_FERROUS

Applicability status: **SUPPORTED BY EXISTING CONTRACT**.

Input completeness remains **NOT PROVEN**.

The profile requires multi-period and through-cycle normalized evidence including:

- volume / realization / steel-spread growth;
- EBITDA-per-tonne or margin equivalent when disclosed;
- capacity and utilisation;
- raw-material integration and cost position;
- through-cycle ROCE/ROIC;
- through-cycle CFO/FCF conversion;
- net debt and interest coverage;
- through-cycle valuation;
- commodity-exposure metadata;
- market momentum and drawdown;
- ownership/governance.

The selected official filing provides some general financial statement and segment facts, but it does not establish the required multi-period normalized histories. Current B4 provider evidence selection is also empty for this historical identity under the old identity materializer.

Therefore the correct state is:

`APPLICABILITY_PROVEN / EXECUTION_INTEGRATION_MISSING / INPUT_COMPLETENESS_NOT_PROVEN`

not `METHODOLOGY_INAPPLICABLE`.

## Edible Oil → BRANDED_CONSUMER_FMCG

Applicability status: **OWNER-CONTROLLED MAPPING DECISION REQUIRED**.

If `Edible Oil → VEGETABLE_OILS_PRODUCTS` is adopted as a deterministic selector mapping, the existing BRANDED_CONSUMER_FMCG methodology can be selected. After that, input readiness would still require normalized histories for its ten K4B signals, including brand/distribution/category durability.

The current source proves category and dominant revenue but does not prove complete normalized scoring inputs.

## Edible Oil → AGRI_PROCESSING

Applicability status: **CONTRACT_AMBIGUOUS**.

Even if owner policy later declares Edible Oil eligible for AGRI_PROCESSING, the profile is not executable through the canonical router/sector-engine path and would require a methodology-capability extension before input completeness could be meaningfully assessed in the live/historical application path.
