import remainingPolicy from './v14-g03-remaining-authorization.json' with {type:'json'}
import policy from './v14-g03-pilot-authorization.json' with {type:'json'}
export function g03MaterializationGrantQualified(body:Record<string,unknown>){
 return body.action==='ISSUE_G03_CANONICAL_ONLY_GRANT'&&body.authorizationHash===policy.directiveSha256&&body.securityIds===undefined&&body.securityId===undefined&&body.portfolioId===undefined&&body.providerCalls===undefined&&body.grantId===undefined&&body.targetingMode===undefined
}

/** Exact per-stock continuation; the original BEL-only grant contract is unchanged. */
export function g03RemainingMaterializationScope(body:Record<string,unknown>){
 const allowed=['action','authorizationHash','securityId']
 if(Object.keys(body).some(k=>!allowed.includes(k))||body.action!=='ISSUE_G03_REMAINING_CANONICAL_ONLY_GRANT'||body.authorizationHash!==remainingPolicy.directiveSha256||typeof body.securityId!=='string'||!remainingPolicy.securityIds.includes(body.securityId))return null
 return 'SECURITY_IDS:'+body.securityId
}
