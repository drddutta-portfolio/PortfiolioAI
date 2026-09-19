import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { PHARMA_G8_3_PORTABILITY_VALIDATION } from "./pharmaG8PortabilityIsolationValidation"
import { PHARMA_G8_RESEARCH_GAP_REGISTER } from "./pharmaG8ResearchGapRegister"

describe("G8.3 portability, isolation and leakage validation", () => {
  it("passes all twelve locked G8.3 isolation tests", () => {
    expect(PHARMA_G8_3_PORTABILITY_VALIDATION.totalCount).toBe(12)
    expect(PHARMA_G8_3_PORTABILITY_VALIDATION.passCount).toBe(12)
    expect(PHARMA_G8_3_PORTABILITY_VALIDATION.cases.every((item) => item.state === "PASS")).toBe(true)
  })

  it("proves G7.1 did not require material redesign for AUROPHARMA", () => {
    expect(PHARMA_G8_3_PORTABILITY_VALIDATION.engineChangeTest.materialRedesignRequired).toBe(false)
    expect(PHARMA_G8_3_PORTABILITY_VALIDATION.engineChangeTest.result).toBe("PORTABLE_WITHOUT_G7_1_REDESIGN")
  })

  it("extends the research-gap register instead of solving missing methodology inside G8", () => {
    expect(PHARMA_G8_RESEARCH_GAP_REGISTER.priorGaps.length).toBeGreaterThan(0)
    expect(PHARMA_G8_RESEARCH_GAP_REGISTER.auropharmaGaps.length).toBeGreaterThan(0)
    expect(PHARMA_G8_RESEARCH_GAP_REGISTER.auropharmaGaps.every(
      (gap) => gap.blocksAuropharmaOverallPreview,
    )).toBe(true)
    expect(PHARMA_G8_RESEARCH_GAP_REGISTER.auropharmaGaps.every(
      (gap) => gap.futureStage !== "CONTROLLED_EXPANSION" || gap.role !== "PRIMARY",
    )).toBe(true)
  })

  it("keeps gap records complete and stable enough for controlled follow-up", () => {
    const gaps = PHARMA_G8_RESEARCH_GAP_REGISTER.auropharmaGaps
    expect(new Set(gaps.map((gap) => gap.gapId)).size).toBe(gaps.length)
    expect(gaps.every((gap) =>
      gap.affectedSubprofile.length > 0
      && gap.role.length > 0
      && gap.dimension.length > 0
      && gap.methodologyState.length > 0
      && gap.evidenceState.length > 0
      && gap.requiredEvidenceOrDecision.length > 0
      && gap.lineage.length > 0
      && gap.revisitTrigger.length > 0
    )).toBe(true)
  })

  it("statically guards the AUROPHARMA G8 preview against mutation APIs", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./auropharmaG8SameEnginePreview.ts", import.meta.url)),
      "utf8",
    )
    for (const forbidden of [
      ".insert(",
      ".update(",
      ".upsert(",
      "refresh-security-enrichment",
      "stock_score_runs",
      "recommendation",
      "positionSizing",
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })

  it("statically verifies security-scoped research queries", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../../data/researchRepository.ts", import.meta.url)),
      "utf8",
    )
    const securityScopedQueries = source.match(/\.eq\("security_id", securityId\)/gu) ?? []
    expect(securityScopedQueries.length).toBeGreaterThanOrEqual(4)
  })

  it("keeps G8.3 non-executing, non-persisting and non-activating", () => {
    expect(PHARMA_G8_3_PORTABILITY_VALIDATION.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_G8_3_PORTABILITY_VALIDATION.persistedScoreRunEnabled).toBe(false)
    expect(PHARMA_G8_3_PORTABILITY_VALIDATION.productionActivationEnabled).toBe(false)
    expect(PHARMA_G8_RESEARCH_GAP_REGISTER.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_G8_RESEARCH_GAP_REGISTER.persistedScoreRunEnabled).toBe(false)
  })
})
