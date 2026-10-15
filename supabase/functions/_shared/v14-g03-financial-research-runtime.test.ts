import {describe,it,expect,vi} from 'vitest'
import {acquireG03BelFinancialResearch,g03BelResearchScope,G03_BEL_RESEARCH_KIND} from './v14-g03-financial-research-runtime.ts'
import {g03FinancialResearchExecutorQualified} from './v14-g03-executor-identity.ts'
import p from './v14-g03-financial-authorization.json'
import {hashG02} from './v14-g02-source-import.ts'
type Row=Record<string,unknown>
const body={action:'ACQUIRE_G03_BEL_FINANCIAL_RESEARCH',authorizationHash:p.contractSha256,portfolioId:p.portfolioId,securityId:p.securityId,batchDate:'2026-10-15',researchKind:'MARGIN'}
function setup(){
 const rows:Record<string,Row[]>={portfolios:[{id:p.portfolioId,user_id:p.ownerId}],data_sources:[{code:'TRENDLYNE_MCP',is_active:true,entitlement_verified:true,retention_rights_verified:true}],provider_ingestion_controls:[{source_code:'TRENDLYNE_MCP',ingestion_enabled:true,policy_version:6}],security_identity_observations:[{security_id:p.securityId,source_code:'TRENDLYNE_MCP',evidence_status:'MATCHED',provider_instrument_id:'175'}],current_holdings:[{portfolio_id:p.portfolioId,security_id:p.securityId,current_quantity:1}],data_ingestion_runs:[],data_ingestion_run_items:[],data_source_records:[]}
 const failures=new Set<string>(),calls:Array<{name:string;args:Row}>=[];let locked=false
 class Query{
  filters:Array<(r:Row)=>boolean>=[];write:Row|null=null;mode='read'
  constructor(readonly table:string){}
  select(){return this}order(){return this}limit(){return this}
  eq(k:string,v:unknown){this.filters.push(r=>(k.includes('->>')?(r[k.split('->>')[0]] as Row)?.[k.split('->>')[1]]:r[k])===v);return this}
  gt(k:string,v:number){this.filters.push(r=>Number(r[k])>v);return this}
  insert(row:Row){this.write=row;this.mode='insert';return this}update(row:Row){this.write=row;this.mode='update';return this}
  result(){if(failures.has(this.table))return {data:null,error:{code:'FAILED'}}
   if(this.mode==='insert'){const row={id:crypto.randomUUID(),...this.write};rows[this.table].push(row);return {data:row,error:null}}
   const selected=rows[this.table].filter(r=>this.filters.every(f=>f(r)));if(this.mode==='update')for(const row of selected)Object.assign(row,this.write)
   return {data:selected[0]??null,error:null}
  }
  then(resolve:(v:unknown)=>unknown){return Promise.resolve(this.result()).then(resolve)}async single(){return this.result()}async maybeSingle(){return this.result()}
 }
 const rpc=async(name:string,args:Row)=>{calls.push({name,args});if(args.p_operation&&!/^[A-Z0-9_]+$/.test(String(args.p_operation)))return {data:null,error:{code:'23514'}};if(failures.has(name))return {data:null,error:{code:'FAILED'}}
  if(name==='acquire_data_ingestion_lease_v1'){if(locked)return {data:[{acquired:false}],error:null};locked=true;return {data:[{acquired:true}],error:null}}
  if(name==='release_data_ingestion_lease_v1')locked=false
  if(name==='reserve_provider_budget_v1')return {data:[{reserved:true,reservation_id:'reservation'}],error:null}
  return {data:true,error:null}
 }
 const client={getParameterValuesMultiStock:vi.fn(async()=>'{"company":"BEL","values":[]}'),getDocumentSearchResults:vi.fn(async()=>'{"documents":[]}'),call:vi.fn(async()=>'{"parameters":[]}')}
 return {rows,calls,failures,client,db:{from:(t:string)=>new Query(t),rpc} as unknown as Parameters<typeof acquireG03BelFinancialResearch>[0]}
}
describe('BEL approved-scope research never admits provider claims automatically',()=>{
 it('captures exactly one immutable response, settles one unit, and reuses the attempt without another call',async()=>{
  const f=setup(),first=await acquireG03BelFinancialResearch(f.db,body,{sha:'commit'},f.client),repeat=await acquireG03BelFinancialResearch(f.db,body,{},f.client)
  expect(first).toMatchObject({code:'G03_RESEARCH_CAPTURED_NOT_ADMITTED',providerApiCalls:1,acceptedReviews:0,financialObservationWrites:0,canonicalMaterialization:false,retryAttempts:0})
  expect(repeat).toMatchObject({code:'G03_RESEARCH_ALREADY_ATTEMPTED_NO_RETRY',priorRunId:first.runId,providerApiCalls:0,reused:true});expect(f.client.getParameterValuesMultiStock).toHaveBeenCalledTimes(1)
  expect(f.rows.data_source_records[0]).toMatchObject({record_kind:G03_BEL_RESEARCH_KIND,published_at:null,raw_payload:{security_id:p.securityId,canonical_promotion:false}})
  expect(f.calls.find(c=>c.name==='settle_provider_budget_v1')?.args).toMatchObject({p_consumed_units:1,p_failed_units:0,p_released_units:0})
  expect(f.rows.data_ingestion_runs[0]).toMatchObject({status:'SUCCEEDED',accepted_count:0,attempted_call_count:1})
  expect(f.rows.data_ingestion_runs[0].operation).toMatch(/^[A-Z0-9_]+$/)
 })
 it('serializes concurrent requests and does not spend when the lease or provider budget is unavailable',async()=>{
  const f=setup(),out=await Promise.allSettled([acquireG03BelFinancialResearch(f.db,body,{},f.client),acquireG03BelFinancialResearch(f.db,body,{},f.client)])
  expect(out.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(f.client.getParameterValuesMultiStock).toHaveBeenCalledTimes(1)
  const blocked=setup();blocked.failures.add('reserve_provider_budget_v1')
  await expect(acquireG03BelFinancialResearch(blocked.db,body,{},blocked.client)).rejects.toThrow('BUDGET_NOT_GRANTED')
  expect(blocked.client.getParameterValuesMultiStock).not.toHaveBeenCalled();expect(blocked.rows.data_ingestion_runs[0].status).toBe('FAILED')
 })
 it('records a failed provider attempt, settles it, releases the lease and never automatically retries',async()=>{
  const f=setup();f.client.getParameterValuesMultiStock.mockRejectedValue(Error('transport'))
  await expect(acquireG03BelFinancialResearch(f.db,body,{},f.client)).rejects.toThrow('PROVIDER_REQUEST_FAILED')
  expect(f.calls.find(c=>c.name==='record_provider_usage_event_v1')?.args).toMatchObject({p_outcome:'FAILED',p_retry_attempt:0})
  expect(f.calls.find(c=>c.name==='settle_provider_budget_v1')?.args).toMatchObject({p_consumed_units:0,p_failed_units:1,p_released_units:0})
  expect(await acquireG03BelFinancialResearch(f.db,body,{},f.client)).toMatchObject({providerApiCalls:0,reused:true});expect(f.client.getParameterValuesMultiStock).toHaveBeenCalledTimes(1)
 })
 it('rejects wrong owner, identity, entitlement, retention or scope before any provider request',async()=>{
  for(const change of [{securityId:'foreign'},{portfolioId:'foreign'},{authorizationHash:'foreign'},{researchKind:'arbitrary'},{batchDate:'2026-10-16'}])expect(()=>g03BelResearchScope({...body,...change})).toThrow('EXACT_SCOPE')
  for(const [table,key,value] of [['portfolios','user_id','foreign'],['security_identity_observations','provider_instrument_id','176'],['data_sources','retention_rights_verified',false],['provider_ingestion_controls','ingestion_enabled',false]] as const){
   const f=setup();f.rows[table][0][key]=value;await expect(acquireG03BelFinancialResearch(f.db,body,{},f.client)).rejects.toThrow('NOT_VERIFIED');expect(f.client.getParameterValuesMultiStock).not.toHaveBeenCalled();expect(f.rows.data_ingestion_runs).toHaveLength(0)
  }
 })
 it('reports capture or accounting failure without refunding an actually executed successful provider tool',async()=>{
  const f=setup();f.failures.add('data_source_records');await expect(acquireG03BelFinancialResearch(f.db,body,{},f.client)).rejects.toThrow('CAPTURE_PERSISTENCE_FAILED')
  expect(f.calls.find(c=>c.name==='settle_provider_budget_v1')?.args).toMatchObject({p_consumed_units:1,p_released_units:0});expect(f.rows.data_ingestion_runs[0]).toMatchObject({status:'FAILED',fetched_count:0})
 })
 it('runs the separate exact document query and restricts its protected executor identity',async()=>{
  const f=setup();await acquireG03BelFinancialResearch(f.db,{...body,researchKind:'DEBT_VALUATION_DOCUMENTS'}, {},f.client);expect(f.client.getDocumentSearchResults).toHaveBeenCalledTimes(1);expect(f.client.getParameterValuesMultiStock).not.toHaveBeenCalled()
  const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'workflow_dispatch',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g03-bel-financial-research.yml@refs/heads/codex/g02-industry-evidence'}
  expect(g03FinancialResearchExecutorQualified(claims)).toBe(true)
  for(const change of [{event_name:'push'},{ref:'refs/heads/main'},{environment:'Production'},{workflow_ref:claims.workflow_ref.replace('financial-research','cash-components')}])expect(g03FinancialResearchExecutorQualified({...claims,...change})).toBe(false)
 })
 it('uses the observed exact parameter-search tool without changing either earlier capture or admitting facts',async()=>{
  const f=setup(),r=await acquireG03BelFinancialResearch(f.db,{...body,researchKind:'PARAMETER_CATALOG'}, {},f.client)
  expect(f.client.call).toHaveBeenCalledWith('search_financial_parameters',{query:expect.any(String)});expect(f.client.getParameterValuesMultiStock).not.toHaveBeenCalled();expect(r).toMatchObject({providerApiCalls:1,acceptedReviews:0,canonicalMaterialization:false})
  expect(f.calls.find(c=>c.name==='record_provider_usage_event_v1')?.args.p_operation_class).toBe('SEARCH_FINANCIAL_PARAMETERS')
 })
 it('fetches only BEL and observed quarter tokens, refusing arbitrary fields and tampered or foreign catalogs before spending',async()=>{
  const f=setup(),raw={security_id:p.securityId,research_kind:'PROFIT_PARAMETER_CATALOG',result:JSON.stringify({status:'success',data:[{parameter:'opq',helping_text:'Operating Profit Qtr'},{parameter:'opqm1',helping_text:'Operating Profit 1Q Ago'}]})}
  const source={id:'catalog',source_code:'TRENDLYNE_MCP',record_kind:G03_BEL_RESEARCH_KIND,raw_payload:raw,payload_hash:await hashG02(raw)};f.rows.data_source_records.push(source)
  const exact={...body,researchKind:'EXACT_PROFIT_HISTORY',parameters:['opq','opqm1'],catalogSourceIds:['catalog']}
  expect(await acquireG03BelFinancialResearch(f.db,exact,{},f.client)).toMatchObject({providerApiCalls:1,acceptedReviews:0})
  expect(f.client.call).toHaveBeenCalledWith('get_stock_parameter_values',{stock_codes:['BEL'],parameters:['opq','opqm1']});expect(f.client.getParameterValuesMultiStock).not.toHaveBeenCalled()
  for(const changed of [{parameters:['pettm']},{parameters:['opq','opq']},{catalogSourceIds:['foreign']},{parameters:Array(11).fill('opq')}])await expect(acquireG03BelFinancialResearch(f.db,{...exact,...changed},{},f.client)).rejects.toThrow('G03_RESEARCH_')
  source.raw_payload={...raw,security_id:'foreign'};await expect(acquireG03BelFinancialResearch(f.db,exact,{},f.client)).rejects.toThrow('CATALOG_NOT_PROVEN');expect(f.client.call).toHaveBeenCalledTimes(1)
 })
})
