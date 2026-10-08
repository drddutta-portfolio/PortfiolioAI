import { useCanonicalEvidenceReadiness } from "./useCanonicalEvidenceReadiness"
import { useSecurityScoring } from "./useSecurityScoring"

/** Select the portfolio/security snapshot once, then share it with every Research consumer. */
export function useStockResearchContext(input: {
  readonly portfolioId: string | null
  readonly securityId: string | null
  readonly assetClass: string | null
  readonly sector: string | null
  readonly industry: string | null
}) {
  const evidence = useCanonicalEvidenceReadiness(input.portfolioId ?? "", input.securityId ?? "", input.assetClass ?? "")
  const scoring = useSecurityScoring(input.securityId, input.sector, input.industry, input.portfolioId, input.assetClass, {
    snapshot: evidence.data?.snapshot ?? null,
    isLoading: evidence.isLoading,
    error: evidence.error,
  })
  return { evidence, scoring, reload: evidence.reload }
}
