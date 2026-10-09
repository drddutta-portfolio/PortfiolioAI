import { describe, expect, it } from "vitest"
import { preflightApprovedBankDirectClaim, type DirectBankClaim } from "./v14-bank-approved-direct-preflight.ts"

const common = {
  sourceAuthority:"ISSUER_OFFICIAL" as const,
  originalContentHash:"a".repeat(64),
  originalSourceUrl:"https://example.org/bank/official-pillar3.pdf",
  issuerIsin:"INE040A01034",
  statedValue:"12.40",
  unit:"PERCENT" as const,
  periodStart:"2026-06-30",
  periodEnd:"2026-06-30",
  periodType:"REGULATORY_AS_OF" as const,
  reportingPerimeter:"Basel III regulatory standalone",
  denominatorDefinition:"risk-weighted assets",
  sourceExplicitlyCertifiesMetric:true,
  publishedAt:"2026-07-20T12:00:00Z",
  retrievedAt:"2026-07-21T12:00:00Z",
  supportingExcerpt:"Bank Basel III regulatory capital ratio as disclosed",
  baselRegime:"BASEL_III" as const,
}
const cet1:DirectBankClaim={...common,code:"CET1_RATIO",nativeField:"Basel III CET1 ratio",numeratorCapitalCategory:"CET1"}
const car:DirectBankClaim={...common,code:"CAPITAL_ADEQUACY_RATIO",nativeField:"Basel III total CRAR",numeratorCapitalCategory:"TOTAL_REGULATORY_CAPITAL"}
const nim:DirectBankClaim={...common,code:"NIM_TTM",nativeField:"Trailing four quarters net interest margin",periodStart:"2025-07-01",periodEnd:"2026-06-30",periodType:"TRAILING_FOUR_QUARTERS",denominatorDefinition:"average interest-earning assets",supportingExcerpt:"TTM net interest income over the average interest-earning assets"}
const roa:DirectBankClaim={...common,code:"ROA_ANNUAL",nativeField:"Annual Return on Assets",periodStart:"2025-04-01",periodEnd:"2026-03-31",periodType:"FULL_FINANCIAL_YEAR",denominatorDefinition:"average total assets",reportingPerimeter:"audited standalone",supportingExcerpt:"Audited full-year return on assets"}
describe("owner-approved M1-M4 DIRECT evidence preflight, never factual ACCEPT",()=>{
  it("admits only source-qualified semantic candidates to separate factual review",()=>{
    for(const row of [nim,cet1,car,roa])expect(preflightApprovedBankDirectClaim(row)).toEqual({qualifiedForFactualReview:true,reasons:[]})
  })
  it("rejects annual NIM used as NIM_TTM",()=>{
    const r=preflightApprovedBankDirectClaim({...nim,periodType:"FULL_FINANCIAL_YEAR",nativeField:"Annual NIM"})
    expect(r.qualifiedForFactualReview).toBe(false)
    expect(r.reasons).toContain("TTM_NIM_EXPLICIT_BASIS_REQUIRED")
  })
  it("rejects Tier 1 or Basel II masquerading as CET1",()=>{
    expect(preflightApprovedBankDirectClaim({...cet1,numeratorCapitalCategory:"TIER_1"}).reasons).toContain("CET1_NOT_TIER1_REQUIRED")
    expect(preflightApprovedBankDirectClaim({...cet1,baselRegime:"BASEL_II"}).reasons).toContain("BASEL_III_REGULATORY_BASIS_REQUIRED")
  })
  it("rejects Basel II total or CET1-only as total CAR",()=>{
    expect(preflightApprovedBankDirectClaim({...car,baselRegime:"BASEL_II"}).qualifiedForFactualReview).toBe(false)
    expect(preflightApprovedBankDirectClaim({...car,numeratorCapitalCategory:"CET1"}).reasons).toContain("TOTAL_REGULATORY_CAPITAL_REQUIRED")
  })
  it("rejects quarterly annualized or undated ROA",()=>{
    expect(preflightApprovedBankDirectClaim({...roa,periodType:"REGULATORY_AS_OF"}).reasons).toContain("AUDITED_FULL_YEAR_ROA_BASIS_REQUIRED")
    expect(preflightApprovedBankDirectClaim({...roa,periodEnd:"2026-06-99"}).reasons).toContain("SOURCE_PERIOD_UNPROVEN")
  })
  it("requires original source, denominator, source dates and actual excerpt",()=>{
    const r=preflightApprovedBankDirectClaim({...cet1,originalContentHash:"",denominatorDefinition:"",supportingExcerpt:"",publishedAt:"2026-07-23T12:00:00Z"})
    expect(r.qualifiedForFactualReview).toBe(false)
    expect(r.reasons).toContain("ORIGINAL_HASH_REQUIRED")
    expect(r.reasons).toContain("SCOPE_OR_DENOMINATOR_MISSING")
    expect(r.reasons).toContain("DIRECT_SOURCE_FRAGMENT_REQUIRED")
    expect(r.reasons).toContain("PUBLICATION_LINEAGE_INVALID")
  })
  it("has no READY or ACCEPTED output",()=>{
    const result=preflightApprovedBankDirectClaim(cet1)
    expect(Object.keys(result)).toEqual(["qualifiedForFactualReview","reasons"])
  })
})
