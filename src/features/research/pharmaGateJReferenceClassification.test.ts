import { describe, expect, it } from "vitest"
import { pharmaGateJReferenceClassification } from "./pharmaGateJReferenceClassification"

describe("Gate J reference classification registry", () => {
  it("exposes the G10.1 ALIVUS review through a reusable sector add-on registry", () => {
    expect(pharmaGateJReferenceClassification("alivus")).toEqual(
      expect.objectContaining({
        stage: "G10.1",
        checkpoint: "A",
        symbol: "ALIVUS",
        primary: "API_BULK_DRUGS",
        emergingWatches: ["CDMO_CRAMS"],
        scoreExecutionEnabled: false,
        recommendationExecutionEnabled: false,
        persistenceEnabled: false,
      }),
    )
  })

  it("does not add reference-review UI state to unrelated companies", () => {
    expect(pharmaGateJReferenceClassification("TORNTPHARM")).toBeNull()
    expect(pharmaGateJReferenceClassification("HDFCBANK")).toBeNull()
  })
})
