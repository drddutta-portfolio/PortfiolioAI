import { describe, expect, it } from "vitest"
import {
  BIOCON_G10_3_CHECKPOINT_B_EVIDENCE,
  BIOCON_G10_3_MANDATORY_EVIDENCE_BLOCKERS,
} from "./bioconG103CheckpointBEvidence"

describe("BIOCON G10.3 Checkpoint B evidence", () => {
  it("retains both Material Overlays and zero numeric overlay participation", () => {
    expect(BIOCON_G10_3_CHECKPOINT_B_EVIDENCE.materialOverlays).toEqual(["GLOBAL_GENERICS", "CDMO_CRAMS"])
    expect(BIOCON_G10_3_CHECKPOINT_B_EVIDENCE.overlayNumericParticipation).toBe(false)
  })

  it("locks official FY26 Biosimilars evidence without pretending the full score is ready", () => {
    expect(BIOCON_G10_3_CHECKPOINT_B_EVIDENCE.observed.fy26.biosimilarsRevenueCr).toBe(10431)
    expect(BIOCON_G10_3_CHECKPOINT_B_EVIDENCE.observed.fy26.biosimilarsEbitdaMarginPercent).toBe(26)
    expect(BIOCON_G10_3_MANDATORY_EVIDENCE_BLOCKERS.length).toBeGreaterThan(0)
  })
})
