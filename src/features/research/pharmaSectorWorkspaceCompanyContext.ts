import { AUROPHARMA_G8_1_CLASSIFICATION_REVIEW } from "./auropharmaG8ClassificationEvidence"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"
import type { PharmaUnresolvedExposure } from "./pharmaThreeLayerResearchArchitecture"

export interface PharmaSectorWorkspaceCompanyContext {
  readonly unresolvedExposures: readonly PharmaUnresolvedExposure[]
  readonly readOnlyCompanyScore:
    | typeof TORNTPHARM_GATE_H3_READ_ONLY_RESULT
    | null
}

const EMPTY_CONTEXT: PharmaSectorWorkspaceCompanyContext = {
  unresolvedExposures: [],
  readOnlyCompanyScore: null,
}

const COMPANY_CONTEXT_BY_SYMBOL: Readonly<Record<string, PharmaSectorWorkspaceCompanyContext>> = {
  TORNTPHARM: {
    unresolvedExposures: [],
    readOnlyCompanyScore: TORNTPHARM_GATE_H3_READ_ONLY_RESULT,
  },
  AUROPHARMA: {
    unresolvedExposures: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.unresolvedExposures.map(
      (exposureCode) => ({
        exposureCode,
        reasonCode: "NO_REVENUE_OR_PROFIT_SHARE",
      }),
    ),
    readOnlyCompanyScore: null,
  },
}

export function pharmaSectorWorkspaceCompanyContext(
  symbol: string,
): PharmaSectorWorkspaceCompanyContext {
  return COMPANY_CONTEXT_BY_SYMBOL[symbol.toLocaleUpperCase()] ?? EMPTY_CONTEXT
}
