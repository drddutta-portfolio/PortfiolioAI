#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

const input = JSON.parse(readFileSync(0, "utf8"))
const outputPath = resolve(process.argv[2] ?? "docs/p7-ic/PortfolioAI_P7_IC0_PORTFOLIO_COVERAGE_MATRIX_2026-09-28.json")

const bySymbol = new Map()
for (const text of input.structureRows ?? []) {
  if (typeof text !== "string") continue
  const lines = text.split("\n").map((value) => value.trim()).filter(Boolean)
  const marketValueIndex = lines.indexOf("Market value")
  const classification = marketValueIndex > 0 ? lines[marketValueIndex - 1] : "Sector unavailable · Industry unavailable"
  const [sectorText, industryText] = classification.split("·").map((value) => value.trim())
  const instrument = lines[2]?.split("·").map((value) => value.trim()) ?? []
  const weightMatch = lines[6]?.match(/^([0-9.]+)%\s*\/\s*(.+)$/)
  bySymbol.set(lines[0], {
    company: lines[1] ?? lines[0],
    exchange: instrument[0] ?? null,
    assetClass: instrument[1] ?? null,
    ownerRole: lines[3] ?? null,
    currentWeightPct: weightMatch ? Number(weightMatch[1]) : null,
    targetWeightPct: weightMatch && weightMatch[2] !== "Unavailable" ? Number(weightMatch[2].replace("%", "")) : null,
    sector: sectorText === "Sector unavailable" ? null : sectorText,
    industry: industryText === "Industry unavailable" ? null : industryText,
    marketValueDisplay: marketValueIndex >= 0 ? lines[marketValueIndex + 1] ?? null : null,
    investmentHorizon: lines[marketValueIndex + 2] === "Horizon unset" ? null : lines[marketValueIndex + 2] ?? null,
  })
}

const researchBySecurity = new Map()
for (const row of input.researchRows ?? []) {
  const securityId = row.href?.split("/").pop()
  const parts = row.text.split("\t").map((value) => value.trim()).filter(Boolean)
  const headerLines = parts[1]?.split("\n").map((value) => value.trim()).filter(Boolean) ?? []
  const roleAndSector = headerLines.at(-1)?.split(/\s(?:·|�)\s/u).map((value) => value.trim()) ?? []
  if (!securityId) continue
  researchBySecurity.set(securityId, {
    overall: parts[2] ?? "UNKNOWN",
    identity: parts[3] ?? "UNKNOWN",
    fundamentals: parts[4] ?? "UNKNOWN",
    ownership: parts[5] ?? "UNKNOWN",
    valuation: parts[6] ?? "UNKNOWN",
    documents: parts[7] ?? "UNKNOWN",
    issueSummary: parts[8] ?? null,
    latestEvidenceDisplay: parts[9] ?? null,
    company: headerLines.length >= 3 ? headerLines.at(-2) : null,
    ownerRole: roleAndSector[0] ?? null,
  })
}

const registryBySecurity = new Map((input.registry?.records ?? []).map((record) => [record.securityId, record]))
const records = (input.terminalRows ?? []).map((row) => {
  const terminal = typeof row.raw_payload === "string" ? JSON.parse(row.raw_payload) : row.raw_payload
  const securityId = terminal.security_id
  const symbol = terminal.symbol
  const structure = bySymbol.get(symbol) ?? {}
  const research = researchBySecurity.get(securityId) ?? {}
  const registry = registryBySecurity.get(securityId) ?? {}
  const isEquity = terminal.asset_class === "EQUITY"
  const methodologyState = terminal.methodology?.state ?? "UNKNOWN"
  const currentBlocker = isEquity
    ? terminal.r6?.reason_codes?.[0] ?? terminal.methodology?.reason ?? "CURRENT_ASSESSMENT_NOT_READY"
    : "NOT_APPLICABLE_NON_EQUITY"
  const nextAction = !isEquity
    ? "NO_ACTION_NON_EQUITY_NOT_APPLICABLE"
    : methodologyState === "RESOLVED"
      ? "IC2_CACHE_FIRST_EVIDENCE_REMEDIATION_AFTER_IC_B"
      : "IC1_METHODOLOGY_OR_POLICY_REMEDIATION_AFTER_IC_A"

  return {
    identity: {
      securityId,
      symbol,
      company: structure.company ?? research.company ?? symbol,
      exchange: structure.exchange ?? null,
      assetClass: terminal.asset_class,
    },
    classification: {
      sector: terminal.input_lineage?.sector ?? structure.sector ?? null,
      industry: terminal.input_lineage?.industry ?? structure.industry ?? null,
      basicIndustry: null,
      authority: "CANONICAL_SECURITY_ENRICHMENT_READ_MODEL",
      version: terminal.contracts?.routing ?? null,
      conflictOrReviewState: research.overall === "Conflicting" || research.overall === "Review Required" ? research.overall : null,
    },
    methodology: {
      family: terminal.methodology?.engine_code ?? null,
      profile: terminal.methodology?.profile_code ?? null,
      subprofile: terminal.assignment?.role ?? null,
      role: terminal.assignment?.role ?? null,
      assignmentSource: terminal.assignment?.id ? "REVIEWED_ASSIGNMENT" : null,
      assignmentVersion: terminal.assignment?.version ?? null,
      lifecycle: methodologyState,
      available: methodologyState === "RESOLVED",
      recommendationPolicyAvailable: terminal.r7?.disposition === "RECOMMENDATION_READY",
      reason: terminal.methodology?.reason ?? null,
    },
    evidence: {
      coverage: research.overall ?? registry.fundamentalsCoverage?.state ?? "UNKNOWN",
      requiredEvidenceCount: null,
      freshRequiredEvidence: null,
      staleRequiredEvidence: null,
      missingRequiredEvidence: null,
      conflictingEvidence: registry.fundamentalsCoverage?.hasConflictingEvidence ?? null,
      reviewRequiredEvidence: research.overall === "Review Required",
      mostRecentAsOfDate: registry.fundamentalsCoverage?.latestDecisionAt ?? null,
      mostRecentRetrievalDate: registry.fundamentalsCoverage?.latestDecisionAt ?? input.registry?.generatedAt ?? null,
      freshnessStatus: research.overall ?? "UNKNOWN",
      sourceBreakdown: {
        identity: research.identity ?? registry.identityCoverage?.state ?? "UNKNOWN",
        fundamentals: research.fundamentals ?? registry.fundamentalsCoverage?.state ?? "UNKNOWN",
        ownership: research.ownership ?? registry.ownershipCoverage?.state ?? "UNKNOWN",
        valuation: research.valuation ?? "UNKNOWN",
        documents: research.documents ?? registry.documentsCoverage?.state ?? "UNKNOWN",
      },
      observationCount: registry.fundamentalsCoverage?.observationCount ?? 0,
      selectedDecisionCount: registry.fundamentalsCoverage?.selectedDecisionCount ?? 0,
    },
    marketHistory: {
      securityReadiness: registry.marketHistoryCoverage?.state ?? "UNKNOWN",
      candleCount: registry.marketHistoryCoverage?.candleCount ?? 0,
      firstCandleAt: registry.marketHistoryCoverage?.firstCandleAt ?? null,
      latestCandleAt: registry.marketHistoryCoverage?.latestCandleAt ?? null,
      latestRetrievedAt: registry.marketHistoryCoverage?.latestRetrievedAt ?? null,
      benchmarkIdentity: null,
      benchmarkReadiness: "NOT_EXPOSED_BY_CURRENT_PORTFOLIO_REGISTRY",
      momentumReadiness: "BLOCKED_PENDING_CURRENT_SNAPSHOT_AND_BENCHMARK",
      volatilityReadiness: "BLOCKED_PENDING_CURRENT_SNAPSHOT_AND_BENCHMARK",
      drawdownReadiness: "BLOCKED_PENDING_CURRENT_SNAPSHOT_AND_BENCHMARK",
    },
    snapshot: {
      exists: false,
      asOfDate: null,
      lineageFingerprint: null,
      blocker: isEquity ? "CANONICAL_P5_SCORE_INPUT_SNAPSHOT_NOT_MATERIALIZED" : "NOT_APPLICABLE_NON_EQUITY",
    },
    r6: {
      state: terminal.r6?.disposition ?? "UNKNOWN",
      currentScoreRunExists: Boolean(terminal.r6?.score_run_id),
      score: terminal.r6?.score ?? null,
      asOfDate: null,
      methodologyVersion: terminal.contracts?.r6_execution ?? null,
      blocker: terminal.r6?.reason_codes ?? [],
    },
    r7: {
      state: terminal.r7?.disposition ?? "UNKNOWN",
      suggestedRole: terminal.r7?.recommendation ?? null,
      recommendationPolicyVersion: terminal.contracts?.r7_execution ?? null,
      blocker: terminal.r7?.reason_codes ?? [],
      sizingState: terminal.sizing?.disposition ?? "UNKNOWN",
      sizingBlocker: terminal.sizing?.reason_codes ?? [],
    },
    r8: {
      coreHealth: isEquity ? "BLOCKED_BY_CURRENT_R6_R7" : "NOT_APPLICABLE",
      portfolioFit: isEquity ? "BLOCKED_BY_CURRENT_R6_R7" : "NOT_APPLICABLE",
      portfolioRisk: isEquity ? "BLOCKED_BY_CURRENT_R6_R7" : "NOT_APPLICABLE",
      exitIntelligence: isEquity ? "BLOCKED_BY_CURRENT_R6_R7" : "NOT_APPLICABLE",
      persistence: "READ_ONLY_RECOMPUTE_NO_DEDICATED_TABLE",
    },
    r9: {
      state: isEquity ? "SESSION_ONLY_NO_DURABLE_BASELINE" : "NOT_APPLICABLE",
      historicalComparisonAvailable: false,
      blocker: isEquity ? "DURABLE_R9_BASELINE_NOT_PERSISTED" : "NOT_APPLICABLE_NON_EQUITY",
    },
    movement: {
      state: isEquity ? "NOT_AVAILABLE" : "NOT_APPLICABLE",
      requiredHistoryAvailable: false,
      persistenceCapability: "NO_MOVEMENT_PROMOTION_DEMOTION_HISTORY_TABLE",
      blocker: isEquity ? "MULTI_PERIOD_MOVEMENT_PERSISTENCE_NOT_PRESENT" : "NOT_APPLICABLE_NON_EQUITY",
    },
    r10: {
      state: isEquity ? "UPSTREAM_BLOCKED_RECOMPUTE_ONLY" : "NOT_APPLICABLE",
      attentionReason: currentBlocker,
      crossSurfaceAuthority: "PROGRAM_C_R10_SHARED_LIVE_ENGINE",
    },
    owner: {
      role: structure.ownerRole ?? research.ownerRole ?? null,
      currentPortfolioWeightPct: structure.currentWeightPct ?? null,
      targetWeightPct: structure.targetWeightPct ?? null,
      targetPrice: null,
      stopLoss: null,
      investmentHorizon: structure.investmentHorizon ?? null,
    },
    finalDisposition: {
      deepestCurrentValidEngine: terminal.r7?.disposition === "RECOMMENDATION_READY" ? "R7" : terminal.r6?.disposition === "SCORED" ? "R6" : "P5_TERMINAL_DISPOSITION",
      currentCanonicalBlocker: currentBlocker,
      responsibleCheckpoint: methodologyState === "RESOLVED" ? "IC2" : isEquity ? "IC1" : "NONE",
      nextCanonicalAction: nextAction,
    },
    lineage: {
      p5TerminalRetrievedAt: row.retrieved_at,
      p4PayloadHash: terminal.input_lineage?.p4_payload_hash ?? null,
      sourceCommit: terminal.source_commit ?? null,
      referenceOutputsPromoted: terminal.r6?.reference_outputs_promoted ?? false,
    },
  }
})

const countBy = (selector) => records.reduce((counts, record) => {
  const value = selector(record) ?? "UNKNOWN"
  counts[value] = (counts[value] ?? 0) + 1
  return counts
}, {})

const equities = records.filter((record) => record.identity.assetClass === "EQUITY")
const reusableCache = equities.filter((record) => record.evidence.observationCount > 0).length
const output = {
  contract: "PORTFOLIOAI_P7_IC0_PORTFOLIO_COVERAGE_MATRIX_V1",
  generatedAt: input.capturedAt,
  environment: {
    branch: "PortfolioAI-Development",
    developmentHead: input.developmentHead,
    supabaseProjectRef: "lrgpjimipfkyoqbpsqzz",
    portfolioId: input.portfolioId,
    providerCalls: input.registry?.providerCalls ?? null,
    budgetConsumed: input.registry?.budgetConsumed ?? null,
    databaseWrites: 0,
    productionChanges: 0,
  },
  totals: {
    openHoldings: records.length,
    equities: equities.length,
    nonEquities: records.length - equities.length,
  },
  summaries: {
    methodology: countBy((record) => record.methodology.lifecycle),
    evidence: countBy((record) => record.evidence.coverage),
    r6: countBy((record) => record.r6.state),
    r7: countBy((record) => record.r7.state),
    sizing: countBy((record) => record.r7.sizingState),
    marketHistory: countBy((record) => record.marketHistory.securityReadiness),
    r8: countBy((record) => record.r8.coreHealth),
    r9: countBy((record) => record.r9.state),
    movement: countBy((record) => record.movement.state),
    r10: countBy((record) => record.r10.state),
  },
  providerRemediationForecast: {
    providerCallsExecuted: 0,
    equitiesPotentiallyRequiringTrendlyne: equities.filter((record) => record.evidence.coverage !== "Fresh").length,
    equitiesWithReusableFundamentalCache: reusableCache,
    exactExecutableBatchDeferredUntil: "IC2_AFTER_IC_B",
    planningCeilingCallsPerDay: 320,
    reserveCallsPerDay: 80,
    conservativeWorstCaseCalls: equities.length * 5,
    conservativeNominalProviderDays: Math.ceil((equities.length * 5) / 320),
  },
  limitations: [
    "Methodology-specific required-evidence counts are not exposed by the current portfolio registry, so per-security required/fresh/stale/missing counts remain null rather than fabricated.",
    "Basic-industry is not persisted in the P5 terminal record and is left null.",
    "Current owner target price and stop-loss are not exposed by the audited read models and are left null.",
    "R9 is session-only and Movement has no durable persistence; IC0 records those capabilities as unavailable rather than ready.",
  ],
  records,
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ outputPath, totals: output.totals, summaries: output.summaries, providerRemediationForecast: output.providerRemediationForecast }, null, 2))
