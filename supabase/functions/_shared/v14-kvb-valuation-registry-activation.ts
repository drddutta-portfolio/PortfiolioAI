import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import pins from './v14-kvb-valuation-registry-pins.json' with {type:'json'}
import {kvbPbHash,kvbPbStableId,KVB_PB_OWNER,KVB_PB_SECURITY} from './v14-kvb-pb-admission.ts'
const STATUS='ACTIVE_AFTER_GENUINE_KVB_OWNER_PIT_BATCH'
export async function activateKvbApprovedValuationDefinitions(db:SupabaseClient,input:{authenticatedOwnerId:string;ownerBatchId:string;batchHash:string;confirmedGlobalActivation:boolean;qualifiedCodes:readonly string[];at:string}){
 if(input.authenticatedOwnerId!==KVB_PB_OWNER||!input.ownerBatchId||!/^[a-f0-9]{64}$/.test(input.batchHash)||input.confirmedGlobalActivation!==true||!Number.isFinite(Date.parse(input.at))||input.qualifiedCodes.length!==2||!['PB_RELATIVE','PE_TTM_RELATIVE'].every(c=>input.qualifiedCodes.includes(c)))throw Error('KVB_GLOBAL_ACTIVATION_REAL_OWNER_AND_BOTH_QUALIFIED_HISTORIES_REQUIRED')
 for(const pin of pins){
  const found=await db.from('fundamental_metric_definitions').select('*').eq('code',pin.code).single()
  if(found.error)throw Error('KVB_VALUATION_REGISTRY_READ_FAILED')
  const row=found.data,definition={...row.definition};delete definition.activation_status
  const approved={...pin.definition} as Record<string,unknown>;delete approved.activation_status
  if(await kvbPbHash(definition)!==await kvbPbHash(approved)||row.value_kind!==pin.value_kind||row.canonical_unit!==pin.canonical_unit||row.statement_scope!==pin.statement_scope||row.freshness_seconds!==pin.freshness_seconds||row.name!==pin.name)throw Error('KVB_APPROVED_VALUATION_REGISTRY_CONTRACT_CHANGED')
  if(row.is_active===true){if(row.definition.activation_status!==STATUS)throw Error('KVB_REGISTRY_UNRECOGNIZED_ACTIVATION');continue}
  if(row.is_active!==false||row.definition.activation_status!==pin.definition.activation_status)throw Error('KVB_REGISTRY_ACTIVATION_STATE_CONFLICT')
  const auditRaw={version:'KVB_OWNER_BATCH_REGISTRY_ACTIVATION_V1',owner_id:input.authenticatedOwnerId,owner_batch_approval_id:input.ownerBatchId,batch_hash:input.batchHash,qualifying_security_id:KVB_PB_SECURITY,code:pin.code,previous_registry:pin,activation_scope:'GLOBAL_APPROVED_DEFINITION_EACH_BANK_NEEDS_OWN_EVIDENCE',formula_changed:false}
  const auditId=await kvbPbStableId(auditRaw),auditHash=await kvbPbHash(auditRaw)
  const audit=await db.from('data_source_records').upsert({id:auditId,source_code:'OWNER_REVIEWED_CLASSIFICATION',record_kind:'V1_4_KVB_OWNER_VALUATION_REGISTRY_ACTIVATION',external_record_id:auditId,retrieved_at:input.at,payload_hash:auditHash,raw_payload:auditRaw},{onConflict:'id',ignoreDuplicates:true})
  if(audit.error)throw Error('KVB_REGISTRY_ACTIVATION_AUDIT_FAILED')
  const checked=await db.from('data_source_records').select('payload_hash,raw_payload').eq('id',auditId).single()
  if(checked.error||checked.data.payload_hash!==auditHash||await kvbPbHash(checked.data.raw_payload)!==auditHash)throw Error('KVB_REGISTRY_AUDIT_READBACK_CONFLICT')
  const update=await db.from('fundamental_metric_definitions').update({is_active:true,definition:{...pin.definition,activation_status:STATUS}}).eq('code',pin.code).eq('is_active',false).eq('definition',JSON.stringify(pin.definition)).select('code')
  if(update.error||update.data?.length!==1)throw Error('KVB_REGISTRY_ACTIVATION_COMPARE_AND_SWAP_FAILED')
  const active=await db.from('fundamental_metric_definitions').select('*').eq('code',pin.code).single()
  if(active.error||active.data.is_active!==true||await kvbPbHash(active.data.definition)!==await kvbPbHash({...pin.definition,activation_status:STATUS}))throw Error('KVB_REGISTRY_ACTIVE_READBACK_FAILED')
 }
 return {codes:['PB_RELATIVE','PE_TTM_RELATIVE'],scope:'GLOBAL_APPROVED_DEFINITIONS',otherBankAdmission:false}
}
