import { P7_IC_CANONICAL_REQUIREMENT_METRICS } from "../_shared/p7-ic-requirement-metrics.ts"
import {createClient,type SupabaseClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
type Admin = SupabaseClient
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import {buildProfileEvidencePlan,normalizeNumericEvidence,normalizeDocumentEvidence,parseTrendlyneOwnershipHistory,guardedNumericEvidenceState} from "../_shared/p7-ic-evidence-normalization.ts"
import {cachedEvidenceReadiness,inspectStoredHistory,validateObservationSeries,P7_IC_INPUT_VALIDATION_VERSION,type InputObservation,type MetricDefinition,type HistoryRow,type HistoryValidation} from "../_shared/p7-ic-input-validation.ts"
import {p7IcProfileContract} from "../_shared/p7-ic-profile-contracts.ts"
import coverage from "../../../docs/p7-ic/PortfolioAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_2026-09-29.json" with {type:"json"}

const DEV_REF="lrgpjimipfkyoqbpsqzz",PROD_REF="uxiyufbsbgzzdujzcdxe",ACTION="P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS"
const VALIDATE_ACTION="P7_IC3_VALIDATE_CANONICAL_INPUTS"
const REGISTRY_VERSION="PORTFOLIOAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1"
const MATERIALIZER_VERSION="P7_IC3_CANONICAL_SNAPSHOT_V2_INPUT_VALIDATION"
const CLASSIFICATION_AUTHORITY="current_security_enrichment_v1"
const CLASSIFICATION_VERSION="PortfolioAI_P7_IC0_PORTFOLIO_COVERAGE_MATRIX_2026-09-28.json"
const ASSIGNMENT_AUTHORITY="PORTFOLIOAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_V1"
const ASSIGNMENT_VERSION="e7c021b865fcd1d49a7c59924ef9c44f0383f301"
type Json=Record<string,unknown>
type CoverageRow={securityId:string;symbol:string;sector:string;industry:string;ic1State:string;profileCode:string|null;subprofileCode:string|null;methodologyAuthority:string|null;r7PolicyCode:string|null}
type Observation=InputObservation & {security_id:string}
type SourceRecord={id:string;source_code:string;record_kind:string;retrieved_at:string;raw_payload:Json}
type History=HistoryValidation & {security_id:string}
type Benchmark={code:string;mapping_status:string;provider_code:string|null;provider_instrument_id:string|null;verified_at:string|null;history:HistoryValidation}
type Facts={portfolioId:string;generatedAt:string;totalEquities:number;securities:Array<{id:string;symbol:string;isin:string;exchange:string}>;observations:Observation[];definitions:MetricDefinition[];sourceRecords:SourceRecord[];histories:History[];benchmarks:Benchmark[]}
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
 return await Promise.all(ids.map(async securityId=>({security_id:securityId,...inspectStoredHistory(await loadHistoryRows(admin,"market_price_history","security_id",securityId,sourceCutoffAt),252,Date.parse(sourceCutoffAt))})))
}
async function loadBenchmarkHistories(admin:Admin,codes:readonly string[],sourceCutoffAt:string){
 return new Map(await Promise.all(codes.map(async code=>[code,inspectStoredHistory(await loadHistoryRows(admin,"market_benchmark_price_history","benchmark_code",code,sourceCutoffAt),252,Date.parse(sourceCutoffAt))] as const)))
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

async function loadSliceFacts(admin:Admin,portfolioId:string,offset:number,limit:number,sourceCutoffAt:string):Promise<Facts>{
 const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",portfolioId)
 if(holdings.error)throw holdings.error
 const openIds=(holdings.data??[]).filter(row=>Number(row.current_quantity)>0).map(row=>String(row.security_id))
 const securitiesResult=await admin.from("securities").select("id,symbol,isin,exchange,asset_class").in("id",openIds).eq("asset_class","EQUITY").order("symbol")
 if(securitiesResult.error)throw securitiesResult.error
 const securities=(securitiesResult.data??[]).slice(offset,offset+limit).map(row=>({id:String(row.id),symbol:String(row.symbol),isin:String(row.isin??""),exchange:String(row.exchange??"")}))
 const ids=securities.map(row=>row.id)
 const totalEquities=securitiesResult.data?.length??0
 if(!ids.length)return{portfolioId,generatedAt:new Date().toISOString(),totalEquities,securities,observations:[],definitions:[],sourceRecords:[],histories:[],benchmarks:[]}
 const benchmarkResult=await admin.from("market_benchmarks").select("code,mapping_status,provider_code,provider_instrument_id,verified_at")
 if(benchmarkResult.error)throw benchmarkResult.error
 const [observations,definitionsResult,sourceRecordsResult,histories,benchmarkHistory]=await Promise.all([
  loadObservations(admin,ids,sourceCutoffAt),
  admin.from("fundamental_metric_definitions").select("code,canonical_unit,value_kind,is_active,freshness_seconds,definition"),
  admin.from("data_source_records").select("id,source_code,record_kind,retrieved_at,raw_payload").in("record_kind",["COMPLETE_RESEARCH_STRUCTURED_METRICS","COMPLETE_RESEARCH_DOCUMENT_SEARCH","COMPLETE_RESEARCH_OWNERSHIP"]).in("raw_payload->>security_id",ids).lte("retrieved_at",sourceCutoffAt).order("retrieved_at"),
  loadStockHistories(admin,ids,sourceCutoffAt),
  loadBenchmarkHistories(admin,(benchmarkResult.data??[]).map(row=>String(row.code)),sourceCutoffAt),
 ])
 for(const result of [definitionsResult,sourceRecordsResult])if(result.error)throw result.error
 const benchmarks=(benchmarkResult.data??[]).map(row=>({code:String(row.code),mapping_status:String(row.mapping_status),provider_code:row.provider_code===null?null:String(row.provider_code),provider_instrument_id:row.provider_instrument_id===null?null:String(row.provider_instrument_id),verified_at:row.verified_at===null?null:String(row.verified_at),history:benchmarkHistory.get(String(row.code))??inspectStoredHistory([],252,Date.parse(sourceCutoffAt))}))
 return{portfolioId,generatedAt:new Date().toISOString(),totalEquities,securities,observations,definitions:(definitionsResult.data??[]) as MetricDefinition[],sourceRecords:(sourceRecordsResult.data??[]) as SourceRecord[],histories,benchmarks}
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

function requirementItem(input:{code:string;minimum:number;freshness:string|null;benchmarks:string[];securityId:string;observations:Observation[];definitions:MetricDefinition[];records:SourceRecord[];history?:History;benchmarkByCode:Map<string,Benchmark>;evaluationAsOfMs:number;sourceCutoffAtMs:number}):Item{
 const {code,minimum,freshness,benchmarks,securityId,observations,definitions,records,history,benchmarkByCode,evaluationAsOfMs,sourceCutoffAtMs}=input

 if(benchmarkish(code)){
   const required=benchmarks.filter(x=>x.startsWith("NIFTY_")),rows=required.map(x=>benchmarkByCode.get(x))
   const mapped=required.length>0&&rows.every(x=>x?.mapping_status==="VERIFIED"&&x.provider_code==="ANGEL_ONE"&&x.provider_instrument_id&&x.verified_at&&Date.parse(x.verified_at)<=sourceCutoffAtMs)
   if(!mapped)return blocked(code,minimum,freshness,benchmarks,"MISSING","BENCHMARK_MAPPING_NOT_PROVEN","RECONCILE_EXACT_APPROVED_BENCHMARK_MAPPING")
   const conflict=rows.find(x=>x?.history.state==="CONFLICTING")
   const short=rows.find(x=>(x?.history.distinctSessions??0)<minimum)
   return {...blocked(code,minimum,freshness,benchmarks,conflict?"CONFLICTING":short?"INSUFFICIENT":"REVIEW_REQUIRED",conflict?"DUPLICATE_SESSION_CONFLICT":short?"BENCHMARK_DISTINCT_SESSIONS_INSUFFICIENT":"ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN","VALIDATE_APPROVED_HISTORY_CONTRACT"),normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,benchmarkCodes:required,histories:rows.map(x=>x?.history??null),stockHistory:history??null},retrieved_at:rows.map(x=>x?.history.retrievedAt??null).filter((x):x is string=>Boolean(x)).sort().at(-1)??null,source_provider:"ANGEL_ONE"}
 }
 if(marketish(code)){
   const state=history&&history.distinctSessions>=minimum?history.state:"INSUFFICIENT"
   return {...blocked(code,minimum,freshness,benchmarks,state,history?.reason??"DISTINCT_SESSIONS_INSUFFICIENT","VALIDATE_APPROVED_HISTORY_CONTRACT"),retrieved_at:history?.retrievedAt??null,evidence_as_of_date:history?.latestSession??null,source_provider:"ANGEL_ONE",normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,...history}}
 }
 const normalized=records.flatMap(record=>{
   const raw=record.raw_payload,items=Array.isArray(raw.p7_ic2_normalized_evidence)?raw.p7_ic2_normalized_evidence:[]
   if(ownershipish(code)&&raw.p7_ic2_ownership_history&&typeof raw.p7_ic2_ownership_history==="object")return [{record,value:raw.p7_ic2_ownership_history as Json,...cachedEvidenceReadiness(String((raw.p7_ic2_ownership_history as Json).state??"MISSING"),raw.p7_ic2_ownership_history,minimum)}]
   return items.filter(x=>x&&typeof x==="object"&&String((x as Json).evidenceCode)===code).map(x=>({record,value:x as Json,...cachedEvidenceReadiness(guardedNumericEvidenceState(String((x as Json).state??"MISSING"),x,minimum),x,minimum)}))
 })
 const metricCodes=canonicalMetricCodes[code]??[code],candidates=observations.filter(x=>x.security_id===securityId&&metricCodes.includes(x.metric_code))
 if(candidates.length){
   const validation=validateObservationSeries({rows:candidates,definitions,minimum,evaluationAsOfMs,sourceCutoffAtMs})
   if(validation.state!=="FRESH")return {...blocked(code,minimum,freshness,benchmarks,validation.state,validation.reason,"RECONCILE_CANONICAL_INPUT_CONTRACT"),candidate_evidence_ids:candidates.map(x=>x.id),normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,observations:candidates}}
   const selected=validation.selected,x=newestObservation(selected)
   const freshDates=selected.map(row=>row.fresh_until!).sort()
   return {...blocked(code,minimum,freshness,benchmarks,"FRESH",validation.reason,"NONE"),metric_code:x.metric_code,candidate_evidence_ids:candidates.map(row=>row.id),selected_evidence_id:x.id,evidence_as_of_date:selected.at(-1)!.period_end,retrieved_at:x.retrieved_at,fresh_through:dateOnly(freshDates[0]!),source_provider:x.source_code,raw_source_record_id:x.source_record_id,normalized_value:{validationVersion:P7_IC_INPUT_VALIDATION_VERSION,series:selected},validation_state:"VALIDATED",canonical_selection_state:"DETERMINISTIC_HISTORY_AGGREGATE"}
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
  if((body.action!==ACTION&&!dryRun)||!portfolioId||!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>40||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(selectionRunId)||!Number.isFinite(evaluationAsOfMs)||!Number.isFinite(sourceCutoffAtMs)||sourceCutoffAtMs>evaluationAsOfMs)return reply(400,{error:"Exact action, portfolioId, bounded slice, selection run, evaluation time, and source cutoff are required."})
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
    const plan=buildProfileEvidencePlan(contract),baseRecords=facts.sourceRecords.filter(x=>String(x.raw_payload.security_id)===security.id),records=projectCachedRecords(baseRecords,security,plan)
    items=plan.requirements.map(req=>requirementItem({code:req.evidenceCode,minimum:req.minimumPeriods,freshness:(contract.signalRequirements.find(x=>(x.evidenceCodes??[x.signalCode]).includes(req.evidenceCode)) as {freshnessPolicy?:string}|undefined)?.freshnessPolicy??null,benchmarks:[...(contract.benchmarkAuthority??[])],securityId:security.id,observations:facts.observations,definitions:facts.definitions,records,history:historyById.get(security.id),benchmarkByCode,evaluationAsOfMs,sourceCutoffAtMs}))
   }
   const methodologyRole=assignment.subprofileCode??assignment.profileCode??"UNRESOLVED"
   const assignmentId=`${ASSIGNMENT_AUTHORITY}:${assignment.securityId}:${methodologyRole}`
   const lineage={classification_authority:CLASSIFICATION_AUTHORITY,classification_version:CLASSIFICATION_VERSION,methodology_role:methodologyRole,assignment_authority:ASSIGNMENT_AUTHORITY,assignment_id:assignmentId,assignment_version:ASSIGNMENT_VERSION}
   items.push({...blocked("IC3_SNAPSHOT_LINEAGE",1,null,[],"FRESH","IC3_LINEAGE_READY","NONE"),required:true,evidence_state:"FRESH",normalized_value:{sector:assignment.sector,industry:assignment.industry,...lineage},validation_state:"VALIDATED",canonical_selection_state:"IMMUTABLE_LINEAGE"})
   const states=new Set(items.map(x=>x.evidence_state)),status=states.has("REVIEW_REQUIRED")?"REVIEW_REQUIRED":states.has("CONFLICTING")?"CONFLICTING":states.has("STALE")?"STALE":states.has("MISSING")||states.has("INSUFFICIENT")?"INSUFFICIENT":"READY"
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
 }catch(error){return reply(500,{error:"IC3 canonical snapshot materialization failed safely.",code:error instanceof Error?error.message:"IC3_MATERIALIZATION_FAILED"})}
})
