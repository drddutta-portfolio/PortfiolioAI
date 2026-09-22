import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type { ResearchSubprofileExposure } from "./pharmaSubprofileAssignment"
import { usePharmaSubprofileResolution } from "./usePharmaSubprofileResolution"

function exposureIsActive(exposure: ResearchSubprofileExposure, evaluationDate: string) {
  return exposure.assignmentState === "REVIEWED"
    && exposure.effectiveFrom !== null
    && exposure.effectiveFrom <= evaluationDate
    && (exposure.effectiveTo === null || evaluationDate < exposure.effectiveTo)
}

function materialityLabel(value: ResearchSubprofileExposure["materiality"]) {
  return value.charAt(0) + value.slice(1).toLocaleLowerCase()
}

export function PharmaSubprofileSummary({ securityId, enabled }: { readonly securityId: string; readonly enabled: boolean }) {
  const resolution = usePharmaSubprofileResolution(enabled ? securityId : null)
  if (!enabled) return null
  if (resolution.isLoading) return <p><strong>Primary subprofile:</strong> Loading reviewed assignment…</p>
  if (resolution.error) return <p><strong>Primary subprofile:</strong> Unavailable</p>
  if (!resolution.data || resolution.data.status !== "RESOLVED") {
    return <p><strong>Primary subprofile:</strong> Awaiting reviewed assignment</p>
  }

  const assignment = resolution.data.assignment
  const primary = PHARMA_SUBPROFILE_CONTRACTS[assignment.primarySubprofileCode].displayName
  const evaluationDate = new Date().toISOString().slice(0, 10)
  const secondaries = assignment.secondaryExposures.filter((exposure) => exposureIsActive(exposure, evaluationDate))

  return <>
    <p><strong>Primary subprofile:</strong> {primary} · Reviewed</p>
    {secondaries.length ? <>
      <p><strong>Secondary exposures:</strong></p>
      <div className="identity-chips" aria-label="Reviewed Pharma secondary exposures">
        {secondaries.map((exposure) => <span key={exposure.exposureCode}>{PHARMA_SUBPROFILE_CONTRACTS[exposure.exposureCode].displayName} · {materialityLabel(exposure.materiality)}</span>)}
      </div>
    </> : <p><strong>Secondary exposures:</strong> None reviewed</p>}
  </>
}
