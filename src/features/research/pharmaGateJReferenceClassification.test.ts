import { describe, expect, it } from "vitest"
import { pharmaGateJReferenceClassification } from "./pharmaGateJReferenceClassification"

describe("Gate J reference classification registry", () => {
  it("exposes the completed G10.1 ALIVUS lock through the reusable registry", () => {
    expect(pharmaGateJReferenceClassification("alivus")).toEqual(
      expect.objectContaining({
        stage: "G10.1",
        checkpoint: "A",
        symbol: "ALIVUS",
        primary: "API_BULK_DRUGS",
        emergingWatches: ["CDMO_CRAMS"],
        unresolvedExposures: [],
        lockMode: "NEW_LOCK",
      }),
    )
  })

  it("exposes G10.2 AUROPHARMA as a re-confirmation without resolving Biosimilars", () => {
    expect(pharmaGateJReferenceClassification("auropharma")).toEqual(
      expect.objectContaining({
        stage: "G10.2",
        checkpoint: "A",
        symbol: "AUROPHARMA",
        primary: "GLOBAL_GENERICS",
        emergingWatches: ["API_BULK_DRUGS"],
        unresolvedExposures: ["BIOPHARMA_BIOSIMILARS"],
        lockMode: "RECONFIRM_EXISTING_LOCK",
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
