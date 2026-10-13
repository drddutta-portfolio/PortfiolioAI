import {kvbPbHash,KVB_PB_SECURITY,KVB_PB_PORTFOLIO} from './v14-kvb-pb-admission.ts'
import {calculateBankPbMultiple,type BankPbCalculationInput} from './v14-bank-valuation-pb-calculation.ts'
import {calculateBankPeMultiple,type BankPeCalculationInput} from './v14-bank-valuation-pe-calculation.ts'
import registry from './v14-kvb-valuation-registry-pins.json' with {type:'json'}
type Json=Record<string,unknown>
export interface KvbFinancialCandidate {role:'HISTORICAL'|'CURRENT';month:string;multiple:string;sourceAvailableAt:string;priceAsOf:string;input:BankPbCalculationInput|BankPeCalculationInput;priceSourceRecordId:string;denominatorSourceRecordIds:string[];corporateActionSourceRecordIds:string[]}
export interface KvbFinancialProposal {requirementCode:'PB_RELATIVE'|'PE_TTM_RELATIVE';method:string;candidates:KvbFinancialCandidate[];excluded:unknown[];coverage:{eligibleMonths:number;bands:number[];longestMissingRun:number;qualified:boolean}}
export interface KvbFinancialPreparedBatch {pbProposal:KvbFinancialProposal;peProposal:KvbFinancialProposal;batchHash:string;currentPriceSession:string}
/** Financial approval deliberately excludes CURRENT market price/date/capture.
 * Historical prices remain part of the historical evidence being reviewed.
 * Any financial amount/component, financial source, share basis or approved model
 * change changes this fingerprint and requires a new genuine owner review. */
export async function kvbFinancialSourceReview(batch:KvbFinancialPreparedBatch){
 const metrics=[]
 for(const proposal of [batch.pbProposal,batch.peProposal]){
  const historical=proposal.candidates.filter(c=>c.role==='HISTORICAL'),current=proposal.candidates.filter(c=>c.role==='CURRENT')
  if(current.length!==1||historical.length<36||!proposal.coverage.qualified||proposal.coverage.bands.length!==5||proposal.coverage.bands.some(n=>n<6)||proposal.coverage.longestMissingRun>6)throw Error('KVB_FINANCIAL_REVIEW_COVERAGE_NOT_QUALIFIED')
  for(const c of proposal.candidates){const calculated=proposal.requirementCode==='PB_RELATIVE'?calculateBankPbMultiple(c.input as BankPbCalculationInput):calculateBankPeMultiple(c.input as BankPeCalculationInput);if(calculated.state!=='CALCULATED_NOT_ADMITTED'||calculated.multiple!==c.multiple||Date.parse(calculated.sourceAvailableAt)!==Date.parse(c.sourceAvailableAt))throw Error('KVB_FINANCIAL_SOURCE_CALCULATION_CHANGED')}
  const {rawClose:_close,priceAsOf:_priceAt,evaluationAsOf:_evalAt,...financialInput}=current[0]!.input;void _close;void _priceAt;void _evalAt
  const definition=registry.find(r=>r.code===proposal.requirementCode);if(!definition||definition.definition.model!==proposal.method)throw Error('KVB_FINANCIAL_REVIEW_MODEL_NOT_APPROVED')
  const {activation_status:_status,...model}=definition.definition;void _status
  metrics.push({requirementCode:proposal.requirementCode,method:proposal.method,approvedModel:model,historical,excluded:proposal.excluded,coverage:proposal.coverage,currentFinancialFacts:{input:financialInput,sourceAvailableAt:current[0]!.sourceAvailableAt,denominatorSourceRecordIds:current[0]!.denominatorSourceRecordIds,corporateActionSourceRecordIds:current[0]!.corporateActionSourceRecordIds}})
 }
 const scope={version:'KVB_STABLE_FINANCIAL_SOURCE_REVIEW_V1',securityId:KVB_PB_SECURITY,portfolioId:KVB_PB_PORTFOLIO,metrics,approvalScope:'EXACT_HISTORICAL_AND_CURRENT_FINANCIAL_SOURCES_NOT_CURRENT_MARKET_PRICE',newFinancialPeriodRequiresOwnerReview:true}
 return {...scope,financialSourceReviewHash:await kvbPbHash(scope)}
}
export function recomputeKvbApprovedCurrent(batch:KvbFinancialPreparedBatch,current:{sourceRecordId:string;close:string;session:string;retrievedAt:string;historyContractState:'FRESH'},at:string){
 if(current.historyContractState!=='FRESH'||!Number.isFinite(Date.parse(at))||!Number.isFinite(Date.parse(current.retrievedAt))||Date.parse(current.retrievedAt)>Date.parse(at))throw Error('KVB_CURRENT_PRICE_NOT_CANONICALLY_QUALIFIED')
 const priceAsOf=current.session+'T15:30:00+05:30'
 if(Date.parse(priceAsOf)>Date.parse(at))throw Error('KVB_CURRENT_PRICE_FUTURE_SESSION_NOT_ALLOWED')
 return [batch.pbProposal,batch.peProposal].map(proposal=>{
  const prior=proposal.candidates.find(c=>c.role==='CURRENT');if(!prior)throw Error('KVB_APPROVED_CURRENT_FINANCIAL_FACTS_MISSING')
  const input={...prior.input,rawClose:current.close,priceAsOf,evaluationAsOf:current.retrievedAt}
  const result=proposal.requirementCode==='PB_RELATIVE'?calculateBankPbMultiple(input as BankPbCalculationInput):calculateBankPeMultiple(input as BankPeCalculationInput)
  if(result.state!=='CALCULATED_NOT_ADMITTED')throw Error('KVB_APPROVED_CURRENT_CALCULATION_NOT_QUALIFIED:'+result.reason)
  return {...prior,month:current.session.slice(0,7),multiple:result.multiple,sourceAvailableAt:result.sourceAvailableAt,priceAsOf,input,priceSourceRecordId:current.sourceRecordId}
 })
}
export function kvbFinancialAuditMatches(raw:Json,ownerId:string,financialHash:string){return raw.owner_id===ownerId&&raw.financial_source_review_hash===financialHash&&raw.security_id===KVB_PB_SECURITY&&raw.portfolio_id===KVB_PB_PORTFOLIO&&raw.common_equity_confirmed===true&&raw.diluted_ttm_confirmed===true&&raw.global_approved_definition_activation_confirmed===true}

/** A new retained issuer results period blocks current recomputation from older
 * approved facts. It is not admitted automatically and does not invalidate the
 * historical review. Ownership-only SHP XML is not an earnings disclosure. */
export function kvbNewFinancialPeriodRequiresReview(batch:KvbFinancialPreparedBatch,records:readonly {retrieved_at:string;published_at:string|null;raw_payload:Record<string,unknown>}[],at:string){
 const current=batch.peProposal.candidates.find(c=>c.role==='CURRENT'),approvedEnd=current&&'ttmPeriodEnd'in current.input?current.input.ttmPeriodEnd:''
 if(!approvedEnd)return true
 return records.some(r=>{const p=r.raw_payload,period=p.original_period_end;return p.security_id===KVB_PB_SECURITY&&typeof period==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(period)&&period>approvedEnd&&typeof p.original_url==='string'&&!p.original_url.includes('/xbrl/SHP_')&&Number.isFinite(Date.parse(r.retrieved_at))&&Date.parse(r.retrieved_at)<=Date.parse(at)&&(r.published_at===null||Number.isFinite(Date.parse(r.published_at))&&Date.parse(r.published_at)<=Date.parse(at))})
}
