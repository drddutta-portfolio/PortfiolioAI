# PortfolioAI P8 Source-Backed Business-Applicability Evidence Assessment

Date: 5 October 2026

## Source 1 — Edible Oil case

Historical identity: `b33c4aee-1095-5010-907f-7fbd7b6efb89`  
ISIN: `INE699H01024`  
Decision instant: `2024-06-28T10:00:00+00:00`  
Official dissemination: `2024-05-01T13:10:49+00:00`  
Accounting scope: audited consolidated FY 2023-04-01 to 2024-03-31  
Source SHA-256: `07eeb7e380b7436e23543c61921d53011b9c15a523a9007751f4fca12d73a196`

Stored source establishes:

| Attribute | State | Evidence |
|---|---|---|
| Edible Oil business category | **PROVEN** | Explicit segment label `Edible Oil` |
| Edible Oil dominance | **PROVEN** | Approved V1/V3 ratio ≈ 75.67% |
| FMCG-related secondary business | **PROVEN** | Separate segment `Food & FMCG` |
| Vegetable-oils-products selector equivalence | **CONTRACT_AMBIGUOUS** | Methodology uses `VEGETABLE_OILS_PRODUCTS`; no adopted mapping from `Edible Oil` |
| Product-category metadata | **PROVEN at source-label level** | Explicit `Edible Oil` segment category |
| Brand/distribution/category durability | **NOT_PRESENT_IN_INSPECTED_SOURCE as semantic proof** | Selling/distribution and advertising expenses exist, but do not prove the qualitative durability signal |
| Procurement/processing moat | **NOT_PRESENT_IN_INSPECTED_SOURCE** | No source-backed applicability rule or disclosed moat located |
| AGRI_PROCESSING selector prerequisite | **CONTRACT_AMBIGUOUS** | Registry profile does not define a canonical selection rule |

The stored filing contains financial facts and operating expenses, but the audit does not reinterpret expenses as brand strength, distribution reach or procurement moat.

## Source 2 — Steel Pipes case

Historical identity: `19f21fe6-46c9-5f26-9ee5-6207558ba10b`  
ISIN: `INE230R01035`  
Decision instant: `2024-11-29T10:00:00+00:00`  
Official dissemination: `2024-05-31T09:27:01+00:00`  
Accounting scope: audited consolidated FY 2023-04-01 to 2024-03-31  
Source SHA-256: `4b0b16349cc9ef3ff46f61d590768a39915ba4c567ef4a72f0355cd28680521d`

Stored source establishes:

| Attribute | State | Evidence |
|---|---|---|
| Steel-pipe manufacturing | **PROVEN** | Explicit segment label `Manufacturing- Steel Pipes` |
| Dominance | **PROVEN** | Approved V1/V3 ratio ≈ 74.88% |
| Secondary trading exposure | **PROVEN** | `Trading- Building Material & Steel Products` |
| Iron & Steel Products classification | **PROVEN** | Owner-approved OD2 synonym to `IN070205015` |
| STEEL_FERROUS industry selector | **PROVEN** | K4A explicitly accepts `IRON_STEEL_PRODUCTS` |
| Upstream raw-material integration | **NOT_PRESENT_IN_INSPECTED_SOURCE** | No iron-ore/coking-coal integration disclosure located |
| Steel spread / commodity-cycle history | **NOT_PRESENT_IN_INSPECTED_SOURCE** | Not established by the selected filing |
| Electrical-equipment business | **CONTRADICTED by available classification evidence** | Proven business is steel-pipe manufacturing, not electrical equipment |
| Capital-equipment profile selection | **NOT SUPPORTED** | Broad `INDUSTRIAL_PRODUCTS` selector cannot override more specific proven Iron & Steel Products evidence without a conflict policy |

## Existing evidence inventory limitation

The legacy B4 provider-evidence eligibility rows for these identities contain no selected point-in-time provider document/fundamental evidence because the old materializer reports `INELIGIBLE_NO_EXACT_PROVIDER_IDENTITY`. The later official R2/XBRL recovery sources used here are therefore the controlling historical company evidence for this bounded audit.

This does **not** prove that no additional useful evidence exists anywhere in the 25,761-pair surface; that population remains unmeasured.
