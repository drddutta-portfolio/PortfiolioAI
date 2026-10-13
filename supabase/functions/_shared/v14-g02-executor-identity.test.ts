import {describe,it,expect} from 'vitest'
import {g02SourceExecutorQualified,g02ValidationExecutorQualified,g02DocumentExecutorQualified} from './v14-g02-executor-identity'
const prefix='drddutta-portfolio/PortfiolioAI/.github/workflows/'
const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'push',workflow_ref:prefix+'g02-canonical-validation.yml@refs/heads/codex/g02-industry-evidence'}
describe('signed executor privileges stay separated',()=>{
 it('validation workflow cannot register originals',()=>{expect(g02ValidationExecutorQualified(claims)).toBe(true);expect(g02SourceExecutorQualified(claims)).toBe(false)})
 it('document workflow cannot acquire source-registration or canonical capabilities',()=>{const documentClaims={...claims,workflow_ref:prefix+'g02-document-qualification.yml@refs/heads/codex/g02-industry-evidence'};expect(g02DocumentExecutorQualified(documentClaims)).toBe(true);expect(g02SourceExecutorQualified(documentClaims)).toBe(false);expect(g02ValidationExecutorQualified(documentClaims)).toBe(false)})
 it('rejects forks, other branches, unprotected environments and pull requests',()=>{
  for(const change of [{repository_id:'other'},{ref:'refs/heads/main'},{environment:'Production'},{event_name:'pull_request'},{sub:'repo:other:environment:PortfolioAI-Development'},{workflow_ref:prefix+'unrelated.yml@refs/heads/codex/g02-industry-evidence'}])expect(g02ValidationExecutorQualified({...claims,...change})).toBe(false)
 })
})
