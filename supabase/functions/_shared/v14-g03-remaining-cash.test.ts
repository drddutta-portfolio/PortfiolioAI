import {describe,it,expect,beforeEach,afterEach,vi} from 'vitest'
import {admitRemainingG03Cash} from './v14-g03-remaining-cash-runtime'
import {G03_REMAINING_CASH_SOURCE_SCOPE as scope,REMAINING_CASH_BATCH as batch,REMAINING_CASH_POLICY as p,approvedRemainingG03CashReview,approvedRemainingG03CashSource} from './v14-g03-remaining-cash-contract'
import {prepareG02Source,g02StableId} from './v14-g02-source-import'
import {deriveG03CashConversion,type CashComponents} from './v14-g03-cash-components'
import {validateReviewedRequirementEvidence,reconcileCanonicalAndReviewed,type RequirementReview,type ReviewedSourceRecord,type ReviewedResearchDocument,type ReviewedDocumentSource} from './v14-reviewed-evidence'
import {planEvidenceRequirement} from './p7-ic-evidence-normalization'
type Row=Record<string,unknown>
beforeEach(()=>vi.useFakeTimers({now:new Date('2026-10-16T05:00:00Z')}))
afterEach(()=>vi.useRealTimers())
async function fixture(securityId=p.securityIds[0]){
 const rows:Record<string,Row[]>={portfolios:[{id:p.portfolioId,user_id:p.ownerId}],data_sources:[{code:p.sourceAuthority,is_active:true,entitlement_verified:true,retention_rights_verified:true}],data_source_records:[],research_documents:[],research_document_sources:[],research_evidence_requirement_reviews:[]}
 for(const pin of scope.pins.filter(pin=>pin.security_id===securityId)){
  const original=await prepareG02Source(pin.original_sha256,'2026-10-16T04:55:00Z',scope),documentId=await g02StableId({kind:'G03_DOCUMENT',security:securityId,hash:pin.original_sha256}),linkId=await g02StableId({kind:'G03_DOCUMENT_SOURCE',documentId,sourceId:original.id})
  rows.data_source_records.push(original)
  rows.research_documents.push({id:documentId,security_id:securityId,reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:pin.original_sha256,identity_status:'VERIFIED'})
  rows.research_document_sources.push({id:linkId,source_record_id:original.id,research_document_id:documentId,content_hash:pin.original_sha256,source_status:'VERIFIED',source_code:p.sourceAuthority,provider_document_id:null,source_url:pin.original_url,retrieved_at:'2026-10-16T04:55:00Z'})
 }
 let writes=0;const held=new Set<string>()
 class Query{
  filters:Array<(r:Row)=>boolean>=[]
  constructor(readonly table:string){}
  select(){return this}
  eq(k:string,v:unknown){this.filters.push(r=>r[k]===v);return this}
  matching(){return (rows[this.table]??[]).filter(r=>this.filters.every(f=>f(r)))}
  async single(){const r=this.matching();return {data:r.length===1?r[0]:null,error:r.length===1?null:{code:'SINGLE'}}}
  async maybeSingle(){const r=this.matching();return {data:r[0]??null,error:r.length>1?{code:'MULTIPLE'}:null}}
  async insert(row:Row){if(!['data_source_records','research_evidence_requirement_reviews'].includes(this.table))throw Error('OUT_OF_SCOPE_WRITE');if(rows[this.table].some(r=>r.id===row.id))return {error:{code:'23505'}};rows[this.table].push(row);writes++;return {error:null}}
 }
 const db={from:(table:string)=>new Query(table),rpc:async(name:string,params:Record<string,string>)=>{
  if(!/^[A-Z0-9_]+$/.test(params.p_operation))return {error:{code:'23514'},data:null}
  if(name==='acquire_data_ingestion_lease_v1'){const acquired=!held.has(params.p_operation);if(acquired)held.add(params.p_operation);return {error:null,data:[{acquired}]}}
  if(name!=='release_data_ingestion_lease_v1')throw Error('OUT_OF_SCOPE_RPC')
  held.delete(params.p_operation);return {error:null,data:[]}
 }} as unknown as Parameters<typeof admitRemainingG03Cash>[0]
 const body={action:'ADMIT_FIXED_G03_REMAINING_CASH',authorizationHash:p.directiveSha256,securityId,verifiedCells:batch.cells.filter(c=>c.securityId===securityId)}
 return {db,rows,body,writes:()=>writes,validation:()=>({portfolioId:p.portfolioId,portfolioOwnerId:p.ownerId,securityId,requirementCode:'CFO_FCF_CONVERSION',family:planEvidenceRequirement('CFO_FCF_CONVERSION',3,'DEFENCE_AEROSPACE').deterministicCoverageRule,metricCodes:['CFO_FCF_CONVERSION'],minimum:3,reviews:rows.research_evidence_requirement_reviews as unknown as RequirementReview[],sources:rows.data_source_records as unknown as ReviewedSourceRecord[],documents:rows.research_documents as unknown as ReviewedResearchDocument[],documentSources:rows.research_document_sources as unknown as ReviewedDocumentSource[],definitions:[],evaluationAsOfMs:Date.now(),sourceCutoffAtMs:Date.now(),freshnessPolicy:'SOURCE_APPROPRIATE_150_DAYS_UNLESS_LONG_LIVED'})}
}
describe('remaining G03 fixed-source cash admission and existing canonical AND join',()=>{
 it('retains negative cash conversion and uses the existing Decimal owner',()=>{
  expect(batch.periods.map(b=>deriveG03CashConversion(b.components as CashComponents))).toEqual([
   expect.objectContaining({cfoPat:'-1.658843',fcfCrore:'-234.61'}),expect.objectContaining({cfoPat:'-0.690016',fcfCrore:'-174.31'}),expect.objectContaining({cfoPat:'2.114063',fcfCrore:'293.72'}),
   expect.objectContaining({cfoPat:'0.767131',fcfCrore:'52.18'}),expect.objectContaining({cfoPat:'-0.405212',fcfCrore:'-196.31'}),expect.objectContaining({cfoPat:'0.295353',fcfCrore:'8.09'}),
  ])
 })
 it.each(p.securityIds)('admits exactly three immutable years and validates FRESH without changing BEL or generic CFO: %s',async id=>{
  const f=await fixture(id),first=await admitRemainingG03Cash(f.db,f.body,{sha:'test',run_id:'1'}),repeat=await admitRemainingG03Cash(f.db,f.body,{sha:'test',run_id:'1'})
  expect(first).toMatchObject({providerCalls:0,canonicalMaterialization:false,metricRegistryWrites:0});expect(first.results).toHaveLength(3)
  expect(repeat.results.every(r=>r.reused)).toBe(true);expect(f.writes()).toBe(6)
  const input=f.validation(),r=await validateReviewedRequirementEvidence(input)
  expect(r).toMatchObject({state:'FRESH',reason:'APPROVED_SOURCE_BOUND_CASH_COMPONENT_SERIES_READY',lineage:{financialContractSha256:p.directiveSha256,providerCfoRegistryUnchanged:true,historicalPitAvailabilityNotClaimed:true}})
  expect(r?.observations.map(o=>o.period_end)).toEqual(['2024-03-31','2025-03-31','2026-03-31'])
  expect(r?.observations.every(o=>o.published_at===null&&o.consolidation_scope==='STANDALONE')).toBe(true)
  expect(reconcileCanonicalAndReviewed({canonicalRows:[],reviewed:r,definitions:[],minimum:3,evaluationAsOfMs:Date.now(),sourceCutoffAtMs:Date.now(),family:input.family})).toMatchObject({authority:'REVIEW',validation:{state:'FRESH'}})
  expect(await validateReviewedRequirementEvidence({...input,reviews:input.reviews.slice(1)})).toMatchObject({state:'INSUFFICIENT'})
 })
 it('blocks a concurrent batch and permits idempotent recovery after release',async()=>{
  const f=await fixture(),r=await Promise.allSettled([admitRemainingG03Cash(f.db,f.body,{}),admitRemainingG03Cash(f.db,f.body,{})])
  expect(r.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(r.filter(x=>x.status==='rejected')).toHaveLength(1);expect(f.writes()).toBe(6)
  expect((await admitRemainingG03Cash(f.db,f.body,{})).results.every(r=>r.reused)).toBe(true)
 })
 it('rejects foreign owners, altered originals and incorrect document associations before writes',async()=>{
  for(const issue of ['owner','source','document','link','authority']){
   const f=await fixture()
   if(issue==='owner')f.rows.portfolios[0].user_id='foreign'
   if(issue==='source')f.rows.data_source_records[0].payload_hash='0'.repeat(64)
   if(issue==='document')f.rows.research_documents[0].security_id='foreign'
   if(issue==='link')f.rows.research_document_sources[0].research_document_id='foreign'
   if(issue==='authority')f.rows.data_sources[0].entitlement_verified=false
   await expect(admitRemainingG03Cash(f.db,f.body,{})).rejects.toThrow();expect(f.writes()).toBe(0)
  }
 })
 it('cannot admit caller-provided identities, financial numbers, another metric or BEL',async()=>{
  for(const change of [{securityId:'fdec39e9-08a7-418d-ae96-9d8ce834d26c'},{reviewed_by:p.ownerId},{requirementCode:'ROCE_OR_ROIC'},{verifiedCells:[]},{authorizationHash:'0'.repeat(64)}]){
   const f=await fixture();await expect(admitRemainingG03Cash(f.db,{...f.body,...change},{})).rejects.toThrow('EXACT_G03_REMAINING_CASH_CELLS_REQUIRED');expect(f.writes()).toBe(0)
  }
 })
 it('rejects changed components, false owner attribution and omitted scope proof',async()=>{
  const f=await fixture();await admitRemainingG03Cash(f.db,f.body,{})
  const input=f.validation(),r=input.reviews[0],s=input.sources.find(s=>s.id===r.source_record_id)!
  expect(approvedRemainingG03CashReview(r,p.ownerId,'NUMERIC_SERIES')).toBe(true)
  expect(approvedRemainingG03CashReview({...r,reviewed_by:p.ownerId},p.ownerId,'NUMERIC_SERIES')).toBe(false)
  expect(approvedRemainingG03CashSource(r,{...s,raw_payload:{...s.raw_payload,verified_scope_evidence:[]}})).toBe(false)
  const changed={...r,metadata:{...r.metadata,financial_components:{pat:'1'}}}
  expect(approvedRemainingG03CashReview(changed,p.ownerId,'NUMERIC_SERIES')).toBe(false)
  expect(await validateReviewedRequirementEvidence({...input,documents:input.documents.map(d=>({...d,canonical_content_hash:'0'.repeat(64)}))})).toMatchObject({state:'REVIEW_REQUIRED'})
  expect(await validateReviewedRequirementEvidence({...input,documentSources:input.documentSources.concat(input.documentSources)})).toMatchObject({state:'REVIEW_REQUIRED',reason:'DOCUMENT_SOURCE_ASSOCIATION_NOT_UNIQUE'})
 })
 it('preserves source cutoff, hash and expiry enforcement',async()=>{
  const f=await fixture();await admitRemainingG03Cash(f.db,f.body,{})
  const input=f.validation()
  expect(await validateReviewedRequirementEvidence({...input,reviews:[{...input.reviews[0],review_hash:'0'.repeat(64)},...input.reviews.slice(1)]})).toMatchObject({state:'REVIEW_REQUIRED',reason:'REVIEW_INTEGRITY_HASH_INVALID'})
  expect(await validateReviewedRequirementEvidence({...input,evaluationAsOfMs:Date.parse('2027-04-01T00:00:00Z'),sourceCutoffAtMs:Date.parse('2027-04-01T00:00:00Z')})).toMatchObject({state:'STALE'})
  expect(await validateReviewedRequirementEvidence({...input,evaluationAsOfMs:Date.parse('2026-10-16T04:00:00Z'),sourceCutoffAtMs:Date.parse('2026-10-16T04:00:00Z')})).toMatchObject({state:'REVIEW_REQUIRED',reason:'REVIEW_CREATED_AFTER_SOURCE_CUTOFF'})
 })
})
