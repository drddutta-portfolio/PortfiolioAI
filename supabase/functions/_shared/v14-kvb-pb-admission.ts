import fixed from "./v14-kvb-pb-admission-inputs.json" with {type:"json"}
import {calculateBankPbMultiple,type BankPbCalculationInput} from "./v14-bank-valuation-pb-calculation.ts"
import {sameQualifiedHistoryNumeric} from "./v14-history-numeric-equality.ts"
export const KVB_PB_PROPOSAL_KIND="V1_4_KVB_PB_SOURCE_QUALIFIED_PROPOSAL"
export const KVB_PB_OWNER_APPROVAL_KIND="V1_4_KVB_PB_OWNER_BATCH_APPROVAL"
export const KVB_PB_SECURITY="be55b3cc-0400-45af-84aa-2a95e2c361c5"
export const KVB_PB_OWNER="f9e48c4c-d796-424b-95f7-2a4a97149543"
export const KVB_PB_PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
export const KVB_PB_BASIS=fixed.corporate_action_basis
export const kvbPbFixedInputs=fixed
type Json=Readonly<Record<string,unknown>>
export interface KvbPbSource{readonly id:string;readonly source_code:string;readonly record_kind:string;readonly published_at:string|null;readonly retrieved_at:string;readonly payload_hash:string;readonly raw_payload:Json}
export interface KvbPbPriceProof{readonly month:string;readonly sourceRecordId:string;readonly authority:"DATA_SOURCE_RECORD"|"P8_B3_VERIFIED_NSE_ARCHIVE";readonly authorityRecordId:string;readonly rawClose:string;readonly tradeDate:string;readonly isin:string;readonly contentSha256?:string;readonly originalBytesVerified:boolean}
export interface KvbPbCurrentPrice{readonly sourceRecordId:string;readonly close:string;readonly session:string;readonly retrievedAt:string;readonly historyContractState:"FRESH"|"STALE"|"REVIEW_REQUIRED"}
const ms=(x:unknown)=>typeof x==="string"?Date.parse(x):NaN
const valid=(x:unknown)=>Number.isFinite(ms(x))
const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"?"{"+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null"
export const kvbPbHash=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(stable(value))))).map(x=>x.toString(16).padStart(2,"0")).join("")
export async function kvbPbStableId(value:unknown){const h=await kvbPbHash(value);return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`}
function sourceForOriginal(sources:readonly KvbPbSource[],hash:string,available:string){
 const matches=sources.filter(s=>s.record_kind==="V1_4_BANK_PIT_REGISTERED_ORIGINAL"&&s.source_code==="NSE_OFFICIAL"&&s.raw_payload.security_id===KVB_PB_SECURITY&&s.raw_payload.original_sha256===hash)
 if(matches.length!==1)throw Error("KVB_PB_REGISTERED_ORIGINAL_NOT_UNIQUE:"+hash)
 const s=matches[0]!
 if(s.raw_payload.r2_verified_sha256!==hash||s.raw_payload.r2_bucket!=="portfolioai-history-dev"||s.raw_payload.publication_precision!=="EXACT"||!valid(s.published_at)||ms(s.published_at)!==ms(available))throw Error("KVB_PB_ORIGINAL_AVAILABILITY_NOT_BOUND")
 return s
}
function coverage(months:readonly string[]){
 const expected=fixed.prices.map(p=>p.month),bands=[0,0,0,0,0];let run=0,max=0
 for(let i=0;i<expected.length;i++){if(months.includes(expected[i]!)){bands[Math.floor(i/12)]!++;run=0}else{run++;max=Math.max(max,run)}}
 return {eligibleMonths:months.length,bands,longestMissingRun:max,qualified:months.length>=36&&bands.every(n=>n>=6)&&max<=6}
}
export async function prepareKvbPbProposal(input:{sources:readonly KvbPbSource[];priceProofs:readonly KvbPbPriceProof[];corporateActionSourceRecordIds:readonly string[];current:KvbPbCurrentPrice;preparedAt:string}){
 if(!valid(input.preparedAt)||input.current.historyContractState!=="FRESH"||!valid(input.current.retrievedAt)||ms(input.current.retrievedAt)>ms(input.preparedAt)||!/^2026-10-\d{2}$/.test(input.current.session)||input.current.session>input.preparedAt.slice(0,10))throw Error("KVB_PB_CURRENT_QUALIFIED_HISTORY_REQUIRED")
 if(input.corporateActionSourceRecordIds.length<5||new Set(input.corporateActionSourceRecordIds).size!==input.corporateActionSourceRecordIds.length)throw Error("KVB_PB_COMPLETE_CA_SOURCES_REQUIRED")
 const originalBindings=new Map<string,KvbPbSource>()
 for(const b of fixed.books){originalBindings.set(b.equity_original_sha256,sourceForOriginal(input.sources,b.equity_original_sha256,b.equity_available_at));originalBindings.set(b.share_original_sha256,sourceForOriginal(input.sources,b.share_original_sha256,b.share_available_at))}
 const candidates:Array<{role:"HISTORICAL"|"CURRENT";month:string;multiple:string;bookValuePerShare:string;priceAsOf:string;sourceAvailableAt:string;input:BankPbCalculationInput;priceSourceRecordId:string;denominatorSourceRecordIds:string[];corporateActionSourceRecordIds:readonly string[]}>=[],excluded:Array<{month:string;reason:string}>=[]
 function calculate(month:string,tradeDate:string,rawClose:string,priceSourceRecordId:string,role:"HISTORICAL"|"CURRENT"){
  const priceAsOf=tradeDate+"T15:30:00+05:30"
  const book=fixed.books.filter(b=>ms(b.equity_available_at)<=ms(priceAsOf)).sort((a,b)=>b.period_end.localeCompare(a.period_end))[0]
  if(!book)return {reason:"THEN_PUBLIC_EQUITY_MISSING"}
  const bonus=tradeDate>=fixed.bonus.ex_date&&book.period_end<fixed.bonus.ex_date
  if(bonus)return {reason:"THEN_PUBLIC_BONUS_ADJUSTED_BOOK_NOT_PROVEN"}
  const calcInput:BankPbCalculationInput={rawClose,capital:book.capital,reservesAndSurplus:book.reserves_and_surplus,currency:"INR",amountScale:"INR_LAKH",fullyPaidShares:book.fully_paid_shares,equityPeriodEnd:book.period_end,sharesPeriodEnd:book.period_end,reportingScope:"STANDALONE",shareCountBasis:"FULLY_PAID_OUTSTANDING",bookBasis:"STATUTORY_COMMON_EQUITY",priceBasis:"RAW_CONTEMPORANEOUS_CLOSE",equityAvailableAt:book.equity_available_at,sharesAvailableAt:book.share_available_at,priceAsOf,evaluationAsOf:role==="HISTORICAL"?priceAsOf:input.current.retrievedAt,denominatorShareFactorNumerator:bonus?"5":"1",denominatorShareFactorDenominator:bonus?"6":"1",shareAlignment:"SOURCE_QUALIFIED"}
  const result=calculateBankPbMultiple(calcInput)
  if(result.state!=="CALCULATED_NOT_ADMITTED")return {reason:result.reason}
  const item={role,month,multiple:result.multiple,bookValuePerShare:result.bookValuePerShare,priceAsOf,sourceAvailableAt:result.sourceAvailableAt,input:calcInput,priceSourceRecordId,denominatorSourceRecordIds:[originalBindings.get(book.equity_original_sha256)!.id,originalBindings.get(book.share_original_sha256)!.id],corporateActionSourceRecordIds:input.corporateActionSourceRecordIds};candidates.push(item);return {item}
 }
 if(input.priceProofs.length!==60||new Set(input.priceProofs.map(p=>p.month)).size!==60)throw Error("KVB_PB_EXACT_60_PRICE_PROOFS_REQUIRED")
 for(const p of fixed.prices){
  if(fixed.excluded_bonus_publication_unproven_months.includes(p.month)){excluded.push({month:p.month,reason:"BONUS_BASIS_PUBLICATION_NOT_YET_PROVEN"});continue}
  if(fixed.excluded_price_conflict_months.includes(p.month)){excluded.push({month:p.month,reason:"ORIGINAL_PRICE_SOURCE_CONFLICT"});continue}
  const proof=input.priceProofs.find(x=>x.month===p.month)
  if(!proof||!proof.originalBytesVerified||proof.authority!==p.price_authority||proof.authorityRecordId!==p.source_id||proof.isin!==fixed.isin||proof.tradeDate!==p.trade_date||!sameQualifiedHistoryNumeric(proof.rawClose,p.raw_close)||!proof.sourceRecordId)throw Error("KVB_PB_PRICE_PROOF_MISMATCH:"+p.month)
  if("content_sha256" in p&&proof.contentSha256!==p.content_sha256)throw Error("KVB_PB_ARCHIVE_CONTENT_HASH_MISMATCH")
  const result=calculate(p.month,p.trade_date,p.raw_close,proof.sourceRecordId,"HISTORICAL");if("reason" in result)excluded.push({month:p.month,reason:result.reason!})
 }
 const current=calculate(input.current.session.slice(0,7),input.current.session,input.current.close,input.current.sourceRecordId,"CURRENT")
 if("reason" in current)throw Error("KVB_PB_CURRENT_DENOMINATOR_INVALID:"+current.reason)
 const counts=coverage(candidates.filter(c=>c.role==="HISTORICAL").map(c=>c.month));if(!counts.qualified)throw Error("KVB_PB_COVERAGE_CONTRACT_NOT_MET")
 const proposal={version:"KVB_PB_SOURCE_QUALIFIED_OWNER_BATCH_V1",securityId:KVB_PB_SECURITY,portfolioId:KVB_PB_PORTFOLIO,requirementCode:"PB_RELATIVE",method:fixed.method,bookBasis:fixed.corporate_action_basis,candidates,excluded,coverage:counts,currentPriceSourceRecordId:input.current.sourceRecordId,currentPriceSession:input.current.session,currentRawClose:input.current.close,sourceOriginalHashes:[...originalBindings.keys()].sort(),ownerReviewRequired:true,registryActivationRequiresOwnerApproval:true,canonicalAdmissions:0}
 return {...proposal,proposalHash:await kvbPbHash(proposal),preparedAt:input.preparedAt}
}
export function kvbPbOwnerApprovalQualified(input:{ownerId:string;portfolioOwnerId:string;proposalHash:string;expectedProposalHash:string;confirmSourceBasis:boolean;confirmRegistryActivation:boolean}){return input.ownerId===KVB_PB_OWNER&&input.portfolioOwnerId===KVB_PB_OWNER&&input.proposalHash===input.expectedProposalHash&&/^[a-f0-9]{64}$/.test(input.proposalHash)&&input.confirmSourceBasis===true&&input.confirmRegistryActivation===true}
