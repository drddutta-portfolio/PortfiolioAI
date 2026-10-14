import policy from './v14-g03-owner-authorization.json' with {type:'json'}
import {g02ExecutorIdentityQualified} from './v14-g02-executor-identity.ts'
export function g03ValidationRequestQualified(body:Record<string,unknown>){
 const ids=body.securityIds
 return body.action==='P7_IC3_VALIDATE_CANONICAL_INPUTS'&&body.portfolioId===policy.portfolioId&&body.ownerExecutionAuthorization===policy.directiveSha256&&Array.isArray(ids)&&ids.length>0&&ids.length<=policy.securityIds.length&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&policy.securityIds.includes(id))&&body.grantId===undefined&&body.targetingMode===undefined
}
export function g03ValidationExecutorQualified(claims:Record<string,unknown>){
 return g02ExecutorIdentityQualified(claims)&&claims.workflow_ref==='drddutta-portfolio/PortfiolioAI/.github/workflows/g03-canonical-validation.yml@refs/heads/codex/g02-industry-evidence'
}
