import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {BANK_VALUATION_LEDGER_RECORD_KIND,evaluateBankValuationLedger,type BankValuationLedgerRecord} from './v14-bank-valuation-ledger.ts'
import {kvbPbHash,kvbPbStableId,KVB_PB_SECURITY,KVB_PB_OWNER} from './v14-kvb-pb-admission.ts'
export const KVB_VALUATION_BATCH_KIND='V1_4_KVB_PB_PE_SOURCE_QUALIFIED_PROPOSAL'
export const KVB_VALUATION_OWNER_AUDIT_KIND='V1_4_KVB_PB_PE_GENUINE_OWNER_BATCH_APPROVAL'
/** Only invoke after real-owner authentication and rechecking immutable proposal/current sources.
 * All staged observations stay invisible until the corresponding final CURRENT row exists.
 */
export async function appendKvbOwnerReviewedValuationRows(db:SupabaseClient,input:{ownerId:string;batchHash:string;ownerApprovalId:string;observations:readonly BankValuationLedgerRecord[];asOf:string;currentSession:string;currentRawClose:string}){
 if(input.ownerId!==KVB_PB_OWNER||!/^([a-f0-9]{64})$/.test(input.batchHash)||!input.ownerApprovalId)throw Error('KVB_VALUATION_REAL_OWNER_APPROVAL_REQUIRED')
 for(const code of ['PB_RELATIVE','PE_TTM_RELATIVE'] as const){
  const rows=input.observations.filter(r=>r.raw_payload.requirement_code===code)
  if(rows.some(r=>r.record_kind!==BANK_VALUATION_LEDGER_RECORD_KIND||r.raw_payload.security_id!==KVB_PB_SECURITY||r.raw_payload.admitted!==true||r.raw_payload.owner_batch_approval_id!==input.ownerApprovalId))throw Error('KVB_OWNER_OBSERVATION_SOURCE_SCOPE_INVALID')
  const evaluated=evaluateBankValuationLedger({code,securityId:KVB_PB_SECURITY,rows,asOf:input.asOf,expectedPriceSession:input.currentSession,expectedCurrentRawClose:input.currentRawClose})
  if(evaluated.state!=='FRESH')throw Error('KVB_OWNER_OBSERVATION_COVERAGE_INVALID:'+code+':'+evaluated.reason)
 }
 const ordered=[...input.observations].sort((a,b)=>Number(a.raw_payload.role==='CURRENT')-Number(b.raw_payload.role==='CURRENT'))
 let appended=0,reused=0
 for(const row of ordered){
  // Identity excludes approval timestamp and id so a repeated legitimate owner
  // batch cannot create duplicate historical month observations.
  const {owner_batch_approval_id:_approval,...calculation}=row.raw_payload
  void _approval
  const immutableId=await kvbPbStableId({kind:BANK_VALUATION_LEDGER_RECORD_KIND,calculation})
  const existing=await db.from('data_source_records').select('id,raw_payload,payload_hash').eq('id',immutableId).maybeSingle()
  if(existing.error)throw Error('KVB_VALUATION_OBSERVATION_LOOKUP_FAILED')
  if(existing.data){if(await kvbPbHash(existing.data.raw_payload)!==existing.data.payload_hash)throw Error('KVB_VALUATION_STORED_PAYLOAD_HASH_CONFLICT');const {owner_batch_approval_id:_old,...old}=existing.data.raw_payload;void _old;if(await kvbPbHash(old)!==await kvbPbHash(calculation))throw Error('KVB_VALUATION_OBSERVATION_IMMUTABLE_CONFLICT');reused++;continue}
  const payloadHash=await kvbPbHash(row.raw_payload)
  const insert=await db.from('data_source_records').insert({id:immutableId,source_code:'OWNER_REVIEWED_CLASSIFICATION',record_kind:BANK_VALUATION_LEDGER_RECORD_KIND,external_record_id:`KVB_OWNER_VALUATION:${immutableId}`,retrieved_at:input.asOf,published_at:null,payload_hash:payloadHash,raw_payload:row.raw_payload,terms_snapshot:{review_actor:'OWNER',reviewed_by:input.ownerId,owner_batch_approval_id:input.ownerApprovalId,batch_hash:input.batchHash,provider_calls:0}})
  if(insert.error&&insert.error.code!=='23505')throw Error('KVB_VALUATION_OBSERVATION_APPEND_FAILED:'+insert.error.code)
  const read=await db.from('data_source_records').select('raw_payload,payload_hash').eq('id',immutableId).single()
  if(read.error||await kvbPbHash(read.data.raw_payload)!==read.data.payload_hash)throw Error('KVB_VALUATION_OBSERVATION_READBACK_FAILED')
  const {owner_batch_approval_id:_readApproval,...readCore}=read.data.raw_payload;void _readApproval
  if(await kvbPbHash(readCore)!==await kvbPbHash(calculation))throw Error('KVB_VALUATION_OBSERVATION_READBACK_CORE_CONFLICT')
  if(insert.error)reused++;else appended++
 }
 return {appended,reused,canonicalMaterialization:false}
}
