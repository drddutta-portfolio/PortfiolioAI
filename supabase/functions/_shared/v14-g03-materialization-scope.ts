import policy from './v14-g03-pilot-authorization.json' with {type:'json'}
export function g03MaterializationGrantQualified(body:Record<string,unknown>){
 return body.action==='ISSUE_G03_CANONICAL_ONLY_GRANT'&&body.authorizationHash===policy.directiveSha256&&body.securityIds===undefined&&body.securityId===undefined&&body.portfolioId===undefined&&body.providerCalls===undefined&&body.grantId===undefined&&body.targetingMode===undefined
}

export {g03RemainingMaterializationScope} from './v14-g03-remaining-isolated-scope.ts'
