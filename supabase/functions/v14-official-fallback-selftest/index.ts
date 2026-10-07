import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {loadVerifiedOfficialBenchmarkHistory,type OfficialBenchmarkSourceRecord} from "../_shared/v14-official-benchmark-r2.ts"
import {validateBenchmarkPairReadiness,historyProofFromRows,type HistoryContractProof} from "../_shared/v14-history-readiness.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const CODES=[
"NIFTY_CAPITAL_GOODS","NIFTY_CHEMICALS","NIFTY_CONSUMER_DURABLES","NIFTY_CONSUMER_SERVICES",
"NIFTY_FINANCIAL_SERVICES_EX_BANK","NIFTY_HOSPITALS","NIFTY_INDIA_DEFENCE","NIFTY_OIL_GAS",
"NIFTY_POWER","NIFTY_SERVICES_SECTOR","NIFTY_TRANSPORTATION_LOGISTICS"
] as const
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(!url.includes(DEV_REF)||!key)return reply(409,{code:"UNAPPROVED_PROJECT"})
 try{
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const records=await admin.from("data_source_records")
   .select("id,source_code,record_kind,retrieved_at,payload_hash,raw_payload,source_url")
   .eq("source_code","NIFTY_OFFICIAL").eq("record_kind","V1_4_OFFICIAL_BENCHMARK_CAPTURE")
   .eq("raw_payload->>return_basis","PRICE_RETURN_RAW_CLOSE")
   .in("raw_payload->>benchmark_code",[...CODES])
   .lte("retrieved_at","2026-10-06T23:59:59Z")
  if(records.error)throw records.error
  const byCode=new Map((records.data??[]).map(r=>[String((r.raw_payload as Record<string,unknown>).benchmark_code),r as unknown as OfficialBenchmarkSourceRecord]))
  const mappings=await admin.from("market_benchmarks").select("code,mapping_status,provider_code,provider_instrument_id,verified_at").in("code",[...CODES])
  if(mappings.error)throw mappings.error
  const mappingByCode=new Map((mappings.data??[]).map(r=>[String(r.code),r]))
  const results=[]
  for(const code of CODES){
   const record=byCode.get(code);const mapping=mappingByCode.get(code)
   if(!record||!mapping){results.push({code,pass:false,reason:"SOURCE_OR_MAPPING_MISSING"});continue}
   const loaded=await loadVerifiedOfficialBenchmarkHistory({record,sourceCutoffAt:"2026-10-06T23:59:59Z",minimum:252,maximum:400})
   const proof=historyProofFromRows(loaded.rows)
   const stockRows=loaded.rows.map(row=>({...row,provenance:{v1_4_history_contract:{
    version:"V1_4_HISTORY_CONTRACT_V1",sourceAuthority:"ANGEL_ONE",exchangeCalendarState:"VERIFIED",
    exchangeCalendarSourceRecordIds:["SELFTEST_CALENDAR"],corporateActionState:"COMPLETE",corporateActionSourceRecordIds:["SELFTEST_CA"],
    unresolvedCorporateActionCount:0,returnBasis:"PRICE_RETURN_RAW_CLOSE",freshnessThrough:"2026-10-06T23:59:59Z",
    lineageSourceRecordIds:["SELFTEST_STOCK"],mixedReturnBasisApproved:false
   }}}))
   const failClosed=validateBenchmarkPairReadiness({
    stockRows,benchmarkRows:loaded.rows,minimum:252,evaluationAsOfMs:Date.parse("2026-10-06T23:59:59Z"),
    sourceCutoffAtMs:Date.parse("2026-10-06T23:59:59Z"),freshnessPolicy:null,
    benchmark:{code,mapping_status:String(mapping.mapping_status),provider_code:mapping.provider_code===null?null:String(mapping.provider_code),provider_instrument_id:mapping.provider_instrument_id===null?null:String(mapping.provider_instrument_id),verified_at:mapping.verified_at===null?null:String(mapping.verified_at)},
    benchmarkProof:proof
   })
   const verifiedProof:HistoryContractProof={...proof!,exchangeCalendarState:"VERIFIED",exchangeCalendarSourceRecordIds:["SELFTEST_CALENDAR"]}
   const accepted=validateBenchmarkPairReadiness({
    stockRows,benchmarkRows:loaded.rows,minimum:252,evaluationAsOfMs:Date.parse("2026-10-06T23:59:59Z"),
    sourceCutoffAtMs:Date.parse("2026-10-06T23:59:59Z"),freshnessPolicy:null,
    benchmark:{code,mapping_status:String(mapping.mapping_status),provider_code:mapping.provider_code===null?null:String(mapping.provider_code),provider_instrument_id:mapping.provider_instrument_id===null?null:String(mapping.provider_instrument_id),verified_at:mapping.verified_at===null?null:String(mapping.verified_at)},
    benchmarkProof:verifiedProof
   })
   results.push({code,rows:loaded.rows.length,payloadHash:loaded.payloadHash,sourceAuthority:loaded.sourceAuthority,
    actualFailClosed:{state:failClosed.state,reason:failClosed.reason},
    verifiedContract:{state:accepted.state,reason:accepted.reason,provider:(accepted.lineage as Record<string,unknown>).benchmarkProviderCode},
    pass:loaded.rows.length===276&&failClosed.state==="REVIEW_REQUIRED"&&failClosed.reason==="BENCHMARK_AUTHORITY_OR_CALENDAR_NOT_PROVEN"&&accepted.state==="FRESH"&&accepted.reason==="STOCK_BENCHMARK_HISTORY_READY"
   })
  }
  return reply(results.every(x=>x.pass)?200:409,{status:results.every(x=>x.pass)?"PASS":"FAIL",results})
 }catch(e){return reply(500,{status:"FAIL",code:e instanceof Error?e.message:"SELFTEST_FAILED"})}
})