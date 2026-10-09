import policy from "./v14-bank-approved-delegation.json" with {type:"json"}
import type {RequirementReview,ReviewedSourceRecord,ReviewEvidenceFamily} from "./v14-reviewed-evidence.ts"

export const BANK_DELEGATION_POLICY=policy
const kinds:Partial<Record<ReviewEvidenceFamily,string>>={NUMERIC_SERIES:"DELEGATED_NUMERIC_REVIEW",OWNERSHIP_4Q:"DELEGATED_OWNERSHIP_REVIEW",TEXT_EVIDENCE_REVIEW:"DELEGATED_DOCUMENT_REVIEW"}

/** Existing service-role-only append ledger is the write authority; metadata is
 * integrity hashed and cannot be supplied through the read-only handler. No owner impersonation. */
export function approvedBankDelegatedReview(review:RequirementReview,ownerId:string,family:ReviewEvidenceFamily):boolean{
 const a=review.metadata.review_authorization as Record<string,unknown>|null
 return review.reviewed_by===null&&review.review_kind===kinds[family]&&review.portfolio_id===policy.portfolioId
  &&ownerId===policy.ownerId&&Object.hasOwn(policy.securities,review.security_id)&&policy.requirements.includes(review.requirement_code)
  &&Number.isFinite(Date.parse(review.reviewed_at))&&Date.parse(review.reviewed_at)>=Date.parse(policy.recordedAt)
  &&a?.policy_id===policy.id&&a.authorizing_owner_id===ownerId&&a.executor===policy.executor&&a.authorization===policy.authorization
  &&a.recorded_at===policy.recordedAt
}

/** Override only provider identity for qualified official-filing reviews. All
 * existing metric units, periods, scope, freshness and series validators remain. */
export function approvedBankOfficialFallback(review:RequirementReview,source:ReviewedSourceRecord,ownerId:string,family:ReviewEvidenceFamily):boolean{
 if(!approvedBankDelegatedReview(review,ownerId,family)||!policy.fallbackSources.includes(source.source_code))return false
 const p=source.raw_payload
 if(p.security_id!==review.security_id||p.policy_id!==policy.id||p.symbol!==policy.securities[review.security_id as keyof typeof policy.securities])return false
 if(typeof p.original_sha256!=="string"||! /^[0-9a-f]{64}$/u.test(p.original_sha256)||typeof p.original_url!=="string")return false
 try{const u=new URL(p.original_url);return u.protocol==="https:"&&u.hostname==="nsearchives.nseindia.com"&&u.pathname.startsWith("/corporate/")}catch{return false}
}
