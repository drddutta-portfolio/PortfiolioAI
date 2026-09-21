import { describe, expect, it } from "vitest"
import { PHARMA_BIOSIMILARS_G10_3_METHODOLOGY } from "./pharmaBiosimilarsG103Methodology"

describe("G10.3 Biosimilars methodology candidate", () => {
  it("preserves the PHARMA_V1 spine and both Material Overlays without numeric blending", () => {
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.supportedPrimarySubprofile).toBe("BIOPHARMA_BIOSIMILARS")
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.dimensionContracts).toHaveLength(10)
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.materialOverlays).toEqual(["GLOBAL_GENERICS", "CDMO_CRAMS"])
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.materialOverlayNumericModifierApplied).toBe(false)
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.noHiddenRenormalization).toBe(true)
  })

  it("does not inherit numeric bands from another profile", () => {
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.noDomesticBandsReuse).toBe(true)
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.noApiBandsReuse).toBe(true)
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.noGlobalGenericsBandsReuse).toBe(true)
    expect(PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.noBankNbfcBandsReuse).toBe(true)
  })
})
