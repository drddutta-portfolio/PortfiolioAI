import manifest from "./v14-bank-pit-original-manifest.json" with {type:"json"}

export const BANK_PIT_ORIGINAL_MANIFEST=manifest
export const BANK_PIT_ORIGINAL_ACTION="REGISTER_BANK_PIT_PINNED_ORIGINALS_V1"
export const BANK_PIT_ORIGINAL_KIND="V1_4_BANK_PIT_REGISTERED_ORIGINAL"
export function bankPitImportClaimsQualified(p:Record<string,unknown>):boolean{
 return p.repository==="drddutta-portfolio/PortfiolioAI"&&p.repository_id==="1357024254"
  &&p.repository_owner_id==="324877535"&&p.ref==="refs/heads/codex/banking-source-remediation"
  &&p.environment==="PortfolioAI-Development"
  &&p.sub==="repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development"
  &&p.workflow_ref==="drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-pit-source-register.yml@refs/heads/codex/banking-source-remediation"
  &&(p.event_name==="push"||p.event_name==="workflow_dispatch")
  &&typeof p.sha==="string"&&/^[a-f0-9]{40}$/.test(p.sha)
}
export function bankPitOriginalReadUrl(raw:string,key:string):boolean{
 try{
  const u=new URL(raw)
  return u.protocol==="https:"&&u.hostname==="ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com"
   &&!u.username&&!u.password&&!u.port&&!u.hash
   &&decodeURIComponent(u.pathname)===`/portfolioai-history-dev/${key}`
   &&manifest.some(p=>p.r2_object_key===key)
   &&u.searchParams.get("X-Amz-Algorithm")==="AWS4-HMAC-SHA256"
   &&Number(u.searchParams.get("X-Amz-Expires"))>0&&Number(u.searchParams.get("X-Amz-Expires"))<=300
 }catch{return false}
}
