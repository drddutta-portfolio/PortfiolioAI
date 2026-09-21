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
    expect(pharmaGateJReferenceClassification("biocon")?.materialOverlays).toEqual(["CDMO_CRAMS", "GLOBAL_GENERICS"])
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

  it("exposes G10.3 BIOCON as a new Biosimilars lock with two Material Overlays", () => {
    expect(pharmaGateJReferenceClassification("biocon")).toEqual(
      expect.objectContaining({
        stage: "G10.3",
        checkpoint: "A",
        symbol: "BIOCON",
        primary: "BIOPHARMA_BIOSIMILARS",
        emergingWatches: [],
        unresolvedExposures: [],
        lockMode: "NEW_LOCK",
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
