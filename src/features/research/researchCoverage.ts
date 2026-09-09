import type { PortfolioPosition } from "../portfolio/types"
import { OWNERSHIP_CODES, VALUATION_CODES } from "./researchPolicy"

export type ResearchCoverageState = "FRESH" | "STALE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED" | "NOT_APPLICABLE"

export interface CoverageObservation {
  readonly securityId: string
  readonly metricCode: string
  readonly evidenceStatus: string
  readonly freshUntil: string
  readonly retrievedAt: string
}

export interface CoverageDocument {
  readonly securityId: string
  readonly identityStatus: string
  readonly createdAt: string
}

export interface CoverageIdentity {
  readonly securityId: string
  readonly evidenceStatus: string
  readonly createdAt: string
}

export interface ResearchCoverageRow {
  readonly securityId: string
  readonly symbol: string
  readonly company: string
  readonly assetClass: string
  readonly role: PortfolioPosition["role"]
  readonly themes: readonly string[]
  readonly sector: string | null
  readonly marketCapCategory: string | null
  readonly equityEligible: boolean
  readonly providerIdentity: ResearchCoverageState
  readonly fundamentals: ResearchCoverageState
  readonly ownership: ResearchCoverageState
  readonly valuation: ResearchCoverageState
  readonly documents: ResearchCoverageState
  readonly overall: ResearchCoverageState
  readonly conflictCount: number
  readonly reviewRequiredCount: number
  readonly latestEvidenceAt: string | null
}

interface EnrichmentSummary {
  readonly securityId: string
  readonly marketCapCategory: string | null
}

const IDENTITY_FRESHNESS_MS = 180 * 24 * 60 * 60 * 1000
const isFresh = (freshUntil: string, now = Date.now()) => Number.isFinite(Date.parse(freshUntil)) && Date.parse(freshUntil) > now

function evidenceState(rows: readonly CoverageObservation[], applicable = true): ResearchCoverageState {
  if (!applicable) return "NOT_APPLICABLE"
  if (!rows.length) return "MISSING"
  if (rows.some((row) => row.evidenceStatus === "CONFLICTING")) return "CONFLICTING"
  return rows.every((row) => isFresh(row.freshUntil)) ? "FRESH" : "STALE"
}

function documentState(rows: readonly CoverageDocument[], applicable = true): ResearchCoverageState {
  if (!applicable) return "NOT_APPLICABLE"
  if (!rows.length) return "MISSING"
  if (rows.some((row) => row.identityStatus === "REVIEW_REQUIRED")) return "REVIEW_REQUIRED"
  if (rows.some((row) => row.identityStatus === "CONFLICTING" || row.identityStatus === "AMBIGUOUS")) return "CONFLICTING"
  return "FRESH"
}

function identityState(rows: readonly CoverageIdentity[], applicable = true): ResearchCoverageState {
  if (!applicable) return "NOT_APPLICABLE"
  if (!rows.length) return "MISSING"
  const latest = [...rows].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
  if (!latest) return "MISSING"
  if (latest.evidenceStatus === "CONFLICTING" || latest.evidenceStatus === "AMBIGUOUS") return "CONFLICTING"
  if (latest.evidenceStatus !== "MATCHED") return "REVIEW_REQUIRED"
  const created = Date.parse(latest.createdAt)
  if (!Number.isFinite(created)) return "STALE"
  return created + IDENTITY_FRESHNESS_MS > Date.now() ? "FRESH" : "STALE"
}

const rank: Readonly<Record<ResearchCoverageState, number>> = {
  CONFLICTING: 5,
  REVIEW_REQUIRED: 4,
  MISSING: 3,
  STALE: 2,
  FRESH: 1,
  NOT_APPLICABLE: 0,
}

function overallState(states: readonly ResearchCoverageState[]): ResearchCoverageState {
  const applicable = states.filter((state) => state !== "NOT_APPLICABLE")
  if (!applicable.length) return "NOT_APPLICABLE"
  return applicable.reduce((worst, state) => rank[state] > rank[worst] ? state : worst, applicable[0]!)
}

function latestDate(values: readonly (string | null)[]) {
  const valid = values.filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value as string)))
  return valid.sort((left, right) => right.localeCompare(left))[0] ?? null
}

export function buildResearchCoverage(
  positions: readonly PortfolioPosition[],
  observations: readonly CoverageObservation[],
  documents: readonly CoverageDocument[],
  identities: readonly CoverageIdentity[],
  enrichment: readonly EnrichmentSummary[],
): readonly ResearchCoverageRow[] {
  const observationsBySecurity = new Map<string, CoverageObservation[]>()
  const documentsBySecurity = new Map<string, CoverageDocument[]>()
  const identitiesBySecurity = new Map<string, CoverageIdentity[]>()
  const enrichmentBySecurity = new Map(enrichment.map((row) => [row.securityId, row]))

  observations.forEach((row) => observationsBySecurity.set(row.securityId, [...(observationsBySecurity.get(row.securityId) ?? []), row]))
  documents.forEach((row) => documentsBySecurity.set(row.securityId, [...(documentsBySecurity.get(row.securityId) ?? []), row]))
  identities.forEach((row) => identitiesBySecurity.set(row.securityId, [...(identitiesBySecurity.get(row.securityId) ?? []), row]))

  return positions.map((position) => {
    const equityEligible = position.assetClass === "EQUITY"
    const securityObservations = observationsBySecurity.get(position.securityId) ?? []
    const securityDocuments = documentsBySecurity.get(position.securityId) ?? []
    const securityIdentities = identitiesBySecurity.get(position.securityId) ?? []
    const ownershipRows = securityObservations.filter((row) => OWNERSHIP_CODES.has(row.metricCode))
    const valuationRows = securityObservations.filter((row) => VALUATION_CODES.has(row.metricCode))
    const fundamentalRows = securityObservations.filter((row) => !OWNERSHIP_CODES.has(row.metricCode) && !VALUATION_CODES.has(row.metricCode))
    const providerIdentity = identityState(securityIdentities, equityEligible)
    const fundamentals = evidenceState(fundamentalRows, equityEligible)
    const ownership = evidenceState(ownershipRows, equityEligible)
    const valuation = evidenceState(valuationRows, equityEligible)
    const documentCoverage = documentState(securityDocuments, equityEligible)
    const conflictCount = securityObservations.filter((row) => row.evidenceStatus === "CONFLICTING").length
      + securityIdentities.filter((row) => row.evidenceStatus === "CONFLICTING" || row.evidenceStatus === "AMBIGUOUS").length
    const reviewRequiredCount = securityDocuments.filter((row) => row.identityStatus === "REVIEW_REQUIRED").length
      + securityIdentities.filter((row) => !["MATCHED", "CONFLICTING", "AMBIGUOUS"].includes(row.evidenceStatus)).length

    return {
      securityId: position.securityId,
      symbol: position.symbol,
      company: position.company,
      assetClass: position.assetClass,
      role: position.role,
      themes: position.themes.map((theme) => theme.name),
      sector: position.sector,
      marketCapCategory: enrichmentBySecurity.get(position.securityId)?.marketCapCategory ?? null,
      equityEligible,
      providerIdentity,
      fundamentals,
      ownership,
      valuation,
      documents: documentCoverage,
      overall: overallState([providerIdentity, fundamentals, ownership, valuation, documentCoverage]),
      conflictCount,
      reviewRequiredCount,
      latestEvidenceAt: latestDate([
        ...securityObservations.map((row) => row.retrievedAt),
        ...securityDocuments.map((row) => row.createdAt),
        ...securityIdentities.map((row) => row.createdAt),
      ]),
    }
  })
}
