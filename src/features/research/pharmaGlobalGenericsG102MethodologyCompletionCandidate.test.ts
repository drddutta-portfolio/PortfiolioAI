import { describe, expect, it } from "vitest"
import { PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE } from "./pharmaGlobalGenericsG102MethodologyCompletionCandidate"

describe("G10.2 Global Generics methodology-completion candidate", () => {
  it("keeps AUROPHARMA fail-closed until owner approval", () => {
    expect(PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE).toEqual(
      expect.objectContaining({
        stage: "G10.2",
        checkpoint: "B",
        state: "OWNER_APPROVAL_REQUIRED",
        referenceSymbol: "AUROPHARMA",
        supportedPrimarySubprofile: "GLOBAL_GENERICS",
        scoreState: "SCORE_NOT_COMPUTABLE",
        noPartialScoreReconstruction: true,
        noHiddenRenormalization: true,
        emergingApiNumericParticipation: false,
        unresolvedBiosimilarsNumericParticipation: false,
        scoreExecutionEnabled: false,
        recommendationExecutionEnabled: false,
        persistedScoreRunEnabled: false,
      }),
    )
  })

  it("covers all ten PHARMA_V1 dimensions without borrowing other-subprofile bands", () => {
    const candidate = PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE
    expect(candidate.dimensionDecisions).toHaveLength(10)
    expect(new Set(candidate.dimensionDecisions.map((item) => item.dimension)).size).toBe(10)
    expect(candidate.noDomesticBandsReuse).toBe(true)
    expect(candidate.noApiBandsReuse).toBe(true)
    expect(candidate.noBankNbfcBandsReuse).toBe(true)
  })

  it("uses an explicit no-hidden-weight resolution policy", () => {
    const policy = PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE.proposedResolutionPolicy
    expect(policy.componentAggregation).toBe("MEDIAN_NO_HIDDEN_WEIGHTS")
    expect(policy.missingMandatoryComponentTreatment).toBe("FAIL_CLOSED")
    expect(policy.samePrimaryPeerCohortRequired).toBe(true)
    expect(policy.methodologyExecutableBeforeOwnerApproval).toBe(false)
  })
})
