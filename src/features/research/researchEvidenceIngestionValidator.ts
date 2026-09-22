import Decimal from "decimal.js"
import type { TorntpharmOfficialManifestRow } from "./torntpharmOfficialManifestFixture"

export const EVIDENCE_INGESTION_VALIDATOR_CONTRACT_VERSION = "R4N_NUMERIC_EVIDENCE_V2" as const

export interface EvidenceIngestionCandidate extends TorntpharmOfficialManifestRow {
  readonly securityId: string
  readonly profileVersion: string
  readonly sourceArtifactCode: string
  readonly derivedFormulaCode: string | null
  readonly directInputKeys: readonly string[]
}

export interface ExistingEvidenceIdentity {
  readonly securityId: string
  readonly metricCode: string
  readonly periodEnd: string
  readonly value: string
  readonly unit: TorntpharmOfficialManifestRow["unit"]
}

export type EvidenceValidationIssueCode = "INVALID_SECURITY_ID" | "INVALID_PROFILE_VERSION" | "INVALID_PERIOD" | "INVALID_NUMERIC_VALUE" | "UNSUPPORTED_METRIC" | "UNIT_MISMATCH" | "MISSING_SOURCE_ARTIFACT" | "INVALID_DERIVED_LINEAGE" | "DUPLICATE_CANDIDATE" | "CONFLICTING_EXISTING_FACT"

export interface EvidenceValidationResult {
  readonly accepted: readonly EvidenceIngestionCandidate[]
  readonly alreadyPresent: readonly EvidenceIngestionCandidate[]
  readonly quarantined: readonly { readonly row: EvidenceIngestionCandidate; readonly issueCodes: readonly EvidenceValidationIssueCode[] }[]
  readonly idempotencyKeys: readonly string[]
}

const UNIT_BY_METRIC: Readonly<Record<string, TorntpharmOfficialManifestRow["unit"]>> = {
  REVENUE_ANNUAL: "INR_CR", OPERATING_REVENUE_QUARTER: "INR_CR", OPERATING_PROFIT_QUARTER: "INR_CR",
  PAT_ATTRIBUTABLE_ANNUAL: "INR_CR", EPS_DILUTED_ANNUAL: "INR_PER_SHARE", CFO_ANNUAL: "INR_CR",
  CAPEX_ANNUAL: "INR_CR", FREE_CASH_FLOW_ANNUAL: "INR_CR", ROCE_MANAGEMENT_ANNUAL: "PERCENT",
  NET_DEBT_EBITDA_ANNUAL: "MULTIPLE", INTEREST_COVERAGE_ANNUAL: "MULTIPLE", TOTAL_DEBT_ANNUAL: "INR_CR",
  CASH_EQUIVALENTS_ANNUAL: "INR_CR", EBITDA_ANNUAL: "INR_CR", RND_EXPENSE_ANNUAL: "INR_CR", RND_INTENSITY_PERCENT: "PERCENT",
  PHARMA_EXPORT_US_REVENUE_GROWTH: "PERCENT",
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu
const datePattern = /^\d{4}-\d{2}-\d{2}$/u

function isIsoDate(value: string): boolean {
  if (!datePattern.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

const identity = (row: Pick<EvidenceIngestionCandidate, "securityId" | "metricCode" | "periodEnd">) => `${row.securityId}:${row.metricCode}:${row.periodEnd}`
const sameValue = (left: EvidenceIngestionCandidate, right: ExistingEvidenceIdentity) => left.unit === right.unit && new Decimal(left.value).eq(right.value)

/** Pure validation only: it has no repository, provider, database or network dependency. */
export function validateEvidenceIngestionCandidates(candidates: readonly EvidenceIngestionCandidate[], existing: readonly ExistingEvidenceIdentity[] = []): EvidenceValidationResult {
  const seen = new Set<string>()
  const existingByIdentity = new Map(existing.map((row) => [identity(row as EvidenceIngestionCandidate), row]))
  const accepted: EvidenceIngestionCandidate[] = []
  const alreadyPresent: EvidenceIngestionCandidate[] = []
  const quarantined: EvidenceValidationResult["quarantined"][number][] = []

  for (const row of candidates) {
    const issues: EvidenceValidationIssueCode[] = []
    const key = identity(row)
    if (!uuidPattern.test(row.securityId)) issues.push("INVALID_SECURITY_ID")
    if (!/^PHARMA_V1\+DOMESTIC_FORMULATIONS_V\d+$/u.test(row.profileVersion)) issues.push("INVALID_PROFILE_VERSION")
    if (!isIsoDate(row.periodEnd)) issues.push("INVALID_PERIOD")
    try { if (!new Decimal(row.value).isFinite()) issues.push("INVALID_NUMERIC_VALUE") } catch { issues.push("INVALID_NUMERIC_VALUE") }
    const expectedUnit = UNIT_BY_METRIC[row.metricCode]
    if (expectedUnit === undefined) issues.push("UNSUPPORTED_METRIC")
    else if (expectedUnit !== row.unit) issues.push("UNIT_MISMATCH")
    if (!row.sourceArtifactCode.trim()) issues.push("MISSING_SOURCE_ARTIFACT")
    if (row.lineage === "PORTFOLIOAI_DERIVED" ? !row.derivedFormulaCode || row.directInputKeys.length === 0 : row.derivedFormulaCode !== null || row.directInputKeys.length > 0) issues.push("INVALID_DERIVED_LINEAGE")
    if (seen.has(key)) issues.push("DUPLICATE_CANDIDATE")
    seen.add(key)
    const prior = existingByIdentity.get(key)
    if (prior && !sameValue(row, prior)) issues.push("CONFLICTING_EXISTING_FACT")
    if (issues.length) quarantined.push({ row, issueCodes: issues })
    else if (prior) alreadyPresent.push(row)
    else accepted.push(row)
  }
  return { accepted, alreadyPresent, quarantined, idempotencyKeys: accepted.map((row) => `R4N:${identity(row)}:${row.sourceArtifactCode}`) }
}
