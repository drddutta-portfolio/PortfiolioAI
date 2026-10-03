import { describe, expect, it } from "vitest"
import { normalizeP8B3CorporateAction } from "./p8CorporateActionNormalization"

const base = {
  observationId: "obs-1",
  historicalIdentityId: "identity-1",
  identityResolutionState: "RESOLVED" as const,
  exDate: "2024-01-10",
}

describe("P8-B3 corporate-action normalization", () => {
  it("normalizes explicit cash dividend terms", () => {
    const result=normalizeP8B3CorporateAction({...base,rawPurpose:"Interim Dividend - Rs 9 Per Share",faceValue:"1"})
    expect(result.state).toBe("READY")
    expect(result.actionType).toBe("CASH_DIVIDEND")
    if(result.state==="READY") expect(result.normalizedTerms.cashDistributionPerShare).toBe("9")
  })

  it("normalizes an explicit face-value split", () => {
    const result=normalizeP8B3CorporateAction({...base,rawPurpose:"Face Value Split (Sub-Division) - From Rs 10/- Per Share To Rs 2/- Per Share",faceValue:"2"})
    expect(result.state).toBe("READY")
    if(result.state==="READY") expect(result.normalizedTerms).toMatchObject({operation:"SPLIT",oldFaceValue:"10",newFaceValue:"2"})
  })

  it("normalizes an explicit bonus ratio", () => {
    const result=normalizeP8B3CorporateAction({...base,rawPurpose:"Bonus 2:1",faceValue:"10"})
    expect(result.state).toBe("READY")
    if(result.state==="READY") expect(result.normalizedTerms).toMatchObject({bonusShares:"2",heldShares:"1"})
  })

  it("preserves complete rights terms without inventing factor economics", () => {
    const result=normalizeP8B3CorporateAction({...base,rawPurpose:"Rights 6:179 @ Premium Rs 1810/-",faceValue:"2"})
    expect(result.state).toBe("READY")
    expect(result.actionType).toBe("RIGHTS")
    if(result.state==="READY") expect(result.normalizedTerms).toMatchObject({rightsShares:"6",heldShares:"179",premiumPerShare:"1810",faceValue:"2"})
  })

  it("blocks a demerger with no successor economics", () => {
    const result=normalizeP8B3CorporateAction({...base,rawPurpose:"Demerger",faceValue:"1"})
    expect(result.state).toBe("BLOCKED")
    expect(result.actionType).toBe("DEMERGER")
  })

  it("blocks unresolved identity before any economic interpretation", () => {
    const result=normalizeP8B3CorporateAction({...base,historicalIdentityId:null,identityResolutionState:"UNRESOLVED",rawPurpose:"Bonus 1:1",faceValue:"2"})
    expect(result.state).toBe("BLOCKED")
    if(result.state==="BLOCKED") expect(result.blockerReason).toContain("UNRESOLVED")
  })

  it("is deterministic", () => {
    const input={...base,rawPurpose:"Bonus 1:1",faceValue:"2"}
    expect(normalizeP8B3CorporateAction(input)).toEqual(normalizeP8B3CorporateAction(input))
  })
})
