export const RESEARCH_PROFILE_ROUTING_VERSION = "RESEARCH_PROFILE_ROUTING_V1" as const

export type ResearchProfileRoutingState =
  | "ROUTED"
  | "PROFILE_PENDING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export type ResearchProfileCode =
  | "BANK"
  | "NBFC_LENDING"
  | "CAPITAL_MARKET_FINANCIAL"
  | "DIGITAL_PLATFORM"
  | "IT_SERVICES"
  | "INDUSTRIAL_CAPITAL_GOODS"
  | "DEFENCE_AEROSPACE"
  | "AUTO_OEM"
  | "AUTO_COMPONENTS"
  | "PHARMA"
  | "HOSPITAL"
  | "DIAGNOSTICS"

export type ResearchProfileRoutingBasis =
  | "ASSET_CLASS_NOT_EQUITY"
  | "SECTOR_AND_INDUSTRY"
  | "REVIEWED_SECTOR_ONLY"
  | "INDUSTRY_OVERRIDE"
  | "AMBIGUOUS_OR_UNSUPPORTED"
  | "CLASSIFICATION_MISSING"

export interface ResearchProfileRoutingInput {
  readonly assetClass: string
  readonly applicationSector: string | null
  readonly applicationIndustry: string | null
}

export interface ResearchProfileRoutingResult {
  readonly version: typeof RESEARCH_PROFILE_ROUTING_VERSION
  readonly applicationSector: string | null
  readonly applicationIndustry: string | null
  readonly state: ResearchProfileRoutingState
  readonly profileCode: ResearchProfileCode | null
  readonly basis: ResearchProfileRoutingBasis
  readonly reasonCode: string
}

function key(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
}

function result(
  input: ResearchProfileRoutingInput,
  state: ResearchProfileRoutingState,
  profileCode: ResearchProfileCode | null,
  basis: ResearchProfileRoutingBasis,
  reasonCode: string,
): ResearchProfileRoutingResult {
  return {
    version: RESEARCH_PROFILE_ROUTING_VERSION,
    applicationSector: input.applicationSector?.trim() || null,
    applicationIndustry: input.applicationIndustry?.trim() || null,
    state,
    profileCode,
    basis,
    reasonCode,
  }
}

/**
 * Routes canonical application classification into a research methodology.
 *
 * This function must never rewrite the application sector/industry displayed to
 * the user. It is deliberately fail-closed: ambiguous broad sectors or missing
 * subtype evidence remain PROFILE_PENDING/REVIEW_REQUIRED rather than receiving
 * a convenient generic profile.
 */
export function routeResearchProfileV1(input: ResearchProfileRoutingInput): ResearchProfileRoutingResult {
  if (input.assetClass.trim().toUpperCase() !== "EQUITY") {
    return result(input, "NOT_APPLICABLE", null, "ASSET_CLASS_NOT_EQUITY", "EQUITY_RESEARCH_NOT_APPLICABLE")
  }

  const sector = key(input.applicationSector)
  const industry = key(input.applicationIndustry)
  if (!sector) {
    return result(input, "REVIEW_REQUIRED", null, "CLASSIFICATION_MISSING", "APPLICATION_SECTOR_MISSING")
  }

  // Industry evidence is allowed to route methodology independently of the
  // owner-facing sector label. This protects against inconsistent vendor labels
  // such as an Aerospace & Defence company appearing under Information Technology.
  if (industry === "AEROSPACE_DEFENCE" || industry === "AEROSPACE_AND_DEFENCE") {
    return result(input, "ROUTED", "DEFENCE_AEROSPACE", "INDUSTRY_OVERRIDE", "INDUSTRY_DEFENCE_AEROSPACE")
  }
  if (industry === "HEAVY_ELECTRICAL_EQUIPMENT" || industry === "OTHER_ELECTRICAL_EQUIPMENT_PRODUCTS") {
    return result(input, "ROUTED", "INDUSTRIAL_CAPITAL_GOODS", "INDUSTRY_OVERRIDE", "INDUSTRY_INDUSTRIAL_CAPITAL_GOODS")
  }

  if (sector === "BANKING") {
    if (!industry || industry === "BANKS") {
      return result(input, "ROUTED", "BANK", industry ? "SECTOR_AND_INDUSTRY" : "REVIEWED_SECTOR_ONLY", "BANKING_BANK")
    }
    return result(input, "REVIEW_REQUIRED", null, "AMBIGUOUS_OR_UNSUPPORTED", "BANKING_NON_BANK_INDUSTRY")
  }

  if (sector === "PHARMA") {
    if (!industry || industry === "PHARMACEUTICALS") {
      return result(input, "ROUTED", "PHARMA", industry ? "SECTOR_AND_INDUSTRY" : "REVIEWED_SECTOR_ONLY", "PHARMA_PHARMACEUTICALS")
    }
    return result(input, "REVIEW_REQUIRED", null, "AMBIGUOUS_OR_UNSUPPORTED", "PHARMA_UNSUPPORTED_INDUSTRY")
  }

  if (sector === "HEALTHCARE") {
    if (industry === "PHARMACEUTICALS") return result(input, "ROUTED", "PHARMA", "SECTOR_AND_INDUSTRY", "HEALTHCARE_PHARMA")
    if (industry === "HOSPITALS" || industry === "HOSPITAL_HEALTHCARE_SERVICES") return result(input, "ROUTED", "HOSPITAL", "SECTOR_AND_INDUSTRY", "HEALTHCARE_HOSPITAL")
    if (industry === "DIAGNOSTICS" || industry === "DIAGNOSTIC_SERVICES") return result(input, "ROUTED", "DIAGNOSTICS", "SECTOR_AND_INDUSTRY", "HEALTHCARE_DIAGNOSTICS")
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "HEALTHCARE_SUBPROFILE_PENDING")
  }

  if (sector === "INFORMATION_TECHNOLOGY") {
    if (industry === "IT_CONSULTING_SOFTWARE" || industry === "IT_SERVICES") {
      return result(input, "ROUTED", "IT_SERVICES", "SECTOR_AND_INDUSTRY", "IT_SERVICES")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "IT_SUBPROFILE_PENDING")
  }

  if (sector === "CAPITAL_GOODS" || sector === "INDUSTRIAL") {
    if (!industry || industry === "HEAVY_ELECTRICAL_EQUIPMENT" || industry === "OTHER_ELECTRICAL_EQUIPMENT_PRODUCTS") {
      return result(input, "ROUTED", "INDUSTRIAL_CAPITAL_GOODS", industry ? "SECTOR_AND_INDUSTRY" : "REVIEWED_SECTOR_ONLY", "INDUSTRIAL_CAPITAL_GOODS")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "CAPITAL_GOODS_SUBPROFILE_PENDING")
  }

  if (sector === "AUTOMOBILE_AND_AUTO_COMPONENTS") {
    if (industry === "CARS_UTILITY_VEHICLES" || industry === "2_3_WHEELERS" || industry === "COMMERCIAL_VEHICLES") {
      return result(input, "ROUTED", "AUTO_OEM", "SECTOR_AND_INDUSTRY", "AUTO_OEM")
    }
    if (industry === "AUTO_PARTS_EQUIPMENT" || industry === "AUTO_COMPONENTS") {
      return result(input, "ROUTED", "AUTO_COMPONENTS", "SECTOR_AND_INDUSTRY", "AUTO_COMPONENTS")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "AUTO_SUBPROFILE_PENDING")
  }

  if (sector === "FINANCIAL_SERVICES") {
    if (industry === "ASSET_MANAGEMENT_COS" || industry === "BROKING_DISTRIBUTION" || industry === "STOCK_EXCHANGES_DEPOSITORIES") {
      return result(input, "ROUTED", "CAPITAL_MARKET_FINANCIAL", "SECTOR_AND_INDUSTRY", "CAPITAL_MARKET_FINANCIAL")
    }
    if (industry === "INTERNET_SOFTWARE_SERVICES") {
      return result(input, "ROUTED", "DIGITAL_PLATFORM", "SECTOR_AND_INDUSTRY", "FINANCIAL_DIGITAL_PLATFORM")
    }
    if (industry === "NON_BANKING_FINANCIAL_COMPANY_NBFC" || industry === "NBFC") {
      return result(input, "ROUTED", "NBFC_LENDING", "SECTOR_AND_INDUSTRY", "NBFC_LENDING")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "FINANCIAL_SERVICES_SUBPROFILE_PENDING")
  }

  return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "PROFILE_CONTRACT_NOT_IMPLEMENTED")
}
