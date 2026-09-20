import { AUROPHARMA_G8_1_CLASSIFICATION_REVIEW } from "./auropharmaG8ClassificationEvidence"
import type { PharmaUnresolvedExposure } from "./pharmaThreeLayerResearchArchitecture"

export interface PharmaSectorWorkspaceCompanyContext {
  readonly unresolvedExposures: readonly PharmaUnresolvedExposure[]
}

const EMPTY_CONTEXT: PharmaSectorWorkspaceCompanyContext = {
  unresolvedExposures: [],
}

const COMPANY_CONTEXT_BY_SYMBOL: Readonly<Record<string, PharmaSectorWorkspaceCompanyContext>> = {
  AUROPHARMA: {
    unresolvedExposures: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.unresolvedExposures.map(
      (exposureCode) => ({
        exposureCode,
        reasonCode: "NO_REVENUE_OR_PROFIT_SHARE",
      }),
    ),
  },
}

export function pharmaSectorWorkspaceCompanyContext(
  symbol: string,
): PharmaSectorWorkspaceCompanyContext {
  return COMPANY_CONTEXT_BY_SYMBOL[symbol.toLocaleUpperCase()] ?? EMPTY_CONTEXT
}
