import { composePharmaSubprofileContract } from "./pharmaSubprofileContracts"
import type { PharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"
import { metricLabel } from "./researchPolicy"
import { validateEvidenceIngestionCandidates } from "./researchEvidenceIngestionValidator"
import { buildTorntpharmIngestionPreview } from "./torntpharmIngestionPreview"

export interface PharmaEvidencePilotScopeSummary {
  readonly label: string
  readonly ready: number
  readonly total: number
}

export interface PharmaEvidencePilotPreview {
  readonly candidateCount: number
  readonly acceptedCount: number
  readonly quarantinedCount: number
  readonly directOfficialCount: number
  readonly derivedCount: number
  readonly countedRequirementReady: number
  readonly countedRequirementTotal: number
  readonly scopes: readonly PharmaEvidencePilotScopeSummary[]
  readonly unmatchedRequirementLabels: readonly string[]
}

function projectScope(label: string, subprofileCode: Parameters<typeof composePharmaSubprofileContract>[0], requirementCodes: readonly string[], candidateCountByCode: ReadonlyMap<string, number>) {
  const contract = composePharmaSubprofileContract(subprofileCode)
  const byCode = new Map(contract.metrics.map((item) => [item.metricCode, item]))
  const projections = requirementCodes.map((metricCode) => {
    const requirement = byCode.get(metricCode)
    const candidateObservations = candidateCountByCode.get(metricCode) ?? 0
    return {
      metricCode,
      label: metricLabel(metricCode),
      ready: requirement ? candidateObservations >= requirement.history.minimumObservations : false,
    }
  })
  return {
    summary: { label, ready: projections.filter((item) => item.ready).length, total: projections.length },
    projections,
  }
}

/** Pure, non-writing projection of the TORNTPHARM official manifest against the active reviewed subprofile requirements. */
export function buildTorntpharmEvidencePilotPreview(securityId: string, model: PharmaResearchWorkspaceModel): PharmaEvidencePilotPreview {
  const candidates = buildTorntpharmIngestionPreview(securityId)
  const validation = validateEvidenceIngestionCandidates(candidates)
  const accepted = [...validation.accepted, ...validation.alreadyPresent]
  const candidateCountByCode = new Map<string, number>()
  accepted.forEach((row) => candidateCountByCode.set(row.metricCode, (candidateCountByCode.get(row.metricCode) ?? 0) + 1))

  const primary = projectScope("Primary model", model.primary.subprofileCode, model.primary.requirements.map((item) => item.metricCode), candidateCountByCode)
  const overlays = model.secondaries.filter((item) => item.mode === "EVIDENCE_OVERLAY").map((item) =>
    projectScope(item.displayName, item.exposureCode, item.requirements.map((requirement) => requirement.metricCode), candidateCountByCode),
  )
  const projections = [...primary.projections, ...overlays.flatMap((item) => item.projections)]
  return {
    candidateCount: candidates.length,
    acceptedCount: validation.accepted.length,
    quarantinedCount: validation.quarantined.length,
    directOfficialCount: candidates.filter((row) => row.lineage === "DIRECT_OFFICIAL").length,
    derivedCount: candidates.filter((row) => row.lineage === "PORTFOLIOAI_DERIVED").length,
    countedRequirementReady: projections.filter((item) => item.ready).length,
    countedRequirementTotal: projections.length,
    scopes: [primary.summary, ...overlays.map((item) => item.summary)],
    unmatchedRequirementLabels: projections.filter((item) => !item.ready).map((item) => item.label),
  }
}
