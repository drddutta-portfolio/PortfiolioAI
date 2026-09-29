import type {Ic1ProfileEvidenceContract} from "./p7-ic-evidence-normalization.ts"
export const P7_IC_PROFILE_CONTRACTS={
  "AGRI_PROCESSING": {
    "profileCode": "AGRI_PROCESSING",
    "benchmarkAuthority": [
      "NIFTY_FMCG",
      "AGRI_PROCESSING_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "AGRI_PROCESSING_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "GROSS_OPERATING_MARGIN_HISTORY",
          "PRODUCT_MIX"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_VOLUME_EXPORT_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_INVENTORY_WORKING_CAPITAL"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_CASH_OR_LEVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "BRAND_CUSTOMER_SUPPLY_CHAIN",
          "PROCUREMENT_AND_PROCESSING_MOAT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "PE",
          "EV_EBITDA",
          "FCF_YIELD",
          "ROCE_WORKING_CAPITAL_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "CROP_INPUT_PRICE_FX_CUSTOMER_CONCENTRATION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "AGRI_PROCESSING_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "AGRO_FERTILISER": {
    "profileCode": "AGRO_FERTILISER",
    "benchmarkAuthority": [
      "NIFTY_CHEMICALS"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "REVENUE_AND_VOLUME_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "AUTO_COMPONENTS": {
    "profileCode": "AUTO_COMPONENTS",
    "benchmarkAuthority": [
      "NIFTY_AUTO",
      "EV_NEW_AGE_AUTOMOTIVE_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "REVENUE_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "AUTO_OEM": {
    "profileCode": "AUTO_OEM",
    "benchmarkAuthority": [
      "NIFTY_AUTO"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "VOLUME_AND_REVENUE_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "AUTO_COMPONENTS_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "BANK": {
    "profileCode": "BANK",
    "benchmarkAuthority": [
      "NIFTY_BANK"
    ],
    "signalRequirements": [
      {
        "signalCode": "ROE_ANNUAL",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 1
      },
      {
        "signalCode": "NIM_TTM",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 2
      },
      {
        "signalCode": "GROSS_NPA",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 3
      },
      {
        "signalCode": "NET_NPA",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 4
      },
      {
        "signalCode": "ADVANCES_GROWTH_YOY",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 5
      },
      {
        "signalCode": "DEPOSITS_GROWTH_YOY",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 6
      },
      {
        "signalCode": "EPS_GROWTH_YOY",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 7
      },
      {
        "signalCode": "ROA_ANNUAL",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 8
      },
      {
        "signalCode": "CET1_RATIO",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 9
      },
      {
        "signalCode": "CAPITAL_ADEQUACY_RATIO",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 10
      },
      {
        "signalCode": "EXTERNAL_LONG_TERM_RATING",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 11
      },
      {
        "signalCode": "PE_TTM_RELATIVE",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 12
      },
      {
        "signalCode": "PB_RELATIVE",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 13
      },
      {
        "signalCode": "PB_ADJUSTED_FOR_ROE",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 14
      },
      {
        "signalCode": "PRICE_MOMENTUM_12M",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 15
      },
      {
        "signalCode": "PRICE_MOMENTUM_6M",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 16
      },
      {
        "signalCode": "RELATIVE_STRENGTH_12M",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 17
      },
      {
        "signalCode": "INSTITUTIONAL_OWNERSHIP_TREND_4Q",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 18
      },
      {
        "signalCode": "GOVERNANCE_EVENT_SIGNAL",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 19
      },
      {
        "signalCode": "MAX_DRAWDOWN_1Y",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 20
      },
      {
        "signalCode": "VOLATILITY_RELATIVE",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 21
      },
      {
        "signalCode": "RATING_TREND",
        "required": true,
        "sourceAuthority": "BANK_NBFC_STAGE_8_BANK_V1",
        "order": 22
      }
    ]
  },
  "BRANDED_CONSUMER_FMCG": {
    "profileCode": "BRANDED_CONSUMER_FMCG",
    "benchmarkAuthority": [
      "NIFTY_FMCG"
    ],
    "signalRequirements": [
      {
        "signalCode": "GROSS_AND_OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "REVENUE_AND_VOLUME_PRICE_MIX_GROWTH",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION_AND_WORKING_CAPITAL",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BRAND_DISTRIBUTION_CATEGORY_DURABILITY",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "CATEGORY_AND_MARKET_RISK",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "CONSUMER_FMCG_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "BUSINESS_SERVICES": {
    "profileCode": "BUSINESS_SERVICES",
    "benchmarkAuthority": [
      "NIFTY_SERVICES_SECTOR",
      "BUSINESS_SERVICES_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "BUSINESS_SERVICES_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "OPERATING_MARGIN_REVENUE_QUALITY",
          "CLIENT_RETENTION"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_CLIENT_HEADCOUNT_OR_VOLUME_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_CONVERSION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_CASH_OR_LEVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "CLIENT_DIVERSIFICATION",
          "CONTRACT_RENEWAL",
          "SERVICE_DEPTH"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "PE",
          "EV_EBITDA",
          "FCF_YIELD",
          "ROIC_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "CLIENT_CONCENTRATION_LABOUR_REGULATION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "BUSINESS_SERVICES_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "CAPITAL_EQUIPMENT_ELECTRICAL": {
    "profileCode": "CAPITAL_EQUIPMENT_ELECTRICAL",
    "benchmarkAuthority": [
      "NIFTY_CAPITAL_GOODS",
      "INDIA_MANUFACTURING_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "REVENUE_AND_ORDER_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_FCF_AND_WORKING_CAPITAL",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_AND_INTEREST_COVERAGE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "CAPITAL_MARKETS_AMC": {
    "profileCode": "CAPITAL_MARKETS_AMC",
    "benchmarkAuthority": [
      "NIFTY_FINANCIAL_SERVICES_EX_BANK",
      "NIFTY_CAPITAL_MARKETS"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "AUM_CLIENT_ASSET_AND_EARNINGS_GROWTH",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROE_OR_ROIC",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "CAPITAL_MARKETS_DURABILITY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "CEMENT_BUILDING_MATERIALS": {
    "profileCode": "CEMENT_BUILDING_MATERIALS",
    "benchmarkAuthority": [
      "NIFTY_INFRASTRUCTURE",
      "CEMENT_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "EBITDA_PER_TONNE_OR_MARGIN",
          "COST_POSITION"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "VOLUME_CAPACITY_UTILISATION_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_CONVERSION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_INTEREST_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "LIMESTONE_RESERVES_COST_POSITION_DISTRIBUTION",
          "REGIONAL_DIVERSIFICATION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA_PER_TONNE",
          "EV_EBITDA_NORMALIZED",
          "FCF_YIELD",
          "ROCE_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "ENERGY_FREIGHT_CYCLE_CARBON",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CEMENT_BUILDING_MATERIALS_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "COMMODITY_PROCESS_CHEMICALS": {
    "profileCode": "COMMODITY_PROCESS_CHEMICALS",
    "benchmarkAuthority": [
      "NIFTY_CHEMICALS"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "VOLUME_PRICE_MIX_GROWTH",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "CONSUMER_DURABLES": {
    "profileCode": "CONSUMER_DURABLES",
    "benchmarkAuthority": [
      "NIFTY_CONSUMER_DURABLES"
    ],
    "signalRequirements": [
      {
        "signalCode": "CONSUMER_DURABLES_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "GROSS_OPERATING_MARGIN_HISTORY",
          "PRODUCT_MIX"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_VOLUME_CATEGORY_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_WORKING_CAPITAL"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_CASH_OR_LEVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "BRAND_DISTRIBUTION_AFTERSALES",
          "CATEGORY_POSITION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "PE_SELF_AND_PEER",
          "EV_EBITDA",
          "FCF_YIELD",
          "ROCE_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "INPUT_COST_DEMAND_COMPETITION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "CONSUMER_DURABLES_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "DEFENCE_AEROSPACE": {
    "profileCode": "DEFENCE_AEROSPACE",
    "benchmarkAuthority": [
      "NIFTY_INDIA_DEFENCE",
      "NIFTY_CAPITAL_GOODS"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "ORDER_BOOK_AND_EXECUTION_GROWTH",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_AND_INTEREST_COVERAGE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "DIVERSIFIED_CHEMICALS_PETROCHEM": {
    "profileCode": "DIVERSIFIED_CHEMICALS_PETROCHEM",
    "benchmarkAuthority": [
      "NIFTY_CHEMICALS"
    ],
    "signalRequirements": [
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "OPERATING_MARGIN_HISTORY",
          "PRODUCT_MIX_MARGIN_QUALITY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_VOLUME_PRICE_MIX_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_CONVERSION_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_INTEREST_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "PRODUCT_DIVERSIFICATION",
          "INTEGRATION",
          "CAPACITY_DISCIPLINE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA_NORMALIZED",
          "PE_WITH_CYCLE_CONTEXT",
          "FCF_YIELD_NORMALIZED",
          "ROCE_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "FEEDSTOCK_GLOBAL_PRICING",
          "ENVIRONMENTAL_COMPLIANCE",
          "CYCLE_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "DIVERSIFIED_CHEMICALS_PETROCHEM_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "ENVIRONMENTAL_SERVICES": {
    "profileCode": "ENVIRONMENTAL_SERVICES",
    "benchmarkAuthority": [
      "NIFTY_INFRASTRUCTURE",
      "ENVIRONMENTAL_SERVICES_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "OPERATING_MARGIN_CONTRACT_QUALITY",
          "COLLECTION_OR_TREATMENT_EFFICIENCY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_ORDER_BOOK_CAPACITY_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_PROJECT_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_RECEIVABLES"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_INTEREST_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "CONCESSION_CONTRACT_DURATION",
          "TECHNOLOGY_PERMITS_MUNICIPAL_INDUSTRIAL_DIVERSIFICATION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA",
          "PE",
          "FCF_YIELD",
          "ROCE_PROJECT_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "COUNTERPARTY_RECEIVABLE_REGULATORY_PROJECT",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "ENVIRONMENTAL_SERVICES_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "FINANCIAL_HOLDING_COMPANY": {
    "profileCode": "FINANCIAL_HOLDING_COMPANY",
    "benchmarkAuthority": [
      "NIFTY_FINANCIAL_SERVICES",
      "HOLDING_COMPANY_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "SUBSIDIARY_EARNINGS_QUALITY",
          "CAPITAL_ALLOCATION"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "LOOK_THROUGH_EARNINGS_AUM_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "LOOK_THROUGH_ROE_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "HOLDCO_CASH_DIVIDEND_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "HOLDCO_NET_DEBT_AND_LIQUIDITY"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "FRANCHISE_DIVERSIFICATION",
          "CAPITAL_ACCESS",
          "SUBSIDIARY_QUALITY"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "SOTP_NAV_DISCOUNT",
          "PB_ROE_CONTEXT",
          "LOOK_THROUGH_EARNINGS_YIELD"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "HOLDCO_DISCOUNT_LEVERAGE_COMPLEXITY",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "FINANCIAL_HOLDING_COMPANY_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "FINTECH_PLATFORM": {
    "profileCode": "FINTECH_PLATFORM",
    "benchmarkAuthority": [
      "NIFTY_FINANCIAL_SERVICES_EX_BANK",
      "SIZE_MATCHED_DIGITAL_FINANCIAL_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "CONTRIBUTION_MARGIN_OR_UNIT_ECONOMICS",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "REVENUE_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "CAPITAL_EFFICIENCY_OR_BURN_EFFICIENCY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_FCF_OR_CASH_BURN",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_FUNDING_RUNWAY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "FINTECH_PLATFORM_DURABILITY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "GENERATION_INTEGRATED_UTILITY": {
    "profileCode": "GENERATION_INTEGRATED_UTILITY",
    "benchmarkAuthority": [
      "NIFTY_POWER",
      "NIFTY_ENERGY_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_QUALITY_AND_AVAILABILITY",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "CAPACITY_GENERATION_AND_ASSET_MIX_GROWTH",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC_WITH_ASSET_CONTEXT",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_AND_PROJECT_CASH_CONVERSION",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_INTEREST_COVERAGE_AND_REFINANCING",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "POWER_ASSET_DURABILITY",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION_ASSET_AND_CASH_FLOW_CONTEXT",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "TARIFF_OFFTAKER_GRID_AND_RESOURCE_RISK",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "HOSPITAL": {
    "profileCode": "HOSPITAL",
    "benchmarkAuthority": [
      "NIFTY_HOSPITALS",
      "NIFTY_HEALTHCARE_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "REVENUE_AND_EBITDA_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "HOSPITAL_OPERATING_DURABILITY",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "HOSPITALITY_LEISURE": {
    "profileCode": "HOSPITALITY_LEISURE",
    "benchmarkAuthority": [
      "NIFTY_CONSUMER_SERVICES",
      "LEISURE_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "HOSPITALITY_LEISURE_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "UNIT_LEVEL_MARGIN_OR_OPERATING_MARGIN",
          "SAME_STORE_REVPAR_OR_TRANSACTION_QUALITY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_UNIT_NETWORK_BOOKING_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_WITH_ASSET_LIGHT_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_CONVERSION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_FIXED_CHARGE_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "BRAND_NETWORK_CUSTOMER_REPEAT",
          "ASSET_OR_FRANCHISE_DIVERSIFICATION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA",
          "PE_WHEN_EARNINGS_POSITIVE",
          "FCF_YIELD",
          "UNIT_ECONOMICS_OR_ASSET_ROCE_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "DISCRETIONARY_DEMAND",
          "OCCUPANCY_TRAFFIC_VOLATILITY",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "HOSPITALITY_LEISURE_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "INDUSTRIAL_PRODUCTS": {
    "profileCode": "INDUSTRIAL_PRODUCTS",
    "benchmarkAuthority": [
      "NIFTY_CAPITAL_GOODS",
      "INDUSTRIAL_PRODUCTS_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "OPERATING_MARGIN_HISTORY",
          "PRODUCT_MIX_QUALITY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_VOLUME_ORDER_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_WORKING_CAPITAL"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_INTEREST_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "DISTRIBUTION_CUSTOMER_PRODUCT_MOAT",
          "CAPACITY_DISCIPLINE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "PE",
          "EV_EBITDA",
          "FCF_YIELD",
          "ROCE_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "INPUT_COST_DEMAND_CAPEX",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "INDUSTRIAL_PRODUCTS_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "INSURANCE": {
    "profileCode": "INSURANCE",
    "benchmarkAuthority": [
      "NIFTY_FINANCIAL_SERVICES_EX_BANK",
      "NIFTY_INSURANCE"
    ],
    "signalRequirements": [
      {
        "signalCode": "UNDERWRITING_OR_RESERVING_QUALITY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "PREMIUM_OR_AUM_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "SOLVENCY_OR_CAPITAL_ADEQUACY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "INSURANCE_CASH_OR_EARNINGS_QUALITY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "SOLVENCY_BALANCE_SHEET_BUFFER",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "INSURANCE_DURABILITY",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "INTEGRATED_REFINING_PETCHEM": {
    "profileCode": "INTEGRATED_REFINING_PETCHEM",
    "benchmarkAuthority": [
      "NIFTY_OIL_GAS"
    ],
    "signalRequirements": [
      {
        "signalCode": "CYCLE_NORMALIZED_EARNINGS_QUALITY",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "THROUGHPUT_SEGMENT_AND_MARGIN_GROWTH",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_AND_INTEREST_COVERAGE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "OIL_GAS_BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "COMMODITY_POLICY_TRANSITION_RISK",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "IT_BPM_SERVICES": {
    "profileCode": "IT_BPM_SERVICES",
    "benchmarkAuthority": [
      "NIFTY_IT",
      "IT_BPM_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "IT_BPM_SERVICES_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "OPERATING_MARGIN_HISTORY",
          "REVENUE_PER_EMPLOYEE_OR_DELIVERY_EFFICIENCY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_CLIENT_GROWTH_MULTI_PERIOD"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "FCF_CONVERSION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_CASH_OR_LEVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "CLIENT_RETENTION",
          "DOMAIN_DEPTH",
          "DELIVERY_SCALE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "PE",
          "EV_EBITDA",
          "FCF_YIELD",
          "ROCE_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "CLIENT_CONCENTRATION_WAGE_FX_AUTOMATION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "IT_BPM_SERVICES_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "IT_DIGITAL_INFRA_HARDWARE": {
    "profileCode": "IT_DIGITAL_INFRA_HARDWARE",
    "benchmarkAuthority": [
      "NIFTY_IT",
      "MIDSMALL_IT_TELECOM_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "REVENUE_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "WORKING_CAPITAL_AND_CASH_CONVERSION",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "IT_SERVICES": {
    "profileCode": "IT_SERVICES",
    "benchmarkAuthority": [
      "NIFTY_IT"
    ],
    "signalRequirements": [
      {
        "signalCode": "REVENUE_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "IT_SOFTWARE_PRODUCTS_PLATFORMS": {
    "profileCode": "IT_SOFTWARE_PRODUCTS_PLATFORMS",
    "benchmarkAuthority": [
      "NIFTY_IT",
      "SIZE_MATCHED_TECH_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "REVENUE_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "FCF_OR_CASH_BURN",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "IT_TECH_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "JEWELLERY": {
    "profileCode": "JEWELLERY",
    "benchmarkAuthority": [
      "NIFTY_CONSUMER_DURABLES",
      "JEWELLERY_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "JEWELLERY_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "GROSS_OPERATING_MARGIN_HISTORY",
          "STUDDED_MIX_OR_MAKING_CHARGE_QUALITY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_SAME_STORE_NETWORK_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_INVENTORY_WORKING_CAPITAL"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_INVENTORY_FUNDING"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "BRAND_TRUST_NETWORK_DISTRIBUTION",
          "FRANCHISE_STORE_ECONOMICS"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "PE",
          "EV_EBITDA",
          "FCF_YIELD",
          "ROCE_WORKING_CAPITAL_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "GOLD_PRICE_INVENTORY_REGULATION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "JEWELLERY_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "LOGISTICS": {
    "profileCode": "LOGISTICS",
    "benchmarkAuthority": [
      "NIFTY_TRANSPORTATION_LOGISTICS",
      "LOGISTICS_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "LOGISTICS_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "CONTRIBUTION_OPERATING_MARGIN_NETWORK_EFFICIENCY",
          "SERVICE_QUALITY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "SHIPMENT_REVENUE_CLIENT_NETWORK_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_ASSET_LIGHT_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_CONVERSION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_CASH_OR_LEVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "NETWORK_DENSITY_CLIENT_DIVERSIFICATION_TECH",
          "SCALE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA",
          "PE_WHEN_POSITIVE",
          "FCF_YIELD",
          "ROIC_NETWORK_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "FUEL_COMPETITION_CLIENT_CONCENTRATION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "LOGISTICS_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "MIDSTREAM_CITY_GAS": {
    "profileCode": "MIDSTREAM_CITY_GAS",
    "benchmarkAuthority": [
      "NIFTY_OIL_GAS"
    ],
    "signalRequirements": [
      {
        "signalCode": "CYCLE_NORMALIZED_EARNINGS_QUALITY",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "VOLUME_THROUGHPUT_AND_NETWORK_GROWTH",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_AND_INTEREST_COVERAGE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "OIL_GAS_BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "COMMODITY_POLICY_TRANSITION_RISK",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "NBFC_LENDING": {
    "profileCode": "NBFC_LENDING",
    "benchmarkAuthority": [
      "NIFTY_FINANCIAL_SERVICES",
      "NIFTY_FINANCIAL_SERVICES_EX_BANK"
    ],
    "signalRequirements": [
      {
        "signalCode": "NBFC_LENDING_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "NIM_OR_SPREAD_HISTORY",
          "GNPA_NNPA_CREDIT_COST"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "NBFC_LENDING_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "AUM_ADVANCES_DISBURSEMENT_GROWTH",
          "BORROWER_OR_SEGMENT_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "NBFC_LENDING_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROA_ROE_CAPITAL_ADEQUACY"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "NBFC_LENDING_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "CAPITAL_ADEQUACY",
          "LIQUIDITY_ALM",
          "LEVERAGE",
          "EXTERNAL_RATING"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "NBFC_LENDING_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "FUNDING_DIVERSIFICATION",
          "FRANCHISE_OR_DISTRIBUTION",
          "UNDERWRITING_CYCLE_HISTORY"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "NBFC_LENDING_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "PB_RELATIVE_TO_ROE",
          "PE_RELATIVE_TO_PEERS_AND_SELF_HISTORY",
          "EV_AUM_OR_PRICE_AUM_WHEN_APPLICABLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "NBFC_LENDING_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "NBFC_LENDING_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "ASSET_QUALITY",
          "ALM_MISMATCH",
          "RATING_TREND",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "NBFC_LENDING_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "NON_FERROUS_DIVERSIFIED_METALS": {
    "profileCode": "NON_FERROUS_DIVERSIFIED_METALS",
    "benchmarkAuthority": [
      "NIFTY_METAL"
    ],
    "signalRequirements": [
      {
        "signalCode": "THROUGH_CYCLE_MARGIN_QUALITY",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "PRODUCTION_VOLUME_REALIZATION_GROWTH",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_AND_INTEREST_COVERAGE_MID_CYCLE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "METALS_BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "COMMODITY_CYCLE_DRAWDOWN_RISK",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "OIL_OPERATIONS": {
    "profileCode": "OIL_OPERATIONS",
    "benchmarkAuthority": [
      "NIFTY_OIL_GAS"
    ],
    "signalRequirements": [
      {
        "signalCode": "OIL_OPERATIONS_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "CYCLE_NORMALIZED_EARNINGS_QUALITY",
          "ASSET_SERVICE_MARGIN_QUALITY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "PRODUCTION_ORDER_REVENUE_GROWTH_BY_BUSINESS_MODEL"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_AND_INTEREST_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "RESERVES_CONTRACT_VISIBILITY_ASSET_OR_SERVICE_DEPTH"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA_NORMALIZED",
          "FCF_YIELD_NORMALIZED",
          "PB_ROCE_CONTEXT",
          "SOTP_WHEN_DIVERSIFIED"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "COMMODITY_POLICY_COUNTERPARTY_TRANSITION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "OIL_OPERATIONS_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "PHARMA": {
    "profileCode": "PHARMA",
    "benchmarkAuthority": [
      "PHARMA_V1_SUBPROFILE_AUTHORITY"
    ],
    "signalRequirements": []
  },
  "PROJECT_EPC": {
    "profileCode": "PROJECT_EPC",
    "benchmarkAuthority": [
      "NIFTY_CAPITAL_GOODS"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "ORDER_BOOK_AND_REVENUE_GROWTH",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "WORKING_CAPITAL_AND_CASH_CONVERSION",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_AND_INTEREST_COVERAGE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "REAL_ESTATE_DEVELOPER": {
    "profileCode": "REAL_ESTATE_DEVELOPER",
    "benchmarkAuthority": [
      "NIFTY_REALTY"
    ],
    "signalRequirements": [
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "PRE_SALES_COLLECTION_EXECUTION_QUALITY",
          "RENTAL_OCCUPANCY_WHEN_APPLICABLE"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "PRE_SALES_COLLECTIONS_AREA_RENTAL_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_PROJECT_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "OPERATING_CASH_FLOW_COLLECTIONS_LAND_CAPEX"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_TO_EQUITY_INTEREST_COVERAGE_LIQUIDITY"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "LAND_BANK_LOCATION_BRAND_EXECUTION",
          "RENTAL_ANNUITY_WHEN_APPLICABLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "NAV_DISCOUNT_PREMIUM",
          "EV_EBITDA_FOR_RENTAL",
          "FCF_YIELD_NORMALIZED",
          "PB_ROE_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "LEVERAGE_APPROVAL_EXECUTION_CYCLE",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "REAL_ESTATE_DEVELOPER_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "REGULATED_NETWORK": {
    "profileCode": "REGULATED_NETWORK",
    "benchmarkAuthority": [
      "NIFTY_POWER",
      "NIFTY_INFRASTRUCTURE_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_QUALITY_AND_AVAILABILITY",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "REGULATED_ASSET_NETWORK_AND_COMMISSIONING_GROWTH",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC_WITH_ASSET_CONTEXT",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_AND_PROJECT_CASH_CONVERSION",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_INTEREST_COVERAGE_AND_REFINANCING",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "POWER_ASSET_DURABILITY",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION_ASSET_AND_CASH_FLOW_CONTEXT",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "TARIFF_OFFTAKER_GRID_AND_RESOURCE_RISK",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "RENEWABLE_IPP": {
    "profileCode": "RENEWABLE_IPP",
    "benchmarkAuthority": [
      "NIFTY_POWER",
      "NIFTY_ENERGY_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_QUALITY_AND_AVAILABILITY",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "OPERATING_AND_PIPELINE_CAPACITY_GROWTH",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC_WITH_ASSET_CONTEXT",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_AND_PROJECT_CASH_CONVERSION",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_INTEREST_COVERAGE_AND_REFINANCING",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "POWER_ASSET_DURABILITY",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION_ASSET_AND_CASH_FLOW_CONTEXT",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "TARIFF_OFFTAKER_GRID_AND_RESOURCE_RISK",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "POWER_RENEWABLES_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "RETAIL_COMMERCE": {
    "profileCode": "RETAIL_COMMERCE",
    "benchmarkAuthority": [
      "NIFTY_CONSUMER_SERVICES",
      "RETAIL_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "RETAIL_COMMERCE_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "GROSS_CONTRIBUTION_OPERATING_MARGIN_HISTORY",
          "UNIT_ECONOMICS"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_GMV_SSSG_NETWORK_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROIC_STORE_PLATFORM_CAPITAL_EFFICIENCY"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_WORKING_CAPITAL_OR_BURN"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_CASH_LEVERAGE_FUNDING_RUNWAY"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "CUSTOMER_RETENTION",
          "BRAND_NETWORK_DENSITY",
          "OMNICHANNEL_OR_PLATFORM_MOAT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA_OR_EV_SALES_BY_MATURITY",
          "PE_WHEN_POSITIVE",
          "FCF_YIELD",
          "ROIC_STORE_OR_PLATFORM_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "INVENTORY_COMPETITION_UNIT_ECONOMICS",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "RETAIL_COMMERCE_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "SHIPPING": {
    "profileCode": "SHIPPING",
    "benchmarkAuthority": [
      "NIFTY_TRANSPORTATION_LOGISTICS",
      "GLOBAL_SHIPPING_CYCLE_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "SHIPPING_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "TCE_RATE_COST_UTILISATION_THROUGH_CYCLE",
          "FLEET_EFFICIENCY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "FLEET_CAPACITY_TCE_REVENUE_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_ASSET_COVERAGE_INTEREST_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "FLEET_AGE_MIX_CHARTER_COVERAGE_COUNTERPARTY"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "NAV_DISCOUNT_PREMIUM",
          "EV_EBITDA_NORMALIZED",
          "FCF_YIELD_NORMALIZED",
          "PB_CYCLE_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "FREIGHT_CYCLE_FUEL_GEO_POLITICAL",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SHIPPING_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "SOLID_FUELS_MINING": {
    "profileCode": "SOLID_FUELS_MINING",
    "benchmarkAuthority": [
      "NIFTY_METAL",
      "NIFTY_ENERGY_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "SOLID_FUELS_MINING_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "THROUGH_CYCLE_MARGIN_COST_QUALITY",
          "REALIZATION_COST_POSITION"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "PRODUCTION_OFFTAKE_REALIZATION_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_CASH_OR_LEVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "RESERVES_COST_POSITION_OFFTAKE",
          "SCALE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA_NORMALIZED",
          "FCF_YIELD_NORMALIZED",
          "PB_ROCE_CONTEXT",
          "DIVIDEND_YIELD_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "COMMODITY_POLICY_ENERGY_TRANSITION_MINING",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "SOLID_FUELS_MINING_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "SPECIALTY_CHEMICALS": {
    "profileCode": "SPECIALTY_CHEMICALS",
    "benchmarkAuthority": [
      "NIFTY_CHEMICALS"
    ],
    "signalRequirements": [
      {
        "signalCode": "OPERATING_MARGIN_HISTORY",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "REVENUE_GROWTH_MULTI_PERIOD",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_CASH_OR_LEVERAGE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "DRAWDOWN_VOLATILITY_RISK",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "CHEMICALS_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "STEEL_FERROUS": {
    "profileCode": "STEEL_FERROUS",
    "benchmarkAuthority": [
      "NIFTY_METAL"
    ],
    "signalRequirements": [
      {
        "signalCode": "THROUGH_CYCLE_MARGIN_QUALITY",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "VOLUME_REALIZATION_AND_SPREAD_GROWTH",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_AND_INTEREST_COVERAGE_MID_CYCLE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "METALS_BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "COMMODITY_CYCLE_DRAWDOWN_RISK",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "METALS_COMMODITIES_K4B_SCORING_V1",
        "order": 10
      }
    ]
  },
  "TELECOM_INFRA": {
    "profileCode": "TELECOM_INFRA",
    "benchmarkAuthority": [
      "NIFTY_TELECOM",
      "INFRASTRUCTURE_CONTEXT"
    ],
    "signalRequirements": [
      {
        "signalCode": "TELECOM_INFRA_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "TENANCY_MARGIN_COLLECTION_QUALITY",
          "UPTIME"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "TOWER_TENANCY_DATA_CAPEX_REVENUE_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_CAPEX_CONVERSION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_INTEREST_COVERAGE_RECEIVABLES"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "TENANCY_CONTRACT_NETWORK_SCALE",
          "CUSTOMER_DIVERSIFICATION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA",
          "FCF_YIELD",
          "DIVIDEND_YIELD",
          "ROCE_TENANCY_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "CUSTOMER_CONCENTRATION_RECEIVABLE_REGULATION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_INFRA_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "TELECOM_OPERATOR": {
    "profileCode": "TELECOM_OPERATOR",
    "benchmarkAuthority": [
      "NIFTY_TELECOM"
    ],
    "signalRequirements": [
      {
        "signalCode": "TELECOM_OPERATOR_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "ARPU_MARGIN_NETWORK_QUALITY",
          "CHURN_OR_CUSTOMER_QUALITY"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "SUBSCRIBER_DATA_ARPU_REVENUE_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC_SPECTRUM_NETWORK"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_CAPEX_CONVERSION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_SPECTRUM_LIABILITY_INTEREST_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "SPECTRUM_NETWORK_SCALE_BRAND_DISTRIBUTION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA",
          "EV_SUBSCRIBER_OR_ARPU_CONTEXT",
          "FCF_YIELD",
          "ROCE_SPECTRUM_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "REGULATION_COMPETITION_CAPEX_TECH_TRANSITION",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TELECOM_OPERATOR_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "TEXTILES_APPAREL": {
    "profileCode": "TEXTILES_APPAREL",
    "benchmarkAuthority": [
      "NIFTY_500",
      "TEXTILES_PEER_COHORT"
    ],
    "signalRequirements": [
      {
        "signalCode": "TEXTILES_APPAREL_QUALITY_COMPOSITE",
        "dimensionCode": "QUALITY",
        "evidenceCodes": [
          "OPERATING_MARGIN_HISTORY",
          "REALIZATION_PRODUCT_MIX"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_GROWTH_COMPOSITE",
        "dimensionCode": "GROWTH",
        "evidenceCodes": [
          "REVENUE_VOLUME_EXPORT_GROWTH"
        ],
        "minimumPeriods": 8,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_CAPITAL_EFFICIENCY_COMPOSITE",
        "dimensionCode": "CAPITAL_EFFICIENCY",
        "evidenceCodes": [
          "ROCE_OR_ROIC"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_CASH_FLOW_COMPOSITE",
        "dimensionCode": "CASH_FLOW",
        "evidenceCodes": [
          "CFO_FCF_WORKING_CAPITAL"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_BALANCE_SHEET_CREDIT_COMPOSITE",
        "dimensionCode": "BALANCE_SHEET_CREDIT",
        "evidenceCodes": [
          "NET_DEBT_INTEREST_COVERAGE"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_SELF_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_BUSINESS_DURABILITY_COMPOSITE",
        "dimensionCode": "BUSINESS_DURABILITY",
        "evidenceCodes": [
          "CUSTOMER_DIVERSIFICATION",
          "BRAND_OR_HOME_TEXTILE_POSITION",
          "CAPACITY_UTILISATION"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "PEER_PERCENTILE_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_VALUATION_COMPOSITE",
        "dimensionCode": "VALUATION",
        "evidenceCodes": [
          "EV_EBITDA_NORMALIZED",
          "PE_WITH_CYCLE_CONTEXT",
          "FCF_YIELD",
          "PB_ROCE_CONTEXT"
        ],
        "minimumPeriods": 3,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "VALUATION_RELATIVE_V1",
        "direction": "LOWER_MULTIPLE_OR_HIGHER_YIELD_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_MOMENTUM_COMPOSITE",
        "dimensionCode": "MOMENTUM",
        "evidenceCodes": [
          "PRICE_HISTORY_252D",
          "APPROVED_BENCHMARK_HISTORY_252D"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "RELATIVE_MOMENTUM_V1",
        "direction": "HIGHER_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_RISK_COMPOSITE",
        "dimensionCode": "RISK",
        "evidenceCodes": [
          "COTTON_INPUT_FX_DEMAND_CYCLE",
          "MARKET_DRAWDOWN"
        ],
        "minimumPeriods": 252,
        "freshnessPolicy": "MARKET_5_TRADING_DAYS",
        "normalizationCurve": "LOWER_RISK_V1",
        "direction": "LOWER_RISK_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      },
      {
        "signalCode": "TEXTILES_APPAREL_OWNERSHIP_GOVERNANCE_COMPOSITE",
        "dimensionCode": "OWNERSHIP_GOVERNANCE",
        "evidenceCodes": [
          "OWNERSHIP_TREND_4Q",
          "GOVERNANCE_EVENT_REVIEW"
        ],
        "minimumPeriods": 4,
        "freshnessPolicy": "FUNDAMENTAL_150_DAYS_ANNUAL_550_DAYS",
        "normalizationCurve": "GOVERNANCE_ORDINAL_V1",
        "direction": "CLEAR_GOVERNANCE_IS_BETTER",
        "aggregation": "ARITHMETIC_MEAN_OF_REQUIRED_COMPONENT_SCORES_NO_RENORMALIZATION",
        "required": true
      }
    ]
  },
  "UPSTREAM_E_AND_P": {
    "profileCode": "UPSTREAM_E_AND_P",
    "benchmarkAuthority": [
      "NIFTY_OIL_GAS"
    ],
    "signalRequirements": [
      {
        "signalCode": "CYCLE_NORMALIZED_EARNINGS_QUALITY",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 1
      },
      {
        "signalCode": "PRODUCTION_RESERVE_AND_REALIZATION_GROWTH",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 2
      },
      {
        "signalCode": "ROCE_OR_ROIC_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 3
      },
      {
        "signalCode": "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 4
      },
      {
        "signalCode": "NET_DEBT_AND_INTEREST_COVERAGE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 5
      },
      {
        "signalCode": "OIL_GAS_BUSINESS_DURABILITY",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 6
      },
      {
        "signalCode": "VALUATION_THROUGH_CYCLE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 7
      },
      {
        "signalCode": "MOMENTUM_12M_RELATIVE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 8
      },
      {
        "signalCode": "COMMODITY_POLICY_TRANSITION_RISK",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 9
      },
      {
        "signalCode": "OWNERSHIP_GOVERNANCE",
        "required": true,
        "sourceAuthority": "OIL_GAS_V1_K4B_SCORING_V1",
        "order": 10
      }
    ]
  }
} as const
export function p7IcProfileContract(profileCode:string):Ic1ProfileEvidenceContract{const row=(P7_IC_PROFILE_CONTRACTS as Readonly<Record<string,Ic1ProfileEvidenceContract>>)[profileCode];if(!row)throw new Error("P7_IC_PROFILE_CONTRACT_NOT_FOUND");return row}
