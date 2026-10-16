import policy from './v14-g03-remaining-authorization.json' with {type:'json'}
import {g02ExecutorIdentityQualified} from './v14-g02-executor-identity.ts'
export function g03RemainingExecutorQualified(c:Record<string,unknown>){return g02ExecutorIdentityQualified(c)&&c.event_name==='workflow_dispatch'&&c.workflow_ref==='drddutta-portfolio/PortfiolioAI/.github/workflows/g03-remaining-document-qualification.yml@refs/heads/codex/g02-industry-evidence'}
export function g03RemainingGrantExecutorQualified(c:Record<string,unknown>){return g02ExecutorIdentityQualified(c)&&c.event_name==='workflow_dispatch'&&c.workflow_ref==='drddutta-portfolio/PortfiolioAI/.github/workflows/g03-canonical-validation.yml@refs/heads/codex/g02-industry-evidence'}
export function g03RemainingMaterializationScope(body:Record<string,unknown>){
 const allowed=['action','authorizationHash','securityId']
 if(Object.keys(body).some(k=>!allowed.includes(k))||body.action!=='ISSUE_G03_REMAINING_CANONICAL_ONLY_GRANT'||body.authorizationHash!==policy.directiveSha256||typeof body.securityId!=='string'||!policy.securityIds.includes(body.securityId))return null
 return 'SECURITY_IDS:'+body.securityId
}
