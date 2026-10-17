import type { ResultsSourceObservation } from "./resultsSourceRepository"
import { gradeQuarterR5, type ResultsQuarterGrade, type R5IndustryCalibrations } from "./quarterlyR5Classification"
import manifest from "./resultsR5ComparisonProof.json"

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

function canonicalStart(end:string):string|null {
  const match=/^(\d{4})-(03|06|09|12)-(30|31)$/.exec(end)
  if(!match) return null
  const y=Number(match[1]),m=Number(match[2])
  if(new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)!==end) return null
  return new Date(Date.UTC(y,m-3,1)).toISOString().slice(0,10)
}

export function buildVerifiedR5ComparisonRows(
  rows:readonly ResultsSourceObservation[],
  sources:readonly VerifiedR5Source[]=manifest.approvedSources,
):readonly ResultsSourceObservation[] {
  if (!sources.length) return rows
  const byId=new Map(rows.map(row=>[row.id,row]))
  const accepted=new Map<string,ReadonlySet<string>>()
  const poisoned=new Set<string>()
  for(const item of sources){
    const key=item.securityId+"|"+item.periodEnd
    if(accepted.has(key)){ poisoned.add(key); continue }
    if(item.approval!==APPROVAL || item.scope!=="STANDALONE" ||
       !item.sourceRecordId || !/^[0-9a-f-]{36}$/i.test(item.securityId))continue
    const start=canonicalStart(item.periodEnd)
    if(!start || item.periodEnd<"2024-09-30" || item.periodEnd>"2025-09-30")continue
    const top=item.observations.NET_INTEREST_INCOME_QUARTER ?
      "NET_INTEREST_INCOME_QUARTER":"OPERATING_REVENUE_QUARTER"
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
      "NET_PROFIT_QUARTER","EPS_DILUTED"].includes(row.code))return row
    const selected=chosen.has(row.id)
    if(selected===row.selected)return row
    changed=true
    return {...row,selected}
  })
  return changed?shifted:rows
}

const cached=new WeakMap<readonly ResultsSourceObservation[],readonly ResultsSourceObservation[]>()
function candidateRows(rows:readonly ResultsSourceObservation[]):readonly ResultsSourceObservation[] {
  const existing=cached.get(rows)
  if(existing)return existing
  const computed=buildVerifiedR5ComparisonRows(rows)
  cached.set(rows,computed)
  return computed
}

export function gradeR5WithVerifiedOriginal(
  rows:readonly ResultsSourceObservation[], securityId:string,end:string,
  sector:string|null,industry:string|null,calibrations:R5IndustryCalibrations,
  comparisonRows:readonly ResultsSourceObservation[]=candidateRows(rows),
):ResultsQuarterGrade {
  const canonical=gradeQuarterR5(rows,securityId,end,sector,industry,calibrations)
  if(canonical.status!=="UNAVAILABLE" || comparisonRows===rows)return canonical
  const alternative=gradeQuarterR5(comparisonRows,securityId,end,sector,industry,calibrations)
  if(alternative.status==="UNAVAILABLE")return canonical
  return {...alternative, explanation:
    "R5 comparison-only: exact R2-hash-verified standalone issuer originals; canonical Results filing selections are untouched. " +
    alternative.explanation}
}
