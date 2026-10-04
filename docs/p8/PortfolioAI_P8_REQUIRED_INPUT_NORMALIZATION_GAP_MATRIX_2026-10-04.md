# PortfolioAI P8 Required-Input and Normalization Gap Matrix

Date: 4 October 2026

| Historical case | Candidate profile | Implementation | Applicability evidence | Required-input authority | Current historical normalized completeness | Primary gap |
|---|---|---|---|---|---:|---|
| Edible Oil | AGRI_PROCESSING | Registry only; no canonical engine/router | **Insufficient** | P7 registry: peer/self percentile, relative valuation, momentum, risk, governance curves | **0 / not evaluated as route** | Business applicability + engine/router implementation |
| Edible Oil | BRANDED_CONSUMER_FMCG | K4 methodology implemented; scoring adapter pending | **Insufficient** | CONSUMER_FMCG_K4B scoring authorities | **0 / not evaluated as route** | Brand/distribution/category proof + application taxonomy |
| Steel Pipes | STEEL_FERROUS | K4 methodology implemented; scoring adapter pending | **Insufficient** | METALS_COMMODITIES_K4B through-cycle normalization | **0 / not evaluated as route** | Commodity-cycle/raw-material integration proof + valid application taxonomy |
| Steel Pipes | CAPITAL_EQUIPMENT_ELECTRICAL | K4 methodology implemented; scoring adapter pending | **Rejected on current evidence** | INDUSTRIALS_CAPITAL_GOODS_K4B authorities | **0 / not evaluated as route** | Profile semantics not satisfied |

## AGRI_PROCESSING mandatory evidence

The registered methodology requires ten mandatory composites spanning:

- gross/operating margin history and product mix;
- revenue/volume/export growth;
- ROCE/ROIC;
- CFO/FCF/inventory/working capital;
- leverage;
- brand/customer/supply chain and procurement/processing moat;
- valuation;
- 252-day price + benchmark history;
- crop/input/FX/customer-concentration risk;
- ownership/governance.

The selected historical filing does not supply normalized authorities for these composites merely by containing raw XBRL facts.

## BRANDED_CONSUMER_FMCG mandatory evidence

The executable K4 methodology requires ten scored signals including:

- margin history;
- revenue + volume/price/mix growth;
- ROCE/ROIC;
- cash conversion and working capital;
- leverage;
- **brand/distribution/category durability**;
- valuation;
- relative momentum;
- category/market risk;
- ownership/governance.

## STEEL_FERROUS mandatory evidence

The executable methodology requires through-cycle normalization for:

- margin / EBITDA-per-tonne context;
- volume/realization/spread growth;
- capacity/utilisation;
- raw-material integration/cost position;
- through-cycle ROCE;
- through-cycle cash flow;
- leverage;
- through-cycle valuation;
- commodity exposure metadata;
- market risk/momentum.

Raw segment revenue alone establishes none of these normalized composites.
