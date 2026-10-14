import {bankTailDay} from './v14-bank-tail-validation.ts'
import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {G02_OWNER_POLICY as policy,g02StableId,hashG02} from './v14-g02-source-import.ts'
import {G02_HISTORY_RENEWAL_PINS as pins,readG02HistoryTail,g02RenewalPayload} from './v14-g02-history-renewal.ts'
export async function renewG02History(db:SupabaseClient,body:Record<string,unknown>){
 if(body.authorizationHash!==policy.directiveSha256||!Array.isArray(body.readUrls)||body.readUrls.length!==pins.sources.length)throw Error('EXACT_G02_HISTORY_RENEWAL_REQUIRED')
 const owner=await db.from('portfolios').select('user_id').eq('id',policy.portfolioId).single();if(owner.error||owner.data.user_id!==policy.ownerId)throw Error('G02_RENEWAL_OWNER_INVALID')
 const sourceIds:string[]=[]
 for(let i=0;i<pins.sources.length;i++){
  const {pin,key}=await readG02HistoryTail(pins.sources[i].hash,String(body.readUrls[i]))
  const id=await g02StableId({kind:'G02_OFFICIAL_HISTORY_TAIL',hash:pin.hash}),raw={version:pins.version,original_sha256:pin.hash,original_bytes:pin.bytes,original_url:pin.url,r2_bucket:'portfolioai-history-dev',r2_key:key,readback_hash_verified:true,session:pin.session??null,close:pin.close??null,official_identity:pin.extension==='csv'?'NIFTY CAPITAL GOODS':'NSE_EQUITIES_CORPORATE_ACTIONS',financial_admission:false},hash=await hashG02(raw)
  const old=await db.from('data_source_records').select('payload_hash,raw_payload').eq('id',id).maybeSingle();if(old.error||old.data&&(old.data.payload_hash!==hash||await hashG02(old.data.raw_payload)!==hash))throw Error('G02_TAIL_SOURCE_CONFLICT')
  if(!old.data){const ins=await db.from('data_source_records').insert({id,source_code:'NIFTY_OFFICIAL',record_kind:'V1_4_G02_OFFICIAL_HISTORY_TAIL',external_record_id:'G02_TAIL:'+pin.hash,source_url:pin.url,retrieved_at:new Date().toISOString(),published_at:null,payload_hash:hash,raw_payload:raw});if(ins.error)throw Error('G02_TAIL_SOURCE_INSERT_FAILED:'+ins.error.code)}sourceIds.push(id)
 }
 const daily=await db.from('data_source_records').select('id,raw_payload').eq('id','69a2fbc4-0184-4443-b15f-2ce6a230665a').single();if(daily.error||daily.data.raw_payload.session_date!==pins.through||daily.data.raw_payload.decision!=='OPEN')throw Error('G02_OFFICIAL_COMPLETED_SESSION_NOT_PROVEN')
 const results=[]
 for(const stock of pins.stocks){
  const parent=await db.from('data_source_records').select('raw_payload').eq('id',stock.parent).eq('record_kind','V1_4_HISTORY_CONTRACT_VALIDATION').single(),capture=await db.from('data_source_records').select('source_code,raw_payload').eq('id',stock.capture).single(),prices=await db.from('market_price_history').select('period_start').eq('security_id',stock.id).eq('provider_code','ANGEL_ONE').eq('interval','ONE_DAY').order('period_start')
  if(parent.error||capture.error||capture.data.source_code!=='ANGEL_ONE'||prices.error||capture.data.raw_payload.security_id!==stock.id||capture.data.raw_payload.requested_to!==pins.through)throw Error('G02_REAL_PRICE_CAPTURE_REQUIRED')
  const days=[...new Set(prices.data.map(x=>bankTailDay(x.period_start)))];const tail=days.filter(x=>x>'2026-10-07');if(tail.join(',')!=='2026-10-08,2026-10-09,2026-10-12,2026-10-13'||days.at(-1)!==pins.through)throw Error('G02_PRICE_TAIL_OFFICIAL_SESSION_MISMATCH')
  const raw=await g02RenewalPayload(parent.data.raw_payload,{sourceIds,captureId:stock.capture,calendarId:sourceIds[0],dailyId:daily.data.id,count:days.length});Object.assign(raw.validation,{supersedes_history_proof_id:stock.parent})
  const id=await g02StableId({kind:pins.version,stock:stock.id,parent:stock.parent,sourceIds,capture:stock.capture}),hash=await hashG02(raw),old=await db.from('data_source_records').select('payload_hash').eq('id',id).maybeSingle();if(old.error||old.data&&old.data.payload_hash!==hash)throw Error('G02_HISTORY_RENEWAL_CONFLICT')
  if(!old.data){const ins=await db.from('data_source_records').insert({id,source_code:'CONTROLLED_PUBLIC_WEB',record_kind:'V1_4_HISTORY_CONTRACT_VALIDATION',external_record_id:'G02_RENEWAL:'+id,retrieved_at:new Date().toISOString(),published_at:null,payload_hash:hash,raw_payload:raw});if(ins.error)throw Error('G02_HISTORY_RENEWAL_INSERT_FAILED:'+ins.error.code)}
  const check=await db.from('data_source_records').select('payload_hash,raw_payload').eq('id',id).single();if(check.error||check.data.payload_hash!==hash||await hashG02(check.data.raw_payload)!==hash)throw Error('G02_HISTORY_RENEWAL_READBACK_FAILED');results.push({symbol:stock.symbol,proofId:id,sessions:days.length,reused:Boolean(old.data)})
 }
 return {code:'G02_STOCK_HISTORY_PROOFS_RENEWED_NOT_READY',results,sourceIds,providerApiCalls:0,acceptedReviews:0,canonicalMaterialization:false}
}
