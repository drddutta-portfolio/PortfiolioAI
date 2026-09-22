import { PharmaResearchReadinessPanel } from "./PharmaResearchReadinessPanel"
import { ResearchReadinessPanel, type ResearchReadinessGroup } from "./ResearchReadinessPanel"
import { researchProfileUiContract } from "./researchProfileUiContract"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import type { SecurityResearch } from "./types"

function ScoringReadinessPanel({ profileCode, snapshot }: { readonly profileCode: string; readonly snapshot: SecurityScoringSnapshot | null }) {
  const ui = researchProfileUiContract(profileCode)
  const applicable = ui.dimensionOrder.filter((code) => !ui.notApplicableDimensions.includes(code))
  const byCode = new Map(snapshot?.dimensions.map((dimension) => [dimension.dimensionCode, dimension]) ?? [])
  const groups: ResearchReadinessGroup[] = ui.scoreSectionGroups.map((group) => {
    const codes = group.codes.filter((code) => applicable.includes(code))
    return { code: group.label, label: group.label, ready: codes.filter((code) => byCode.get(code)?.rawScore != null).length, total: codes.length }
  }).filter((group) => group.total > 0)
  const ready = applicable.filter((code) => byCode.get(code)?.rawScore != null).length
  const details = <div className="research-readiness-dimension-list">{applicable.map((code) => {
    const dimension = byCode.get(code)
    const label = ui.dimensionLabels[code] ?? code.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase())
    return <article key={code}><span>{label}</span><strong>{dimension?.rawScore == null ? "Not score-ready" : `Score ${dimension.rawScore.toFixed(0)}`}</strong><small>{dimension ? `${Math.round(dimension.evidenceCoverage * 100)}% evidence · ${Math.round(dimension.scoreReadyCoverage * 100)}% score-ready` : "Evidence unavailable"}</small></article>
  })}</div>

  return <ResearchReadinessPanel title={`${ui.profileDisplayName} Research Readiness`} detail="A compact view of profile readiness requirements. BANK_NBFC requirements are satisfied by validated, score-ready dimensions." ready={ready} total={applicable.length} groups={groups} detailsLabel={`View all ${ui.profileDisplayName} readiness requirements`} details={details} itemLabel="readiness requirements" />
}

export function ProfileResearchReadinessPanel({ profileCode, research, snapshot }: {
  readonly profileCode: string
  readonly research: SecurityResearch
  readonly snapshot: SecurityScoringSnapshot | null
}) {
  if (profileCode === "PHARMA_V1") return <PharmaResearchReadinessPanel research={research} />
  return <ScoringReadinessPanel profileCode={profileCode} snapshot={snapshot} />
}
