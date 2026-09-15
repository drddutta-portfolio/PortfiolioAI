import type { EvidenceIngestionCandidate } from "./researchEvidenceIngestionValidator"
import { TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE, type TorntpharmOfficialManifestRow } from "./torntpharmOfficialManifestFixture"

export const TORNTPHARM_EFFECTIVE_PROFILE_VERSION = "PHARMA_V1+DOMESTIC_FORMULATIONS_V1" as const
export const TORNTPHARM_SECURITY_ID = "da69b3eb-0343-44f8-912c-288b826118cc" as const

function sourceArtifact(row: TorntpharmOfficialManifestRow): string {
  if (row.lineage === "PORTFOLIOAI_DERIVED") return "PORTFOLIOAI_DERIVED_TORNTPHARM_R4L_V1"
  if (row.periodEnd === "2026-03-31") return row.metricCode.includes("QUARTER") ? "TORNTPHARM_Q4_FY26_RELEASE" : "TORNTPHARM_AR_FY26"
  if (row.periodEnd === "2025-03-31") return "TORNTPHARM_AR_FY26_OR_FY25"
  if (row.periodEnd === "2024-12-31") return "TORNTPHARM_Q3_FY25_OFFICIAL_EVIDENCE"
  return "TORNTPHARM_AR_FY25_OR_FY24"
}

function derivedFormula(row: TorntpharmOfficialManifestRow): string | null {
  if (row.metricCode === "FREE_CASH_FLOW_ANNUAL") return "CFO_MINUS_CAPEX_V1"
  if (row.metricCode === "TOTAL_DEBT_ANNUAL") return "LONG_TERM_PLUS_SHORT_TERM_BORROWINGS_V1"
  if (row.metricCode === "RND_INTENSITY_PERCENT") return "RND_EXPENSE_DIV_REVENUE_PERCENT_V1"
  return null
}

function directInputs(row: TorntpharmOfficialManifestRow): readonly string[] {
  if (row.metricCode === "FREE_CASH_FLOW_ANNUAL") return [`CFO_ANNUAL:${row.periodEnd}`, `CAPEX_ANNUAL:${row.periodEnd}`]
  if (row.metricCode === "TOTAL_DEBT_ANNUAL") return [`LONG_TERM_BORROWINGS:${row.periodEnd}`, `SHORT_TERM_BORROWINGS:${row.periodEnd}`]
  if (row.metricCode === "RND_INTENSITY_PERCENT") return [`RND_EXPENSE_ANNUAL:${row.periodEnd}`, `REVENUE_ANNUAL:${row.periodEnd}`]
  return []
}

export const TORNTPHARM_INGESTION_PREVIEW: readonly EvidenceIngestionCandidate[] = TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE.map((row) => ({
  ...row,
  securityId: TORNTPHARM_SECURITY_ID,
  profileVersion: TORNTPHARM_EFFECTIVE_PROFILE_VERSION,
  sourceArtifactCode: sourceArtifact(row),
  derivedFormulaCode: derivedFormula(row),
  directInputKeys: directInputs(row),
}))
