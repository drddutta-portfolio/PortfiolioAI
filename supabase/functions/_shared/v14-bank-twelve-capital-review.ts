import manifest from "./v14-bank-twelve-capital-manifest.json" with {type:"json"}
import {BANK_TWELVE_POLICY as policy} from "./v14-bank-twelve-delegation.ts"
import {bankReportingDeadline} from "./v14-bank-dual-clock.ts"
import type {RequirementReview,ReviewedSourceRecord} from "./v14-reviewed-evidence.ts"
export const BANK_TWELVE_CAPITAL_MANIFEST=manifest
export const BANK_TWELVE_CAPITAL_ACTION="ADMIT_PINNED_TWELVE_BANK_CAPITAL_V1"
export function twelveCapitalReadUrl(raw:string):boolean{
 try{const u=new URL(raw);return u.protocol==="https:"&&u.hostname==="ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com"
  &&!u.username&&!u.password&&!u.port&&!u.hash&&decodeURIComponent(u.pathname)===`/${policy.storageBucket}/${policy.storageKeyPrefix}${manifest.original_sha256}.pdf`
  &&u.searchParams.get("X-Amz-Algorithm")==="AWS4-HMAC-SHA256"&&Number(u.searchParams.get("X-Amz-Expires"))>0&&Number(u.searchParams.get("X-Amz-Expires"))<=300
 }catch{return false}
}
export const stableBankValue=(v:unknown):string=>Array.isArray(v)?"["+v.map(stableBankValue).join(",")+"]":v!==null&&typeof v==="object"
 ?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stableBankValue(x)).join(",")+"}":JSON.stringify(v)??"null"
export const bankValueHash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(stableBankValue(v))))).map(x=>x.toString(16).padStart(2,"0")).join("")
function ledgerTimestamp(value:string):string{
 const iso=new Date(value).toISOString().replace(/\.000Z$/,"Z").replace(/(\.\d*?[1-9])0+Z$/,"$1Z")
 return iso.replace(/Z$/,"+00:00")
}
export function twelveCapitalClaimsQualified(p:Readonly<Record<string,unknown>>):boolean{
 return p.repository==="drddutta-portfolio/PortfiolioAI"&&p.repository_id==="1357024254"
  &&p.ref==="refs/heads/codex/banking-twelve-evidence"&&p.environment==="PortfolioAI-Development"
  &&p.sub==="repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development"
  &&p.workflow_ref==="drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-twelve-capital.yml@refs/heads/codex/banking-twelve-evidence"
  &&["workflow_dispatch","push"].includes(String(p.event_name))&&typeof p.sha==="string"&&/^[a-f0-9]{40}$/.test(p.sha)
}
export async function prepareTwelveCapitalReview(verifiedAt:string){
 if(!Number.isFinite(Date.parse(verifiedAt))||Date.parse(verifiedAt)<Date.parse(manifest.proven_availability_at))throw Error("VERIFICATION_TIME_INVALID")
 verifiedAt=ledgerTimestamp(verifiedAt)
 if(!Object.hasOwn(policy.securities,manifest.security_id)||manifest.symbol==="KARURVYSYA")throw Error("BANK_TWELVE_SCOPE_INVALID")
 for(const fact of manifest.facts)if(!fact.source_segments.every(s=>manifest.source_normalized_page.includes(s)))throw Error("PINNED_FRAGMENT_MISMATCH")
 const raw={version:"BANK_TWELVE_PINNED_CURRENT_CAPITAL_V1",security_id:manifest.security_id,symbol:manifest.symbol,policy_id:policy.id,
  original_url:manifest.original_url,original_sha256:manifest.original_sha256,original_bytes:manifest.original_bytes,
  r2_bucket:policy.storageBucket,r2_object_key:policy.storageKeyPrefix+manifest.original_sha256+".pdf",r2_verified_sha256:manifest.original_sha256,
  original_bytes_verified_at:verifiedAt,publication_precision:manifest.publication_precision,published_at:null,
  first_verified_available_at:manifest.proven_availability_at,factual_review_status:"SOURCE_FACT_QUALIFIED",
  source_text_attestation:"VERIFIED_FROM_ORIGINAL_PDF_BYTES",source_scope:manifest.consolidation_scope,source_page:1,facts:manifest.facts}
 const source:ReviewedSourceRecord={id:manifest.source_id,source_code:"COMPANY_EXCHANGE_FILING",record_kind:"V1_4_BANK_DELEGATED_PRIMARY_FACTS",
  retrieved_at:manifest.proven_availability_at,published_at:null,payload_hash:await bankValueHash(raw),raw_payload:raw}
 const reviews:RequirementReview[]=[]
 for(const fact of manifest.facts){
  const review={portfolio_id:policy.portfolioId,security_id:manifest.security_id,requirement_code:fact.requirement_code,
   review_kind:"DELEGATED_NUMERIC_REVIEW",decision:"ACCEPTED",source_record_id:source.id,research_document_id:null,provider_document_id:null,
   source_payload_hash:source.payload_hash,supporting_quote:fact.quote,period_start:manifest.period_end,period_end:manifest.period_end,
   period_type:"REGULATORY_AS_OF",unit:"PERCENT",currency:null,consolidation_scope:manifest.consolidation_scope,published_at:null,
   retrieved_at:manifest.proven_availability_at,fresh_through:ledgerTimestamp(new Date(bankReportingDeadline(manifest.period_end,150)).toISOString()),review_version:"V1_4_REQUIREMENT_REVIEW_V2",
   reviewed_by:null,reviewed_at:verifiedAt,supersedes_review_id:null,metadata:{metric_code:fact.requirement_code,numeric_value:fact.value,
    review_authorization:{policy_id:policy.id,authorizing_owner_id:policy.ownerId,executor:policy.executor,authorization:policy.authorization,
     recorded_at:policy.recordedAt,directive_sha256:policy.directiveSha256},
    source_binding:{kind:"TABLE_CELL",fragment:fact.quote,metric_label:fact.metric_label,period_label:manifest.period_anchor,
     exact_value:fact.value,period_start:manifest.period_end,period_end:manifest.period_end,period_type:"REGULATORY_AS_OF",
     period_start_anchor:manifest.period_anchor,period_end_anchor:manifest.period_anchor,scale:"1",conversion:"IDENTITY"}}}
  reviews.push({id:manifest.review_ids[fact.requirement_code as keyof typeof manifest.review_ids],...review,review_hash:await bankValueHash(review)})
 }
 return {source,reviews}
}
