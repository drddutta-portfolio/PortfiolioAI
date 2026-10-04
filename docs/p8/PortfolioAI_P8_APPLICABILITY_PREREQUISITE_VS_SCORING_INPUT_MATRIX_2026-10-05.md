# PortfolioAI P8 Applicability Prerequisite vs Scoring-Input Matrix

Date: 5 October 2026

This audit distinguishes **methodology selection** from **score computability**. A missing scored input does not by itself make a methodology inapplicable.

| Profile | Selection / applicability authority | Scored/readiness evidence | Execution state |
|---|---|---|---|
| BRANDED_CONSUMER_FMCG | Consumer/FMCG K4A industry selectors; product-category metadata required; sector-only routing prohibited | Margin history, revenue/volume/price mix, ROCE/ROIC, cash conversion, working capital, brand/distribution/category durability, leverage, valuation, momentum/risk, ownership/governance | K4 methodology implemented; sector engine registered; generic scoring adapter pending |
| STEEL_FERROUS | Metals K4A industry selectors including **IRON_STEEL_PRODUCTS**; commodity-exposure metadata required; sector-only routing prohibited | Through-cycle margin/EBITDA-per-tonne, volume/realization/spread, capacity/utilisation, raw-material integration/cost position, ROCE, cash flow, leverage, valuation, momentum/risk, governance | K4 methodology implemented; sector engine registered; generic scoring adapter pending |
| CAPITAL_EQUIPMENT_ELECTRICAL | Industrials K4A selectors such as heavy electrical, electrical equipment, industrial machinery and industrial products | Order/revenue growth, margins, ROCE, cash flow, working capital, capacity/utilisation, leverage, valuation, momentum/risk, governance | K4 methodology implemented; sector engine registered; generic scoring adapter pending |
| AGRI_PROCESSING | P7 registry contains a profile and required signals, but no canonical industry-selector/applicability contract comparable to K4A was found | Ten mandatory composites across quality, growth, capital efficiency, cash flow, balance sheet, business durability, valuation, momentum, risk and governance | Registry present; router absent; sector engine absent; dedicated canonical scoring implementation absent |

## Interpretation

### Steel Pipes

Approved historical classification:

`Industrials → Capital Goods → Industrial Products → Iron & Steel Products (IN070205015)`

The existing `STEEL_FERROUS` K4A contract explicitly accepts normalized industry selector `IRON_STEEL_PRODUCTS`.

Therefore **methodology applicability is supported by the existing methodology contract**. Raw-material integration, spread history, capacity/utilisation and other through-cycle fields are scoring/readiness evidence; they must not be promoted into hidden selection prerequisites.

### Edible Oil

Approved historical classification:

`Fast Moving Consumer Goods → Fast Moving Consumer Goods → Agricultural Food & other Products → Edible Oil (IN040101001)`

The existing BRANDED_CONSUMER_FMCG contract accepts `VEGETABLE_OILS_PRODUCTS`, not `EDIBLE_OIL`. No adopted repository rule currently proves those labels equivalent.

The contract requires product-category metadata for selection/readiness, and the historical source proves an `Edible Oil` category, but the **normalization from Edible Oil to VEGETABLE_OILS_PRODUCTS is owner-controlled and currently absent**.

Brand/distribution/category-durability evidence is mandatory for scoring but is not separately declared as a router-selection prerequisite.

AGRI_PROCESSING does not have a sufficiently explicit canonical applicability selector and is not executable through the sector-engine/router path.
