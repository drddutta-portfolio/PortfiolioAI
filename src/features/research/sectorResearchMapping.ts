export type CanonicalSectorCode =
  | "BANKING_FINANCIAL_SERVICES"
  | "INFORMATION_TECHNOLOGY"
  | "OIL_GAS_ENERGY"
  | "FMCG"
  | "AUTO_AUTO_ANCILLARIES"
  | "PHARMA_HEALTHCARE"
  | "METALS_MINING"
  | "CEMENT_CONSTRUCTION_MATERIALS"
  | "INFRASTRUCTURE_CAPITAL_GOODS"
  | "TELECOMMUNICATIONS"
  | "CONSUMER_DURABLES"
  | "REAL_ESTATE"
  | "CHEMICALS_FERTILIZERS"
  | "TEXTILES"
  | "MEDIA_ENTERTAINMENT"
  | "POWER_UTILITIES"
  | "AGRICULTURE_ALLIED"
  | "AVIATION_LOGISTICS"
  | "NEW_AGE_DIGITAL"
  | "DEFENCE"

export type SectorMappingState = "MAPPED" | "REVIEW_REQUIRED" | "MISSING"

export interface SectorMappingResult {
  readonly sourceSector: string | null
  readonly sourceIndustry: string | null
  readonly canonicalSectorCode: CanonicalSectorCode | null
  readonly state: SectorMappingState
  readonly mappingBasis: string
  readonly proposedResearchProfileCode: string | null
}

function normalize(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
}

const EXACT_SECTOR_MAP: Readonly<Record<string, CanonicalSectorCode>> = {
  BANKING: "BANKING_FINANCIAL_SERVICES",
  FINANCIAL_SERVICES: "BANKING_FINANCIAL_SERVICES",
  INFORMATION_TECHNOLOGY: "INFORMATION_TECHNOLOGY",
  OIL_GAS_CONSUMABLE_FUELS: "OIL_GAS_ENERGY",
  ENERGY: "OIL_GAS_ENERGY",
  FAST_MOVING_CONSUMER_GOODS: "FMCG",
  FMCG: "FMCG",
  CONSUMER_STAPLES: "FMCG",
  AUTOMOBILE_AND_AUTO_COMPONENTS: "AUTO_AUTO_ANCILLARIES",
  PHARMA: "PHARMA_HEALTHCARE",
  HEALTHCARE: "PHARMA_HEALTHCARE",
  METALS_MINING: "METALS_MINING",
  CONSTRUCTION_MATERIALS: "CEMENT_CONSTRUCTION_MATERIALS",
  CAPITAL_GOODS: "INFRASTRUCTURE_CAPITAL_GOODS",
  INDUSTRIAL: "INFRASTRUCTURE_CAPITAL_GOODS",
  CONSTRUCTION: "INFRASTRUCTURE_CAPITAL_GOODS",
  TELECOMMUNICATION: "TELECOMMUNICATIONS",
  TELECOMMUNICATIONS: "TELECOMMUNICATIONS",
  CONSUMER_DURABLES: "CONSUMER_DURABLES",
  GEMS_AND_JEWELLERY: "CONSUMER_DURABLES",
  REALTY: "REAL_ESTATE",
  REAL_ESTATE: "REAL_ESTATE",
  CHEMICALS: "CHEMICALS_FERTILIZERS",
  TEXTILES: "TEXTILES",
  TEXTILES_APPARELS_ACCESSORIES: "TEXTILES",
  MEDIA_ENTERTAINMENT: "MEDIA_ENTERTAINMENT",
  POWER: "POWER_UTILITIES",
  RENEWABLE_ENERGY: "POWER_UTILITIES",
  AGRICULTURE_ALLIED: "AGRICULTURE_ALLIED",
  AVIATION_LOGISTICS: "AVIATION_LOGISTICS",
  NEW_AGE_DIGITAL_BUSINESSES: "NEW_AGE_DIGITAL",
  DEFENCE: "DEFENCE",
}

const AMBIGUOUS_SOURCE_SECTORS = new Set([
  "CONSUMER_SERVICES",
  "CONSUMER_DISCRETIONARY",
  "MATERIAL",
  "SERVICES",
  "SHIP_BUILDING",
  "WASTE_MANAGMENT",
  "WASTE_MANAGEMENT",
])

const PROPOSED_PROFILE_BY_SECTOR: Readonly<Partial<Record<CanonicalSectorCode, string>>> = {
  INFORMATION_TECHNOLOGY: "IT_SERVICES_TECH",
  OIL_GAS_ENERGY: "ENERGY_OIL_GAS",
  FMCG: "CONSUMER_FMCG_RETAIL",
  AUTO_AUTO_ANCILLARIES: "AUTO_AUTO_COMPONENTS",
  PHARMA_HEALTHCARE: "PHARMA_HEALTHCARE",
  METALS_MINING: "MATERIALS_METALS_MINING",
  CEMENT_CONSTRUCTION_MATERIALS: "CEMENT_CONSTRUCTION_MATERIALS",
  INFRASTRUCTURE_CAPITAL_GOODS: "INDUSTRIAL_CAPITAL_GOODS",
  TELECOMMUNICATIONS: "TELECOM",
  CONSUMER_DURABLES: "CONSUMER_DURABLES",
  REAL_ESTATE: "REAL_ESTATE",
  CHEMICALS_FERTILIZERS: "CHEMICALS_FERTILIZERS",
  TEXTILES: "TEXTILES",
  MEDIA_ENTERTAINMENT: "MEDIA_ENTERTAINMENT",
  POWER_UTILITIES: "POWER_UTILITIES",
  AGRICULTURE_ALLIED: "AGRICULTURE_ALLIED",
  AVIATION_LOGISTICS: "AVIATION_LOGISTICS",
  NEW_AGE_DIGITAL: "NEW_AGE_DIGITAL",
  DEFENCE: "DEFENCE",
}

export function mapSectorToPortfolioAiV1(sourceSector: string | null, sourceIndustry: string | null): SectorMappingResult {
  const sectorKey = normalize(sourceSector)
  if (!sectorKey) {
    return {
      sourceSector,
      sourceIndustry,
      canonicalSectorCode: null,
      state: "MISSING",
      mappingBasis: "SOURCE_SECTOR_MISSING",
      proposedResearchProfileCode: null,
    }
  }

  if (AMBIGUOUS_SOURCE_SECTORS.has(sectorKey)) {
    return {
      sourceSector,
      sourceIndustry,
      canonicalSectorCode: null,
      state: "REVIEW_REQUIRED",
      mappingBasis: `AMBIGUOUS_SOURCE_SECTOR:${sectorKey}`,
      proposedResearchProfileCode: null,
    }
  }

  const canonicalSectorCode = EXACT_SECTOR_MAP[sectorKey] ?? null
  if (!canonicalSectorCode) {
    return {
      sourceSector,
      sourceIndustry,
      canonicalSectorCode: null,
      state: "REVIEW_REQUIRED",
      mappingBasis: `UNMAPPED_SOURCE_SECTOR:${sectorKey}`,
      proposedResearchProfileCode: null,
    }
  }

  return {
    sourceSector,
    sourceIndustry,
    canonicalSectorCode,
    state: "MAPPED",
    mappingBasis: `EXACT_SOURCE_SECTOR:${sectorKey}`,
    proposedResearchProfileCode: PROPOSED_PROFILE_BY_SECTOR[canonicalSectorCode] ?? null,
  }
}
