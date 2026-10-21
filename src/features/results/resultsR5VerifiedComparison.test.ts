import { describe, it, expect } from "vitest"
import pinnedProof from "./resultsR5ComparisonProof.json"
import federalOriginal from "./resultsR5FederalOriginalComparisonProof.json"
import tataOriginal from "./resultsR5TataPowerOriginalComparisonProof.json"
import sswlOriginal from "./resultsR5SSWLOriginalComparisonProof.json"
import jashOriginal from "./resultsR5JASHOriginalComparisonProof.json"
import nalcoOriginal from "./resultsR5NATIONALUMOriginalComparisonProof.json"
import gmbrewOriginal from "./resultsR5GMBREWOriginalComparisonProof.json"
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
 it("pins GMBREW 2025 March standalone original with exact issuer SHA and three historical facts",()=>{
   expect(gmbrewOriginal.contract).toBe("R5_GMBREW_SIGNED_2025_MARCH_ORIGINAL_V1")
   expect(gmbrewOriginal.environment).toBe("Development")
   expect(gmbrewOriginal.signedOriginalSHA256).toMatch(/^[0-9a-f]{64}$/)
   expect(gmbrewOriginal.approvedSources).toHaveLength(1)
   const original=gmbrewOriginal.approvedSources[0]!
   expect(original.symbol).toBe("GMBREW")
   expect(original.periodEnd).toBe("2025-03-31")
   expect(original.scope).toBe("STANDALONE")
   expect(original.approval).toBe("R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION")
   expect(Object.keys(original.observations).sort()).toEqual(["EPS_DILUTED","NET_PROFIT_QUARTER","OPERATING_REVENUE_QUARTER"])
   for(const id of Object.values(original.observations))expect(id).toMatch(/^[0-9a-f-]{36}$/)
 })
 it("pins NALCO 2024 September signed Consolidated revenue PAT EPS, R5 comparison only",()=>{
    expect(nalcoOriginal.contract).toBe("R5_NATIONALUM_SIGNED_2024_CONSOLIDATED_ORIGINAL_V1")
    expect(nalcoOriginal.environment).toBe("Development")
    expect(nalcoOriginal.originalSHA256).toBe("7790c4058aaa501783a620204126115e2b4d54a617c9d40c1d76f9edfd9935a9")
    expect(nalcoOriginal.approvedSources).toHaveLength(1)
    expect(nalcoOriginal.approvedSources[0].periodEnd).toBe("2024-09-30")
    expect(nalcoOriginal.approvedSources[0].symbol).toBe("NATIONALUM")
    expect(nalcoOriginal.approvedSources[0].scope).toBe("CONSOLIDATED")
    expect(nalcoOriginal.approvedSources[0].approval).toBe("R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION")
    expect(Object.keys(nalcoOriginal.approvedSources[0].observations).sort()).toEqual(["EPS_DILUTED","NET_PROFIT_QUARTER","OPERATING_REVENUE_QUARTER"])
 })
 it("requires two source-hash-locked 2024 JASH consolidated historical trios and no R4 overwrite",()=>{
   expect(jashOriginal.contract).toBe("R5_JASH_SIGNED_2024_COMPARATIVE_ORIGINAL_V1")
   expect(jashOriginal.environment).toBe("Development")
   expect(jashOriginal.originalSHA256).toBe("74de4acdeb0554f3f81a3162828307f408165adb11b8d727fe44cec08baf1148")
   expect(jashOriginal.approvedSources).toHaveLength(2)
   expect(jashOriginal.approvedSources.map(x=>x.periodEnd).sort()).toEqual(["2024-09-30","2024-12-31"])
   expect(new Set(jashOriginal.approvedSources.map(x=>x.sourceRecordId)).size).toBe(1)
   for(const x of jashOriginal.approvedSources){
      expect(x.symbol).toBe("JASH")
      expect(x.scope).toBe("CONSOLIDATED")
      expect(x.approval).toBe("R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION")
      expect(Object.keys(x.observations).sort()).toEqual(["EPS_DILUTED","NET_PROFIT_QUARTER","OPERATING_REVENUE_QUARTER"])
   }
 })
 it("requires two signed SSWL original comparable 2024 consolidated quarters and no R4 mutation",()=>{
   expect(sswlOriginal.contract).toBe("R5_SSWL_SIGNED_2024_COMPARATIVE_ORIGINAL_V1")
   expect(sswlOriginal.environment).toBe("Development")
   expect(sswlOriginal.originalSHA256).toBe("558de3ec82d9c0a11a3f0e6be14e50ca21629ed7c53fc68f04e1e156439a0df9")
   expect(sswlOriginal.approvedSources).toHaveLength(2)
   expect(sswlOriginal.approvedSources.map(s=>s.periodEnd).sort()).toEqual(["2024-09-30","2024-12-31"])
   expect(new Set(sswlOriginal.approvedSources.map(s=>s.sourceRecordId)).size).toBe(1)
   for(const source of sswlOriginal.approvedSources){
     expect(source.symbol).toBe("SSWL")
     expect(source.scope).toBe("CONSOLIDATED")
     expect(source.approval).toBe("R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION")
     expect(Object.keys(source.observations).sort()).toEqual(["EPS_DILUTED","NET_PROFIT_QUARTER","OPERATING_REVENUE_QUARTER"])
   }
 })
 it("pins two independently source-reviewed Tata Power consolidated 2024 trios without replacing R4",()=>{
   expect(tataOriginal.contract).toBe("R5_TATAPOWER_SIGNED_ISSUER_2024_CONSOLIDATED_V1")
   expect(tataOriginal.environment).toBe("Development")
   expect(tataOriginal.approvedSources).toHaveLength(2)
   expect(tataOriginal.approvedSources.map(s=>s.periodEnd).sort()).toEqual(["2024-09-30","2024-12-31"])
   for(const source of tataOriginal.approvedSources){
     expect(source.symbol).toBe("TATAPOWER")
     expect(source.securityId).toMatch(/^[a-f0-9-]{36}$/)
     expect(source.scope).toBe("CONSOLIDATED")
     expect(source.sourceRecordId).toMatch(/^[a-f0-9-]{36}$/)
     expect(source.approval).toBe("R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION")
     expect(Object.keys(source.observations).sort()).toEqual(["EPS_DILUTED","NET_PROFIT_QUARTER","OPERATING_REVENUE_QUARTER"])
     expect(new Set(Object.values(source.observations)).size).toBe(3)
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
