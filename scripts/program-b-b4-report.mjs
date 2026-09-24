import { createServer } from "vite"

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true },
  logLevel: "error",
})

try {
  const module = await server.ssrLoadModule("/src/features/research/programBR7Execution.ts")
  const references = module.buildProgramB4ReferenceDecisions()
  const portfolio = module.buildProgramB4FrozenPortfolioDisposition()
  const edgeCases = module.buildProgramB4SizingEdgeCases()
  const owner = module.buildProgramB4OwnerAuthorityRegression()

  const byFinalDisposition = {}
  const byRecommendationDisposition = {}
  const bySizingDisposition = {}

  for (const row of portfolio.rows) {
    byFinalDisposition[row.finalDisposition] = (byFinalDisposition[row.finalDisposition] ?? 0) + 1
    byRecommendationDisposition[row.recommendationDisposition] = (byRecommendationDisposition[row.recommendationDisposition] ?? 0) + 1
    bySizingDisposition[row.sizingDisposition] = (bySizingDisposition[row.sizingDisposition] ?? 0) + 1
  }

  process.stdout.write(JSON.stringify({
    version: portfolio.version,
    referenceCohort: references.map((row) => ({
      symbol: row.symbol,
      sourceScoreRunId: row.recommendation.sourceScoreRunId,
      sourceScore: row.recommendation.sourceScore,
      recommendationState: row.recommendation.state,
      suggestedRole: row.recommendation.suggestedRole,
      methodologyRole: row.recommendation.methodologyRole,
      recommendationRunId: row.recommendation.recommendationRunId,
      sizingState: row.sizing.state,
      finalDisposition: row.finalDisposition,
    })),
    sizingEdgeCases: edgeCases.map((row) => ({
      code: row.code,
      state: row.result.state,
      canSize: row.result.canSize,
      suggestedTargetWeight: row.result.suggestedTargetWeight,
    })),
    ownerAuthorityRegression: {
      ownerSettingsUnchanged:
        JSON.stringify(owner.ownerSettingsBefore) === JSON.stringify(owner.ownerSettingsAfter),
      ownerFieldMutationCount: owner.ownerFieldMutationCount,
      persistenceMutationCount: owner.persistenceMutationCount,
    },
    portfolioDisposition: {
      totalHoldings: portfolio.totalHoldings,
      recommendationReady: portfolio.recommendationReady,
      sizingReady: portfolio.sizingReady,
      failClosed: portfolio.failClosed,
      dispositionComplete: portfolio.dispositionComplete,
      numericRecommendationCoverageComplete: portfolio.numericRecommendationCoverageComplete,
      numericSizingCoverageComplete: portfolio.numericSizingCoverageComplete,
      byFinalDisposition,
      byRecommendationDisposition,
      bySizingDisposition,
    },
    providerCalls: portfolio.providerCalls,
    persistedWrites: portfolio.persistedWrites,
  }, null, 2) + "\n")
} finally {
  await server.close()
}
