import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import historicalPins from './v14-kvb-valuation-historical-source-pins.json' with {type:'json'}
import historyPins from './v14-kvb-history-renewal-source-pins.json' with {type:'json'}
import {kvbPbHash} from './v14-kvb-pb-admission.ts'
import {kvbFinancialSourceReview,type KvbFinancialPreparedBatch} from './v14-kvb-financial-source-approval.ts'
import {KVB_VALUATION_BATCH_KIND} from './v14-kvb-valuation-owner-store.ts'
/** Historical qualification is immutable and remains reviewable while today's
 * market data is stale. This read path never stamps current evidence FRESH. */
export async function loadStoredKvbValuationSource(db:SupabaseClient){
 const found=await db.from('data_source_records').select('id,retrieved_at,payload_hash,raw_payload').eq('record_kind',KVB_VALUATION_BATCH_KIND).order('retrieved_at',{ascending:false}).limit(1).single()
 if(found.error||await kvbPbHash(found.data.raw_payload)!==found.data.payload_hash)throw Error('KVB_QUALIFIED_SOURCE_BATCH_NOT_AVAILABLE')
 const batch=found.data.raw_payload as KvbFinancialPreparedBatch,financial=await kvbFinancialSourceReview(batch)
 const candidates=[...batch.pbProposal.candidates,...batch.peProposal.candidates],ids=[...new Set(candidates.flatMap(c=>[c.priceSourceRecordId,...c.denominatorSourceRecordIds,...c.corporateActionSourceRecordIds]))]
 const read=await db.from('data_source_records').select('id,source_code,record_kind,published_at,retrieved_at,payload_hash,source_url,raw_payload').in('id',ids)
 if(read.error||read.data?.length!==ids.length)throw Error('KVB_OWNER_REVIEW_SOURCE_EVIDENCE_INCOMPLETE')
 for(const source of read.data){const known=[...historicalPins,...historyPins].find(p=>p.id===source.id),actual=await kvbPbHash(source.raw_payload);if(known?source.payload_hash!==known.ledger_hash||actual!==known.canonical_raw_hash:actual!==source.payload_hash)throw Error('KVB_LINKED_SOURCE_BODY_INTEGRITY_FAILED')}
 return {record:found.data,batch,financial,sources:read.data,sourceQualificationAsOf:found.data.retrieved_at}
}
