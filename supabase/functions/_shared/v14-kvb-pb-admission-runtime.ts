import {loadVerifiedOpenSessionStatus} from './v14-bank-open-session-status-runtime.ts'
import peFixed from "./v14-kvb-pe-admission-inputs.json" with {type:"json"}
import {prepareKvbPeProposal} from "./v14-kvb-pe-admission.ts"
import {prepareKvbValuationOwnerBatch} from "./v14-kvb-valuation-owner-batch.ts"
import type {SupabaseClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {prepareKvbPbProposal,kvbPbFixedInputs as fixed,KVB_PB_SECURITY,kvbPbHash,kvbPbStableId,type KvbPbSource,type KvbPbPriceProof} from "./v14-kvb-pb-admission.ts"
import {parseHistoryContractProof,validateStockHistoryReadiness,type CurrentSessionDecision} from "./v14-history-readiness.ts"
import {verifiedPreOpenCalendar,type CalendarRecord} from "./v14-bank-pre-open-calendar.ts"
import historicalPins from "./v14-kvb-valuation-historical-source-pins.json" with {type:"json"}
import {sameQualifiedHistoryNumeric} from "./v14-history-numeric-equality.ts"
import type {HistoryRow} from "./p7-ic-input-validation.ts"
const sourceFields="id,source_code,record_kind,published_at,retrieved_at,payload_hash,raw_payload"
export interface KvbPbRawArchiveReceipt{archiveId:string;contentSha256:string;rawClose:string;tradeDate:string;isin:string;symbol:string;series:string;r2ContentKey:string;catalogCompressedSha256:string;actualCompressedSha256:string;transportRepresentation:"ORIGINAL_HASH_MATCH"|"REPACKED_EXACT_CSV_CONTENT_MATCH";r2CompressedKey:string}
async function lookupInputs(db:SupabaseClient,at:string){
 const originalHashes=[...new Set([...fixed.books.flatMap(b=>[b.equity_original_sha256,b.share_original_sha256]),...peFixed.components.map(c=>c.source_original_sha256)])]
 const [originals,early,archives,current]=await Promise.all([
  db.from("data_source_records").select(sourceFields).eq("record_kind","V1_4_BANK_PIT_REGISTERED_ORIGINAL").in("raw_payload->>original_sha256",originalHashes),
  db.from("data_source_records").select(sourceFields).in("id",fixed.prices.filter(p=>p.price_authority==="DATA_SOURCE_RECORD").map(p=>p.source_id)),
  db.from("p8_b3_source_archives").select("id,source_url,content_sha256,compressed_sha256,source_period_start,source_file_name,raw_metadata").in("id",fixed.prices.filter(p=>p.price_authority==="P8_B3_VERIFIED_NSE_ARCHIVE").map(p=>p.source_id)),
  db.from("market_price_history").select("period_start,retrieved_at,close::text,provenance").eq("security_id",KVB_PB_SECURITY).eq("provider_code","ANGEL_ONE").eq("interval","ONE_DAY").lte("retrieved_at",at).order("period_start",{ascending:false}).limit(1)
 ])
 if(originals.error||early.error||archives.error||current.error||originals.data?.length!==originalHashes.length||early.data?.length!==24||archives.data?.length!==36||current.data?.length!==1)throw Error("KVB_PB_CANONICAL_INPUT_SET_INCOMPLETE")
 return {originals:originals.data as KvbPbSource[],early:early.data as KvbPbSource[],archives:archives.data,current:current.data[0]!}
}
export async function kvbPbSourceRequest(db:SupabaseClient,at:string){const input=await lookupInputs(db,at);return {version:"KVB_PB_EXACT_RAW_ARCHIVE_REQUEST_V1",archives:input.archives,currentPriceSession:new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date(input.current.period_start)),providerCalls:0,canonicalAdmissions:0}}
async function latestQualifiedHistory(db:SupabaseClient,at:string){
 const session=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date(at))
 const [proofs,history,calendar]=await Promise.all([
  db.from("data_source_records").select(sourceFields).eq("record_kind","V1_4_HISTORY_CONTRACT_VALIDATION").eq("raw_payload->>target_id",KVB_PB_SECURITY).lte("retrieved_at",at).order("retrieved_at",{ascending:false}).limit(2),
  db.from("market_price_history").select("period_start,retrieved_at,close::text,provenance").eq("security_id",KVB_PB_SECURITY).eq("provider_code","ANGEL_ONE").eq("interval","ONE_DAY").lte("retrieved_at",at).order("period_start",{ascending:false}).limit(400),
  db.from("data_source_records").select(sourceFields).eq("source_code","NSE_OFFICIAL").eq("record_kind","V1_4_NSE_SESSION_CALENDAR_DECISION").eq("raw_payload->>session_date",session).lte("retrieved_at",at).order("retrieved_at",{ascending:false}).limit(2)
 ])
 if(proofs.error||history.error||calendar.error||!proofs.data?.length)throw Error("KVB_PB_CURRENT_HISTORY_READ_FAILED")
 const prior=proofs.data[0]!
 if(proofs.data.some(p=>p.retrieved_at===prior.retrieved_at&&JSON.stringify(p.raw_payload.proof)!==JSON.stringify(prior.raw_payload.proof)))throw Error("KVB_PB_CURRENT_HISTORY_PROOF_CONFLICT")
 const proof=parseHistoryContractProof(prior.raw_payload.proof);let decision:CurrentSessionDecision|null=null
 if(calendar.data?.length){const c=calendar.data[0]!,d=c.raw_payload.decision;if(!["OPEN","CLOSED","UNKNOWN"].includes(d)||calendar.data.some(x=>x.retrieved_at===c.retrieved_at&&x.payload_hash!==c.payload_hash))throw Error("KVB_PB_SESSION_DECISION_CONFLICT");decision={sessionDate:session,decision:d,recordId:c.id,reason:String(c.raw_payload.reason)}}
 else{const retained=await db.from("data_source_records").select("id,record_kind,retrieved_at,raw_payload").eq("source_code","NSE_OFFICIAL").in("record_kind",["V1_4_NSE_TRADING_CALENDAR_2026_BASE","V1_4_NSE_CALENDAR_APPROVED_BASELINE","V1_4_NSE_CALENDAR_REFRESH_CAPTURE"]).lte("retrieved_at",at).order("retrieved_at",{ascending:false}).limit(100);if(retained.error)throw Error("KVB_PB_PREOPEN_CALENDAR_READ_FAILED");const pre=verifiedPreOpenCalendar(retained.data as CalendarRecord[],at);if(pre)decision={sessionDate:session,decision:"UNKNOWN",recordId:"",reason:"PRE_OPEN_LATEST_COMPLETED_SESSION_VERIFIED",preOpenCalendar:pre}}
 if(!decision||decision.decision==="OPEN"){
  const open=await loadVerifiedOpenSessionStatus(db,at)
  if(open)decision={sessionDate:session,decision:"OPEN",recordId:open.record.id,reason:"OFFICIAL_OPEN_LATEST_COMPLETED_SESSION_VERIFIED",openSessionStatus:open.proof}
 }
 const result=validateStockHistoryReadiness({rows:history.data as HistoryRow[],minimum:252,evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:"MARKET_5_TRADING_DAYS",proof,currentSessionDecision:decision})
 if(result.state!=="FRESH")throw Error("KVB_PB_CURRENT_HISTORY_NOT_FRESH:"+result.reason)
 return result
}
export async function prepareKvbPbFromCanonical(db:SupabaseClient,receipts:readonly KvbPbRawArchiveReceipt[],corporateActionSourceRecordIds:readonly string[],at:string){
 const inputs=await lookupInputs(db,at),history=await latestQualifiedHistory(db,at)
 if(receipts.length!==36||new Set(receipts.map(r=>r.archiveId)).size!==36)throw Error("KVB_PB_EXACT_36_RAW_ARCHIVE_RECEIPTS_REQUIRED")
 const proofs:KvbPbPriceProof[]=[],bridges:Array<Record<string,unknown>>=[]
 for(const p of fixed.prices){
  if(p.price_authority==="DATA_SOURCE_RECORD"){
   const source=inputs.early.find(s=>s.id===p.source_id)
   const integrity=historicalPins.find(pin=>pin.id===p.source_id)
   if(!source||!integrity||source.source_code!==integrity.source_code||source.record_kind!==integrity.record_kind||source.payload_hash!==integrity.ledger_hash||await kvbPbHash(source.raw_payload)!==integrity.canonical_raw_hash)throw Error("KVB_PB_ORIGINAL_PRICE_BODY_INTEGRITY_INVALID")
   if(!source||source.source_code!=="NSE_OFFICIAL"||source.record_kind!=="V1_4_BANK_VALUATION_MONTH_END_PRICE_CAPTURE"||source.payload_hash!==(p as {payload_hash:string}).payload_hash||source.raw_payload.trade_date!==p.trade_date||source.raw_payload.source_url!==p.source_url)throw Error("KVB_PB_CANONICAL_PRICE_CAPTURE_NOT_BOUND")
   const rows=source.raw_payload.rows;if(!Array.isArray(rows))throw Error("KVB_PB_CANONICAL_PRICE_ROWS_MISSING")
   const match=rows.filter(r=>r.security_id===KVB_PB_SECURITY&&r.symbol==="KARURVYSYA"&&r.isin===fixed.isin&&r.series==="EQ")
   if(match.length!==1||!sameQualifiedHistoryNumeric(match[0].close,p.raw_close))throw Error("KVB_PB_CANONICAL_PRICE_LITERAL_CONFLICT")
   proofs.push({month:p.month,sourceRecordId:source.id,authority:"DATA_SOURCE_RECORD",authorityRecordId:source.id,rawClose:p.raw_close,tradeDate:p.trade_date,isin:fixed.isin,originalBytesVerified:true})
  }else{
   const archive=inputs.archives.find(a=>a.id===p.source_id),receipt=receipts.find(r=>r.archiveId===p.source_id)
   if(!archive||!receipt||receipt.symbol!=="KARURVYSYA"||receipt.isin!==fixed.isin||receipt.series!=="EQ"||receipt.tradeDate!==p.trade_date||!sameQualifiedHistoryNumeric(receipt.rawClose,p.raw_close)||receipt.contentSha256!==archive.content_sha256||receipt.contentSha256!==(p as {content_sha256:string}).content_sha256||receipt.catalogCompressedSha256!==archive.compressed_sha256||archive.source_url!==p.source_url)throw Error("KVB_PB_RAW_ARCHIVE_ROW_NOT_BOUND")
   const expectedKey=`portfolioai-history/development/p8/b3/source-authority/v1/content/trade_date=${p.trade_date}/${archive.raw_metadata.csv_member}`
   if(!/^[A-Za-z0-9][A-Za-z0-9_.-]*\.zip$/.test(archive.source_file_name)||!/^\d{4}-\d{2}-\d{2}$/.test(p.trade_date))throw Error("KVB_PB_RAW_ARCHIVE_OBJECT_BASENAME_INVALID")
   const compressedBase=`portfolioai-history/development/p8/b3/source-authority/v1`,originalKey=`${compressedBase}/trade_date=${p.trade_date}/${archive.source_file_name}`,repackedKey=`${compressedBase}/repacked-zip/trade_date=${p.trade_date}/${archive.source_file_name}`
   if(!/^[a-f0-9]{64}$/.test(receipt.actualCompressedSha256)||!((receipt.transportRepresentation==="ORIGINAL_HASH_MATCH"&&receipt.actualCompressedSha256===archive.compressed_sha256&&receipt.r2CompressedKey===originalKey)||(receipt.transportRepresentation==="REPACKED_EXACT_CSV_CONTENT_MATCH"&&receipt.r2CompressedKey===repackedKey)))throw Error("KVB_PB_RAW_ARCHIVE_TRANSPORT_NOT_BOUND")
   if(receipt.r2ContentKey!==expectedKey)throw Error("KVB_PB_RAW_ARCHIVE_STORAGE_SCOPE_INVALID")
   const raw={version:"KVB_PB_VERIFIED_OFFICIAL_RAW_ARCHIVE_ROW_V1",security_id:KVB_PB_SECURITY,symbol:"KARURVYSYA",isin:fixed.isin,series:"EQ",month:p.month,trade_date:p.trade_date,raw_close:p.raw_close,source_p8_archive_id:archive.id,original_url:p.source_url,content_sha256:archive.content_sha256,catalog_compressed_sha256:archive.compressed_sha256,actual_compressed_sha256:receipt.actualCompressedSha256,transport_representation:receipt.transportRepresentation,r2_compressed_key:receipt.r2CompressedKey,r2_bucket:"portfolioai-history-dev",r2_content_key:expectedKey,source_verification:"SIGNED_GITHUB_ACTIONS_EXACT_ORIGINAL_CSV_AND_INDEPENDENT_ZIP_TRANSPORT_HASH_ROW_EXTRACTION",canonical_promotion:false}
   const id=await kvbPbStableId(raw),bridge={id,source_code:"NSE_OFFICIAL",record_kind:"V1_4_KVB_PB_VERIFIED_RAW_ARCHIVE_ROW",external_record_id:`KVB_PB_RAW_ARCHIVE:${archive.id}`,retrieved_at:at,payload_hash:await kvbPbHash(raw),raw_payload:raw,source_url:p.source_url}
   bridges.push(bridge);proofs.push({month:p.month,sourceRecordId:id,authority:"P8_B3_VERIFIED_NSE_ARCHIVE",authorityRecordId:archive.id,rawClose:p.raw_close,tradeDate:p.trade_date,isin:fixed.isin,contentSha256:archive.content_sha256,originalBytesVerified:true})
  }
 }
 const currentSourceId=String(inputs.current.provenance?.source_record_id??""),currentSession=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date(inputs.current.period_start))
 if(!currentSourceId||history.latestSession!==currentSession)throw Error("KVB_PB_CURRENT_PRICE_LINEAGE_NOT_BOUND")
 const proposal=await prepareKvbPbProposal({sources:inputs.originals,priceProofs:proofs,corporateActionSourceRecordIds,current:{sourceRecordId:currentSourceId,close:String(inputs.current.close),session:currentSession,retrievedAt:inputs.current.retrieved_at,historyContractState:"FRESH"},preparedAt:at})
 const peProposal=await prepareKvbPeProposal({sources:inputs.originals,priceProofs:proofs,corporateActionSourceRecordIds,current:{sourceRecordId:currentSourceId,close:String(inputs.current.close),session:currentSession,retrievedAt:inputs.current.retrieved_at,historyContractState:"FRESH"},preparedAt:at})
 const metrics=[proposal,peProposal].map(p=>({requirementCode:p.requirementCode as "PB_RELATIVE"|"PE_TTM_RELATIVE",proposalHash:p.proposalHash,method:p.method,eligibleMonths:p.coverage.eligibleMonths,bands:p.coverage.bands,longestMissingRun:p.coverage.longestMissingRun,currentPriceSourceRecordId:p.currentPriceSourceRecordId,canonicalAdmissions:0 as const}))
 const batch=await prepareKvbValuationOwnerBatch(metrics,currentSession)
 return {proposal,peProposal,batch,bridges}
}
export async function kvbPbCurrentPriceStillMatches(db:SupabaseClient,proposal:Awaited<ReturnType<typeof prepareKvbPbProposal>>,at:string){const inputs=await lookupInputs(db,at),result=await latestQualifiedHistory(db,at);return inputs.current.provenance?.source_record_id===proposal.currentPriceSourceRecordId&&result.latestSession===proposal.currentPriceSession&&sameQualifiedHistoryNumeric(inputs.current.close,proposal.currentRawClose)}

export async function kvbPbCurrentHistoryQualified(db:SupabaseClient,at:string){return await latestQualifiedHistory(db,at)}

export async function kvbPbLatestQualifiedCurrentPrice(db:SupabaseClient,at:string){const inputs=await lookupInputs(db,at),history=await latestQualifiedHistory(db,at),session=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(inputs.current.period_start)),sourceRecordId=String(inputs.current.provenance?.source_record_id??'');if(history.latestSession!==session||!sourceRecordId)throw Error('KVB_CURRENT_PRICE_LINEAGE_NOT_QUALIFIED');return {sourceRecordId,close:String(inputs.current.close),session,retrievedAt:inputs.current.retrieved_at,historyContractState:'FRESH' as const}}

/** Signed read-only physical receipt comparison to the already stored bridges.
 * No history freshness assertion, registration, lease or source write occurs. */
export async function verifyStoredKvbRawArchiveReceipts(db:SupabaseClient,receipts:readonly KvbPbRawArchiveReceipt[]){
 const inputs=await lookupInputs(db,new Date().toISOString())
 if(receipts.length!==36||new Set(receipts.map(r=>r.archiveId)).size!==36)throw Error('KVB_PB_EXACT_36_RAW_ARCHIVE_RECEIPTS_REQUIRED')
 const rows=await db.from('data_source_records').select('id,payload_hash,raw_payload').eq('record_kind','V1_4_KVB_PB_VERIFIED_RAW_ARCHIVE_ROW').in('raw_payload->>source_p8_archive_id',receipts.map(r=>r.archiveId))
 if(rows.error||rows.data?.length!==36)throw Error('KVB_STORED_RAW_ARCHIVE_BRIDGES_INCOMPLETE')
 for(const receipt of receipts){const archive=inputs.archives.find(a=>a.id===receipt.archiveId),source=rows.data.find(r=>r.raw_payload.source_p8_archive_id===receipt.archiveId),price=fixed.prices.find(p=>p.source_id===receipt.archiveId)
  if(!archive||!source||!price||await kvbPbHash(source.raw_payload)!==source.payload_hash)throw Error('KVB_STORED_ARCHIVE_BODY_INTEGRITY_FAILED')
  const raw=source.raw_payload
  if(receipt.symbol!=='KARURVYSYA'||receipt.isin!==fixed.isin||receipt.series!=='EQ'||receipt.tradeDate!==price.trade_date||!sameQualifiedHistoryNumeric(receipt.rawClose,price.raw_close)||receipt.contentSha256!==archive.content_sha256||receipt.catalogCompressedSha256!==archive.compressed_sha256||receipt.contentSha256!==raw.content_sha256||receipt.actualCompressedSha256!==raw.actual_compressed_sha256||receipt.transportRepresentation!==raw.transport_representation||receipt.r2ContentKey!==raw.r2_content_key||receipt.r2CompressedKey!==raw.r2_compressed_key)throw Error('KVB_STORED_ARCHIVE_RECEIPT_CHANGED')
 }
 return {verifiedRawMonths:36,sourceWrites:0,providerCalls:0}
}
