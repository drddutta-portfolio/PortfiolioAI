export const RESEARCH_PROFILE_ROUTING_VERSION = "RESEARCH_PROFILE_ROUTING_V2" as const

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
  | "IT_SOFTWARE_PRODUCTS_PLATFORMS"
  | "IT_DIGITAL_INFRA_HARDWARE"
  | "INDUSTRIAL_CAPITAL_GOODS"
  | "PROJECT_EPC"
  | "CAPITAL_EQUIPMENT_ELECTRICAL"
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
 * industry/business-model evidence remain PROFILE_PENDING/REVIEW_REQUIRED rather
 * than receiving a convenient sector-only profile. Sector is macro context only;
 * industry is the minimum micro-methodology selector.
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
    return result(input, "ROUTED", "CAPITAL_EQUIPMENT_ELECTRICAL", "INDUSTRY_OVERRIDE", "INDUSTRY_CAPITAL_EQUIPMENT_ELECTRICAL")
  }

  if (sector === "BANKING") {
    if (industry === "BANKS") {
      return result(input, "ROUTED", "BANK", "SECTOR_AND_INDUSTRY", "BANKING_BANK")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "BANKING_INDUSTRY_REQUIRED")
    }
    return result(input, "REVIEW_REQUIRED", null, "AMBIGUOUS_OR_UNSUPPORTED", "BANKING_NON_BANK_INDUSTRY")
  }

  if (sector === "PHARMA") {
    if (industry === "PHARMACEUTICALS") {
      return result(input, "ROUTED", "PHARMA", "SECTOR_AND_INDUSTRY", "PHARMA_PHARMACEUTICALS")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "PHARMA_INDUSTRY_REQUIRED")
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
    if (
      industry === "COMPUTERS_SOFTWARE_CONSULTING"
      || industry === "IT_CONSULTING_SOFTWARE"
      || industry === "IT_SERVICES"
      || industry === "IT_SERVICES_CONSULTING"
      || industry === "SOFTWARE_SERVICES"
    ) {
      return result(input, "ROUTED", "IT_SERVICES", "SECTOR_AND_INDUSTRY", "IT_SERVICES")
    }
    if (
      industry === "IT_SOFTWARE_PRODUCTS"
      || industry === "SOFTWARE_PRODUCTS"
      || industry === "INTERNET_SOFTWARE_SERVICES"
    ) {
      return result(input, "ROUTED", "IT_SOFTWARE_PRODUCTS_PLATFORMS", "SECTOR_AND_INDUSTRY", "IT_SOFTWARE_PRODUCTS_PLATFORMS")
    }
    if (
      industry === "COMPUTERS_HARDWARE_EQUIPMENTS"
      || industry === "COMPUTER_HARDWARE"
      || industry === "DATA_CENTRE_INFRASTRUCTURE"
      || industry === "DIGITAL_INFRASTRUCTURE"
    ) {
      return result(input, "ROUTED", "IT_DIGITAL_INFRA_HARDWARE", "SECTOR_AND_INDUSTRY", "IT_DIGITAL_INFRA_HARDWARE")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "IT_INDUSTRY_REQUIRED")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "IT_SUBPROFILE_PENDING")
  }

  if (sector === "CAPITAL_GOODS" || sector === "INDUSTRIAL") {
    if (
      industry === "CIVIL_CONSTRUCTION"
      || industry === "CONSTRUCTION_ENGINEERING"
      || industry === "EPC"
      || industry === "INDUSTRIAL_CONSTRUCTION"
    ) {
      return result(input, "ROUTED", "PROJECT_EPC", "SECTOR_AND_INDUSTRY", "PROJECT_EPC")
    }
    if (
      industry === "HEAVY_ELECTRICAL_EQUIPMENT"
      || industry === "OTHER_ELECTRICAL_EQUIPMENT_PRODUCTS"
      || industry === "INDUSTRIAL_MACHINERY"
      || industry === "ELECTRICAL_EQUIPMENT"
      || industry === "INDUSTRIAL_PRODUCTS"
    ) {
      return result(input, "ROUTED", "CAPITAL_EQUIPMENT_ELECTRICAL", "SECTOR_AND_INDUSTRY", "CAPITAL_EQUIPMENT_ELECTRICAL")
    }
    if (industry === "AEROSPACE_DEFENCE" || industry === "AEROSPACE_AND_DEFENCE" || industry === "DEFENCE_EQUIPMENT" || industry === "DEFENCE_ELECTRONICS") {
      return result(input, "ROUTED", "DEFENCE_AEROSPACE", "SECTOR_AND_INDUSTRY", "DEFENCE_AEROSPACE")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "CAPITAL_GOODS_INDUSTRY_REQUIRED")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "CAPITAL_GOODS_SUBPROFILE_PENDING")
  }

  if (sector === "AUTOMOBILE_AND_AUTO_COMPONENTS") {
    if (
      industry === "CARS_UTILITY_VEHICLES"
      || industry === "2_3_WHEELERS"
      || industry === "COMMERCIAL_VEHICLES"
      || industry === "TRACTORS_FARM_EQUIPMENT"
    ) {
      return result(input, "ROUTED", "AUTO_OEM", "SECTOR_AND_INDUSTRY", "AUTO_OEM")
    }
    if (
      industry === "AUTO_PARTS_EQUIPMENT"
      || industry === "AUTO_COMPONENTS"
      || industry === "TYRES_RUBBER_PRODUCTS"
    ) {
      return result(input, "ROUTED", "AUTO_COMPONENTS", "SECTOR_AND_INDUSTRY", "AUTO_COMPONENTS")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "AUTO_INDUSTRY_REQUIRED")
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
