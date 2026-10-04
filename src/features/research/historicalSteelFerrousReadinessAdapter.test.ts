import { describe, expect, it } from "vitest"
import {
  routeHistoricalResearchProfileV1,
  routeResearchProfileV1,
  type HistoricalResearchProfileRoutingInput,
} from "./researchProfileRouting"
import { assessHistoricalSteelFerrousReadiness } from "./historicalSteelFerrousReadinessAdapter"
import {
  METALS_COMMODITIES_K4B_READINESS_ONLY_SIGNALS,
  metalsCommoditiesK4bSignalRules,
} from "./metalsCommoditiesK4bScoringMethodology"

const baseRoute: HistoricalResearchProfileRoutingInput = {
  assetClass: "EQUITY",
  decisionAt: "2024-11-29T10:00:00+00:00",
  sourceDisseminatedAt: "2024-05-31T09:27:01+00:00",
  classificationState: "AUTHORITATIVE_COMPLETE",
  taxonomyVersion: "NSE_NOVEMBER_2022",
  economicHierarchy: {
    macroEconomicSectorCode: "IN07",
    macroEconomicSectorName: "Industrials",
    sectorCode: "IN0702",
    sectorName: "Capital Goods",
    industryCode: "IN070205",
    industryName: "Industrial Products",
    basicIndustryCode: "IN070205015",
    basicIndustryName: "Iron & Steel Products",
  },
  accountingContractBlob: "45e990981371dba217d12c430f8ce567acbf25fc",
  periodSemanticsBlob: "797b7e91d7770f3377d0061ee338c76e8220391f",
}

describe("P8 historical Steel-Ferrous integration", () => {
  it("routes only the exact approved Basic Industry into the locked STEEL_FERROUS profile", () => {
    expect(routeHistoricalResearchProfileV1(baseRoute)).toMatchObject({
      state: "ROUTED",
      profileCode: "STEEL_FERROUS",
      basis: "EXACT_HISTORICAL_BASIC_INDUSTRY",
      reasonCode: "P8_HISTORICAL_IN070205015_STEEL_FERROUS",
    })
  })

  it("preserves the official economic hierarchy instead of rewriting it to Metals & Mining", () => {
    const routed = routeHistoricalResearchProfileV1(baseRoute)
    expect(routed.economicHierarchy.sectorName).toBe("Capital Goods")
    expect(routed.economicHierarchy.industryName).toBe("Industrial Products")
    expect(routed.economicHierarchy.basicIndustryName).toBe("Iron & Steel Products")
  })

  it("rejects broad Industrial Products without the exact Basic Industry", () => {
    expect(routeHistoricalResearchProfileV1({
      ...baseRoute,
      economicHierarchy: {
        ...baseRoute.economicHierarchy,
        basicIndustryCode: "IN070205",
        basicIndustryName: "Industrial Products",
      },
    })).toMatchObject({
      state: "REVIEW_REQUIRED",
      profileCode: null,
      reasonCode: "EXACT_IN070205015_BASIC_INDUSTRY_REQUIRED",
    })
  })

  it("rejects partial or conditional classifications", () => {
    expect(routeHistoricalResearchProfileV1({ ...baseRoute, classificationState: "PARTIAL" })).toMatchObject({
      state: "REVIEW_REQUIRED",
      reasonCode: "AUTHORITATIVE_COMPLETE_CLASSIFICATION_REQUIRED",
    })
    expect(routeHistoricalResearchProfileV1({ ...baseRoute, classificationState: "CONDITIONAL" })).toMatchObject({
      state: "REVIEW_REQUIRED",
      reasonCode: "AUTHORITATIVE_COMPLETE_CLASSIFICATION_REQUIRED",
    })
  })

  it("rejects future or same-instant evidence", () => {
    expect(routeHistoricalResearchProfileV1({
      ...baseRoute,
      sourceDisseminatedAt: baseRoute.decisionAt,
    })).toMatchObject({
      state: "REVIEW_REQUIRED",
      reasonCode: "FUTURE_OR_SAME_INSTANT_SOURCE_REJECTED",
    })
    expect(routeHistoricalResearchProfileV1({
      ...baseRoute,
      sourceDisseminatedAt: "2024-12-01T00:00:00+00:00",
    })).toMatchObject({
      state: "REVIEW_REQUIRED",
      reasonCode: "FUTURE_OR_SAME_INSTANT_SOURCE_REJECTED",
    })
  })

  it("leaves current/live routing behavior unchanged", () => {
    expect(routeResearchProfileV1({
      assetClass: "EQUITY",
      applicationSector: "Capital Goods",
      applicationIndustry: "Industrial Products",
    })).toMatchObject({
      state: "ROUTED",
      profileCode: "CAPITAL_EQUIPMENT_ELECTRICAL",
    })
  })

  it("fails input readiness closed when no historical normalized signals are provided", () => {
    const readiness = assessHistoricalSteelFerrousReadiness({ route: baseRoute, signals: [] })
    expect(readiness).toMatchObject({
      state: "INPUTS_INCOMPLETE",
      profileCode: "STEEL_FERROUS",
      engineCode: "METALS_COMMODITIES",
      providerCalls: 0,
      writes: 0,
    })
    expect(readiness.signalReadiness).toHaveLength(
      metalsCommoditiesK4bSignalRules("STEEL_FERROUS").length + METALS_COMMODITIES_K4B_READINESS_ONLY_SIGNALS.length,
    )
    expect(readiness.signalReadiness.every((signal) => signal.state === "MISSING")).toBe(true)
  })

  it("rejects future signal evidence and authority mismatches", () => {
    const rule = metalsCommoditiesK4bSignalRules("STEEL_FERROUS")[0]!
    const readiness = assessHistoricalSteelFerrousReadiness({
      route: baseRoute,
      signals: [{
        signalCode: rule.signalCode,
        normalizedScore: 50,
        observationCount: rule.minimumObservations,
        state: "FRESH",
        evidenceAsOf: "2024-12-01T00:00:00+00:00",
        normalizationAuthority: rule.normalizationAuthority,
      }],
    })
    expect(readiness.signalReadiness.find((signal) => signal.signalCode === rule.signalCode)?.state).toBe("FUTURE_EVIDENCE")
  })

  it("can validate a fully explicit fixture without network, writes, or a live-cache fallback", () => {
    const evidenceAsOf = "2024-11-28T00:00:00+00:00"
    const signals = [
      ...metalsCommoditiesK4bSignalRules("STEEL_FERROUS").map((rule) => ({
        signalCode: rule.signalCode,
        normalizedScore: 50,
        observationCount: rule.minimumObservations,
        state: "FRESH" as const,
        evidenceAsOf,
        normalizationAuthority: rule.normalizationAuthority,
      })),
      ...METALS_COMMODITIES_K4B_READINESS_ONLY_SIGNALS.map((gate) => ({
        signalCode: gate.signalCode,
        normalizedScore: null,
        observationCount: gate.minimumObservations,
        state: "FRESH" as const,
        evidenceAsOf,
        normalizationAuthority: "METALS_COMMODITIES_K4A_METHODOLOGY_V1:COMMODITY_EXPOSURE_METADATA",
      })),
    ]
    expect(assessHistoricalSteelFerrousReadiness({ route: baseRoute, signals })).toMatchObject({
      state: "INPUTS_COMPLETE",
      providerCalls: 0,
      writes: 0,
    })
  })
})
