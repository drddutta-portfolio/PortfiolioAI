/** Replay the existing canonical requirement engine against independently read
 * Development facts. No HTTP authentication is simulated; no DB/provider writes.
 */
import {inspectStoredHistory,type HistoryRow} from "../../supabase/functions/_shared/p7-ic-input-validation.ts"
import type {HistoryContractProof} from "../../supabase/functions/_shared/v14-history-readiness.ts"
import {verifiedPreOpenCalendar,type CalendarRecord} from "../../supabase/functions/_shared/v14-bank-pre-open-calendar.ts"
import {planEvidenceRequirement} from "../../supabase/functions/_shared/p7-ic-evidence-normalization.ts"
interface Input {
 prices:HistoryRow[];benchmark:HistoryRow[];
 proofs:Array<{id:string;raw_payload:{target_type:string;target_id:string;proof:HistoryContractProof}}>;
 mapping:Array<{code:string;mapping_status:string;provider_code:string;provider_instrument_id:string;verified_at:string}>;
 calendar:CalendarRecord[];
}
if(Deno.args.length!==2)throw Error("Usage: kvb_history_replay_readonly.ts INPUT_JSON EVALUATION_ISO")
const data=JSON.parse(await Deno.readTextFile(Deno.args[0])) as Input
const at=Deno.args[1],ms=Date.parse(at)
if(!Number.isFinite(ms))throw Error("INVALID_EVALUATION")
const originalServe=Deno.serve
Deno.serve=(()=>({} as ReturnType<typeof Deno.serve>)) as typeof Deno.serve
const {requirementItem}=await import("../../supabase/functions/p7-ic2-materialize-readiness/index.ts")
Deno.serve=originalServe
const securityId="be55b3cc-0400-45af-84aa-2a95e2c361c5"
const preOpenCalendar=verifiedPreOpenCalendar(data.calendar,at)
const currentSessionDecision=preOpenCalendar?{sessionDate:new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(ms)),decision:"UNKNOWN" as const,recordId:"",reason:"PRE_OPEN_LATEST_COMPLETED_SESSION_VERIFIED",preOpenCalendar}:null
const historyProofs=new Map(data.proofs.map(x=>[x.raw_payload.target_type+":"+x.raw_payload.target_id,x.raw_payload.proof]))
const mapping=data.mapping[0]
if(!mapping)throw Error("BENCHMARK_MAPPING_MISSING")
const benchmarkByCode=new Map([[mapping.code,{...mapping,history:{rows:data.benchmark,inspection:inspectStoredHistory(data.benchmark,252,ms)},source_record_id:null}]])
const results=[]
for(const code of ["MAX_DRAWDOWN_1Y","PRICE_MOMENTUM_6M","PRICE_MOMENTUM_12M","RELATIVE_STRENGTH_12M","VOLATILITY_RELATIVE"]){
 const plan=planEvidenceRequirement(code,252)
 const result=await requirementItem({code,family:plan.deterministicCoverageRule,minimum:plan.minimumPeriods,freshness:"MARKET_5_TRADING_DAYS",benchmarks:["NIFTY_BANK"],portfolioId:"6193a4aa-3235-4057-bddc-209fcf443fc2",portfolioOwnerId:"f9e48c4c-d796-424b-95f7-2a4a97149543",securityId,observations:[],definitions:[],records:[],reviews:[],reviewSources:[],researchDocuments:[],documentSources:[],history:{security_id:securityId,rows:data.prices,inspection:inspectStoredHistory(data.prices,252,ms)},benchmarkByCode,historyProofs,currentSessionDecision,evaluationAsOfMs:ms,sourceCutoffAtMs:ms})
 results.push({requirement_code:code,coverage_family:plan.deterministicCoverageRule,evidence_state:result.evidence_state,reason_code:result.reason_code,normalized_value:result.normalized_value})
}
console.log(JSON.stringify({mode:"EXPORTED_CANONICAL_ENGINE_READ_ONLY_REPLAY_NOT_AUTHENTICATED_HTTP",evaluation_as_of:at,provider_calls:0,writes:0,preOpenCalendar,proof_source_ids:data.proofs.map(x=>x.id),stock_rows:data.prices.length,benchmark_rows:data.benchmark.length,results},null,2))
