import {kvbPbHash,KVB_PB_OWNER,KVB_PB_PORTFOLIO,KVB_PB_SECURITY} from './v14-kvb-pb-admission.ts'
import {calculateBankPeMultiple,type BankPeCalculationInput} from './v14-bank-valuation-pe-calculation.ts'
export interface KvbQuarterPublication {quarterEnd:string;publishedAt:string;originalSha256:string}
export interface KvbPeSourceCandidate {month:string;input:BankPeCalculationInput;sourceRecordIds:readonly string[];priceSourceRecordId:string}
/** Explicit latest-actually-published issuer disclosure timeline, not merely retained availability. */
export function qualifyKvbPeCandidate(candidate:KvbPeSourceCandidate,timeline:readonly KvbQuarterPublication[]){
 const cutoff=Date.parse(candidate.input.priceAsOf)
 if(!Number.isFinite(cutoff))throw Error('KVB_PE_INVALID_PRICE_CUTOFF')
 if(timeline.some(x=>!Number.isFinite(Date.parse(x.publishedAt))||!/^\d{4}-\d{2}-\d{2}$/.test(x.quarterEnd)||!/^[a-f0-9]{64}$/.test(x.originalSha256)))throw Error('KVB_PE_PUBLICATION_TIMELINE_INVALID')
 const available=timeline.filter(x=>Date.parse(x.publishedAt)<=cutoff).sort((a,b)=>b.quarterEnd.localeCompare(a.quarterEnd)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt))
 if(!available.length||available[0]!.quarterEnd!==candidate.input.ttmPeriodEnd)return {state:'EXCLUDED' as const,reason:'THEN_CURRENT_PUBLISHED_QUARTER_NOT_PROVEN'}
 if(candidate.sourceRecordIds.length<1||candidate.sourceRecordIds.some(x=>!x)||!candidate.priceSourceRecordId)throw Error('KVB_PE_EXACT_FOUR_SOURCE_COMPONENT_BINDINGS_REQUIRED')
 const computed=calculateBankPeMultiple(candidate.input)
 return computed.state==='CALCULATED_NOT_ADMITTED'?{...computed,state:'CALCULATED_NOT_ADMITTED' as const}:computed
}
export interface KvbValuationMetricProposal {requirementCode:'PB_RELATIVE'|'PE_TTM_RELATIVE';proposalHash:string;method:string;eligibleMonths:number;bands:readonly number[];longestMissingRun:number;currentPriceSourceRecordId:string;canonicalAdmissions:0}
export async function prepareKvbValuationOwnerBatch(metrics:readonly KvbValuationMetricProposal[],currentPriceSession:string){
 if(metrics.length!==2||new Set(metrics.map(x=>x.requirementCode)).size!==2)throw Error('KVB_BOTH_VALUATIONS_REQUIRED_FOR_OWNER_BATCH')
 const methods={PB_RELATIVE:'BANK_PB_RELATIVE_SELF_MEDIAN_60M_V1',PE_TTM_RELATIVE:'BANK_PE_TTM_RELATIVE_SELF_MEDIAN_60M_V1'}
 for(const m of metrics){if(m.method!==methods[m.requirementCode]||!/^[a-f0-9]{64}$/.test(m.proposalHash)||m.canonicalAdmissions!==0||m.eligibleMonths<36||m.eligibleMonths>60||m.bands.length!==5||m.bands.some(n=>!Number.isInteger(n)||n<6||n>12)||m.bands.reduce((a,b)=>a+b,0)!==m.eligibleMonths||m.longestMissingRun>6||m.longestMissingRun<0)throw Error('KVB_OWNER_BATCH_SOURCE_COVERAGE_NOT_QUALIFIED')}
 if(metrics[0]!.currentPriceSourceRecordId!==metrics[1]!.currentPriceSourceRecordId)throw Error('KVB_OWNER_BATCH_CURRENT_PRICE_CONFLICT')
 const content={version:'KVB_PB_PE_GENUINE_OWNER_BATCH_V1',portfolioId:KVB_PB_PORTFOLIO,securityId:KVB_PB_SECURITY,currentPriceSession,metrics:[...metrics].sort((a,b)=>a.requirementCode.localeCompare(b.requirementCode)),canonicalAdmissions:0 as const,ownerApprovalRequired:true,registryActivationScope:'GLOBAL_APPROVED_METRIC_DEFINITIONS_ONLY_OTHER_BANKS_REQUIRE_INDEPENDENT_EVIDENCE',preservedRoaReview:true}
 return {...content,batchHash:await kvbPbHash(content)}
}
export function validateKvbOwnerBatchConfirmation(input:{authenticatedOwnerId:string;portfolioOwnerId:string;portfolioId:string;securityId:string;batchHash:string;expectedBatchHash:string;confirmCommonEquityBasis:boolean;confirmDilutedTtmBasis:boolean;confirmGlobalApprovedDefinitionActivation:boolean}){
 if(input.authenticatedOwnerId!==KVB_PB_OWNER||input.portfolioOwnerId!==KVB_PB_OWNER||input.portfolioId!==KVB_PB_PORTFOLIO||input.securityId!==KVB_PB_SECURITY)throw Error('KVB_VALUATION_GENUINE_OWNER_REQUIRED')
 if(!/^[a-f0-9]{64}$/.test(input.batchHash)||input.batchHash!==input.expectedBatchHash)throw Error('KVB_VALUATION_PROPOSAL_CHANGED')
 if(input.confirmCommonEquityBasis!==true||input.confirmDilutedTtmBasis!==true||input.confirmGlobalApprovedDefinitionActivation!==true)throw Error('KVB_VALUATION_EXPLICIT_BATCH_CONFIRMATION_REQUIRED')
 return true
}
