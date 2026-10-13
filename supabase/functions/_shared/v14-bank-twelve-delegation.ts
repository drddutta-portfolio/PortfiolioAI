import policy from "./v14-bank-twelve-delegation.json" with {type:"json"}
import type {RequirementReview,ReviewedSourceRecord,ReviewEvidenceFamily} from "./v14-reviewed-evidence.ts"

export const BANK_TWELVE_POLICY=policy
export function approvedTwelveBankReview(r:RequirementReview,owner:string,family:ReviewEvidenceFamily):boolean{
 const a=r.metadata.review_authorization as Record<string,unknown>|null
 return family==="NUMERIC_SERIES"&&r.reviewed_by===null&&r.review_kind===policy.review_kind
  &&r.portfolio_id===policy.portfolioId&&owner===policy.ownerId
  &&Object.hasOwn(policy.securities,r.security_id)&&policy.requirements.includes(r.requirement_code)
  &&Number.isFinite(Date.parse(r.reviewed_at))&&Date.parse(r.reviewed_at)>=Date.parse(policy.recordedAt)
  &&a?.policy_id===policy.id&&a.authorizing_owner_id===owner&&a.executor===policy.executor
  &&a.authorization===policy.authorization&&a.recorded_at===policy.recordedAt
  &&a.directive_sha256===policy.directiveSha256
}
export function approvedTwelveBankIssuerSource(r:RequirementReview,s:ReviewedSourceRecord,owner:string,family:ReviewEvidenceFamily):boolean{
 if(!approvedTwelveBankReview(r,owner,family))return false
 const p=s.raw_payload
 if(s.source_code!=="COMPANY_EXCHANGE_FILING"||p.policy_id!==policy.id||p.security_id!==r.security_id
  ||p.factual_review_status!=="SOURCE_FACT_QUALIFIED"||p.source_text_attestation!=="VERIFIED_FROM_ORIGINAL_PDF_BYTES"
  ||typeof p.original_sha256!=="string"||!/^[a-f0-9]{64}$/.test(p.original_sha256)
  ||p.r2_verified_sha256!==p.original_sha256||p.r2_bucket!==policy.storageBucket
  ||p.r2_object_key!==policy.storageKeyPrefix+p.original_sha256+".pdf"
  ||!Number.isFinite(Date.parse(String(p.original_bytes_verified_at??""))))return false
 const hosts=policy.approvedIssuerHosts[r.security_id as keyof typeof policy.approvedIssuerHosts] as readonly string[]|undefined
 try{
  const u=new URL(String(p.original_url??""))
  if(u.protocol!=="https:"||u.username||u.password||u.hash||!hosts?.includes(u.hostname))return false
  const plain=u.search===""&&u.pathname.toLowerCase().endsWith(".pdf")
  const documentHost=["www.federal.bank.in","federal.bank.in","sbi.bank.in"].includes(u.hostname)
  const document=documentHost&&u.pathname.startsWith("/documents/")&&/\.pdf\/[a-f0-9-]{36}$/i.test(u.pathname)&&/^\?t=\d+$/.test(u.search)
  return plain||document
 }catch{return false}
}
