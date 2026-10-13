import manifest from "./v14-bank-twelve-growth-manifest.json" with {type:"json"}
import {BANK_DELEGATION_POLICY as policy} from "./v14-bank-approved-delegation.ts"
import {BANK_TWELVE_POLICY} from "./v14-bank-twelve-delegation.ts"
import {bankValueHash} from "./v14-bank-twelve-capital-review.ts"
import {bankReportingDeadline} from "./v14-bank-dual-clock.ts"
import {twelveCapitalClaimsQualified} from "./v14-bank-twelve-capital-review.ts"
import type {RequirementReview,ReviewedSourceRecord} from "./v14-reviewed-evidence.ts"
export const BANK_TWELVE_GROWTH_MANIFEST=manifest
function ledgerTime(v:string):string{return new Date(v).toISOString().replace(/\.0+Z$/,"+00:00").replace(/(\.\d*?[1-9])0+Z$/,"$1+00:00").replace(/Z$/,"+00:00")}
/** Fixed source-reported facts only. This producer does not write, approve formulae,
 * issue grants, select snapshots or assign readiness. The caller must hash-verify
 * every immutable original and run the existing canonical reviewer before insert. */
export async function prepareTwelveGrowthReviews(symbol:string,verifiedAt:string){
 const pin=manifest.sources.find(s=>s.symbol===symbol)
 if(!pin||pin.symbol==="KARURVYSYA"||!Object.hasOwn(BANK_TWELVE_POLICY.securities,pin.security_id))throw Error("BANK_TWELVE_GROWTH_SCOPE_INVALID")
 if(pin.publication_entry.symbol!==pin.symbol||pin.publication_entry.attchmntFile!==pin.original_url||pin.publication_entry.exchdisstime!==pin.exchange_publication_literal)throw Error("BANK_TWELVE_GROWTH_PUBLICATION_BINDING_INVALID")
 if(!Number.isFinite(Date.parse(verifiedAt))||Date.parse(verifiedAt)<Date.parse(pin.published_at))throw Error("BANK_TWELVE_GROWTH_VERIFICATION_TIME_INVALID")
 const raw={version:manifest.version,policy_id:policy.id,security_id:pin.security_id,symbol:pin.symbol,original_url:pin.original_url,
  original_sha256:pin.original_sha256,original_bytes:pin.original_bytes,published_at:ledgerTime(pin.published_at),publication_precision:"EXACT",
  publication_proof_url:pin.publication_proof_url,publication_proof_sha256:pin.publication_proof_sha256,
  exchange_publication_literal:pin.exchange_publication_literal,publication_entry:pin.publication_entry,publication_binding:pin.publication_binding,original_bytes_verified_at:ledgerTime(verifiedAt),
  r2_bucket:BANK_TWELVE_POLICY.storageBucket,r2_object_key:BANK_TWELVE_POLICY.storageKeyPrefix+pin.original_sha256+".pdf",
  r2_verified_sha256:pin.original_sha256,source_scope:pin.consolidation_scope,scope_binding:pin.scope_binding,
  factual_review_status:"SOURCE_FACT_QUALIFIED",source_text_attestation:"VERIFIED_FROM_ORIGINAL_PDF_BYTES",facts:pin.facts}
 const source:ReviewedSourceRecord={id:pin.source_id,source_code:"COMPANY_EXCHANGE_FILING",record_kind:"V1_4_BANK_DELEGATED_PRIMARY_FACTS",
  retrieved_at:ledgerTime(verifiedAt),published_at:ledgerTime(pin.published_at),payload_hash:await bankValueHash(raw),raw_payload:raw}
 const reviews:RequirementReview[]=[]
 for(const f of pin.facts){
  const r={portfolio_id:policy.portfolioId,security_id:pin.security_id,requirement_code:f.requirement_code,review_kind:"DELEGATED_NUMERIC_REVIEW",
   decision:"ACCEPTED",source_record_id:source.id,research_document_id:null,provider_document_id:null,source_payload_hash:source.payload_hash,
   supporting_quote:f.quote,period_start:null,period_end:pin.reporting_period_end,period_type:"QUARTER",unit:"PERCENT",currency:null,
   consolidation_scope:pin.consolidation_scope,published_at:ledgerTime(pin.published_at),retrieved_at:ledgerTime(verifiedAt),
   fresh_through:ledgerTime(new Date(bankReportingDeadline(pin.reporting_period_end,120)).toISOString()),review_version:"V1_4_REQUIREMENT_REVIEW_V2",reviewed_by:null,reviewed_at:ledgerTime(verifiedAt),supersedes_review_id:null,
   metadata:{metric_code:f.requirement_code,numeric_value:f.value,source_page:f.page_one_based,
    review_authorization:{policy_id:policy.id,authorizing_owner_id:policy.ownerId,executor:policy.executor,authorization:policy.authorization,recorded_at:policy.recordedAt},
    current_owner_directive_sha256:BANK_TWELVE_POLICY.directiveSha256,
    source_binding:{kind:"TABLE_CELL",fragment:f.quote,metric_label:f.metric_label,period_label:f.period_anchor,exact_value:f.value,
     period_start:null,period_end:pin.reporting_period_end,period_type:"QUARTER",period_start_anchor:null,period_end_anchor:f.period_anchor,scale:"1",conversion:"IDENTITY"}}}
  reviews.push({id:f.review_id,...r,review_hash:await bankValueHash(r)})
 }
 return {source,reviews}
}

export const BANK_TWELVE_GROWTH_ACTION="ADMIT_PINNED_TWELVE_BANK_GROWTH_V1"
export function twelveGrowthClaimsQualified(p:Readonly<Record<string,unknown>>):boolean{
 if(p.workflow_ref!=="drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-twelve-growth.yml@refs/heads/codex/banking-twelve-evidence")return false
 return twelveCapitalClaimsQualified({...p,workflow_ref:"drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-twelve-capital.yml@refs/heads/codex/banking-twelve-evidence"})
}
export function twelveGrowthReadUrl(symbol:string,value:string):boolean{
 const pin=manifest.sources.find(s=>s.symbol===symbol);if(!pin)return false
 try{const u=new URL(value);return u.protocol==="https:"&&u.hostname==="ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com"
  &&!u.username&&!u.password&&!u.port&&!u.hash&&decodeURIComponent(u.pathname)===`/${BANK_TWELVE_POLICY.storageBucket}/${BANK_TWELVE_POLICY.storageKeyPrefix}${pin.original_sha256}.pdf`
  &&u.searchParams.get("X-Amz-Algorithm")==="AWS4-HMAC-SHA256"&&Number(u.searchParams.get("X-Amz-Expires"))>0&&Number(u.searchParams.get("X-Amz-Expires"))<=300
 }catch{return false}
}
