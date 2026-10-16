import {describe,it,expect,beforeEach,afterEach,vi} from 'vitest'
import {admitRemainingG03Document} from './v14-g03-remaining-document-admission-runtime'
import {G03_REMAINING_SOURCE_SCOPE as scope,prepareG02Source,g02StableId} from './v14-g02-source-import'
import {G03_REMAINING_DOCUMENT_BATCH as batch} from './v14-g03-document-review'
import {issueRemainingG03Grant} from './v14-g03-remaining-grant-runtime'
type Row=Record<string,unknown>
beforeEach(()=>vi.useFakeTimers({now:new Date('2026-10-16T04:00:00Z')}))
afterEach(()=>vi.useRealTimers())
async function fixture(b= batch[0]){
 const original=await prepareG02Source(b.originalHash,'2026-10-16T03:50:00Z',scope),documentId=await g02StableId({kind:'G03_DOCUMENT',security:b.securityId,hash:b.originalHash}),linkId=await g02StableId({kind:'G03_DOCUMENT_SOURCE',documentId,sourceId:original.id})
 const rows:Record<string,Row[]>={portfolios:[{id:scope.policy.portfolioId,user_id:scope.policy.ownerId}],data_source_records:[original],research_documents:[{id:documentId,security_id:b.securityId,canonical_content_hash:b.originalHash,identity_status:'VERIFIED'}],research_document_sources:[{id:linkId,source_record_id:original.id,research_document_id:documentId,content_hash:b.originalHash,source_status:'VERIFIED'}],research_evidence_requirement_reviews:[]}
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
 const db={from:(table:string)=>new Query(table),rpc:async(name:string,p:Record<string,string>)=>{
  if(name==='acquire_data_ingestion_lease_v1'){const acquired=!held.has(p.p_operation);if(acquired)held.add(p.p_operation);return {error:null,data:[{acquired}]}}
  if(name!=='release_data_ingestion_lease_v1')throw Error('OUT_OF_SCOPE_RPC')
  held.delete(p.p_operation);return {error:null,data:[]}
 }} as unknown as Parameters<typeof admitRemainingG03Document>[0]
 const body={action:'ADMIT_FIXED_G03_REMAINING_DOCUMENT',authorizationHash:scope.policy.directiveSha256,securityId:b.securityId,requirementCode:b.requirementCode,originalHash:b.originalHash,normalizedFragment:b.fragment,extractionMethod:'POPPLER_LAYOUT_WHITESPACE_NORMALIZED_ORIGINAL_BYTES'}
 return {db,rows,body,writes:()=>writes}
}
describe('isolated remaining-G03 admission enforces exact originals, owner isolation and atomic replay',()=>{
 it('issues one zero-provider grant per stock/run and refuses expired reissuance',async()=>{
  const f=await fixture(),body={action:'ISSUE_G03_REMAINING_CANONICAL_ONLY_GRANT',authorizationHash:scope.policy.directiveSha256,securityId:batch[0].securityId},claims={run_id:'1',run_attempt:'1',sha:'test',workflow_ref:'canonical'}
  const first=await issueRemainingG03Grant(f.db,'test-only-key',body,claims),repeat=await issueRemainingG03Grant(f.db,'test-only-key',body,claims)
  expect(first).toMatchObject({status:200,data:{scope:'SECURITY_IDS:'+body.securityId,providerCalls:0,reused:false}})
  expect(repeat).toMatchObject({status:200,data:{grantId:first.data.grantId,reused:true}});expect(f.writes()).toBe(1)
  vi.setSystemTime(new Date('2026-10-16T04:06:00Z'))
  expect(await issueRemainingG03Grant(f.db,'test-only-key',body,claims)).toMatchObject({status:409,code:'G03_REMAINING_GRANT_EXPIRED_NO_REISSUANCE'});expect(f.writes()).toBe(1)
 })
 it('rejects foreign grant owners and serializes simultaneous issuance',async()=>{
  const f=await fixture(),body={action:'ISSUE_G03_REMAINING_CANONICAL_ONLY_GRANT',authorizationHash:scope.policy.directiveSha256,securityId:batch[0].securityId}
  f.rows.portfolios[0].user_id='foreign'
  expect(await issueRemainingG03Grant(f.db,'test-only-key',body,{})).toMatchObject({status:403});expect(f.writes()).toBe(0)
  f.rows.portfolios[0].user_id=scope.policy.ownerId
  const values=await Promise.all([issueRemainingG03Grant(f.db,'test-only-key',body,{}),issueRemainingG03Grant(f.db,'test-only-key',body,{})])
  expect(values.map(x=>x.status).sort()).toEqual([200,409]);expect(f.writes()).toBe(1)
 })
 it.each(batch)('admits exactly the reviewed source-bound finding and reuses it: $symbol $requirementCode',async b=>{
  const f=await fixture(b),first=await admitRemainingG03Document(f.db,f.body,{sha:'test',run_id:'1'}),again=await admitRemainingG03Document(f.db,f.body,{sha:'test',run_id:'1'})
  expect(first).toMatchObject({securityId:b.securityId,reused:false,providerApiCalls:0,canonicalMaterialization:false})
  expect(again).toMatchObject({reviewId:first.reviewId,sourceId:first.sourceId,reused:true});expect(f.writes()).toBe(2)
  expect(f.rows.research_evidence_requirement_reviews[0]).toMatchObject({reviewed_by:null,decision:'SUPPORTS',security_id:b.securityId,published_at:null,metadata:{does_not_prove:b.doesNotProve}})
 })
 it('blocks a concurrent duplicate and permits an idempotent retry after lease release',async()=>{
  const f=await fixture(),r=await Promise.allSettled([admitRemainingG03Document(f.db,f.body,{}),admitRemainingG03Document(f.db,f.body,{})])
  expect(r.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(r.filter(x=>x.status==='rejected')).toHaveLength(1)
  expect(f.writes()).toBe(2);expect(await admitRemainingG03Document(f.db,f.body,{})).toMatchObject({reused:true})
 })
 it('does not write for wrong owners, altered sources, wrong document identity or mismatched links',async()=>{
  for(const change of ['owner','hash','document','link']){
   const f=await fixture()
   if(change==='owner')f.rows.portfolios[0].user_id='foreign'
   if(change==='hash')f.rows.data_source_records[0].payload_hash='0'.repeat(64)
   if(change==='document')f.rows.research_documents[0].security_id='foreign'
   if(change==='link')f.rows.research_document_sources[0].source_record_id='foreign'
   await expect(admitRemainingG03Document(f.db,f.body,{})).rejects.toThrow('OWNER_AND_ORIGINAL_NOT_VERIFIED');expect(f.writes()).toBe(0)
  }
 })
 it('rejects arbitrary fragments, numeric reviews and caller-supplied owner identities or portfolios',async()=>{
  for(const change of [{normalizedFragment:'invented'},{requirementCode:'ROCE_OR_ROIC'},{reviewed_by:scope.policy.ownerId},{portfolioId:scope.policy.portfolioId},{securityId:'fdec39e9-08a7-418d-ae96-9d8ce834d26c'}]){
   const f=await fixture();await expect(admitRemainingG03Document(f.db,{...f.body,...change},{})).rejects.toThrow('EXACT_G03_REMAINING_DOCUMENT_REQUIRED');expect(f.writes()).toBe(0)
  }
 })
})
