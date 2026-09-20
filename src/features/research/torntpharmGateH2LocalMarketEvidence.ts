import {
  evaluateDomesticMomentum,
  evaluateDomesticRisk,
} from "./pharmaDomesticGateGFinal2NumericMethodology"

export const TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION =
  "TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_V1" as const

export const TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE = {
  version: TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION,
  sourceEnvironment: "LOCAL_SUPABASE" as const,
  sourceProvider: "ANGEL_ONE" as const,
  asOfDate: "2026-09-17" as const,
  stockHistoryObservations: 270,
  benchmarkHistoryObservations: 270,
  commonDailyReturnsForVolatility: 247,
  absolute12mPercent: 35.67303918820428,
  absolute6mPercent: 13.34363730360633,
  relativeStrength12mPercent: 17.352467388794764,
  maxDrawdown1YAbsolutePercent: 10.31938821412506,
  maxDrawdown1YSignedPercent: -10.31938821412506,
  stockVolatility1YPercent: 22.000329583984765,
  benchmarkVolatility1YPercent: 13.720605,
  relativeVolatilityRatio: 1.603452,
  regulatoryContextScore: 100,
  persistenceApproved: false,
  productionEvidenceWritePerformed: false,
} as const

export const TORNTPHARM_GATE_H2_MOMENTUM_READ_ONLY_RESULT =
  evaluateDomesticMomentum({
    absolute12mPercent:
      TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.absolute12mPercent,
    absolute6mPercent:
      TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.absolute6mPercent,
    relativeStrength12mPercent:
      TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.relativeStrength12mPercent,
  })

export const TORNTPHARM_GATE_H2_RISK_READ_ONLY_RESULT =
  evaluateDomesticRisk({
    regulatoryContextScore:
      TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.regulatoryContextScore,
    maxDrawdown1YPercent:
      TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.maxDrawdown1YSignedPercent,
    relativeVolatilityRatio:
      TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.relativeVolatilityRatio,
  })
