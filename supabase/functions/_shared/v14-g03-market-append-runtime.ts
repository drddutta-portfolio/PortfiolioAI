import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {G03_APPEND_PINS as p,verifyBelAppendOriginal} from './v14-g03-market-append.ts'
import {g02StableId,hashG02,readG02Original} from './v14-g02-source-import.ts'
import {assertG03AcceptedHistoryParent} from './v14-g03-market-renewal-runtime.ts'
import {belCompletedSessionFreshness} from './v14-g03-market-renewal.ts'
import {loadVerifiedOfficialBenchmarkHistory} from './v14-official-benchmark-r2.ts'
import {bankTailDay} from './v14-bank-tail-validation.ts'
import {sameQualifiedHistoryNumeric} from './v14-history-numeric-equality.ts'
import policy from './v14-g03-market-authorization.json' with {type:'json'}
type Raw=Record<string,unknown>&{proof:Record<string,unknown>;validation:Record<string,unknown>}
const unique=<T>(v:readonly T[])=>[...new Set(v)]
export async function appendBelCompletedSession(db:SupabaseClient,body:Record<string,unknown>){
 if(body.action!=='APPEND_FIXED_G03_BEL_COMPLETED_SESSION'||body.authorizationHash!==policy.directiveSha256||body.through!==p.through||typeof body.captureId!=='string'||!Array.isArray(body.readUrls)||body.readUrls.length!==p.sources.length||Date.now()<Date.parse(p.through+'T19:00:00+05:30'))throw Error('G03_APPEND_EXACT_COMPLETED_SCOPE_REQUIRED')
 const owner=await db.from('portfolios').select('user_id').eq('id',policy.portfolioId).single(),decision=await db.from('data_source_records').select('id,raw_payload').eq('id',p.calendarDecisionId).eq('source_code','NSE_OFFICIAL').eq('record_kind','V1_4_NSE_SESSION_CALENDAR_DECISION').single()
 if(owner.error||owner.data?.user_id!==policy.ownerId||decision.error||decision.data.raw_payload.session_date!==p.through||decision.data.raw_payload.decision!=='OPEN')throw Error('G03_APPEND_OWNER_OR_OPEN_DECISION_NOT_PROVEN')
 async function append(kind:string,key:unknown,raw:Record<string,unknown>,source:string,sourceUrl?:string,pinnedHash?:string){
  const id=await g02StableId({kind,key}),hash=pinnedHash??await hashG02(raw),old=await db.from('data_source_records').select('payload_hash,raw_payload').eq('id',id).maybeSingle()
  if(old.error||old.data&&(old.data.payload_hash!==hash||await hashG02(old.data.raw_payload)!==await hashG02(raw)))throw Error('G03_APPEND_IMMUTABLE_RECORD_CONFLICT')
  if(!old.data){const write=await db.from('data_source_records').insert({id,source_code:source,record_kind:kind,external_record_id:'G03_BEL:'+id,source_url:sourceUrl??null,retrieved_at:new Date().toISOString(),published_at:null,payload_hash:hash,raw_payload:raw});if(write.error)throw Error('G03_APPEND_SOURCE_INSERT_FAILED')}
  const read=await db.from('data_source_records').select('payload_hash,raw_payload').eq('id',id).single();if(read.error||read.data.payload_hash!==hash||await hashG02(read.data.raw_payload)!==await hashG02(raw))throw Error('G03_APPEND_SOURCE_READBACK_FAILED');return id
 }
 async function parent(id:string,authority:string,target:string){
  const row=await db.from('data_source_records').select('raw_payload,payload_hash').eq('id',id).eq('record_kind','V1_4_HISTORY_CONTRACT_VALIDATION').single()
  if(row.error||row.data.payload_hash!==await hashG02(row.data.raw_payload))throw Error('G03_APPEND_PARENT_HASH_INVALID')
  const raw=row.data.raw_payload as Raw;assertG03AcceptedHistoryParent(raw,authority,target)
  if(raw.proof.freshnessThrough!==belCompletedSessionFreshness(p.from))throw Error('G03_APPEND_PARENT_SESSION_NOT_PROVEN');return raw
 }
 const stockParent=await parent(p.stockParent,'ANGEL_ONE',p.securityId)
 const capture=await db.from('data_source_records').select('raw_payload').eq('id',body.captureId).eq('source_code','ANGEL_ONE').eq('record_kind','V1_4_G03_HISTORY_TAIL_CAPTURE').single(),prices=await db.from('market_price_history').select('period_start,open,high,low,close,volume').eq('security_id',p.securityId).eq('provider_code','ANGEL_ONE').eq('interval','ONE_DAY').order('period_start')
 if(capture.error||prices.error)throw Error('G03_APPEND_ACTUAL_CAPTURE_AND_PRICES_REQUIRED')
 const c=capture.data.raw_payload,days=unique(prices.data.map(r=>bankTailDay(r.period_start)))
 if(c.security_id!==p.securityId||c.requested_from!==p.from||c.requested_to!==p.through||c.calendar_decision_id!==p.calendarDecisionId||!Array.isArray(c.candles)||c.candles.length!==2||c.candles.map((x:{periodStart:string})=>bankTailDay(x.periodStart)).join(',')!==[p.from,p.through].join(',')||days.at(-1)!==p.through||days.at(-2)!==p.from||days.length!==Number(stockParent.validation.distinct_sessions)+1)throw Error('G03_APPEND_CAPTURE_SESSION_SET_INVALID')
 const byDate=new Map(prices.data.map(r=>[new Date(r.period_start).toISOString(),r]))
 for(const candle of c.candles){const row=byDate.get(new Date(candle.periodStart).toISOString());if(!row||(['open','high','low','close','volume'] as const).some(k=>!sameQualifiedHistoryNumeric(row[k],candle[k])))throw Error('G03_APPEND_CAPTURE_PRICE_CONFLICT')}
 const originalIds:string[]=[],qualified:Array<Record<string,unknown>>=[]
 for(let i=0;i<p.sources.length;i++){
  const pin=p.sources[i],url=new URL(String(body.readUrls[i]));if(url.protocol!=='https:'||url.hostname!=='ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com'||url.pathname!=='/portfolioai-history-dev/'+pin.r2_key||url.username||url.password||url.port||url.hash)throw Error('G03_APPEND_R2_SCOPE_INVALID')
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('G03_APPEND_ORIGINAL_READ_FAILED')
  qualified.push(await verifyBelAppendOriginal(i,await readG02Original(response,pin.bytes)))
  originalIds.push(await append('V1_4_G03_OFFICIAL_HISTORY_TAIL',pin.hash,{version:p.version,original_sha256:pin.hash,original_bytes:pin.bytes,original_url:pin.url,r2_bucket:'portfolioai-history-dev',r2_key:pin.r2_key,readback_hash_verified:true,session:p.through,security_id:p.securityId,original_kind:pin.extension==='csv'?'NSE_ALL_INDICES_CLOSE':'NSE_EQUITIES_CORPORATE_ACTIONS',corporate_action_absence:pin.extension==='json'?{symbol:p.symbol,isin:p.isin,from:p.through,through:p.through,matching_rows:0}:null},pin.extension==='csv'?'NIFTY_OFFICIAL':'NSE_OFFICIAL',pin.url))
 }
 const csv=p.sources[0],proofIds:Record<string,string>={},deltaIds:Record<string,string>={}
 for(const b of p.benchmarks){
  const prior=await parent(b.parent,'NIFTY_OFFICIAL',b.code),base=await db.from('data_source_records').select('id,source_code,record_kind,retrieved_at,payload_hash,raw_payload,source_url').eq('id',b.base).single(),old=await db.from('data_source_records').select('raw_payload').eq('id',b.delta).eq('record_kind','V1_4_OFFICIAL_BENCHMARK_DELTA_CAPTURE').single()
  if(base.error||old.error||old.data.raw_payload.benchmark_code!==b.code||old.data.raw_payload.session!==p.from||!Array.isArray(old.data.raw_payload.sessions)||!Array.isArray(old.data.raw_payload.session_source_record_ids))throw Error('G03_APPEND_BENCHMARK_BASE_NOT_PROVEN')
  const previous=old.data.raw_payload,raw={...previous,r2_key:csv.r2_key,sha256:csv.hash,session:p.through,close:qualified[0][b.code],sessions:[...previous.sessions,{session:p.through,close:qualified[0][b.code],official_identity:b.identity}],session_sources:{...previous.session_sources,[p.through]:{source_record_id:originalIds[0],sha256:csv.hash,r2_key:csv.r2_key}},session_source_record_ids:unique([...previous.session_source_record_ids,originalIds[0]])}
  const deltaId=await append('V1_4_OFFICIAL_BENCHMARK_DELTA_CAPTURE',{version:p.version,benchmark:b.code,previous:b.delta,source:originalIds[0]},raw,'NIFTY_OFFICIAL',csv.url,csv.hash),delta=await db.from('data_source_records').select('id,source_code,record_kind,retrieved_at,payload_hash,raw_payload,source_url').eq('id',deltaId).single();if(delta.error)throw Error('G03_APPEND_DELTA_READBACK_FAILED')
  const combined=await loadVerifiedOfficialBenchmarkHistory({record:base.data,deltaRecord:delta.data,sourceCutoffAt:new Date().toISOString(),exchangeCalendarSourceRecordIds:unique([...prior.proof.exchangeCalendarSourceRecordIds as string[],originalIds[0],decision.data.id])})
  if(combined.rows.at(-1)?.period_start.slice(0,10)!==p.through||combined.rows.length!==Number(prior.validation.distinct_sessions)+1)throw Error('G03_APPEND_BENCHMARK_COMBINED_WINDOW_INVALID')
  const next={...prior,proof:{...prior.proof,freshnessThrough:belCompletedSessionFreshness(p.through),dailySessionState:'LATEST_COMPLETED_SESSION_POST_CLOSE',dailySessionProofRecordIds:[decision.data.id],exchangeCalendarSourceRecordIds:unique([...prior.proof.exchangeCalendarSourceRecordIds as string[],originalIds[0],decision.data.id]),lineageSourceRecordIds:unique([...prior.proof.lineageSourceRecordIds as string[],originalIds[0],deltaId])},validation:{...prior.validation,supersedes_history_proof_id:b.parent,renewal_version:p.version,latest_session:p.through,latest_completed_session:p.through,distinct_sessions:combined.rows.length}}
  deltaIds[b.code]=deltaId;proofIds[b.code]=await append('V1_4_HISTORY_CONTRACT_VALIDATION',{version:p.version,benchmark:b.code,deltaId},next,'CONTROLLED_PUBLIC_WEB')
 }
 const prior=stockParent,next={...prior,proof:{...prior.proof,freshnessThrough:belCompletedSessionFreshness(p.through),dailySessionState:'LATEST_COMPLETED_SESSION_POST_CLOSE',dailySessionProofRecordIds:[decision.data.id],corporateActionSourceRecordIds:unique([...prior.proof.corporateActionSourceRecordIds as string[],originalIds[1]]),exchangeCalendarSourceRecordIds:unique([...prior.proof.exchangeCalendarSourceRecordIds as string[],originalIds[0],decision.data.id]),lineageSourceRecordIds:unique([...prior.proof.lineageSourceRecordIds as string[],...originalIds,body.captureId])},validation:{...prior.validation,latest_session:p.through,latest_completed_session:p.through,distinct_sessions:days.length,supersedes_history_proof_id:p.stockParent,renewal_version:p.version,actual_price_capture:body.captureId,corporate_action_tail_original_sha256:p.sources[1].hash,prior_validated_window_preserved:true}}
 proofIds.BEL=await append('V1_4_HISTORY_CONTRACT_VALIDATION',{version:p.version,security:p.securityId,capture:body.captureId,originalIds},next,'CONTROLLED_PUBLIC_WEB')
 return {code:'G03_BEL_COMPLETED_SESSION_APPENDED_NOT_READY',proofIds,deltaIds,sourceIds:originalIds,stockSessions:days.length,through:p.through,providerApiCalls:0,canonicalMaterialization:false,acceptedReviews:0}
}
