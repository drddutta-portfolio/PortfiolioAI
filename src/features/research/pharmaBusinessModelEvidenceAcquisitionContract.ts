import { composePharmaSubprofileContract } from "./pharmaSubprofileContracts"
import type { PharmaResearchWorkspaceModel, PharmaWorkspaceRequirement } from "./pharmaResearchWorkspaceModel"
import { metricLabel } from "./researchPolicy"

export type PharmaEvidenceSourceLane =
  | "ISSUER_OFFICIAL"
  | "REGULATOR_OFFICIAL"
  | "EXCHANGE_FILING"
  | "LICENSED_MARKET_SOURCE"

export type PharmaEvidenceAccessGate =
  | "PUBLIC_OFFICIAL_FIRST"
  | "PUBLIC_OR_LICENSED"
  | "LICENSED_REQUIRED"

export type PharmaEvidenceAcquisitionMethod =
  | "DOCUMENT_EXTRACTION"
  | "EVENT_REVIEW"
  | "DERIVED_FROM_DISCLOSED_INPUTS"
  | "LICENSED_DATA_REVIEW"
  | "COMPOSITE_REVIEW"

export interface PharmaBusinessModelEvidenceAcquisitionStrategy {
  readonly metricCode: string
  readonly sourceLanes: readonly PharmaEvidenceSourceLane[]
  readonly accessGate: PharmaEvidenceAccessGate
  readonly acquisitionMethod: PharmaEvidenceAcquisitionMethod
  readonly evidenceShape: string
  readonly failClosedRule: string
}

export interface PharmaBusinessModelEvidenceAcquisitionItem {
  readonly scope: "PRIMARY_MODEL" | "MATERIAL_OVERLAY"
  readonly scopeLabel: string
  readonly metricCode: string
  readonly label: string
  readonly dimension: string
  readonly requirementLevel: PharmaWorkspaceRequirement["requirementLevel"]
  readonly minimumObservations: number
  readonly preferredObservations: number
  readonly historyUnit: string
  readonly periodTypes: readonly string[]
  readonly calculationOwner: string
  readonly sourceContract: string
  readonly freshnessPolicy: string
  readonly sourceLanes: readonly PharmaEvidenceSourceLane[]
  readonly accessGate: PharmaEvidenceAccessGate
  readonly acquisitionMethod: PharmaEvidenceAcquisitionMethod
  readonly evidenceShape: string
  readonly failClosedRule: string
  readonly state: "PLANNED"
}

export interface PharmaBusinessModelEvidenceAcquisitionPlan {
  readonly contractVersion: "PHARMA_BUSINESS_MODEL_EVIDENCE_ACQUISITION_V1"
  readonly items: readonly PharmaBusinessModelEvidenceAcquisitionItem[]
  readonly summary: {
    readonly total: number
    readonly mandatory: number
    readonly important: number
    readonly supplementary: number
    readonly publicOfficialFirst: number
    readonly publicOrLicensed: number
    readonly licensedRequired: number
    readonly derivedFromDisclosedInputs: number
  }
  readonly ingestionAuthorized: false
}

const STRATEGIES: Readonly<Record<string, PharmaBusinessModelEvidenceAcquisitionStrategy>> = {
  PHARMA_DOMESTIC_REVENUE_GROWTH: {
    metricCode: "PHARMA_DOMESTIC_REVENUE_GROWTH",
    sourceLanes: ["ISSUER_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "DERIVED_FROM_DISCLOSED_INPUTS",
    evidenceShape: "Comparable disclosed domestic-formulations revenue by reporting period, with growth derived only across compatible scopes.",
    failClosedRule: "Do not infer domestic revenue from total India revenue or management commentary when a compatible domestic-formulations series is not disclosed.",
  },
  PHARMA_FIELD_FORCE_PRODUCTIVITY: {
    metricCode: "PHARMA_FIELD_FORCE_PRODUCTIVITY",
    sourceLanes: ["ISSUER_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "DERIVED_FROM_DISCLOSED_INPUTS",
    evidenceShape: "Disclosed medical-representative headcount plus compatible domestic revenue for the same reporting scope and period.",
    failClosedRule: "Employee totals, sales-staff estimates, or inferred MR headcount are prohibited; missing compatible headcount keeps the metric unavailable.",
  },
  PHARMA_BRAND_THERAPY_LEADERSHIP: {
    metricCode: "PHARMA_BRAND_THERAPY_LEADERSHIP",
    sourceLanes: ["ISSUER_OFFICIAL", "LICENSED_MARKET_SOURCE"],
    accessGate: "LICENSED_REQUIRED",
    acquisitionMethod: "COMPOSITE_REVIEW",
    evidenceShape: "Issuer franchise/therapy evidence cross-checked against an approved licensed market source for material therapy share/rank.",
    failClosedRule: "Issuer self-description alone cannot establish therapy leadership; no licensed source may be called or substituted without separate approval.",
  },
  PHARMA_DOMESTIC_EXPOSURE_MATERIALITY_REVIEW: {
    metricCode: "PHARMA_DOMESTIC_EXPOSURE_MATERIALITY_REVIEW",
    sourceLanes: ["ISSUER_OFFICIAL", "REGULATOR_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "COMPOSITE_REVIEW",
    evidenceShape: "Reviewed issuer segment/site evidence plus regulator context, producing an explicit ACTIVE or INACTIVE materiality decision.",
    failClosedRule: "If export/site exposure or regulatory materiality is ambiguous, retain REVIEW_REQUIRED rather than inferring an active/inactive state.",
  },
  PHARMA_NEW_LAUNCH_CONTRIBUTION: {
    metricCode: "PHARMA_NEW_LAUNCH_CONTRIBUTION",
    sourceLanes: ["ISSUER_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "DOCUMENT_EXTRACTION",
    evidenceShape: "Issuer-disclosed launch revenue contribution or an explicitly stated compatible numerator/denominator for the completed annual period.",
    failClosedRule: "Qualitative launch success language must not be converted into a numeric contribution percentage.",
  },
  PHARMA_CHRONIC_ACUTE_MIX: {
    metricCode: "PHARMA_CHRONIC_ACUTE_MIX",
    sourceLanes: ["ISSUER_OFFICIAL", "LICENSED_MARKET_SOURCE"],
    accessGate: "PUBLIC_OR_LICENSED",
    acquisitionMethod: "COMPOSITE_REVIEW",
    evidenceShape: "Comparable chronic/acute therapy mix from issuer disclosure, or from an approved licensed source when issuer disclosure is absent.",
    failClosedRule: "Do not estimate the mix from brand lists, therapy anecdotes, or non-comparable third-party commentary.",
  },
  PHARMA_DOMESTIC_PIPELINE_EVIDENCE: {
    metricCode: "PHARMA_DOMESTIC_PIPELINE_EVIDENCE",
    sourceLanes: ["ISSUER_OFFICIAL", "EXCHANGE_FILING"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "EVENT_REVIEW",
    evidenceShape: "Dated material domestic launch/pipeline events with product, therapy, stage/outcome, and source provenance.",
    failClosedRule: "Undated pipeline claims or promotional product lists do not count as observations.",
  },
  PHARMA_INLICENSING_MA_EXECUTION: {
    metricCode: "PHARMA_INLICENSING_MA_EXECUTION",
    sourceLanes: ["EXCHANGE_FILING", "ISSUER_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "EVENT_REVIEW",
    evidenceShape: "Dated material in-licensing/M&A transactions with disclosed strategic/economic terms and subsequent execution/outcome evidence where available.",
    failClosedRule: "Rumoured, proposed, or immaterial transactions remain contextual and do not become execution observations.",
  },
  PHARMA_REGULATORY_SITE_STATUS: {
    metricCode: "PHARMA_REGULATORY_SITE_STATUS",
    sourceLanes: ["REGULATOR_OFFICIAL", "ISSUER_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "EVENT_REVIEW",
    evidenceShape: "Current material regulated-site state including latest inspection, unresolved action, remediation, and closure evidence.",
    failClosedRule: "A historical clean inspection cannot override a newer unresolved regulator action; unresolved state remains explicit.",
  },
  PHARMA_EXPORT_US_REVENUE_GROWTH: {
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    sourceLanes: ["ISSUER_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "DERIVED_FROM_DISCLOSED_INPUTS",
    evidenceShape: "Comparable disclosed US/export revenue by reporting period, with growth derived only across compatible geographic/business scopes.",
    failClosedRule: "Do not derive US/export growth from total international revenue unless the reviewed contract explicitly establishes compatible scope.",
  },
  PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE: {
    metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
    sourceLanes: ["ISSUER_OFFICIAL", "REGULATOR_OFFICIAL", "EXCHANGE_FILING"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "EVENT_REVIEW",
    evidenceShape: "Dated material launch, filing, approval, rejection, and pipeline milestone events linked to product/geography/stage.",
    failClosedRule: "Pipeline events without identifiable product/geography/stage or reliable date remain unavailable/review-required.",
  },
  PHARMA_US_GENERIC_PRICE_EROSION: {
    metricCode: "PHARMA_US_GENERIC_PRICE_EROSION",
    sourceLanes: ["ISSUER_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "DOCUMENT_EXTRACTION",
    evidenceShape: "Issuer-disclosed ASP/price-erosion evidence with compatible period definitions and explicit separation from volume/mix where available.",
    failClosedRule: "Do not back-solve price erosion as a residual from revenue and volume without an approved versioned method.",
  },
  PHARMA_GENERICS_VOLUME_MIX: {
    metricCode: "PHARMA_GENERICS_VOLUME_MIX",
    sourceLanes: ["ISSUER_OFFICIAL"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "DOCUMENT_EXTRACTION",
    evidenceShape: "Issuer-disclosed volume and product-mix effects kept distinct from price effects for the same reporting cycle.",
    failClosedRule: "If volume and mix are not separately disclosed, retain qualitative reviewed context rather than inventing a numeric split.",
  },
  PHARMA_COMPLEX_SPECIALTY_GENERICS_MIX: {
    metricCode: "PHARMA_COMPLEX_SPECIALTY_GENERICS_MIX",
    sourceLanes: ["ISSUER_OFFICIAL", "EXCHANGE_FILING"],
    accessGate: "PUBLIC_OFFICIAL_FIRST",
    acquisitionMethod: "COMPOSITE_REVIEW",
    evidenceShape: "Reviewed product-mix and material-launch evidence identifying complex/specialty generics contribution or strategic mix where explicitly disclosed.",
    failClosedRule: "Do not classify ordinary generics as complex/specialty without issuer or official evidence supporting that product category.",
  },
}

function acquisitionItem(
  scope: PharmaBusinessModelEvidenceAcquisitionItem["scope"],
  scopeLabel: string,
  requirement: PharmaWorkspaceRequirement,
  subprofileCode: Parameters<typeof composePharmaSubprofileContract>[0],
): PharmaBusinessModelEvidenceAcquisitionItem {
  const contract = composePharmaSubprofileContract(subprofileCode)
  const metric = contract.metrics.find((item) => item.metricCode === requirement.metricCode)
  const strategy = STRATEGIES[requirement.metricCode]
  if (!metric) throw new Error(`Missing effective Pharma metric contract for ${requirement.metricCode}`)
  if (!strategy) throw new Error(`Missing acquisition strategy for ${requirement.metricCode}`)
  return {
    scope,
    scopeLabel,
    metricCode: requirement.metricCode,
    label: metricLabel(requirement.metricCode),
    dimension: requirement.dimension,
    requirementLevel: requirement.requirementLevel,
    minimumObservations: metric.history.minimumObservations,
    preferredObservations: metric.history.preferredObservations,
    historyUnit: metric.history.historyUnit,
    periodTypes: metric.periodTypes,
    calculationOwner: metric.calculationOwner,
    sourceContract: metric.sourceContract,
    freshnessPolicy: metric.freshnessPolicy,
    sourceLanes: strategy.sourceLanes,
    accessGate: strategy.accessGate,
    acquisitionMethod: strategy.acquisitionMethod,
    evidenceShape: strategy.evidenceShape,
    failClosedRule: strategy.failClosedRule,
    state: "PLANNED",
  }
}

export function buildPharmaBusinessModelEvidenceAcquisitionPlan(model: PharmaResearchWorkspaceModel): PharmaBusinessModelEvidenceAcquisitionPlan {
  const primaryItems = model.primary.requirements.map((requirement) =>
    acquisitionItem("PRIMARY_MODEL", model.primary.displayName, requirement, model.primary.subprofileCode),
  )
  const overlayItems = model.secondaries
    .filter((item) => item.mode === "EVIDENCE_OVERLAY")
    .flatMap((overlay) => overlay.requirements.map((requirement) =>
      acquisitionItem("MATERIAL_OVERLAY", overlay.displayName, requirement, overlay.exposureCode),
    ))
  const items = [...primaryItems, ...overlayItems]
  return {
    contractVersion: "PHARMA_BUSINESS_MODEL_EVIDENCE_ACQUISITION_V1",
    items,
    summary: {
      total: items.length,
      mandatory: items.filter((item) => item.requirementLevel === "MANDATORY").length,
      important: items.filter((item) => item.requirementLevel === "IMPORTANT").length,
      supplementary: items.filter((item) => item.requirementLevel === "SUPPLEMENTARY").length,
      publicOfficialFirst: items.filter((item) => item.accessGate === "PUBLIC_OFFICIAL_FIRST").length,
      publicOrLicensed: items.filter((item) => item.accessGate === "PUBLIC_OR_LICENSED").length,
      licensedRequired: items.filter((item) => item.accessGate === "LICENSED_REQUIRED").length,
      derivedFromDisclosedInputs: items.filter((item) => item.acquisitionMethod === "DERIVED_FROM_DISCLOSED_INPUTS").length,
    },
    ingestionAuthorized: false,
  }
}
