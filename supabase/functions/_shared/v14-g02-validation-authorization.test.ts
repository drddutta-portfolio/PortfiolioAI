import {describe,it,expect} from 'vitest'
import {g02ValidationRequestQualified} from './v14-g02-validation-scope'
import {G02_OWNER_POLICY as policy} from './v14-g02-source-import'
describe('G02 signed validation capability is strictly read only and three-stock scoped',()=>{
 const request={action:'P7_IC3_VALIDATE_CANONICAL_INPUTS',portfolioId:policy.portfolioId,ownerExecutionAuthorization:policy.directiveSha256,securityIds:policy.securityIds}
 it('accepts explicit owner authority only for its frozen G02 population',()=>expect(g02ValidationRequestQualified(request)).toBe(true))
 it('cannot authorize writes, grants, other portfolios, other stocks or duplicate scope',()=>{
  for(const change of [{action:'P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS'},{grantId:'grant'},{portfolioId:'other'},{ownerExecutionAuthorization:'fake'},{securityIds:['be55b3cc-0400-45af-84aa-2a95e2c361c5']},{securityIds:[policy.securityIds[0],policy.securityIds[0]]},{securityIds:[]}])expect(g02ValidationRequestQualified({...request,...change})).toBe(false)
 })
})
