import { useMemo } from "react"
import { buildPharmaGateI3ReferenceRecommendation } from "./pharmaGateI3ReadOnlyRecommendation"
import { buildPharmaGateI3RecommendationAddon } from "./pharmaGateI3RecommendationAddon"
import type { ResearchRecommendationAddonState } from "./researchRecommendationAddon"
import { usePharmaSubprofileResolution } from "./usePharmaSubprofileResolution"

export function useResearchRecommendationAddon(input: {
  readonly securityId: string
  readonly securitySymbol: string
  readonly profileCode: string | null
}): ResearchRecommendationAddonState {
  const symbol = input.securitySymbol.toLocaleUpperCase()
  const pharmaEnabled = input.profileCode === "PHARMA_V1"
    && (symbol === "TORNTPHARM" || symbol === "AUROPHARMA")
  const pharmaResolution = usePharmaSubprofileResolution(
    pharmaEnabled ? input.securityId : null,
  )

  const data = useMemo(() => {
    if (!pharmaEnabled || !pharmaResolution.data) return null
    const result = buildPharmaGateI3ReferenceRecommendation({
      securityId: input.securityId,
      securitySymbol: input.securitySymbol,
      assignmentResolution: pharmaResolution.data,
    })
    return result ? buildPharmaGateI3RecommendationAddon(result) : null
  }, [
    input.securityId,
    input.securitySymbol,
    pharmaEnabled,
    pharmaResolution.data,
  ])

  return {
    enabled: pharmaEnabled,
    isLoading: pharmaEnabled && pharmaResolution.isLoading,
    data,
  }
}
