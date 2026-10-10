import {inspectStoredHistory,type HistoryRow,type InputState} from "./p7-ic-input-validation.ts"
type Json=Readonly<Record<string,unknown>>
export type HistoryReturnBasis="PRICE_RETURN_RAW_CLOSE"|"PRICE_RETURN_CORPORATE_ACTION_ADJUSTED"|"TOTAL_RETURN_INDEX"
export interface HistoryContractProof{readonly version:string;readonly sourceAuthority:string;readonly exchangeCalendarState:"VERIFIED"|"UNVERIFIED";readonly exchangeCalendarSourceRecordIds:readonly string[];readonly corporateActionState:"COMPLETE"|"INCOMPLETE"|"UNSUPPORTED";readonly corporateActionSourceRecordIds:readonly string[];readonly unresolvedCorporateActionCount:number;readonly returnBasis:HistoryReturnBasis;readonly freshnessThrough:string;readonly lineageSourceRecordIds:readonly string[];readonly mixedReturnBasisApproved?:boolean;readonly dailySessionState?:"LATEST_COMPLETED_SESSION_PRE_CLOSE"|"LATEST_COMPLETED_SESSION_POST_CLOSE";readonly dailySessionProofRecordIds?:readonly string[]}
export interface CurrentSessionDecision{readonly sessionDate:string;readonly decision:"OPEN"|"CLOSED"|"UNKNOWN";readonly recordId:string;readonly reason:string}
export interface QualifiedHistoryResult{readonly state:InputState;readonly reason:string;readonly distinctSessions:number;readonly latestSession:string|null;readonly retrievedAt:string|null;readonly selectedSessions:readonly string[];readonly returnBasis:HistoryReturnBasis|null;readonly lineage:Json}
const instant=(v:string|null)=>v?Date.parse(v):NaN
const DAILY_CLOSE_EVIDENCE_GRACE_MS=4*60*60*1000
const session=(v:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v))
const evaluationSession=(ms:number)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(ms))
function closedSessionCarriesForward(proof:HistoryContractProof,latestSession:string|null,evaluationAsOfMs:number,currentSessionDecision?:CurrentSessionDecision|null){
 if(!currentSessionDecision||currentSessionDecision.decision!=="CLOSED")return false
 if(currentSessionDecision.sessionDate!==evaluationSession(evaluationAsOfMs))return false
 if(proof.dailySessionState!=="LATEST_COMPLETED_SESSION_POST_CLOSE"||!(proof.dailySessionProofRecordIds?.length))return false
 if(!latestSession||latestSession>=currentSessionDecision.sessionDate)return false
 return true
}
const fail=(state:InputState,reason:string,base:ReturnType<typeof inspectStoredHistory>,extra:Json={}):QualifiedHistoryResult=>({state,reason,distinctSessions:base.distinctSessions,latestSession:base.latestSession,retrievedAt:base.retrievedAt,selectedSessions:[],returnBasis:null,lineage:{version:"V1_4_HISTORY_READINESS_V1",...extra}})
export function parseHistoryContractProof(value:unknown):HistoryContractProof|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null
 const p=value as Json
 const ids=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==="string")?v as string[]:null
 const cal=ids(p.exchangeCalendarSourceRecordIds),ca=ids(p.corporateActionSourceRecordIds),lin=ids(p.lineageSourceRecordIds)
 const dailyIds=p.dailySessionProofRecordIds===undefined?[]:ids(p.dailySessionProofRecordIds)
 if(p.version!=="V1_4_HISTORY_CONTRACT_V1"||typeof p.sourceAuthority!=="string"||!["VERIFIED","UNVERIFIED"].includes(String(p.exchangeCalendarState))||!["COMPLETE","INCOMPLETE","UNSUPPORTED"].includes(String(p.corporateActionState))||!["PRICE_RETURN_RAW_CLOSE","PRICE_RETURN_CORPORATE_ACTION_ADJUSTED","TOTAL_RETURN_INDEX"].includes(String(p.returnBasis))||typeof p.freshnessThrough!=="string"||!Number.isFinite(Date.parse(p.freshnessThrough))||!cal||!ca||!lin||!Number.isInteger(p.unresolvedCorporateActionCount)||dailyIds===null)return null
 if(p.dailySessionState!==undefined&&!["LATEST_COMPLETED_SESSION_PRE_CLOSE","LATEST_COMPLETED_SESSION_POST_CLOSE"].includes(String(p.dailySessionState)))return null
 if((p.dailySessionState==="LATEST_COMPLETED_SESSION_PRE_CLOSE"||p.dailySessionState==="LATEST_COMPLETED_SESSION_POST_CLOSE")&&dailyIds.length===0)return null
 return p as unknown as HistoryContractProof
}
export function historyProofFromRows(rows:readonly HistoryRow[]):HistoryContractProof|null{
 const proofs=rows.map(r=>r.provenance&&typeof r.provenance==="object"?(r.provenance as Json).v1_4_history_contract:null).filter(Boolean)
 if(!proofs.length||proofs.length!==rows.length)return null
 const canonical=JSON.stringify(proofs[0]);if(proofs.some(p=>JSON.stringify(p)!==canonical))return null
 return parseHistoryContractProof(proofs[0])
}
function selectedSessions(rows:readonly HistoryRow[],minimum:number){const dates=[...new Set(rows.map(r=>session(r.period_start)))].sort();return dates.slice(-minimum)}
export function validateStockHistoryReadiness(input:{rows:readonly HistoryRow[];minimum:number;evaluationAsOfMs:number;sourceCutoffAtMs:number;freshnessPolicy:string|null;proof?:HistoryContractProof|null;currentSessionDecision?:CurrentSessionDecision|null}):QualifiedHistoryResult{
 const base=inspectStoredHistory(input.rows,input.minimum,input.sourceCutoffAtMs);if(base.state==="CONFLICTING"||base.state==="INSUFFICIENT")return fail(base.state,base.reason,base)
 if(base.reason==="HISTORY_INPUT_INVALID")return fail("REVIEW_REQUIRED",base.reason,base)
 const proof=input.proof??historyProofFromRows(input.rows);if(!proof)return fail("REVIEW_REQUIRED","HISTORY_CONTRACT_NOT_PROVEN",base)
 if(proof.sourceAuthority!=="ANGEL_ONE")return fail("REVIEW_REQUIRED","HISTORY_SOURCE_AUTHORITY_MISMATCH",base,{sourceAuthority:proof.sourceAuthority})
 if(proof.exchangeCalendarState!=="VERIFIED"||proof.exchangeCalendarSourceRecordIds.length===0)return fail("REVIEW_REQUIRED","EXCHANGE_CALENDAR_NOT_PROVEN",base)
 if(proof.corporateActionState!=="COMPLETE"||proof.unresolvedCorporateActionCount!==0||proof.corporateActionSourceRecordIds.length===0)return fail(proof.corporateActionState==="UNSUPPORTED"?"CONFLICTING":"REVIEW_REQUIRED","CORPORATE_ACTION_TREATMENT_NOT_PROVEN",base,{corporateActionState:proof.corporateActionState,unresolved:proof.unresolvedCorporateActionCount})
 if(proof.returnBasis==="TOTAL_RETURN_INDEX")return fail("REVIEW_REQUIRED","STOCK_TOTAL_RETURN_BASIS_NOT_APPROVED",base)
 if(instant(proof.freshnessThrough)+DAILY_CLOSE_EVIDENCE_GRACE_MS<input.evaluationAsOfMs&&!closedSessionCarriesForward(proof,base.latestSession,input.evaluationAsOfMs,input.currentSessionDecision))return fail("STALE","HISTORY_LATEST_SESSION_STALE",base,{freshnessThrough:proof.freshnessThrough,dailyCloseGraceMs:DAILY_CLOSE_EVIDENCE_GRACE_MS,currentSessionDecision:input.currentSessionDecision??null})
 const chosen=selectedSessions(input.rows,input.minimum);if(chosen.length<input.minimum)return fail("INSUFFICIENT","DISTINCT_SESSIONS_INSUFFICIENT",base)
 return{state:"FRESH",reason:"STOCK_HISTORY_CONTRACT_READY",distinctSessions:base.distinctSessions,latestSession:base.latestSession,retrievedAt:base.retrievedAt,selectedSessions:chosen,returnBasis:proof.returnBasis,lineage:{version:"V1_4_HISTORY_READINESS_V1",sourceAuthority:proof.sourceAuthority,exchangeCalendarSourceRecordIds:proof.exchangeCalendarSourceRecordIds,corporateActionSourceRecordIds:proof.corporateActionSourceRecordIds,lineageSourceRecordIds:proof.lineageSourceRecordIds,returnBasis:proof.returnBasis,currentSessionDecisionRecordId:input.currentSessionDecision?.recordId??null,currentSessionDecision:input.currentSessionDecision?.decision??null}}
}
export function validateBenchmarkPairReadiness(input:{stockRows:readonly HistoryRow[];benchmarkRows:readonly HistoryRow[];minimum:number;evaluationAsOfMs:number;sourceCutoffAtMs:number;freshnessPolicy:string|null;benchmark:{code:string;mapping_status:string;provider_code:string|null;provider_instrument_id:string|null;verified_at:string|null};stockProof?:HistoryContractProof|null;benchmarkProof?:HistoryContractProof|null;currentSessionDecision?:CurrentSessionDecision|null}):QualifiedHistoryResult{
 const stock=validateStockHistoryReadiness({rows:input.stockRows,minimum:input.minimum,evaluationAsOfMs:input.evaluationAsOfMs,sourceCutoffAtMs:input.sourceCutoffAtMs,freshnessPolicy:input.freshnessPolicy,proof:input.stockProof,currentSessionDecision:input.currentSessionDecision});if(stock.state!=="FRESH")return stock
 const base=inspectStoredHistory(input.benchmarkRows,input.minimum,input.sourceCutoffAtMs);if(base.state==="CONFLICTING"||base.state==="INSUFFICIENT")return fail(base.state,base.reason,base,{benchmarkCode:input.benchmark.code});if(base.reason==="HISTORY_INPUT_INVALID")return fail("REVIEW_REQUIRED",base.reason,base,{benchmarkCode:input.benchmark.code})
 const provider=input.benchmark.provider_code
 if(input.benchmark.mapping_status!=="VERIFIED"||!["ANGEL_ONE","NIFTY_OFFICIAL"].includes(String(provider))||!input.benchmark.provider_instrument_id||!input.benchmark.verified_at||instant(input.benchmark.verified_at)>input.sourceCutoffAtMs)return fail("REVIEW_REQUIRED","BENCHMARK_MAPPING_NOT_PROVEN",base,{benchmarkCode:input.benchmark.code})
 const proof=input.benchmarkProof??historyProofFromRows(input.benchmarkRows);if(!proof)return fail("REVIEW_REQUIRED","BENCHMARK_HISTORY_CONTRACT_NOT_PROVEN",base,{benchmarkCode:input.benchmark.code})
 if(proof.sourceAuthority!==provider||proof.exchangeCalendarState!=="VERIFIED"||proof.exchangeCalendarSourceRecordIds.length===0)return fail("REVIEW_REQUIRED","BENCHMARK_AUTHORITY_OR_CALENDAR_NOT_PROVEN",base,{benchmarkCode:input.benchmark.code,providerCode:provider,sourceAuthority:proof.sourceAuthority})
 if(proof.returnBasis==="PRICE_RETURN_RAW_CLOSE"&&stock.returnBasis==="PRICE_RETURN_CORPORATE_ACTION_ADJUSTED"&&!proof.mixedReturnBasisApproved)return fail("REVIEW_REQUIRED","STOCK_BENCHMARK_RETURN_BASIS_MISMATCH",base,{stockBasis:stock.returnBasis,benchmarkBasis:proof.returnBasis})
 if(proof.returnBasis==="TOTAL_RETURN_INDEX"&&stock.returnBasis!=="TOTAL_RETURN_INDEX"&&!proof.mixedReturnBasisApproved)return fail("REVIEW_REQUIRED","STOCK_BENCHMARK_RETURN_BASIS_MISMATCH",base,{stockBasis:stock.returnBasis,benchmarkBasis:proof.returnBasis})
 if(instant(proof.freshnessThrough)+DAILY_CLOSE_EVIDENCE_GRACE_MS<input.evaluationAsOfMs&&!closedSessionCarriesForward(proof,base.latestSession,input.evaluationAsOfMs,input.currentSessionDecision))return fail("STALE","BENCHMARK_LATEST_SESSION_STALE",base,{benchmarkCode:input.benchmark.code,freshnessThrough:proof.freshnessThrough,dailyCloseGraceMs:DAILY_CLOSE_EVIDENCE_GRACE_MS,currentSessionDecision:input.currentSessionDecision??null})
 const bench=selectedSessions(input.benchmarkRows,input.minimum);if(bench.length<input.minimum)return fail("INSUFFICIENT","BENCHMARK_DISTINCT_SESSIONS_INSUFFICIENT",base,{benchmarkCode:input.benchmark.code})
 if(JSON.stringify(bench)!==JSON.stringify(stock.selectedSessions))return fail("REVIEW_REQUIRED","STOCK_BENCHMARK_SESSION_ALIGNMENT_NOT_PROVEN",base,{benchmarkCode:input.benchmark.code,stockFirst:stock.selectedSessions[0],stockLast:stock.selectedSessions.at(-1),benchmarkFirst:bench[0],benchmarkLast:bench.at(-1)})
 return{state:"FRESH",reason:"STOCK_BENCHMARK_HISTORY_READY",distinctSessions:base.distinctSessions,latestSession:base.latestSession,retrievedAt:base.retrievedAt,selectedSessions:bench,returnBasis:proof.returnBasis,lineage:{version:"V1_4_HISTORY_READINESS_V1",benchmarkCode:input.benchmark.code,benchmarkProviderCode:provider,benchmarkSourceAuthority:proof.sourceAuthority,benchmarkInstrumentId:input.benchmark.provider_instrument_id,benchmarkMappingVerifiedAt:input.benchmark.verified_at,stockLineage:stock.lineage,benchmarkLineageSourceRecordIds:proof.lineageSourceRecordIds,exchangeCalendarSourceRecordIds:proof.exchangeCalendarSourceRecordIds,returnBasis:proof.returnBasis}}
}