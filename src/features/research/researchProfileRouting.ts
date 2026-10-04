export const RESEARCH_PROFILE_ROUTING_VERSION = "RESEARCH_PROFILE_ROUTING_V2" as const

export type ResearchProfileRoutingState =
  | "ROUTED"
  | "PROFILE_PENDING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export type ResearchProfileCode =
  | "BANK"
  | "NBFC_LENDING"
  | "CAPITAL_MARKETS_AMC"
  | "INSURANCE"
  | "FINTECH_PLATFORM"
  | "STEEL_FERROUS"
  | "NON_FERROUS_DIVERSIFIED_METALS"
  | "BRANDED_CONSUMER_FMCG"
  | "UPSTREAM_E_AND_P"
  | "MIDSTREAM_CITY_GAS"
  | "INTEGRATED_REFINING_PETCHEM"
  | "REGULATED_NETWORK"
  | "GENERATION_INTEGRATED_UTILITY"
  | "RENEWABLE_IPP"
  | "IT_SERVICES"
  | "IT_SOFTWARE_PRODUCTS_PLATFORMS"
  | "IT_DIGITAL_INFRA_HARDWARE"
  | "INDUSTRIAL_CAPITAL_GOODS"
  | "PROJECT_EPC"
  | "CAPITAL_EQUIPMENT_ELECTRICAL"
  | "DEFENCE_AEROSPACE"
  | "AUTO_OEM"
  | "AUTO_COMPONENTS"
  | "SPECIALTY_CHEMICALS"
  | "AGRO_FERTILISER"
  | "COMMODITY_PROCESS_CHEMICALS"
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
    if (industry === "BANKS" || industry === "PRIVATE_SECTOR_BANK") {
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


  if (sector === "CHEMICALS") {
    if (industry === "SPECIALTY_CHEMICALS" || industry === "SPECIALITY_CHEMICALS" || industry === "CHEMICALS_SPECIALTY") {
      return result(input, "ROUTED", "SPECIALTY_CHEMICALS", "SECTOR_AND_INDUSTRY", "SPECIALTY_CHEMICALS")
    }
    if (
      industry === "PESTICIDES_AGROCHEMICALS"
      || industry === "AGROCHEMICALS"
      || industry === "FERTILISERS"
      || industry === "FERTILIZERS"
      || industry === "FERTILISER_CHEMICALS"
    ) {
      return result(input, "ROUTED", "AGRO_FERTILISER", "SECTOR_AND_INDUSTRY", "AGRO_FERTILISER")
    }
    if (
      industry === "COMMODITY_CHEMICALS"
      || industry === "INDUSTRIAL_CHEMICALS"
      || industry === "BASIC_CHEMICALS"
      || industry === "PROCESS_CHEMICALS"
    ) {
      return result(input, "ROUTED", "COMMODITY_PROCESS_CHEMICALS", "SECTOR_AND_INDUSTRY", "COMMODITY_PROCESS_CHEMICALS")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "CHEMICALS_INDUSTRY_REQUIRED")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "CHEMICALS_SUBPROFILE_PENDING")
  }


  if (sector === "METALS_MINING" || sector === "METALS_AND_MINING" || sector === "METALS") {
    if (
      industry === "IRON_STEEL"
      || industry === "STEEL"
      || industry === "IRON_STEEL_PRODUCTS"
      || industry === "FERROUS_METALS"
    ) {
      return result(input, "ROUTED", "STEEL_FERROUS", "SECTOR_AND_INDUSTRY", "STEEL_FERROUS")
    }
    if (
      industry === "ALUMINIUM"
      || industry === "ZINC"
      || industry === "COPPER"
      || industry === "NON_FERROUS_METALS"
      || industry === "DIVERSIFIED_METALS"
      || industry === "MINERALS_MINING"
      || industry === "MINING"
    ) {
      return result(input, "ROUTED", "NON_FERROUS_DIVERSIFIED_METALS", "SECTOR_AND_INDUSTRY", "NON_FERROUS_DIVERSIFIED_METALS")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "METALS_INDUSTRY_REQUIRED")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "METALS_SUBPROFILE_PENDING")
  }


  if (sector === "FAST_MOVING_CONSUMER_GOODS" || sector === "FMCG" || sector === "CONSUMER_STAPLES") {
    if (
      industry === "PERSONAL_CARE_HOUSEHOLD_PRODUCTS"
      || industry === "PERSONAL_PRODUCTS_HOUSEHOLD_CARE"
      || industry === "PACKAGED_FOODS"
      || industry === "OTHER_FOOD_BEVERAGES"
      || industry === "TEA_COFFEE"
      || industry === "VEGETABLE_OILS_PRODUCTS"
      || industry === "BEVERAGES"
      || industry === "FMCG"
      || industry === "FAST_MOVING_CONSUMER_GOODS"
      || industry === "CONSUMER_STAPLES"
      || industry === "ALCOHOLIC_BEVERAGES"
      || industry === "DISTILLERIES_BREWERIES"
    ) {
      return result(input, "ROUTED", "BRANDED_CONSUMER_FMCG", "SECTOR_AND_INDUSTRY", "BRANDED_CONSUMER_FMCG")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "CONSUMER_FMCG_INDUSTRY_REQUIRED")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "CONSUMER_FMCG_PROFILE_PENDING")
  }


  if (sector === "OIL_GAS_CONSUMABLE_FUELS" || sector === "OIL_GAS" || sector === "ENERGY") {
    if (
      industry === "OIL_EXPLORATION_PRODUCTION"
      || industry === "OIL_GAS_EXPLORATION"
      || industry === "EXPLORATION_PRODUCTION"
      || industry === "UPSTREAM_OIL_GAS"
    ) {
      return result(input, "ROUTED", "UPSTREAM_E_AND_P", "SECTOR_AND_INDUSTRY", "UPSTREAM_E_AND_P")
    }
    if (
      industry === "GAS_TRANSMISSION"
      || industry === "GAS_DISTRIBUTION"
      || industry === "CITY_GAS_DISTRIBUTION"
      || industry === "PIPELINES"
      || industry === "MIDSTREAM_OIL_GAS"
    ) {
      return result(input, "ROUTED", "MIDSTREAM_CITY_GAS", "SECTOR_AND_INDUSTRY", "MIDSTREAM_CITY_GAS")
    }
    if (
      industry === "REFINERIES"
      || industry === "REFINING_MARKETING"
      || industry === "PETROCHEMICALS"
      || industry === "INTEGRATED_OIL_GAS"
      || industry === "OIL_MARKETING_COMPANIES"
    ) {
      return result(input, "ROUTED", "INTEGRATED_REFINING_PETCHEM", "SECTOR_AND_INDUSTRY", "INTEGRATED_REFINING_PETCHEM")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "OIL_GAS_INDUSTRY_REQUIRED")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "OIL_GAS_SUBPROFILE_PENDING")
  }


  if (
    sector === "POWER"
    || sector === "POWER_RENEWABLE_ENERGY"
    || sector === "POWER_RENEWABLES"
    || sector === "UTILITIES"
  ) {
    if (
      industry === "POWER_TRANSMISSION"
      || industry === "ELECTRICITY_TRANSMISSION"
      || industry === "POWER_GRID"
      || industry === "TRANSMISSION_DISTRIBUTION"
    ) {
      return result(input, "ROUTED", "REGULATED_NETWORK", "SECTOR_AND_INDUSTRY", "REGULATED_NETWORK")
    }
    if (
      industry === "POWER_GENERATION"
      || industry === "ELECTRIC_UTILITIES"
      || industry === "INTEGRATED_POWER_UTILITIES"
      || industry === "HYDRO_POWER"
      || industry === "THERMAL_POWER"
    ) {
      return result(input, "ROUTED", "GENERATION_INTEGRATED_UTILITY", "SECTOR_AND_INDUSTRY", "GENERATION_INTEGRATED_UTILITY")
    }
    if (
      industry === "RENEWABLE_POWER"
      || industry === "RENEWABLE_ENERGY"
      || industry === "SOLAR_POWER"
      || industry === "WIND_POWER"
      || industry === "INDEPENDENT_POWER_PRODUCER_RENEWABLE"
    ) {
      return result(input, "ROUTED", "RENEWABLE_IPP", "SECTOR_AND_INDUSTRY", "RENEWABLE_IPP")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "POWER_RENEWABLES_INDUSTRY_REQUIRED")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "POWER_RENEWABLES_SUBPROFILE_PENDING")
  }

  if (sector === "FINANCIAL_SERVICES") {
    if (
      industry === "ASSET_MANAGEMENT_COS"
      || industry === "ASSET_MANAGEMENT_COMPANY"
      || industry === "BROKING_DISTRIBUTION"
      || industry === "STOCK_EXCHANGES_DEPOSITORIES"
      || industry === "CAPITAL_MARKETS"
    ) {
      return result(input, "ROUTED", "CAPITAL_MARKETS_AMC", "SECTOR_AND_INDUSTRY", "CAPITAL_MARKETS_AMC")
    }
    if (
      industry === "LIFE_INSURANCE"
      || industry === "GENERAL_INSURANCE"
      || industry === "HEALTH_INSURANCE"
      || industry === "INSURANCE"
    ) {
      return result(input, "ROUTED", "INSURANCE", "SECTOR_AND_INDUSTRY", "INSURANCE")
    }
    if (
      industry === "FINTECH"
      || industry === "FINTECH_INSURANCE_BROKERAGE_PLATFORM"
      || industry === "INTERNET_SOFTWARE_SERVICES"
      || industry === "DIGITAL_FINANCIAL_PLATFORM"
    ) {
      return result(input, "ROUTED", "FINTECH_PLATFORM", "SECTOR_AND_INDUSTRY", "FINTECH_PLATFORM")
    }
    if (industry === "NON_BANKING_FINANCIAL_COMPANY_NBFC" || industry === "NBFC") {
      return result(input, "ROUTED", "NBFC_LENDING", "SECTOR_AND_INDUSTRY", "NBFC_LENDING")
    }
    if (!industry) {
      return result(input, "PROFILE_PENDING", null, "CLASSIFICATION_MISSING", "FINANCIAL_SERVICES_INDUSTRY_REQUIRED")
    }
    return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "FINANCIAL_SERVICES_SUBPROFILE_PENDING")
  }

  return result(input, "PROFILE_PENDING", null, "AMBIGUOUS_OR_UNSUPPORTED", "PROFILE_CONTRACT_NOT_IMPLEMENTED")
}


export const HISTORICAL_RESEARCH_PROFILE_ROUTING_VERSION =
  "HISTORICAL_RESEARCH_PROFILE_ROUTING_V1" as const

export interface HistoricalResearchEconomicHierarchy {
  readonly macroEconomicSectorCode: string
  readonly macroEconomicSectorName: string
  readonly sectorCode: string
  readonly sectorName: string
  readonly industryCode: string
  readonly industryName: string
  readonly basicIndustryCode: string
  readonly basicIndustryName: string
}

export interface HistoricalResearchProfileRoutingInput {
  readonly assetClass: string
  readonly decisionAt: string
  readonly sourceDisseminatedAt: string
  readonly classificationState: "AUTHORITATIVE_COMPLETE" | "PARTIAL" | "CONDITIONAL" | "BLOCKED"
  readonly taxonomyVersion: "NSE_NOVEMBER_2022"
  readonly economicHierarchy: HistoricalResearchEconomicHierarchy
  readonly accountingContractBlob: string
  readonly periodSemanticsBlob: string
}

export interface HistoricalResearchProfileRoutingResult {
  readonly version: typeof HISTORICAL_RESEARCH_PROFILE_ROUTING_VERSION
  readonly state: "ROUTED" | "REVIEW_REQUIRED"
  readonly profileCode: "STEEL_FERROUS" | null
  readonly basis: "EXACT_HISTORICAL_BASIC_INDUSTRY" | "HISTORICAL_ROUTE_REJECTED"
  readonly reasonCode: string
  readonly decisionAt: string
  readonly economicHierarchy: HistoricalResearchEconomicHierarchy
}

const P8_APPROVED_ACCOUNTING_BLOB = "45e990981371dba217d12c430f8ce567acbf25fc" as const
const P8_APPROVED_PERIOD_SEMANTICS_BLOB = "797b7e91d7770f3377d0061ee338c76e8220391f" as const
const P8_STEEL_FERROUS_BASIC_INDUSTRY = "IN070205015" as const

/**
 * Historical-only methodology selection for the bounded P8 integration.
 *
 * This does not alter current/live application classification or routeResearchProfileV1.
 * Economic taxonomy remains the approved NSE November-2022 hierarchy; methodology
 * selection is a separate analytical decision keyed to the exact authoritative
 * Basic Industry. Anything broader, conditional, future-dated or using a different
 * accounting/period authority fails closed.
 */
export function routeHistoricalResearchProfileV1(
  input: HistoricalResearchProfileRoutingInput,
): HistoricalResearchProfileRoutingResult {
  const reject = (reasonCode: string): HistoricalResearchProfileRoutingResult => ({
    version: HISTORICAL_RESEARCH_PROFILE_ROUTING_VERSION,
    state: "REVIEW_REQUIRED",
    profileCode: null,
    basis: "HISTORICAL_ROUTE_REJECTED",
    reasonCode,
    decisionAt: input.decisionAt,
    economicHierarchy: input.economicHierarchy,
  })

  if (input.assetClass.trim().toUpperCase() !== "EQUITY") return reject("HISTORICAL_EQUITY_REQUIRED")
  if (input.taxonomyVersion !== "NSE_NOVEMBER_2022") return reject("HISTORICAL_TAXONOMY_VERSION_REQUIRED")
  if (input.classificationState !== "AUTHORITATIVE_COMPLETE") return reject("AUTHORITATIVE_COMPLETE_CLASSIFICATION_REQUIRED")
  if (input.accountingContractBlob !== P8_APPROVED_ACCOUNTING_BLOB) return reject("APPROVED_V1_ACCOUNTING_REQUIRED")
  if (input.periodSemanticsBlob !== P8_APPROVED_PERIOD_SEMANTICS_BLOB) return reject("APPROVED_V3_PERIOD_SEMANTICS_REQUIRED")

  const decisionMs = Date.parse(input.decisionAt)
  const disseminationMs = Date.parse(input.sourceDisseminatedAt)
  if (!Number.isFinite(decisionMs) || !Number.isFinite(disseminationMs)) return reject("VALID_POINT_IN_TIME_TIMESTAMPS_REQUIRED")
  if (disseminationMs >= decisionMs) return reject("FUTURE_OR_SAME_INSTANT_SOURCE_REJECTED")

  const h = input.economicHierarchy
  if (
    h.macroEconomicSectorCode !== "IN07"
    || h.sectorCode !== "IN0702"
    || h.industryCode !== "IN070205"
    || h.basicIndustryCode !== P8_STEEL_FERROUS_BASIC_INDUSTRY
  ) {
    return reject("EXACT_IN070205015_BASIC_INDUSTRY_REQUIRED")
  }

  if (key(h.basicIndustryName) !== "IRON_STEEL_PRODUCTS") {
    return reject("IRON_STEEL_PRODUCTS_NAME_REQUIRED")
  }

  return {
    version: HISTORICAL_RESEARCH_PROFILE_ROUTING_VERSION,
    state: "ROUTED",
    profileCode: "STEEL_FERROUS",
    basis: "EXACT_HISTORICAL_BASIC_INDUSTRY",
    reasonCode: "P8_HISTORICAL_IN070205015_STEEL_FERROUS",
    decisionAt: input.decisionAt,
    economicHierarchy: input.economicHierarchy,
  }
}
