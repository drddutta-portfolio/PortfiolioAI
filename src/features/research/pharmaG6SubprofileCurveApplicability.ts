import type { PharmaSubprofileCode } from "./pharmaSubprofileAssignment"
import { PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION } from "./pharmaSegmentGrowthCurveProposal"
import { PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION } from "./pharmaOperatingMarginCurveProposal"

export const PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION =
  "PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_V1_PROPOSAL" as const

export type PharmaG6CurveFamily =
  | "SEGMENT_GROWTH"
  | "OPERATING_MARGIN"
  | "ROCE_CAPITAL_EFFICIENCY"
  | "CASH_CONVERSION"
  | "BALANCE_SHEET_LEVERAGE"
  | "VALUATION"
  | "OWNERSHIP_GOVERNANCE"
  | "REGULATORY_MARKET_RISK"
  | "MOMENTUM"

export type PharmaG6CurveState =
  | "VALIDATED_NOT_ACTIVE"
  | "SUBPROFILE_THRESHOLDS_REQUIRED"
  | "UNSUPPORTED_FAIL_CLOSED"

export interface PharmaG6CurveApplicabilityEntry {
  readonly family: PharmaG6CurveFamily
  readonly state: PharmaG6CurveState
  readonly curveVersion: string | null
  readonly metricCodes: readonly string[]
  readonly note: string
}

export interface PharmaG6SubprofileCurveContract {
  readonly subprofileCode: PharmaSubprofileCode
  readonly entries: readonly PharmaG6CurveApplicabilityEntry[]
}

const pendingParentFamilies: readonly PharmaG6CurveApplicabilityEntry[] = [
  {
    family: "ROCE_CAPITAL_EFFICIENCY",
    state: "SUBPROFILE_THRESHOLDS_REQUIRED",
    curveVersion: null,
    metricCodes: ["PHARMA_ROCE_HISTORY"],
    note: "G5.1 validates only the common framework; this primary still requires its own approved numeric thresholds.",
  },
  {
    family: "CASH_CONVERSION",
    state: "SUBPROFILE_THRESHOLDS_REQUIRED",
    curveVersion: null,
    metricCodes: ["PHARMA_CASH_CONVERSION_HISTORY"],
    note: "G5.2 validates only the common framework; this primary still requires its own approved numeric thresholds.",
  },
  {
    family: "BALANCE_SHEET_LEVERAGE",
    state: "SUBPROFILE_THRESHOLDS_REQUIRED",
    curveVersion: null,
    metricCodes: ["PHARMA_BALANCE_SHEET_LEVERAGE"],
    note: "G5.3 validates only the common framework; this primary still requires its own approved numeric thresholds.",
  },
  {
    family: "VALUATION",
    state: "SUBPROFILE_THRESHOLDS_REQUIRED",
    curveVersion: null,
    metricCodes: ["PHARMA_VALUATION_CONTEXT"],
    note: "G5.4 validates only the common framework; business-model-specific valuation context remains required.",
  },
  {
    family: "OWNERSHIP_GOVERNANCE",
    state: "SUBPROFILE_THRESHOLDS_REQUIRED",
    curveVersion: null,
    metricCodes: ["PHARMA_OWNERSHIP_GOVERNANCE"],
    note: "G5.5 validates only the common framework; no mechanical ownership thresholds are approved.",
  },
  {
    family: "REGULATORY_MARKET_RISK",
    state: "SUBPROFILE_THRESHOLDS_REQUIRED",
    curveVersion: null,
    metricCodes: ["PHARMA_REGULATORY_SITE_STATUS", "MAX_DRAWDOWN_1Y", "VOLATILITY_1Y"],
    note: "G5.6 validates evidence lanes only; Pharma risk bands remain unapproved.",
  },
  {
    family: "MOMENTUM",
    state: "SUBPROFILE_THRESHOLDS_REQUIRED",
    curveVersion: null,
    metricCodes: ["PRICE_MOMENTUM_12M", "PRICE_MOMENTUM_6M", "RELATIVE_STRENGTH_12M"],
    note: "G5.7 validates evidence lanes only; a dedicated Pharma parent Momentum contract, benchmark and numeric bands remain required.",
  },
]

const domestic: PharmaG6SubprofileCurveContract = {
  subprofileCode: "DOMESTIC_FORMULATIONS",
  entries: [
    {
      family: "SEGMENT_GROWTH",
      state: "VALIDATED_NOT_ACTIVE",
      curveVersion: PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
      metricCodes: ["PHARMA_DOMESTIC_REVENUE_GROWTH"],
      note: "The validated Segment Growth proposal is applicable to Domestic Revenue Growth; activation remains disabled.",
    },
    {
      family: "OPERATING_MARGIN",
      state: "VALIDATED_NOT_ACTIVE",
      curveVersion: PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION,
      metricCodes: ["PHARMA_OPERATING_MARGIN_HISTORY"],
      note: "The validated Operating Margin proposal is explicitly scoped to Domestic Formulations only.",
    },
    ...pendingParentFamilies,
  ],
}

const globalGenerics: PharmaG6SubprofileCurveContract = {
  subprofileCode: "GLOBAL_GENERICS",
  entries: [
    {
      family: "SEGMENT_GROWTH",
      state: "VALIDATED_NOT_ACTIVE",
      curveVersion: PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
      metricCodes: ["PHARMA_EXPORT_US_REVENUE_GROWTH"],
      note: "The validated Segment Growth proposal explicitly covers Export / US Revenue Growth.",
    },
    {
      family: "OPERATING_MARGIN",
      state: "UNSUPPORTED_FAIL_CLOSED",
      curveVersion: null,
      metricCodes: ["PHARMA_OPERATING_MARGIN_HISTORY"],
      note: "Domestic Formulations Operating Margin bands must not be reused for Global Generics.",
    },
    ...pendingParentFamilies,
  ],
}

const apiBulk: PharmaG6SubprofileCurveContract = {
  subprofileCode: "API_BULK_DRUGS",
  entries: [
    {
      family: "SEGMENT_GROWTH",
      state: "UNSUPPORTED_FAIL_CLOSED",
      curveVersion: null,
      metricCodes: [],
      note: "No API/Bulk Drugs segment-growth numeric curve is approved.",
    },
    {
      family: "OPERATING_MARGIN",
      state: "UNSUPPORTED_FAIL_CLOSED",
      curveVersion: null,
      metricCodes: ["PHARMA_OPERATING_MARGIN_HISTORY"],
      note: "Domestic Formulations Operating Margin bands must not be reused for API/Bulk Drugs.",
    },
    ...pendingParentFamilies,
  ],
}

const cdmo: PharmaG6SubprofileCurveContract = {
  subprofileCode: "CDMO_CRAMS",
  entries: [
    {
      family: "SEGMENT_GROWTH",
      state: "UNSUPPORTED_FAIL_CLOSED",
      curveVersion: null,
      metricCodes: [],
      note: "No CDMO/CRAMS segment-growth numeric curve is approved.",
    },
    {
      family: "OPERATING_MARGIN",
      state: "UNSUPPORTED_FAIL_CLOSED",
      curveVersion: null,
      metricCodes: ["PHARMA_OPERATING_MARGIN_HISTORY"],
      note: "Domestic Formulations Operating Margin bands must not be reused for CDMO/CRAMS.",
    },
    ...pendingParentFamilies,
  ],
}

const biopharma: PharmaG6SubprofileCurveContract = {
  subprofileCode: "BIOPHARMA_BIOSIMILARS",
  entries: [
    {
      family: "SEGMENT_GROWTH",
      state: "UNSUPPORTED_FAIL_CLOSED",
      curveVersion: null,
      metricCodes: [],
      note: "No Biopharma/Biosimilars segment-growth numeric curve is approved.",
    },
    {
      family: "OPERATING_MARGIN",
      state: "UNSUPPORTED_FAIL_CLOSED",
      curveVersion: null,
      metricCodes: ["PHARMA_OPERATING_MARGIN_HISTORY"],
      note: "Domestic Formulations Operating Margin bands must not be reused for Biopharma/Biosimilars.",
    },
    ...pendingParentFamilies,
  ],
}

export const PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY = {
  DOMESTIC_FORMULATIONS: domestic,
  GLOBAL_GENERICS: globalGenerics,
  API_BULK_DRUGS: apiBulk,
  CDMO_CRAMS: cdmo,
  BIOPHARMA_BIOSIMILARS: biopharma,
} as const satisfies Readonly<Record<PharmaSubprofileCode, PharmaG6SubprofileCurveContract>>

export const PHARMA_G6_LAYERING_BOUNDARY = {
  primaryUsesSubprofileCurveContract: true,
  materialOverlayCreatesIndependentStockScore: false,
  emergingWatchCreatesIndependentStockScore: false,
  emergingWatchExcludedFromNumericScoring: true,
  domesticThresholdsMayAutoApplyToOtherPrimaries: false,
  scoreExecutionEnabled: false,
} as const

export function pharmaG6CurveContractForPrimary(subprofileCode: PharmaSubprofileCode) {
  return PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY[subprofileCode]
}
