import assert from 'node:assert/strict'
import {buildProfileEvidencePlan,planEvidenceRequirement,V14_DOCUMENT_IDENTITY_MINIMA} from '../supabase/functions/_shared/p7-ic-evidence-normalization.ts'
for(const [code,count] of Object.entries(V14_DOCUMENT_IDENTITY_MINIMA)){
 const p=planEvidenceRequirement(code,252)
 assert.equal(p.deterministicCoverageRule,'TEXT_EVIDENCE_REVIEW',code)
 assert.equal(p.minimumPeriods,count,code)
 assert.equal(p.signalLookbackPeriods,252)
 assert.equal(p.minimumUnit,'DOCUMENT_IDENTITIES')
}
const p=buildProfileEvidencePlan({profileCode:'PHARMA',signalRequirements:[]})
assert.equal(p.requirements.find(x=>x.evidenceCode==='PRICE_HISTORY_252D').minimumPeriods,252)
assert.equal(p.requirements.find(x=>x.evidenceCode==='APPROVED_BENCHMARK_HISTORY_252D').minimumPeriods,252)
assert.equal(p.requirements.find(x=>x.evidenceCode==='REGULATORY_RISK').minimumPeriods,1)
assert.equal(p.requirements.find(x=>x.evidenceCode==='ROCE_OR_ROIC').minimumPeriods,3)
assert.equal(p.requirements.find(x=>x.evidenceCode==='OPERATING_MARGIN_HISTORY').minimumPeriods,8)
assert.equal(planEvidenceRequirement('GOVERNANCE_EVENT_REVIEW',4).minimumPeriods,4)
assert.equal(planEvidenceRequirement('UNRECOGNIZED_DOCUMENT_REVIEW',252).minimumPeriods,252)
console.log('Typed document minima: explicit risk map, retained lookback and unchanged market/numeric/unknown contracts PASS')
