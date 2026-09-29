import {createClient} from "https://esm.sh/@supabase/supabase-js@2"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import {buildProfileEvidencePlan} from "../_shared/p7-ic-evidence-normalization.ts"
import {P7_IC_PROFILE_CONTRACTS} from "../_shared/p7-ic-profile-contracts.ts"
import coverage from "../../../docs/p7-ic/PortfolioAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_2026-09-29.json" with {type:"json"}

const DEV_REF="lrgpjimipfkyoqbpsqzz",PROD_REF="uxiyufbsbgzzdujzcdxe",ACTION="P7_IC2_MATERIALIZE_READINESS"
const REGISTRY_VERSION="PORTFOLIOAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1"
type Json=Record<string,unknown>
type CoverageRow={securityId:string;symbol:string;ic1State:string;profileCode:string|null;subprofileCode:string|null;methodologyAuthority:string|null;r7PolicyCode:string|null}
type Observation={id:string;security_id:string;metric_code:string;numeric_value:number|null;text_value:string|null;boolean_value:boolean|null;date_value:string|null;period_end:string|null;period_type:string|null;retrieved_at:string;fresh_until:string|null;evidence_status:string;source_code:string;source_record_id:string}
type SourceRecord={id:string;source_code:string;record_kind:string;retrieved_at:string;raw_payload:Json}
type History={security_id:string;sessions:number;latest_session:string|null;retrieved_at:string|null}
type Benchmark={code:string;mapping_status:string;provider_code:string|null;provider_instrument_id:string|null;verified_at:string|null;sessions:number;latest_session:string|null;retrieved_at:string|null}
type Facts={portfolioId:string;generatedAt:string;securities:Array<{id:string;symbol:string;isin:string;exchange:string}>;observations:Observation[];sourceRecords:SourceRecord[];histories:History[];benchmarks:Benchmark[]}
type Item={requirement_code:string;metric_code:string|null;required:boolean;minimum_history:number;freshness_policy:string|null;benchmark_authority:string[];applicability:"APPLICABLE"|"NOT_APPLICABLE";evidence_state:"FRESH"|"STALE"|"MISSING"|"INSUFFICIENT"|"CONFLICTING"|"REVIEW_REQUIRED"|"NOT_APPLICABLE";candidate_evidence_ids:string[];selected_evidence_id:string|null;evidence_as_of_date:string|null;retrieved_at:string|null;fresh_through:string|null;source_provider:string|null;raw_source_record_id:string|null;normalized_value:unknown;validation_state:string;canonical_selection_state:string;reason_code:string;recommended_remediation_action:string}

const canonicalMetricCodes:Readonly<Record<string,readonly string[]>>={
 ROCE_OR_ROIC:["ROCE_ANNUAL","ROCE_MANAGEMENT_ANNUAL"],OPERATING_MARGIN_HISTORY:["OPM_TTM","OPERATING_PROFIT_QUARTER"],GROSS_OPERATING_MARGIN_HISTORY:["OPM_TTM"],
 REVENUE_GROWTH_MULTI_PERIOD:["REVENUE_ANNUAL","REVENUE_TTM"],NET_PROFIT_GROWTH_MULTI_PERIOD:["NET_PROFIT_TTM","PAT_ATTRIBUTABLE_ANNUAL"],EPS_GROWTH_MULTI_PERIOD:["EPS_DILUTED_ANNUAL","EPS_DILUTED"],
 CFO_OR_FCF_CONVERSION:["CFO_ANNUAL","FREE_CASH_FLOW_ANNUAL"],NET_CASH_OR_LEVERAGE:["NET_DEBT_EBITDA_ANNUAL","TOTAL_DEBT_ANNUAL","DEBT_EQUITY"],PE:["PE_TTM","PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT"],
 GROSS_NPA_PERCENT:["GROSS_NPA_PERCENT"],NET_NPA_PERCENT:["NET_NPA_PERCENT"],EPS_GROWTH_YOY:["EPS_GROWTH_YOY"],ADVANCES_GROWTH_YOY:["ADVANCES_GROWTH_YOY"],DEPOSITS_GROWTH_YOY:["DEPOSITS_GROWTH_YOY"]
}
const projectRef=(v:string)=>{try{return new URL(v).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const sha=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(b=>b.toString(16).padStart(2,"0")).join("")
const reply=(status:number,body:Json)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
const dateOnly=(v:string|null)=>v?v.slice(0,10):null
const marketish=(c:string)=>/(PRICE_HISTORY|MARKET_DRAWDOWN|VOLATILITY|MOMENTUM|TOTAL_RETURN)/u.test(c)
const benchmarkish=(c:string)=>/(APPROVED_BENCHMARK|BENCHMARK_HISTORY|BENCHMARK_RELATIVE)/u.test(c)
const ownershipish=(c:string)=>/(OWNERSHIP|PROMOTER|FII|DII|INSTITUTIONAL|SHAREHOLDING)/u.test(c)

function blocked(code:string,minimum:number,freshness:string|null,benchmarks:string[],state:Item["evidence_state"],reason:string,action:string):Item{return {requirement_code:code,metric_code:null,required:true,minimum_history:minimum,freshness_policy:freshness,benchmark_authority:benchmarks,applicability:"APPLICABLE",evidence_state:state,candidate_evidence_ids:[],selected_evidence_id:null,evidence_as_of_date:null,retrieved_at:null,fresh_through:null,source_provider:null,raw_source_record_id:null,normalized_value:null,validation_state:"FAIL_CLOSED",canonical_selection_state:"NO_SELECTION",reason_code:reason,recommended_remediation_action:action}}

function requirementItem(input:{code:string;minimum:number;freshness:string|null;benchmarks:string[];securityId:string;observations:Observation[];records:SourceRecord[];history?:History;benchmarkByCode:Map<string,Benchmark>}):Item{
 const {code,minimum,freshness,benchmarks,securityId,observations,records,history,benchmarkByCode}=input
 if(benchmarkish(code)){
   const required=benchmarks.filter(x=>x.startsWith("NIFTY_")),rows=required.map(x=>benchmarkByCode.get(x)),ready=required.length>0&&rows.every(x=>x?.mapping_status==="VERIFIED"&&Number(x.sessions)>=minimum)
   if(!ready)return blocked(code,minimum,freshness,benchmarks,"MISSING","BENCHMARK_HISTORY_NOT_READY","REFRESH_EXACT_APPROVED_BENCHMARK_HISTORY")
   const newest=rows.map(x=>x?.retrieved_at??null).filter((x):x is string=>Boolean(x)).sort().at(-1)??null
   return {...blocked(code,minimum,freshness,benchmarks,"FRESH","BENCHMARK_HISTORY_READY","NONE"),retrieved_at:newest,evidence_as_of_date:dateOnly(rows.map(x=>x?.latest_session??null).filter((x):x is string=>Boolean(x)).sort().at(-1)??null),source_provider:rows[0]?.provider_code??"ANGEL_ONE",validation_state:"VALIDATED",canonical_selection_state:"DETERMINISTIC_AGGREGATE",normalized_value:{benchmarkCodes:required,sessions:rows.map(x=>Number(x?.sessions??0))}}
 }
 if(marketish(code)){
   if(!history||Number(history.sessions)<minimum)return {...blocked(code,minimum,freshness,benchmarks,"INSUFFICIENT","INSUFFICIENT_LISTING_HISTORY","PRESERVE_EXPLICIT_HISTORY_BLOCKER"),normalized_value:{sessions:Number(history?.sessions??0)}}
   return {...blocked(code,minimum,freshness,benchmarks,"FRESH","STOCK_HISTORY_READY","NONE"),retrieved_at:history.retrieved_at,evidence_as_of_date:dateOnly(history.latest_session),source_provider:"ANGEL_ONE",validation_state:"VALIDATED",canonical_selection_state:"DETERMINISTIC_AGGREGATE",normalized_value:{sessions:Number(history.sessions)}}
 }
 const normalized=records.flatMap(record=>{
   const raw=record.raw_payload,items=Array.isArray(raw.p7_ic2_normalized_evidence)?raw.p7_ic2_normalized_evidence:[]
   if(ownershipish(code)&&raw.p7_ic2_ownership_history&&typeof raw.p7_ic2_ownership_history==="object")return [{record,value:raw.p7_ic2_ownership_history as Json,state:String((raw.p7_ic2_ownership_history as Json).state??"MISSING")}]
   return items.filter(x=>x&&typeof x==="object"&&String((x as Json).evidenceCode)===code).map(x=>({record,value:x as Json,state:String((x as Json).state??"MISSING")}))
 })
 const available=normalized.filter(x=>x.state==="AVAILABLE")
 if(available.length===1){const x=available[0];return {...blocked(code,minimum,freshness,benchmarks,"FRESH","NORMALIZED_REQUIREMENT_READY","NONE"),candidate_evidence_ids:[x.record.id],selected_evidence_id:x.record.id,retrieved_at:x.record.retrieved_at,fresh_through:dateOnly(new Date(Date.parse(x.record.retrieved_at)+150*86400000).toISOString()),source_provider:x.record.source_code,raw_source_record_id:x.record.id,normalized_value:x.value,validation_state:"VALIDATED",canonical_selection_state:"SELECTED_UNAMBIGUOUS"}}
 if(available.length>1)return {...blocked(code,minimum,freshness,benchmarks,"CONFLICTING","MULTIPLE_NORMALIZED_CANDIDATES_REQUIRE_RECONCILIATION","RECONCILE_CANONICAL_EVIDENCE"),candidate_evidence_ids:available.map(x=>x.record.id),normalized_value:available.map(x=>x.value)}
 const metricCodes=canonicalMetricCodes[code]??[code],candidates=observations.filter(x=>x.security_id===securityId&&metricCodes.includes(x.metric_code))
 if(candidates.some(x=>x.evidence_status==="CONFLICTING"))return {...blocked(code,minimum,freshness,benchmarks,"CONFLICTING","CANONICAL_OBSERVATION_CONFLICT","RECONCILE_CANONICAL_EVIDENCE"),candidate_evidence_ids:candidates.map(x=>x.id)}
 const fresh=candidates.filter(x=>x.evidence_status==="AVAILABLE"&&(!x.fresh_until||Date.parse(x.fresh_until)>=Date.now()))
 if(fresh.length===1){const x=fresh[0];return {...blocked(code,minimum,freshness,benchmarks,"FRESH","CANONICAL_OBSERVATION_READY","NONE"),metric_code:x.metric_code,candidate_evidence_ids:[x.id],selected_evidence_id:x.id,evidence_as_of_date:x.period_end,retrieved_at:x.retrieved_at,fresh_through:dateOnly(x.fresh_until),source_provider:x.source_code,raw_source_record_id:x.source_record_id,normalized_value:{numeric:x.numeric_value,text:x.text_value,boolean:x.boolean_value,date:x.date_value},validation_state:"VALIDATED",canonical_selection_state:"SELECTED_UNAMBIGUOUS"}}
 if(fresh.length>1)return {...blocked(code,minimum,freshness,benchmarks,"CONFLICTING","MULTIPLE_FRESH_CANONICAL_CANDIDATES","RECONCILE_CANONICAL_EVIDENCE"),candidate_evidence_ids:fresh.map(x=>x.id)}
 if(candidates.length)return {...blocked(code,minimum,freshness,benchmarks,"STALE","ONLY_STALE_REQUIRED_EVIDENCE","REFRESH_REQUIRED_EVIDENCE"),candidate_evidence_ids:candidates.map(x=>x.id)}
 const review=normalized.find(x=>x.state.includes("REVIEW"));if(review)return {...blocked(code,minimum,freshness,benchmarks,"REVIEW_REQUIRED","DOCUMENT_EVIDENCE_REQUIRES_REVIEW","REVIEW_DOCUMENT_EVIDENCE"),candidate_evidence_ids:[review.record.id],raw_source_record_id:review.record.id,retrieved_at:review.record.retrieved_at,source_provider:review.record.source_code,normalized_value:review.value}
 return blocked(code,minimum,freshness,benchmarks,"MISSING","REQUIRED_EVIDENCE_MISSING","CACHE_FIRST_PROVIDER_REFRESH")
}

Deno.serve(async request=>{
 if(request.method!=="POST")return reply(405,{error:"Method not allowed."})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",ref=projectRef(url)
 if(ref===PROD_REF)return reply(409,{error:"P7 IC2 materializer refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
 if(ref!==DEV_REF||!key)return reply(500,{error:"Development runtime configuration is incomplete."})
 try{
  const body=await request.json() as Json,portfolioId=String(body.portfolioId??""),offset=Number(body.offset??0),limit=Number(body.limit??40)
  if(body.action!==ACTION||!portfolioId||!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>40)return reply(400,{error:"Exact action, portfolioId, and a valid bounded slice are required."})
  const scope=`ALL_HELD_EQUITIES:${offset}:${limit}`
  const admin=createClient(url,key,{auth:{persistSession:false}}),grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId,securityId:scope})
  if(!grant.ok)return reply(401,{error:grant.message,code:grant.code})
  const factsResult=await admin.rpc("p7_ic2_cache_facts_v1",{p_portfolio_id:portfolioId});if(factsResult.error)throw factsResult.error
  const facts=factsResult.data as Facts,coverageRows=(coverage as {rows:CoverageRow[]}).rows,coverageById=new Map(coverageRows.map(x=>[x.securityId,x])),historyById=new Map(facts.histories.map(x=>[x.security_id,x])),benchmarkByCode=new Map(facts.benchmarks.map(x=>[x.code,x]))
  const snapshotIds:string[]=[],totals:Record<string,number>={}
  const slice=facts.securities.slice(offset,offset+limit)
  for(const security of slice){
   const assignment=coverageById.get(security.id);if(!assignment)throw new Error(`METHODOLOGY_ASSIGNMENT_MISSING:${security.symbol}`)
   let items:Item[]
   const authority=assignment.methodologyAuthority??"P7_IC1_REVIEW_REQUIRED",profile=assignment.profileCode??"UNRESOLVED"
   if(assignment.ic1State!=="RESOLVED"||!assignment.profileCode){items=[blocked("METHODOLOGY_ASSIGNMENT",1,null,[],"REVIEW_REQUIRED","METHODOLOGY_REVIEW_REQUIRED","OWNER_FACTUAL_REVIEW")]}
   else{
    const contract=P7_IC_PROFILE_CONTRACTS[assignment.profileCode as keyof typeof P7_IC_PROFILE_CONTRACTS];if(!contract)throw new Error(`PROFILE_CONTRACT_MISSING:${assignment.profileCode}`)
    const plan=buildProfileEvidencePlan(contract),records=facts.sourceRecords.filter(x=>String(x.raw_payload.security_id)===security.id)
    items=plan.requirements.map(req=>requirementItem({code:req.evidenceCode,minimum:req.minimumPeriods,freshness:(contract.signalRequirements.find(x=>(x.evidenceCodes??[x.signalCode]).includes(req.evidenceCode)) as {freshnessPolicy?:string}|undefined)?.freshnessPolicy??null,benchmarks:[...(contract.benchmarkAuthority??[])],securityId:security.id,observations:facts.observations,records,history:historyById.get(security.id),benchmarkByCode}))
   }
   const states=new Set(items.map(x=>x.evidence_state)),status=states.has("REVIEW_REQUIRED")?"REVIEW_REQUIRED":states.has("CONFLICTING")?"CONFLICTING":states.has("STALE")?"STALE":states.has("MISSING")||states.has("INSUFFICIENT")?"INSUFFICIENT":"READY"
   totals[status]=(totals[status]??0)+1
   const hash=await sha({securityId:security.id,authority,profile,subprofile:assignment.subprofileCode,registry:REGISTRY_VERSION,items})
   const result=await admin.rpc("append_research_evidence_snapshot_v1",{p_snapshot:{portfolio_id:portfolioId,security_id:security.id,as_of_date:new Date().toISOString().slice(0,10),methodology_authority:authority,methodology_version:"V1",profile_code:profile,subprofile_code:assignment.subprofileCode,requirement_registry_version:REGISTRY_VERSION,snapshot_status:status,snapshot_hash:hash,created_by:null},p_items:items})
   if(result.error)throw result.error;snapshotIds.push(String(result.data))
  }
  return reply(200,{status:"MATERIALIZED",portfolioId,offset,processed:slice.length,nextOffset:offset+slice.length<facts.securities.length?offset+slice.length:null,totals,snapshotIds})
 }catch(error){return reply(500,{error:"IC2 readiness materialization failed safely.",code:error instanceof Error?error.message:"IC2_MATERIALIZATION_FAILED"})}
})
