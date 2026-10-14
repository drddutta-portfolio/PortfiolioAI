import {describe,it,expect} from 'vitest'
import {g03MaterializationGrantQualified} from './v14-g03-materialization-scope'
import {g03ValidationExecutorQualified} from './v14-g03-validation-scope'
import policy from './v14-g03-pilot-authorization.json'
describe('G03 pilot grants remain BEL-only and provider-free',()=>{
 it('rejects caller overrides and a different scope/action/authorization',()=>{
  const request={action:'ISSUE_G03_CANONICAL_ONLY_GRANT',authorizationHash:policy.directiveSha256}
  expect(g03MaterializationGrantQualified(request)).toBe(true)
  expect(policy.securityIds).toEqual(['fdec39e9-08a7-418d-ae96-9d8ce834d26c'])
  expect(policy.providerCallsAllowed).toBe(0)
  for(const change of [{action:'ISSUE_G02_CANONICAL_ONLY_GRANT'},{authorizationHash:'foreign'},{securityIds:policy.securityIds},{securityId:'foreign'},{portfolioId:policy.portfolioId},{providerCalls:1},{grantId:'replay'},{targetingMode:'override'}])expect(g03MaterializationGrantQualified({...request,...change})).toBe(false)
 })
 it('binds grant execution to the distinct protected validation workflow',()=>{
  const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'workflow_dispatch',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g03-canonical-validation.yml@refs/heads/codex/g02-industry-evidence'}
  expect(g03ValidationExecutorQualified(claims)).toBe(true)
  for(const change of [{workflow_ref:claims.workflow_ref.replace('g03','g02')},{environment:'Production'},{ref:'refs/heads/main'},{repository_id:'foreign'}])expect(g03ValidationExecutorQualified({...claims,...change})).toBe(false)
 })
})
