import { describe, it, expect } from "vitest"
import pinnedProof from "./resultsR5ComparisonProof.json"
import federalOriginal from "./resultsR5FederalOriginalComparisonProof.json"
import { buildVerifiedR5ComparisonRows, gradeR5WithVerifiedOriginal, type VerifiedR5Source } from "./resultsR5VerifiedComparison"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import type { R5IndustryCalibrations } from "./quarterlyR5Classification"

const sid="11111111-1111-4111-8111-111111111111"
const quarters=["2024-09-30","2024-12-31","2025-03-31","2025-06-30"]
const start=(date:string)=>new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7))-3,1)).toISOString().slice(0,10)
function fixture(scope:"STANDALONE"|"CONSOLIDATED",quarter:string,index:number):ResultsSourceObservation[]{
  const company=scope==="STANDALONE"?"r5-original":"canonical-original"
  const values=[String(100+index*15),String(20+index*5),String(2+index)]
  return ["OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"].map((code,i)=>({
    id:company+"-"+quarter+"-"+code,securityId:sid,code,value:values[i]!,
    unit:code==="EPS_DILUTED"?"INR_PER_SHARE":"INR_CRORE",
    periodStart:start(quarter),periodEnd:quarter,currency:"INR",scope,
    source:"COMPANY_EXCHANGE_FILING",sourceRecordId:company+"-"+quarter,
    publishedAt:null,retrievedAt:"2026-10-17T00:00:00Z",
    selected:scope==="CONSOLIDATED",
  }))
}
const proof=quarters.map(q=>{
  const originals=fixture("STANDALONE",q,quarters.indexOf(q))
  return {
    symbol:"MOCK", securityId:sid,periodEnd:q,scope:"STANDALONE",
    sourceRecordId:"r5-original-"+q,
    observations:Object.fromEntries(originals.map(r=>[r.code,r.id])),
    approval:"R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION",
  } satisfies VerifiedR5Source
})
const rows=quarters.flatMap((q,i)=>[...fixture("STANDALONE",q,i),...fixture("CONSOLIDATED",q,i)]
   .map(r=>({...r,selected:r.scope===(i%2===0?"STANDALONE":"CONSOLIDATED")})))
const calibration:R5IndustryCalibrations=new Map()

describe("R5 cryptographically source-pinned comparison-only evidence",()=>{
 it("contains uniquely identified replay-verified original trios without financial numbers",()=>{
   expect(pinnedProof.contract).toBe("R5_INDEPENDENT_ORIGINAL_COMPARISON_PROOF_V1")
   expect(pinnedProof.environment).toBe("Development")
   const sources=pinnedProof.approvedSources
   expect(sources.length).toBeGreaterThanOrEqual(100)
   expect(sources.some(x=>x.scope==="CONSOLIDATED")).toBe(true)
   expect(new Set(sources.map(x=>x.securityId+"|"+x.periodEnd+"|"+x.scope)).size).toBe(sources.length)
   for(const evidence of sources){
     expect(["STANDALONE","CONSOLIDATED"]).toContain(evidence.scope)
     expect(evidence.approval).toBe("R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION")
     expect(Object.keys(evidence.observations)).toHaveLength(3)
     expect(evidence.sourceRecordId).toMatch(/^[0-9a-f-]{36}$/)
   }
 })
 it("retains exact SHA-verified Federal Bank two-quarter R5-only original without an R4 selection mutation",()=>{
   expect(federalOriginal.contract).toBe("R5_FEDERAL_SIGNED_ISSUER_ORIGINAL_TWO_QUARTERS_V1")
   expect(federalOriginal.environment).toBe("Development")
   expect(federalOriginal.scope).toBe("CONSOLIDATED")
   expect(federalOriginal.sourceOriginalSHA256).toMatch(/^[0-9a-f]{64}$/)
   expect(federalOriginal.approvedSources).toHaveLength(2)
   expect(federalOriginal.approvedSources.map(x=>x.periodEnd).sort()).toEqual(["2024-09-30","2024-12-31"])
   expect(new Set(federalOriginal.approvedSources.map(x=>x.sourceRecordId)).size).toBe(1)
   for(const original of federalOriginal.approvedSources){
     expect(original.symbol).toBe("FEDERALBNK")
     expect(original.scope).toBe("CONSOLIDATED")
     expect(original.approval).toBe("R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION")
     expect(Object.keys(original.observations).sort()).toEqual(["EPS_DILUTED","NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER"])
     for(const id of Object.values(original.observations))expect(id).toMatch(/^[0-9a-f-]{36}$/)
   }
 })
 it("scores from an independently verified coherent standalone history while R4 remains untouched",()=>{
   const gradedBefore=gradeR5WithVerifiedOriginal(rows,sid,"2025-06-30","Capital Goods","Industrial Products",calibration,rows)
   expect(gradedBefore.status).toBe("UNAVAILABLE")
   const alternative=buildVerifiedR5ComparisonRows(rows,proof)
   expect(alternative).not.toBe(rows)
   expect(rows.filter(r=>r.selected&&r.scope==="CONSOLIDATED")).toHaveLength(6)
   expect(alternative.filter(r=>r.selected&&r.scope==="CONSOLIDATED")).toHaveLength(0)
   expect(alternative.filter(r=>r.selected&&r.scope==="STANDALONE")).toHaveLength(12)
   const graded=gradeR5WithVerifiedOriginal(rows,sid,"2025-06-30","Capital Goods","Industrial Products",calibration,alternative)
   expect(graded.status).toBe("STRONG")
   expect(graded.basis).toBe("COMPANY_TREND")
   expect(graded.explanation).toContain("canonical Results filing selections are untouched")
 })
 it("allows two independently verified scopes per issuer quarter without mixing them",()=>{
   const alternate=quarters.map((q,i)=>{
     const matching=fixture("CONSOLIDATED",q,i)
     return {symbol:"MOCK",securityId:sid,periodEnd:q,scope:"CONSOLIDATED",
       sourceRecordId:"canonical-original-"+q,
       observations:Object.fromEntries(matching.map(row=>[row.code,row.id])),
       approval:"R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION"} satisfies VerifiedR5Source
   })
   const combined=[...proof,...alternate]
   const consolidated=buildVerifiedR5ComparisonRows(rows,combined,"CONSOLIDATED")
   const standalone=buildVerifiedR5ComparisonRows(rows,combined,"STANDALONE")
   expect(consolidated.filter(r=>r.selected&&r.scope==="CONSOLIDATED")).toHaveLength(12)
   expect(standalone.filter(r=>r.selected&&r.scope==="STANDALONE")).toHaveLength(12)
   const a=gradeR5WithVerifiedOriginal(rows,sid,"2025-06-30","Capital Goods","Industrial Products",calibration,consolidated)
   const b=gradeR5WithVerifiedOriginal(rows,sid,"2025-06-30","Capital Goods","Industrial Products",calibration,standalone)
   expect(a.status).toBe("STRONG")
   expect(b.status).toBe("STRONG")
   expect(rows.filter(r=>r.selected&&r.scope==="CONSOLIDATED")).toHaveLength(6)
 })
 it("fails closed when any verified original hash-bound ID or scope is different",()=>{
   const altered=proof.map(x=>x.periodEnd==="2024-12-31"?
      {...x,observations:{...x.observations,NET_PROFIT_QUARTER:"unverified-foreign-observation"}}:x)
   const other=buildVerifiedR5ComparisonRows(rows,altered)
   expect(other.filter(r=>r.selected&&r.periodEnd==="2024-12-31"&&r.scope==="CONSOLIDATED")).toHaveLength(3)
   expect(gradeR5WithVerifiedOriginal(rows,sid,"2025-06-30","Capital Goods","Industrial Products",calibration,other).status).toBe("UNAVAILABLE")
 })
 it("poisons duplicated or incorrectly labelled proofs instead of choosing one",()=>{
   const duplicates=[...proof,proof[1]!]
   const other=buildVerifiedR5ComparisonRows(rows,duplicates)
   expect(other.filter(r=>r.selected&&r.periodEnd==="2024-12-31"&&r.scope==="CONSOLIDATED")).toHaveLength(3)
   const invalid=proof.map(x=>({...x,approval:"UNVERIFIED_ISSUER"}))
   expect(buildVerifiedR5ComparisonRows(rows,invalid)).toBe(rows)
 })
 it("replays net earned premium only for verified general-insurer original trios",()=>{
   const premiumRows=rows.map(r=>r.code==="OPERATING_REVENUE_QUARTER" ?
      {...r,code:"NET_PREMIUM_EARNED_QUARTER",id:r.id.replace("OPERATING_REVENUE_QUARTER","NET_PREMIUM_EARNED_QUARTER")} : r)
   const premiumProof=proof.map(p=>({
      ...p,symbol:"STARHEALTH",
      observations:{
         NET_PREMIUM_EARNED_QUARTER:p.observations.OPERATING_REVENUE_QUARTER!.replace("OPERATING_REVENUE_QUARTER","NET_PREMIUM_EARNED_QUARTER"),
         NET_PROFIT_QUARTER:p.observations.NET_PROFIT_QUARTER!,
         EPS_DILUTED:p.observations.EPS_DILUTED!,
      },
   }))
   const alt=buildVerifiedR5ComparisonRows(premiumRows,premiumProof)
   expect(alt.filter(x=>x.selected && x.code==="NET_PREMIUM_EARNED_QUARTER")).toHaveLength(4)
   const insurance=gradeR5WithVerifiedOriginal(premiumRows,sid,"2025-06-30",
      "Financial Services","General Insurance",calibration,alt)
   expect(insurance.status).toBe("STRONG")
   expect(insurance.basis).toBe("COMPANY_TREND")
   expect(insurance.supportingMetrics).toContain("NET_PREMIUM_EARNED_QUARTER")
   expect(insurance.explanation).toContain("insurer-strength")
   expect(premiumRows.filter(x=>x.selected && x.scope==="CONSOLIDATED")).toHaveLength(6)
 })
 it("does not change existing accepted ratings or require any fresh provider download",()=>{
   const coherent=quarters.flatMap((q,i)=>fixture("STANDALONE",q,i).map(r=>({...r,selected:true})))
   const alt=buildVerifiedR5ComparisonRows(coherent,proof)
   const grade=gradeR5WithVerifiedOriginal(coherent,sid,"2025-06-30","Capital Goods","Industrial Products",calibration,alt)
   expect(grade.status).toBe("STRONG")
   expect(grade.explanation).not.toContain("canonical Results filing selections are untouched")
 })
})
