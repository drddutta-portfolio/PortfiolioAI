import {parseOfficialBenchmarkHistory,type OfficialIndexBasis} from "./v14-official-benchmark-history.ts"
import type {HistoryRow} from "./p7-ic-input-validation.ts"

export const V1_4_OFFICIAL_BENCHMARK_READER_VERSION="V1_4_OFFICIAL_BENCHMARK_R2_READER_V2_DELTA_APPEND" as const
const DEV_READER_URL="https://portfolioai-v14-official-readback-dev.dr-d-dutta.workers.dev/object"
const MAX_OBJECT_BYTES=1024*1024

export interface OfficialBenchmarkSourceRecord{
 readonly id:string
 readonly source_code:string
 readonly record_kind:string
 readonly retrieved_at:string
 readonly payload_hash:string
 readonly raw_payload:Readonly<Record<string,unknown>>
 readonly source_url:string|null
}

const digest=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(b=>b.toString(16).padStart(2,"0")).join("")

function historyProof(input:{sourceRecordIds:readonly string[];freshnessThrough:string;returnBasis:OfficialIndexBasis;exchangeCalendarSourceRecordIds:readonly string[]}){
 return {
  version:"V1_4_HISTORY_CONTRACT_V1",
  sourceAuthority:"NIFTY_OFFICIAL",
  exchangeCalendarState:input.exchangeCalendarSourceRecordIds.length>0?"VERIFIED" as const:"UNVERIFIED" as const,
  exchangeCalendarSourceRecordIds:[...input.exchangeCalendarSourceRecordIds],
  corporateActionState:"COMPLETE" as const,
  corporateActionSourceRecordIds:[] as string[],
  unresolvedCorporateActionCount:0,
  returnBasis:input.returnBasis,
  freshnessThrough:input.freshnessThrough+"T23:59:59Z",
  lineageSourceRecordIds:[...input.sourceRecordIds],
  mixedReturnBasisApproved:false,
 }
}

export async function loadVerifiedOfficialBenchmarkHistory(input:{
 readonly record:OfficialBenchmarkSourceRecord
 readonly sourceCutoffAt:string
 readonly minimum?:number
 readonly maximum?:number
 readonly exchangeCalendarSourceRecordIds?:readonly string[]
 readonly deltaRecord?:OfficialBenchmarkSourceRecord|null
}):Promise<{rows:HistoryRow[];sourceRecordId:string;sourceAuthority:"NIFTY_OFFICIAL";returnBasis:OfficialIndexBasis;payloadHash:string}>{
 const {record}=input,raw=record.raw_payload
 if(record.source_code!=="NIFTY_OFFICIAL"||record.record_kind!=="V1_4_OFFICIAL_BENCHMARK_CAPTURE")throw new Error("OFFICIAL_BENCHMARK_SOURCE_RECORD_INVALID")
 if(Date.parse(record.retrieved_at)>Date.parse(input.sourceCutoffAt))throw new Error("OFFICIAL_BENCHMARK_SOURCE_AFTER_CUTOFF")
 const code=String(raw.benchmark_code??""),basis=String(raw.return_basis??"") as OfficialIndexBasis
 if(basis!=="PRICE_RETURN_RAW_CLOSE"&&basis!=="TOTAL_RETURN_INDEX")throw new Error("OFFICIAL_BENCHMARK_BASIS_INVALID")
 if(raw.readback_hash_verified!==true||typeof raw.r2_key!=="string"||raw.r2_bucket!=="portfolioai-history-dev")throw new Error("OFFICIAL_BENCHMARK_R2_VERIFICATION_MISSING")
 const expectedBytes=Number(raw.byte_length)
 if(!Number.isInteger(expectedBytes)||expectedBytes<1||expectedBytes>MAX_OBJECT_BYTES||!/^[a-f0-9]{64}$/u.test(record.payload_hash))throw new Error("OFFICIAL_BENCHMARK_METADATA_INVALID")
 const response=await fetch(DEV_READER_URL+"?code="+encodeURIComponent(code)+"&basis="+encodeURIComponent(basis),{method:"GET",redirect:"error",signal:AbortSignal.timeout(15000)})
 if(!response.ok)throw new Error("OFFICIAL_BENCHMARK_R2_READ_FAILED")
 const buffer=new Uint8Array(await response.arrayBuffer())
 if(buffer.byteLength!==expectedBytes)throw new Error("OFFICIAL_BENCHMARK_R2_BYTE_LENGTH_MISMATCH")
 const actualHash=await digest(buffer)
 if(actualHash!==record.payload_hash)throw new Error("OFFICIAL_BENCHMARK_R2_HASH_MISMATCH")
 const parsed=parseOfficialBenchmarkHistory({body:new TextDecoder().decode(buffer),code,basis,from:String(raw.first_session??"2025-08-25"),to:String(raw.last_session??"2026-10-06"),minimum:input.minimum??252,maximum:input.maximum??400})
 const rows=[...parsed.rows]
 const sourceRecordIds=[record.id]
 const delta=input.deltaRecord
 if(delta){
  const d=delta.raw_payload
  if(delta.source_code!=="NIFTY_OFFICIAL"||delta.record_kind!=="V1_4_OFFICIAL_BENCHMARK_DELTA_CAPTURE")throw new Error("OFFICIAL_BENCHMARK_DELTA_RECORD_INVALID")
  if(Date.parse(delta.retrieved_at)>Date.parse(input.sourceCutoffAt))throw new Error("OFFICIAL_BENCHMARK_DELTA_AFTER_CUTOFF")
  if(String(d.benchmark_code??"")!==code||String(d.return_basis??"")!==basis)throw new Error("OFFICIAL_BENCHMARK_DELTA_IDENTITY_INVALID")
  if(d.readback_verified!==true||d.r2_bucket!=="portfolioai-history-dev"||typeof d.r2_key!=="string")throw new Error("OFFICIAL_BENCHMARK_DELTA_R2_VERIFICATION_MISSING")
  if(String(d.sha256??"")!==delta.payload_hash||!/^[a-f0-9]{64}$/u.test(delta.payload_hash))throw new Error("OFFICIAL_BENCHMARK_DELTA_HASH_INVALID")
  const session=String(d.session??""),close=String(d.close??""),identity=String(d.official_identity??"")
  if(!/^\\d{4}-\\d{2}-\\d{2}$/u.test(session)||!/^\\d+(?:\\.\\d+)?$/u.test(close)||!identity)throw new Error("OFFICIAL_BENCHMARK_DELTA_FACT_INVALID")
  const last=rows.at(-1)?.session??""
  if(session<=last)throw new Error("OFFICIAL_BENCHMARK_DELTA_NOT_APPEND_ONLY")
  rows.push({session,close,officialIdentity:identity})
  sourceRecordIds.push(delta.id)
 }
 if(rows.length<(input.minimum??252)||rows.length>(input.maximum??400))throw new Error("OFFICIAL_BENCHMARK_COMBINED_SESSION_COUNT_INVALID")
 const proof=historyProof({sourceRecordIds,freshnessThrough:rows.at(-1)!.session,returnBasis:basis,exchangeCalendarSourceRecordIds:input.exchangeCalendarSourceRecordIds??[]})
 return {
  rows:rows.map(row=>({
   period_start:row.session+"T00:00:00.000Z",
   retrieved_at:row.session===String(input.deltaRecord?.raw_payload.session??"")&&input.deltaRecord?input.deltaRecord.retrieved_at:record.retrieved_at,
   close:row.close,
   adjusted_close:null,
   provenance:{
    source_authority:"NIFTY_OFFICIAL",
    official_identity:row.officialIdentity,
    source_record_id:row.session===String(input.deltaRecord?.raw_payload.session??"")&&input.deltaRecord?input.deltaRecord.id:record.id,
    payload_hash:row.session===String(input.deltaRecord?.raw_payload.session??"")&&input.deltaRecord?input.deltaRecord.payload_hash:record.payload_hash,
    r2_bucket:"portfolioai-history-dev",
    r2_key:row.session===String(input.deltaRecord?.raw_payload.session??"")&&input.deltaRecord?input.deltaRecord.raw_payload.r2_key:raw.r2_key,
    return_basis:basis,
    ohlc_available:false,
    reader_version:V1_4_OFFICIAL_BENCHMARK_READER_VERSION,
    v1_4_history_contract:proof,
   }
  })),
  sourceRecordId:sourceRecordIds.at(-1)!,
  sourceAuthority:"NIFTY_OFFICIAL",
  returnBasis:basis,
  payloadHash:input.deltaRecord?.payload_hash??record.payload_hash,
 }
}
