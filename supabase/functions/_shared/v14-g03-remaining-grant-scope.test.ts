import {describe,it,expect} from 'vitest'
import {g03RemainingMaterializationScope,g03MaterializationGrantQualified} from './v14-g03-materialization-scope'
import policy from './v14-g03-remaining-authorization.json'
import bel from './v14-g03-pilot-authorization.json'
describe('remaining G03 grants keep one explicit security and no provider/BEL scope',()=>{
 it.each(policy.securityIds)('allows one of the six exact targets: %s',securityId=>{
  const b={action:'ISSUE_G03_REMAINING_CANONICAL_ONLY_GRANT',authorizationHash:policy.directiveSha256,securityId}
  expect(g03RemainingMaterializationScope(b)).toBe('SECURITY_IDS:'+securityId)
  for(const extra of [{securityIds:[securityId]},{portfolioId:policy.portfolioId},{providerCalls:1},{grantId:'other'},{targetingMode:'ALL_HELD'}])expect(g03RemainingMaterializationScope({...b,...extra})).toBeNull()
  expect(g03MaterializationGrantQualified(b)).toBe(false)
 })
 it('rejects BEL, foreign holdings and the previous authority, while preserving the BEL grant',()=>{
  const b={action:'ISSUE_G03_REMAINING_CANONICAL_ONLY_GRANT',authorizationHash:policy.directiveSha256,securityId:policy.securityIds[0]}
  for(const change of [{securityId:bel.securityIds[0]},{securityId:'foreign'},{authorizationHash:bel.directiveSha256},{action:'ISSUE_G03_CANONICAL_ONLY_GRANT'},{securityId:undefined}])expect(g03RemainingMaterializationScope({...b,...change})).toBeNull()
  expect(g03MaterializationGrantQualified({action:'ISSUE_G03_CANONICAL_ONLY_GRANT',authorizationHash:bel.directiveSha256})).toBe(true)
 })
})
