export type SectorMappingState = "MAPPED" | "MISSING"

export interface SectorMappingResult {
  readonly sourceSector: string | null
  readonly sourceIndustry: string | null
  readonly applicationSector: string | null
  readonly state: SectorMappingState
  readonly mappingBasis: string
  readonly proposedResearchProfileCode: string | null
}

function normalize(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
}

const PROPOSED_PROFILE_BY_DASHBOARD_SECTOR: Readonly<Record<string, string>> = {
  INFORMATION_TECHNOLOGY: "IT_SERVICES_TECH",
  OIL_GAS_CONSUMABLE_FUELS: "ENERGY_OIL_GAS",
  ENERGY: "ENERGY_OIL_GAS",
  FAST_MOVING_CONSUMER_GOODS: "CONSUMER_FMCG_RETAIL",
  FMCG: "CONSUMER_FMCG_RETAIL",
  CONSUMER_STAPLES: "CONSUMER_FMCG_RETAIL",
  AUTOMOBILE_AND_AUTO_COMPONENTS: "AUTO_AUTO_COMPONENTS",
  PHARMA: "PHARMA_HEALTHCARE",
  HEALTHCARE: "PHARMA_HEALTHCARE",
  METALS_MINING: "MATERIALS_METALS_MINING",
  CONSTRUCTION_MATERIALS: "CEMENT_CONSTRUCTION_MATERIALS",
  CAPITAL_GOODS: "INDUSTRIAL_CAPITAL_GOODS",
  INDUSTRIAL: "INDUSTRIAL_CAPITAL_GOODS",
  CONSTRUCTION: "INFRASTRUCTURE_CONSTRUCTION",
  TELECOMMUNICATION: "TELECOM",
  TELECOMMUNICATIONS: "TELECOM",
  REALTY: "REAL_ESTATE",
  REAL_ESTATE: "REAL_ESTATE",
  CHEMICALS: "CHEMICALS_FERTILIZERS",
  TEXTILES: "TEXTILES",
  TEXTILES_APPARELS_ACCESSORIES: "TEXTILES",
  POWER: "POWER_UTILITIES",
  RENEWABLE_ENERGY: "POWER_UTILITIES",
  DEFENCE: "DEFENCE",
}

/**
 * Application-wide classification authority is the same reviewed enrichment
 * projection used by Dashboard -> Allocation & performance:
 * `current_security_enrichment_v1.sector`.
 *
 * Do not rewrite, merge, or rename that sector label here. Research-profile
 * grouping is a separate downstream concern and must not change the sector a
 * user sees for the holding elsewhere in PortfolioAI.
 */
export function mapSectorToPortfolioAiV1(sourceSector: string | null, sourceIndustry: string | null): SectorMappingResult {
  const applicationSector = sourceSector?.trim() || null
  if (!applicationSector) {
    return {
      sourceSector,
      sourceIndustry,
      applicationSector: null,
      state: "MISSING",
      mappingBasis: "DASHBOARD_ENRICHMENT_SECTOR_MISSING",
      proposedResearchProfileCode: null,
    }
  }

  const sectorKey = normalize(applicationSector)
  return {
    sourceSector,
    sourceIndustry,
    applicationSector,
    state: "MAPPED",
    mappingBasis: "DASHBOARD_ENRICHMENT_SECTOR",
    proposedResearchProfileCode: PROPOSED_PROFILE_BY_DASHBOARD_SECTOR[sectorKey] ?? null,
  }
}
