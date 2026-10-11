import proof from "./v14-kvb-roa-original-proof.json" with {type:"json"}

export const KVB_ORIGINAL_PROOF=proof
export const KVB_ROA_SECURITY="be55b3cc-0400-45af-84aa-2a95e2c361c5"
export const KVB_ROA_PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
export const KVB_ORIGINAL_KIND="V1_4_KVB_ROA_ORIGINAL_SOURCE_V1"
export const KVB_BINDING_KIND="TABLE_CELL_MULTI_ANCHOR"
type Json=Record<string,unknown>
const obj=(x:unknown):Json|null=>x!==null&&typeof x==="object"&&!Array.isArray(x)?x as Json:null
export function kvbOriginalKey(kind:"issuer"|"regulator"){
 const p=proof[kind]
 return `portfolioai-research/development/v1-4/kvb-roa-original/sha256/${p.sha256}.${kind==="issuer"?"pdf":"html"}`
}
/** Exact, independently extracted anchors from two pinned originals. This is
 * a structured cell/context binding, never a fabricated contiguous quotation. */
export function kvbRoaOriginalQualified(source:Json):boolean{
 const raw=obj(source.raw_payload),r=raw&&obj(raw.roa_regulatory_proof)
 return Boolean(raw&&r&&source.source_code==="COMPANY_EXCHANGE_FILING"&&source.record_kind===KVB_ORIGINAL_KIND
  &&raw.security_id===KVB_ROA_SECURITY&&raw.original_sha256===proof.issuer.sha256
  &&raw.original_url===proof.issuer.originalUrl&&raw.original_bytes===proof.issuer.bytes
  &&raw.r2_verified_sha256===proof.issuer.sha256&&raw.r2_bucket==="portfolioai-history-dev"
  &&raw.r2_object_key===kvbOriginalKey("issuer")&&typeof raw.original_bytes_verified_at==="string"
  &&Number.isFinite(Date.parse(raw.original_bytes_verified_at))&&raw.source_scope==="STANDALONE"
  &&raw.table_fragment===proof.issuer.table&&raw.period_anchor===proof.issuer.periodAnchor
  &&raw.identity_anchor===proof.issuer.identityAnchor&&raw.publication_precision==="UNKNOWN"
  &&raw.first_verified_available_at===proof.issuer.firstVerifiedAt
  &&r.original_sha256===proof.regulator.sha256&&r.official_url===proof.regulator.originalUrl
  &&typeof r.source_record_id==="string"&&r.denominator===proof.regulator.denominator
  &&r.roa===proof.regulator.roa&&r.commencement===proof.regulator.commencement)
}
export function kvbRoaBinding(){
 return {kind:KVB_BINDING_KIND,fragment:proof.issuer.table,metric_label:"Return on Assets",period_label:"2025-26",
  exact_value:"1.93",entity_id:"KARURVYSYA",period_start:"2025-04-01",period_end:"2026-03-31",period_type:"YEAR",
  period_end_anchor:proof.issuer.periodAnchor,period_start_anchor:"2025-26",scale:"1",conversion:"IDENTITY",
  identity_anchor:proof.issuer.identityAnchor,context_version:"KVB_FY26_ORIGINAL_MULTI_ANCHOR_V1"}
}
export function kvbRoaBindingQualified(source:Json,binding:Json):boolean{
 const expected=kvbRoaBinding()
 return kvbRoaOriginalQualified(source)&&Object.entries(expected).every(([k,v])=>binding[k]===v)
}
export function githubImportClaimsQualified(p:Json):boolean{
 return p.repository==="drddutta-portfolio/PortfiolioAI"&&p.repository_id==="1357024254"
  &&p.ref==="refs/heads/codex/banking-source-remediation"&&p.environment==="PortfolioAI-Development"
  &&p.sub==="repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development"
  &&p.workflow_ref==="drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-kvb-source-import.yml@refs/heads/codex/banking-source-remediation"
  &&p.event_name==="push"&&typeof p.sha==="string"&&/^[a-f0-9]{40}$/.test(p.sha)
}
/** The caller cannot turn this into an arbitrary URL fetcher. */
export function approvedOriginalReadUrl(raw:string,kind:"issuer"|"regulator"):boolean{
 try{
  const u=new URL(raw)
  return u.protocol==="https:"&&u.hostname==="ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com"
   &&!u.username&&!u.password&&!u.port&&!u.hash
   &&decodeURIComponent(u.pathname)===`/portfolioai-history-dev/${kvbOriginalKey(kind)}`
   &&u.searchParams.get("X-Amz-Algorithm")==="AWS4-HMAC-SHA256"
   &&Number(u.searchParams.get("X-Amz-Expires"))>0&&Number(u.searchParams.get("X-Amz-Expires"))<=300
 }catch{return false}
}
