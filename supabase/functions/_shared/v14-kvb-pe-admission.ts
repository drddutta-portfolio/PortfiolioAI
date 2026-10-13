import fixed from './v14-kvb-pe-admission-inputs.json' with {type:'json'}
import {kvbPbFixedInputs,kvbPbHash,KVB_PB_SECURITY,type KvbPbSource,type KvbPbPriceProof,type KvbPbCurrentPrice} from './v14-kvb-pb-admission.ts'
import {calculateBankPeMultiple,type BankPeCalculationInput} from './v14-bank-valuation-pe-calculation.ts'
import {sameQualifiedHistoryNumeric} from './v14-history-numeric-equality.ts'
const ts=(s:string)=>Date.parse(s)
function previousQuarter(end:string){const d=new Date(end+'T00:00:00Z');d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-2);d.setUTCDate(0);return d.toISOString().slice(0,10)}
export async function prepareKvbPeProposal(input:{sources:readonly KvbPbSource[];priceProofs:readonly KvbPbPriceProof[];corporateActionSourceRecordIds:readonly string[];current:KvbPbCurrentPrice;preparedAt:string}){
 if(input.current.historyContractState!=='FRESH'||!Number.isFinite(ts(input.preparedAt))||input.corporateActionSourceRecordIds.length<5)throw Error('KVB_PE_CURRENT_HISTORY_AND_CA_QUALIFICATION_REQUIRED')
 const candidates:Array<{role:'HISTORICAL'|'CURRENT';month:string;multiple:string;ttmDilutedEps:string;sourceAvailableAt:string;priceAsOf:string;input:BankPeCalculationInput;priceSourceRecordId:string;denominatorSourceRecordIds:string[];corporateActionSourceRecordIds:readonly string[]}>=[],excluded:Array<{month:string;reason:string}>=[]
 const originalSource=(hash:string,publishedAt:string)=>{const s=input.sources.filter(x=>x.source_code==='NSE_OFFICIAL'&&x.record_kind==='V1_4_BANK_PIT_REGISTERED_ORIGINAL'&&x.raw_payload.security_id===KVB_PB_SECURITY&&x.raw_payload.original_sha256===hash);if(s.length!==1||s[0]!.raw_payload.r2_verified_sha256!==hash||ts(s[0]!.published_at??'')!==ts(publishedAt))throw Error('KVB_PE_REGISTERED_ORIGINAL_NOT_BOUND');return s[0]!}
 const unavailable=new Set([...fixed.mandatory_excluded_months_without_then_current_june_original,...fixed.mandatory_excluded_months_ambiguous_june25_bonus_revision,...fixed.excluded_price_conflicts])
 function calculate(month:string,date:string,close:string,sourceId:string,role:'HISTORICAL'|'CURRENT'){
  const priceAsOf=date+'T15:30:00+05:30'
  if(role==='HISTORICAL'&&unavailable.has(month)){excluded.push({month,reason:fixed.excluded_price_conflicts.includes(month)?'ORIGINAL_PRICE_SOURCE_CONFLICT':'THEN_CURRENT_QUARTER_OR_SHARE_REVISION_NOT_PROVEN'});return}
  const components=fixed.components.filter(c=>ts(c.source_published_at)<=ts(priceAsOf))
  const latest=fixed.known_original_publication_timeline.filter(x=>ts(x.publishedAt)<=ts(priceAsOf)).sort((a,b)=>b.quarterEnd.localeCompare(a.quarterEnd))[0]
  if(!latest){excluded.push({month,reason:'LATEST_PUBLISHED_QUARTER_UNKNOWN'});return}
  const ends=[latest.quarterEnd];for(let i=0;i<3;i++)ends.push(previousQuarter(ends.at(-1)!))
  const selected=ends.map(end=>components.filter(c=>c.quarter_end===end).sort((a,b)=>ts(b.source_published_at)-ts(a.source_published_at))[0])
  if(selected.some(x=>!x)){excluded.push({month,reason:'FOUR_THEN_AVAILABLE_DILUTED_COMPONENTS_MISSING'});return}
  const bound=selected.map(c=>originalSource(c!.source_original_sha256,c!.source_published_at))
  const needsBonusBasis=date>=fixed.share_basis_original.effective_ex_date&&selected.some(c=>c!.eps_share_basis==='PRE_2025_08_26_BONUS_1_FOR_5')
  if(needsBonusBasis){if(ts(fixed.share_basis_original.published_at)>ts(priceAsOf)){excluded.push({month,reason:'ORIGINAL_BONUS_BASIS_NOT_YET_PUBLISHED'});return}bound.push(originalSource(fixed.share_basis_original.original_sha256,fixed.share_basis_original.published_at))}
  const calc:BankPeCalculationInput={rawClose:close,currency:'INR',priceBasis:'RAW_CONTEMPORANEOUS_CLOSE',reportingScope:'STANDALONE',ttmPeriodEnd:latest.quarterEnd,priceAsOf,evaluationAsOf:role==='HISTORICAL'?priceAsOf:input.current.retrievedAt,quarters:selected.map(c=>{const x=c!,bonus=date>='2025-08-26'&&x.eps_share_basis==='PRE_2025_08_26_BONUS_1_FOR_5';return {quarterStart:x.quarter_start,quarterEnd:x.quarter_end,dilutedEps:x.eps_diluted_nonannualized,epsBasis:'DILUTED_NONANNUALIZED_QUARTER' as const,unit:'INR_PER_SHARE' as const,reportingScope:'STANDALONE',originalSha256:x.source_original_sha256,sourceAvailableAt:x.source_published_at,denominatorShareFactorNumerator:bonus?'5':'1',denominatorShareFactorDenominator:bonus?'6':'1',shareBasisAvailableAt:bonus?fixed.share_basis_original.published_at:x.source_published_at,shareAlignment:'SOURCE_QUALIFIED' as const}})}
  const r=calculateBankPeMultiple(calc);if(r.state!=='CALCULATED_NOT_ADMITTED'){excluded.push({month,reason:r.reason});return}
  candidates.push({role,month,multiple:r.multiple,ttmDilutedEps:r.ttmDilutedEps,sourceAvailableAt:r.sourceAvailableAt,priceAsOf,input:calc,priceSourceRecordId:sourceId,denominatorSourceRecordIds:[...new Set(bound.map(s=>s.id))],corporateActionSourceRecordIds:input.corporateActionSourceRecordIds})
 }
 for(const price of kvbPbFixedInputs.prices){const proof=input.priceProofs.find(p=>p.month===price.month);if(!proof?.originalBytesVerified||proof.isin!==kvbPbFixedInputs.isin||proof.tradeDate!==price.trade_date||!sameQualifiedHistoryNumeric(proof.rawClose,price.raw_close))throw Error('KVB_PE_VERIFIED_RAW_PRICE_MISSING');calculate(price.month,price.trade_date,price.raw_close,proof.sourceRecordId,'HISTORICAL')}
 calculate(input.current.session.slice(0,7),input.current.session,input.current.close,input.current.sourceRecordId,'CURRENT')
 if(!candidates.some(c=>c.role==='CURRENT'))throw Error('KVB_PE_CURRENT_DENOMINATOR_NOT_QUALIFIED')
 const months=new Set(candidates.filter(c=>c.role==='HISTORICAL').map(c=>c.month)),bands=[0,0,0,0,0];let missing=0,longest=0;kvbPbFixedInputs.prices.forEach((p,i)=>{if(months.has(p.month)){bands[Math.floor(i/12)]!++;missing=0}else{missing++;longest=Math.max(longest,missing)}})
 const content={version:'KVB_PE_SOURCE_QUALIFIED_OWNER_BATCH_V1',requirementCode:'PE_TTM_RELATIVE' as const,method:'BANK_PE_TTM_RELATIVE_SELF_MEDIAN_60M_V1',securityId:KVB_PB_SECURITY,candidates,excluded,coverage:{eligibleMonths:months.size,bands,longestMissingRun:longest,qualified:months.size>=36&&bands.every(n=>n>=6)&&longest<=6},currentPriceSourceRecordId:input.current.sourceRecordId,currentPriceSession:input.current.session,currentRawClose:input.current.close,shareBasisEvidence:fixed.share_basis_original,canonicalAdmissions:0 as const}
 return {...content,proposalHash:await kvbPbHash(content),preparedAt:input.preparedAt}
}
