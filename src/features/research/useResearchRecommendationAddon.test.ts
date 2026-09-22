import { cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useResearchRecommendationAddon } from "./useResearchRecommendationAddon"

const resolution = vi.hoisted(() => ({
  usePharmaSubprofileResolution: vi.fn(),
}))

vi.mock("./usePharmaSubprofileResolution", () => ({
  usePharmaSubprofileResolution: resolution.usePharmaSubprofileResolution,
}))

vi.mock("./pharmaGateI3ReadOnlyRecommendation", () => ({
  buildPharmaGateI3ReferenceRecommendation: vi.fn((input: { securitySymbol: string }) => ({
    version: "PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_V1",
    securityId: "security-1",
    securitySymbol: input.securitySymbol,
    profileCode: "PHARMA_V1",
    primarySubprofile: input.securitySymbol === "AUROPHARMA" ? "GLOBAL_GENERICS" : "DOMESTIC_FORMULATIONS",
    sourceAuthorityState: input.securitySymbol === "AUROPHARMA" ? "SCORE_NOT_COMPUTABLE" : "READY_FOR_POLICY",
    deterministicCalculationState: input.securitySymbol === "AUROPHARMA" ? "FAIL_CLOSED_INSUFFICIENT" : "READY_READ_ONLY_RECOMMENDATION",
    policyVersion: "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
    policyState: "OWNER_APPROVED_LOCKED",
    suggestedRole: input.securitySymbol === "AUROPHARMA" ? "INSUFFICIENT" : "SATELLITE_CANDIDATE",
    overallScore: input.securitySymbol === "AUROPHARMA" ? null : 75.1575,
    dimensions: [],
    evaluatedRoleThreshold: input.securitySymbol === "AUROPHARMA" ? "NOT_EVALUATED" : "SATELLITE_CANDIDATE",
    floorEvaluations: [],
    cautions: [],
    context: [],
    governanceState: null,
    overlayTreatment: { materialOverlayCode: null, materialOverlayTreatment: null, emergingWatchCode: null, emergingWatchTreatment: null, numericModifierApplied: false, secondIndependentRecommendation: false },
    reasonCodes: [],
    evidenceLineage: [],
    methodologyLineage: [],
    deterministic: true,
    readOnly: true,
    nonPersisting: true,
    recommendationPersistenceEnabled: false,
    scorePersistenceEnabled: false,
    weightGuidanceEnabled: false,
    actionBiasEnabled: false,
    positionSizingEnabled: false,
    aiInterpretationEnabled: false,
  })),
}))

vi.mock("./pharmaGateI3RecommendationAddon", () => ({
  buildPharmaGateI3RecommendationAddon: vi.fn((result: { suggestedRole: string; overallScore: number | null }) => ({
    contractVersion: "PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_V1",
    profileCode: "PHARMA_V1",
    profileLabel: "Pharmaceuticals · PHARMA_V1",
    suggestedRole: result.suggestedRole,
    roleLabel: result.suggestedRole === "INSUFFICIENT" ? "Insufficient" : "Satellite candidate",
    state: result.suggestedRole === "INSUFFICIENT" ? "INSUFFICIENT" : "READY",
    statusLabel: result.suggestedRole === "INSUFFICIENT" ? "Insufficient" : "Read-only",
    detail: "test",
    cautions: [],
    overallScore: result.overallScore,
    policyVersion: "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
    actionUnavailableReason: "off",
    weightUnavailableReason: "off",
    trackingUnavailableReason: "off",
    persistenceEnabled: false,
    actionBiasEnabled: false,
    weightGuidanceEnabled: false,
    aiInterpretationEnabled: false,
  })),
}))

describe("useResearchRecommendationAddon I3 reference bridge", () => {
  afterEach(() => {
    cleanup()
    resolution.usePharmaSubprofileResolution.mockReset()
  })

  it("activates TORNTPHARM even when the scoring snapshot profile is not PHARMA_V1", async () => {
    resolution.usePharmaSubprofileResolution.mockReturnValue({
      data: { status: "RESOLVED" },
      isLoading: false,
    })
    const { result } = renderHook(() => useResearchRecommendationAddon({
      securityId: "torn-security",
      securitySymbol: "TORNTPHARM",
      profileCode: "GENERAL",
    }))
    await waitFor(() => expect(result.current.data?.roleLabel).toBe("Satellite candidate"))
    expect(result.current.enabled).toBe(true)
  })

  it("activates AUROPHARMA fail-closed even when numeric scoring is not PHARMA_V1", async () => {
    resolution.usePharmaSubprofileResolution.mockReturnValue({
      data: { status: "RESOLVED" },
      isLoading: false,
    })
    const { result } = renderHook(() => useResearchRecommendationAddon({
      securityId: "auro-security",
      securitySymbol: "AUROPHARMA",
      profileCode: "GENERAL",
    }))
    await waitFor(() => expect(result.current.data?.roleLabel).toBe("Insufficient"))
    expect(result.current.enabled).toBe(true)
  })

  it("does not alter the core-shell path for unrelated stocks", () => {
    resolution.usePharmaSubprofileResolution.mockReturnValue({
      data: null,
      isLoading: false,
    })
    const { result } = renderHook(() => useResearchRecommendationAddon({
      securityId: "other-security",
      securitySymbol: "OTHER",
      profileCode: "GENERAL",
    }))
    expect(result.current.enabled).toBe(false)
    expect(result.current.data).toBeNull()
  })
})
