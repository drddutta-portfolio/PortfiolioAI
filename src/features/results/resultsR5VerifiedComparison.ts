import type { ResultsSourceObservation } from "./resultsSourceRepository"
import { gradeQuarterR5, type ResultsQuarterGrade, type R5IndustryCalibrations } from "./quarterlyR5Classification"
import manifest from "./resultsR5ComparisonProof.json"
import federalSource from "./resultsR5FederalOriginalComparisonProof.json"
import tataPowerSource from "./resultsR5TataPowerOriginalComparisonProof.json"
import bdlSource from "./resultsR5BDLOriginalComparisonProof.json"
import gmbrewSource from "./resultsR5GMBREWOriginalComparisonProof.json"

/**
 * Independently R2-replayed original filings admitted for R5 COMPARISON ONLY.
 * They never affect R4 display, canonical source decisions, V1-4 or EPS share
 * basis. No provider calls. Invalid/replaced originals fail closed.
 */
export interface VerifiedR5Source {
  readonly symbol: string
  readonly securityId: string
  readonly periodEnd: string
  readonly scope: string
  readonly sourceRecordId: string
  readonly observations: Readonly<Partial<Record<string,string>>>
  readonly approval: string
}
const CORE = ["NET_PROFIT_QUARTER", "EPS_DILUTED"] as const
const APPROVAL = "R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION"
const unitFor = (code:string) => code === "EPS_DILUTED" ? "INR_PER_SHARE" : "INR_CRORE"
const independentlyVerifiedOriginals:readonly VerifiedR5Source[] = [
  ...manifest.approvedSources, ...federalSource.approvedSources, ...tataPowerSource.approvedSources, ...bdlSource.approvedSources, ...gmbrewSource.approvedSources,
]

function canonicalStart(end:string):string|null {
  const match=/^(\d{4})-(03|06|09|12)-(30|31)$/.exec(end)
  if(!match) return null
  const y=Number(match[1]),m=Number(match[2])
  if(new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)!==end) return null
  return new Date(Date.UTC(y,m-3,1)).toISOString().slice(0,10)
}

export function buildVerifiedR5ComparisonRows(
  rows:readonly ResultsSourceObservation[],
  sources:readonly VerifiedR5Source[]=independentlyVerifiedOriginals,
  scope?: "CONSOLIDATED"|"STANDALONE",
):readonly ResultsSourceObservation[] {
  if (!sources.length) return rows
  const byId=new Map(rows.map(row=>[row.id,row]))
  const accepted=new Map<string,ReadonlySet<string>>()
  const poisoned=new Set<string>()
  for(const item of sources){
    if(scope && item.scope!==scope)continue
    const key=item.securityId+"|"+item.periodEnd
    if(accepted.has(key)){ poisoned.add(key); continue }
    if(item.approval!==APPROVAL || !["STANDALONE","CONSOLIDATED"].includes(item.scope) ||
       !item.sourceRecordId || !/^[0-9a-f-]{36}$/i.test(item.securityId))continue
    const start=canonicalStart(item.periodEnd)
    if(!start || item.periodEnd<"2024-09-30" || item.periodEnd>"2025-09-30")continue
    const top=item.observations.NET_INTEREST_INCOME_QUARTER ?
      "NET_INTEREST_INCOME_QUARTER":item.observations.NET_PREMIUM_EARNED_QUARTER ?
      "NET_PREMIUM_EARNED_QUARTER":"OPERATING_REVENUE_QUARTER"
    const needs=[top,...CORE]
    if(Object.keys(item.observations).length!==3)continue
    const proof=new Set<string>()
    let valid=true
    for(const code of needs){
      const expected=item.observations[code]
      if(!expected){valid=false;break}
      const row=byId.get(expected)
      if(!row || row.securityId!==item.securityId || row.periodEnd!==item.periodEnd ||
         row.periodStart!==start || row.code!==code || row.scope!==item.scope ||
         row.sourceRecordId!==item.sourceRecordId || row.source!=="COMPANY_EXCHANGE_FILING" ||
         row.currency!=="INR" || row.unit!==unitFor(code) ||
         !/^-?\d+(?:\.\d+)?$/.test(row.value)){valid=false;break}
      proof.add(row.id)
    }
    if(valid && proof.size===3)accepted.set(key,proof)
  }
  for(const key of poisoned)accepted.delete(key)
  if(!accepted.size)return rows
  let changed=false
  const shifted=rows.map(row=>{
    const chosen=accepted.get(row.securityId+"|"+row.periodEnd)
    if(!chosen || !["OPERATING_REVENUE_QUARTER","NET_INTEREST_INCOME_QUARTER",
      "NET_PREMIUM_EARNED_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"].includes(row.code))return row
    const selected=chosen.has(row.id)
    if(selected===row.selected)return row
    changed=true
    return {...row,selected}
  })
  return changed?shifted:rows
}

const cached=new WeakMap<readonly ResultsSourceObservation[], Map<string,readonly ResultsSourceObservation[]>>()
function candidateRows(
  rows:readonly ResultsSourceObservation[],
  scope:"CONSOLIDATED"|"STANDALONE",
):readonly ResultsSourceObservation[] {
  let variants=cached.get(rows)
  if(!variants){variants=new Map();cached.set(rows,variants)}
  const existing=variants.get(scope)
  if(existing)return existing
  const computed=buildVerifiedR5ComparisonRows(rows,independentlyVerifiedOriginals,scope)
  variants.set(scope,computed)
  return computed
}

export function gradeR5WithVerifiedOriginal(
  rows:readonly ResultsSourceObservation[], securityId:string,end:string,
  sector:string|null,industry:string|null,calibrations:R5IndustryCalibrations,
  comparisonRows?:readonly ResultsSourceObservation[],
):ResultsQuarterGrade {
  const canonical=gradeQuarterR5(rows,securityId,end,sector,industry,calibrations)
  if(canonical.status!=="UNAVAILABLE")return canonical
  // The source policy is predetermined: try Consolidated before Standalone,
  // independent of which grade (Strong/Mixed/Weak) the data would produce.
  // Each candidate's individual financial observations are R2-hash-verified,
  // unique per scope, and must still pass R5's source-coherence contract.
  const variants=comparisonRows?[comparisonRows]:[
    candidateRows(rows,"CONSOLIDATED"),candidateRows(rows,"STANDALONE"),
  ]
  for(const variant of variants){
    if(variant===rows)continue
    const alternative=gradeQuarterR5(variant,securityId,end,sector,industry,calibrations)
    if(alternative.status==="UNAVAILABLE")continue
    const scope=variants.length===1?"verified comparison":variant===variants[0]?"Consolidated":"Standalone"
    return {...alternative, explanation:
      "R5 comparison-only ("+scope+"): exact R2-hash-verified issuer originals; canonical Results filing selections are untouched. " +
      alternative.explanation}
  }
  return canonical
}
