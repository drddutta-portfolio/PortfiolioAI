# R2C Canonical Sector Normalization — 2026-09-14

Status: **READ-ONLY BASELINE / DETERMINISTIC MAPPING V1**

This baseline applies the R2 exact-label normalization rules to the 240 currently open equity holdings using the source-sector labels already present in `current_security_enrichment_v1`.

No provider calls, database writes, migrations, deployments, or scheduler changes were performed.

## Result

| Mapping result | Equity holdings |
| --- | ---: |
| Deterministically mapped to an approved PortfolioAI canonical sector | 210 |
| Held for explicit review rather than guessed | 30 |
| Missing/unrecognized outside those groups | 0 |
| Total equities | 240 |

The 30 review-required holdings are produced by intentionally broad or ambiguous source labels:

- `Consumer Services` — 11
- `Waste Managment` — 7
- `Material` — 4
- `Services` — 4
- `Ship Building` — 2
- `Consumer Discretionary` — 2

These labels are not silently coerced into a research sector. Industry/company context must be reviewed before mapping.

## Deterministically mapped canonical distribution

| PortfolioAI canonical sector | Holdings |
| --- | ---: |
| BANKING_FINANCIAL_SERVICES | 37 |
| PHARMA_HEALTHCARE | 32 |
| INFRASTRUCTURE_CAPITAL_GOODS | 30 |
| INFORMATION_TECHNOLOGY | 19 |
| CHEMICALS_FERTILIZERS | 14 |
| CONSUMER_DURABLES | 13 |
| AUTO_AUTO_ANCILLARIES | 12 |
| FMCG | 12 |
| OIL_GAS_ENERGY | 11 |
| METALS_MINING | 10 |
| TEXTILES | 7 |
| POWER_UTILITIES | 6 |
| DEFENCE | 2 |
| REAL_ESTATE | 2 |
| TELECOMMUNICATIONS | 2 |
| CEMENT_CONSTRUCTION_MATERIALS | 1 |

The following approved canonical sectors currently have no deterministic holding assignment from the exact-label V1 mapping and may still emerge from review of the 30 ambiguous holdings or future portfolio changes:

- MEDIA_ENTERTAINMENT
- AGRICULTURE_ALLIED
- AVIATION_LOGISTICS
- NEW_AGE_DIGITAL

## Important boundary

Canonical sector mapping does **not** imply research-profile readiness.

For example:

- `BANKING_FINANCIAL_SERVICES` still requires a subtype such as BANK, NBFC/LENDING, INSURANCE, AMC/market infrastructure, etc.
- `PHARMA_HEALTHCARE` may require PHARMA, HOSPITAL, or DIAGNOSTICS.
- `INFRASTRUCTURE_CAPITAL_GOODS` may require capital-goods/engineering versus construction/EPC treatment.
- Other canonical sectors may also require subtype overlays where business economics materially differ.

Therefore a security may be `CLASSIFICATION = FRESH` while still being `RESEARCH_PROFILE = PROFILE_PENDING`.

## R2 policy

1. Preserve the original source sector and industry.
2. Store/derive a separate canonical PortfolioAI sector.
3. Preserve the exact mapping basis.
4. Do not guess ambiguous broad labels.
5. Keep research-profile code/readiness separate from canonical sector.
6. Existing scoring-profile assignments may inform proposed research-profile mapping but cannot make a research profile READY by themselves.

The implementation is in `src/features/research/sectorResearchMapping.ts` and is covered by deterministic unit tests.
