import { validateObservationSeries, type InputObservation, type MetricDefinition, validDate } from "./p7-ic-input-validation.ts"
import {selectedV14OwnershipSeries,type EvidenceRequirementPlan} from "./p7-ic-evidence-normalization.ts"
import {approvedBankDelegatedReview,approvedBankOfficialFallback} from "./v14-bank-approved-delegation.ts"

type Json = Readonly<Record<string, unknown>>
export type ReviewEvidenceFamily = EvidenceRequirementPlan["deterministicCoverageRule"]

export interface RequirementReview {
  readonly id:string; readonly portfolio_id:string; readonly security_id:string; readonly requirement_code:string
  readonly review_kind:string; readonly decision:string; readonly source_record_id:string|null; readonly research_document_id:string|null
  readonly provider_document_id:string|null; readonly source_payload_hash:string|null; readonly supporting_quote:string|null
  readonly period_start:string|null; readonly period_end:string|null; readonly period_type:string|null; readonly unit:string|null
  readonly currency:string|null; readonly consolidation_scope:string|null; readonly published_at:string|null; readonly retrieved_at:string|null
  readonly fresh_through:string|null; readonly review_version:string; readonly reviewed_by:string|null; readonly reviewed_at:string
  readonly review_hash:string; readonly supersedes_review_id:string|null; readonly metadata:Json; readonly created_at?:string
}
export interface ReviewedSourceRecord {
  readonly id:string; readonly source_code:string; readonly retrieved_at:string; readonly published_at:string|null
  readonly payload_hash:string; readonly raw_payload:Json
}
export interface ReviewedResearchDocument {
  readonly id:string; readonly security_id:string; readonly reporting_period_start:string|null; readonly reporting_period_end:string|null
  readonly reporting_period_type:string|null; readonly published_at:string|null; readonly canonical_content_hash:string|null
  readonly identity_status:string; readonly authoritative_identifier_scheme?:string|null; readonly authoritative_identifier?:string|null
  readonly metadata_identity_hash?:string|null
}
export interface ReviewedDocumentSource {
  readonly id:string; readonly research_document_id:string; readonly source_record_id:string|null; readonly source_code:string
  readonly content_hash:string|null; readonly source_status:string; readonly provider_document_id:string|null; readonly source_url:string|null
  readonly retrieved_at:string
}
export interface ReviewedEvidenceResult {
  readonly state:"FRESH"|"STALE"|"REVIEW_REQUIRED"|"CONFLICTING"|"INSUFFICIENT"
  readonly reason:string; readonly observations:readonly InputObservation[]; readonly selectedReviewIds:readonly string[]
  readonly sourceRecordIds:readonly string[]; readonly researchDocumentIds:readonly string[]; readonly documentSourceIds:readonly string[]
  readonly sourceCode:string|null; readonly retrievedAt:string|null; readonly evidenceAsOfDate:string|null; readonly freshThrough:string|null
  readonly lineage:Json
}

const HASH=/^[0-9a-f]{64}$/u, DECIMAL=/^-?\d+(?:\.\d+)?$/u
const SUPPORTED_VERSION="V1_4_REQUIREMENT_REVIEW_V2"
const APPROVED_KINDS:Readonly<Record<ReviewEvidenceFamily,readonly string[]>>={
  NUMERIC_SERIES:["OWNER_NUMERIC_REVIEW"], OWNERSHIP_4Q:["OWNER_OWNERSHIP_REVIEW"], TEXT_EVIDENCE_REVIEW:["OWNER_DOCUMENT_REVIEW"],
  MARKET_HISTORY:[], BENCHMARK_HISTORY:[], LOCAL_DERIVATION:[],
}
const time=(v:string|null)=>v?Date.parse(v):NaN
const str=(v:unknown)=>typeof v==="string"?v:null
const obj=(v:unknown):Json|null=>v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Json:null
const uniq=<T>(v:readonly T[])=>[...new Set(v)]
const minInstant=(values:readonly(string|null)[])=>values.filter((x):x is string=>Boolean(x)&&Number.isFinite(Date.parse(x!))).sort((a,b)=>Date.parse(a)-Date.parse(b))[0]??null
const maxInstant=(values:readonly(string|null)[])=>values.filter((x):x is string=>Boolean(x)&&Number.isFinite(Date.parse(x!))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]??null
function safeDate(v:string|null){try{return validDate(v)}catch{return false}}
function stable(v:unknown):string {
  if(Array.isArray(v))return "["+v.map(stable).join(",")+"]"
  if(v!==null&&typeof v==="object")return "{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}"
  return JSON.stringify(v)??"null"
}
async function sha256(v:string){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,"0")).join("")}
function fail(state:ReviewedEvidenceResult["state"],reason:string,ids:readonly string[]=[]):ReviewedEvidenceResult{
 return{state,reason,observations:[],selectedReviewIds:ids,sourceRecordIds:[],researchDocumentIds:[],documentSourceIds:[],
  sourceCode:null,retrievedAt:null,evidenceAsOfDate:null,freshThrough:null,lineage:{version:"V1_4_REVIEW_LEDGER_ADAPTER_V2",reason}}
}
function payloadStrings(v:unknown,out:string[]=[]):string[]{if(typeof v==="string")out.push(v);else if(Array.isArray(v))v.forEach(x=>payloadStrings(x,out));else if(v&&typeof v==="object")Object.values(v as Record<string,unknown>).forEach(x=>payloadStrings(x,out));return out}
function exactFragmentPresent(payload:Json,fragment:string){return fragment.length>0&&payloadStrings(payload).some(x=>x.includes(fragment))}
function decimalTokens(text:string){return [...text.matchAll(/(?<![\d.])-?\d+(?:\.\d+)?(?![\d.])/gu)].map(x=>x[0])}
function reviewHashPayload(review:RequirementReview){
 return {portfolio_id:review.portfolio_id,security_id:review.security_id,requirement_code:review.requirement_code,review_kind:review.review_kind,
  decision:review.decision,source_record_id:review.source_record_id,research_document_id:review.research_document_id,provider_document_id:review.provider_document_id,
  source_payload_hash:review.source_payload_hash,supporting_quote:review.supporting_quote,period_start:review.period_start,period_end:review.period_end,
  period_type:review.period_type,unit:review.unit,currency:review.currency,consolidation_scope:review.consolidation_scope,published_at:review.published_at,
  retrieved_at:review.retrieved_at,fresh_through:review.fresh_through,review_version:review.review_version,reviewed_by:review.reviewed_by,
  reviewed_at:review.reviewed_at,supersedes_review_id:review.supersedes_review_id,metadata:review.metadata}
}
function sourceBinding(review:RequirementReview,source:ReviewedSourceRecord){
 const b=obj(review.metadata.source_binding); if(!b)return {ok:false as const,reason:"NUMERIC_SOURCE_BINDING_MISSING"}
 const kind=str(b.kind),fragment=str(b.fragment),metric=str(b.metric_label),periodLabel=str(b.period_label),value=str(b.exact_value)
 const entity=str(b.entity_id)
 if(!kind||!["TABLE_CELL","XBRL_FACT","TEXT_CELL"].includes(kind)||!fragment||!metric||!periodLabel||!value||!DECIMAL.test(value))
  return {ok:false as const,reason:"NUMERIC_SOURCE_BINDING_INVALID"}
 if(!exactFragmentPresent(source.raw_payload,fragment))return {ok:false as const,reason:"NUMERIC_SOURCE_FRAGMENT_NOT_FOUND"}
 if(!fragment.includes(metric)||!fragment.includes(periodLabel)||decimalTokens(fragment).filter(x=>x===value).length!==1)
  return {ok:false as const,reason:"NUMERIC_SOURCE_VALUE_NOT_EXACTLY_BOUND"}
 if(entity&&!fragment.includes(entity))return {ok:false as const,reason:"NUMERIC_SOURCE_ENTITY_NOT_BOUND"}
 const pStart=str(b.period_start),pEnd=str(b.period_end),pType=str(b.period_type)
 const pStartAnchor=str(b.period_start_anchor),pEndAnchor=str(b.period_end_anchor)
 if(pStart!==review.period_start||pEnd!==review.period_end||pType!==review.period_type||!safeDate(pEnd)||pStart!==null&&!safeDate(pStart))
  return {ok:false as const,reason:"NUMERIC_SOURCE_PERIOD_MISMATCH"}
 if(!pEndAnchor||!fragment.includes(pEndAnchor)||(pStart!==null&&(!pStartAnchor||!fragment.includes(pStartAnchor))))
  return {ok:false as const,reason:"NUMERIC_SOURCE_PERIOD_DATES_NOT_BOUND"}
 const scale=str(b.scale)??"1",conversion=str(b.conversion)??"IDENTITY"
 if(scale!=="1"||conversion!=="IDENTITY")return {ok:false as const,reason:"UNAPPROVED_SCALE_OR_UNIT_CONVERSION"}
 return {ok:true as const,value,fragment,kind,metric,periodLabel}
}
function validateDocumentBinding(review:RequirementReview,document:ReviewedResearchDocument|null,source:ReviewedSourceRecord,
 documentSources:readonly ReviewedDocumentSource[]){
 if(!document)return {ok:false as const,reason:"DOCUMENTARY_REVIEW_REQUIRES_DOCUMENT",documentSource:null}
 if(document.security_id!==review.security_id||document.identity_status!=="VERIFIED"||!document.canonical_content_hash||!HASH.test(document.canonical_content_hash))
  return {ok:false as const,reason:"DOCUMENT_CONTENT_IDENTITY_NOT_VERIFIED",documentSource:null}
 const links=documentSources.filter(x=>x.research_document_id===document.id&&x.source_record_id===source.id&&x.source_status==="VERIFIED")
 if(links.length!==1)return {ok:false as const,reason:"DOCUMENT_SOURCE_ASSOCIATION_NOT_UNIQUE",documentSource:null}
 const link=links[0]!
 if(!link.content_hash||link.content_hash!==document.canonical_content_hash)return {ok:false as const,reason:"DOCUMENT_SOURCE_CONTENT_HASH_MISMATCH",documentSource:link}
 if(review.provider_document_id&&link.provider_document_id!==review.provider_document_id)return {ok:false as const,reason:"DOCUMENT_PROVIDER_ID_MISMATCH",documentSource:link}
 return {ok:true as const,documentSource:link}
}
function quarterIndex(v:string){const d=new Date(v+"T00:00:00Z"),m=d.getUTCMonth()+1;if(![3,6,9,12].includes(m)||d.getUTCDate()!==new Date(Date.UTC(d.getUTCFullYear(),m,0)).getUTCDate())return null;return d.getUTCFullYear()*4+Math.floor((m-1)/3)}
function consecutiveLatestQuarters(periods:readonly string[],minimum:number){
 const ix=uniq(periods).map(p=>[p,quarterIndex(p)] as const);if(ix.some(([,i])=>i===null))return false
 const sorted=ix.sort((a,b)=>(b[1]??0)-(a[1]??0)).slice(0,minimum);if(sorted.length<minimum)return false
 return sorted.every((x,i)=>i===0||x[1]===(sorted[i-1]![1]??0)-1)
}

export async function validateReviewedRequirementEvidence(input:{
 readonly portfolioId:string; readonly portfolioOwnerId:string; readonly securityId:string; readonly requirementCode:string
 readonly family:ReviewEvidenceFamily; readonly metricCodes:readonly string[]; readonly minimum:number; readonly reviews:readonly RequirementReview[]
 readonly sources:readonly ReviewedSourceRecord[]; readonly documents:readonly ReviewedResearchDocument[]; readonly documentSources:readonly ReviewedDocumentSource[]
 readonly definitions:readonly MetricDefinition[]; readonly evaluationAsOfMs:number; readonly sourceCutoffAtMs:number; readonly freshnessPolicy:string|null
}):Promise<ReviewedEvidenceResult|null>{
 const {portfolioId,securityId,requirementCode,family,evaluationAsOfMs,sourceCutoffAtMs}=input
 if(!["NUMERIC_SERIES","OWNERSHIP_4Q","TEXT_EVIDENCE_REVIEW"].includes(family))return null
 const scoped=input.reviews.filter(r=>r.portfolio_id===portfolioId&&r.security_id===securityId&&r.requirement_code===requirementCode)
 if(!scoped.length)return null
 const postCloseRetrievalWindowMs=4*60*60*1000
 if(!Number.isFinite(evaluationAsOfMs)||!Number.isFinite(sourceCutoffAtMs)||sourceCutoffAtMs<evaluationAsOfMs||sourceCutoffAtMs>evaluationAsOfMs+postCloseRetrievalWindowMs)return fail("REVIEW_REQUIRED","REVIEW_EVALUATION_CONTRACT_INVALID")
 const dated=scoped.filter(r=>Number.isFinite(time(r.reviewed_at))&&time(r.reviewed_at)<=sourceCutoffAtMs)
 if(!dated.length)return fail("REVIEW_REQUIRED","REVIEW_CREATED_AFTER_SOURCE_CUTOFF",scoped.map(r=>r.id))
 const byId=new Map(dated.map(r=>[r.id,r]))
 for(const r of dated)if(r.supersedes_review_id){
   const p=byId.get(r.supersedes_review_id)
   if(!p||p.portfolio_id!==portfolioId||p.security_id!==securityId||p.requirement_code!==requirementCode||time(p.reviewed_at)>=time(r.reviewed_at))
    return fail("REVIEW_REQUIRED","REVIEW_SUPERSESSION_CHAIN_INVALID",[r.id])
 }
 const superseded=new Set(dated.map(r=>r.supersedes_review_id).filter((x):x is string=>Boolean(x)))
 const active=dated.filter(r=>!superseded.has(r.id)).sort((a,b)=>time(a.reviewed_at)-time(b.reviewed_at)||a.id.localeCompare(b.id))
 if(!active.length)return fail("REVIEW_REQUIRED","REVIEW_SUPERSESSION_CHAIN_INVALID")
 const sourceById=new Map(input.sources.map(x=>[x.id,x])),documentById=new Map(input.documents.map(x=>[x.id,x]))
 const children=new Map<string,number>();for(const r of dated)if(r.supersedes_review_id)children.set(r.supersedes_review_id,(children.get(r.supersedes_review_id)??0)+1)
 if([...children.values()].some(n=>n>1))return fail("REVIEW_REQUIRED","REVIEW_SUPERSESSION_BRANCH_INVALID")
 const observations:InputObservation[]=[],support:RequirementReview[]=[],contradict:RequirementReview[]=[],insufficient:RequirementReview[]=[]
 const ownershipRows:Array<{review:RequirementReview;series:string;basis:string;period:string;value:string;source:ReviewedSourceRecord}>=[]
 const documentRows:Array<{review:RequirementReview;document:ReviewedResearchDocument;link:ReviewedDocumentSource;source:ReviewedSourceRecord}>=[]
 for(const r of active){
   const delegated=approvedBankDelegatedReview(r,input.portfolioOwnerId,family)
   if(r.review_version!==SUPPORTED_VERSION||!APPROVED_KINDS[family].includes(r.review_kind)&&!delegated)return fail("REVIEW_REQUIRED","REVIEW_KIND_OR_VERSION_NOT_APPROVED",[r.id])
   if(r.reviewed_by!==input.portfolioOwnerId&&!delegated)return fail("REVIEW_REQUIRED","REVIEWER_NOT_AUTHORIZED_FOR_PORTFOLIO",[r.id])
   if(!HASH.test(r.review_hash)||await sha256(stable(reviewHashPayload(r)))!==r.review_hash)return fail("REVIEW_REQUIRED","REVIEW_INTEGRITY_HASH_INVALID",[r.id])
   const decision=r.decision.toUpperCase();if(decision==="INSUFFICIENT"){insufficient.push(r);continue}
   if(decision==="CONTRADICTS"||decision==="REJECTED"){contradict.push(r);continue}
   if(decision!=="SUPPORTS"&&decision!=="ACCEPTED")return fail("REVIEW_REQUIRED","REVIEW_DECISION_NOT_APPROVED",[r.id])
   const source=r.source_record_id?sourceById.get(r.source_record_id)??null:null
   if(!source||!r.source_payload_hash||r.source_payload_hash!==source.payload_hash||!HASH.test(source.payload_hash))
    return fail("REVIEW_REQUIRED","REVIEW_SOURCE_HASH_OR_RECORD_INVALID",[r.id])
   if(delegated&&source.source_code!=="TRENDLYNE_MCP"&&!approvedBankOfficialFallback(r,source,input.portfolioOwnerId,family))
    return fail("REVIEW_REQUIRED","DELEGATED_SOURCE_AUTHORITY_NOT_PROVEN",[r.id])
   if(!Number.isFinite(time(source.retrieved_at))||time(source.retrieved_at)>sourceCutoffAtMs)return fail("REVIEW_REQUIRED","REVIEW_SOURCE_POST_CUTOFF",[r.id])
   const payloadSecurity=str(source.raw_payload.security_id);if(payloadSecurity&&payloadSecurity!==securityId)return fail("REVIEW_REQUIRED","REVIEW_SOURCE_SECURITY_MISMATCH",[r.id])
   if(!r.supporting_quote?.trim()||!exactFragmentPresent(source.raw_payload,r.supporting_quote))return fail("REVIEW_REQUIRED","REVIEW_QUOTE_NOT_BOUND_TO_SOURCE",[r.id])
   if(r.retrieved_at!==source.retrieved_at)return fail("REVIEW_REQUIRED","REVIEW_RETRIEVAL_MISMATCH",[r.id])
   if(r.published_at&&(!Number.isFinite(time(r.published_at))||time(r.published_at)>evaluationAsOfMs))return fail("REVIEW_REQUIRED","REVIEW_PUBLICATION_POST_EVALUATION",[r.id])
   if(source.published_at!==null&&r.published_at!==source.published_at)return fail("REVIEW_REQUIRED","REVIEW_PUBLICATION_MISMATCH",[r.id])
   if(r.fresh_through&&!Number.isFinite(time(r.fresh_through)))return fail("REVIEW_REQUIRED","REVIEW_FRESHNESS_INVALID",[r.id])
   if(family==="NUMERIC_SERIES"){
     const metric=str(r.metadata.metric_code),value=str(r.metadata.numeric_value)
     if(!metric||value===null||!input.metricCodes.includes(metric)||!DECIMAL.test(value))return fail("REVIEW_REQUIRED","NUMERIC_REVIEW_METRIC_VALUE_REQUIRED",[r.id])
     if(!r.period_end||!safeDate(r.period_end)||r.period_start!==null&&!safeDate(r.period_start)||!r.period_type||!r.unit||!r.consolidation_scope)
      return fail("REVIEW_REQUIRED","REVIEW_NUMERIC_METADATA_INCOMPLETE",[r.id])
     const binding=sourceBinding(r,source);if(!binding.ok)return fail("REVIEW_REQUIRED",binding.reason,[r.id])
     if(binding.value!==value)return fail("REVIEW_REQUIRED","NUMERIC_SOURCE_VALUE_MISMATCH",[r.id])
     // M1-M4 owner-approved source-only contracts: do not trust a claimed
     // certification flag or derive a financial fact from unbound metadata.
     // sourceBinding has independently verified the exact fragment in the
     // immutable source record and its metric/period/value anchors.
     if(["NIM_TTM","CET1_RATIO","CAPITAL_ADEQUACY_RATIO","ROA_ANNUAL"].includes(requirementCode)){
       const directDefinition=input.definitions.find(x=>x.code===metric)
       const approvedSources=directDefinition?.definition?.source_priority
       if(!Array.isArray(approvedSources)||!approvedSources.includes(source.source_code)
         ||!["COMPANY_EXCHANGE_FILING","NSE_OFFICIAL","TRENDLYNE_MCP"].includes(source.source_code))
         return fail("REVIEW_REQUIRED","BANK_DIRECT_SOURCE_AUTHORITY_NOT_APPROVED",[r.id])
       if(str(source.raw_payload.security_id)!==securityId)
         return fail("REVIEW_REQUIRED","BANK_DIRECT_ISSUER_SECURITY_IDENTITY_NOT_PROVEN",[r.id])

       if(metric!==requirementCode || r.unit!=="PERCENT" || Number(value)<=0)
         return fail("REVIEW_REQUIRED","BANK_DIRECT_METRIC_UNIT_OR_IDENTITY_INVALID",[r.id])
       const literal=binding.fragment.toLowerCase()
       const start=r.period_start,end=r.period_end
       if(requirementCode==="NIM_TTM"&&(
         !start||r.period_type!=="TRAILING_FOUR_QUARTERS"||
         Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z")<350*86400000||
         !/(nim|net interest margin)/i.test(literal)||
         !/(ttm|trailing (four|4) quarters|last (four|4) quarters)/i.test(literal)||
         !/(average interest.earning assets|average earning assets)/i.test(literal)
       ))return fail("REVIEW_REQUIRED","BANK_DIRECT_TTM_NIM_SOURCE_PROOF_MISSING",[r.id])
       if((requirementCode==="CET1_RATIO"||requirementCode==="CAPITAL_ADEQUACY_RATIO")&&(
         start!==end||r.period_type!=="REGULATORY_AS_OF"||
         !/basel\s*(iii|3)/i.test(literal)||
         !/(risk.weighted assets|rwa)/i.test(literal)
       ))return fail("REVIEW_REQUIRED","BANK_DIRECT_BASEL_III_SOURCE_PROOF_MISSING",[r.id])
       if(requirementCode==="CET1_RATIO"&&!/(cet1|common equity tier[ -]?1)/i.test(literal))
         return fail("REVIEW_REQUIRED","BANK_CET1_NOT_EXPLICITLY_SOURCED",[r.id])
       if(requirementCode==="CAPITAL_ADEQUACY_RATIO"&&!/(total capital adequacy|total crar|total car|total regulatory capital)/i.test(literal))
         return fail("REVIEW_REQUIRED","BANK_TOTAL_CAR_NOT_EXPLICITLY_SOURCED",[r.id])
       if(requirementCode==="ROA_ANNUAL"&&(
         !start||r.period_type!=="YEAR"||
         Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z")<350*86400000||
         !/(return on assets|annual roa)/i.test(literal)||
         !/(annual|financial year|full.year|audited)/i.test(literal)||
         !/(average (total )?assets)/i.test(literal)
       ))return fail("REVIEW_REQUIRED","BANK_DIRECT_FULL_YEAR_ROA_SOURCE_PROOF_MISSING",[r.id])
     }

     const document=r.research_document_id?documentById.get(r.research_document_id)??null:null
     if(document){
       const db=validateDocumentBinding(r,document,source,input.documentSources);if(!db.ok)return fail("REVIEW_REQUIRED",db.reason,[r.id])
       if(document.reporting_period_end&&document.reporting_period_end!==r.period_end)return fail("REVIEW_REQUIRED","DOCUMENT_REVIEW_PERIOD_MISMATCH",[r.id])
       if(document.reporting_period_start&&document.reporting_period_start!==r.period_start)return fail("REVIEW_REQUIRED","DOCUMENT_REVIEW_PERIOD_MISMATCH",[r.id])
       if(document.reporting_period_type&&document.reporting_period_type!==r.period_type)return fail("REVIEW_REQUIRED","DOCUMENT_REVIEW_PERIOD_TYPE_MISMATCH",[r.id])
     }
     const definition=input.definitions.find(x=>x.code===metric);if(!definition)return fail("REVIEW_REQUIRED","REVIEW_METRIC_DEFINITION_MISSING",[r.id])
     const retrieved=source.retrieved_at,fresh=r.fresh_through
     if(!fresh)return fail("REVIEW_REQUIRED","REVIEW_FRESHNESS_NOT_PROVEN",[r.id])
     observations.push({id:r.id,metric_code:metric,numeric_value:value,text_value:null,boolean_value:null,date_value:null,unit:r.unit,currency:r.currency,
      consolidation_scope:r.consolidation_scope,period_start:r.period_start,period_end:r.period_end,period_type:r.period_type,retrieved_at:retrieved,
      fresh_until:fresh,published_at:r.published_at??source.published_at,evidence_status:"AVAILABLE",source_code:source.source_code,source_record_id:source.id})
     support.push(r);continue
   }
   if(family==="OWNERSHIP_4Q"){
     const value=str(r.metadata.numeric_value),series=str(r.metadata.ownership_series),basis=str(r.metadata.ownership_basis)
     const seriesAnchor=str(r.metadata.ownership_series_anchor),basisAnchor=str(r.metadata.ownership_basis_anchor),periodAnchor=str(r.metadata.period_anchor)
     if(!value||!DECIMAL.test(value)||Number(value)<0||Number(value)>100||r.unit!=="PERCENT"||!series||!basis||!r.period_end||!safeDate(r.period_end)||r.period_type!=="QUARTER"
       ||!seriesAnchor||!basisAnchor||!periodAnchor||!r.supporting_quote.includes(seriesAnchor)||!r.supporting_quote.includes(basisAnchor)
       ||!r.supporting_quote.includes(periodAnchor)||!r.supporting_quote.includes("%")||decimalTokens(r.supporting_quote).filter(x=>x===value).length!==1)
      return fail("REVIEW_REQUIRED","OWNERSHIP_REVIEW_CONTRACT_INCOMPLETE",[r.id])
     if(!r.fresh_through||time(r.fresh_through)<evaluationAsOfMs)return fail("STALE","OWNERSHIP_REVIEW_STALE",[r.id])
     if(input.freshnessPolicy?.includes("150_DAYS")){
       const ceiling=time(source.retrieved_at)+150*86400000
       if(time(r.fresh_through)>ceiling)return fail("REVIEW_REQUIRED","OWNERSHIP_FRESHNESS_BOUND_EXCEEDS_POLICY",[r.id])
     }
     ownershipRows.push({review:r,series,basis,period:r.period_end,value,source});support.push(r);continue
   }
   const document=r.research_document_id?documentById.get(r.research_document_id)??null:null
   if(!document)return fail("REVIEW_REQUIRED","DOCUMENTARY_REVIEW_REQUIRES_DOCUMENT",[r.id])
   const db=validateDocumentBinding(r,document,source,input.documentSources);if(!db.ok)return fail("REVIEW_REQUIRED",db.reason,[r.id])
   if(document.published_at!==null&&r.published_at!==document.published_at)return fail("REVIEW_REQUIRED","DOCUMENT_REVIEW_PUBLICATION_MISMATCH",[r.id])
   if(!r.fresh_through||time(r.fresh_through)<evaluationAsOfMs)return fail("STALE","DOCUMENT_REVIEW_STALE",[r.id])
   if(input.freshnessPolicy?.includes("150_DAYS")){
     const days=r.period_type==="YEAR"?550:150
     if(time(r.fresh_through)>time(source.retrieved_at)+days*86400000)return fail("REVIEW_REQUIRED","DOCUMENT_FRESHNESS_CONTRACT_MISMATCH",[r.id])
   }
   documentRows.push({review:r,document:document!,link:db.documentSource!,source});support.push(r)
 }
 if(contradict.length&&support.length)return fail("CONFLICTING","ACTIVE_REVIEWS_CONFLICT",[...support,...contradict].map(x=>x.id))
 if(contradict.length)return fail("CONFLICTING","ACTIVE_REVIEW_CONTRADICTS_REQUIREMENT",contradict.map(x=>x.id))
 if(!support.length&&insufficient.length)return fail("INSUFFICIENT","REVIEWED_SOURCE_INSUFFICIENT",insufficient.map(x=>x.id))
 if(!support.length)return fail("REVIEW_REQUIRED","NO_APPROVED_ACTIVE_REVIEW",active.map(x=>x.id))
 if(family==="NUMERIC_SERIES"){
   // Scoped owner-approved primary-filing fallback. Never change global metric
   // definitions or relabel source facts as Trendlyne.
   const definitions=input.definitions.map(d=>{
    const relevant=support.filter(r=>r.metadata.metric_code===d.code)
    if(!relevant.length||!relevant.every(r=>{const s=r.source_record_id?sourceById.get(r.source_record_id):undefined;return s&&approvedBankOfficialFallback(r,s,input.portfolioOwnerId,family)}))return d
    const sourceCodes=uniq(observations.filter(o=>o.metric_code===d.code).map(o=>o.source_code))
    if(sourceCodes.length!==1)return d
    return {...d,definition:{...d.definition,provider:sourceCodes[0],source_priority:sourceCodes,bank_source_admission_policy:"V1_4_BANK_PRIMARY_FILING_DELEGATION_V1"}}
   })
   const v=validateObservationSeries({rows:observations,definitions,minimum:input.minimum,evaluationAsOfMs,sourceCutoffAtMs})
   if(v.state!=="FRESH")return {...fail(v.state,v.reason,support.map(x=>x.id)),observations,sourceRecordIds:uniq(observations.map(x=>x.source_record_id)),
    researchDocumentIds:uniq(support.map(x=>x.research_document_id).filter((x):x is string=>Boolean(x))),lineage:{version:"V1_4_REVIEW_LEDGER_ADAPTER_V2",reviewIds:support.map(x=>x.id),reason:v.reason}}
   const result=resultFrom(v.selected,support,input.documentSources,"REVIEWED_CANONICAL_OBSERVATION_READY")
   const approvedFallback=support.every(r=>{const s=r.source_record_id?sourceById.get(r.source_record_id):undefined;return s&&approvedBankOfficialFallback(r,s,input.portfolioOwnerId,family)})
   return approvedFallback?{...result,lineage:{...result.lineage,sourceAdmissionPolicy:"V1_4_BANK_PRIMARY_FILING_DELEGATION_V1",executor:"CODEX",personalOwnerReview:false}}:result
 }
 if(family==="OWNERSHIP_4Q"){
   const series=uniq(ownershipRows.map(x=>x.series)),bases=uniq(ownershipRows.map(x=>x.basis));if(series.length!==1||bases.length!==1)return fail("REVIEW_REQUIRED","OWNERSHIP_SERIES_OR_BASIS_MIXED",support.map(x=>x.id))
   const expectedSeries=selectedV14OwnershipSeries(requirementCode)
   if(requirementCode==="OWNERSHIP_GOVERNANCE")return fail("REVIEW_REQUIRED","OWNERSHIP_GOVERNANCE_DOCUMENT_REVIEW_REQUIRED",support.map(x=>x.id))
   if(expectedSeries&&(series[0]!==expectedSeries.toUpperCase()||bases[0]!=="TOTAL_EQUITY"))return fail("REVIEW_REQUIRED","OWNERSHIP_SELECTED_SERIES_OR_BASIS_NOT_PROVEN",support.map(x=>x.id))
   if(expectedSeries&&uniq(ownershipRows.map(x=>x.source.source_code)).length!==1)return fail("REVIEW_REQUIRED","OWNERSHIP_SOURCE_AUTHORITY_MIXED",support.map(x=>x.id))
   const requiredPeriods=expectedSeries?Math.max(4,input.minimum):input.minimum
   const byQuarter=new Map<string,typeof ownershipRows>();for(const x of ownershipRows){const g=byQuarter.get(x.period)??[];g.push(x);byQuarter.set(x.period,g)}
   for(const g of byQuarter.values())if(uniq(g.map(x=>x.value)).length>1)return fail("CONFLICTING","OWNERSHIP_QUARTER_VALUE_CONFLICT",g.map(x=>x.review.id))
   const periods=[...byQuarter.keys()];if(!consecutiveLatestQuarters(periods,requiredPeriods))return fail("INSUFFICIENT","OWNERSHIP_REQUIRED_WINDOW_NOT_PROVEN",support.map(x=>x.id))
   const selected=[...byQuarter.entries()].sort(([a],[b])=>b.localeCompare(a)).slice(0,requiredPeriods).flatMap(([,g])=>[g.sort((a,b)=>time(b.review.reviewed_at)-time(a.review.reviewed_at))[0]!])
   const latestPeriod=selected.map(x=>x.period).sort().at(-1)??null
   if(input.freshnessPolicy?.includes("150_DAYS")&&latestPeriod&&evaluationAsOfMs-time(latestPeriod+"T00:00:00Z")>150*86400000)
    return fail("STALE","OWNERSHIP_LATEST_REQUIRED_PERIOD_STALE",selected.map(x=>x.review.id))
   return {state:"FRESH",reason:"REVIEWED_OWNERSHIP_SERIES_READY",observations:[],selectedReviewIds:selected.map(x=>x.review.id),
    sourceRecordIds:uniq(selected.map(x=>x.source.id)),researchDocumentIds:[],documentSourceIds:[],sourceCode:uniq(selected.map(x=>x.source.source_code)).length===1?selected[0]!.source.source_code:null,
    retrievedAt:maxInstant(selected.map(x=>x.source.retrieved_at)),evidenceAsOfDate:selected.map(x=>x.period).sort().at(-1)??null,freshThrough:minInstant(selected.map(x=>x.review.fresh_through)),
    lineage:{version:"V1_4_REVIEW_LEDGER_ADAPTER_V2",reviewIds:selected.map(x=>x.review.id),sourceRecordIds:uniq(selected.map(x=>x.source.id)),sourcePayloadHashes:uniq(selected.map(x=>x.source.payload_hash)),ownershipSeries:series[0],ownershipBasis:bases[0],periods:selected.map(x=>x.period).sort()}}
 }
 const identities=new Map<string,typeof documentRows>();for(const x of documentRows){const key=[x.document.canonical_content_hash,x.document.reporting_period_end??x.review.period_end??"NO_PERIOD"].join(":");const g=identities.get(key)??[];g.push(x);identities.set(key,g)}
 if(identities.size<input.minimum)return fail("INSUFFICIENT","DISTINCT_DOCUMENTARY_EVIDENCE_INSUFFICIENT",support.map(x=>x.id))
 const selected=[...identities.values()].map(g=>g.sort((a,b)=>time(b.review.reviewed_at)-time(a.review.reviewed_at))[0]!)
 return {state:"FRESH",reason:"REVIEWED_DOCUMENTARY_SUPPORT_READY",observations:[],selectedReviewIds:selected.map(x=>x.review.id),sourceRecordIds:uniq(selected.map(x=>x.source.id)),
  researchDocumentIds:uniq(selected.map(x=>x.document.id)),documentSourceIds:uniq(selected.map(x=>x.link.id)),sourceCode:uniq(selected.map(x=>x.source.source_code)).length===1?selected[0]!.source.source_code:null,
  retrievedAt:maxInstant(selected.map(x=>x.source.retrieved_at)),evidenceAsOfDate:selected.map(x=>x.document.reporting_period_end??x.review.period_end).filter((x):x is string=>Boolean(x)).sort().at(-1)??null,
  freshThrough:minInstant(selected.map(x=>x.review.fresh_through)),lineage:{version:"V1_4_REVIEW_LEDGER_ADAPTER_V2",reviewIds:selected.map(x=>x.review.id),sourceRecordIds:uniq(selected.map(x=>x.source.id)),sourcePayloadHashes:uniq(selected.map(x=>x.source.payload_hash)),researchDocumentIds:uniq(selected.map(x=>x.document.id)),documentSourceIds:uniq(selected.map(x=>x.link.id)),contentHashes:uniq(selected.map(x=>x.document.canonical_content_hash!))}}
}
function resultFrom(selected:readonly InputObservation[],reviews:readonly RequirementReview[],documentSources:readonly ReviewedDocumentSource[],reason:string):ReviewedEvidenceResult{
 const reviewById=new Map(reviews.map(x=>[x.id,x])),used=selected.map(x=>reviewById.get(x.id)!).filter(Boolean)
 const docIds=uniq(used.map(x=>x.research_document_id).filter((x):x is string=>Boolean(x)))
 const links=documentSources.filter(x=>docIds.includes(x.research_document_id)&&selected.some(s=>s.source_record_id===x.source_record_id))
 return {state:"FRESH",reason,observations:selected,selectedReviewIds:selected.map(x=>x.id),sourceRecordIds:uniq(selected.map(x=>x.source_record_id)),
  researchDocumentIds:docIds,documentSourceIds:uniq(links.map(x=>x.id)),sourceCode:uniq(selected.map(x=>x.source_code)).length===1?selected[0]?.source_code??null:null,
  retrievedAt:maxInstant(selected.map(x=>x.retrieved_at)),evidenceAsOfDate:selected.map(x=>x.period_end).filter((x):x is string=>Boolean(x)).sort().at(-1)??null,
  freshThrough:minInstant(selected.map(x=>x.fresh_until)),lineage:{version:"V1_4_REVIEW_LEDGER_ADAPTER_V2",reviewIds:selected.map(x=>x.id),sourceRecordIds:uniq(selected.map(x=>x.source_record_id)),sourcePayloadHashes:uniq(used.map(x=>x.source_payload_hash).filter((x):x is string=>Boolean(x))),researchDocumentIds:docIds,documentSourceIds:uniq(links.map(x=>x.id))}}
}

export function reconcileCanonicalAndReviewed(input:{canonicalRows:readonly InputObservation[];reviewed:ReviewedEvidenceResult|null;definitions:readonly MetricDefinition[];minimum:number;evaluationAsOfMs:number;sourceCutoffAtMs:number;family:ReviewEvidenceFamily}){
 const canonical=validateObservationSeries({rows:input.canonicalRows,definitions:input.definitions,minimum:input.minimum,evaluationAsOfMs:input.evaluationAsOfMs,sourceCutoffAtMs:input.sourceCutoffAtMs})
 const r=input.reviewed
 if(canonical.state==="CONFLICTING")return {authority:"CANONICAL" as const,validation:canonical,reviewed:r,reason:"CANONICAL_CONFLICT_PRESERVED"}
 if(r?.state==="CONFLICTING")return {authority:"CONFLICT" as const,validation:{state:"CONFLICTING" as const,reason:r.reason,selected:[]},reviewed:r,reason:"REVIEW_CONFLICT_PRESERVED"}
 const approvedFallback=r?.state==="FRESH"&&r.lineage.sourceAdmissionPolicy==="V1_4_BANK_PRIMARY_FILING_DELEGATION_V1"
 if(approvedFallback&&input.family==="NUMERIC_SERIES"){
   const decimal=(v:number|string|null)=>String(v).replace(/(\.\d*?)0+$/u,"$1").replace(/\.$/u,"")
   // Comparable retained facts may contradict a fallback even if other metadata
   // is incomplete. Never select by retrieval recency or mix source authorities.
   const conflict=input.canonicalRows.some(c=>r.observations.some(o=>c.metric_code===o.metric_code&&c.period_end===o.period_end
     &&c.period_type===o.period_type&&c.unit===o.unit&&c.currency===o.currency&&c.consolidation_scope===o.consolidation_scope
     &&c.numeric_value!==null&&o.numeric_value!==null&&decimal(c.numeric_value)!==decimal(o.numeric_value)))
   if(conflict)return {authority:"CONFLICT" as const,validation:{state:"CONFLICTING" as const,reason:"OFFICIAL_FALLBACK_CANONICAL_VALUE_CONFLICT",selected:[]},reviewed:r,reason:"OFFICIAL_FALLBACK_CANONICAL_VALUE_CONFLICT"}
   if(canonical.state==="FRESH")return {authority:"CANONICAL" as const,validation:canonical,reviewed:r,reason:"CANONICAL_FRESH_PRIMARY"}
   return {authority:"REVIEW" as const,validation:{state:"FRESH" as const,reason:r.reason,selected:r.observations},reviewed:r,reason:"APPROVED_OFFICIAL_FILING_FALLBACK"}
 }
 if(canonical.state==="FRESH"){
   if(r?.state==="FRESH"&&input.family==="NUMERIC_SERIES"&&r.observations.length){
     const combined=validateObservationSeries({rows:[...input.canonicalRows,...r.observations],definitions:input.definitions,minimum:input.minimum,evaluationAsOfMs:input.evaluationAsOfMs,sourceCutoffAtMs:input.sourceCutoffAtMs})
     if(combined.state!=="FRESH")return {authority:"CONFLICT" as const,validation:combined,reviewed:r,reason:"CANONICAL_REVIEW_RECONCILIATION_FAILED"}
   }
   return {authority:"CANONICAL" as const,validation:canonical,reviewed:r,reason:"CANONICAL_FRESH_PRIMARY"}
 }
 if((canonical.state==="INSUFFICIENT"||canonical.state==="STALE")&&r?.state==="FRESH"&&input.family==="NUMERIC_SERIES"&&r.observations.length){
   const combined=validateObservationSeries({rows:[...input.canonicalRows,...r.observations],definitions:input.definitions,minimum:input.minimum,evaluationAsOfMs:input.evaluationAsOfMs,sourceCutoffAtMs:input.sourceCutoffAtMs})
   if(combined.state==="FRESH")return {authority:"COMBINED" as const,validation:combined,reviewed:r,reason:"REVIEW_SUPPLEMENTS_CANONICAL_SERIES"}
   return {authority:"CANONICAL" as const,validation:canonical,reviewed:r,reason:"REVIEW_SUPPLEMENT_NOT_COMPATIBLE"}
 }
 if(!input.canonicalRows.length&&r?.state==="FRESH")return {authority:"REVIEW" as const,validation:{state:"FRESH" as const,reason:r.reason,selected:r.observations},reviewed:r,reason:"REVIEW_FALLBACK_NO_CANONICAL"}
 return {authority:"CANONICAL" as const,validation:canonical,reviewed:r,reason:"CANONICAL_BLOCKER_PRESERVED"}
}
