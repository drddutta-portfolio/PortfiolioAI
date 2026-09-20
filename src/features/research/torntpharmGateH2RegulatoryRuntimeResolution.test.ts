import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING,
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT,
} from "./torntpharmGateGFinal3RuntimeMapping"

describe("TORNTPHARM Gate H2 regulatory runtime resolution", () => {
  it("establishes current company-wide regulated US manufacturing scope", () => {
    expect(
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING
        .companyWideCurrentRegulatoryScopeEstablished,
    ).toBe(true)
    expect(
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.runtimeInput
        .regulatoryMateriality,
    ).toBe("KNOWN_MATERIAL")
    expect(
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.runtimeInput
        .subsequentOutcomeEstablished,
    ).toBe(true)
  })

  it("resolves the runtime to CLEAR while retaining the historical Indrad event", () => {
    expect(TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.gateState).toBe("CLEAR")
    expect(TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.blocksPreview).toBe(false)
    expect(TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.historicalEventRetained).toBe(true)
  })

  it("does not add a second hidden regulatory penalty", () => {
    expect(
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.additionalNumericPenalty,
    ).toBeNull()
    expect(TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.highRiskCapValue).toBeNull()
  })
})
