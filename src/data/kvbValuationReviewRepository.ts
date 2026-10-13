import {supabase} from '../lib/supabase'
export type KvbValuationBatch={batchHash:string;currentPriceSession:string;metrics:{requirementCode:string;eligibleMonths:number;bands:number[];longestMissingRun:number;proposalHash:string}[];canonicalAdmissions:0;acceptedBatchId?:string|null;admissionState:'UNAPPROVED'|'OWNER_APPROVED_PENDING_ADMISSION'|'ADMITTED_NOT_MATERIALIZED';sourceEvidence:{sourceRecordId:string;sourceCode:string;recordKind:string;originalUrl:string|null;originalSha256:string|null;payloadHash:string;publishedAt:string|null;retrievedAt:string;publicationPrecision:string|null}[];valuationEvidence:{pb:{candidates:Record<string,unknown>[];excluded:{month:string;reason:string}[]};pe:{candidates:Record<string,unknown>[];excluded:{month:string;reason:string}[]}}}
async function invoke(action:string,fields:Record<string,unknown>={}):Promise<Record<string,unknown>>{
 const session=await supabase.auth.getSession()
 if(session.error||!session.data.session)throw Error('OWNER_SESSION_REQUIRED')
 const result=await supabase.functions.invoke('v14-kvb-pb-admission',{body:{action,portfolioId:'6193a4aa-3235-4057-bddc-209fcf443fc2',securityId:'be55b3cc-0400-45af-84aa-2a95e2c361c5',...fields}})
 if(result.error){let code='KVB_VALUATION_REQUEST_FAILED';try{const response=(result.error as {context?:unknown}).context;if(response instanceof Response){const body:unknown=await response.json();if(body&&typeof body==='object'&&'code' in body&&typeof body.code==='string')code=('stage' in body&&typeof body.stage==='string'?body.stage+': ':'')+body.code}}catch{/* Credential-free errors only. */}throw Error(code)}
 if(!result.data||typeof result.data!=='object')throw Error('KVB_VALUATION_RESPONSE_INCOMPLETE')
 return result.data as Record<string,unknown>
}
export async function loadKvbValuationBatch():Promise<KvbValuationBatch>{
 const r=await invoke('LOAD_KVB_PB_PE_OWNER_BATCH')
 if(r.code!=='KVB_SOURCE_QUALIFIED_OWNER_BATCH'||!r.batch||typeof r.batch!=='object')throw Error('KVB_SOURCE_BATCH_NOT_READY')
 const b=r.batch as KvbValuationBatch
 if(!/^[a-f0-9]{64}$/.test(b.batchHash)||b.canonicalAdmissions!==0||!Array.isArray(b.metrics)||b.metrics.length!==2||new Set(b.metrics.map(m=>m.requirementCode)).size!==2||!b.metrics.every(m=>['PB_RELATIVE','PE_TTM_RELATIVE'].includes(m.requirementCode)&&m.eligibleMonths>=36&&m.bands.length===5&&m.bands.every(n=>n>=6)&&m.longestMissingRun<=6))throw Error('KVB_SOURCE_BATCH_CONTRACT_INVALID')
 if(!['UNAPPROVED','OWNER_APPROVED_PENDING_ADMISSION','ADMITTED_NOT_MATERIALIZED'].includes(b.admissionState)||!Array.isArray(b.sourceEvidence)||b.sourceEvidence.length<20||!b.valuationEvidence?.pb?.candidates||!b.valuationEvidence?.pe?.candidates||/X-Amz-|Bearer |access_token|refresh_token/i.test(JSON.stringify(b)))throw Error('KVB_REVIEWABLE_SOURCE_EVIDENCE_INVALID')
 if(b.admissionState!=='UNAPPROVED'&&(!b.acceptedBatchId||!/^[a-f0-9-]{36}$/.test(b.acceptedBatchId)))throw Error('KVB_OWNER_AUDIT_IDENTITY_INVALID')
 return b
}
export async function approveKvbValuationBatch(b:KvbValuationBatch):Promise<string>{
 const r=await invoke('APPROVE_KVB_PB_PE_OWNER_BATCH',{batchHash:b.batchHash,confirmCommonEquityBasis:true,confirmDilutedTtmBasis:true,confirmGlobalApprovedDefinitionActivation:true})
 if(r.code!=='KVB_OWNER_BATCH_ADMITTED_NOT_MATERIALIZED'||typeof r.ownerBatchId!=='string')throw Error('KVB_OWNER_BATCH_ADMISSION_NOT_ESTABLISHED')
 return r.ownerBatchId
}

export async function refreshKvbValuationSessionEvidence():Promise<void>{
 const r=await invoke('REFRESH_KVB_SESSION_EVIDENCE')
 if(r.code!=='KVB_CURRENT_SESSION_EVIDENCE_QUALIFIED'||!Number.isInteger(r.publicSourceRequests)||![0,1].includes(r.publicSourceRequests as number)||r.paidProviderCalls!==0||r.retries!==0)throw Error('KVB_CURRENT_SESSION_REFRESH_NOT_QUALIFIED')
}
