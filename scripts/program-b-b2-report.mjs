import { createServer } from "vite"

const server = await createServer({ appType: "custom", server: { middlewareMode: true }, logLevel: "error" })
try {
  const module = await server.ssrLoadModule("/src/features/research/programBR6Execution.ts")
  const cohort = module.buildProgramB2ControlledCohort()
  const portfolio = module.buildProgramB2FrozenPortfolioDisposition()
  const states = {}
  for (const row of portfolio.rows) states[row.dispositionState] = (states[row.dispositionState] ?? 0) + 1

  process.stdout.write(JSON.stringify({
    version: portfolio.version,
    sourceSnapshotVersion: portfolio.sourceSnapshotVersion,
    referenceCohort: cohort.references.map((row) => ({
      symbol: row.symbol,
      methodologyRole: row.methodologyRole,
      dispositionState: row.dispositionState,
      overallScore: row.overallScore,
      reasonCodes: row.reasonCodes,
    })),
    unsupportedControl: cohort.unsupportedControl,
    nonEquityControl: cohort.nonEquityControl,
    portfolioDisposition: {
      totalHoldings: portfolio.totalHoldings,
      scored: portfolio.scored,
      failClosed: portfolio.failClosed,
      dispositionComplete: portfolio.dispositionComplete,
      numericCoverageComplete: portfolio.numericCoverageComplete,
      byState: states,
    },
    providerCalls: 0,
  }, null, 2) + "\n")
} finally {
  await server.close()
}
