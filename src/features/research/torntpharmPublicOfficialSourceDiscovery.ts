import type { PharmaBusinessModelEvidenceAcquisitionPlan, PharmaBusinessModelEvidenceAcquisitionItem, PharmaEvidenceSourceLane } from "./pharmaBusinessModelEvidenceAcquisitionContract"

export type PublicOfficialArtifactKind =
  | "SOURCE_HUB"
  | "ANNUAL_REPORT"
  | "RESULTS_RELEASE"
  | "REGULATORY_ACTION"
  | "REGULATORY_CLOSEOUT"

export interface PublicOfficialSourceArtifact {
  readonly code: string
  readonly title: string
  readonly sourceLane: Exclude<PharmaEvidenceSourceLane, "LICENSED_MARKET_SOURCE">
  readonly authority: string
  readonly kind: PublicOfficialArtifactKind
  readonly locator: string
  readonly periodOrDate: string
  readonly discoveryState: "DISCOVERED"
}

export interface PublicOfficialRequirementDiscovery {
  readonly metricCode: string
  readonly label: string
  readonly scopeLabel: string
  readonly requirementLevel: PharmaBusinessModelEvidenceAcquisitionItem["requirementLevel"]
  readonly minimumObservations: number
  readonly preferredObservations: number
  readonly historyUnit: string
  readonly candidateArtifactCodes: readonly string[]
  readonly discoveryState: "CANDIDATE_SOURCE_FOUND"
  readonly evidenceState: "NOT_REVIEWED"
  readonly gap: string
}

export interface TorntpharmPublicOfficialSourceDiscoveryPlan {
  readonly contractVersion: "TORNTPHARM_PUBLIC_OFFICIAL_DISCOVERY_V1"
  readonly artifacts: readonly PublicOfficialSourceArtifact[]
  readonly requirements: readonly PublicOfficialRequirementDiscovery[]
  readonly summary: {
    readonly scopedRequirements: number
    readonly mappedRequirements: number
    readonly discoveredArtifacts: number
    readonly issuerArtifacts: number
    readonly regulatorArtifacts: number
    readonly sourceHubs: number
  }
  readonly sourceFetchAuthorized: false
  readonly ingestionAuthorized: false
}

export const TORNTPHARM_PUBLIC_OFFICIAL_ARTIFACTS = Object.freeze([
  {
    code: "TORRENT_ANNUAL_REPORTS_HUB",
    title: "Torrent Pharmaceuticals Annual Reports",
    sourceLane: "ISSUER_OFFICIAL",
    authority: "Torrent Pharmaceuticals Limited",
    kind: "SOURCE_HUB",
    locator: "https://www.torrentpharma.com/investors/financial-info/annual-reports/",
    periodOrDate: "Historical annual archive through FY2025-26",
    discoveryState: "DISCOVERED",
  },
  {
    code: "TORRENT_AR_2025_26",
    title: "Integrated Annual Report 2025-26",
    sourceLane: "ISSUER_OFFICIAL",
    authority: "Torrent Pharmaceuticals Limited",
    kind: "ANNUAL_REPORT",
    locator: "https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf",
    periodOrDate: "FY2025-26",
    discoveryState: "DISCOVERED",
  },
  {
    code: "TORRENT_AR_2023_24",
    title: "Integrated Annual Report 2023-24",
    sourceLane: "ISSUER_OFFICIAL",
    authority: "Torrent Pharmaceuticals Limited",
    kind: "ANNUAL_REPORT",
    locator: "https://www.torrentpharma.com/pdf/investors/AR-2023-24.pdf",
    periodOrDate: "FY2023-24",
    discoveryState: "DISCOVERED",
  },
  {
    code: "TORRENT_QUARTERLY_RESULTS_HUB",
    title: "Torrent Pharmaceuticals Quarterly Results",
    sourceLane: "ISSUER_OFFICIAL",
    authority: "Torrent Pharmaceuticals Limited",
    kind: "SOURCE_HUB",
    locator: "https://www.torrentpharma.com/investors/financial-info/quarterly-results/",
    periodOrDate: "Quarterly archive including FY2025-26 and FY2026-27",
    discoveryState: "DISCOVERED",
  },
  {
    code: "TORRENT_Q4_FY26_RELEASE",
    title: "Torrent Pharma Q4 FY26 Results Release",
    sourceLane: "ISSUER_OFFICIAL",
    authority: "Torrent Pharmaceuticals Limited",
    kind: "RESULTS_RELEASE",
    locator: "https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf",
    periodOrDate: "2026-05-22",
    discoveryState: "DISCOVERED",
  },
  {
    code: "TORRENT_SEBI_DISCLOSURES_HUB",
    title: "Torrent Pharmaceuticals SEBI / LODR Disclosures",
    sourceLane: "EXCHANGE_FILING",
    authority: "Torrent Pharmaceuticals Limited / listed-company disclosure archive",
    kind: "SOURCE_HUB",
    locator: "https://www.torrentpharma.com/investors/share-holder/disclosures/",
    periodOrDate: "Current and historical listed-company disclosures",
    discoveryState: "DISCOVERED",
  },
  {
    code: "FDA_INDRA_WARNING_2019",
    title: "FDA Warning Letter — Indrad facility",
    sourceLane: "REGULATOR_OFFICIAL",
    authority: "U.S. Food and Drug Administration",
    kind: "REGULATORY_ACTION",
    locator: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/torrent-pharmaceuticals-limited-585255-10082019",
    periodOrDate: "2019-10-08",
    discoveryState: "DISCOVERED",
  },
  {
    code: "FDA_INDRA_CLOSEOUT_2024",
    title: "FDA Closeout Letter — Indrad facility",
    sourceLane: "REGULATOR_OFFICIAL",
    authority: "U.S. Food and Drug Administration",
    kind: "REGULATORY_CLOSEOUT",
    locator: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/torrent-pharmaceuticals-limited-585255-09042024",
    periodOrDate: "2024-09-04",
    discoveryState: "DISCOVERED",
  },
] as const satisfies readonly PublicOfficialSourceArtifact[])

const ARTIFACTS_BY_METRIC: Readonly<Record<string, readonly string[]>> = {
  PHARMA_DOMESTIC_REVENUE_GROWTH: ["TORRENT_ANNUAL_REPORTS_HUB", "TORRENT_AR_2025_26", "TORRENT_QUARTERLY_RESULTS_HUB"],
  PHARMA_FIELD_FORCE_PRODUCTIVITY: ["TORRENT_ANNUAL_REPORTS_HUB", "TORRENT_AR_2023_24", "TORRENT_AR_2025_26"],
  PHARMA_DOMESTIC_EXPOSURE_MATERIALITY_REVIEW: ["TORRENT_AR_2025_26", "FDA_INDRA_WARNING_2019", "FDA_INDRA_CLOSEOUT_2024"],
  PHARMA_NEW_LAUNCH_CONTRIBUTION: ["TORRENT_AR_2025_26", "TORRENT_Q4_FY26_RELEASE", "TORRENT_QUARTERLY_RESULTS_HUB"],
  PHARMA_DOMESTIC_PIPELINE_EVIDENCE: ["TORRENT_AR_2025_26", "TORRENT_QUARTERLY_RESULTS_HUB", "TORRENT_SEBI_DISCLOSURES_HUB"],
  PHARMA_INLICENSING_MA_EXECUTION: ["TORRENT_AR_2023_24", "TORRENT_AR_2025_26", "TORRENT_SEBI_DISCLOSURES_HUB"],
  PHARMA_REGULATORY_SITE_STATUS: ["FDA_INDRA_WARNING_2019", "FDA_INDRA_CLOSEOUT_2024", "TORRENT_AR_2025_26"],
  PHARMA_EXPORT_US_REVENUE_GROWTH: ["TORRENT_ANNUAL_REPORTS_HUB", "TORRENT_AR_2025_26", "TORRENT_QUARTERLY_RESULTS_HUB", "TORRENT_Q4_FY26_RELEASE"],
  PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE: ["TORRENT_AR_2025_26", "TORRENT_QUARTERLY_RESULTS_HUB", "TORRENT_SEBI_DISCLOSURES_HUB"],
  PHARMA_US_GENERIC_PRICE_EROSION: ["TORRENT_QUARTERLY_RESULTS_HUB", "TORRENT_ANNUAL_REPORTS_HUB"],
  PHARMA_GENERICS_VOLUME_MIX: ["TORRENT_QUARTERLY_RESULTS_HUB", "TORRENT_ANNUAL_REPORTS_HUB"],
  PHARMA_COMPLEX_SPECIALTY_GENERICS_MIX: ["TORRENT_AR_2025_26", "TORRENT_ANNUAL_REPORTS_HUB", "TORRENT_SEBI_DISCLOSURES_HUB"],
}

function gapFor(item: PharmaBusinessModelEvidenceAcquisitionItem) {
  if (item.minimumObservations > 1) return `Candidate source family found; ${item.minimumObservations} minimum / ${item.preferredObservations} preferred ${item.historyUnit.toLocaleLowerCase()} observations still require period-by-period review.`
  return "Candidate official artifact(s) found; content still requires evidence-shape and freshness review before any observation can be proposed."
}

export function buildTorntpharmPublicOfficialSourceDiscoveryPlan(
  acquisitionPlan: PharmaBusinessModelEvidenceAcquisitionPlan,
): TorntpharmPublicOfficialSourceDiscoveryPlan {
  const scoped = acquisitionPlan.items.filter((item) => item.accessGate === "PUBLIC_OFFICIAL_FIRST")
  const requirements = scoped.map((item): PublicOfficialRequirementDiscovery => {
    const candidateArtifactCodes = ARTIFACTS_BY_METRIC[item.metricCode]
    if (!candidateArtifactCodes?.length) throw new Error(`Missing public/official discovery mapping for ${item.metricCode}`)
    return {
      metricCode: item.metricCode,
      label: item.label,
      scopeLabel: item.scopeLabel,
      requirementLevel: item.requirementLevel,
      minimumObservations: item.minimumObservations,
      preferredObservations: item.preferredObservations,
      historyUnit: item.historyUnit,
      candidateArtifactCodes,
      discoveryState: "CANDIDATE_SOURCE_FOUND",
      evidenceState: "NOT_REVIEWED",
      gap: gapFor(item),
    }
  })
  return {
    contractVersion: "TORNTPHARM_PUBLIC_OFFICIAL_DISCOVERY_V1",
    artifacts: TORNTPHARM_PUBLIC_OFFICIAL_ARTIFACTS,
    requirements,
    summary: {
      scopedRequirements: scoped.length,
      mappedRequirements: requirements.filter((item) => item.candidateArtifactCodes.length > 0).length,
      discoveredArtifacts: TORNTPHARM_PUBLIC_OFFICIAL_ARTIFACTS.length,
      issuerArtifacts: TORNTPHARM_PUBLIC_OFFICIAL_ARTIFACTS.filter((item) => item.sourceLane === "ISSUER_OFFICIAL" || item.sourceLane === "EXCHANGE_FILING").length,
      regulatorArtifacts: TORNTPHARM_PUBLIC_OFFICIAL_ARTIFACTS.filter((item) => item.sourceLane === "REGULATOR_OFFICIAL").length,
      sourceHubs: TORNTPHARM_PUBLIC_OFFICIAL_ARTIFACTS.filter((item) => item.kind === "SOURCE_HUB").length,
    },
    sourceFetchAuthorized: false,
    ingestionAuthorized: false,
  }
}
