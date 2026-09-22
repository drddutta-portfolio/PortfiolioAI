import { describe, expect, it } from "vitest"
import {
  CONSUMER_FMCG_K4B_SAFETY,
  consumerFmcgK4bSignalRules,
  scoreConsumerFmcgK4b,
} from "./consumerFmcgK4bScoringMethodology"

function readySignals(score = 70) {
  return [
    ...consumerFmcgK4bSignalRules().map((rule) => ({
      signalCode: rule.signalCode,
      normalizedScore: score,
      observationCount: rule.minimumObservations,
      state: "FRESH" as const,
    })),
    {
      signalCode: "PRODUCT_CATEGORY_METADATA",
      normalizedScore: null,
      observationCount: 1,
      state: "FRESH" as const,
    },
  ]
}

describe("CONSUMER_FMCG K4 Checkpoint B deterministic scoring", () => {
  it("scores branded FMCG deterministically and symbol-independently", () => {
    const a = scoreConsumerFmcgK4b({
      securitySymbol: "HINDUNILVR",
      industry: "Personal Care / Household Products",
      signals: readySignals(77),
    })
    const b = scoreConsumerFmcgK4b({
      securitySymbol: "FUTUREFMCG",
      industry: "Packaged Foods",
      signals: readySignals(77),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(77)
    expect(b.overallScore).toBe(77)
  })

  it("requires product-category metadata", () => {
    const result = scoreConsumerFmcgK4b({
      securitySymbol: "LTFOODS",
      industry: "Packaged Foods",
      signals: readySignals(74).filter((signal) => signal.signalCode !== "PRODUCT_CATEGORY_METADATA"),
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.reasonCodes).toContain("MANDATORY_SIGNAL_NOT_READY:PRODUCT_CATEGORY_METADATA")
  })

  it("treats alcohol under the same curve but with category risk authority", () => {
    const result = scoreConsumerFmcgK4b({
      securitySymbol: "RADICO",
      industry: "Distilleries & Breweries",
      signals: readySignals(72),
    })
    expect(result.state).toBe("SCORE_READY")
    expect(CONSUMER_FMCG_K4B_SAFETY.alcoholSeparateUniversalCurve).toBe(false)
  })

  it("fails closed when cash/working-capital evidence is missing", () => {
    const result = scoreConsumerFmcgK4b({
      securitySymbol: "VBL",
      industry: "Beverages",
      signals: readySignals(75).filter(
        (signal) => signal.signalCode !== "CFO_OR_FCF_CONVERSION_AND_WORKING_CAPITAL",
      ),
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("returns METHOD_NOT_AVAILABLE for unsupported Industry", () => {
    expect(scoreConsumerFmcgK4b({
      securitySymbol: "UNKNOWN",
      industry: "Steel",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("remains read-only and non-persisting", () => {
    expect(CONSUMER_FMCG_K4B_SAFETY.productCategoryMetadataRequired).toBe(true)
    expect(CONSUMER_FMCG_K4B_SAFETY.noMissingInputRenormalization).toBe(true)
    expect(CONSUMER_FMCG_K4B_SAFETY.runtimeSymbolSpecific).toBe(false)
    expect(CONSUMER_FMCG_K4B_SAFETY.writes).toBe(0)
  })
})
