import {describe,it,expect} from 'vitest'
import {g03HistoryExecutorQualified} from './v14-g03-market-scope'
import {g02HistoryExecutorQualified} from './v14-g02-executor-identity'
import g03 from './v14-g03-market-authorization.json'
import g02 from './v14-g02-owner-authorization.json'
const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'workflow_dispatch',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g03-bel-market-history.yml@refs/heads/codex/g02-industry-evidence'}
describe('separately scoped BEL market acquisition',()=>{
 it('accepts only the protected Development dispatch identity',()=>{expect(g03HistoryExecutorQualified(claims)).toBe(true);for(const change of [{event_name:'push'},{repository_id:'other'},{environment:'Production'},{ref:'refs/heads/main'},{workflow_ref:claims.workflow_ref.replace('g03-bel','g02')}])expect(g03HistoryExecutorQualified({...claims,...change})).toBe(false)})
 it('cannot reuse the G02 workflow identity or expand its stock list',()=>{expect(g02HistoryExecutorQualified(claims)).toBe(false);expect(g03.securityIds).toEqual(['fdec39e9-08a7-418d-ae96-9d8ce834d26c']);expect(g03.providerHistoryCallLimit).toBe(1);expect(g03.automaticRetries).toBe(0);expect(g02.securityIds).toHaveLength(3);expect(g02.securityIds).not.toContain(g03.securityIds[0]);expect(g03.directiveSha256).not.toBe(g02.directiveSha256)})
})
