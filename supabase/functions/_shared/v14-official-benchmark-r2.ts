import {parseOfficialBenchmarkHistory,type OfficialIndexBasis} from "./v14-official-benchmark-history.ts"
import type {HistoryRow} from "./p7-ic-input-validation.ts"

export const V1_4_OFFICIAL_BENCHMARK_READER_VERSION="V1_4_OFFICIAL_BENCHMARK_R2_READER_V1" as const
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

function historyProof(input:{sourceRecordId:string;freshnessThrough:string;returnBasis:OfficialIndexBasis}){
 return {
  version:"V1_4_HISTORY_CONTRACT_V1",
  sourceAuthority:"NIFTY_OFFICIAL",
  exchangeCalendarState:"UNVERIFIED" as const,
  exchangeCalendarSourceRecordIds:[] as string[],
  corporateActionState:"COMPLETE" as const,
  corporateActionSourceRecordIds:[] as string[],
  unresolvedCorporateActionCount:0,
  returnBasis:input.returnBasis,
  freshnessThrough:input.freshnessThrough+"T23:59:59Z",
  lineageSourceRecordIds:[input.sourceRecordId],
  mixedReturnBasisApproved:false,
 }
}

export async function loadVerifiedOfficialBenchmarkHistory(input:{
 readonly record:OfficialBenchmarkSourceRecord
 readonly sourceCutoffAt:string
 readonly minimum?:number
 readonly maximum?:number
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
 const proof=historyProof({sourceRecordId:record.id,freshnessThrough:parsed.rows.at(-1)!.session,returnBasis:basis})
 return {
  rows:parsed.rows.map(row=>({
   period_start:row.session+"T00:00:00.000Z",
   retrieved_at:record.retrieved_at,
   close:row.close,
   adjusted_close:null,
   provenance:{
    source_authority:"NIFTY_OFFICIAL",
    official_identity:row.officialIdentity,
    source_record_id:record.id,
    payload_hash:record.payload_hash,
    r2_bucket:raw.r2_bucket,
    r2_key:raw.r2_key,
    return_basis:basis,
    ohlc_available:false,
    reader_version:V1_4_OFFICIAL_BENCHMARK_READER_VERSION,
    v1_4_history_contract:proof,
   }
  })),
  sourceRecordId:record.id,
  sourceAuthority:"NIFTY_OFFICIAL",
  returnBasis:basis,
  payloadHash:record.payload_hash,
 }
}
