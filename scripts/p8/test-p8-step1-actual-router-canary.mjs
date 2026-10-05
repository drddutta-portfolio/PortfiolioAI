import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildAudit, classificationFor } from './p8-step1-actual-router-canary.mjs'
import { routeHistoricalResearchProfileV1 } from '../../src/features/research/researchProfileRouting.ts'
const mapping=JSON.parse(readFileSync('docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_OD2_OWNER_ADOPTION_2026-10-04.json')).approved_entry
const row={v3_conditional_period_fix:true,v3_comparable_segment_revenue:true,v3_dominant_business:{ratio:'0.500000000000000001',description:mapping.source_description},blockers:[]}
test('strict majority uses exact decimals and rejects invalid ratios',()=>{
 assert.equal(classificationFor(row,mapping),'IN070205015')
 for(const ratio of ['0.5','0.499999999999999999','1.01','NaN']) assert.equal(classificationFor({...row,v3_dominant_business:{...row.v3_dominant_business,ratio}},mapping),null)
})
test('accounting evidence and reviewed description cannot be bypassed',()=>{
 for(const field of ['v3_conditional_period_fix','v3_comparable_segment_revenue']) assert.equal(classificationFor({...row,[field]:false},mapping),null)
 assert.equal(classificationFor({...row,blockers:['NONZERO_INTERSEGMENT_WITHOUT_SEGMENT_EXTERNAL_REVENUE']},mapping),null)
 assert.equal(classificationFor({...row,v3_dominant_business:{ratio:'0.9',description:'Steel'}},mapping),null)
})
test('all frozen cases route deterministically without negative-control promotion',()=>{
 const a=buildAudit(), b=buildAudit()
 assert.deepEqual(a,b)
 assert.equal(a.counts.canary_pairs,32)
 assert.equal(a.counts.authoritative_complete_classifications,2)
 assert.equal(a.counts.actual_canonical_router_routes,1)
 assert.equal(a.counts.negative_control_promotions,0)
 assert.equal(a.gate_pass,true)
})
test('actual router rejects future evidence and incomplete classification',()=>{
 const routed=buildAudit().results.find(r=>r.actual_router_result.state==='ROUTED')
 for(const input of [{...routed.route_input,sourceDisseminatedAt:'2099-01-01T00:00:00Z'},{...routed.route_input,classificationState:'BLOCKED'}]) assert.notEqual(routeHistoricalResearchProfileV1(input).state,'ROUTED')
})
test('Edible Oil and all accounting-blocked cases remain unrouted',()=>{
 const a=buildAudit()
 const oil=a.results.find(r=>r.classification?.basicIndustryCode==='IN040101001')
 assert.ok(oil)
 assert.notEqual(oil.actual_router_result.state,'ROUTED')
 for(const r of a.results.filter(r=>r.accounting_blockers.includes('NONZERO_INTERSEGMENT_WITHOUT_SEGMENT_EXTERNAL_REVENUE'))) assert.equal(r.classification,null)
})
