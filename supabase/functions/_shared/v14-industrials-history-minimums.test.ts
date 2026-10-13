import {describe,it,expect} from 'vitest'
import {industrialsMinimumObservations,INDUSTRIALS_FROZEN_SUPPORTING_HISTORY} from './v14-industrials-history-minimums'
import {buildProfileEvidencePlan,guardedNumericEvidenceState} from './p7-ic-evidence-normalization'
import {P7_IC_PROFILE_CONTRACTS} from './p7-ic-profile-contracts'
import {industrialsK4bSignalRules} from '../../../src/features/research/industrialsK4bScoringMethodology'

describe('Frozen Industrials counts remain identical in scoring and evidence admission planning',()=>{
 for(const profile of ['CAPITAL_EQUIPMENT_ELECTRICAL','PROJECT_EPC','DEFENCE_AEROSPACE'] as const){
  it(profile+' cannot admit a single-current-observation shortcut',()=>{
   const contract=P7_IC_PROFILE_CONTRACTS[profile]
   const plan=buildProfileEvidencePlan(contract)
   for(const rule of industrialsK4bSignalRules(profile)){
    expect(industrialsMinimumObservations(profile,rule.signalCode)).toBe(rule.minimumObservations)
    const requirement=plan.requirements.find(r=>r.signalCode===rule.signalCode)
    expect(requirement).toBeDefined()
    expect(requirement!.minimumPeriods).toBeGreaterThanOrEqual(rule.minimumObservations)
   }
   const margin=plan.requirements.find(r=>r.evidenceCode==='OPERATING_MARGIN_HISTORY')!
   expect(margin.minimumPeriods).toBe(8)
   expect(guardedNumericEvidenceState('AVAILABLE',{matchedSections:[{numericValue:21}]},margin.minimumPeriods)).not.toBe('AVAILABLE')
  })
 }
 it('preserves a stricter explicit requirement and supporting component minima',()=>{
  const p=buildProfileEvidencePlan({profileCode:'CAPITAL_EQUIPMENT_ELECTRICAL',signalRequirements:[{signalCode:'ROCE_OR_ROIC',minimumPeriods:5}]})
  expect(p.requirements[0]!.minimumPeriods).toBe(5)
  expect(INDUSTRIALS_FROZEN_SUPPORTING_HISTORY).toMatchObject({annualFundamentalsYears:3,quarterlyGrowthQuarters:8,orderBookPeriods:4,cashConversionYears:3,workingCapitalYears:3})
 })
 it('does not change unrelated methods or invent an unknown signal',()=>{
  expect(industrialsMinimumObservations('BANK','ROCE_OR_ROIC')).toBeNull()
  expect(industrialsMinimumObservations('CAPITAL_EQUIPMENT_ELECTRICAL','UNAPPROVED_SIGNAL')).toBeNull()
  expect(buildProfileEvidencePlan({profileCode:'TEST',signalRequirements:[{signalCode:'ROCE_OR_ROIC'}]}).requirements[0]!.minimumPeriods).toBe(1)
 })
})
