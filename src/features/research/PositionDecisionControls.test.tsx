import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PositionDecisionControls } from "./PositionDecisionControls"

const repository = vi.hoisted(() => ({
  recordRecommendationPreview: vi.fn(),
  savePositionDecisionSettings: vi.fn(),
  policy: null as Record<string, unknown> | null,
  profileCode: "PHARMA_V1",
  profileName: "Pharmaceuticals · PHARMA_V1",
  overallScore: null as number | null,
  scoreReadyCoverage: 0,
}))

vi.mock("../../data/positionDecisionRepository", () => ({
  loadPositionDecisionSettings: vi.fn().mockResolvedValue(null),
  savePositionDecisionSettings: repository.savePositionDecisionSettings,
}))
vi.mock("../../data/recommendationPolicyRepository", () => ({
  loadPortfolioProfileExposure: vi.fn().mockResolvedValue(null),
  loadRecommendationHistory: vi.fn().mockResolvedValue([]),
  loadRecommendationPolicy: vi.fn().mockImplementation(() => Promise.resolve(repository.policy)),
  recordRecommendationPreview: repository.recordRecommendationPreview,
}))
vi.mock("./RecommendationInterpretationPanel", () => ({ RecommendationInterpretationPanel: () => null }))
vi.mock("./useSecurityScoring", () => ({
  useSecurityScoring: () => ({
    data: {
      profileCode: repository.profileCode,
      profileName: repository.profileName,
      profileSource: "REVIEWED_ASSIGNMENT",
      modelName: "PortfolioAI Stock Score V1",
      modelStatus: "DRAFT",
      runState: null,
      overallScore: repository.overallScore,
      evidenceCoverage: .12,
      scoreReadyCoverage: repository.scoreReadyCoverage,
      evidenceConfidence: 12,
      asOfDate: null,
      dimensions: [],
      ratings: [],
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

describe("PositionDecisionControls recommendation availability", () => {
  afterEach(() => { cleanup(); repository.recordRecommendationPreview.mockClear(); repository.policy = null; repository.profileCode = "PHARMA_V1"; repository.profileName = "Pharmaceuticals · PHARMA_V1"; repository.overallScore = null; repository.scoreReadyCoverage = 0 })

  it("uses the shared unavailable state and never records a recommendation while rendering", () => {
    render(<PositionDecisionControls
      portfolioId="portfolio-1"
      securityId="security-1"
      currentRole="OTHER"
      currentWeight="1.32"
      fallbackTargetWeight="2.5"
      fallbackInvestmentHorizon={null}
      currency="INR"
    />)
    const advisory = screen.getByText("PortfolioAI suggestion").closest("section")
    expect(advisory).not.toBeNull()
    expect(within(advisory!).getByText("Not ready")).toBeInTheDocument()
    expect(within(advisory!).getByText("Recommendation pending")).toBeInTheDocument()
    expect(within(advisory!).getByText("Pending")).toBeInTheDocument()
    expect(within(advisory!).getByText("Not available")).toBeInTheDocument()
    expect(within(advisory!).getByText("1.32%")).toBeInTheDocument()
    expect(within(advisory!).getByText("2.5%")).toBeInTheDocument()
    expect(within(advisory!).getByText("Other")).toBeInTheDocument()
    expect(within(advisory!).queryByText("Core candidate")).not.toBeInTheDocument()
    expect(within(advisory!).queryByText("Accumulate gradually")).not.toBeInTheDocument()
    expect(within(advisory!).queryByText("3–4%")).not.toBeInTheDocument()
    expect(screen.getByText("Awaiting recommendation policy.")).toBeInTheDocument()
    expect(screen.getByText("Awaiting allocation policy.")).toBeInTheDocument()
    expect(repository.recordRecommendationPreview).not.toHaveBeenCalled()
  })

  it("keeps the universal Decision Workspace shell while rendering a read-only sector recommendation add-on", () => {
    const addon = {
      contractVersion: "PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_V1",
      profileCode: "PHARMA_V1",
      profileLabel: "Pharmaceuticals · PHARMA_V1",
      suggestedRole: "SATELLITE_CANDIDATE" as const,
      roleLabel: "Satellite candidate",
      state: "READY" as const,
      statusLabel: "Read-only",
      detail: "Gate I3 deterministic recommendation · authoritative score 75.1575 · non-persisting",
      cautions: ["Valuation is below the PHARMA_V1 neutral anchor."],
      overallScore: 75.1575,
      policyVersion: "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
      actionUnavailableReason: "Read-only sector recommendation only. Action bias remains outside Gate I.",
      weightUnavailableReason: "Read-only sector recommendation only. Allocation guidance remains outside Gate I.",
      trackingUnavailableReason: "Recommendation persistence and transition tracking remain disabled for this read-only sector result.",
      persistenceEnabled: false as const,
      actionBiasEnabled: false as const,
      weightGuidanceEnabled: false as const,
      aiInterpretationEnabled: false as const,
    }

    render(<PositionDecisionControls
      portfolioId="portfolio-1"
      securityId="security-1"
      currentRole="CORE"
      currentWeight="1.32"
      fallbackTargetWeight="2.5"
      fallbackInvestmentHorizon={null}
      currency="INR"
      sectorRecommendationAddonEnabled
      sectorRecommendationAddon={addon}
    />)

    expect(screen.getByText("Decision Workspace")).toBeInTheDocument()
    expect(screen.getByText("Your investment plan")).toBeInTheDocument()
    expect(screen.getByText("PortfolioAI suggestion")).toBeInTheDocument()
    expect(screen.getAllByText("Satellite candidate").length).toBeGreaterThan(0)
    expect(screen.getByText("Read-only")).toBeInTheDocument()
    expect(screen.getByText("Valuation is below the PHARMA_V1 neutral anchor.")).toBeInTheDocument()
    expect(screen.getByText("Action bias").closest("section")).toHaveTextContent("Not available")
    expect(screen.getByText("Suggested weight range").closest("section")).toHaveTextContent("Not available")
    expect(repository.recordRecommendationPreview).not.toHaveBeenCalled()
  })

  it("preserves the mature available recommendation structure", async () => {
    repository.profileCode = "BANK_NBFC"; repository.profileName = "Banks / NBFCs"; repository.overallScore = 80; repository.scoreReadyCoverage = .72
    repository.policy = { profileCode: "BANK_NBFC", policyVersion: 1, status: "DRAFT", minScoreReadyCoverage: .7, coreMinScore: 75, satelliteMinScore: 60, watchMinScore: 40, mandatoryDimensionFloors: {}, cautionRules: {}, sectorFocus: {}, persistenceRules: { upgradeConfirmations: 2, downgradeConfirmations: 2 }, weightPolicy: { singleStockMax: 8, core: { standard: [3, 4] }, highConvictionScore: 90, cautionScore: 70, momentumCautionBelow: null, riskCautionBelow: null, momentumCap: null, riskCap: null, profileConcentrationSoftCap: null, profileConcentrationHardCap: null, minProfileCoverageForConcentration: 70 }, notes: null }
    repository.recordRecommendationPreview.mockResolvedValue({ id: "tracking-1", suggestedRole: "CORE_CANDIDATE", actionBias: "ACCUMULATE", suggestedWeightMin: 3, suggestedWeightMax: 4, changeSignal: null, transitionStatus: "STABLE", persistenceCount: 4, createdAt: "2026-09-15T00:00:00Z" })
    render(<PositionDecisionControls portfolioId="portfolio-1" securityId="security-1" currentRole="CORE" currentWeight="0.53" fallbackTargetWeight="1.5" fallbackInvestmentHorizon="18" currency="INR" />)
    const advisory = screen.getByText("PortfolioAI suggestion").closest("section")
    expect(advisory).not.toBeNull()
    await waitFor(() => expect(within(advisory!).getByText("Core candidate")).toBeInTheDocument())
    expect(within(advisory!).getByText("Action bias")).toBeInTheDocument()
    expect(within(advisory!).getByText("Accumulate toward range")).toBeInTheDocument()
    expect(within(advisory!).getByText("3–4%")).toBeInTheDocument()
    expect(within(advisory!).getByText("0.53%")).toBeInTheDocument()
    expect(within(advisory!).getByText("1.5%")).toBeInTheDocument()
    expect(within(advisory!).getByText("Portfolio context")).toBeInTheDocument()
  })
})
