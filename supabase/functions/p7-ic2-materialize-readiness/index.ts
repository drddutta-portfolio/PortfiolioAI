import { P7_IC_CANONICAL_REQUIREMENT_METRICS } from "../_shared/p7-ic-requirement-metrics.ts"
import {createClient,type SupabaseClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
type Admin = SupabaseClient
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import {buildProfileEvidencePlan,normalizeNumericEvidence,normalizeDocumentEvidence,parseTrendlyneOwnershipHistory,guardedNumericEvidenceState} from "../_shared/p7-ic-evidence-normalization.ts"
import {cachedEvidenceReadiness,inspectStoredHistory,validateObservationSeries,P7_IC_INPUT_VALIDATION_VERSION,type InputObservation,type MetricDefinition,type HistoryRow,type HistoryValidation} from "../_shared/p7-ic-input-validation.ts"
import {validateStockHistoryReadiness,validateBenchmarkPairReadiness,historyProofFromRows,parseHistoryContractProof,type HistoryContractProof} from "../_shared/v14-history-readiness.ts"
import {loadVerifiedOfficialBenchmarkHistory,type OfficialBenchmarkSourceRecord} from "../_shared/v14-official-benchmark-r2.ts"
import {validateReviewedRequirementEvidence,reconcileCanonicalAndReviewed,type RequirementReview,type ReviewedSourceRecord,type ReviewedResearchDocument,type ReviewedDocumentSource,type ReviewEvidenceFamily} from "../_shared/v14-reviewed-evidence.ts"
import {p7IcProfileContract} from "../_shared/p7-ic-profile-contracts.ts"
import {executableV14BenchmarkCodes,resolveV14BenchmarkAuthority} from "../_shared/v14-benchmark-authority-resolution.ts"
import coverage from "../../../docs/p7-ic/PortfolioAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_2026-09-29.json" with {type:"json"}

const DEV_REF="lrgpjimipfkyoqbpsqzz",PROD_REF="uxiyufbsbgzzdujzcdxe",ACTION="P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS"
const VALIDATE_ACTION="P7_IC3_VALIDATE_CANONICAL_INPUTS"
const REGISTRY_VERSION="PORTFOLIOAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1"
const MATERIALIZER_VERSION="P7_IC3_CANONICAL_SNAPSHOT_V4_BENCHMARK_AUTHORITY_RESOLUTION"
const CLASSIFICATION_AUTHORITY="current_security_enrichment_v1"
const CLASSIFICATION_VERSION="PortfolioAI_P7_IC0_PORTFOLIO_COVERAGE_MATRIX_2026-09-28.json"
const ASSIGNMENT_AUTHORITY="PORTFOLIOAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_V1"
const ASSIGNMENT_VERSION="e7c021b865fcd1d49a7c59924ef9c44f0383f301"
type Json=Record<string,unknown>
type CoverageRow={securityId:string;symbol:string;sector:string;industry:string;ic1State:string;profileCode:string|null;subprofileCode:string|null;methodologyAuthority:string|null;r7PolicyCode:string|null}
type Observation=InputObservation & {security_id:string}
type SourceRecord={id:string;source_code:string;record_kind:string;retrieved_at:string;raw_payload:Json}
type ReviewFacts={reviews:RequirementReview[];reviewSources:ReviewedSourceRecord[];researchDocuments:ReviewedResearchDocument[];documentSources:ReviewedDocumentSource[]}
type LoadedHistory={rows:HistoryRow[];inspection:HistoryValidation}
type History=LoadedHistory & {security_id:string}
type Benchmark={code:string;mapping_status:string;provider_code:string|null;provider_instrument_id:string|null;verified_at:string|null;history:LoadedHistory;source_record_id:string|null}
type Facts={portfolioId:string;portfolioOwnerId:string;generatedAt:string;totalEquities:number;securities:Array<{id:string;symbol:string;isin:string;exchange:string}>;observations:Observation[];definitions:MetricDefinition[];sourceRecords:SourceRecord[];histories:History[];benchmarks:Benchmark[];reviewFacts:ReviewFacts;historyProofs:Map<string,HistoryContractProof>}
type Item={requirement_code:string;metric_code:string|null;required:boolean;minimum_history:number;freshness_policy:string|null;benchmark_authority:string[];applicability:"APPLICABLE"|"NOT_APPLICABLE";evidence_state:"FRESH"|"STALE"|"MISSING"|"INSUFFICIENT"|"CONFLICTING"|"REVIEW_REQUIRED"|"NOT_APPLICABLE";candidate_evidence_ids:string[];selected_evidence_id:string|null;evidence_as_of_date:string|null;retrieved_at:string|null;fresh_through:string|null;source_provider:string|null;raw_source_record_id:string|null;normalized_value:unknown;validation_state:string;canonical_selection_state:string;reason_code:string;recommended_remediation_action:string}

const canonicalMetricCodes = P7_IC_CANONICAL_REQUIREMENT_METRICS

const projectRef=(v:string)=>{try{return new URL(v).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const sha=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(b=>b.toString(16).padStart(2,"0")).join("")
const reply=(status:number,body:Json)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
const dateOnly=(v:string|null)=>v?v.slice(0,10):null
const marketish=(c:string)=>/(PRICE_HISTORY|MARKET_DRAWDOWN|MAX_DRAWDOWN|CYCLE_DRAWDOWN|VOLATILITY|MOMENTUM|TOTAL_RETURN|RELATIVE_STRENGTH)/u.test(c)

async function loadHistoryRows(admin:Admin,table:"market_price_history"|"market_benchmark_price_history",column:"security_id"|"benchmark_code",id:string,sourceCutoffAt:string):Promise<HistoryRow[]>{
 const rows:HistoryRow[]=[]
 for(let offset=0;offset<20000;offset+=500){
  const fields=table==="market_price_history"?"period_start,retrieved_at,close::text,adjusted_close::text,provenance":"period_start,retrieved_at,close::text,provenance"
  const result=await admin.from(table).select(fields).eq(column,id).eq("interval","ONE_DAY").eq("provider_code","ANGEL_ONE").lte("retrieved_at",sourceCutoffAt).order("period_start").order("retrieved_at").range(offset,offset+499)
  if(result.error)throw result.error
  rows.push(...(result.data??[]) as unknown as HistoryRow[])
  if((result.data?.length??0)<500)return rows
 }
 throw new Error("HISTORY_READ_BOUND_EXCEEDED")
}
async function loadStockHistories(admin:Admin,ids:readonly string[],sourceCutoffAt:string):Promise<History[]>{
 return await Promise.all(ids.map(async securityId=>{const rows=await loadHistoryRows(admin,"market_price_history","security_id",securityId,sourceCutoffAt);return{security_id:securityId,rows,inspection:inspectStoredHistory(rows,252,Date.parse(sourceCutoffAt))}}))
}
async function loadOfficialBenchmarkSources(admin:Admin,codes:readonly string[],sourceCutoffAt:string):Promise<Map<string,OfficialBenchmarkSourceRecord>>{
 const rows:OfficialBenchmarkSourceRecord[]=[]
 if(!codes.length)return new Map()
 for(let offset=0;offset<5000;offset+=500){
  const result=await admin.from("data_source_records")
   .select("id,source_code,record_kind,retrieved_at,payload_hash,raw_payload,source_url")
   .eq("source_code","NIFTY_OFFICIAL")
   .eq("record_kind","V1_4_OFFICIAL_BENCHMARK_CAPTURE")
   .eq("raw_payload->>return_basis","PRICE_RETURN_RAW_CLOSE")
   .in("raw_payload->>benchmark_code",codes)
   .lte("retrieved_at",sourceCutoffAt)
   .order("retrieved_at").order("id").range(offset,offset+499)
  if(result.error)throw result.error
  rows.push(...(result.data??[]) as unknown as OfficialBenchmarkSourceRecord[])
  if((result.data?.length??0)<500)break
  if(offset===4500)throw new Error("OFFICIAL_BENCHMARK_SOURCE_READ_BOUND_EXCEEDED")
 }
 const grouped=new Map<string,OfficialBenchmarkSourceRecord[]>()
 for(const row of rows){
  const code=String(row.raw_payload.benchmark_code??"")
  if(!code)continue
  const list=grouped.get(code)??[];list.push(row);grouped.set(code,list)
 }
 const out=new Map<string,OfficialBenchmarkSourceRecord>()
 for(const [code,list] of grouped){
  list.sort((a,b)=>a.retrieved_at.localeCompare(b.retrieved_at)||a.id.localeCompare(b.id))
  const latest=list.at(-1)!
  const tied=list.filter(x=>x.retrieved_at===latest.retrieved_at)
  if(tied.length>1&&new Set(tied.map(x=>x.payload_hash)).size>1)throw new Error("OFFICIAL_BENCHMARK_SOURCE_CONFLICT")
  out.set(code,latest)
 }
 return out
}
async function loadExchangeCalendarProofIds(admin:Admin,sourceCutoffAt:string):Promise<string[]>{
 const result=await admin.from("data_source_records")
  .select("id,retrieved_at,raw_payload")
  .eq("source_code","NIFTY_OFFICIAL")
  .eq("record_kind","V1_4_EXCHANGE_CALENDAR_PROOF")
  .lte("retrieved_at",sourceCutoffAt)
  .order("retrieved_at",{ascending:false})
  .order("id",{ascending:false})
  .limit(5)
 if(result.error)throw result.error
 const valid=(result.data??[]).filter(row=>{
  const p=row.raw_payload as Json
  return p.version==="V1_4_EXCHANGE_CALENDAR_PROOF_V1"
   &&p.exchange==="NSE"
   &&p.authority==="NIFTY_OFFICIAL"
   &&p.all_source_session_sets_identical===true
   &&Number(p.session_count)>=252
   &&String(p.first_session)<="2025-09-01"
   &&String(p.last_session)>="2026-10-06"
   &&/^[a-f0-9]{64}$/u.test(String(p.session_set_sha256??""))
 })
 if(!valid.length)return[]
 const latest=valid[0]!
 const sameTime=valid.filter(row=>row.retrieved_at===latest.retrieved_at)
 if(sameTime.length>1&&new Set(sameTime.map(row=>JSON.stringify(row.raw_payload))).size>1)throw new Error("EXCHANGE_CALENDAR_PROOF_CONFLICT")
 return[String(latest.id)]
}
async function loadBenchmarkHistories(admin:Admin,benchmarks:readonly Array<{code:string;provider_code:string|null;mapping_status:string}>,sourceCutoffAt:string){
 const officialCodes=benchmarks.filter(x=>x.provider_code==="NIFTY_OFFICIAL"&&x.mapping_status==="VERIFIED").map(x=>x.code)
 const official=await loadOfficialBenchmarkSources(admin,officialCodes,sourceCutoffAt)
 const calendarSourceRecordIds=await loadExchangeCalendarProofIds(admin,sourceCutoffAt)
 return new Map(await Promise.all(benchmarks.map(async benchmark=>{
  const code=String(benchmark.code)
  if(benchmark.provider_code==="NIFTY_OFFICIAL"&&benchmark.mapping_status==="VERIFIED"){
   const source=official.get(code)
   if(!source)return[code,{rows:[] as HistoryRow[],inspection:inspectStoredHistory([],252,Date.parse(sourceCutoffAt)),sourceRecordId:null}] as const
   const loaded=await loadVerifiedOfficialBenchmarkHistory({record:source,sourceCutoffAt,minimum:252,maximum:400,exchangeCalendarSourceRecordIds:calendarSourceRecordIds})
   return[code,{rows:loaded.rows,inspection:inspectStoredHistory(loaded.rows,252,Date.parse(sourceCutoffAt)),sourceRecordId:loaded.sourceRecordId}] as const
  }
  const rows=await loadHistoryRows(admin,"market_benchmark_price_history","benchmark_code",code,sourceCutoffAt)
  return[code,{rows,inspection:inspectStoredHistory(rows,252,Date.parse(sourceCutoffAt)),sourceRecordId:null}] as const
 })))
}
async function loadHistoryContractProofs(admin:Admin,sourceCutoffAt:string):Promise<Map<string,HistoryContractProof>>{
 const rows:Array<{id:string;retrieved_at:string;raw_payload:Json}>=[]
 for(let offset=0;offset<5000;offset+=500){
  const result=await admin.from("data_source_records").select("id,retrieved_at,raw_payload").eq("record_kind","V1_4_HISTORY_CONTRACT_VALIDATION").lte("retrieved_at",sourceCutoffAt).order("retrieved_at").order("id").range(offset,offset+499)
  if(result.error)throw result.error
  rows.push(...(result.data??[]) as Array<{id:string;retrieved_at:string;raw_payload:Json}>)
  if((result.data?.length??0)<500)break
  if(offset===4500)throw new Error("HISTORY_CONTRACT_PROOF_READ_BOUND_EXCEEDED")
 }
 const grouped=new Map<string,Array<{id:string;retrieved_at:string;proof:HistoryContractProof}>>()
 for(const row of rows){
  const targetType=String(row.raw_payload.target_type??""),targetId=String(row.raw_payload.target_id??"")
  if(!["SECURITY","BENCHMARK"].includes(targetType)||!targetId)continue
  const proof=parseHistoryContractProof(row.raw_payload.proof);if(!proof)continue
  const key=targetType+":"+targetId,list=grouped.get(key)??[];list.push({id:row.id,retrieved_at:row.retrieved_at,proof});grouped.set(key,list)
 }
 const out=new Map<string,HistoryContractProof>()
 for(const [key,list] of grouped){
  list.sort((a,b)=>a.retrieved_at.localeCompare(b.retrieved_at)||a.id.localeCompare(b.id))
  const latest=list.at(-1)!;const tied=list.filter(x=>x.retrieved_at===latest.retrieved_at)
  if(tied.length>1&&new Set(tied.map(x=>JSON.stringify(x.proof))).size>1)throw new Error("HISTORY_CONTRACT_PROOF_CONFLICT")
  out.set(key,latest.proof)
 }
 return out
}
async function loadObservations(admin:Admin,ids:readonly string[],sourceCutoffAt:string):Promise<Observation[]>{
 const rows:Observation[]=[]
 for(let offset=0;offset<20000;offset+=500){
  const result=await admin.from("fundamental_observations").select("id,security_id,metric_code,numeric_value::text,text_value,boolean_value,date_value,unit,currency,consolidation_scope,period_start,period_end,period_type,retrieved_at,fresh_until,published_at,evidence_status,source_code,source_record_id").in("security_id",ids).lte("retrieved_at",sourceCutoffAt).order("id").range(offset,offset+499)
  if(result.error)throw result.error
  rows.push(...(result.data??[]) as Observation[])
  if((result.data?.length??0)<500)return rows
 }
 throw new Error("OBSERVATION_READ_BOUND_EXCEEDED")
}

async function loadReviewFacts(admin:Admin,portfolioId:string,ids:readonly string[],sourceCutoffAt:string):Promise<ReviewFacts>{
 const reviews:RequirementReview[]=[]
 for(let offset=0;offset<5000;offset+=500){
  const result=await admin.from("research_evidence_requirement_reviews")
   .select("id,portfolio_id,security_id,requirement_code,review_kind,decision,source_record_id,research_document_id,provider_document_id,source_payload_hash,supporting_quote,period_start,period_end,period_type,unit,currency,consolidation_scope,published_at,retrieved_at,fresh_through,review_version,reviewed_by,reviewed_at,review_hash,supersedes_review_id,metadata,created_at")
   .eq("portfolio_id",portfolioId).in("security_id",ids).lte("reviewed_at",sourceCutoffAt).order("reviewed_at").order("id").range(offset,offset+499)
  if(result.error)throw result.error
  reviews.push(...(result.data??[]) as unknown as RequirementReview[])
  if((result.data?.length??0)<500)break
  if(offset===4500)throw new Error("REVIEW_FACTS_COMPLETENESS_NOT_PROVEN")
 }
 const sourceIds=[...new Set(reviews.map(row=>row.source_record_id).filter((id):id is string=>Boolean(id)))]
 const documentIds=[...new Set(reviews.map(row=>row.research_document_id).filter((id):id is string=>Boolean(id)))]
 const reviewSources:ReviewedSourceRecord[]=[],researchDocuments:ReviewedResearchDocument[]=[],documentSources:ReviewedDocumentSource[]=[]
 for(let i=0;i<sourceIds.length;i+=100){
  const result=await admin.from("data_source_records").select("id,source_code,retrieved_at,published_at,payload_hash,raw_payload").in("id",sourceIds.slice(i,i+100))
  if(result.error)throw result.error
  reviewSources.push(...(result.data??[]) as unknown as ReviewedSourceRecord[])
 }
 for(let i=0;i<documentIds.length;i+=100){
  const idsChunk=documentIds.slice(i,i+100)
  const [docs]=await Promise.all([
   admin.from("research_documents").select("id,security_id,reporting_period_start,reporting_period_end,reporting_period_type,published_at,canonical_content_hash,identity_status,authoritative_identifier_scheme,authoritative_identifier,metadata_identity_hash").in("id",idsChunk),
   Promise.resolve({data:[],error:null}),
  ])
  if(docs.error)throw docs.error
  researchDocuments.push(...(docs.data??[]) as unknown as ReviewedResearchDocument[])
  for(let offset=0;offset<5000;offset+=500){
   const links=await admin.from("research_document_sources").select("id,research_document_id,source_record_id,source_code,content_hash,source_status,provider_document_id,source_url,retrieved_at").in("research_document_id",idsChunk).order("id").range(offset,offset+499)
   if(links.error)throw links.error
   documentSources.push(...(links.data??[]) as unknown as ReviewedDocumentSource[])
   if((links.data?.length??0)<500)break
   if(offset===4500)throw new Error("REVIEW_DOCUMENT_SOURCES_COMPLETENESS_NOT_PROVEN")
  }
 }
 if(reviewSources.length!==sourceIds.length||researchDocuments.length!==documentIds.length)throw new Error("REVIEW_REFERENCED_FACTS_INCOMPLETE")
 return{reviews,reviewSources,researchDocuments,documentSources}
}

async function loadSliceFacts(admin:Admin,portfolioId:string,offset:number,limit:number,sourceCutoffAt:string):Promise<Facts>{
 const portfolio=await admin.from("portfolios").select("user_id").eq("id",portfolioId).maybeSingle()
 if(portfolio.error)throw portfolio.error
 if(!portfolio.data?.user_id)throw new Error("PORTFOLIO_OWNER_AUTHORITY_NOT_PROVEN")
 const portfolioOwnerId=String(portfolio.data.user_id)
 const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",portfolioId)
 if(holdings.error)throw holdings.error
 const openIds=(holdings.data??[]).filter(row=>Number(row.current_quantity)>0).map(row=>String(row.security_id))
 const securitiesResult=await admin.from("securities").select("id,symbol,isin,exchange,asset_class").in("id",openIds).eq("asset_class","EQUITY").order("symbol")
 if(securitiesResult.error)throw securitiesResult.error
 const securities=(securitiesResult.data??[]).slice(offset,offset+limit).map(row=>({id:String(row.id),symbol:String(row.symbol),isin:String(row.isin??""),exchange:String(row.exchange??"")}))
 const ids=securities.map(row=>row.id)
 const totalEquities=securitiesResult.data?.length??0
 if(!ids.length)return{portfolioId,portfolioOwnerId,generatedAt:new Date().toISOString(),totalEquities,securities,observations:[],definitions:[],sourceRecords:[],histories:[],benchmarks:[],reviewFacts:{reviews:[],reviewSources:[],researchDocuments:[],documentSources:[]},historyProofs:new Map()}
 const coverageById=new Map((coverage as {rows:CoverageRow[]}).rows.map(row=>[row.securityId,row]))
 const requiredBenchmarkCodes=[...new Set(securities.flatMap(security=>{
  const assignment=coverageById.get(security.id)
  if(!assignment||assignment.ic1State!=="RESOLVED"||!assignment.profileCode)return[]
  try{
   const authority=resolveV14BenchmarkAuthority({profileCode:assignment.profileCode,subprofileCode:assignment.subprofileCode,benchmarkAuthority:p7IcProfileContract(assignment.profileCode).benchmarkAuthority??[]})
   return executableV14BenchmarkCodes(authority)
  }catch{return[]}
 }))]
 const benchmarkResult=requiredBenchmarkCodes.length
  ?await admin.from("market_benchmarks").select("code,mapping_status,provider_code,provider_instrument_id,verified_at").in("code",requiredBenchmarkCodes)
  :{data:[],error:null}
 if(benchmarkResult.error)throw benchmarkResult.error
 const [observations,definitionsResult,sourceRecordsResult,histories,benchmarkHistory,reviewFacts,historyProofs]=await Promise.all([
  loadObservations(admin,ids,sourceCutoffAt),
  admin.from("fundamental_metric_definitions").select("code,canonical_unit,value_kind,is_active,freshness_seconds,definition"),
  admin.from("data_source_records").select("id,source_code,record_kind,retrieved_at,raw_payload").in("record_kind",["COMPLETE_RESEARCH_STRUCTURED_METRICS","COMPLETE_RESEARCH_DOCUMENT_SEARCH","COMPLETE_RESEARCH_OWNERSHIP"]).in("raw_payload->>security_id",ids).lte("retrieved_at",sourceCutoffAt).order("retrieved_at"),
  loadStockHistories(admin,ids,sourceCutoffAt),
  loadBenchmarkHistories(admin,(benchmarkResult.data??[]).map(row=>({code:String(row.code),provider_code:row.provider_code===null?null:String(row.provider_code),mapping_status:String(row.mapping_status)})),sourceCutoffAt),
  loadReviewFacts(admin,portfolioId,ids,sourceCutoffAt),
  loadHistoryContractProofs(admin,sourceCutoffAt),
 ])
 for(const result of [definitionsResult,sourceRecordsResult])if(result.error)throw result.error
 const benchmarks=(benchmarkResult.data??[]).map(row=>{const loaded=benchmarkHistory.get(String(row.code))??{rows:[],inspection:inspectStoredHistory([],252,Date.parse(sourceCutoffAt)),sourceRecordId:null};return{code:String(row.code),mapping_status:String(row.mapping_status),provider_code:row.provider_code===null?null:String(row.provider_code),provider_instrument_id:row.provider_instrument_id===null?null:String(row.provider_instrument_id),verified_at:row.verified_at===null?null:String(row.verified_at),history:{rows:loaded.rows,inspection:loaded.inspection},source_record_id:loaded.sourceRecordId}})
 return{portfolioId,portfolioOwnerId,generatedAt:new Date().toISOString(),totalEquities,securities,observations,definitions:(definitionsResult.data??[]) as MetricDefinition[],sourceRecords:(sourceRecordsResult.data??[]) as SourceRecord[],histories,benchmarks,reviewFacts,historyProofs}
}
const benchmarkish=(c:string)=>/(APPROVED_BENCHMARK|BENCHMARK_HISTORY|BENCHMARK_RELATIVE)/u.test(c)
const ownershipish=(c:string)=>/(OWNERSHIP|PROMOTER|FII|DII|INSTITUTIONAL|SHAREHOLDING)/u.test(c)

function blocked(code:string,minimum:number,freshness:string|null,benchmarks:string[],state:Item["evidence_state"],reason:string,action:string):Item{return {requirement_code:code,metric_code:null,required:true,minimum_history:minimum,freshness_policy:freshness,benchmark_authority:benchmarks,applicability:"APPLICABLE",evidence_state:state,candidate_evidence_ids:[],selected_evidence_id:null,evidence_as_of_date:null,retrieved_at:null,fresh_through:null,source_provider:null,raw_source_record_id:null,normalized_value:null,validation_state:"FAIL_CLOSED",canonical_selection_state:"NO_SELECTION",reason_code:reason,recommended_remediation_action:action}}

function newestObservation<T extends InputObservation>(rows:readonly T[]):T{
 return [...rows].sort((a,b)=>b.retrieved_at.localeCompare(a.retrieved_at)||b.id.localeCompare(a.id))[0]!
}

function normalizeOverviewEvidence(result:string,plan:ReturnType<typeof buildProfileEvidencePlan>){
 const lines=result.split(/\r?\n/u),start=lines.findIndex(line=>line.trim()==="fundamentalData:")
 if(start<0)return []
 const rows:Array<{title:string;value:number;uniqueName:string}>=[]
 for(let i=start+1;i<lines.length;i++){
  const t=lines[i].trim()
  if(!t)continue
  if(/^[A-Za-z][A-Za-z0-9_ ]+:$/u.test(t)&&t!=="fundamentalData:")break
  if(!t.includes("|"))continue
  const f=t.split("|").map(x=>x.trim())
  if(f.length<8||f[0]==="name")continue
  const value=Number(f[1].replace(/,/gu,""))
  if(!Number.isFinite(value))continue
  rows.push({title:f[6],value,uniqueName:f[7]})
 }
 const pick=(patterns:readonly RegExp[])=>rows.filter(row=>patterns.some(p=>p.test(row.title)||p.test(row.uniqueName)))
 return plan.requirements
  .filter(req=>req.channels.includes("TRENDLYNE_PARAMETERS")&&req.minimumPeriods===1)
  .map(req=>{
   const code=req.evidenceCode
   let matches:Array<{title:string;value:number;uniqueName:string}>=[]
   if(/(^|_)PE(_|$)|VALUATION/u.test(code))matches=pick([/^PE TTM$/iu,/^PE_TTM$/iu])
   else if(/PB|PRICE_TO_BOOK/u.test(code))matches=pick([/^Price to Book$/iu,/^PBV_A$/iu])
   else if(/(^|_)ROE(_|$)/u.test(code))matches=pick([/^ROE Annual %$/iu,/^ROE_A$/iu])
   else if(/CFO|CASH_FLOW/u.test(code))matches=pick([/^Cash from Operating Activity Annual$/iu,/^CFO_A$/iu])
   if(!matches.length)return {evidenceCode:code,state:"MISSING",minimumPeriods:1,matchedSections:[]}
   return {evidenceCode:code,state:"AVAILABLE",minimumPeriods:1,matchedSections:matches.map(x=>({label:x.title,numericValue:x.value,providerField:x.uniqueName}))}
  })
}

function projectCachedRecords(records:SourceRecord[],security:{id:string;symbol:string},plan:ReturnType<typeof buildProfileEvidencePlan>):SourceRecord[]{
 return records.map(record=>{
   const raw=record.raw_payload??{}
   const result=typeof raw.result==="string"?raw.result:null
   const providerInstrumentId=typeof raw.provider_instrument_id==="string"?raw.provider_instrument_id:null
   if(!result||!providerInstrumentId)return record
   try{
     if(record.record_kind==="COMPLETE_RESEARCH_OVERVIEW"&&!Array.isArray(raw.p7_ic2_normalized_evidence)){
       return {...record,raw_payload:{...raw,p7_ic2_normalized_evidence:normalizeOverviewEvidence(result,plan),p7_ic2_cache_reprojected:true,p7_ic2_overview_projection:true}}
     }
     if(record.record_kind==="COMPLETE_RESEARCH_STRUCTURED_METRICS"&&!Array.isArray(raw.p7_ic2_normalized_evidence)){
       return {...record,raw_payload:{...raw,p7_ic2_normalized_evidence:normalizeNumericEvidence({providerResult:result,expectedSymbol:security.symbol,expectedInstrumentId:providerInstrumentId,requirements:plan.requirements}),p7_ic2_cache_reprojected:true}}
     }
     if(record.record_kind==="COMPLETE_RESEARCH_DOCUMENT_SEARCH"&&!Array.isArray(raw.p7_ic2_normalized_evidence)){
       return {...record,raw_payload:{...raw,p7_ic2_normalized_evidence:normalizeDocumentEvidence({providerResult:result,expectedSymbol:security.symbol,expectedInstrumentId:providerInstrumentId,requirements:plan.requirements}),p7_ic2_cache_reprojected:true}}
     }
     if(record.record_kind==="COMPLETE_RESEARCH_OWNERSHIP"&&!(raw.p7_ic2_ownership_history&&typeof raw.p7_ic2_ownership_history==="object")){
       return {...record,raw_payload:{...raw,p7_ic2_ownership_history:parseTrendlyneOwnershipHistory(result),p7_ic2_cache_reprojected:true}}
     }
   }catch{
     return record
   }
   return record
 })
}

async function requirementItem(input:{code:string;family:ReviewEvidenceFamily;minimum:number;freshness:string|null;benchmarks:string[];portfolioId:string;portfolioOwnerId:string;securityId:string;observations:Observation[];definitions:MetricDefinition[];records:SourceRecord[];reviews:RequirementReview[];reviewSources:ReviewedSourceRecord[];researchDocuments:ReviewedResearchDocument[];documentSources:ReviewedDocumentSource[];history?:History;benchmarkByCode:Map<string,Benchmark>;historyProofs:Map<string,HistoryContractProof>;evaluationAsOfMs:number;sourceCutoffAtMs:number}):Promise<Item>{
 const {code,family,minimum,freshness,benchmarks,portfolioId,portfolioOwnerId,securityId,observations,definitions,records,reviews,reviewSources,researchDocuments,documentSources,history,benchmarkByCode,historyProofs,evaluationAsOfMs,sourceCutoffAtMs}=input
 if(family==="BENCHMARK_HISTORY"){
   const required=executableV14BenchmarkCodes(benchmarks)
   if(!required.length||!history)return blocked(code,minimum,freshness,benchmarks,"MISSING","BENCHMARK_OR_STOCK_HISTORY_MISSING","VALIDATE_APPROVED_HISTORY_CONTRACT")
   const validations=required.map(benchmarkCode=>{const benchmark=benchmarkByCode.get(benchmarkCode);if(!benchmark)return{code:benchmarkCode,result:null};return{code:benchmarkCode,result:validateBenchmarkPairReadiness({stockRows:history.rows,benchmarkRows:benchmark.history.rows,minimum,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:freshness,benchmark:{code:benchmark.code,mapping_status:benchmark.mapping_status,provider_code:benchmark.provider_code,provider_instrument_id:benchmark.provider_instrument_id,verified_at:benchmark.verified_at},stockProof:historyProofs.get("SECURITY:"+securityId)??historyProofFromRows(history.rows),benchmarkProof:historyProofs.get("BENCHMARK:"+benchmarkCode)??historyProofFromRows(benchmark.history.rows)})}})
   if(validations.some(v=>v.result===null))return blocked(code,minimum,freshness,benchmarks,"MISSING","BENCHMARK_MAPPING_NOT_PROVEN","RECONCILE_EXACT_APPROVED_BENCHMARK_MAPPING")
   const priority=["CONFLICTING","REVIEW_REQUIRED","STALE","INSUFFICIENT","FRESH"] as const
   const worst=validations.map(v=>v.result!).sort((a,b)=>priority.indexOf(a.state)-priority.indexOf(b.state))[0]!
   const allFresh=validations.every(v=>v.result?.state==="FRESH")
   const providers=[...new Set(required.map(x=>benchmarkByCode.get(x)?.provider_code).filter((x):x is string=>Boolean(x)))]
   const sourceIds=[...new Set(required.map(x=>benchmarkByCode.get(x)?.source_record_id).filter((x):x is string=>Boolean(x)))]
   return {...blocked(code,minimum,freshness,benchmarks,allFresh?"FRESH":worst.state,allFresh?"STOCK_BENCHMARK_HISTORY_READY":worst.reason,allFresh?"NONE":"VALIDATE_APPROVED_HISTORY_CONTRACT"),retrieved_at:validations.map(v=>v.result?.retrievedAt??null).filter((x):x is string=>Boolean(x)).sort().at(-1)??null,evidence_as_of_date:validations.map(v=>v.result?.latestSession??null).filter((x):x is string=>Boolean(x)).sort().at(-1)??null,source_provider:providers.length===1?providers[0]!:null,raw_source_record_id:sourceIds.length===1?sourceIds[0]!:null,normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,historyValidationVersion:"V1_4_HISTORY_READINESS_V1",benchmarkCodes:required,benchmarkProviders:providers,validations},validation_state:allFresh?"VALIDATED_HISTORY_CONTRACT":"FAIL_CLOSED",canonical_selection_state:allFresh?"DETERMINISTIC_HISTORY_CONTRACT":"NO_SELECTION"}
 }
 if(family==="MARKET_HISTORY"){
   if(!history)return blocked(code,minimum,freshness,benchmarks,"INSUFFICIENT","DISTINCT_SESSIONS_INSUFFICIENT","VALIDATE_APPROVED_HISTORY_CONTRACT")
   const validation=validateStockHistoryReadiness({rows:history.rows,minimum,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:freshness,proof:historyProofs.get("SECURITY:"+securityId)??historyProofFromRows(history.rows)})
   return {...blocked(code,minimum,freshness,benchmarks,validation.state,validation.reason,validation.state==="FRESH"?"NONE":"VALIDATE_APPROVED_HISTORY_CONTRACT"),retrieved_at:validation.retrievedAt,evidence_as_of_date:validation.latestSession,source_provider:"ANGEL_ONE",normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,historyValidationVersion:"V1_4_HISTORY_READINESS_V1",validation},validation_state:validation.state==="FRESH"?"VALIDATED_HISTORY_CONTRACT":"FAIL_CLOSED",canonical_selection_state:validation.state==="FRESH"?"DETERMINISTIC_HISTORY_CONTRACT":"NO_SELECTION"}
 }
 const normalized=records.flatMap(record=>{
   const raw=record.raw_payload,items=Array.isArray(raw.p7_ic2_normalized_evidence)?raw.p7_ic2_normalized_evidence:[]
   if(family==="OWNERSHIP_4Q"&&raw.p7_ic2_ownership_history&&typeof raw.p7_ic2_ownership_history==="object")return [{record,value:raw.p7_ic2_ownership_history as Json,...cachedEvidenceReadiness(String((raw.p7_ic2_ownership_history as Json).state??"MISSING"),raw.p7_ic2_ownership_history,minimum)}]
   return items.filter(x=>x&&typeof x==="object"&&String((x as Json).evidenceCode)===code).map(x=>({record,value:x as Json,...cachedEvidenceReadiness(guardedNumericEvidenceState(String((x as Json).state??"MISSING"),x,minimum),x,minimum)}))
 })
 const metricCodes=canonicalMetricCodes[code]??[code]
 const candidates=observations.filter(x=>x.security_id===securityId&&metricCodes.includes(x.metric_code))
 const reviewed=await validateReviewedRequirementEvidence({portfolioId,portfolioOwnerId,securityId,requirementCode:code,family,metricCodes,minimum,reviews,sources:reviewSources,documents:researchDocuments,documentSources,definitions,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:freshness})
 const reconciliation=reconcileCanonicalAndReviewed({canonicalRows:candidates,reviewed,definitions,minimum,evaluationAsOfMs,sourceCutoffAtMs,family})
 if(reconciliation.validation.state==="FRESH"){
   const selected=reconciliation.validation.selected
   if(reconciliation.authority==="REVIEW"&&reviewed){
     return {...blocked(code,minimum,freshness,benchmarks,"FRESH",reconciliation.reason,"NONE"),metric_code:reviewed.observations[0]?.metric_code??null,candidate_evidence_ids:[...reviewed.selectedReviewIds],selected_evidence_id:reviewed.selectedReviewIds.at(-1)??null,evidence_as_of_date:reviewed.evidenceAsOfDate,retrieved_at:reviewed.retrievedAt,fresh_through:dateOnly(reviewed.freshThrough),source_provider:reviewed.sourceCode,raw_source_record_id:reviewed.sourceRecordIds.at(-1)??null,normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,reviewedEvidence:reviewed.lineage,series:reviewed.observations},validation_state:"VALIDATED_REVIEW_LEDGER",canonical_selection_state:"DETERMINISTIC_REVIEW_LEDGER"}
   }
   if(selected.length){
     const x=newestObservation(selected),freshDates=selected.map(row=>row.fresh_until!).sort()
     return {...blocked(code,minimum,freshness,benchmarks,"FRESH",reconciliation.reason,"NONE"),metric_code:x.metric_code,candidate_evidence_ids:[...new Set([...candidates.map(row=>row.id),...(reviewed?.selectedReviewIds??[])])],selected_evidence_id:x.id,evidence_as_of_date:selected.at(-1)!.period_end,retrieved_at:x.retrieved_at,fresh_through:dateOnly(freshDates[0]!),source_provider:x.source_code,raw_source_record_id:x.source_record_id,normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,series:selected,reviewedEvidence:reviewed?.lineage??null},validation_state:reconciliation.authority==="COMBINED"?"VALIDATED_CANONICAL_PLUS_REVIEW":"VALIDATED",canonical_selection_state:reconciliation.authority==="COMBINED"?"DETERMINISTIC_RECONCILED_SERIES":"DETERMINISTIC_HISTORY_AGGREGATE"}
   }
 }
 if(reconciliation.validation.state==="CONFLICTING"){
   return {...blocked(code,minimum,freshness,benchmarks,"CONFLICTING",reconciliation.reason,"RECONCILE_CANONICAL_AND_REVIEW_CONFLICT"),candidate_evidence_ids:[...new Set([...candidates.map(x=>x.id),...(reviewed?.selectedReviewIds??[])])],normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,canonical:candidates,reviewed:reviewed?.lineage??null}}
 }
 if(candidates.length||reviewed){
   const state=reconciliation.validation.state
   return {...blocked(code,minimum,freshness,benchmarks,state,reconciliation.validation.reason,"RECONCILE_CANONICAL_INPUT_CONTRACT"),candidate_evidence_ids:[...new Set([...candidates.map(x=>x.id),...(reviewed?.selectedReviewIds??[])])],raw_source_record_id:reviewed?.sourceRecordIds.at(-1)??null,retrieved_at:reviewed?.retrievedAt??null,evidence_as_of_date:reviewed?.evidenceAsOfDate??null,fresh_through:dateOnly(reviewed?.freshThrough??null),source_provider:reviewed?.sourceCode??null,normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,canonical:candidates,reviewed:reviewed?.lineage??null}}
 }
 const review=normalized.find(x=>x.state.includes("REVIEW"))
 if(review){
   const historyReview=minimum>1&&Array.isArray(review.value.matchedSections)
   return {...blocked(code,minimum,freshness,benchmarks,"REVIEW_REQUIRED",historyReview?"DATED_REPORTING_PERIODS_NOT_PROVEN":review.reason??"DOCUMENT_EVIDENCE_REQUIRES_REVIEW",historyReview?"RECONCILE_DATED_REPORTING_PERIODS":"REVIEW_DOCUMENT_EVIDENCE"),candidate_evidence_ids:[review.record.id],raw_source_record_id:review.record.id,retrieved_at:review.record.retrieved_at,source_provider:review.record.source_code,normalized_value:review.value}
 }
 return blocked(code,minimum,freshness,benchmarks,"MISSING","REQUIRED_EVIDENCE_MISSING","CACHE_FIRST_PROVIDER_REFRESH")
}

Deno.serve(async request=>{
 if(request.method!=="POST")return reply(405,{error:"Method not allowed."})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",ref=projectRef(url)
 if(ref===PROD_REF)return reply(409,{error:"P7 IC2 materializer refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
 if(ref!==DEV_REF||!key)return reply(500,{error:"Development runtime configuration is incomplete."})
 try{
  const body=await request.json() as Json,portfolioId=String(body.portfolioId??""),offset=Number(body.offset??0),limit=Number(body.limit??40),selectionRunId=String(body.selectionRunId??""),evaluationAsOf=String(body.evaluationAsOf??""),sourceCutoffAt=String(body.sourceCutoffAt??"")
  const evaluationAsOfMs=Date.parse(evaluationAsOf),sourceCutoffAtMs=Date.parse(sourceCutoffAt)
  const dryRun=body.action===VALIDATE_ACTION
  const postCloseRetrievalWindowMs=4*60*60*1000
  if((body.action!==ACTION&&!dryRun)||!portfolioId||!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>40||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(selectionRunId)||!Number.isFinite(evaluationAsOfMs)||!Number.isFinite(sourceCutoffAtMs)||sourceCutoffAtMs<evaluationAsOfMs||sourceCutoffAtMs>evaluationAsOfMs+postCloseRetrievalWindowMs)return reply(400,{error:"Exact action, portfolioId, bounded slice, selection run, evaluation time, and bounded post-close source cutoff are required."})
  const scope=`ALL_HELD_EQUITIES:${offset}:${limit}`
  const admin=createClient(url,key,{auth:{persistSession:false}})
  if(dryRun){
   const authorization=request.headers.get("Authorization")??""
   if(!authorization.startsWith("Bearer "))return reply(401,{error:"An authenticated owner session is required."})
   const user=await admin.auth.getUser(authorization.slice(7))
   if(user.error||!user.data.user)return reply(401,{error:"Invalid owner session."})
   const owned=await admin.from("portfolios").select("id").eq("id",portfolioId).eq("user_id",user.data.user.id).maybeSingle()
   if(owned.error)throw owned.error
   if(!owned.data)return reply(404,{error:"Portfolio not found."})
  }else{
   const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId,securityId:scope})
   if(!grant.ok)return reply(401,{error:grant.message,code:grant.code})
  }
  const facts=await loadSliceFacts(admin,portfolioId,offset,limit,sourceCutoffAt),coverageRows=(coverage as {rows:CoverageRow[]}).rows,coverageById=new Map(coverageRows.map(x=>[x.securityId,x])),historyById=new Map(facts.histories.map(x=>[x.security_id,x])),benchmarkByCode=new Map(facts.benchmarks.map(x=>[x.code,x]))
  const dryRunResults:Array<{securityId:string;status:string;snapshotHash:string;items:Item[]}>=[]
  const snapshotIds:string[]=[],selectionIds:string[]=[],totals:Record<string,number>={},writeTotals={snapshotsCreated:0,snapshotsReused:0,selectionsCreated:0,selectionsReused:0}
  const slice=facts.securities
  for(const security of slice){
   const assignment=coverageById.get(security.id);if(!assignment)throw new Error(`METHODOLOGY_ASSIGNMENT_MISSING:${security.symbol}`)
   let items:Item[]
   const authority=assignment.methodologyAuthority??"P7_IC1_REVIEW_REQUIRED",profile=assignment.profileCode??"UNRESOLVED"
   if(assignment.ic1State!=="RESOLVED"||!assignment.profileCode){items=[blocked("METHODOLOGY_ASSIGNMENT",1,null,[],"REVIEW_REQUIRED","METHODOLOGY_REVIEW_REQUIRED","OWNER_FACTUAL_REVIEW")]}
   else{
    const contract=p7IcProfileContract(assignment.profileCode)
    const benchmarkAuthority=resolveV14BenchmarkAuthority({profileCode:assignment.profileCode,subprofileCode:assignment.subprofileCode,benchmarkAuthority:contract.benchmarkAuthority??[]})
    const plan=buildProfileEvidencePlan(contract),baseRecords=facts.sourceRecords.filter(x=>String(x.raw_payload.security_id)===security.id),records=projectCachedRecords(baseRecords,security,plan)
    items=await Promise.all(plan.requirements.map(req=>requirementItem({code:req.evidenceCode,family:req.deterministicCoverageRule,minimum:req.minimumPeriods,freshness:(contract.signalRequirements.find(x=>(x.evidenceCodes??[x.signalCode]).includes(req.evidenceCode)) as {freshnessPolicy?:string}|undefined)?.freshnessPolicy??null,benchmarks:benchmarkAuthority,portfolioId,portfolioOwnerId:facts.portfolioOwnerId,securityId:security.id,observations:facts.observations,definitions:facts.definitions,records,reviews:facts.reviewFacts.reviews,reviewSources:facts.reviewFacts.reviewSources,researchDocuments:facts.reviewFacts.researchDocuments,documentSources:facts.reviewFacts.documentSources,history:historyById.get(security.id),benchmarkByCode,historyProofs:facts.historyProofs,evaluationAsOfMs,sourceCutoffAtMs})))
   }
   const methodologyRole=assignment.subprofileCode??assignment.profileCode??"UNRESOLVED"
   const assignmentId=`${ASSIGNMENT_AUTHORITY}:${assignment.securityId}:${methodologyRole}`
   const lineage={classification_authority:CLASSIFICATION_AUTHORITY,classification_version:CLASSIFICATION_VERSION,methodology_role:methodologyRole,assignment_authority:ASSIGNMENT_AUTHORITY,assignment_id:assignmentId,assignment_version:ASSIGNMENT_VERSION}
   items.push({...blocked("IC3_SNAPSHOT_LINEAGE",1,null,[],"FRESH","IC3_LINEAGE_READY","NONE"),required:true,evidence_state:"FRESH",normalized_value:{sector:assignment.sector,industry:assignment.industry,...lineage},validation_state:"VALIDATED",canonical_selection_state:"IMMUTABLE_LINEAGE"})
   const states=new Set(items.map(x=>x.evidence_state)),status=states.has("CONFLICTING")?"CONFLICTING":states.has("REVIEW_REQUIRED")?"REVIEW_REQUIRED":states.has("STALE")?"STALE":states.has("MISSING")||states.has("INSUFFICIENT")?"INSUFFICIENT":"READY"
   totals[status]=(totals[status]??0)+1
   const hash=await sha({securityId:security.id,authority,profile,subprofile:assignment.subprofileCode,registry:REGISTRY_VERSION,lineage,items})
   if(dryRun){dryRunResults.push({securityId:security.id,status,snapshotHash:hash,items});continue}
   const result=await admin.rpc("append_and_select_research_evidence_snapshot_v3",{p_snapshot:{portfolio_id:portfolioId,security_id:security.id,as_of_date:new Date(evaluationAsOfMs).toISOString().slice(0,10),methodology_authority:authority,methodology_version:"V1",profile_code:profile,subprofile_code:assignment.subprofileCode,requirement_registry_version:REGISTRY_VERSION,snapshot_status:status,snapshot_hash:hash,created_by:null},p_items:items,p_selection:{selection_run_id:selectionRunId,execution_grant_id:String(body.grantId??""),evaluation_as_of:evaluationAsOf,source_cutoff_at:sourceCutoffAt,selection_basis:"IC3_CANONICAL_MATERIALIZATION",materializer_version:MATERIALIZER_VERSION,selected_by:null},p_lineage:lineage})
   if(result.error)throw result.error
   const written=result.data as {snapshot_id:string;selection_id:string;snapshot_created:boolean;snapshot_reused:boolean;selection_created:boolean;selection_reused:boolean}
   snapshotIds.push(String(written.snapshot_id));selectionIds.push(String(written.selection_id))
   if(written.snapshot_created)writeTotals.snapshotsCreated++;if(written.snapshot_reused)writeTotals.snapshotsReused++;if(written.selection_created)writeTotals.selectionsCreated++;if(written.selection_reused)writeTotals.selectionsReused++
  }
  return reply(200,{status:dryRun?"IC3_CANONICAL_INPUTS_VALIDATED_READ_ONLY":"IC3_CANONICAL_SNAPSHOTS_MATERIALIZED",dryRun,inputValidationVersion:P7_IC_INPUT_VALIDATION_VERSION,...(dryRun?{results:dryRunResults}:{}),portfolioId,selectionRunId,evaluationAsOf,sourceCutoffAt,offset,processed:slice.length,totalEquities:facts.totalEquities,nextOffset:offset+slice.length<facts.totalEquities?offset+slice.length:null,providerCalls:0,totals,writeTotals,snapshotIds,selectionIds})
 }catch(error){
  const obj=error&&typeof error==="object"&&!Array.isArray(error)?error as Record<string,unknown>:null
  const code=error instanceof Error?error.message:typeof obj?.code==="string"?String(obj.code):"IC3_MATERIALIZATION_FAILED"
  const safeDetail=obj?{message:typeof obj.message==="string"?obj.message:null,details:typeof obj.details==="string"?obj.details:null,hint:typeof obj.hint==="string"?obj.hint:null}:null
  console.error("IC3_MATERIALIZATION_ERROR",JSON.stringify({code,safeDetail}))
  return reply(500,{error:"IC3 canonical snapshot materialization failed safely.",code,safeDetail})
 }
})
