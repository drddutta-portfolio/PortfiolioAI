import type { ProgramDR11Node } from "./programD0Contract"
import type { ProgramD1Trigger } from "./programD1Types"

const ALL_NODES: readonly ProgramDR11Node[] = [
  "R6",
  "R7",
  "R8_CORE_HEALTH",
  "R8_PORTFOLIO_FIT",
  "R8_PORTFOLIO_RISK",
  "R8_EXIT_INTELLIGENCE",
  "R9",
  "R10",
]

function dependencies(prefix: string) {
  return ALL_NODES.map((node) => ({ node, fingerprint: `${prefix}::${node}` }))
}

export const PROGRAM_D_D1_LOCAL_FIXTURES = [
  {
    code: "UNCHANGED_INPUT_NO_OP",
    label: "Unchanged input → audited no-op",
    trigger: {
      type: "SCHEDULED_MAINTENANCE",
      scope: { portfolioId: "LOCAL_D1_PORTFOLIO", subjectIds: ["TORNTPHARM"], domains: ["FUNDAMENTALS"] },
      changedNodes: ["R6"],
      dependencyState: dependencies("SAME"),
      previousDependencyState: dependencies("SAME"),
      providerRequirements: [],
      policyVersionSet: ["R7_POLICY_V1", "R10_PRECEDENCE_V1"],
      engineVersionSet: ["R6_V1", "R8_V1", "R9_V1", "R10_V1"],
    },
  },
  {
    code: "EVIDENCE_CHANGE_DRY_RUN",
    label: "Accepted evidence change → affected DAG",
    trigger: {
      type: "CANONICAL_EVIDENCE_ACCEPTED",
      scope: { portfolioId: "LOCAL_D1_PORTFOLIO", subjectIds: ["TORNTPHARM"], domains: ["FUNDAMENTALS"] },
      changedNodes: ["R6"],
      dependencyState: dependencies("CURRENT"),
      previousDependencyState: dependencies("PREVIOUS"),
      providerRequirements: [],
      policyVersionSet: ["R7_POLICY_V1", "R10_PRECEDENCE_V1"],
      engineVersionSet: ["R6_V1", "R8_V1", "R9_V1", "R10_V1"],
    },
  },
  {
    code: "STALE_RESEARCH_PROVIDER_PLAN",
    label: "Stale research → provider plan only",
    trigger: {
      type: "CONDITION_STALENESS",
      scope: { portfolioId: "LOCAL_D1_PORTFOLIO", subjectIds: ["ALIVUS"], domains: ["FUNDAMENTALS"] },
      changedNodes: ["R6"],
      dependencyState: dependencies("STALE_CURRENT"),
      previousDependencyState: dependencies("STALE_PREVIOUS"),
      providerRequirements: [{
        provider: "TRENDLYNE",
        domain: "FUNDAMENTALS",
        subjectIds: ["ALIVUS"],
        estimatedPhysicalCalls: 1,
      }],
      policyVersionSet: ["R7_POLICY_V1", "R10_PRECEDENCE_V1"],
      engineVersionSet: ["R6_V1", "R8_V1", "R9_V1", "R10_V1"],
    },
  },
  {
    code: "MARKET_DATA_CHANGE",
    label: "Market data accepted → market-dependent planning",
    trigger: {
      type: "MARKET_DATA_ACCEPTED",
      scope: { portfolioId: "LOCAL_D1_PORTFOLIO", subjectIds: ["HDFCBANK"], domains: ["MARKET_HISTORY"] },
      changedNodes: ["R8_PORTFOLIO_RISK", "R8_EXIT_INTELLIGENCE"],
      dependencyState: dependencies("MARKET_CURRENT"),
      previousDependencyState: dependencies("MARKET_PREVIOUS"),
      providerRequirements: [],
      policyVersionSet: ["R10_PRECEDENCE_V1"],
      engineVersionSet: ["R8_V1", "R9_V1", "R10_V1"],
    },
  },
] as const satisfies readonly {
  readonly code: string
  readonly label: string
  readonly trigger: ProgramD1Trigger
}[]
